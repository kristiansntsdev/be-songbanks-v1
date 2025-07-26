const TagService = require('../services/TagService');
const ErrorHandler = require('../middlewares/ErrorHandler');
const { NotFoundException } = require('../../package/swagpress');

class TagController {

    /**
     * GET /api/tags/
     * @summary Get all tags
     * @resource Tag
     * @returns {tags: array}
     */
    static GetTags = ErrorHandler.asyncHandler(async (req, res) => {
        const result = await TagService.getAllTags(req.query);
        
        res.json({
            code: 200,
            message: 'Tags retrieved successfully',
            data: result
        });
    });

    /**
     * GET /api/tags/:id
     * @summary Get tag by ID
     * @resource Tag
     * @param {string} id - Tag ID parameter
     * @returns {tag: object}
     */
    static GetTagById = ErrorHandler.asyncHandler(async (req, res) => {
        const tag = await TagService.getTagById(req.params.id, req.query);
        
        res.json({
            code: 200,
            message: 'Tag retrieved successfully',
            data: tag
        });
    });

    /**
     * POST /api/admin/tags
     * @summary Create new tag (Admin Only)
     * @resource Tag
     * @body {name: string, description?: string}
     * @returns {tag: object}
     */
    static CreateTag = ErrorHandler.asyncHandler(async (req, res) => {
        ErrorHandler.validateRequired(['name'], req.body);
        
        const tag = await TagService.createTag(req.body);
        
        res.status(201).json({
            code: 201,
            message: 'Tag created successfully',
            data: {
                id: tag.id,
                name: tag.name
            }
        });
    });

    /**
     * PUT /api/admin/tags/:id
     * @summary Update tag (Admin Only)
     * @resource Tag
     * @param {string} id - Tag ID parameter
     * @body {name?: string, description?: string}
     * @returns {tag: object}
     */
    static UpdateTag = ErrorHandler.asyncHandler(async (req, res) => {
        const tag = await TagService.updateTag(req.params.id, req.body);
        
        res.json({
            code: 200,
            message: 'Tag updated successfully',
            data: {
                id: tag.id,
                name: tag.name
            }
        });
    });

    /**
     * DELETE /api/admin/tags/:id
     * @summary Delete tag (Admin Only)
     * @resource Tag
     * @param {string} id - Tag ID parameter
     * @returns {message: string}
     */
    static DeleteTag = ErrorHandler.asyncHandler(async (req, res) => {
        await TagService.deleteTag(req.params.id);
        
        res.json({
            code: 200,
            message: 'Tag deleted successfully',
            data: {
                id: req.params.id
            }
        });
    });
}

module.exports = TagController;