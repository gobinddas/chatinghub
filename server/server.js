require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// 1. Configure Express CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());

// 2. Configure Socket.io with its own CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use("/api/auth", require("./routes/auth"));
const db = require("./config/db");

// ─── REST API Endpoints ───────────────────────────────────────────────────────

// Get all users except self
app.get("/api/users", (req, res) => {
  const { userId } = req.query;
  db.query(
    "SELECT id, username, profile_id, email FROM users WHERE id != ?",
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
    "SELECT id, username, profile_id, email FROM users WHERE profile_id = ?",
    [profileId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    },
  );
});

// ─── FIX 1: Get message history between two users ────────────────────────────
// This route was MISSING — which is why old chats disappeared on refresh.
// The frontend calls getMessages(userId, targetId) → GET /api/messages/:userId/:targetId
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

// ─── Socket.io Logic ─────────────────────────────────────────────────────────
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("New device connected:", socket.id);

  // Register user as online
  socket.on("addUser", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("Online Users:", Object.keys(onlineUsers));
  });

  // Send a chat message
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

        // Send to receiver if online
        const receiverSocket = onlineUsers[receiverId];
        if (receiverSocket) {
          io.to(receiverSocket).emit("receiveMessage", newMessage);
        }
        // Confirm back to sender
        socket.emit("messageSent", newMessage);
      },
    );
  });

  // ─── FIX 2: Video Call signaling ─────────────────────────────────────────
  // These events were MISSING — VideoCall.vue was emitting into a void.

  // Step 1: Caller initiates a call → notify the receiver
  socket.on("callUser", ({ userToCall, signalData, from, callerName }) => {
    const receiverSocket = onlineUsers[userToCall];
    console.log(
      `Call from ${from} to ${userToCall} → socket: ${receiverSocket}`,
    );
    if (receiverSocket) {
      io.to(receiverSocket).emit("incomingCall", {
        signal: signalData,
        from,
        callerName,
      });
    }
  });

  // Step 2: Receiver accepts → send signal back to caller
  socket.on("answerCall", ({ signal, to }) => {
    const callerSocket = onlineUsers[to];
    console.log(`Call answered, sending signal back to user ${to}`);
    if (callerSocket) {
      io.to(callerSocket).emit("callAccepted", signal);
    }
  });

  // Step 3: Either side ends the call → notify the other
  socket.on("endCall", ({ to }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit("callEnded");
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("Device disconnected:", socket.id);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://192.168.100.184:${PORT}`);
  console.log(
    "NOTE: For mobile video calls, use HTTPS or run: npx ngrok http 5000",
  );
});
