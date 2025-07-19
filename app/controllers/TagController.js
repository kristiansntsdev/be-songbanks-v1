const ErrorController = require('./ErrorController');
const Tags = require('../models/Tag');

class TagController {

    // GET /api/tags/
    static async GetTags(req, res) {
        try {
            const notes = await Tags.findAll({
                attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt']
            });
            res.json({ message: 'Get All Tags', data: notes });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // GET /api/tags/:id
    static async GetTagById(req, res) {
        try {
            const tag = await Tags.findByPk(req.params.id, {
                attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt']
            });
            if (!tag) {
                return res.status(404).json({ message: 'Tag not found' });
            }
            res.json({ message: 'Get Tag by ID', data: tag });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // POST /api/tags/
    static async CreateTag(req, res) {
        try {
            const { name, description } = req.body;
            const newTag = await Tags.create({ name, description });
            res.status(201).json({ message: 'Tag created successfully', data: newTag });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // PUT /api/tags/:id
    static async UpdateTag(req, res) {
        try {
            const { name, description } = req.body;
            const tag = await Tags.findByPk(req.params.id);
            if (!tag) {
                return res.status(404).json({ message: 'Tag not found' });
            }
            tag.name = name || tag.name;
            tag.description = description || tag.description;
            await tag.save();
            res.json({ message: 'Tag updated successfully', data: tag });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // DELETE /api/tags/:id
    static async DeleteTag(req, res) {
        try {
            const tag = await Tags.findByPk(req.params.id);
            if (!tag) {
                return res.status(404).json({ message: 'Tag not found' });
            }
            await tag.destroy();
            res.json({ message: 'Tag deleted successfully' });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }
}

module.exports = TagController;