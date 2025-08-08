import Song from "../models/Song.js";
import Tag from "../models/Tag.js";
import { Op } from "sequelize";

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

    const offset = (page - 1) * limit;
    const whereClause = {};
    const includeClause = {
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "description"],
    };

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { artist: { [Op.like]: `%${search}%` } },
        { lyrics_and_chords: { [Op.like]: `%${search}%` } },
      ];
    }

    if (base_chord) {
      whereClause.base_chord = { [Op.like]: `%${base_chord}%` };
    }

    if (tag_ids && tag_ids.length > 0) {
      includeClause.where = { id: { [Op.in]: tag_ids } };
      includeClause.required = true;
    }

    const { count, rows } = await Song.findAndCountAll({
      where: whereClause,
      include: [includeClause],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      distinct: true,
    });

    return {
      songs: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  static async getSongById(songId) {
    // Get the song first
    const [songResults] = await Song.sequelize.query(
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
    const [tagResults] = await Song.sequelize.query(
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

    // Construct response from known data - same approach that fixed POST
    const result = {
      id: parseInt(songId),
      title: songAttributes.title || "Unknown Title",
      artist: songAttributes.artist || "Unknown Artist", 
      base_chord: songAttributes.base_chord || "",
      lyrics_and_chords: songAttributes.lyrics_and_chords || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    };
    
    // Add tags if they were updated
    if (tag_names !== undefined) {
      if (tag_names.length === 0) {
        result.tags = [];
      } else {
        // Get the tags that were just created/found
        const tags = await this.findOrCreateTagsByNames(tag_names);
        result.tags = tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          description: tag.description
        }));
      }
    }
    
    return result;
  }

  static async deleteSong(songId) {
    const song = await this.getSongById(songId);
    await song.destroy();
    return { message: "Song deleted successfully", deletedId: songId };
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
}

export default SongService;
