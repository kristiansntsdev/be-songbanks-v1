import Song from "../models/Song.js";
import Tag from "../models/Tag.js";
import RedisService from "./RedisService.js";

class SongService {
  static async getAllSongs(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      base_chord,
      tag_ids,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = options;

    // Generate cache key based on all query parameters
    const cacheKey = RedisService.generateCacheKey("songs:all", options);

    // Try to get from cache first
    try {
      const cachedResult = await RedisService.get(cacheKey);
      if (cachedResult) {
        console.log("Cache hit for getAllSongs");
        return cachedResult;
      }
      console.log("Cache miss for getAllSongs");
    } catch (error) {
      console.error("Cache read error, falling back to database:", error);
    }

    const offset = (page - 1) * limit;
    const whereConditions = [];
    const params = [];

    // Build WHERE conditions
    if (search) {
      whereConditions.push(
        "(s.title LIKE ? OR JSON_SEARCH(s.artist, 'one', ?) IS NOT NULL OR s.lyrics_and_chords LIKE ?)"
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (base_chord) {
      whereConditions.push("s.base_chord LIKE ?");
      params.push(`%${base_chord}%`);
    }

    if (tag_ids && tag_ids.length > 0) {
      const placeholders = tag_ids.map(() => "?").join(",");
      whereConditions.push(`s.id IN (
        SELECT DISTINCT st.song_id 
        FROM song_tags st 
        WHERE st.tag_id IN (${placeholders})
      )`);
      params.push(...tag_ids);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countResult = await Song.sequelize.query(
      `SELECT COUNT(DISTINCT s.id) as total FROM songs s ${whereClause}`,
      {
        replacements: params,
        type: Song.sequelize.QueryTypes.SELECT,
      }
    );

    const totalCount = countResult[0].total;

    // Get songs with pagination
    const songs = await Song.sequelize.query(
      `SELECT s.* FROM songs s 
       ${whereClause}
       ORDER BY s.${sortBy} ${sortOrder.toUpperCase()}
       LIMIT ? OFFSET ?`,
      {
        replacements: [...params, parseInt(limit), parseInt(offset)],
        type: Song.sequelize.QueryTypes.SELECT,
      }
    );

    // Get tags for each song
    for (const song of songs) {
      const songTags = await Song.sequelize.query(
        `SELECT t.id, t.name, t.description
         FROM tags t
         JOIN song_tags st ON t.id = st.tag_id
         WHERE st.song_id = ?`,
        {
          replacements: [song.id],
          type: Song.sequelize.QueryTypes.SELECT,
        }
      );
      song.tags = songTags || [];
    }

    const result = {
      songs: songs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    };

    // Cache the result (no TTL since songs change rarely)
    try {
      await RedisService.set(cacheKey, result);
      console.log("Cached getAllSongs result");
    } catch (error) {
      console.error("Cache write error:", error);
    }

    return result;
  }

  static async getSongById(songId) {
    // Get the song first
    const songResults = await Song.sequelize.query(
      "SELECT * FROM songs WHERE id = ?",
      {
        replacements: [songId],
        type: Song.sequelize.QueryTypes.SELECT,
      }
    );

    if (!songResults || songResults.length === 0) {
      const error = new Error("Song not found");
      error.statusCode = 404;
      throw error;
    }

    const song = songResults[0];

    // Get tags separately
    const tagResults = await Song.sequelize.query(
      `
      SELECT t.id, t.name, t.description
      FROM tags t
      JOIN song_tags st ON t.id = st.tag_id
      WHERE st.song_id = ?
    `,
      {
        replacements: [songId],
        type: Song.sequelize.QueryTypes.SELECT,
      }
    );

    song.tags = tagResults || [];

    return song;
  }

  static async findOrCreateTagsByNames(tag_names) {
    if (!tag_names || tag_names.length === 0) {
      return [];
    }

    const tags = [];

    for (const tagName of tag_names) {
      // Try to find existing tag by name
      let tag = await Tag.findOne({ where: { name: tagName.trim() } });

      if (!tag) {
        // If not found, create new tag
        tag = await Tag.create({
          name: tagName.trim(),
          description: `Auto-created tag: ${tagName.trim()}`,
        });
      }

      tags.push(tag);
    }

    return tags;
  }

  static async createSong(songData) {
    const { tag_names, ...songAttributes } = songData;

    if (!songAttributes.title || !songAttributes.artist) {
      throw new Error("Title and artist are required");
    }

    // Ensure artist is an array
    if (songAttributes.artist && !Array.isArray(songAttributes.artist)) {
      songAttributes.artist = [songAttributes.artist];
    }

    // Use transaction to ensure atomicity
    const transaction = await Song.sequelize.transaction();

    try {
      const song = await Song.create(songAttributes, { transaction });

      if (tag_names && tag_names.length > 0) {
        // Move tag creation inside transaction to ensure atomicity
        const tags = [];
        for (const tagName of tag_names) {
          const [tag] = await Tag.findOrCreate({
            where: { name: tagName.trim() },
            defaults: {
              name: tagName.trim(),
              description: `Auto-created tag: ${tagName.trim()}`,
            },
            transaction,
          });
          tags.push(tag);
        }

        // Use raw SQL to insert associations to avoid model association issues
        for (const tag of tags) {
          await Song.sequelize.query(
            "INSERT IGNORE INTO song_tags (song_id, tag_id) VALUES (?, ?)",
            {
              replacements: [song.id, tag.id],
              transaction,
            }
          );
        }
      }

      await transaction.commit();

      // Invalidate all song caches after successful creation
      try {
        await RedisService.deletePattern("songs:all:*");
        console.log("Invalidated song caches after creation");
      } catch (error) {
        console.error("Cache invalidation error:", error);
      }

      // Return the created song data directly with tags
      const result = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        base_chord: song.base_chord,
        lyrics_and_chords: song.lyrics_and_chords,
        createdAt: song.createdAt,
        updatedAt: song.updatedAt,
        tags: [],
      };

      // Get tags if they were created
      if (tag_names && tag_names.length > 0) {
        const [tagResults] = await Song.sequelize.query(
          `
          SELECT t.id, t.name, t.description
          FROM tags t
          JOIN song_tags st ON t.id = st.tag_id
          WHERE st.song_id = ?
        `,
          {
            replacements: [song.id],
            type: Song.sequelize.QueryTypes.SELECT,
          }
        );

        result.tags = tagResults || [];
      }

      return result;
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  static async updateSong(songId, updateData) {
    const { tag_names, ...songAttributes } = updateData;

    // Ensure artist is an array if provided
    if (songAttributes.artist && !Array.isArray(songAttributes.artist)) {
      songAttributes.artist = [songAttributes.artist];
    }

    // Update song attributes if provided
    if (Object.keys(songAttributes).length > 0) {
      const [affectedRowCount] = await Song.update(songAttributes, {
        where: { id: songId },
      });

      if (affectedRowCount === 0) {
        const error = new Error("Song not found");
        error.statusCode = 404;
        throw error;
      }
    }

    // Handle tag updates
    if (tag_names !== undefined) {
      if (tag_names.length === 0) {
        // Remove all existing tag associations
        await Song.sequelize.query("DELETE FROM song_tags WHERE song_id = ?", {
          replacements: [songId],
        });
      } else {
        const tags = await this.findOrCreateTagsByNames(tag_names);

        // First remove existing associations
        await Song.sequelize.query("DELETE FROM song_tags WHERE song_id = ?", {
          replacements: [songId],
        });

        // Then add new associations
        for (const tag of tags) {
          await Song.sequelize.query(
            "INSERT IGNORE INTO song_tags (song_id, tag_id) VALUES (?, ?)",
            { replacements: [songId, tag.id] }
          );
        }
      }
    }

    // Invalidate all song caches after successful update
    try {
      await RedisService.deletePattern("songs:all:*");
      console.log("Invalidated song caches after update");
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }

    // Construct response from known data - same approach that fixed POST
    const result = {
      id: parseInt(songId),
      title: songAttributes.title || "Unknown Title",
      artist: songAttributes.artist || "Unknown Artist",
      base_chord: songAttributes.base_chord || "",
      lyrics_and_chords: songAttributes.lyrics_and_chords || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };

    // Add tags if they were updated
    if (tag_names !== undefined) {
      if (tag_names.length === 0) {
        result.tags = [];
      } else {
        // Get the tags that were just created/found
        const tags = await this.findOrCreateTagsByNames(tag_names);
        result.tags = tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          description: tag.description,
        }));
      }
    }

    return result;
  }

  static async deleteSong(songId) {
    // Use Sequelize's destroy method instead of raw SQL
    const affectedRows = await Song.destroy({
      where: { id: songId },
    });

    if (affectedRows === 0) {
      const error = new Error("Song not found");
      error.statusCode = 404;
      throw error;
    }

    // Invalidate all song caches after successful deletion
    try {
      await RedisService.deletePattern("songs:all:*");
      console.log("Invalidated song caches after deletion");
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }

    return {
      message: "Song deleted successfully",
      deletedId: parseInt(songId),
    };
  }

  static async getSongsByBaseChord(baseChord, options = {}) {
    const { page = 1, limit = 10 } = options;
    return await this.getAllSongs({
      ...options,
      base_chord: baseChord,
      page,
      limit,
    });
  }

  static async getSongsByTags(tag_ids, options = {}) {
    const { page = 1, limit = 10 } = options;
    return await this.getAllSongs({
      ...options,
      tag_ids,
      page,
      limit,
    });
  }

  static async searchSongs(searchTerm, options = {}) {
    const { page = 1, limit = 10 } = options;
    return await this.getAllSongs({
      ...options,
      search: searchTerm,
      page,
      limit,
    });
  }

  static async getAllArtists() {
    const songs = await Song.sequelize.query(
      `SELECT DISTINCT artist FROM songs WHERE artist IS NOT NULL AND artist != ''`,
      {
        type: Song.sequelize.QueryTypes.SELECT,
      }
    );

    // Extract all unique artists from the JSON arrays
    const allArtists = new Set();

    for (const song of songs) {
      try {
        const artistArray =
          typeof song.artist === "string"
            ? JSON.parse(song.artist)
            : song.artist;

        if (Array.isArray(artistArray)) {
          artistArray.forEach((artist) => {
            if (artist && artist.trim()) {
              allArtists.add(artist.trim());
            }
          });
        } else if (typeof artistArray === "string") {
          // Handle legacy single artist entries
          if (artistArray.trim()) {
            allArtists.add(artistArray.trim());
          }
        }
      } catch {
        // Handle legacy single artist entries that aren't JSON
        if (typeof song.artist === "string" && song.artist.trim()) {
          allArtists.add(song.artist.trim());
        }
      }
    }

    return Array.from(allArtists).sort();
  }
}

export default SongService;
