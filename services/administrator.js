import cookie from "cookie";
import { createSessionEntry, getSessionEntry } from "../utils.js";
import cloudinary from "../apis.js";
import { Readable } from "stream";
import pool from "../connection.js";
import url from "url";

export const adminHomeData = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.uid;

    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Unauthorized" }));
    }

    const user = await getSessionEntry(sessionId);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Session expired" }));
    }

    const connection = await pool.getConnection();
    try {
      const [totalUsersResult] = await connection.query(
        "SELECT COUNT(*) as count FROM User WHERE role = ?",
        ["USER"]
      );
      const totalUsers = totalUsersResult[0].count;

      const [totalRecycledResult] = await connection.query(
        "SELECT SUM(weight) as total FROM RecycleItem WHERE status = ?",
        ["APPROVED"]
      );
      const totalRecycled = totalRecycledResult[0].total || 0;

      const [pendingPickupsResult] = await connection.query(
        "SELECT COUNT(*) as count FROM PickupRequest WHERE status = ?",
        ["PENDING"]
      );
      const pendingPickups = pendingPickupsResult[0].count;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const [recyclingTrends] = await connection.query(
        'SELECT DATE_FORMAT(createdAt, "%Y-%m-01") as month, SUM(weight) as total ' +
          "FROM RecycleItem " +
          "WHERE status = ? AND createdAt >= ? " +
          "GROUP BY month " +
          "ORDER BY month ASC",
        ["APPROVED", sixMonthsAgo]
      );

      const [userGrowthTrends] = await connection.query(
        'SELECT DATE_FORMAT(createdAt, "%Y-%m-01") as month, COUNT(*) as count ' +
          "FROM User " +
          "WHERE role = ? AND createdAt >= ? " +
          "GROUP BY month " +
          "ORDER BY month ASC",
        ["USER", sixMonthsAgo]
      );

      const [recentActivity] = await connection.query(
        "SELECT r.createdAt, r.itemType, r.weight, u.fullName " +
          "FROM RecycleItem r " +
          "JOIN User u ON r.userId = u.id " +
          "ORDER BY r.createdAt DESC " +
          "LIMIT 5"
      );

      const [recyclingBreakdown] = await connection.query(
        "SELECT itemType, SUM(weight) as total " +
          "FROM RecycleItem " +
          "WHERE status = ? " +
          "GROUP BY itemType",
        ["APPROVED"]
      );

      const [adminInformation] = await connection.query(
        "SELECT * FROM user WHERE id = ?",
        [user.id]
      );

      const userInfoToSend = {
        id: adminInformation[0].id,
        fullName: adminInformation[0].fullName,
        email: adminInformation[0].email,
        imageUrl: adminInformation[0].imageUrl,
        role: adminInformation[0].role,
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          totalUsers,
          totalRecycled,
          pendingPickups,
          recyclingTrends,
          userGrowthTrends,
          recentActivity: recentActivity.map((activity) => ({
            date: activity.createdAt,
            description: `${activity.fullName} recycled ${activity.weight}kg of ${activity.itemType}`,
          })),
          recyclingBreakdown,
          adminInformation: userInfoToSend,
        })
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Error fetching dashboard data",
        error: error.message,
      })
    );
  }
};

export const systemUsersInfo = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.uid;

    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Unauthorized" }));
    }

    const user = await getSessionEntry(sessionId);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Session expired" }));
    }

    const query = req.query || {};
    const { page = 1, limit = 10, search = "" } = query;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();
    try {
      const [users] = await connection.query(
        "SELECT u.id, u.fullName, u.email, u.phone_number, u.createdAt, u.points, " +
          "(SELECT COUNT(*) FROM RecycleItem WHERE userId = u.id) as recycleItemCount, " +
          "(SELECT COUNT(*) FROM PickupRequest WHERE userId = u.id) as pickupRequestCount " +
          "FROM User u " +
          "WHERE u.role = ? AND (u.fullName LIKE ? OR u.email LIKE ?) " +
          "LIMIT ? OFFSET ?",
        ["USER", `%${search}%`, `%${search}%`, Number(limit), offset]
      );

      const [totalResult] = await connection.query(
        "SELECT COUNT(*) as count FROM User WHERE role = ? AND (fullName LIKE ? OR email LIKE ?)",
        ["USER", `%${search}%`, `%${search}%`]
      );
      const total = totalResult[0].count;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          users,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
          },
        })
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ message: "Error fetching users", error: error.message })
    );
  }
};

