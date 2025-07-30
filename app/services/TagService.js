import { fn, col, literal } from "sequelize";
import Tag from "../models/Tag.js";
import Song from "../models/Song.js";

class TagService {
  static async getAllTags(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "name",
      sortOrder = "ASC",
      withSongCount = false,
    } = options;

    const { count, rows } = await Tag.query()
      .when(search, (q) => q.search(search, ["name", "description"]))
      .when(withSongCount, (q) =>
        q
          .with({
            model: Song,
            as: "songs",
            attributes: [],
            through: { attributes: [] },
          })
          .applyOptions({
            attributes: [
              "id",
              "name",
              "description",
              "createdAt",
              "updatedAt",
              [fn("COUNT", col("songs.id")), "songCount"],
            ],
            group: ["Tag.id"],
            subQuery: false,
          })
      )
      .orderBy(sortBy, sortOrder)
      .paginate(page, limit);

    return this.paginatedResponse(rows, count, page, limit, "tags");
  }

  static async getTagById(tagId, options = {}) {
    const { includeSongs = true, songLimit = 10 } = options;

    const tag = await Tag.query()
      .when(includeSongs, (q) =>
        q.with({
          model: Song,
          as: "songs",
          through: { attributes: [] },
          limit: songLimit,
          order: [["title", "ASC"]],
        })
      )
      .findByPk(tagId);

    if (!tag) throw new Error("Tag not found");
    return tag;
  }

  static async createTag(tagData) {
    await this.ensureUniqueTagName(tagData.name.trim());

    return Tag.create({
      name: tagData.name.trim(),
      description: tagData.description?.trim() || null,
    });
  }

  static async updateTag(tagId, updateData) {
    const tag = await this.validateTagExists(tagId);

    if (updateData.name) {
      await this.ensureUniqueTagName(updateData.name.trim(), tagId);
    }

    const updatedData = {
      ...(updateData.name && { name: updateData.name.trim() }),
      ...(updateData.description !== undefined && {
        description: updateData.description?.trim() || null,
      }),
    };

    await tag.update(updatedData);
    return tag;
  }

  static async deleteTag(tagId) {
    const tag = await this.validateTagExists(tagId);

    // Check if tag is being used by any songs
    const songCount = await tag.countSongs();
    if (songCount > 0) {
      throw new Error(
        `Cannot delete tag: it is being used by ${songCount} song(s)`
      );
    }

    await tag.destroy();
    return { message: "Tag deleted successfully" };
  }

  static async getOrCreateTag(tagName) {
    const { instance: tag, created } = await Tag.firstOrCreate(
      { name: tagName.trim() },
      { name: tagName.trim() }
    );
    return { tag, created };
  }

  static async validateTagExists(tagId) {
    const tag = await Tag.findByPk(tagId);
    if (!tag) throw new Error("Tag not found");
    return tag;
  }

  static async ensureUniqueTagName(name, excludeId = null) {
    const query = Tag.query().where("name", name);
    if (excludeId) query.where("id", "!=", excludeId);

    const existing = await query.first();
    if (existing) {
      throw new Error("Tag with this name already exists");
    }
  }
}

export default TagService;
