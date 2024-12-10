import cookie from "cookie";
import bcrypt from "bcrypt";
import { createSessionEntry, getSessionEntry } from "../utils.js";
import cloudinary from "../apis.js";
import pool from "../connection.js";
import fs from "fs";

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
    const offset = (parseInt(page) - 1) * parseInt(limit);

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

    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = Object.fromEntries(url.searchParams);
    const { page = 1, limit = 10, status, dateRange = "all" } = query;
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();
    try {
      const queryParams = [];
      let query =
        "SELECT r.*, u.fullName, u.email FROM RecycleItem r JOIN User u ON r.userId = u.id WHERE 1=1";

      if (status && status !== "all") {
        query += " AND r.status = ?";
        queryParams.push(status.toUpperCase());
      }

      if (dateRange !== "all") {
        const currentDate = new Date();
        let startDate;

        switch (dateRange) {
          case "7":
            startDate = new Date(
              currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
            );
            break;
          case "30":
            startDate = new Date(
              currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
            );
            break;
          case "90":
            startDate = new Date(
              currentDate.getTime() - 90 * 24 * 60 * 60 * 1000
            );
            break;
        }

        if (startDate) {
          query += " AND r.createdAt >= ?";
          queryParams.push(startDate);
        }
      }

      query += " ORDER BY r.createdAt DESC LIMIT ? OFFSET ?";
      queryParams.push(Number(limit), offset);

      const [submissions] = await connection.query(query, queryParams);

      const countQueryParams = [...queryParams.slice(0, -2)];
      const [totalResult] = await connection.query(
        "SELECT COUNT(*) as count FROM RecycleItem r JOIN User u ON r.userId = u.id WHERE 1=1" +
          (status && status !== "all" ? " AND r.status = ?" : "") +
          (dateRange !== "all" ? " AND r.createdAt >= ?" : ""),
        countQueryParams
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
        message: "Error fetching submissions",
        error: error.message,
      })
    );
  }
};

export const contributionStatusUpdation = async (body, req, res) => {
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

    const { submissionId, status } = body;

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

export const statusPickUpRequestUpdation = async (body, req, res) => {
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

    const { pickupId, status } = body;

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

export const changeAdminInformation = async (data, req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.uid;

    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "No active session" }));
    }

    const user = await getSessionEntry(sessionId);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "No active session" }));
    }

    var { fullName, email, password } = data;
    let uploadedImage = {};
    let hashedPassword;

    if (data.image && data.image.length > 0) {
      const file = Array.isArray(data.image) ? data.image[0] : data.image;

      if (file.size > 2 * 1024 * 1024) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "File size exceeds 2MB" }));
      }

      try {
        uploadedImage = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", public_id: `${Date.now()}` },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          if (!file.filepath) {
            reject(new Error("No file path found"));
            return;
          }

          const readableStream = fs.createReadStream(file.filepath);
          readableStream.pipe(uploadStream);
        });
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Error uploading image" }));
      }
    }

    fullName = Array.isArray(data.fullName) ? data.fullName[0] : data.fullName;
    email = Array.isArray(data.email) ? data.email[0] : data.email;

    if (password && password !== "") {
      password = Array.isArray(data.password)
        ? data.password[0]
        : data.password;
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const connection = await pool.getConnection();
    try {
      var query = `
        UPDATE user
                  SET
                      fullName = ?,
                      email = ?,  
                      imageUrl = ?,
                      imageId = ?
              `;

      const values = [
        fullName || user.fullName,
        email || user.email,
        uploadedImage.secure_url || user.imageUrl,
        uploadedImage.public_id || user.imageId,
      ];

      if (hashedPassword) {
        query += ", password = ?";
        values.push(hashedPassword);
      }

      query += " WHERE id = ?";
      values.push(user.id);

      await connection.execute(query, values);
    } finally {
      connection.release();
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        user: {
          id: user.id,
          fullName,
          email,
          imageUrl: uploadedImage.secure_url || user.imageUrl,
          imageId: uploadedImage.public_id || user.imageId,
        },
        message: "Profile updated successfully",
      })
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ message: "Server Error", error: error.message })
    );
  }
};

