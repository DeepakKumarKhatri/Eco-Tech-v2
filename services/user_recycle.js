import cloudinary from "../apis.js";
import { createSessionEntry, getSessionEntry } from "../utils.js";
import cookie from "cookie";
import pool from "../connection.js";
import fs from "fs";
import { IncomingForm } from "formidable";
import { earnedScoreUser } from "../utils.js";
import url from "url";
import querystring from "querystring";

export const recyleItems = async (req, res) => {
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
      const [items] = await connection.execute(
        "SELECT * FROM recycleItem WHERE userId = ?",
        [user.id]
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ items }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ message: "Server Error", error: error.message })
    );
  }
};

export const recyleItem = async (req, res) => {
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

    // Extract item ID from the URL
    const itemId = req.url.split("/").pop();

    const connection = await pool.getConnection();
    try {
      const [items] = await connection.execute(
        "SELECT * FROM recycleItem WHERE id = ? AND userId = ?",
        [itemId, user.id]
      );

      if (items.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Item not found" }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ item: items[0] }));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ message: "Server Error", error: error.message })
    );
  }
};

export const changeItemInformation = async (data, req, res) => {
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

    var { itemDescription, itemWeight } = data;
    const itemId = req.url.split("/").pop();

    itemDescription = Array.isArray(data.itemDescription)
      ? data.itemDescription[0]
      : data.itemDescription;
    itemWeight = Array.isArray(data.itemWeight)
      ? data.itemWeight[0]
      : data.itemWeight;

    const connection = await pool.getConnection();

    const [existingItems] = await connection.execute(
      "SELECT * FROM recycleItem WHERE id = ? AND userId = ?",
      [Number(itemId), user.id]
    );

    if (existingItems.length === 0) {
      connection.release();
      return sendErrorResponse(404, "Item not found");
    }

    const existingItem = existingItems[0];

    const [updateResult] = await connection.execute(
      `UPDATE recycleItem 
           SET description = ?, weight = ? 
           WHERE id = ?`,
      [
        itemDescription || existingItem.description,
        itemWeight ? Number(itemWeight) : existingItem.weight,
        Number(itemId),
      ]
    );

    if (updateResult.affectedRows === 0) {
      connection.release();
      return sendErrorResponse(500, "Failed to update item");
    }

    // Fetch the updated item
    const [updatedItems] = await connection.execute(
      "SELECT * FROM recycleItem WHERE id = ?",
      [Number(itemId)]
    );

    const updatedItem = updatedItems[0];

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        item: updatedItem,
        message: "Updated successfully",
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

export const newRecycleItem = async (data, req, res) => {
  try {
    let connection;

    const sendErrorResponse = (status, message) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message }));
    };

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

    var { itemType, itemDescription, itemCondition, itemWeight } = data;

    // Validate input fields
    if (!itemType || !itemDescription || !itemCondition || !itemWeight) {
      return sendErrorResponse(400, "All fields are required");
    }

    let uploadedImage = {};

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

    itemType = Array.isArray(data.itemType) ? data.itemType[0] : data.itemType;
    itemDescription = Array.isArray(data.itemDescription)
      ? data.itemDescription[0]
      : data.itemDescription;
    itemCondition = Array.isArray(data.itemCondition)
      ? data.itemCondition[0]
      : data.itemCondition;
    itemWeight = Array.isArray(data.itemWeight)
      ? data.itemWeight[0]
      : data.itemWeight;

    const earnedPoints = earnedScoreUser(itemCondition);

    const itemData = {
      itemType,
      description: itemDescription,
      condition: itemCondition,
      weight: Number(itemWeight),
      status: "PENDING",
      userId: user.id,
      imageUrl: uploadedImage.secure_url || null,
      imageId: uploadedImage.public_id || null,
    };

    connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [insertResult] = await connection.execute(
        `INSERT INTO recycleItem 
        (itemType, description, \`item_condition\`, weight, status, userId, imageUrl, imageId) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemData.itemType,
          itemData.description,
          itemData.condition,
          itemData.weight,
          itemData.status,
          itemData.userId,
          itemData.imageUrl,
          itemData.imageId,
        ]
      );

      await connection.execute(
        `UPDATE user SET points = points + ? WHERE id = ?`,
        [earnedPoints, user.id]
      );

      await connection.commit();

      const [userRows] = await connection.execute(
        `SELECT points FROM user WHERE id = ?`,
        [user.id]
      );

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          item: {
            id: insertResult.insertId,
            ...itemData,
          },
          pointsEarned: earnedPoints,
          newTotalPoints: userRows[0].points,
          message: "Item added successfully",
        })
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      await connection.rollback();
      sendErrorResponse(500, "Database error");
    } finally {
      if (connection) {
        console.log("Releasing database connection");
        connection.release();
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    sendErrorResponse(500, "Server Error");
  }
};

export const removeRecyleItem = async (req, res) => {
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

    const itemId = req.url.split("/").pop();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [itemRows] = await connection.execute(
        "SELECT id, imageId FROM recycleItem WHERE id = ? AND userId = ?",
        [itemId, user.id]
      );

      if (itemRows.length === 0) {
        await connection.rollback();
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Item not found" }));
      }

      const item = itemRows[0];

      if (item.imageId) {
        try {
          await new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(item.imageId, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            });
          });
        } catch (cloudinaryError) {
          console.error(
            "Error deleting image from Cloudinary:",
            cloudinaryError
          );
        }
      }

      const [deleteResult] = await connection.execute(
        "DELETE FROM recycleItem WHERE id = ?",
        [itemId]
      );

      await connection.commit();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Item deleted successfully",
          deletedCount: deleteResult.affectedRows,
        })
      );
    } catch (dbError) {
      await connection.rollback();
      console.error("Database error:", dbError);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Server Error",
          error: dbError.message,
        })
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Server Error",
        error: error.message,
      })
    );
  }
};

export const recycleHistoryMetrics = async (req, res) => {
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

    const parsedUrl = url.parse(req.url);
    const query = querystring.parse(parsedUrl.query);

    let sqlQuery = "SELECT * FROM RecycleItem WHERE userId = ?";
    const queryParams = [user.id];

    // Allowed date ranges
    const allowedDateRanges = ["1", "7", "30", "365", "all"];

    if (query.dateRange && allowedDateRanges.includes(query.dateRange)) {
      if (query.dateRange !== "all") {
        const daysAgo = parseInt(query.dateRange, 10);
        sqlQuery += " AND createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
        queryParams.push(daysAgo);
      }
    } else if (query.dateRange) {
      // Invalid dateRange value
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Invalid date range" }));
    }

    if (query.itemType && query.itemType !== "all") {
      sqlQuery += " AND itemType = ?";
      queryParams.push(query.itemType);
    }

    const connection = await pool.getConnection();

    const [items] = await connection.execute(sqlQuery, queryParams);

    const totalItems = items.length;
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const co2Saved = totalWeight * 2.5;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        items,
        summary: {
          totalItems,
          totalWeight,
          co2Saved,
        },
      })
    );
  } catch (error) {
    console.error("Error in recycle history API:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Server Error", error: error.message }));
  }
};
