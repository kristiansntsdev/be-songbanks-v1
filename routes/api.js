import express from "express";
const router = express.Router();
import ArtistController from "../app/controllers/ArtistController.js";
import AuthController from "../app/controllers/AuthController.js";
import NoteController from "../app/controllers/NoteController.js";
import PlaylistController from "../app/controllers/PlaylistController.js";
import PlaylistTeamController from "../app/controllers/PlaylistTeamController.js";
import SongController from "../app/controllers/SongController.js";
import TagController from "../app/controllers/TagController.js";
import UserController from "../app/controllers/UserController.js";
import { authenticateToken, requireRole } from "../app/middlewares/auth.js";

// ArtistController Routes
router.get("/artists", ArtistController.getAllArtists);

// AuthController Routes
router.post("/auth/login", AuthController.apiLogin);
router.post("/auth/logout", authenticateToken, AuthController.apiLogout);
router.get(
  "/auth/me",
  authenticateToken,
  requireRole(null),
  AuthController.apiGetCurrentUser
);
router.get(
  "/auth/check-permission",
  authenticateToken,
  requireRole(null),
  AuthController.apiCheckPermission
);

// NoteController Routes
router.post("/notes/:user_id/:song_id", NoteController.createNoteForSong);
router.get("/notes/:user_id", NoteController.getAllUserNotes);
router.get("/notes/:user_id/:id", NoteController.getNoteById);
router.put("/notes/:user_id/:id", NoteController.updateNote);
router.delete("/notes/:user_id/:id", NoteController.deleteNote);

// PlaylistController Routes
router.post("/playlists", authenticateToken, PlaylistController.createPlaylist);
router.get("/playlists", authenticateToken, PlaylistController.getAllPlaylists);
router.get(
  "/playlists/:id",
  authenticateToken,
  PlaylistController.getPlaylistById
);
router.put(
  "/playlists/:id",
  authenticateToken,
  PlaylistController.updatePlaylist
);
router.delete(
  "/playlists/:id",
  authenticateToken,
  PlaylistController.deletePlaylist
);
router.post(
  "/playlists/:id/sharelink",
  authenticateToken,
  PlaylistController.generateSharelink
);
router.post(
  "/playlists/join/:shareToken",
  authenticateToken,
  PlaylistController.joinPlaylistViaSharelink
);

// PlaylistTeamController Routes
router.get(
  "/playlist-teams",
  authenticateToken,
  PlaylistTeamController.getAllPlaylistTeamsByUserId
);
router.get(
  "/playlist-teams/:id",
  authenticateToken,
  PlaylistTeamController.getPlaylistTeamById
);
router.delete(
  "/playlist-teams/:id/members/:user_id",
  authenticateToken,
  PlaylistTeamController.removeMemberFromTeam
);
router.delete(
  "/playlist-teams/:id",
  authenticateToken,
  PlaylistTeamController.deletePlaylistTeam
);
router.post(
  "/playlist-teams/:id/leave",
  authenticateToken,
  PlaylistTeamController.leavePlaylistTeam
);

// SongController Routes
router.get("/songs", SongController.getAllSongs);
router.get("/songs/:id", SongController.getSongById);
router.post("/admin/songs", authenticateToken, SongController.createSong);
router.put("/admin/songs/:id", authenticateToken, SongController.updateSong);
router.delete("/admin/songs/:id", authenticateToken, SongController.deleteSong);

// TagController Routes
router.get("/tags", TagController.GetTags);
router.post("/tags/get-or-create", TagController.GetOrCreateTag);

// UserController Routes
router.get("/admin/user/", authenticateToken, UserController.getUsers);

export default router;