export const recyclingReport = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.uid;
    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Unauthorized" }));
      return;
    }

    const user = await getSessionEntry(sessionId);
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Session expired" }));
      return;
    }

    const connection = await pool.getConnection();
    try {
      const [totalRecycleItems] = await connection.query(
        "SELECT COUNT(*) as count FROM RecycleItem"
      );
      const [approvedRecycleItems] = await connection.query(
        "SELECT COUNT(*) as count FROM RecycleItem WHERE status = ?",
        ["APPROVED"]
      );
      const [totalWeight] = await connection.query(
        "SELECT SUM(weight) as total FROM RecycleItem WHERE status = ?",
        ["APPROVED"]
      );

      const [recycleItemsByType] = await connection.query(
        `
        SELECT itemType, COUNT(*) as count, SUM(weight) as totalWeight
        FROM RecycleItem
        WHERE status = ?
        GROUP BY itemType
      `,
        ["APPROVED"]
      );

      const [monthlyRecyclingTrends] = await connection.query(
        `
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month, 
          COUNT(*) as itemCount,
          SUM(weight) as totalWeight
        FROM RecycleItem
        WHERE status = ?
        GROUP BY month
        ORDER BY month
        LIMIT 12
      `,
        ["APPROVED"]
      );

      const [pickupRequestStats] = await connection.query(`
        SELECT status, COUNT(*) as count
        FROM PickupRequest
        GROUP BY status
      `);

      const query = req.query || {};
      const { page = 1, limit = 10, sortBy = "totalWeight" } = query;
      const offset = (page - 1) * limit;

      const [userPerformance] = await connection.query(
        `
        SELECT 
          u.id, u.fullName, u.email, u.points,
          COUNT(r.id) as totalItems,
          SUM(r.weight) as totalWeight
        FROM User u
        LEFT JOIN RecycleItem r ON u.id = r.userId AND r.status = ?
        WHERE u.role = ?
        GROUP BY u.id
        ORDER BY ${sortBy === "totalWeight" ? "totalWeight" : "totalItems"} DESC
        LIMIT ? OFFSET ?
      `,
        ["APPROVED", "USER", Number(limit), offset]
      );

      const [totalUsersResult] = await connection.query(
        "SELECT COUNT(*) as count FROM User WHERE role = ?",
        ["USER"]
      );
      const totalUsers = totalUsersResult[0].count;

      const CO2_SAVINGS_PER_KG = 2.5;
      const ENERGY_SAVINGS_PER_KG = 0.5;
      const WATER_SAVINGS_PER_KG = 0.3;

      const weight = totalWeight[0].total || 0;
      const environmentalImpact = {
        totalWeight: weight,
        CO2Savings: weight * CO2_SAVINGS_PER_KG,
        energySavings: weight * ENERGY_SAVINGS_PER_KG,
        waterSavings: weight * WATER_SAVINGS_PER_KG,
      };

      const [itemTypeBreakdown] = await connection.query(
        `
        SELECT itemType, SUM(weight) as totalWeight
        FROM RecycleItem
        WHERE status = ?
        GROUP BY itemType
      `,
        ["APPROVED"]
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          recyclingOverview: {
            totalRecycleItems: totalRecycleItems[0].count,
            approvedRecycleItems: approvedRecycleItems[0].count,
            totalWeight: weight,
            recycleItemsByType,
            monthlyRecyclingTrends,
            pickupRequestStats,
          },
          userRecyclingPerformance: {
            userPerformance,
            pagination: {
              currentPage: Number(page),
              totalPages: Math.ceil(totalUsers / limit),
              totalUsers,
            },
          },
          environmentalImpactReport: {
            environmentalImpact,
            itemTypeBreakdown,
          },
        })
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error generating recycling report:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Failed to generate recycling report",
        error: error.message,
      })
    );
  }
};
