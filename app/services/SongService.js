const Song = require("../models/Song");
const Tag = require("../models/Tag");

class SongService {
  static async getAllSongs() {
    return await Song.findAll({
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "name", "description"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
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
      throw new Error("Song not found");
    }

    return song;
  }

  static async createSong(songData) {
    const { tag_ids, ...songAttributes } = songData;

    const song = await Song.create(songAttributes);

    if (tag_ids && tag_ids.length > 0) {
      const tags = await Tag.findAll({
        where: { id: tag_ids },
      });
      await song.setTags(tags);
    }

    return await this.getSongById(song.id);
  }

  static async updateSong(songId, updateData) {
    const song = await this.getSongById(songId);
    const { tag_ids, ...songAttributes } = updateData;

    await song.update(songAttributes);

    if (tag_ids !== undefined) {
      if (tag_ids.length === 0) {
        await song.setTags([]);
      } else {
        const tags = await Tag.findAll({
          where: { id: tag_ids },
        });
        await song.setTags(tags);
      }
    }

    return await this.getSongById(songId);
  }

  static async deleteSong(songId) {
    const song = await this.getSongById(songId);
    await song.destroy();
    return { message: "Song deleted successfully" };
  }

  static async addTagToSong(songId, tagId) {
    const song = await this.getSongById(songId);
    const tag = await Tag.findByPk(tagId);

    if (!tag) {
      throw new Error("Tag not found");
    }

    await song.addTag(tag);
    return { message: "Tag added to song successfully" };
  }

  static async removeTagFromSong(songId, tagId) {
    const song = await this.getSongById(songId);
    const tag = await Tag.findByPk(tagId);

    if (!tag) {
      throw new Error("Tag not found");
    }

    await song.removeTag(tag);
    return { message: "Tag removed from song successfully" };
  }
}

module.exports = SongService;
