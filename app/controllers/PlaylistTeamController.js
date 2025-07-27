const PlaylistTeamService = require("../services/PlaylistTeamService");
const ErrorHandler = require("../middlewares/ErrorHandler");

class PlaylistTeamController {
  /**
   * GET /api/playlist-teams
   * @summary Get all playlist teams
   * @returns {teams: array}
   */
  static getAllPlaylistTeams = ErrorHandler.asyncHandler(async (req, res) => {
    const teams = await PlaylistTeamService.getAllPlaylistTeams();

    res.json({
      code: 200,
      message: "List of playlist teams retrieved successfully",
      data: teams,
    });
  });

  /**
   * GET /api/playlist-teams/:id
   * @summary Get playlist team by ID
   * @param {string} id - Team ID parameter
   * @returns {team: object}
   */
  static getPlaylistTeamById = ErrorHandler.asyncHandler(async (req, res) => {
    const team = await PlaylistTeamService.getPlaylistTeamById(req.params.id);

    res.json({
      code: 200,
      message: "Playlist team details retrieved successfully",
      data: team,
    });
  });

  /**
   * POST /api/playlist-teams
   * @summary Create new playlist team
   * @body {playlist_id: string}
   * @returns {team: object}
   */
  static createPlaylistTeam = ErrorHandler.asyncHandler(async (req, res) => {
    const team = await PlaylistTeamService.createPlaylistTeam(
      req.body,
      req.user.id
    );

    res.status(201).json({
      code: 201,
      message: "Playlist team created successfully",
      data: {
        id: team.id,
        playlist_id: team.playlist_id,
      },
    });
  });

  /**
   * PUT /api/playlist-teams/:id
   * @summary Update playlist team
   * @param {string} id - Team ID parameter
   * @body {playlist_id: string}
   * @returns {team: object}
   */
  static updatePlaylistTeam = ErrorHandler.asyncHandler(async (req, res) => {
    const team = await PlaylistTeamService.updatePlaylistTeam(
      req.params.id,
      req.body,
      req.user.id
    );

    res.json({
      code: 200,
      message: "Playlist team updated successfully",
      data: {
        id: team.id,
        playlist_id: team.playlist_id,
      },
    });
  });

  /**
   * DELETE /api/playlist-teams/:id
   * @summary Delete playlist team
   * @param {string} id - Team ID parameter
   * @returns {message: string}
   */
  static deletePlaylistTeam = ErrorHandler.asyncHandler(async (req, res) => {
    await PlaylistTeamService.deletePlaylistTeam(req.params.id, req.user.id);

    res.json({
      code: 200,
      message: "Playlist team deleted successfully",
      data: {
        id: req.params.id,
      },
    });
  });

  /**
   * POST /api/playlist-teams/:id/members/:user_id
   * @summary Add member to playlist team
   * @param {string} id - Team ID parameter
   * @param {string} user_id - User ID parameter
   * @body {role: string}
   * @returns {message: string}
   */
  static addMemberToTeam = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: teamId, user_id: memberId } = req.params;
    const { role } = req.body;

    await PlaylistTeamService.addMemberToTeam(
      teamId,
      memberId,
      role,
      req.user.id
    );

    res.status(201).json({
      code: 201,
      message: "Member added to team successfully",
      data: {
        team_id: teamId,
        user_id: memberId,
        role: role || "member",
      },
    });
  });

  /**
   * DELETE /api/playlist-teams/:id/members/:user_id
   * @summary Remove member from playlist team
   * @param {string} id - Team ID parameter
   * @param {string} user_id - User ID parameter
   * @returns {message: string}
   */
  static removeMemberFromTeam = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: teamId, user_id: memberId } = req.params;

    await PlaylistTeamService.removeMemberFromTeam(
      teamId,
      memberId,
      req.user.id
    );

    res.json({
      code: 200,
      message: "Member removed from team successfully",
      data: {
        team_id: teamId,
        user_id: memberId,
      },
    });
  });

  /**
   * PUT /api/playlist-teams/:id/members/:user_id/role
   * @summary Update member role in playlist team
   * @param {string} id - Team ID parameter
   * @param {string} user_id - User ID parameter
   * @body {role: string}
   * @returns {message: string}
   */
  static updateMemberRole = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: teamId, user_id: memberId } = req.params;
    const { role } = req.body;

    await PlaylistTeamService.updateMemberRole(
      teamId,
      memberId,
      role,
      req.user.id
    );

    res.json({
      code: 200,
      message: "Member role updated successfully",
      data: {
        team_id: teamId,
        user_id: memberId,
        role: role,
      },
    });
  });

  /**
   * GET /api/users/:user_id/teams
   * @summary Get user teams
   * @param {string} user_id - User ID parameter
   * @returns {teams: object}
   */
  static getUserTeams = ErrorHandler.asyncHandler(async (req, res) => {
    const { user_id } = req.params;

    // Validate user ID matches authenticated user
    if (req.user.id !== user_id) {
      return res.status(403).json({
        code: 403,
        message: "Access denied. User ID must match authenticated user.",
      });
    }

    const teams = await PlaylistTeamService.getUserTeams(user_id);

    res.json({
      code: 200,
      message: "User teams retrieved successfully",
      data: teams,
    });
  });

  /**
   * POST /api/playlist-teams/:id/invite
   * @summary Invite member to playlist team
   * @param {string} id - Team ID parameter
   * @body {user_email: string, role: string}
   * @returns {team_id: string, invited_user_id: string, role: string}
   */
  static inviteMemberToTeam = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: teamId } = req.params;
    const { user_email, role } = req.body;

    const result = await PlaylistTeamService.inviteMemberToTeam(
      teamId,
      user_email,
      role,
      req.user.id
    );

    res.status(201).json({
      code: 201,
      message: "Member invited successfully",
      data: result,
    });
  });

  /**
   * PUT /api/playlist-teams/:id/visibility
   * @summary Update team visibility
   * @param {string} id - Team ID parameter
   * @body {is_hidden: boolean}
   * @returns {team_id: string, is_hidden: boolean}
   */
  static updateTeamVisibility = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: teamId } = req.params;
    const { is_hidden } = req.body;

    const result = await PlaylistTeamService.updateTeamVisibility(
      teamId,
      is_hidden,
      req.user.id
    );

    res.json({
      code: 200,
      message: "Team visibility updated successfully",
      data: result,
    });
  });
}

module.exports = PlaylistTeamController;
