const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const Post = require("../models/Post");
const Collection = require("../models/Collection");

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

router.post("/post", upload.any(), async (req, res) => {
  const token = req.cookies.luminix_token;

  if (!token) return res.status(401).json({ message: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const author = decoded.id;

    const { caption, tags, target, file_name, remix_of, remix_type, process_steps_meta } = req.body;

    const files = req.files || [];
    // The main post file is either the one named "file_url" or the first file uploaded
    const mainFile = files.find(f => f.fieldname === "file_url") || files[0];

    if (!mainFile) {
      return res.status(400).json({ message: "Main post file is required" });
    }

    const file_url = `/uploads/${mainFile.filename}`;

    const user = await User.findById(author);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Process WIP shots if any
    let processSteps = [];
    if (process_steps_meta) {
      try {
        const parsedMeta = JSON.parse(process_steps_meta);
        if (Array.isArray(parsedMeta)) {
          processSteps = parsedMeta.map((step, index) => {
            // Find corresponding uploaded file for this step
            const stepFile = files.find(f => f.fieldname === `process_step_${index}`);
            return {
              step_number: index + 1,
              phase_label: step.phase_label || `Step ${index + 1}`,
              caption: step.caption || "",
              file_url: stepFile ? `/uploads/${stepFile.filename}` : (step.file_url || "")
            };
          }).filter(step => step.file_url);
        }
      } catch (parseErr) {
        console.error("Failed to parse process_steps_meta:", parseErr);
      }
    }

    // Prepare post document
    const postData = {
      author,
      username: user.name,
      email: user.email,
      caption: caption || "",
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      target: target || "public",
      file_url,
      file_name: file_name || mainFile.originalname,
      process_steps: processSteps,
      remix_type: remix_type || "Remix"
    };

    if (remix_of) {
      postData.remix_of = remix_of;
    }

    const postUpload = await Post.create(postData);

    // If this is a remix of another post, increment parent post's remix_count
    if (remix_of) {
      await Post.findByIdAndUpdate(remix_of, {
        $inc: { remix_count: 1 }
      });
    }

    res.status(201).json({
      message: "Post uploaded successfully",
      post: postUpload
    });
  } catch (err) {
    console.error("Post creation error:", err);
    res.status(500).json({ message: "Post upload failed" });
  }
});

router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email profileImage lumiTag role creatorRole")
      .populate({
        path: "remix_of",
        select: "username email caption file_url createdAt tags author",
        populate: {
          path: "author",
          select: "name lumiTag profileImage"
        }
      })
      .sort({ createdAt: -1 });

    const postsWithData = posts.map(post => ({
      _id: post._id,
      author: post.author,
      username: post.username,
      email: post.email,
      target: post.target,
      file_url: post.file_url,
      file_name: post.file_name,
      caption: post.caption,
      tags: post.tags,
      upload_time: post.createdAt,
      likes: post.likes ? post.likes.length : 0,
      reposts: post.reposts ? post.reposts.length : 0,
      shares: post.shares || 0,
      views: post.views || 0,
      process_steps: post.process_steps || [],
      remix_of: post.remix_of || null,
      remix_type: post.remix_type || "Remix",
      remix_count: post.remix_count || 0
    }));

    res.status(200).json({
      message: "Posts fetched successfully",
      posts: postsWithData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

router.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email profileImage lumiTag role creatorRole")
      .populate({
        path: "remix_of",
        select: "username email caption file_url createdAt tags author",
        populate: {
          path: "author",
          select: "name lumiTag profileImage"
        }
      });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ post });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch post" });
  }
});

// Creative Remix Chains / Trees
router.get("/remix-trees", async (req, res) => {
  try {
    // Find all posts that are remixes
    const remixes = await Post.find({ remix_of: { $ne: null } })
      .populate("author", "name email profileImage lumiTag")
      .populate({
        path: "remix_of",
        select: "caption file_url username email tags author createdAt",
        populate: {
          path: "author",
          select: "name lumiTag profileImage"
        }
      })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(remixes);
  } catch (err) {
    console.error("Remix trees error:", err);
    res.status(500).json({ message: "Failed to fetch remix trees" });
  }
});

