import PlaylistTeam from "../models/PlaylistTeam.js";
import Playlist from "../models/Playlist.js";
import sequelize from "../../config/database.js";

class PlaylistTeamService {
  static async getAllPlaylistTeamsByUserId(userId) {
    const teams = await PlaylistTeam.findAll({
      where: { lead_id: userId },
      attributes: ["playlist_id", "lead_id", "members"],
      order: [["createdAt", "DESC"]],
    });

    return teams;
  }

  static async getPlaylistTeamById(teamId) {
    const team = await PlaylistTeam.findByPk(teamId);

    if (!team) {
      const error = new Error("Playlist team not found");
      error.statusCode = 404;
      throw error;
    }

    // Get playlist details
    const playlist = await Playlist.findByPk(team.playlist_id, {
      attributes: ["id", "playlist_name"],
    });

    // Get leader details from peserta table
    const leaderResult = await sequelize.query(
      "SELECT id_peserta as id, email FROM peserta WHERE id_peserta = ?",
      {
        replacements: [team.lead_id],
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );
    const leader = leaderResult[0] || null;

    // Parse members JSON and get member details from peserta table
    const memberIds = team.members
      ? typeof team.members === "string"
        ? JSON.parse(team.members)
        : team.members
      : [];
    const members =
      memberIds.length > 0
        ? await sequelize.query(
            "SELECT id_peserta as id, email FROM peserta WHERE id_peserta IN (?)",
            {
              replacements: [memberIds],
              type: sequelize.QueryTypes.SELECT,
              raw: true,
            }
          )
        : [];

    // Return team with related data
    return {
      ...team.toJSON(),
      playlist,
      leader,
      members,
    };
  }

  static async removeMemberFromTeam(teamId, memberId, userId) {
    // Get the raw team data directly, not from getPlaylistTeamById which adds extra processing
    const team = await PlaylistTeam.findByPk(teamId);

    if (!team) {
      const error = new Error("Playlist team not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if user is the team leader
    if (team.lead_id !== userId) {
      const error = new Error(
        "Access denied. Only team leader can remove members."
      );
      error.statusCode = 403;
      throw error;
    }

    const memberResult = await sequelize.query(
      "SELECT id_peserta as id FROM peserta WHERE id_peserta = ?",
      {
        replacements: [memberId],
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );
    if (memberResult.length === 0) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Parse current members array and ensure it's an array of numbers
    let currentMembers = [];
    if (team.members) {
      if (typeof team.members === "string") {
        try {
          currentMembers = JSON.parse(team.members);
        } catch (e) {
          currentMembers = [];
        }
      } else {
        currentMembers = team.members;
      }
    }

    // Ensure all member IDs are numbers
    currentMembers = currentMembers
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    // Check if member exists in the team
    const memberIdNum = parseInt(memberId);
    if (!currentMembers.includes(memberIdNum)) {
      const error = new Error("User is not a member of this team");
      error.statusCode = 404;
      throw error;
    }

    // Remove member from array
    const updatedMembers = currentMembers.filter(
      (id) => parseInt(id) !== memberIdNum
    );

    // Update the team with new members array
    await team.update({ members: JSON.stringify(updatedMembers) });

    return { message: "Member removed from team successfully" };
  }

  static async leavePlaylistTeam(teamId, userId) {
    // Get the raw team data directly, not from getPlaylistTeamById which adds extra processing
    const team = await PlaylistTeam.findByPk(teamId);

    if (!team) {
      const error = new Error("Playlist team not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if user is trying to leave their own team as leader
    if (team.lead_id === userId) {
      const error = new Error(
        "Team leader cannot leave the team. Transfer leadership or delete the team."
      );
      error.statusCode = 403;
      throw error;
    }

    // Parse current members array and ensure it's an array of numbers
    let currentMembers = [];
    if (team.members) {
      if (typeof team.members === "string") {
        try {
          currentMembers = JSON.parse(team.members);
        } catch (e) {
          currentMembers = [];
        }
      } else {
        currentMembers = team.members;
      }
    }

    // Ensure all member IDs are numbers
    currentMembers = currentMembers
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    // Check if user is a member of the team
    const userIdNum = parseInt(userId);
    if (!currentMembers.includes(userIdNum)) {
      const error = new Error("You are not a member of this team");
      error.statusCode = 404;
      throw error;
    }

    // Remove user from members array
    const updatedMembers = currentMembers.filter((id) => id !== userIdNum);

    // Update the team with new members array
    await team.update({ members: JSON.stringify(updatedMembers) });

    return { message: "Successfully left the team" };
  }

  static async deletePlaylistTeam(teamId, userId) {
    const team = await PlaylistTeam.findByPk(teamId);

    if (!team) {
      const error = new Error("Playlist team not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if user is the team leader
    if (team.lead_id !== userId) {
      const error = new Error(
        "Access denied. Only team leader can delete the team."
      );
      error.statusCode = 403;
      throw error;
    }

    // Clear the sharable_link and share_token from the associated playlist
    await Playlist.update(
      {
        sharable_link: null,
        share_token: null,
        is_shared: 0,
      },
      {
        where: { id: team.playlist_id },
      }
    );

    // Delete the playlist team
    await team.destroy();
    return { message: "Playlist team deleted successfully" };
  }
}

export default PlaylistTeamService;
