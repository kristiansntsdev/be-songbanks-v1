import PlaylistTeam from "../models/PlaylistTeam.js";
import Playlist from "../models/Playlist.js";
import User from "../models/User.js";

class PlaylistTeamService {
  static async getAllPlaylistTeams() {
    return await PlaylistTeam.findAll({
      where: { is_hidden: false }, // Only show visible teams
      include: [
        {
          model: Playlist,
          as: "playlist",
          attributes: ["id", "playlist_name"],
        },
        {
          model: User,
          as: "leader",
          attributes: ["id", "email"],
        },
        {
          model: User,
          as: "members",
          attributes: ["id", "email"],
          through: { attributes: ["role"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  static async getPlaylistTeamById(teamId) {
    const team = await PlaylistTeam.findByPk(teamId, {
      include: [
        {
          model: Playlist,
          as: "playlist",
          attributes: ["id", "playlist_name"],
        },
        {
          model: User,
          as: "leader",
          attributes: ["id", "email"],
        },
        {
          model: User,
          as: "members",
          attributes: ["id", "email"],
          through: { attributes: ["role"] },
        },
      ],
    });

    if (!team) {
      throw new Error("Playlist team not found");
    }

    return team;
  }

  static async createPlaylistTeam(teamData, userId) {
    const team = await PlaylistTeam.create({
      ...teamData,
      lead_id: userId,
    });

    return await this.getPlaylistTeamById(team.id);
  }

  static async updatePlaylistTeam(teamId, updateData, userId) {
    const team = await this.getPlaylistTeamById(teamId);

    // Check if user is the team leader
    if (team.lead_id !== userId) {
      throw new Error(
        "Access denied. Only team leader can update team details."
      );
    }

    await team.update(updateData);
    return await this.getPlaylistTeamById(teamId);
  }

  static async deletePlaylistTeam(teamId, userId) {
    const team = await this.getPlaylistTeamById(teamId);

    // Check if user is the team leader
    if (team.lead_id !== userId) {
      throw new Error("Access denied. Only team leader can delete the team.");
    }

    await team.destroy();
    return { message: "Playlist team deleted successfully" };
  }

  static async addMemberToTeam(teamId, memberId, role, userId) {
    const team = await this.getPlaylistTeamById(teamId);

    // Check if user is the team leader
    if (team.lead_id !== userId) {
      throw new Error("Access denied. Only team leader can add members.");
    }

    const member = await User.findByPk(memberId);
    if (!member) {
      throw new Error("User not found");
    }

    await team.addMember(member, {
      through: { role: role || "member" },
    });

    return { message: "Member added to team successfully" };
  }

  static async removeMemberFromTeam(teamId, memberId, userId) {
    const team = await this.getPlaylistTeamById(teamId);

    // Check if user is the team leader
    if (team.lead_id !== userId) {
      throw new Error("Access denied. Only team leader can remove members.");
    }

    const member = await User.findByPk(memberId);
    if (!member) {
      throw new Error("User not found");
    }

    await team.removeMember(member);
    return { message: "Member removed from team successfully" };
  }

  static async updateMemberRole(teamId, memberId, role, userId) {
    const team = await this.getPlaylistTeamById(teamId);

    // Check if user is the team leader
    if (team.lead_id !== userId) {
      throw new Error(
        "Access denied. Only team leader can update member roles."
      );
    }

    const member = await User.findByPk(memberId);
    if (!member) {
      throw new Error("User not found");
    }

    await team.addMember(member, {
      through: { role: role },
    });

    return { message: "Member role updated successfully" };
  }

  static async getUserTeams(userId) {
    // Get teams where user is leader or member
    const leaderTeams = await PlaylistTeam.findAll({
      where: { lead_id: userId },
      include: [
        {
          model: Playlist,
          as: "playlist",
          attributes: ["id", "playlist_name"],
        },
        {
          model: User,
          as: "members",
          attributes: ["id", "email"],
          through: { attributes: ["role"] },
        },
      ],
    });

    const memberTeams = await PlaylistTeam.findAll({
      include: [
        {
          model: Playlist,
          as: "playlist",
          attributes: ["id", "playlist_name"],
        },
        {
          model: User,
          as: "leader",
          attributes: ["id", "email"],
        },
        {
          model: User,
          as: "members",
          attributes: ["id", "email"],
          through: { attributes: ["role"] },
          where: { id: userId },
        },
      ],
    });

    return {
      leader_teams: leaderTeams,
      member_teams: memberTeams,
    };
  }

  static async inviteMemberToTeam(teamId, userEmail, role, userId) {
    const team = await this.getPlaylistTeamById(teamId);

    // Check if user is the team leader
    if (team.lead_id !== userId) {
      throw new Error("Access denied. Only team leader can invite members.");
    }

    const invitedUser = await User.findOne({ where: { email: userEmail } });
    if (!invitedUser) {
      throw new Error("User with this email not found");
    }

    // Check if user is already a member
    const existingMember = await team.getMembers({
      where: { id: invitedUser.id },
    });

    if (existingMember.length > 0) {
      throw new Error("User is already a member of this team");
    }

    await team.addMember(invitedUser, {
      through: { role: role || "member" },
    });

    return {
      team_id: teamId,
      invited_user_id: invitedUser.id,
      role: role || "member",
    };
  }

  static async updateTeamVisibility(teamId, isHidden, userId) {
    const team = await this.getPlaylistTeamById(teamId);

    // Check if user is the team leader
    if (team.lead_id !== userId) {
      throw new Error(
        "Access denied. Only team leader can update team visibility."
      );
    }

    await team.update({ is_hidden: isHidden });

    return {
      team_id: teamId,
      is_hidden: isHidden,
    };
  }

  static async getTeamsByUser(userId, includeHidden = false) {
    const whereClause = includeHidden ? {} : { is_hidden: false };

    // Get teams where user is leader
    const leaderTeams = await PlaylistTeam.findAll({
      where: {
        lead_id: userId,
        ...whereClause,
      },
      include: [
        {
          model: Playlist,
          as: "playlist",
          attributes: ["id", "playlist_name", "is_shared", "is_locked"],
        },
        {
          model: User,
          as: "members",
          attributes: ["id", "email"],
          through: { attributes: ["role"] },
        },
      ],
    });

    // Get teams where user is member
    const memberTeams = await PlaylistTeam.findAll({
      where: whereClause,
      include: [
        {
          model: Playlist,
          as: "playlist",
          attributes: ["id", "playlist_name", "is_shared", "is_locked"],
        },
        {
          model: User,
          as: "leader",
          attributes: ["id", "email"],
        },
        {
          model: User,
          as: "members",
          attributes: ["id", "email"],
          through: { attributes: ["role"] },
          where: { id: userId },
        },
      ],
    });

    return {
      leader_teams: leaderTeams,
      member_teams: memberTeams,
    };
  }
}

export default PlaylistTeamService;
