const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const Post = require("../models/Post");

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(400).json({ message: "Email already exists" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ user });
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("luminix_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Signin successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage, 
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/profile/upload",
  authMiddleware,
  upload.single("profile"),
  async (req, res) => {
    try {
      const imagePath = `/uploads/${req.file.filename}`;

      await User.findByIdAndUpdate(req.user.id, {
        profileImage: imagePath,
      });

      res.json({ imagePath });
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.post("/post", upload.single("file_url"), async(req, res) => {
  const token = req.cookies.luminix_token;

  if(!token) return res.status(401).json({ message: "Not logged in"});

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const author = decoded.id;

    const { caption, tags, target, file_name } = req.body;

    if(!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const file_url = `/uploads/${req.file.filename}`;

    const user = await User.findById(author);
    if(!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const postUpload = await Post.create({
      author,
      username: user.name,
      email: user.email,
      caption: caption || "",
      tags: tags ? JSON.parse(tags) : [],
      target: target || "public",
      file_url,
      file_name: file_name || req.file.originalname
    });

    res.status(201).json({
      message: "Post uploaded successfully",
      post: postUpload
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Post upload failed" });
  }
});

router.get("/posts", async (req, res) => {
  try{
    const token = req.cookies.luminix_token;
    let currentUserId = null;

    if(token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id;
      } catch(err) {
        console.log("Invalid token");
      }
    }

    const posts = await Post.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    const postsWithData = posts.map(post => ({
      _id: post._id,
      username: post.username,
      email: post.email,
      target: post.target,
      file_url: post.file_url,
      file_name: post.file_name,
      caption: post.caption,
      tags: post.tags,
      upload_time: post.createdAt,
      likes: post.likes.length,
      reposts: post.reposts.length,
      shares: post.shares,
      views: post.views
    }));

    res.status(200).json({
      message: "Posts fetched successfully",
      posts: postsWithData
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

router.get("/contacts", async (req, res) => {
  try {
    const token = req.cookies.luminix_token;
    let currentUserId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id;
      } catch (err) {
        console.log("Invalid token");
      }
    }

    const query = currentUserId ? { _id: { $ne: currentUserId } } : {};
    const contacts = await User.find(query)
      .select("-password")
      .populate("followers", "name")
      .populate("following", "name");

    res.status(200).json(contacts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("luminix_token");
  res.json({ message: "Logged out" });
});

module.exports = router;