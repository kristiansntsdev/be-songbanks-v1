const express = require("express");
const router = express.Router();
const AuthController = require("../app/controllers/AuthController");
const NoteController = require("../app/controllers/NoteController");
const PlaylistController = require("../app/controllers/PlaylistController");
const PlaylistTeamController = require("../app/controllers/PlaylistTeamController");
const SongController = require("../app/controllers/SongController");
const TagController = require("../app/controllers/TagController");
const UserController = require("../app/controllers/UserController");
const { authenticateToken } = require("../app/middlewares/auth");

// Tag Resource Routes (RESTful CRUD)
router.get("/tags", TagController.GetTags);
router.get("/tags", TagController.GetTagById);
router.post("/tags", TagController.CreateTag);
router.put("/tags/:id", TagController.UpdateTag);
router.delete("/tags/:id", TagController.DeleteTag);

// AuthController Routes
router.post("/auth/login", AuthController.apiLogin);
router.post("/auth/logout", authenticateToken, AuthController.apiLogout);
router.post("/auth/verify", AuthController.apiVerifyToken);
router.post("/auth/refresh", authenticateToken, AuthController.apiRefreshToken);

// NoteController Routes
router.post("/notes/:user_id/:song_id", NoteController.createNoteForSong);
router.get("/notes/:user_id", NoteController.getAllUserNotes);
router.get("/notes/:user_id/:id", NoteController.getNoteById);
router.put("/notes/:user_id/:id", NoteController.updateNote);
router.delete("/notes/:user_id/:id", NoteController.deleteNote);

// PlaylistController Routes
router.get("/playlists", PlaylistController.getAllPlaylists);
router.get("/playlists", PlaylistController.getPlaylistById);
router.post("/playlists", PlaylistController.createPlaylist);
router.put("/playlists/:id", PlaylistController.updatePlaylist);
router.delete("/playlists/:id", PlaylistController.deletePlaylist);
router.get("/users/:user_id/playlists", PlaylistController.getUserPlaylists);
router.post(
  "/playlists/:id/songs/:song_id",
  PlaylistController.addSongToPlaylist
);
router.delete(
  "/playlists/:id/songs/:song_id",
  PlaylistController.removeSongFromPlaylist
);
router.put("/playlists/:id/reorder", PlaylistController.reorderPlaylistSongs);
router.post("/playlists/:id/share", PlaylistController.generateShareableLink);
router.post(
  "/playlists/join/:share_token",
  PlaylistController.joinPlaylistViaLink
);
router.get(
  "/playlists/shared/:share_token",
  PlaylistController.getSharedPlaylistDetails
);

// PlaylistTeamController Routes
router.get("/playlistteams", PlaylistTeamController.getAllPlaylistTeams);
router.get("/playlistteams", PlaylistTeamController.getPlaylistTeamById);
router.post("/playlistteams", PlaylistTeamController.createPlaylistTeam);
router.put("/playlistteams/:id", PlaylistTeamController.updatePlaylistTeam);
router.delete("/playlistteams/:id", PlaylistTeamController.deletePlaylistTeam);
router.post(
  "/playlistteams/:id/members",
  PlaylistTeamController.addMemberToTeam
);
router.delete(
  "/playlistteams/:id/members/:member_id",
  PlaylistTeamController.removeMemberFromTeam
);
router.put(
  "/playlistteams/:id/members/:member_id/role",
  PlaylistTeamController.updateMemberRole
);
router.get("/users/:user_id/teams", PlaylistTeamController.getUserTeams);
router.post(
  "/playlistteams/:id/invite",
  PlaylistTeamController.inviteMemberToTeam
);
router.put(
  "/playlistteams/:id/visibility",
  PlaylistTeamController.updateTeamVisibility
);

// SongController Routes
router.get("/songs", SongController.getAllSongs);
router.get("/songs", SongController.getSongById);
router.post("/songs", SongController.createSong);
router.put("/songs/:id", SongController.updateSong);
router.delete("/songs/:id", SongController.deleteSong);
router.post("/songs/:id/tags", SongController.addTagToSong);
router.delete("/songs/:id/tags/:tag_id", SongController.removeTagFromSong);

// UserController Routes
router.get(
  "/admin/user-access",
  authenticateToken,
  UserController.getUserAccess
);
router.put(
  "/admin/user-access/:user_id",
  authenticateToken,
  UserController.updateUserAccess
);
router.post("/users/request-vol-access", UserController.requestVolAccess);

module.exports = router;