// Creator Spotlight of the Week
// Auto-picks an Emerging Creator by engagement growth rate rather than raw likes
router.get("/spotlight", async (req, res) => {
  try {
    // Find all creators
    const creators = await User.find({
      $or: [{ role: "creators" }, { role: "others" }]
    }).select("-password");

    let topCreator = null;
    let highestGrowthRate = -1;
    let featuredPost = null;

    for (const creator of creators) {
      const posts = await Post.find({ author: creator._id });
      if (posts.length === 0) continue;

      const totalLikes = posts.reduce((acc, p) => acc + (p.likes ? p.likes.length : 0), 0);
      const totalReposts = posts.reduce((acc, p) => acc + (p.reposts ? p.reposts.length : 0), 0);
      const totalShares = posts.reduce((acc, p) => acc + (p.shares || 0), 0);
      const totalProcessSteps = posts.reduce((acc, p) => acc + (p.process_steps ? p.process_steps.length : 0), 0);
      const totalRemixes = posts.reduce((acc, p) => acc + (p.remix_count || 0), 0);

      const totalInteractions = (totalLikes * 1.5) + (totalReposts * 2.5) + (totalShares * 2.0) + (totalProcessSteps * 3.0) + (totalRemixes * 4.0);
      const followerCount = creator.followers ? creator.followers.length : 0;

      // Growth rate formula: engagement per follower & recent activity velocity
      const growthRate = Math.round(
        ((totalInteractions + 15) / Math.max(1, followerCount + 2)) * 18 + (posts.length * 5)
      );

      if (growthRate > highestGrowthRate) {
        highestGrowthRate = growthRate;
        topCreator = creator;
        // Top post for this creator
        featuredPost = posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))[0];
      }
    }

    // Default fallback spotlight if no posts exist yet
    if (!topCreator) {
      return res.status(200).json({
        creator: {
          name: "Aria Vance",
          lumiTag: "@aria_visuals",
          role: "creators",
          creatorRole: "3D Motion & Generative Artist",
          profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
          bio: "Pushing spatial design and generative motion boundaries. Documenting my full creative workflows on Luminix.",
          growthRate: 312,
          spotlightBadge: true
        },
        featuredPost: {
          caption: "Bioluminescent Sanctuary (WIP to Final Render)",
          file_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
          likes: 428,
          remix_count: 14,
          process_steps_count: 4
        },
        spotlightStats: {
          growthRate: "+312%",
          period: "Week of Oct 2026",
          metricDescription: "Engagement Velocity vs Followers (Top 1% Growth)"
        }
      });
    }

    res.status(200).json({
      creator: {
        _id: topCreator._id,
        name: topCreator.name,
        lumiTag: topCreator.lumiTag || `@${topCreator.name.toLowerCase().replace(/\s+/g, '')}`,
        role: topCreator.role,
        creatorRole: topCreator.creatorRole || "Emerging Digital Creator",
        profileImage: topCreator.profileImage || "",
        bio: topCreator.bio || "Creative innovator on Luminix.",
        growthRate: highestGrowthRate,
        spotlightBadge: true
      },
      featuredPost: featuredPost ? {
        _id: featuredPost._id,
        caption: featuredPost.caption,
        file_url: featuredPost.file_url,
        likes: featuredPost.likes ? featuredPost.likes.length : 0,
        remix_count: featuredPost.remix_count || 0,
        process_steps_count: featuredPost.process_steps ? featuredPost.process_steps.length : 0
      } : null,
      spotlightStats: {
        growthRate: `+${highestGrowthRate}%`,
        period: "Week of Oct 2026",
        metricDescription: "Engagement Velocity vs Follower Baseline"
      }
    });
  } catch (err) {
    console.error("Spotlight error:", err);
    res.status(500).json({ message: "Failed to generate creator spotlight" });
  }
});

// Collections / Moodboards Routes
router.get("/collections", authMiddleware, async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user.id })
      .populate("posts", "file_url file_name caption username")
      .sort({ updatedAt: -1 });

    res.status(200).json({ collections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch collections" });
  }
});

router.post("/collections", authMiddleware, async (req, res) => {
  try {
    const { name, description, isPrivate, colorTheme, initialPostId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Moodboard name is required" });
    }

    const posts = initialPostId ? [initialPostId] : [];

    const newCollection = await Collection.create({
      user: req.user.id,
      name: name.trim(),
      description: description ? description.trim() : "",
      isPrivate: Boolean(isPrivate),
      colorTheme: colorTheme || "#8b5cf6",
      posts
    });

    res.status(201).json({
      message: "Collection created successfully",
      collection: newCollection
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create collection" });
  }
});

router.post("/collections/:id/toggle-post", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const collection = await Collection.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const postIndex = collection.posts.indexOf(postId);
    let action = "added";

    if (postIndex > -1) {
      // Remove from collection
      collection.posts.splice(postIndex, 1);
      action = "removed";
    } else {
      // Add to collection
      collection.posts.push(postId);
    }

    await collection.save();

    res.status(200).json({
      message: `Post ${action} collection successfully`,
      action,
      collection
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update collection" });
  }
});

router.delete("/collections/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Collection.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.status(200).json({ message: "Collection deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete collection" });
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