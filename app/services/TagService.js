import { Op } from "sequelize";
import Tag from "../models/Tag.js";
import Song from "../models/Song.js";

class TagService {
  static async getAllTags(options = {}) {
    const { search, sortBy = "name", sortOrder = "ASC" } = options;

    let query = Tag.findAll({
      order: [[sortBy, sortOrder]],
    });

    if (search) {
      query = Tag.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ],
        },
        order: [[sortBy, sortOrder]],
      });
    }

    const tags = await query;
    return tags;
  }

  static async getOrCreateTag(requestBody) {
    const { name } = requestBody;
    const [tag, created] = await Tag.findOrCreate({
      where: { name: name.trim() },
      defaults: { name: name.trim() },
    });
    return { tag, created };
  }

  static async findOrCreateTagsByNames(tag_names) {
    if (!tag_names || tag_names.length === 0) {
      return [];
    }

    const tags = [];

    for (const tagName of tag_names) {
      const result = await this.getOrCreateTag({ name: tagName.trim() });
      tags.push(result.tag);
    }

    return tags;
  }
}

export default TagService;
