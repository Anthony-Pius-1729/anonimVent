import db from "../config/database.js";
import { getIO } from "../config/socket.js";

class MatchingController {
  static async matchUsers(req, res) {
    try {
      // Get user info from JWT token (req.user is set by your auth middleware)
      const userId = req.user.id;
      const userName = req.user.name;

      // Get role and categories from request body (sent by frontend)
      const { name, role, categories } = req.body;

      if (!role || !Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({
          error: "Role and categories are required",
        });
      }

      // Update current user's preferences and availability
      await db.query(
        `UPDATE users 
         SET role = $1, categories = $2, is_available = true, last_active = CURRENT_TIMESTAMP
         WHERE name = $3`,
        [role, categories, name]
      );

      // Determine opposite role
      const oppositeRole = role === "listener" ? "support-seeker" : "listener";

      // Find available users with opposite role and overlapping categories
      const { rows: potentialMatches } = await db.query(
        `
        SELECT id, name, categories, role
        FROM users 
        WHERE role = $1 
        AND categories && $2::INTEGER[]
        AND is_available = true
        AND id != $3
        ORDER BY last_active DESC
        LIMIT 5
      `,
        [oppositeRole, categories, userId]
      );

      console.log(`Found ${potentialMatches.length} potential matches`);

      if (potentialMatches.length === 0) {
        console.log(
          `No matches found for user ${userId}. They will wait for someone.`
        );

        return res.status(200).json({
          success: true,
          message: "Looking for a match...",
          waiting: true,
          yourRole: role,
          categories: categories,
        });
      }

      // Select the best match (first one for now)
      const match = potentialMatches[0];

      // Find common categories
      const commonCategories = categories.filter(
        (cat) => match.categories && match.categories.includes(cat)
      );

      console.log(`Match found! User ${userId} matched with ${match.id}`);
      console.log(`Common categories: [${commonCategories}]`);

      // Mark both users as unavailable
      await db.query(
        `UPDATE users SET is_available = false WHERE id = ANY($1)`,
        [[userId, match.id]]
      );

      // Create room ID
      const roomId = `room_${Math.min(userId, match.id)}_${Math.max(
        userId,
        match.id
      )}`;

      // Notify both users via Socket.IO
      const io = getIO();

      // Notify current user
      io.to(userId.toString()).emit("matched", {
        roomId,
        matchedUser: {
          id: match.id,
          name: match.name,
          role: match.role,
        },
        yourRole: role,
        commonCategories: commonCategories,
      });

      // Notify matched user
      io.to(match.id.toString()).emit("matched", {
        roomId,
        matchedUser: {
          id: userId,
          name: userName,
          role: role,
        },
        yourRole: match.role,
        commonCategories: commonCategories,
      });

      return res.status(200).json({
        success: true,
        message: "Match found!",
        roomId,
        matchedUser: {
          id: match.id,
          name: match.name,
          role: match.role,
        },
        commonCategories: commonCategories,
      });
    } catch (error) {
      console.error("Matching error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // End match and make user available again
  static async endMatch(req, res) {
    try {
      const userId = req.user.id;

      await db.query(
        `UPDATE users 
         SET is_available = true, last_active = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [userId]
      );

      console.log(`User ${userId} is now available for new matches`);

      return res.status(200).json({
        success: true,
        message: "You're now available for new matches",
      });
    } catch (error) {
      console.error("End match error:", error);
      return res.status(500).json({ error: "Failed to end match" });
    }
  }

  // Get matching statistics
  static async getStats(req, res) {
    try {
      const { rows } = await db.query(`
        SELECT 
          role,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE is_available = true) as available_count
        FROM users 
        WHERE role IS NOT NULL
        GROUP BY role
      `);

      const stats = {
        listeners: { total: 0, available: 0 },
        supportSeekers: { total: 0, available: 0 },
      };

      rows.forEach((row) => {
        if (row.role === "listener") {
          stats.listeners = {
            total: parseInt(row.count),
            available: parseInt(row.available_count),
          };
        } else if (row.role === "support-seeker") {
          stats.supportSeekers = {
            total: parseInt(row.count),
            available: parseInt(row.available_count),
          };
        }
      });

      return res.status(200).json({ stats });
    } catch (error) {
      console.error("Get stats error:", error);
      return res.status(500).json({ error: "Failed to get stats" });
    }
  }
}

export default MatchingController;
