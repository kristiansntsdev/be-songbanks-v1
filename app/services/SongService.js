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
    const song = await Song.findByPk(songId, {
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "name", "description"],
        },
      ],
    });

    if (!song) {
      const error = new Error("Song not found");
      error.statusCode = 404;
      throw error;
    }

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
        const tags = await this.findOrCreateTagsByNames(tag_names);
        await song.setTags(tags, { transaction });
      }

      await transaction.commit();
      return await this.getSongById(song.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async updateSong(songId, updateData) {
    const song = await this.getSongById(songId);
    const { tag_names, ...songAttributes } = updateData;

    if (Object.keys(songAttributes).length > 0) {
      const transaction = await Song.sequelize.transaction();
      
      try {
        const [affectedRowCount] = await Song.update(songAttributes, {
          where: { id: song.id },
          transaction,
          returning: true,
        });
        
        if (affectedRowCount === 0) {
          throw new Error(`No rows were updated for song ID ${song.id}`);
        }
        
        await transaction.commit();
        await song.reload();
        
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    if (tag_names !== undefined) {
      if (tag_names.length === 0) {
        await song.setTags([]);
      } else {
        const tags = await this.findOrCreateTagsByNames(tag_names);
        await song.setTags(tags);
      }
    }

    await song.reload({
      include: [
        { model: Tag, as: "tags", attributes: ["id", "name", "description"] },
      ],
    });
    
    return song;
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
