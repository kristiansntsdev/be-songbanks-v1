const { Op, fn, col, literal } = require('sequelize');
const Tag = require('../models/Tag');
const Song = require('../models/Song');

class TagService {
    /**
     * Get all tags with pagination and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Paginated tags
     */
    static async getAllTags(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                sortBy = 'name',
                sortOrder = 'ASC',
                withSongCount = false
            } = options;

            const offset = (page - 1) * limit;
            const where = {};
            const include = [];
            const attributes = ['id', 'name', 'description', 'createdAt', 'updatedAt'];

            // Add search filter
            if (search) {
                where[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } }
                ];
            }

            // Include song count if requested
            if (withSongCount) {
                include.push({
                    model: Song,
                    as: 'songs',
                    attributes: [],
                    through: { attributes: [] }
                });
                attributes.push([fn('COUNT', col('songs.id')), 'songCount']);
            }

            const queryOptions = {
                where,
                attributes,
                limit: parseInt(limit),
                offset,
                order: [[sortBy, sortOrder]]
            };

            if (include.length > 0) {
                queryOptions.include = include;
                queryOptions.group = ['Tag.id'];
                queryOptions.subQuery = false;
            }

            const { count, rows } = await Tag.findAndCountAll(queryOptions);

            return {
                tags: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page * limit < count,
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Failed to retrieve tags: ${error.message}`);
        }
    }

    /**
     * Get tag by ID with associated songs
     * @param {string} tagId - Tag ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Tag details
     */
    static async getTagById(tagId, options = {}) {
        try {
            const { includeSongs = true, songLimit = 10 } = options;

            const include = [];
            if (includeSongs) {
                include.push({
                    model: Song,
                    as: 'songs',
                    through: { attributes: [] },
                    limit: songLimit,
                    order: [['title', 'ASC']]
                });
            }

            const tag = await Tag.findByPk(tagId, {
                include
            });

            if (!tag) {
                throw new Error('Tag not found');
            }

            return tag;
        } catch (error) {
            throw new Error(`Failed to retrieve tag: ${error.message}`);
        }
    }

    /**
     * Create a new tag
     * @param {Object} tagData - Tag creation data
     * @returns {Promise<Object>} Created tag
     */
    static async createTag(tagData) {
        try {
            // Check if tag with same name already exists
            const existingTag = await Tag.findOne({
                where: { name: tagData.name.trim() }
            });

            if (existingTag) {
                throw new Error('Tag with this name already exists');
            }

            const tag = await Tag.create({
                name: tagData.name.trim(),
                description: tagData.description?.trim() || null
            });

            return tag;
        } catch (error) {
            throw new Error(`Failed to create tag: ${error.message}`);
        }
    }

    /**
     * Update an existing tag
     * @param {string} tagId - Tag ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated tag
     */
    static async updateTag(tagId, updateData) {
        try {
            const tag = await Tag.findByPk(tagId);
            if (!tag) {
                throw new Error('Tag not found');
            }

            // Check if new name conflicts with existing tag
            if (updateData.name) {
                const existingTag = await Tag.findOne({
                    where: { 
                        name: updateData.name.trim(),
                        id: { [Op.ne]: tagId }
                    }
                });

                if (existingTag) {
                    throw new Error('Tag with this name already exists');
                }
            }

            const updatedData = {};
            if (updateData.name) updatedData.name = updateData.name.trim();
            if (updateData.description !== undefined) {
                updatedData.description = updateData.description?.trim() || null;
            }

            await tag.update(updatedData);

            return tag;
        } catch (error) {
            throw new Error(`Failed to update tag: ${error.message}`);
        }
    }

    /**
     * Delete a tag
     * @param {string} tagId - Tag ID
     * @returns {Promise<Object>} Success message
     */
    static async deleteTag(tagId) {
        try {
            const tag = await Tag.findByPk(tagId);
            if (!tag) {
                throw new Error('Tag not found');
            }

            // Check if tag is being used by any songs
            const songCount = await tag.countSongs();
            if (songCount > 0) {
                throw new Error(`Cannot delete tag: it is being used by ${songCount} song(s)`);
            }

            await tag.destroy();

            return {
                message: 'Tag deleted successfully'
            };
        } catch (error) {
            throw new Error(`Failed to delete tag: ${error.message}`);
        }
    }

    /**
     * Get popular tags based on usage count
     * @param {number} limit - Number of tags to return
     * @returns {Promise<Array>} Popular tags
     */
    static async getPopularTags(limit = 10) {
        try {
            const tags = await Tag.findAll({
                include: [
                    {
                        model: Song,
                        as: 'songs',
                        attributes: [],
                        through: { attributes: [] }
                    }
                ],
                attributes: [
                    'id',
                    'name', 
                    'description',
                    [fn('COUNT', col('songs.id')), 'usageCount']
                ],
                group: ['Tag.id'],
                order: [[literal('usageCount'), 'DESC']],
                limit: parseInt(limit)
            });

            return tags;
        } catch (error) {
            throw new Error(`Failed to get popular tags: ${error.message}`);
        }
    }

    /**
     * Search tags by name or description
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} Matching tags
     */
    static async searchTags(searchTerm) {
        try {
            const tags = await Tag.findAll({
                where: {
                    [Op.or]: [
                        { name: { [Op.like]: `%${searchTerm}%` } },
                        { description: { [Op.like]: `%${searchTerm}%` } }
                    ]
                },
                include: [
                    {
                        model: Song,
                        as: 'songs',
                        attributes: [],
                        through: { attributes: [] }
                    }
                ],
                attributes: [
                    'id',
                    'name',
                    'description',
                    [fn('COUNT', col('songs.id')), 'usageCount']
                ],
                group: ['Tag.id'],
                order: [['name', 'ASC']]
            });

            return tags;
        } catch (error) {
            throw new Error(`Failed to search tags: ${error.message}`);
        }
    }

    /**
     * Get tag statistics
     * @returns {Promise<Object>} Tag statistics
     */
    static async getTagStats() {
        try {
            const totalTags = await Tag.count();
            
            const tagUsage = await Tag.findAll({
                include: [
                    {
                        model: Song,
                        as: 'songs',
                        attributes: [],
                        through: { attributes: [] }
                    }
                ],
                attributes: [
                    [fn('COUNT', col('songs.id')), 'usageCount']
                ],
                group: ['Tag.id'],
                raw: true
            });

            const usedTags = tagUsage.filter(tag => tag.usageCount > 0).length;
            const unusedTags = totalTags - usedTags;
            const totalUsage = tagUsage.reduce((sum, tag) => sum + parseInt(tag.usageCount), 0);
            const averageUsage = totalTags > 0 ? (totalUsage / totalTags).toFixed(2) : 0;

            return {
                total: totalTags,
                used: usedTags,
                unused: unusedTags,
                totalUsage,
                averageUsage: parseFloat(averageUsage)
            };
        } catch (error) {
            throw new Error(`Failed to get tag statistics: ${error.message}`);
        }
    }

    /**
     * Get or create tag by name
     * @param {string} tagName - Tag name
     * @returns {Promise<Object>} Tag object
     */
    static async getOrCreateTag(tagName) {
        try {
            const [tag, created] = await Tag.findOrCreate({
                where: { name: tagName.trim() },
                defaults: { name: tagName.trim() }
            });

            return { tag, created };
        } catch (error) {
            throw new Error(`Failed to get or create tag: ${error.message}`);
        }
    }

    /**
     * Get tags for a specific song
     * @param {string} songId - Song ID
     * @returns {Promise<Array>} Song tags
     */
    static async getTagsForSong(songId) {
        try {
            const song = await Song.findByPk(songId, {
                include: [
                    {
                        model: Tag,
                        as: 'tags',
                        through: { attributes: [] }
                    }
                ]
            });

            if (!song) {
                throw new Error('Song not found');
            }

            return song.tags;
        } catch (error) {
            throw new Error(`Failed to get tags for song: ${error.message}`);
        }
    }

    /**
     * Get unused tags (tags with no associated songs)
     * @returns {Promise<Array>} Unused tags
     */
    static async getUnusedTags() {
        try {
            const tags = await Tag.findAll({
                include: [
                    {
                        model: Song,
                        as: 'songs',
                        attributes: [],
                        through: { attributes: [] },
                        required: false
                    }
                ],
                attributes: [
                    'id',
                    'name',
                    'description',
                    'createdAt',
                    [fn('COUNT', col('songs.id')), 'usageCount']
                ],
                group: ['Tag.id'],
                having: literal('COUNT(songs.id) = 0'),
                order: [['name', 'ASC']]
            });

            return tags;
        } catch (error) {
            throw new Error(`Failed to get unused tags: ${error.message}`);
        }
    }

    /**
     * Bulk delete unused tags
     * @returns {Promise<Object>} Deletion result
     */
    static async deleteUnusedTags() {
        try {
            const unusedTags = await this.getUnusedTags();
            const tagIds = unusedTags.map(tag => tag.id);

            if (tagIds.length === 0) {
                return {
                    deletedCount: 0,
                    message: 'No unused tags found'
                };
            }

            const deletedCount = await Tag.destroy({
                where: { id: { [Op.in]: tagIds } }
            });

            return {
                deletedCount,
                message: `Successfully deleted ${deletedCount} unused tag(s)`
            };
        } catch (error) {
            throw new Error(`Failed to delete unused tags: ${error.message}`);
        }
    }
}

module.exports = TagService;