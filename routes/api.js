const express = require('express');
const router = express.Router();
const AuthController = require('../app/controllers/AuthController');
const NoteController = require('../app/controllers/NoteController');
const TagController = require('../app/controllers/TagController');
const UserController = require('../app/controllers/UserController');
const { authenticateToken } = require('../app/middlewares/auth');

// Tag Resource Routes (RESTful CRUD)
router.get('/tags/', TagController.GetTags);
router.get('/tags/:id', TagController.GetTagById);
router.post('/tags/', TagController.CreateTag);
router.put('/tags/:id', TagController.UpdateTag);
router.delete('/tags/:id', TagController.DeleteTag);

// User Group Routes
router.get('/admin/user-access', UserController.getUserAccess);
router.put('/admin/user-access/:user_id', UserController.updateUserAccess);

// AuthController Routes
router.post('/auth/login', AuthController.apiLogin);
router.post('/auth/logout', AuthController.apiLogout);
router.post('/auth/verify', AuthController.apiVerifyToken);
router.post('/auth/refresh', AuthController.apiRefreshToken);

// NoteController Routes
router.get('/notes', NoteController.getAllNotes);
router.get('/notes/:id', NoteController.getNoteById);
router.get('/notes/user/:user_id', NoteController.getNotesByUser);
router.get('/notes/song/:song_id', NoteController.getNotesForSong);
router.post('/notes', NoteController.createNote);
router.put('/notes/:id', NoteController.updateNote);
router.delete('/notes/:id', NoteController.deleteNote);
router.get('/notes/search', NoteController.searchNotes);
router.get('/notes/stats', NoteController.getNoteStats);
router.get('/notes/recent', NoteController.getRecentNotes);


module.exports = router;
