import sequelize from "../../config/database.js";
import RedisService from "./RedisService.js";

class UserService {
  /**
   * Get paginated list of users with userlevel > 2
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string|null} search - Search term for email or nama
   * @returns {Promise<Object>} Paginated user list
   */
  static async getUsers(page, limit, search = null) {
    // Generate cache key based on query parameters
    const cacheKey = RedisService.generateCacheKey("users:list", {
      page,
      limit,
      search,
    });

    // Try to get from cache first
    try {
      const cachedResult = await RedisService.get(cacheKey);
      if (cachedResult) {
        console.log("Cache hit for getUsers");
        return cachedResult;
      }
      console.log("Cache miss for getUsers");
    } catch (error) {
      console.error("Cache read error, falling back to database:", error);
    }

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

    const result = {
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: limit,
      },
      search: search || null,
    };

    // Cache the result with 5 minute TTL
    try {
      await RedisService.set(cacheKey, result, 300);
    } catch (error) {
      console.error("Cache write error:", error);
    }

    return result;
  }

  /**
   * Clear users cache
   * @returns {Promise<boolean>} Success status
   */
  static async clearUsersCache() {
    try {
      await RedisService.deletePattern("users:*");
      console.log("Users cache cleared successfully");
      return true;
    } catch (error) {
      console.error("Error clearing users cache:", error);
      return false;
    }
  }
}

export default UserService;
