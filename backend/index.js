require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db.js");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Attach socket.io instance to express app
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join_user", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on("disconnect", () => {});
});

connectDB();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", require("./routes/authRoutes.js"));

const cron = require("node-cron");
const Post = require("./models/Post");

// Node-Cron Post Scheduler (runs every minute)
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const duePosts = await Post.find({
      is_scheduled: true,
      published: false,
      scheduled_for: { $lte: now },
    });

    for (const post of duePosts) {
      post.published = true;
      post.is_scheduled = false;
      await post.save();

      console.log(`[Scheduler] Published scheduled post: ${post._id} by ${post.username}`);

      io.emit("post_published", {
        postId: post._id,
        author: post.username,
        caption: post.caption,
      });

      io.to(`user_${post.author}`).emit("user_notification", {
        type: "schedule",
        title: "Scheduled Post Published! 🚀",
        message: `Your piece "${post.caption?.slice(0, 30) || "Artwork"}" is now live on Luminix!`,
        timestamp: new Date(),
      });
    // Time Capsule Auto-Reveal
    const dueCapsules = await Post.find({
      "time_capsule.is_capsule": true,
      "time_capsule.is_revealed": false,
      "time_capsule.reveal_date": { $lte: now },
    });

    for (const capsule of dueCapsules) {
      capsule.time_capsule.is_revealed = true;
      await capsule.save();

      console.log(`[Time Capsule] Unlocked capsule: ${capsule._id} by ${capsule.username}`);

      io.emit("time_capsule_unlocked", {
        postId: capsule._id,
        author: capsule.username,
        caption: capsule.caption,
      });

      io.to(`user_${capsule.author}`).emit("user_notification", {
        type: "capsule",
        title: "Time Capsule Unlocked! ⏳🔓",
        message: `Your time capsule piece is now revealed to the community!`,
        timestamp: new Date(),
      });
    }
  } catch (err) {
    console.error("Scheduler error:", err);
  }
});

server.listen(9000, () => {
  console.log("Server running with Socket.io on port 9000");
});
