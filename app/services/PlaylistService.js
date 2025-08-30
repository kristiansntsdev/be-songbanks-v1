import Playlist from "../models/Playlist.js";
import PlaylistTeam from "../models/PlaylistTeam.js";
import { Op } from "sequelize";
import sequelize from "../../config/database.js";
import crypto from "crypto";

class PlaylistService {
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

    const createData = {
      playlist_name: playlistData.playlist_name,
      user_id: userId,
      songs: JSON.stringify(playlistData.songs || []),
    };

    const playlist = await Playlist.create(createData);

    return {
      id: playlist.id,
      playlist_name: playlist.playlist_name,
      user_id: playlist.user_id,
      songs: playlist.songs ? JSON.parse(playlist.songs) : [],
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };
  }

  static async getAllPlaylists(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Playlist.findAndCountAll({
      where: { user_id: userId },
      attributes: [
        "id",
        "playlist_name",
        "user_id",
        "songs",
        "createdAt",
        "updatedAt",
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      code: 200,
      message: "Playlists retrieved successfully",
      data: rows.map((playlist) => ({
        id: playlist.id.toString(),
        playlist_name: playlist.playlist_name,
        user_id: playlist.user_id,
        songs: playlist.songs ? JSON.parse(playlist.songs) : [],
        songs_count: playlist.songs ? JSON.parse(playlist.songs).length : 0,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < Math.ceil(count / limit),
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

    const updateFields = {};

    if (updateData.playlist_name) {
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

      updateFields.playlist_name = updateData.playlist_name;
    }

    if (updateData.songs !== undefined) {
      updateFields.songs = JSON.stringify(updateData.songs || []);
    }

    // Use raw SQL update since Sequelize update has issues
    if (updateFields.playlist_name || updateFields.songs) {
      const rawQuery = `UPDATE playlists SET playlist_name = ?, songs = ? WHERE id = ? AND user_id = ?`;
      await sequelize.query(rawQuery, {
        replacements: [
          updateFields.playlist_name || playlist.playlist_name,
          updateFields.songs || playlist.songs,
          numericPlaylistId,
          userId,
        ],
      });

      await playlist.reload();
    }

    return {
      code: 200,
      message: "Playlist updated successfully",
      data: {
        id: playlist.id.toString(),
        playlist_name: playlist.playlist_name,
        user_id: playlist.user_id,
        songs: playlist.songs ? JSON.parse(playlist.songs) : [],
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
      const error = new Error("Playlist not found or access denied");
      error.statusCode = 404;
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
