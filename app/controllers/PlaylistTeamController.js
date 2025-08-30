import PlaylistTeamService from "../services/PlaylistTeamService.js";
import ErrorHandler from "../middlewares/ErrorHandler.js";

class PlaylistTeamController {
  /**
   * @Summary Get all playlist teams by user ID
   * @Description Retrieve all playlist teams where the authenticated user is the team leader
   * @Tags PlaylistTeam
   * @Produce application/json
   * @Success 200 {object} PlaylistTeamsResponse "Playlist teams retrieved successfully"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlist-teams [get]
   * @auth
   */
  static getAllPlaylistTeamsByUserId = ErrorHandler.asyncHandler(
    async (req, res) => {
      const userId = req.user.userId;

      const teams =
        await PlaylistTeamService.getAllPlaylistTeamsByUserId(userId);

      res.json({
        code: 200,
        message: "Playlist teams retrieved successfully",
        data: teams,
      });
    }
  );

  /**
   * @Summary Get playlist team by ID
   * @Description Retrieve playlist team details including members and playlist information
   * @Tags PlaylistTeam
   * @Produce application/json
   * @Param id path string true "Playlist Team ID"
   * @Success 200 {object} PlaylistTeamResponse "Playlist team details retrieved successfully"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 404 {object} NotFoundError "Playlist team not found"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlist-teams/{id} [get]
   * @auth
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
   * @Summary Remove member from playlist team
   * @Description Remove a specific member from the playlist team (leader only)
   * @Tags PlaylistTeam
   * @Produce application/json
   * @Param id path string true "Playlist Team ID"
   * @Param user_id path string true "Member User ID to remove"
   * @Success 200 {object} RemoveMemberResponse "Member removed from team successfully"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 403 {object} ForbiddenError "Access denied. Only team leader can remove members"
   * @Failure 404 {object} NotFoundError "Playlist team or user not found"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlist-teams/{id}/members/{user_id} [delete]
   * @auth
   */
  static removeMemberFromTeam = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: teamId, user_id: memberId } = req.params;
    const userId = req.user.userId;

    await PlaylistTeamService.removeMemberFromTeam(teamId, memberId, userId);

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
   * @Summary Delete playlist team
   * @Description Delete the entire playlist team (leader only)
   * @Tags PlaylistTeam
   * @Produce application/json
   * @Param id path string true "Playlist Team ID"
   * @Success 200 {object} DeleteTeamResponse "Playlist team deleted successfully"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 403 {object} ForbiddenError "Access denied. Only team leader can delete the team"
   * @Failure 404 {object} NotFoundError "Playlist team not found"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlist-teams/{id} [delete]
   * @auth
   */
  static deletePlaylistTeam = ErrorHandler.asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    await PlaylistTeamService.deletePlaylistTeam(req.params.id, userId);

    res.json({
      code: 200,
      message: "Playlist team deleted successfully",
      data: {
        id: req.params.id,
      },
    });
  });

  /**
   * @Summary Leave playlist team
   * @Description Leave a playlist team as a member (cannot be used by team leader)
   * @Tags PlaylistTeam
   * @Produce application/json
   * @Param id path string true "Playlist Team ID"
   * @Success 200 {object} LeaveTeamResponse "Successfully left the team"
   * @Failure 401 {object} UnauthorizedError "Authentication required"
   * @Failure 403 {object} ForbiddenError "Team leader cannot leave the team"
   * @Failure 404 {object} NotFoundError "Playlist team not found or user not a member"
   * @Failure 500 {object} InternalServerError "Internal server error"
   * @Router /playlist-teams/{id}/leave [post]
   * @auth
   */
  static leavePlaylistTeam = ErrorHandler.asyncHandler(async (req, res) => {
    const { id: teamId } = req.params;
    const userId = req.user.userId;

    await PlaylistTeamService.leavePlaylistTeam(teamId, userId);

    res.json({
      code: 200,
      message: "Successfully left the team",
      data: {
        team_id: teamId,
        user_id: userId,
      },
    });
  });
}

export default PlaylistTeamController;
