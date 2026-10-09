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

// In-memory state for collaborative Live Sketch Rooms
const sketchRooms = new Map();
const CREATOR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

io.on("connection", (socket) => {
  socket.on("join_user", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Collaborative Live Sketch Room Handlers
  socket.on("join_sketch_room", ({ roomId, user }) => {
    if (!roomId) return;
    socket.join(roomId);
    socket.currentSketchRoom = roomId;

    if (!sketchRooms.has(roomId)) {
      sketchRooms.set(roomId, {
        users: new Map(),
        strokes: [],
      });
    }

    const room = sketchRooms.get(roomId);
    const existingIndex = room.users.size % CREATOR_COLORS.length;
    const assignedColor = CREATOR_COLORS[existingIndex];

    const userInfo = {
      socketId: socket.id,
      id: user?.id || user?._id || socket.id,
      name: user?.name || "Guest Creator",
      avatar: user?.profileImage || "",
      color: assignedColor,
    };

    room.users.set(socket.id, userInfo);

    // Send full current room state (active creators + existing stroke history) to the joining client
    socket.emit("sketch_room_init", {
      users: Array.from(room.users.values()),
      strokes: room.strokes,
      selfColor: assignedColor,
    });

    // Notify other room participants
    socket.to(roomId).emit("sketch_room_users", Array.from(room.users.values()));
  });

  socket.on("sketch_stroke", ({ roomId, stroke }) => {
    if (!roomId || !stroke) return;
    const room = sketchRooms.get(roomId);
    if (room) {
      room.strokes.push(stroke);
      if (room.strokes.length > 2500) {
        room.strokes.splice(0, 500); // Maintain bounded buffer
      }
    }
    socket.to(roomId).emit("sketch_stroke", stroke);
  });

  socket.on("sketch_clear", ({ roomId }) => {
    if (!roomId) return;
    const room = sketchRooms.get(roomId);
    if (room) {
      room.strokes = [];
    }
    socket.to(roomId).emit("sketch_clear");
  });

  socket.on("sketch_cursor", ({ roomId, cursor }) => {
    if (!roomId || !cursor) return;
    socket.to(roomId).emit("sketch_cursor", cursor);
  });

  socket.on("leave_sketch_room", ({ roomId }) => {
    if (!roomId) return;
    socket.leave(roomId);
    const room = sketchRooms.get(roomId);
    if (room) {
      room.users.delete(socket.id);
      if (room.users.size === 0) {
        sketchRooms.delete(roomId);
      } else {
        socket.to(roomId).emit("sketch_room_users", Array.from(room.users.values()));
      }
    }
  });

  socket.on("disconnect", () => {
    if (socket.currentSketchRoom) {
      const room = sketchRooms.get(socket.currentSketchRoom);
      if (room) {
        room.users.delete(socket.id);
        if (room.users.size === 0) {
          sketchRooms.delete(socket.currentSketchRoom);
        } else {
          socket.to(socket.currentSketchRoom).emit("sketch_room_users", Array.from(room.users.values()));
        }
      }
    }
  });
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
    }

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
