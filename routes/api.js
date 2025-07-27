const express = require('express');
const router = express.Router();
const AuthController = require('../app/controllers/AuthController');
const NoteController = require('../app/controllers/NoteController');
const PlaylistController = require('../app/controllers/PlaylistController');
const PlaylistTeamController = require('../app/controllers/PlaylistTeamController');
const SongController = require('../app/controllers/SongController');
const TagController = require('../app/controllers/TagController');
const UserController = require('../app/controllers/UserController');
const { authenticateToken } = require('../app/middlewares/auth');

// Tag Resource Routes (RESTful CRUD)
router.get('/tags/', TagController.GetTags);
router.get('/tags/:id', TagController.GetTagById);
router.post('/admin/tags', TagController.CreateTag);
router.put('/admin/tags/:id', TagController.UpdateTag);
router.delete('/admin/tags/:id', TagController.DeleteTag);

// AuthController Routes
router.post('undefined', AuthController.apiLogin);
router.post('undefined', authenticateToken, AuthController.apiLogout);
router.post('undefined', AuthController.apiVerifyToken);
router.post('undefined', authenticateToken, AuthController.apiRefreshToken);

// NoteController Routes
router.post('/notes/:user_id/:song_id', NoteController.createNoteForSong);
router.get('/notes/:user_id', NoteController.getAllUserNotes);
router.get('/notes/:user_id/:id', NoteController.getNoteById);
router.put('/notes/:user_id/:id', NoteController.updateNote);
router.delete('/notes/:user_id/:id', NoteController.deleteNote);

// PlaylistController Routes
router.get('/playlists', PlaylistController.getAllPlaylists);
router.get('/playlists/:id', PlaylistController.getPlaylistById);
router.post('/playlists', PlaylistController.createPlaylist);
router.put('/playlists/:id', PlaylistController.updatePlaylist);
router.delete('/playlists/:id', PlaylistController.deletePlaylist);
router.get('/users/:user_id/playlists', PlaylistController.getUserPlaylists);
router.post('/playlists/:id/songs/:song_id', PlaylistController.addSongToPlaylist);
router.delete('/playlists/:id/songs/:song_id', PlaylistController.removeSongFromPlaylist);
router.put('/playlists/:id/reorder', PlaylistController.reorderPlaylistSongs);
router.post('/playlists/:id/share', PlaylistController.generateShareableLink);
router.post('/playlists/join/:share_token', PlaylistController.joinPlaylistViaLink);
router.get('/playlists/shared/:share_token', PlaylistController.getSharedPlaylistDetails);

// PlaylistTeamController Routes
router.get('/playlist-teams', PlaylistTeamController.getAllPlaylistTeams);
router.get('/playlist-teams/:id', PlaylistTeamController.getPlaylistTeamById);
router.post('/playlist-teams', PlaylistTeamController.createPlaylistTeam);
router.put('/playlist-teams/:id', PlaylistTeamController.updatePlaylistTeam);
router.delete('/playlist-teams/:id', PlaylistTeamController.deletePlaylistTeam);
router.post('/playlist-teams/:id/members/:user_id', PlaylistTeamController.addMemberToTeam);
router.delete('/playlist-teams/:id/members/:user_id', PlaylistTeamController.removeMemberFromTeam);
router.put('/playlist-teams/:id/members/:user_id/role', PlaylistTeamController.updateMemberRole);
router.get('/users/:user_id/teams', PlaylistTeamController.getUserTeams);
router.post('/playlist-teams/:id/invite', PlaylistTeamController.inviteMemberToTeam);
router.put('/playlist-teams/:id/visibility', PlaylistTeamController.updateTeamVisibility);

// SongController Routes
router.get('/songs', SongController.getAllSongs);
router.get('/songs/:id', SongController.getSongById);
router.post('/admin/songs', SongController.createSong);
router.put('/admin/songs/:id', SongController.updateSong);
router.delete('/admin/songs/:id', SongController.deleteSong);
router.post('/admin/songs/:song_id/tags/:tag_id', SongController.addTagToSong);
router.delete('/admin/songs/:song_id/tags/:tag_id', SongController.removeTagFromSong);

// UserController Routes
router.get('undefined', authenticateToken, UserController.getUserAccess);
router.put('undefined', authenticateToken, UserController.updateUserAccess);
router.post('undefined', UserController.requestVolAccess);


module.exports = router;
