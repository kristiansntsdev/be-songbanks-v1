import Playlist from "../models/Playlist.js";
import PlaylistTeam from "../models/PlaylistTeam.js";
import Song from "../models/Song.js";
import { Op } from "sequelize";
import sequelize from "../../config/database.js";
import crypto from "crypto";

class PlaylistService {
  /**
   * Helper method to consistently parse songs field from database
   * Handles both JSON strings and already parsed arrays
   * @param {string|Array} songsData - The songs data from database
   * @returns {Array} Array of song IDs as integers
   */
  static parseSongsField(songsData) {
    if (!songsData) return [];

    // If it's already an array, return it
    if (Array.isArray(songsData)) {
      return songsData
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id) && id > 0);
    }

    // If it's a string, try to parse it
    if (typeof songsData === "string") {
      try {
        const parsed = JSON.parse(songsData);
        if (Array.isArray(parsed)) {
          return parsed
            .map((id) => parseInt(id))
            .filter((id) => !isNaN(id) && id > 0);
        }
      } catch (e) {
        // If JSON parsing fails, return empty array
        console.warn("Failed to parse songs field:", songsData);
      }
    }

    return [];
  }

  /**
   * Helper method to consistently parse playlist_notes field from database
   * Handles both JSON strings and already parsed arrays
   * @param {string|Array} notesData - The playlist_notes data from database
   * @returns {Array} Array of note objects with song_id and base_chord
   */
  static parsePlaylistNotesField(notesData) {
    if (!notesData) return [];

    // If it's already an array, return it
    if (Array.isArray(notesData)) {
      return notesData;
    }

    // If it's a string, try to parse it
    if (typeof notesData === "string") {
      try {
        const parsed = JSON.parse(notesData);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.warn("Failed to parse playlist_notes field:", notesData);
      }
    }

    return [];
  }

  /**
   * Helper method to fetch full song details from array of song IDs
   * @param {Array} songIds - Array of song IDs as integers
   * @returns {Array} Array of song objects with full details
   */
  static async fetchSongDetails(songIds) {
    if (!songIds || songIds.length === 0) return [];

    const songs = await Song.findAll({
      where: { id: { [Op.in]: songIds } },
      attributes: [
        "id",
        "title",
        "artist",
        "base_chord",
        "lyrics_and_chords",
        "createdAt",
        "updatedAt",
      ],
    });

    // Return songs in the same order as the songIds array
    const songMap = new Map(songs.map((song) => [song.id, song]));
    return songIds
      .map((id) => songMap.get(id))
      .filter((song) => song !== undefined);
  }

  static async createPlaylist(userId, playlistData) {
    // Check for case-insensitive duplicate playlist names for this user
    const existingPlaylist = await Playlist.findOne({
      where: {
        user_id: userId,
        playlist_name: {
          [Op.like]: playlistData.playlist_name,
        },
      },
    });

    if (existingPlaylist) {
      const error = new Error("A playlist with this name already exists");
      error.statusCode = 409;
      throw error;
    }

    // Ensure songs is an array of integers
    let songsArray = playlistData.songs || [];

    // If it's already a string, parse it first
    if (typeof songsArray === "string") {
      try {
        songsArray = JSON.parse(songsArray);
      } catch {
        songsArray = [];
      }
    }

    // Ensure it's an array and convert to integers
    if (!Array.isArray(songsArray)) {
      songsArray = [];
    }

    // Convert all song IDs to integers and filter out invalid ones
    songsArray = songsArray
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id) && id > 0);

    const createData = {
      playlist_name: playlistData.playlist_name,
      user_id: userId,
      songs: JSON.stringify(songsArray),
    };

    const playlist = await Playlist.create(createData);

    // Update playlist with raw SQL like addSongToPlaylist does
    const rawQuery = `UPDATE playlists SET songs = ?, updatedAt = NOW() WHERE id = ? AND user_id = ?`;
    await sequelize.query(rawQuery, {
      replacements: [JSON.stringify(songsArray), playlist.id, userId],
    });

    await playlist.reload();

    return {
      id: playlist.id,
      playlist_name: playlist.playlist_name,
      user_id: playlist.user_id,
      songs: this.parseSongsField(playlist.songs),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };
  }

  static async getPlaylistById(userId, playlistId) {
    const numericPlaylistId = parseInt(playlistId);

    // First, check if user owns the playlist
    let playlist = await Playlist.findOne({
      where: { id: numericPlaylistId, user_id: userId },
      attributes: [
        "id",
        "playlist_name",
        "user_id",
        "songs",
        "sharable_link",
        "share_token",
        "playlist_team_id",
        "is_shared",
        "is_locked",
        "playlist_notes",
        "createdAt",
        "updatedAt",
      ],
    });

    if (playlist) {
      // User owns the playlist - grant full access
      const songIds = this.parseSongsField(playlist.songs);
      const songDetails = await this.fetchSongDetails(songIds);

      const response = {
        id: playlist.id,
        playlist_name: playlist.playlist_name,
        user_id: playlist.user_id,
        songs: songDetails,
        playlist_notes: this.parsePlaylistNotesField(playlist.playlist_notes),
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        access_type: "owner",
      };

      // Include share link fields if playlist is shared
      if (playlist.is_shared) {
        response.sharable_link = playlist.sharable_link;
        response.share_token = playlist.share_token;
        response.playlist_team_id = playlist.playlist_team_id;
        response.is_shared = playlist.is_shared;
        response.is_locked = playlist.is_locked;
      }

      return response;
    }

    // If not owner, check if user is a member of the playlist team
    const teamResult = await sequelize.query(
      "SELECT pt.*, p.* FROM playlist_teams pt JOIN playlists p ON pt.playlist_id = p.id WHERE p.id = ?",
      {
        replacements: [numericPlaylistId],
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );

    if (teamResult.length === 0) {
      // No playlist team exists for this playlist, and user doesn't own it
      const error = new Error("Playlist not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    const team = teamResult[0];

    // Parse members array to check if user is a member
    let members = [];
    if (team.members) {
      if (typeof team.members === "string") {
        try {
          members = JSON.parse(team.members);
        } catch (e) {
          members = [];
        }
      } else {
        members = team.members;
      }
    }

    // Ensure members is an array of numbers
    if (!Array.isArray(members)) {
      members = [];
    }
    members = members.map((id) => parseInt(id)).filter((id) => !isNaN(id));

    const userIdNum = parseInt(userId);
    const isMember = members.some((id) => id === userIdNum);
    const isLeader = parseInt(team.lead_id) === userIdNum;

    if (!isMember && !isLeader) {
      const error = new Error("Playlist not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    // User is a team member or leader - grant access
    const songIds = this.parseSongsField(team.songs);
    const songDetails = await this.fetchSongDetails(songIds);

    const response = {
      id: team.playlist_id, // Use playlist_id, not team id
      playlist_name: team.playlist_name,
      user_id: team.user_id,
      songs: songDetails,
      playlist_notes: this.parsePlaylistNotesField(team.playlist_notes),
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      access_type: isLeader ? "leader" : "member",
      team_id: team.playlist_team_id || team.id, // Include team ID for reference
    };

    // Include share link fields if playlist is shared
    if (team.is_shared) {
      response.sharable_link = team.sharable_link;
      response.share_token = team.share_token;
      response.playlist_team_id = team.playlist_team_id;
      response.is_shared = team.is_shared;
      response.is_locked = team.is_locked;
    }

    return response;
  }

  static async getAllPlaylists(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const userIdNum = parseInt(userId);

    // Get playlists owned by the user
    const ownedPlaylists = await Playlist.findAll({
      where: { user_id: userId },
      attributes: [
        "id",
        "playlist_name",
        "user_id",
        "songs",
        "playlist_notes",
        "createdAt",
        "updatedAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    // Get playlists where user is a team member
    const memberPlaylists = await sequelize.query(
      `SELECT p.id, p.playlist_name, p.user_id, p.songs, p.playlist_notes, p.createdAt, p.updatedAt,
              pt.lead_id, pt.members
       FROM playlists p 
       JOIN playlist_teams pt ON p.id = pt.playlist_id 
       WHERE (JSON_CONTAINS(pt.members, ?) OR pt.lead_id = ?) AND p.user_id != ?`,
      {
        replacements: [JSON.stringify(userIdNum), userIdNum, userId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Combine and format all playlists
    const allPlaylists = [
      ...ownedPlaylists.map((playlist) => ({
        ...playlist.dataValues,
        access_type: "owner",
      })),
      ...memberPlaylists.map((playlist) => {
        // Parse members array to determine if user is leader or member
        let members = [];
        if (playlist.members) {
          try {
            members = JSON.parse(playlist.members);
          } catch (e) {
            members = [];
          }
        }

        const isLeader = parseInt(playlist.lead_id) === userIdNum;
        const access_type = isLeader ? "leader" : "member";

        return {
          ...playlist,
          access_type,
        };
      }),
    ];

    // Sort by creation date
    allPlaylists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const totalItems = allPlaylists.length;
    const paginatedPlaylists = allPlaylists.slice(
      offset,
      offset + parseInt(limit)
    );

    return {
      code: 200,
      message: "Playlists retrieved successfully",
      data: paginatedPlaylists.map((playlist) => {
        const parsedSongs = this.parseSongsField(playlist.songs);
        return {
          id: playlist.id.toString(),
          playlist_name: playlist.playlist_name,
          user_id: playlist.user_id,
          songs: parsedSongs,
          playlist_notes: this.parsePlaylistNotesField(playlist.playlist_notes),
          songs_count: parsedSongs.length,
          access_type: playlist.access_type,
          createdAt: playlist.createdAt,
          updatedAt: playlist.updatedAt,
        };
      }),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < Math.ceil(totalItems / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  static async updatePlaylist(userId, playlistId, updateData) {
    // Convert playlistId to integer to match database type
    const numericPlaylistId = parseInt(playlistId);

    const playlist = await Playlist.findOne({
      where: { id: numericPlaylistId, user_id: userId },
    });

    if (!playlist) {
      const error = new Error("Playlist not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    if (!updateData.playlist_name) {
      const error = new Error("playlist_name is required");
      error.statusCode = 400;
      throw error;
    }

    // Check for case-insensitive duplicate playlist names for this user (excluding current playlist)
    const existingPlaylist = await Playlist.findOne({
      where: {
        user_id: userId,
        id: { [Op.ne]: numericPlaylistId },
        playlist_name: {
          [Op.like]: updateData.playlist_name,
        },
      },
    });

    if (existingPlaylist) {
      const error = new Error("A playlist with this name already exists");
      error.statusCode = 409;
      throw error;
    }

    // Use raw SQL update since Sequelize update has issues
    const rawQuery = `UPDATE playlists SET playlist_name = ?, updatedAt = NOW() WHERE id = ? AND user_id = ?`;
    await sequelize.query(rawQuery, {
      replacements: [updateData.playlist_name, numericPlaylistId, userId],
    });

    await playlist.reload();

    return {
      code: 200,
      message: "Playlist updated successfully",
      data: {
        id: playlist.id.toString(),
        playlist_name: playlist.playlist_name,
        user_id: playlist.user_id,
        songs: this.parseSongsField(playlist.songs),
        playlist_notes: this.parsePlaylistNotesField(playlist.playlist_notes),
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      },
    };
  }

  static async addSongToPlaylist(userId, playlistId, songIds) {
    const numericPlaylistId = parseInt(playlistId);

    // Handle both single ID and array of IDs
    let songIdsArray = Array.isArray(songIds) ? songIds : [songIds];

    // Validate and convert song IDs to integers
    const numericSongIds = songIdsArray
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id) && id > 0);

    if (numericSongIds.length === 0) {
      const error = new Error("No valid song IDs provided");
      error.statusCode = 400;
      throw error;
    }

    // Check if all songs exist
    const existingSongs = await Song.findAll({
      where: { id: { [Op.in]: numericSongIds } },
      attributes: ["id"],
    });

    const foundSongIds = existingSongs.map((song) => song.id);
    const notFoundIds = numericSongIds.filter(
      (id) => !foundSongIds.includes(id)
    );

    if (notFoundIds.length > 0) {
      const error = new Error(`Songs not found: ${notFoundIds.join(", ")}`);
      error.statusCode = 404;
      throw error;
    }

    // Find playlist
    const playlist = await Playlist.findOne({
      where: { id: numericPlaylistId, user_id: userId },
    });

    if (!playlist) {
      const error = new Error("Playlist not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    // Get current songs using the helper method
    let currentSongs = this.parseSongsField(playlist.songs);

    // Filter out songs that are already in playlist
    const newSongs = numericSongIds.filter((id) => !currentSongs.includes(id));
    const duplicateSongs = numericSongIds.filter((id) =>
      currentSongs.includes(id)
    );

    if (newSongs.length === 0) {
      const error = new Error("All songs are already in the playlist");
      error.statusCode = 409;
      throw error;
    }

    // Add new songs to playlist
    const updatedSongs = [...currentSongs, ...newSongs];

    // Update playlist with new songs array
    const rawQuery = `UPDATE playlists SET songs = ?, updatedAt = NOW() WHERE id = ? AND user_id = ?`;
    await sequelize.query(rawQuery, {
      replacements: [JSON.stringify(updatedSongs), numericPlaylistId, userId],
    });

    await playlist.reload();

    // Return appropriate message based on single or multiple songs
    const isSingle = !Array.isArray(songIds);
    const message = isSingle
      ? "Song added to playlist successfully"
      : `${newSongs.length} song(s) added to playlist successfully`;

    return {
      code: 200,
      message,
      data: {
        id: playlist.id.toString(),
        playlist_name: playlist.playlist_name,
        user_id: playlist.user_id,
        songs: this.parseSongsField(playlist.songs),
        songs_count: this.parseSongsField(playlist.songs).length,
        added_song_ids: newSongs,
        ...(duplicateSongs.length > 0 && {
          duplicate_song_ids: duplicateSongs,
        }),
        ...(isSingle && { added_song_id: newSongs[0] }), // Keep backward compatibility
        total_requested: numericSongIds.length,
        successfully_added: newSongs.length,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      },
    };
  }

  static async addSongToPlaylistWithBaseChord(
    userId,
    playlistId,
    songId,
    baseChord
  ) {
    const numericPlaylistId = parseInt(playlistId);
    const numericSongId = parseInt(songId);

    if (isNaN(numericSongId) || numericSongId <= 0) {
      const error = new Error("Invalid song ID provided");
      error.statusCode = 400;
      throw error;
    }

    if (
      !baseChord ||
      typeof baseChord !== "string" ||
      baseChord.trim() === ""
    ) {
      const error = new Error("Base chord is required");
      error.statusCode = 400;
      throw error;
    }

    // Check if song exists
    const existingSong = await Song.findByPk(numericSongId);
    if (!existingSong) {
      const error = new Error("Song not found");
      error.statusCode = 404;
      throw error;
    }

    // Find playlist
    const playlist = await Playlist.findOne({
      where: { id: numericPlaylistId, user_id: userId },
    });

    if (!playlist) {
      const error = new Error("Playlist not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    // Get current songs and playlist notes
    let currentSongs = this.parseSongsField(playlist.songs);
    let currentNotes = this.parsePlaylistNotesField(playlist.playlist_notes);

    // Check if song is already in playlist
    if (currentSongs.includes(numericSongId)) {
      const error = new Error("Song is already in the playlist");
      error.statusCode = 409;
      throw error;
    }

    // Add song to playlist
    const updatedSongs = [...currentSongs, numericSongId];

    // Add or update base chord note
    const noteIndex = currentNotes.findIndex(
      (note) => note.song_id === numericSongId
    );
    if (noteIndex >= 0) {
      // Update existing note
      currentNotes[noteIndex].base_chord = baseChord.trim();
    } else {
      // Add new note
      currentNotes.push({
        song_id: numericSongId,
        base_chord: baseChord.trim(),
      });
    }

    // Update playlist with new songs array and notes
    const rawQuery = `UPDATE playlists SET songs = ?, playlist_notes = ?, updatedAt = NOW() WHERE id = ? AND user_id = ?`;
    await sequelize.query(rawQuery, {
      replacements: [
        JSON.stringify(updatedSongs),
        JSON.stringify(currentNotes),
        numericPlaylistId,
        userId,
      ],
    });

    await playlist.reload();

    return {
      code: 200,
      message: "Song added to playlist with base chord successfully",
      data: {
        id: playlist.id.toString(),
        playlist_name: playlist.playlist_name,
        user_id: playlist.user_id,
        songs: this.parseSongsField(playlist.songs),
        playlist_notes: this.parsePlaylistNotesField(playlist.playlist_notes),
        songs_count: this.parseSongsField(playlist.songs).length,
        added_song_id: numericSongId,
        base_chord: baseChord.trim(),
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      },
    };
  }

  static async deletePlaylist(userId, playlistId) {
    // Convert playlistId to integer to match database type
    const numericPlaylistId = parseInt(playlistId);

    const playlist = await Playlist.findOne({
      where: { id: numericPlaylistId, user_id: userId },
    });

    if (!playlist) {
      const error = new Error("Only playlist owner can delete playlist");
      error.statusCode = 403;
      throw error;
    }

    await playlist.destroy();
    return {
      code: 200,
      message: "Playlist deleted successfully",
    };
  }

  static async generateSharelink(userId, playlistId) {
    const numericPlaylistId = parseInt(playlistId);

    const playlist = await Playlist.findOne({
      where: { id: numericPlaylistId, user_id: userId },
    });

    if (!playlist) {
      const error = new Error("Playlist not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    // Check if playlist already has a team
    const existingTeam = await PlaylistTeam.findOne({
      where: { playlist_id: playlist.id },
    });

    if (existingTeam) {
      const error = new Error(
        "This playlist already has a team associated with it"
      );
      error.statusCode = 409;
      throw error;
    }

    const shareToken = crypto.randomBytes(32).toString("hex");
    const sharableLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/playlist/join/${shareToken}`;

    const transaction = await sequelize.transaction();

    try {
      // Create playlist team with user as leader
      const playlistTeam = await PlaylistTeam.create(
        {
          playlist_id: playlist.id,
          lead_id: userId,
          is_hidden: false,
        },
        { transaction }
      );

      // Update playlist with sharelink info and team reference
      const rawQuery = `UPDATE playlists SET is_shared = ?, share_token = ?, sharable_link = ?, playlist_team_id = ? WHERE id = ? AND user_id = ?`;
      await sequelize.query(rawQuery, {
        replacements: [
          true,
          shareToken,
          sharableLink,
          playlistTeam.id,
          numericPlaylistId,
          userId,
        ],
        transaction,
      });

      await transaction.commit();
      await playlist.reload();

      return {
        id: playlist.id.toString(),
        playlist_name: playlist.playlist_name,
        sharable_link: playlist.sharable_link,
        share_token: playlist.share_token,
        is_shared: playlist.is_shared,
        playlist_team_id: playlistTeam.id,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async removeSongFromPlaylist(userId, playlistId, songId) {
    const numericPlaylistId = parseInt(playlistId);
    const numericSongId = parseInt(songId);

    if (isNaN(numericSongId) || numericSongId <= 0) {
      const error = new Error("Invalid song ID provided");
      error.statusCode = 400;
      throw error;
    }

    // Find playlist
    const playlist = await Playlist.findOne({
      where: { id: numericPlaylistId, user_id: userId },
    });

    if (!playlist) {
      const error = new Error(
        "Only playlist owner can remove song from playlist"
      );
      error.statusCode = 403;
      throw error;
    }

    // Get current songs using the helper method
    let currentSongs = this.parseSongsField(playlist.songs);

    // Check if song exists in playlist
    if (!currentSongs.includes(numericSongId)) {
      const error = new Error("Song not found in playlist");
      error.statusCode = 404;
      throw error;
    }

    // Remove song from playlist
    const updatedSongs = currentSongs.filter((id) => id !== numericSongId);

    // Update playlist with new songs array
    const rawQuery = `UPDATE playlists SET songs = ?, updatedAt = NOW() WHERE id = ? AND user_id = ?`;
    await sequelize.query(rawQuery, {
      replacements: [JSON.stringify(updatedSongs), numericPlaylistId, userId],
    });

    await playlist.reload();

    return {
      code: 200,
      message: "Song removed from playlist successfully",
      data: {
        id: playlist.id.toString(),
        playlist_name: playlist.playlist_name,
        user_id: playlist.user_id,
        songs: this.parseSongsField(playlist.songs),
        songs_count: this.parseSongsField(playlist.songs).length,
        removed_song_id: numericSongId,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      },
    };
  }

  static async joinPlaylistViaSharelink(shareToken, userId) {
    const playlist = await Playlist.findOne({
      where: {
        share_token: shareToken,
        is_shared: true,
      },
    });

    if (!playlist) {
      const error = new Error("Invalid or expired share link");
      error.statusCode = 404;
      throw error;
    }

    // Get the existing team (should exist since it's created when sharelink is generated)
    const playlistTeam = await PlaylistTeam.findOne({
      where: { playlist_id: playlist.id },
    });

    if (!playlistTeam) {
      const error = new Error("Playlist team not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if user is the team leader (playlist owner)
    if (userId === playlistTeam.lead_id) {
      // Get current members for the leader response
      const checkMemberQuery = `SELECT members FROM playlist_teams WHERE id = ?`;
      const [teamData] = await sequelize.query(checkMemberQuery, {
        replacements: [playlistTeam.id],
      });

      const currentMembers = teamData[0]
        ? JSON.parse(teamData[0].members || "[]")
        : [];

      return {
        playlist_team_id: playlistTeam.id,
        playlist_id: playlist.id,
        playlist_name: playlist.playlist_name,
        lead_id: playlistTeam.lead_id,
        joiner_id: userId,
        message: "You are already the leader of this playlist team",
        members: currentMembers,
      };
    }

    // Check if user is already a member
    const checkMemberQuery = `SELECT members FROM playlist_teams WHERE id = ?`;
    const [teamData] = await sequelize.query(checkMemberQuery, {
      replacements: [playlistTeam.id],
    });

    const currentMembers = teamData[0]
      ? JSON.parse(teamData[0].members || "[]")
      : [];

    if (currentMembers.includes(userId)) {
      const error = new Error("You are already a member of this playlist team");
      error.statusCode = 409;
      throw error;
    }

    // Add user to members array
    const addMemberQuery = `UPDATE playlist_teams SET members = JSON_ARRAY_APPEND(members, '$', ?), updatedAt = NOW() WHERE id = ?`;
    await sequelize.query(addMemberQuery, {
      replacements: [userId, playlistTeam.id],
    });

    // Get updated members list
    const updatedMembers = [...currentMembers, userId];

    return {
      playlist_team_id: playlistTeam.id,
      playlist_id: playlist.id,
      playlist_name: playlist.playlist_name,
      lead_id: playlistTeam.lead_id,
      joiner_id: userId,
      message: "Successfully joined playlist team as member",
      members: updatedMembers,
    };
  }
}

export default PlaylistService;