export const systemUsersContribution = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.uid;

    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Unauthorized" }));
    }

    const user = await getSessionEntry(sessionId);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Session expired" }));
    }

    const { page = 1, limit = 10, status, search = "" } = req.query;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();
    try {
      let query =
        "SELECT r.*, u.fullName, u.email FROM RecycleItem r JOIN User u ON r.userId = u.id WHERE 1=1";
      const queryParams = [];

      if (status) {
        query += " AND r.status = ?";
        queryParams.push(status);
      }
      if (search) {
        query += " AND (r.itemType LIKE ? OR u.fullName LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      query += " ORDER BY r.createdAt DESC LIMIT ? OFFSET ?";
      queryParams.push(Number(limit), offset);

      const [submissions] = await connection.query(query, queryParams);

      const [totalResult] = await connection.query(
        "SELECT COUNT(*) as count FROM RecycleItem r JOIN User u ON r.userId = u.id WHERE 1=1" +
          (status ? " AND r.status = ?" : "") +
          (search ? " AND (r.itemType LIKE ? OR u.fullName LIKE ?)" : ""),
        queryParams.slice(0, -2)
      );
      const total = totalResult[0].count;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          submissions,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalSubmissions: total,
          },
        })
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Error fetching user submissions",
        error: error.message,
      })
    );
  }
};

export const contributionStatusUpdation = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.uid;

    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Unauthorized" }));
    }

    const user = await getSessionEntry(sessionId);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Session expired" }));
    }

    const { submissionId, status } = req.body;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        "UPDATE RecycleItem SET status = ?, updatedAt = ? WHERE id = ?",
        [status, new Date(), submissionId]
      );

      if (result.affectedRows === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Submission not found" }));
        return;
      }

      const [updatedSubmission] = await connection.query(
        "SELECT * FROM RecycleItem WHERE id = ?",
        [submissionId]
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Submission status updated successfully",
          submission: updatedSubmission[0],
        })
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Error updating submission status",
        error: error.message,
      })
    );
  }
};

export const statusPickUpRequestUpdation = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.uid;

    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Unauthorized" }));
    }

    const user = await getSessionEntry(sessionId);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Session expired" }));
    }

    const { pickupId, status } = req.body;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        "UPDATE PickupRequest SET status = ?, updatedAt = ? WHERE id = ?",
        [status, new Date(), pickupId]
      );

      if (result.affectedRows === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Pickup request not found" }));
        return;
      }

      const [updatedPickup] = await connection.query(
        "SELECT * FROM PickupRequest WHERE id = ?",
        [pickupId]
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Pickup request status updated successfully",
          pickup: updatedPickup[0],
        })
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Error updating pickup request status",
        error: error.message,
      })
    );
  }
};

async function executeQuery(connection, query, params) {
  try {
    const [results] = await connection.query(query, params);
    return results;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

export const adminUserDetailedRev = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.uid;

    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Unauthorized" }));
    }

    var user = await getSessionEntry(sessionId);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Session expired" }));
    }

    const userId = req.url.split("/").pop();

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT id, fullName, email, phone_number, createdAt, points, imageUrl " +
          "FROM User WHERE id = ?",
        [parseInt(userId)]
      );

      if (rows.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User not found" }));
        return;
      }

      user = rows[0];
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Error fetching user details" }));
  }
};
