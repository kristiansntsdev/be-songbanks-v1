import sequelize from "../../config/database.js";

class UserService {
  /**
   * Get paginated list of users with userlevel > 2
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string|null} search - Search term for email or nama
   * @returns {Promise<Object>} Paginated user list
   */
  static async getUsers(page, limit, search = null) {
    const offset = (page - 1) * limit;

    // Build the base query
    let whereClause = "WHERE userlevel > ?";
    let replacements = ["2"];

    // Add search condition if search term is provided
    if (search && search.trim()) {
      whereClause += " AND (email LIKE ? OR nama LIKE ?)";
      const searchTerm = `%${search.trim()}%`;
      replacements.push(searchTerm, searchTerm);
    }

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM peserta ${whereClause}`;
    const countResult = await sequelize.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const totalItems = countResult[0].total;

    // Data query
    const dataQuery = `
      SELECT 
        id_peserta,
        usercode,
        nama,
        gender,
        email,
        userlevel,
        status,
        role
      FROM peserta 
      ${whereClause}
      ORDER BY id_peserta DESC
      LIMIT ? OFFSET ?
    `;

    const users = await sequelize.query(dataQuery, {
      replacements: [...replacements, limit, offset],
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    return {
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: limit,
      },
      search: search || null,
    };
  }
}

export default UserService;
