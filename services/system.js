import { createSessionEntry, getSessionEntry } from "../utils.js";
import cookie from "cookie";
import pool from "../connection.js";

export const userHomeData = async (req, res) => {
  let connection;
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

    connection = await pool.getConnection();

    const [
      recycleItemsResult,
      nextPickupResult,
      recentActivityResult,
      recyclingHistoryResult,
      recyclingBreakdownResult,
      userInformationResult,
    ] = await Promise.all([
      connection.execute(
        "SELECT * FROM recycleItem WHERE userId = ? ORDER BY createdAt DESC",
        [user.id]
      ),
      connection.execute(
        'SELECT pickupDate FROM pickupRequest WHERE userId = ? AND status = "PENDING" ORDER BY pickupDate ASC LIMIT 1',
        [user.id]
      ),
      connection.execute(
        "SELECT * FROM recycleItem WHERE userId = ? ORDER BY createdAt DESC LIMIT 5",
        [user.id]
      ),
      connection.execute(
        `
                SELECT 
                    DATE_FORMAT(createdAt, '%Y-%m-%d') AS date, 
                    SUM(weight) AS totalWeight 
                FROM recycleItem 
                WHERE userId = ? 
                GROUP BY date 
                ORDER BY date DESC 
                LIMIT 6
            `,
        [user.id]
      ),
      connection.execute(
        `
                SELECT 
                    itemType, 
                    SUM(weight) AS totalWeight 
                FROM recycleItem 
                WHERE userId = ? 
                GROUP BY itemType
            `,
        [user.id]
      ),
      connection.execute("SELECT * FROM user WHERE id = ?", [user.id]),
    ]);

    const recycleItems = recycleItemsResult[0];
    const totalRecycled = recycleItems.reduce(
      (sum, item) => sum + item.weight,
      0
    );
    const co2Saved = totalRecycled * 2.5;
    const nextPickup = nextPickupResult[0][0]?.pickupDate || null;
    const recentActivity = recentActivityResult[0];
    const recyclingHistory = recyclingHistoryResult[0];
    const recyclingBreakdown = recyclingBreakdownResult[0];
    const systemUser = userInformationResult[0];

    sendResponse(res, 200, {
      totalRecycled,
      rewardPoints: user.points,
      co2Saved,
      nextPickup,
      recentActivity,
      recyclingHistory,
      recyclingBreakdown,
      systemUser,
    });
  } catch (error) {
    console.error("Dashboard Data Error:", error);
    sendResponse(res, 500, { message: "Error fetching dashboard data" });
  } finally {
    if (connection) connection.release();
  }
};

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
