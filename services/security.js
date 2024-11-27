import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import pool from "../connection.js";
import cookie from "cookie";

export const signup = async (data, req, res) => {
  const { fullName, email, password } = data;

  try {
    // Check if user already exists
    const [existingUser] = await pool.query(
      "SELECT * FROM user WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "User already exists" }));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 5);

    // Insert user into database
    await pool.query(
      "INSERT INTO user (fullName, email, password) VALUES (?, ?, ?)",
      [fullName, email, hashedPassword]
    );

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "User registered successfully" }));
  } catch (error) {
    console.error("Error in register:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
};

export const signin = async (data, req, res) => {
  const { email, password } = data;

  try {
    // Check if user exists
    const [users] = await pool.query("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Invalid credentials" }));
    }

    const user = users[0];

    // Compare passwords
    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Invalid credentials" }));
    }

    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    // Store session in the database
    await pool.query(
      "INSERT INTO session (userId, sessionId, expiresAt) VALUES (?, ?, ?)",
      [user.id, sessionId, expiresAt]
    );

    // Set cookie
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Set-Cookie": cookie.serialize("uid", sessionId, {
        httpOnly: true,
        maxAge: 31536000,
      }),
    });

    res.end(
      JSON.stringify({
        message: "Login successful",
        user: { id: user.id, fullName: user.fullName, email: user.email },
      })
    );
  } catch (error) {
    console.error("Error in login:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
};

export const signout = async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.uid;

    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "No active session" }));
    }

    // Remove session from database
    await pool.query("DELETE FROM session WHERE sessionId = ?", [sessionId]);

    // Clear the cookie
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Set-Cookie": cookie.serialize("uid", "", { maxAge: 0 }),
    });
    res.end(JSON.stringify({ message: "Logout successful" }));
  } catch (error) {
    console.error("Error in logout:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
};
