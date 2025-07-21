const express = require('express');
const router = express.Router();
const AuthController = require('../app/controllers/AuthController');
const NoteController = require('../app/controllers/NoteController');
const UserController = require('../app/controllers/UserController');
const TagController = require('../app/controllers/TagController');
const { authenticateToken } = require('../app/middlewares/auth');

router.post('/auth/login', AuthController.apiLogin);
router.post('/auth/logout', authenticateToken, AuthController.apiLogout);

router.get('/notes/:user_id', NoteController.GetNoteByUserId);

router.get('/admin/user-access', authenticateToken, UserController.getUserAccess);
router.put('/admin/user-access/:user_id', authenticateToken, UserController.updateUserAccess);

router.get('/tags/', TagController.GetTags);
router.get('/tags/:id', TagController.GetTagById);
router.post('/tags/', TagController.CreateTag);
router.put('/tags/:id', TagController.UpdateTag);
router.delete('/tags/:id', TagController.DeleteTag);

module.exports = router;