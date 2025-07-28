import Tag from "../models/Tag.js";

class TagService {
  static async getAllTags(search = "") {
    const query = Tag.query().orderBy("name", "ASC");

    if (search) {
      query.search(search, ["name", "description"]);
    }

    return await query.get();
  }

  static async createTag(tagData) {
    await this.ensureUniqueTagName(tagData.name.trim());

    return Tag.create({
      name: tagData.name.trim(),
      description: tagData.description?.trim() || null,
    });
  }

  static async getOrCreateTag(tagName) {
    const { instance: tag, created } = await Tag.firstOrCreate(
      { name: tagName.trim() },
      { name: tagName.trim() }
    );
    return { tag, created };
  }

  static async ensureUniqueTagName(name) {
    const existing = await Tag.query().where("name", name).first();
    if (existing) {
      throw new Error("Tag with this name already exists");
    }
  }
}

export default TagService;
