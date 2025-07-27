const Playlist = require("../models/Playlist");
const Song = require("../models/Song");
const User = require("../models/User");
const PlaylistTeam = require("../models/PlaylistTeam");
const crypto = require("crypto");

class PlaylistService {
  static async getAllPlaylists() {
    return await Playlist.findAll({
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "email"],
        },
        {
          model: PlaylistTeam,
          as: "team",
          attributes: ["id", "lead_id"],
        },
        {
          model: Song,
          as: "songs",
          attributes: ["id", "title", "artist"],
          through: { attributes: ["order_index"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  static async getPlaylistById(playlistId) {
    const playlist = await Playlist.findByPk(playlistId, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "email"],
        },
        {
          model: PlaylistTeam,
          as: "team",
          attributes: ["id", "lead_id"],
        },
        {
          model: Song,
          as: "songs",
          attributes: ["id", "title", "artist"],
          through: { attributes: ["order_index"] },
        },
      ],
    });

    if (!playlist) {
      throw new Error("Playlist not found");
    }

    return playlist;
  }

  static async createPlaylist(playlistData, userId) {
    const playlist = await Playlist.create({
      ...playlistData,
      user_id: userId,
    });

    return await this.getPlaylistById(playlist.id);
  }

  static async updatePlaylist(playlistId, updateData, userId) {
    const playlist = await this.getPlaylistById(playlistId);

    // Check if user owns the playlist
    if (playlist.user_id !== userId) {
      throw new Error("Access denied. You can only update your own playlists.");
    }

    await playlist.update(updateData);
    return await this.getPlaylistById(playlistId);
  }

  static async deletePlaylist(playlistId, userId) {
    const playlist = await this.getPlaylistById(playlistId);

    // Check if user owns the playlist
    if (playlist.user_id !== userId) {
      throw new Error("Access denied. You can only delete your own playlists.");
    }

    await playlist.destroy();
    return { message: "Playlist deleted successfully" };
  }

  static async getUserPlaylists(userId) {
    return await Playlist.findAll({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "email"],
        },
        {
          model: Song,
          as: "songs",
          attributes: ["id", "title", "artist"],
          through: { attributes: ["order_index"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  static async addSongToPlaylist(playlistId, songId, orderIndex, userId) {
    const playlist = await this.getPlaylistById(playlistId);

    // Check if user owns the playlist
    if (playlist.user_id !== userId) {
      throw new Error("Access denied. You can only modify your own playlists.");
    }

    const song = await Song.findByPk(songId);
    if (!song) {
      throw new Error("Song not found");
    }

    await playlist.addSong(song, {
      through: { order_index: orderIndex || 0 },
    });

    return { message: "Song added to playlist successfully" };
  }

  static async removeSongFromPlaylist(playlistId, songId, userId) {
    const playlist = await this.getPlaylistById(playlistId);

    // Check if user owns the playlist
    if (playlist.user_id !== userId) {
      throw new Error("Access denied. You can only modify your own playlists.");
    }

    const song = await Song.findByPk(songId);
    if (!song) {
      throw new Error("Song not found");
    }

    await playlist.removeSong(song);
    return { message: "Song removed from playlist successfully" };
  }

  static async reorderPlaylistSongs(playlistId, songOrders, userId) {
    const playlist = await this.getPlaylistById(playlistId);

    // Check if user owns the playlist
    if (playlist.user_id !== userId) {
      throw new Error("Access denied. You can only modify your own playlists.");
    }

    // songOrders should be array of {song_id, order_index}
    for (const { song_id, order_index } of songOrders) {
      const song = await Song.findByPk(song_id);
      if (song) {
        await playlist.addSong(song, {
          through: { order_index: order_index },
        });
      }
    }

    return { message: "Playlist songs reordered successfully" };
  }

  static async generateShareableLink(playlistId, userId) {
    const playlist = await this.getPlaylistById(playlistId);

    // Check if user owns the playlist
    if (playlist.user_id !== userId) {
      throw new Error("Access denied. You can only share your own playlists.");
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(16).toString("hex");
    const sharableLink = `https://songbanks-v1-1.vercel.app/share/${shareToken}`;

    // Update playlist with sharing info
    await playlist.update({
      sharable_link: sharableLink,
      share_token: shareToken,
      is_shared: true,
      is_locked: false,
    });

    // Create hidden playlist team if not exists
    let playlistTeam = playlist.playlist_team_id
      ? await PlaylistTeam.findByPk(playlist.playlist_team_id)
      : null;

    if (!playlistTeam) {
      playlistTeam = await PlaylistTeam.create({
        playlist_id: playlistId,
        lead_id: userId,
        is_hidden: true,
      });

      await playlist.update({ playlist_team_id: playlistTeam.id });
    } else {
      // Make existing team hidden
      await playlistTeam.update({ is_hidden: true });
    }

    return {
      id: playlist.id,
      sharable_link: sharableLink,
      team_id: playlistTeam.id,
      is_shared: true,
      is_locked: false,
    };
  }

  static async joinPlaylistViaLink(shareToken, userId) {
    const playlist = await Playlist.findOne({
      where: { share_token: shareToken },
      include: [
        {
          model: PlaylistTeam,
          as: "team",
        },
      ],
    });

    if (!playlist) {
      throw new Error("Invalid or expired share link");
    }

    if (playlist.is_locked) {
      throw new Error(
        "This playlist is locked and no longer accepting new members via link"
      );
    }

    // Check if user is already a member
    const existingMember = await playlist.team.getMembers({
      where: { id: userId },
    });

    if (existingMember.length > 0) {
      throw new Error("You are already a member of this playlist");
    }

    // Add user to playlist team
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await playlist.team.addMember(user, {
      through: { role: "member" },
    });

    // Lock the playlist and make team visible
    await playlist.update({ is_locked: true });
    await playlist.team.update({ is_hidden: false });

    return {
      playlist_id: playlist.id,
      team_id: playlist.team.id,
      role: "member",
      is_locked: true,
    };
  }

  static async getSharedPlaylistDetails(shareToken) {
    const playlist = await Playlist.findOne({
      where: { share_token: shareToken },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["email"],
        },
        {
          model: Song,
          as: "songs",
          attributes: ["id", "title", "artist"],
          through: { attributes: ["order_index"] },
        },
      ],
    });

    if (!playlist) {
      throw new Error("Invalid or expired share link");
    }

    return {
      id: playlist.id,
      playlist_name: playlist.playlist_name,
      owner_email: playlist.owner.email,
      songs_count: playlist.songs.length,
      songs: playlist.songs.sort(
        (a, b) => a.playlist_songs.order_index - b.playlist_songs.order_index
      ),
      is_locked: playlist.is_locked,
      created_at: playlist.createdAt,
    };
  }

  static async getPlaylistsByUser(userId, includeShared = false) {
    const whereClause = { user_id: userId };

    if (!includeShared) {
      whereClause.is_shared = false;
    }

    return await Playlist.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "email"],
        },
        {
          model: Song,
          as: "songs",
          attributes: ["id", "title", "artist"],
          through: { attributes: ["order_index"] },
        },
        {
          model: PlaylistTeam,
          as: "team",
          attributes: ["id", "is_hidden"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }
}

module.exports = PlaylistService;
