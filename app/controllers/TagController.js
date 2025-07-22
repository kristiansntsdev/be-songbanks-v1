const Tags = require('../models/Tag');
const ErrorHandler = require('../middleware/ErrorHandler');
const { NotFoundException } = require('../../package/swagpress');

class TagController {

    /**
     * GET /api/tags/
     * @summary Get all tags
     * @returns {tags: array}
     */
    static GetTags = ErrorHandler.asyncHandler(async (req, res) => {
        const tags = await Tags.findAll({
            attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt']
        });
        
        res.json({
            code: 200,
            message: 'Get All Tags',
            data: tags
        });
    });

    /**
     * GET /api/tags/:id
     * @summary Get tag by ID
     * @param {string} id - Tag ID parameter
     * @returns {tag: object}
     */
    static GetTagById = ErrorHandler.asyncHandler(async (req, res) => {
        const tag = await Tags.findByPk(req.params.id, {
            attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt']
        });
        
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }
        
        res.json({
            code: 200,
            message: 'Get Tag by ID',
            data: tag
        });
    });

    /**
     * POST /api/tags/
     * @summary Create new tag
     * @body {name: string, description?: string}
     * @returns {tag: object}
     */
    static CreateTag = ErrorHandler.asyncHandler(async (req, res) => {
        const { name, description } = req.body;
        
        ErrorHandler.validateRequired(['name'], req.body);
        
        const newTag = await Tags.create({ name, description });
        
        res.status(201).json({
            code: 201,
            message: 'Tag created successfully',
            data: newTag
        });
    });

    /**
     * PUT /api/tags/:id
     * @summary Update tag by ID
     * @param {string} id - Tag ID parameter
     * @body {name?: string, description?: string}
     * @returns {tag: object}
     */
    static UpdateTag = ErrorHandler.asyncHandler(async (req, res) => {
        const { name, description } = req.body;
        const tag = await Tags.findByPk(req.params.id);
        
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }
        
        tag.name = name || tag.name;
        tag.description = description || tag.description;
        await tag.save();
        
        res.json({
            code: 200,
            message: 'Tag updated successfully',
            data: tag
        });
    });

    /**
     * DELETE /api/tags/:id
     * @summary Delete tag by ID
     * @param {string} id - Tag ID parameter
     * @returns {message: string}
     */
    static DeleteTag = ErrorHandler.asyncHandler(async (req, res) => {
        const tag = await Tags.findByPk(req.params.id);
        
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }
        
        await tag.destroy();
        
        res.json({
            code: 200,
            message: 'Tag deleted successfully'
        });
    });
}

module.exports = TagController;