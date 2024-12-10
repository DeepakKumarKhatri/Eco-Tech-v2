import cloudinary from "../apis.js";
import { createSessionEntry, getSessionEntry } from "../utils.js";
import cookie from "cookie";
import pool from "../connection.js";
import fs from "fs";
import bcrypt from "bcrypt";

export const userInformation = async (req, res) => {
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

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ user }));
  } catch (error) {
    console.error("Error in logout:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
};

export const changeUserInformation = async (data, req, res) => {
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

    var { fullName, email, phone_number, address, password } = data;
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
    phone_number = Array.isArray(data.phone_number)
      ? data.phone_number[0]
      : data.phone_number;
    address = Array.isArray(data.address) ? data.address[0] : data.address;

    if (password && password !== "") {
      password = Array.isArray(data.password)
        ? data.password[0]
        : data.password;
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const connection = await pool.getConnection();
    try {
      let query = `
        UPDATE user
        SET 
          fullName = ?, 
          email = ?, 
          phone_number = ?, 
          address = ?, 
          imageUrl = ?, 
          imageId = ?
      `;

      const values = [
        fullName || user.fullName,
        email || user.email,
        phone_number || user.phone_number,
        address || user.address,
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
          phone_number,
          address,
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
