import Playlist from "../models/Playlist.js";
import { Op } from "sequelize";
import sequelize from "../../config/database.js";

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
          userId
        ]
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
}

export default PlaylistService;
