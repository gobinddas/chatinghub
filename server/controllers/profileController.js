const db = require("../config/db");
const path = require("path");
const fs = require("fs");

// ─── GET /api/profile/:userId ─────────────────────────────────────────────────
const getProfile = (req, res) => {
  const { userId } = req.params;
  const requesterId = req.user?.id; // set by your existing authMiddleware

  db.query(
    `SELECT id, username, profile_id, email, profile_picture,
            date_of_birth, role, status, created_at
     FROM users WHERE id = ?`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      if (results.length === 0)
        return res.status(404).json({ message: "User not found" });

      const user = results[0];

      // Private profile: hide details from others
      if (user.status === "private" && String(requesterId) !== String(userId)) {
        return res.json({
          id: user.id,
          username: user.username,
          profile_id: user.profile_id,
          profile_picture: user.profile_picture,
          status: user.status,
          isPrivate: true,
        });
      }

      res.json({ ...user, isPrivate: false });
    },
  );
};

// ─── PUT /api/profile/update ──────────────────────────────────────────────────
const updateProfile = (req, res) => {
  const userId = req.user.id;
  const { date_of_birth, role, status } = req.body;

  if (status && !["public", "private"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  db.query(
    `UPDATE users SET date_of_birth = ?, role = ?, status = ? WHERE id = ?`,
    [date_of_birth || null, role || null, status || "public", userId],
    (err) => {
      if (err)
        return res.status(500).json({ message: "Update failed", error: err });

      db.query(
        `SELECT id, username, profile_id, email, profile_picture,
                date_of_birth, role, status, created_at
         FROM users WHERE id = ?`,
        [userId],
        (err2, results) => {
          if (err2) return res.status(500).json({ message: "Fetch failed" });
          res.json({ message: "Profile updated", user: results[0] });
        },
      );
    },
  );
};

// ─── POST /api/profile/avatar ─────────────────────────────────────────────────
const uploadAvatar = (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  // Delete old avatar file to save disk space
  db.query(
    "SELECT profile_picture FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (!err && results.length > 0 && results[0].profile_picture) {
        const oldPath = path.join(
          __dirname,
          "../public",
          results[0].profile_picture,
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      db.query(
        "UPDATE users SET profile_picture = ? WHERE id = ?",
        [avatarUrl, userId],
        (err2) => {
          if (err2)
            return res.status(500).json({ message: "Failed to save avatar" });
          res.json({ message: "Avatar uploaded", profile_picture: avatarUrl });
        },
      );
    },
  );
};

module.exports = { getProfile, updateProfile, uploadAvatar };
