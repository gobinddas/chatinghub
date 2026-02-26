require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ─── Ensure upload directory exists ──────────────────────────────────────────
const avatarDir = path.join(__dirname, "public/uploads/avatars");
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "https://chattinghub.bluebugsoft.com", // ← your subdomain
  "https://www.chattinghub.bluebugsoft.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

// ─── Static Files ─────────────────────────────────────────────────────────────
// Serve uploaded avatars
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ── Serve Vue dist (ADD THIS) ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../client/dist")));

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));

const db = require("./config/db");

// GET all users (exclude self)
app.get("/api/users", (req, res) => {
  const { userId } = req.query;
  db.query(
    `SELECT id, username, profile_id, email, profile_picture, role, status
     FROM users WHERE id != ?`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    },
  );
});

// Search user by profile_id
app.get("/api/users/search", (req, res) => {
  const { profileId } = req.query;
  db.query(
    `SELECT id, username, profile_id, email, profile_picture, role, status
     FROM users WHERE profile_id = ?`,
    [profileId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    },
  );
});

// GET message history
app.get("/api/messages/:userId/:targetId", (req, res) => {
  const { userId, targetId } = req.params;
  db.query(
    `SELECT * FROM messages
     WHERE (sender_id = ? AND receiver_id = ?)
        OR (sender_id = ? AND receiver_id = ?)
     ORDER BY created_at ASC`,
    [userId, targetId, targetId, userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    },
  );
});

// ─── Vue Router Catch-All (MUST be last route) ────────────────────────────────
app.get("*", (req, res) => {
  // Don't catch API or upload routes
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return;
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// ─── Socket.io Logic ──────────────────────────────────────────────────────────
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("New device connected:", socket.id);

  socket.on("addUser", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    db.query(
      "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [senderId, receiverId, message],
      (err, result) => {
        if (err) return console.error(err);
        const newMessage = {
          id: result.insertId,
          sender_id: senderId,
          receiver_id: receiverId,
          message,
          created_at: new Date(),
        };
        const receiverSocket = onlineUsers[receiverId];
        if (receiverSocket)
          io.to(receiverSocket).emit("receiveMessage", newMessage);
        socket.emit("messageSent", newMessage);
      },
    );
  });

  socket.on("callUser", ({ userToCall, signalData, from, callerName }) => {
    const receiverSocket = onlineUsers[userToCall];
    if (receiverSocket) {
      io.to(receiverSocket).emit("incomingCall", {
        signal: signalData,
        from,
        callerName,
      });
    }
  });

  socket.on("answerCall", ({ signal, to }) => {
    const callerSocket = onlineUsers[to];
    if (callerSocket) io.to(callerSocket).emit("callAccepted", signal);
  });

  socket.on("endCall", ({ to }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) io.to(targetSocket).emit("callEnded");
  });

  socket.on("disconnect", () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) delete onlineUsers[user];
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
