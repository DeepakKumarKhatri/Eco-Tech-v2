import pool from "./connection.js";

async function createSessionEntry(sessionId, user) {
  try {
    const connection = await pool.getConnection();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    await connection.query(
      "INSERT INTO session (userId, sessionId, expiresAt) VALUES (?, ?, ?)",
      [user.id, sessionId, expiresAt]
    );

    connection.release();
  } catch (error) {
    console.error("Error setting user session:", error);
    throw error;
  }
}

async function getSessionEntry(sessionId) {
  try {
    const connection = await pool.getConnection();
    const [sessionRows] = await connection.query(
      "SELECT * FROM session WHERE sessionId = ?",
      [sessionId]
    );

    if (sessionRows.length === 0) {
      connection.release();
      return null;
    }
    const session = sessionRows[0];
    if (new Date() > new Date(session.expiresAt)) {
      await connection.query("DELETE FROM sessions WHERE sessionId = ?", [
        sessionId,
      ]);
      connection.release();
      return null;
    }
    const [userRows] = await connection.query(
      "SELECT * FROM user WHERE id = ?",
      [session.userId]
    );

    connection.release();

    return userRows.length > 0 ? userRows[0] : null;
  } catch (error) {
    console.error("Error getting user session:", error);
    throw error;
  }
}

async function removeSessionEntry(sessionId) {
  try {
    const connection = await pool.getConnection();
    await connection.query("DELETE FROM session WHERE sessionId = ?", [
      sessionId,
    ]);

    connection.release();
  } catch (error) {
    console.error("Error removing session:", error);
    throw error;
  }
}

const scoreTable = [
  { condition: "new", score: 300 },
  { condition: "likeNew", score: 150 },
  { condition: "good", score: 100 },
  { condition: "fair", score: 50 },
  { condition: "poor", score: 25 },
];

const earnedScoreUser = (value) => {
  const match = scoreTable.find((item) => item.condition === value);
  return match ? match.score : 0;
};

export {
  createSessionEntry,
  removeSessionEntry,
  getSessionEntry,
  earnedScoreUser,
};
