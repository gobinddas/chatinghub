require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));

/* ---------------- SOCKET.IO ---------------- */

const io = new Server(server, {
  cors: { origin: "*" },
});

let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("addUser", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("sendMessage", (data) => {
    const { senderId, receiverId, message } = data;

    // Save message in database
    const db = require("./config/db");

    db.query(
      "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [senderId, receiverId, message],
    );

    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", data);
    }
  });

  socket.on("disconnect", () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  // ---------------- VIDEO CALL ----------------

  socket.on("callUser", ({ userToCall, signalData, from }) => {
    const receiverSocket = onlineUsers[userToCall];

    if (receiverSocket) {
      io.to(receiverSocket).emit("incomingCall", {
        signal: signalData,
        from,
      });
    }
  });

  socket.on("answerCall", ({ to, signal }) => {
    const receiverSocket = onlineUsers[to];

    if (receiverSocket) {
      io.to(receiverSocket).emit("callAccepted", signal);
    }
  });
});

server.listen(process.env.PORT, () =>
  console.log("Server running on port " + process.env.PORT),
);
