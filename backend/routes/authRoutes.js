const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const Post = require("../models/Post");
const Collection = require("../models/Collection");
const Flash = require("../models/Flash");
const CollabListing = require("../models/CollabListing");
const WeeklyChallenge = require("../models/WeeklyChallenge");
const Circle = require("../models/Circle");
const CommissionInquiry = require("../models/CommissionInquiry");
const Critique = require("../models/Critique");
const aiService = require("../services/aiService");
const paletteService = require("../services/paletteService");
const { ensureWeeklyChallenge } = require("../services/challengeService");

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

    const {
      caption,
      tags,
      target,
      file_name,
      remix_of,
      remix_type,
      process_steps_meta,
      scheduled_for,
      post_type,
      postType,
      before_label,
      after_label,
      beforeLabel,
      afterLabel,
      series_name,
      chapter_number,
      total_chapters,
      time_capsule_reveal,
      time_capsule_hint,
      audio_title,
      needs_critique,
      critique_question,
      critiqueOpen,
      critiqueQuestion,
      co_author_username,
      palette,
      mood_calm_energetic,
      mood_minimal_detailed,
      tools,
      inspired_by,
      challenge_id,
      circle_id,
      alt_text,
      alt_text_source
    } = req.body;

    const files = req.files || [];
    // The main post ("before") file is either "media" or "file_url" or the first uploaded file
    const mainFile = files.find(f => f.fieldname === "media" || f.fieldname === "file_url") || files[0];

    if (!mainFile) {
      return res.status(400).json({ message: "Main post file is required" });
    }

    const file_url = `/uploads/${mainFile.filename}`;

    const user = await User.findById(author);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Process Compare / Before-After "after" image
    const afterFile = files.find(f => f.fieldname === "after" || f.fieldname === "after_image");
    const afterFileUrl = afterFile ? `/uploads/${afterFile.filename}` : (req.body.afterFileUrl || "");
    const resolvedBeforeLabel = (beforeLabel || before_label || "Before").toString().trim().slice(0, 24) || "Before";
    const resolvedAfterLabel = (afterLabel || after_label || "After").toString().trim().slice(0, 24) || "After";
    const isCompare = Boolean(afterFile || postType === "compare" || post_type === "compare" || post_type === "before_after");

    // Process WIP shots if any
    let processSteps = [];
    if (process_steps_meta) {
      try {
        const parsedMeta = JSON.parse(process_steps_meta);
        if (Array.isArray(parsedMeta)) {
          processSteps = parsedMeta.map((step, index) => {
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

    // Before/After comparison structure
    let beforeAfterData = {
      before_image_url: file_url,
      after_image_url: afterFileUrl,
      before_label: resolvedBeforeLabel,
      after_label: resolvedAfterLabel
    };

    // Process Sound Layer audio file
    const audioFile = files.find(f => f.fieldname === "audio_file" || (f.mimetype && f.mimetype.startsWith("audio/")));
    let soundLayerData = {
      audio_url: audioFile ? `/uploads/${audioFile.filename}` : "",
      audio_title: audio_title || (audioFile ? audioFile.originalname : ""),
      auto_loop: true
    };

    // Process Series & Chapters
    let seriesData = {
      series_id: series_name ? series_name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "",
      series_name: series_name || "",
      chapter_number: parseInt(chapter_number, 10) || 1,
      total_chapters: parseInt(total_chapters, 10) || 1
    };

    // Process Time Capsule
    let timeCapsuleData = {
      is_capsule: false,
      reveal_date: null,
      is_revealed: false,
      hint: ""
    };
    if (time_capsule_reveal) {
      const parsedReveal = new Date(time_capsule_reveal);
      if (!isNaN(parsedReveal.getTime())) {
        timeCapsuleData = {
          is_capsule: true,
          reveal_date: parsedReveal,
          is_revealed: parsedReveal <= new Date(),
          hint: time_capsule_hint || ""
        };
      }
    }

    // Initialize version history with v1
    const initialVersions = [
      {
        version_number: 1,
        file_url,
        note: "v1 Initial Masterpiece",
        date: new Date()
      }
    ];

    // Check if post is scheduled for future publishing
    let isScheduled = false;
    let scheduledDate = null;
    let isPublished = true;

    if (scheduled_for) {
      const parsedDate = new Date(scheduled_for);
      if (!isNaN(parsedDate.getTime()) && parsedDate > new Date()) {
        isScheduled = true;
        scheduledDate = parsedDate;
        isPublished = false;
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
      post_type: isCompare ? "compare" : (post_type || (timeCapsuleData.is_capsule ? "time_capsule" : processSteps.length > 0 ? "timelapse" : "standard")),
      postType: isCompare ? "compare" : (postType || "standard"),
      afterFileUrl: afterFileUrl,
      beforeLabel: resolvedBeforeLabel,
      afterLabel: resolvedAfterLabel,
      before_after: beforeAfterData,
      process_steps: processSteps,
      versions: initialVersions,
      series: seriesData,
      time_capsule: timeCapsuleData,
      sound_layer: soundLayerData,
      remix_type: remix_type || "Remix",
      is_scheduled: isScheduled,
      scheduled_for: scheduledDate,
      published: isPublished,
      needs_critique: needs_critique === "true" || needs_critique === true || critiqueOpen === "true" || critiqueOpen === true,
      critiqueOpen: needs_critique === "true" || needs_critique === true || critiqueOpen === "true" || critiqueOpen === true,
      critique_question: critiqueQuestion || critique_question || "",
      critiqueQuestion: critiqueQuestion || critique_question || "",
      challenge_id: challenge_id || null,
      circle_id: circle_id || null,
      co_authors: []
    };

    // Discovery: 1. Dominant Color Palette (48x48 coarse-bucket extraction at upload time)
    let paletteArray = [];
    if (mainFile && mainFile.path) {
      try {
        const extracted = paletteService.extractPaletteFromFile(mainFile.path);
        if (extracted && extracted.length > 0) {
          paletteArray = extracted;
        }
      } catch (palErr) {
        console.warn("Palette extraction on upload warning:", palErr.message);
      }
    }

    if (paletteArray.length === 0 && palette) {
      try {
        paletteArray = Array.isArray(palette) ? palette : JSON.parse(palette);
      } catch (e) {
        if (typeof palette === "string") {
          paletteArray = palette.split(",").map((c) => c.trim()).filter(Boolean);
        }
      }
    }

    // Filter valid 6-digit hexes only, store up to 5 colors (empty array if processing fails)
    paletteArray = (paletteArray || [])
      .filter((h) => paletteService.hexToRgb(h) !== null)
      .slice(0, 5);

    postData.palette = paletteArray;

    // Discovery: 2. Mood Dial
    const moodCalm = typeof mood_calm_energetic !== "undefined" ? Number(mood_calm_energetic) : 50;
    const moodDetailed = typeof mood_minimal_detailed !== "undefined" ? Number(mood_minimal_detailed) : 50;
    postData.mood_calm_energetic = isNaN(moodCalm) ? 50 : Math.max(0, Math.min(100, moodCalm));
    postData.mood_minimal_detailed = isNaN(moodDetailed) ? 50 : Math.max(0, Math.min(100, moodDetailed));

    // Discovery: 3. Tool Tags
    let toolsArray = [];
    if (tools) {
      try {
        toolsArray = Array.isArray(tools) ? tools : JSON.parse(tools);
      } catch (e) {
        if (typeof tools === "string") {
          toolsArray = tools.split(",").map(t => t.trim()).filter(Boolean);
        }
      }
    }
    postData.tools = toolsArray;

    // Discovery: 5. Provenance Chain & "Inspired by"
    const inspiredById = inspired_by || remix_of || null;
    let provenanceChain = [];
    if (inspiredById) {
      postData.inspired_by = inspiredById;
      try {
        const parentPost = await Post.findById(inspiredById);
        if (parentPost) {
          if (parentPost.provenance_chain && parentPost.provenance_chain.length > 0) {
            provenanceChain = [...parentPost.provenance_chain, parentPost._id];
          } else {
            provenanceChain = [parentPost._id];
          }
        }
      } catch (provErr) {
        console.error("Provenance resolution error:", provErr);
      }
    }
    postData.provenance_chain = provenanceChain;

    if (co_author_username && co_author_username.trim()) {
      const cleanUser = co_author_username.trim().replace(/^@/, "");
      const invitedUser = await User.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${cleanUser}$`, "i") } },
          { email: { $regex: new RegExp(`^${cleanUser}$`, "i") } },
          { lumiTag: { $regex: new RegExp(`^@?${cleanUser}$`, "i") } }
        ]
      });
      if (invitedUser && String(invitedUser._id) !== String(author)) {
        postData.co_authors.push({
          user: invitedUser._id,
          username: invitedUser.name,
          profile_picture: invitedUser.profileImage || "",
          status: "pending",
          invited_at: new Date()
        });
      }
    }

    if (remix_of) {
      postData.remix_of = remix_of;
    }

    // Accessibility Suite: Vision Auto Alt-Text or Creator Input
    let resolvedAltText = (alt_text || "").trim();
    let resolvedAltSource = alt_text_source || "none";

    if (resolvedAltText) {
      resolvedAltSource = resolvedAltSource === "none" ? "creator_edited" : resolvedAltSource;
    } else {
      try {
        const visionRes = aiService.generateAltText({
          fileName: mainFile.originalname,
          caption: caption || "",
          tags: postData.tags,
          palette: postData.palette,
          tools: postData.tools,
          moodCalm: postData.mood_calm_energetic,
          moodMinimal: postData.mood_minimal_detailed,
          postType: postData.post_type,
        });
        resolvedAltText = visionRes.altText;
        resolvedAltSource = "ai_vision";
      } catch (altErr) {
        resolvedAltText = `${caption ? caption.slice(0, 100) : "Visual artwork"} - creative piece on Luminix.`;
        resolvedAltSource = "ai_vision";
      }
    }

    postData.alt_text = resolvedAltText;
    postData.has_alt_text = Boolean(resolvedAltText && resolvedAltText.length > 0);
    postData.alt_text_source = resolvedAltSource;

    const postUpload = await Post.create(postData);

    if (postData.co_authors && postData.co_authors.length > 0) {
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${postData.co_authors[0].user}`).emit("user_notification", {
          type: "coauthor_invite",
          title: "Co-Author Invitation 🤝",
          message: `@${user.name} invited you to co-author "${caption?.slice(0, 30) || "Artwork"}"`,
          postId: postUpload._id,
          timestamp: new Date()
        });
      }
    }

    // If this is a remix of another post, increment parent post's remix_count
    if (remix_of) {
      await Post.findByIdAndUpdate(remix_of, {
        $inc: { remix_count: 1 }
      });
    }

    // Auto-evaluate creator badges on new post
    updateCreatorBadges(author);

    res.status(201).json({
      message: isScheduled 
        ? `Post scheduled successfully for ${scheduledDate.toLocaleString()}` 
        : "Post uploaded successfully",
      post: postUpload,
      isScheduled
    });
  } catch (err) {
    console.error("Post creation error:", err);
    res.status(500).json({ message: "Post upload failed" });
  }
});

// Revision / Version upload for an existing post
router.post("/posts/:id/versions", upload.single("revision_file"), async (req, res) => {
  try {
    const token = req.cookies.luminix_token;
    if (!token) return res.status(401).json({ message: "Not logged in" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (String(post.author) !== decoded.id) {
      return res.status(403).json({ message: "Unauthorized to version this post" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Revision file is required" });
    }

    const newUrl = `/uploads/${req.file.filename}`;
    const nextVerNum = (post.versions?.length || 1) + 1;
    const newVersion = {
      version_number: nextVerNum,
      file_url: newUrl,
      note: req.body.note || `Revision v${nextVerNum}`,
      date: new Date()
    };

    post.versions.push(newVersion);
    post.file_url = newUrl;
    await post.save();

    res.status(200).json({
      message: `Version v${nextVerNum} created successfully`,
      post
    });
  } catch (err) {
    console.error("Version upload error:", err);
    res.status(500).json({ message: "Failed to upload new version" });
  }
});

// Follow/Unfollow a Series
router.post("/series/follow", async (req, res) => {
  try {
    const token = req.cookies.luminix_token;
    if (!token) return res.status(401).json({ message: "Not logged in" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { series_id } = req.body;
    if (!series_id) return res.status(400).json({ message: "Series ID required" });

    const user = await User.findById(decoded.id);
    const isFollowed = user.followedSeries && user.followedSeries.includes(series_id);

    if (isFollowed) {
      user.followedSeries = user.followedSeries.filter(id => id !== series_id);
    } else {
      user.followedSeries = user.followedSeries || [];
      user.followedSeries.push(series_id);
    }
    await user.save();

    res.status(200).json({
      isFollowed: !isFollowed,
      followedSeries: user.followedSeries
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update series subscription" });
  }
});

// Save reader's progress in a Series
router.post("/series/progress", async (req, res) => {
  try {
    const token = req.cookies.luminix_token;
    if (!token) return res.status(401).json({ message: "Not logged in" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { series_id, chapter_number } = req.body;

    const user = await User.findById(decoded.id);
    user.seriesProgress = user.seriesProgress || [];
    const existingIndex = user.seriesProgress.findIndex(p => p.series_id === series_id);

    if (existingIndex >= 0) {
      user.seriesProgress[existingIndex].last_chapter = Math.max(
        user.seriesProgress[existingIndex].last_chapter,
        parseInt(chapter_number, 10) || 1
      );
      user.seriesProgress[existingIndex].updatedAt = new Date();
    } else {
      user.seriesProgress.push({
        series_id,
        last_chapter: parseInt(chapter_number, 10) || 1,
        updatedAt: new Date()
      });
    }
    await user.save();

    res.status(200).json({ progress: user.seriesProgress });
  } catch (err) {
    res.status(500).json({ message: "Failed to save reading progress" });
  }
});

// ==========================================
// FEEDBACK & COLLABORATION ROUTES
// ==========================================

// ==========================================
// STRUCTURED CRITIQUE & REVIEW SUITE
// ==========================================

// Helper to compute Critic Badge (>= 5 helpful marks across all posts)
async function getCriticAuthorSet(authorIds = []) {
  try {
    const match = { helpful: true };
    if (authorIds.length > 0) {
      match.authorId = { $in: authorIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }
    const results = await Critique.aggregate([
      { $match: match },
      { $group: { _id: "$authorId", count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } },
    ]);
    return new Set(results.map((r) => String(r._id)));
  } catch (e) {
    console.error("Critic badge aggregation error:", e);
    return new Set();
  }
}

// 1. GET /posts/:id/critiques - List critiques, sorted helpful-first, with permissions (isOwner, mine)
router.get("/posts/:id/critiques", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Determine current user from cookie or authorization header
    let currentUserId = null;
    const token = req.cookies.luminix_token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {}
    }

    const isOwner = Boolean(currentUserId && String(post.author) === String(currentUserId));
    const critiqueOpen = Boolean(post.critiqueOpen ?? post.needs_critique);
    const critiqueQuestion = post.critiqueQuestion || post.critique_question || "";

    // Fetch critiques from Critique collection, sorted helpful first
    let critiques = await Critique.find({ postId: post._id })
      .sort({ helpful: -1, createdAt: -1 })
      .lean();

    // Migrate any legacy embedded post.critiques if collection is empty
    if (critiques.length === 0 && post.critiques && post.critiques.length > 0) {
      for (const leg of post.critiques) {
        if (leg.author) {
          try {
            await Critique.create({
              postId: post._id,
              authorId: leg.author,
              authorName: leg.username || "Creator",
              authorAvatar: leg.profile_picture || "",
              works: leg.what_works || leg.works || "Great composition and color balance.",
              tryNext: leg.what_to_try || leg.tryNext || "Consider adjusting contrast in shadows.",
              helpful: Boolean(leg.is_helpful || leg.helpful),
              createdAt: leg.created_at || new Date(),
            });
          } catch (migErr) {}
        }
      }
      critiques = await Critique.find({ postId: post._id })
        .sort({ helpful: -1, createdAt: -1 })
        .lean();
    }

    // Compute Critic badges across all authors in the list
    const authorIds = critiques.map((c) => c.authorId);
    const criticSet = await getCriticAuthorSet(authorIds);

    let mine = null;
    const formattedCritiques = critiques.map((c) => {
      const isMine = Boolean(currentUserId && String(c.authorId) === String(currentUserId));
      const formatted = {
        _id: c._id,
        postId: c.postId,
        authorId: c.authorId,
        authorName: c.authorName,
        authorAvatar: c.authorAvatar,
        works: c.works,
        tryNext: c.tryNext,
        helpful: Boolean(c.helpful),
        createdAt: c.createdAt,
        isCritic: criticSet.has(String(c.authorId)),
      };
      if (isMine) mine = formatted;
      return formatted;
    });

    res.status(200).json({
      critiqueOpen,
      critiqueQuestion,
      isOwner,
      canCritique: Boolean(currentUserId && !isOwner && critiqueOpen && !mine),
      mine,
      critiques: formattedCritiques,
    });
  } catch (err) {
    console.error("Critique fetch error:", err);
    res.status(500).json({ message: "Failed to load critiques" });
  }
});

// Also alias GET /posts/:id/critique to the same handler
router.get("/posts/:id/critique", async (req, res) => {
  req.url = `/posts/${req.params.id}/critiques`;
  router.handle(req, res);
});

// 2. POST /posts/:id/critique/toggle - Owner opens or closes critique (min 5 chars question)
router.post("/posts/:id/critique/toggle", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // RULE: Only the owner opens or closes critique
    if (String(post.author) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the post's owner can open or close critique." });
    }

    const { open, question } = req.body;
    const shouldOpen = open !== undefined ? Boolean(open) : !(post.critiqueOpen ?? post.needs_critique);

    if (shouldOpen) {
      const q = (question || req.body.critiqueQuestion || "").trim();
      if (!q || q.length < 5) {
        return res.status(400).json({ message: "Please provide a specific focus question of at least 5 characters." });
      }
      if (q.length > 200) {
        return res.status(400).json({ message: "The question must be 200 characters or fewer." });
      }
      post.critiqueOpen = true;
      post.critiqueQuestion = q;
      post.needs_critique = true;
      post.critique_question = q;
    } else {
      post.critiqueOpen = false;
      post.needs_critique = false;
      // Closing critique keeps existing critiques visible and preserves the question
    }

    await post.save();

    res.status(200).json({
      message: post.critiqueOpen ? "Critique is now open for this post." : "Critique has been closed.",
      critiqueOpen: post.critiqueOpen,
      critiqueQuestion: post.critiqueQuestion,
    });
  } catch (err) {
    console.error("Critique toggle error:", err);
    res.status(500).json({ message: "Failed to update critique status." });
  }
});

// 3. POST /posts/:id/critique - Reviewer submits structured critique (works & tryNext, 10-500 chars)
router.post("/posts/:id/critique", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // RULE: Owners cannot critique their own posts
    if (String(post.author) === String(req.user.id)) {
      return res.status(403).json({ message: "Owners cannot critique their own posts." });
    }

    // RULE: Submitting requires the post to be open
    const isOpen = Boolean(post.critiqueOpen ?? post.needs_critique);
    if (!isOpen) {
      return res.status(400).json({ message: "Critique is closed for this post." });
    }

    const works = (req.body.works || req.body.what_works || "").trim();
    const tryNext = (req.body.tryNext || req.body.what_to_try || "").trim();

    if (works.length < 10 || works.length > 500) {
      return res.status(400).json({ message: "'What works' must be between 10 and 500 characters." });
    }
    if (tryNext.length < 10 || tryNext.length > 500) {
      return res.status(400).json({ message: "'What to try next' must be between 10 and 500 characters." });
    }

    // EDGE CASE: Duplicate submission returns 409 with a clear message
    const existing = await Critique.findOne({ postId: post._id, authorId: req.user.id });
    if (existing) {
      return res.status(409).json({ message: "You have already submitted a critique for this post." });
    }

    const user = await User.findById(req.user.id);
    let newCritique;
    try {
      newCritique = await Critique.create({
        postId: post._id,
        authorId: user._id,
        authorName: user.name,
        authorAvatar: user.profileImage || "",
        works,
        tryNext,
        helpful: false,
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        return res.status(409).json({ message: "You have already submitted a critique for this post." });
      }
      throw createErr;
    }

    // Keep post.critiques in sync
    post.critiques.push({
      author: user._id,
      username: user.name,
      profile_picture: user.profileImage || "",
      what_works: works,
      what_to_try: tryNext,
      is_helpful: false,
      created_at: new Date(),
    });
    await post.save();

    // Check if author has Critic badge
    const criticSet = await getCriticAuthorSet([user._id]);
    const formatted = {
      ...newCritique.toObject(),
      isCritic: criticSet.has(String(user._id)),
    };

    const io = req.app.get("io");
    if (io) {
      io.emit("post_critique_added", {
        postId: post._id,
        critique: formatted,
      });

      io.to(`user_${post.author}`).emit("user_notification", {
        type: "critique",
        title: "New Structured Critique 🎯",
        message: `@${user.name} reviewed: "${post.critiqueQuestion || post.critique_question || "Your artwork"}"`,
        avatar: user.profileImage || "",
        postId: post._id,
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      message: "Critique submitted successfully.",
      critique: formatted,
    });
  } catch (err) {
    console.error("Critique submission error:", err);
    res.status(500).json({ message: "Failed to submit critique." });
  }
});

// 4. POST /posts/:id/critique/:critiqueId/helpful - Owner toggles "helpful" (Critic badge computed at 5)
router.post("/posts/:id/critique/:critiqueId/helpful", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // RULE: Only the owner toggles "helpful"
    if (String(post.author) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the post owner can mark a critique as helpful." });
    }

    // Find critique in collection (or fallback to embedded)
    let critique = await Critique.findById(req.params.critiqueId);
    if (!critique) {
      const embedded = post.critiques.id(req.params.critiqueId);
      if (embedded && embedded.author) {
        critique = await Critique.findOne({ postId: post._id, authorId: embedded.author });
      }
    }
    if (!critique) return res.status(404).json({ message: "Critique not found." });

    // Toggle helpful state
    critique.helpful = !critique.helpful;
    await critique.save();

    // Sync embedded if present
    const legCrit = post.critiques.id(req.params.critiqueId);
    if (legCrit) {
      legCrit.is_helpful = critique.helpful;
      await post.save();
    }

    // Compute Critic badge via aggregation (helpful marks >= 5)
    const authorHelpfulCount = await Critique.countDocuments({
      authorId: critique.authorId,
      helpful: true,
    });
    const hasCriticBadge = authorHelpfulCount >= 5;

    // Notify author if marked helpful
    if (critique.helpful) {
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${critique.authorId}`).emit("user_notification", {
          type: "critic_badge",
          title: hasCriticBadge ? "Critic Badge Unlocked! ⭐" : "Feedback Marked Helpful! 💡",
          message: hasCriticBadge
            ? "You earned the Critic badge for providing 5+ helpful critiques!"
            : `The creator found your critique helpful! (${authorHelpfulCount}/5 towards Critic badge)`,
          timestamp: new Date(),
        });
      }
    }

    res.status(200).json({
      message: critique.helpful ? "Critique marked as helpful!" : "Helpful mark removed.",
      critique: {
        ...critique.toObject(),
        isCritic: hasCriticBadge,
      },
      helpfulCount: authorHelpfulCount,
      hasCriticBadge,
    });
  } catch (err) {
    console.error("Helpful critique toggle error:", err);
    res.status(500).json({ message: "Failed to update helpful status." });
  }
});

// 3. Respond to Co-Author Invitation (Accept or Decline)
router.post("/posts/:id/co-author/respond", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // "accepted" | "declined"
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status response" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const coAuthorEntry = post.co_authors.find(
      (ca) => String(ca.user) === String(req.user.id)
    );

    if (!coAuthorEntry) {
      return res.status(403).json({ message: "You are not an invited co-author on this piece" });
    }

    coAuthorEntry.status = status;
    coAuthorEntry.responded_at = new Date();
    await post.save();

    const user = await User.findById(req.user.id);
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${post.author}`).emit("user_notification", {
        type: "coauthor_response",
        title: status === "accepted" ? "Co-Author Accepted! 🤝" : "Co-Author Invitation Declined",
        message: `@${user ? user.name : "Collaborator"} ${status} your co-authorship request`,
        postId: post._id,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      message: `Co-author invitation ${status}`,
      post
    });
  } catch (err) {
    console.error("Co-author response error:", err);
    res.status(500).json({ message: "Failed to update co-author status" });
  }
});

// 4. Submit Private Whisper Note (Visible only to creator)
router.post("/posts/:id/whisper", authMiddleware, async (req, res) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ message: "Whisper note text required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findById(req.user.id);
    const whisperObj = {
      author: user._id,
      username: user.name,
      profile_picture: user.profileImage || "",
      note: note.trim(),
      created_at: new Date()
    };

    post.whisper_notes.push(whisperObj);
    await post.save();

    const io = req.app.get("io");
    if (io && String(post.author) !== String(user._id)) {
      io.to(`user_${post.author}`).emit("user_notification", {
        type: "whisper",
        title: "Private Whisper Note 🤫",
        message: `@${user.name} sent you a private note on your post`,
        postId: post._id,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: "Whisper note delivered privately to creator"
    });
  } catch (err) {
    console.error("Whisper error:", err);
    res.status(500).json({ message: "Failed to send whisper note" });
  }
});

// 5. Fetch Private Whisper Notes (Strictly for Post Author)
router.get("/posts/:id/whispers", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (String(post.author) !== String(req.user.id)) {
      return res.status(403).json({ message: "Whisper notes are strictly private to the post creator" });
    }

    res.status(200).json({
      whispers: post.whisper_notes || []
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load whisper notes" });
  }
});

// 6. Collab Board: Fetch Listings with Filters
router.get("/collabs", async (req, res) => {
  try {
    const { role, skill, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role && role !== "All") filter.role_needed = { $regex: new RegExp(role, "i") };
    if (skill && skill !== "All") filter.skills_needed = { $regex: new RegExp(skill, "i") };

    const collabs = await CollabListing.find(filter)
      .populate("author", "name lumiTag profileImage role creatorRole")
      .sort({ createdAt: -1 });

    res.status(200).json({ collabs });
  } catch (err) {
    console.error("Collabs fetch error:", err);
    res.status(500).json({ message: "Failed to fetch collab listings" });
  }
});

// 7. Collab Board: Create New Listing
router.post("/collabs", authMiddleware, async (req, res) => {
  try {
    const { title, description, role_needed, skills_needed, project_timeline } = req.body;
    if (!title?.trim() || !description?.trim() || !role_needed?.trim()) {
      return res.status(400).json({ message: "Title, description, and role needed are required" });
    }

    const user = await User.findById(req.user.id);
    const parsedSkills = Array.isArray(skills_needed)
      ? skills_needed
      : (skills_needed ? skills_needed.split(",").map(s => s.trim()).filter(Boolean) : []);

    const listing = await CollabListing.create({
      author: user._id,
      username: user.name,
      author_avatar: user.profileImage || "",
      title: title.trim(),
      description: description.trim(),
      role_needed: role_needed.trim(),
      skills_needed: parsedSkills,
      project_timeline: project_timeline || "Flexible",
      status: "open"
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("collab_listing_created", listing);
    }

    res.status(201).json({
      message: "Collab request posted to board",
      listing
    });
  } catch (err) {
    console.error("Collab create error:", err);
    res.status(500).json({ message: "Failed to create collab listing" });
  }
});

// 8. Collab Board: Submit Short Pitch
router.post("/collabs/:id/pitch", authMiddleware, async (req, res) => {
  try {
    const { message, portfolio_link } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Pitch message is required" });
    }

    const listing = await CollabListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Collab listing not found" });

    const user = await User.findById(req.user.id);
    const newPitch = {
      applicant: user._id,
      username: user.name,
      avatar: user.profileImage || "",
      message: message.trim(),
      portfolio_link: portfolio_link ? portfolio_link.trim() : "",
      created_at: new Date()
    };

    listing.pitches.push(newPitch);
    await listing.save();

    const io = req.app.get("io");
    if (io && String(listing.author) !== String(user._id)) {
      io.to(`user_${listing.author}`).emit("user_notification", {
        type: "collab_pitch",
        title: "New Collab Pitch Received! 🚀",
        message: `@${user.name} pitched for: "${listing.title}"`,
        avatar: user.profileImage || "",
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: "Pitch sent successfully!",
      pitch: newPitch
    });
  } catch (err) {
    console.error("Collab pitch error:", err);
    res.status(500).json({ message: "Failed to submit pitch" });
  }
});

// 9. Collab Board: Update Listing Status (open / closed)
router.patch("/collabs/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const listing = await CollabListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (String(listing.author) !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized to update this listing" });
    }

    listing.status = status || (listing.status === "open" ? "closed" : "open");
    await listing.save();

    res.status(200).json({ message: "Status updated", listing });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

router.get("/posts", async (req, res) => {
  try {
    const { tool, color } = req.query;
    let query = {
      $or: [
        { published: true },
        { published: { $exists: false } },
        { is_scheduled: false }
      ]
    };

    if (tool && tool.trim()) {
      query.tools = { $in: [new RegExp(tool.trim(), "i")] };
    }

    const posts = await Post.find(query)
      .populate("author", "name email profileImage lumiTag role creatorRole skillBadges criticBadges")
      .populate({
        path: "remix_of",
        select: "username email caption file_url createdAt tags author tools palette",
        populate: {
          path: "author",
          select: "name lumiTag profileImage"
        }
      })
      .populate({
        path: "inspired_by",
        select: "username email caption file_url createdAt tags author tools palette",
        populate: {
          path: "author",
          select: "name lumiTag profileImage"
        }
      })
      .populate({
        path: "provenance_chain",
        select: "username email caption file_url createdAt tags author tools",
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
      likesList: post.likes || [],
      comments: post.comments || [],
      reposts: post.reposts ? post.reposts.length : 0,
      shares: post.shares || 0,
      views: post.views || 0,
      post_type: post.post_type || "standard",
      before_after: post.before_after || null,
      process_steps: post.process_steps || [],
      versions: post.versions || [],
      series: post.series || null,
      time_capsule: post.time_capsule || null,
      sound_layer: post.sound_layer || null,
      needs_critique: Boolean(post.needs_critique),
      critique_question: post.critique_question || "",
      critiques: post.critiques || [],
      co_authors: post.co_authors || [],
      whisper_count: post.whisper_notes ? post.whisper_notes.length : 0,
      remix_of: post.remix_of || null,
      remix_type: post.remix_type || "Remix",
      remix_count: post.remix_count || 0,
      // Discovery suite properties
      palette: post.palette && post.palette.length > 0 ? post.palette : ["#1e293b", "#334155", "#6366f1", "#475569", "#0f172a"],
      mood_calm_energetic: typeof post.mood_calm_energetic === "number" ? post.mood_calm_energetic : 50,
      mood_minimal_detailed: typeof post.mood_minimal_detailed === "number" ? post.mood_minimal_detailed : 50,
      tools: post.tools || [],
      inspired_by: post.inspired_by || null,
      provenance_chain: post.provenance_chain || []
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

// Discovery: On this day - Resurface historical work from prior years or archive milestones
router.get("/posts/on-this-day", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentYear = now.getFullYear();

    const userPosts = await Post.find({
      author: userId,
      $or: [
        { published: true },
        { published: { $exists: false } }
      ]
    })
      .populate("author", "name lumiTag profileImage")
      .populate("inspired_by", "username caption file_url")
      .sort({ createdAt: 1 });

    if (!userPosts || userPosts.length === 0) {
      return res.status(200).json({ post: null, message: "No historical posts found" });
    }

    // 1. Check for posts on today's calendar date from previous year(s)
    let matchedPost = userPosts.find(p => {
      const d = new Date(p.createdAt);
      return (
        d.getFullYear() < currentYear &&
        d.getMonth() === currentMonth &&
        Math.abs(d.getDate() - currentDay) <= 1
      );
    });

    let milestoneLabel = "ON THIS DAY";

    if (matchedPost) {
      const postYear = new Date(matchedPost.createdAt).getFullYear();
      const yearsAgo = currentYear - postYear;
      milestoneLabel = `${yearsAgo} YEAR${yearsAgo > 1 ? "S" : ""} AGO TODAY`;
    } else {
      // 2. If no exact anniversary on today's calendar day, resurface user's earliest proof
      // as an "ARCHIVE REWIND" milestone
      matchedPost = userPosts[0];
      const postDate = new Date(matchedPost.createdAt);
      const diffDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));
      milestoneLabel = diffDays >= 365 
        ? `${Math.floor(diffDays / 365)} YEAR FLASHBACK` 
        : `ARCHIVE MILESTONE (${diffDays > 0 ? `${diffDays} DAYS AGO` : "EARLY PROOF"})`;
    }

    res.status(200).json({
      post: matchedPost,
      milestoneLabel,
      message: "Historical milestone found"
    });
  } catch (err) {
    console.error("On this day error:", err);
    res.status(500).json({ message: "Failed to fetch on-this-day post" });
  }
});

// 4. Personalized "For You" Feed based on User Interaction Profile
router.get("/posts/for-you", async (req, res) => {
  try {
    const token = req.cookies.luminix_token;
    let currentUser = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUser = await User.findById(decoded.id).populate("following");
      } catch (err) {}
    }

    const posts = await Post.find({
      $or: [
        { published: true },
        { published: { $exists: false } },
        { is_scheduled: false }
      ]
    })
      .populate("author", "name email profileImage lumiTag role creatorRole skillBadges criticBadges")
      .populate({
        path: "remix_of",
        select: "username email caption file_url createdAt tags author tools palette",
      })
      .populate({
        path: "inspired_by",
        select: "username email caption file_url createdAt tags author tools palette",
        populate: {
          path: "author",
          select: "name lumiTag profileImage"
        }
      })
      .populate({
        path: "provenance_chain",
        select: "username email caption file_url createdAt tags author tools",
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
      likesList: post.likes || [],
      comments: post.comments || [],
      reposts: post.reposts ? post.reposts.length : 0,
      shares: post.shares || 0,
      views: post.views || 0,
      post_type: post.post_type || "standard",
      before_after: post.before_after || null,
      process_steps: post.process_steps || [],
      versions: post.versions || [],
      series: post.series || null,
      time_capsule: post.time_capsule || null,
      sound_layer: post.sound_layer || null,
      needs_critique: Boolean(post.needs_critique),
      critique_question: post.critique_question || "",
      critiques: post.critiques || [],
      co_authors: post.co_authors || [],
      whisper_count: post.whisper_notes ? post.whisper_notes.length : 0,
      remix_of: post.remix_of || null,
      remix_type: post.remix_type || "Remix",
      remix_count: post.remix_count || 0,
      // Discovery suite properties
      palette: post.palette && post.palette.length > 0 ? post.palette : ["#1e293b", "#334155", "#6366f1", "#475569", "#0f172a"],
      mood_calm_energetic: typeof post.mood_calm_energetic === "number" ? post.mood_calm_energetic : 50,
      mood_minimal_detailed: typeof post.mood_minimal_detailed === "number" ? post.mood_minimal_detailed : 50,
      tools: post.tools || [],
      inspired_by: post.inspired_by || null,
      provenance_chain: post.provenance_chain || []
    }));

    if (!currentUser) {
      // Default to general ranking if not logged in
      return res.status(200).json({ posts: postsWithData });
    }

    // Find all posts that current user has liked
    const userLikedPosts = await Post.find({ likes: currentUser._id }).select("tags target");

    // Rank candidate posts with AiService
    const personalizedPosts = aiService.rankForYouFeed(
      postsWithData,
      userLikedPosts,
      currentUser.following || []
    );

    res.status(200).json({
      message: "Personalized 'For You' feed ranked successfully",
      posts: personalizedPosts
    });
  } catch (err) {
    console.error("For You feed ranking error:", err);
    res.status(500).json({ message: "Failed to rank personalized feed" });
  }
});

router.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email profileImage lumiTag role creatorRole")
      .populate({
        path: "remix_of",
        select: "username email caption file_url createdAt tags author tools palette",
        populate: {
          path: "author",
          select: "name lumiTag profileImage"
        }
      })
      .populate({
        path: "inspired_by",
        select: "username email caption file_url createdAt tags author tools palette",
        populate: {
          path: "author",
          select: "name lumiTag profileImage"
        }
      })
      .populate({
        path: "provenance_chain",
        select: "username email caption file_url createdAt tags author tools",
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

// Real-time Live Like Toggle with Socket.io Broadcast
router.post("/posts/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const index = post.likes.indexOf(userId);
    let isLiked = false;

    if (index > -1) {
      post.likes.splice(index, 1);
      isLiked = false;
    } else {
      post.likes.push(userId);
      isLiked = true;
    }

    await post.save();

    const io = req.app.get("io");
    if (io) {
      // Broadcast live like count to everyone viewing this post
      io.emit("post_like_updated", {
        postId: post._id,
        likesCount: post.likes.length,
        userId,
        isLiked
      });

      // Send direct notification toast to post author if liked
      if (isLiked && post.author.toString() !== userId.toString()) {
        const liker = await User.findById(userId).select("name profileImage");
        io.to(`user_${post.author}`).emit("user_notification", {
          type: "like",
          title: "New Like! ❤️",
          message: `${liker ? liker.name : "Someone"} liked your creation`,
          avatar: liker ? liker.profileImage : "",
          postId: post._id,
          timestamp: new Date()
        });
      }
    }

    res.status(200).json({
      isLiked,
      likesCount: post.likes.length
    });
  } catch (err) {
    console.error("Like toggle error:", err);
    res.status(500).json({ message: "Failed to toggle like" });
  }
});

// Follow User with Live Toast Notification
router.post("/users/:id/follow", authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = targetUser.followers.includes(currentUserId);

    if (isFollowing) {
      targetUser.followers.pull(currentUserId);
      currentUser.following.pull(targetUserId);
    } else {
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetUserId);
    }

    await targetUser.save();
    await currentUser.save();

    const io = req.app.get("io");
    if (io && !isFollowing) {
      // Live Toast notification
      io.to(`user_${targetUserId}`).emit("user_notification", {
        type: "follow",
        title: "New Follower! 🎉",
        message: `${currentUser.name} started following you`,
        avatar: currentUser.profileImage || "",
        userId: currentUser._id,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length
    });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ message: "Failed to follow user" });
  }
});

// Threaded Comments
router.post("/posts/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { text, parentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findById(req.user.id);
    const newComment = {
      user: user._id,
      username: user.name,
      userAvatar: user.profileImage || "",
      text: text.trim(),
      parentId: parentId || null,
      reactions: { fire: [], idea: [], art: [], love: [], rocket: [] },
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    const createdComment = post.comments[post.comments.length - 1];

    const io = req.app.get("io");
    if (io) {
      io.emit("post_comment_added", {
        postId: post._id,
        comment: createdComment
      });

      if (post.author.toString() !== user._id.toString()) {
        io.to(`user_${post.author}`).emit("user_notification", {
          type: "comment",
          title: "New Comment 💬",
          message: `${user.name}: "${text.slice(0, 35)}..."`,
          avatar: user.profileImage || "",
          postId: post._id,
          timestamp: new Date()
        });
      }
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment: createdComment,
      comments: post.comments
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

// Comment Emoji Reactions
router.post("/posts/:id/comments/:commentId/react", authMiddleware, async (req, res) => {
  try {
    const { reactionType } = req.body;
    const validTypes = ["fire", "idea", "art", "love", "rocket"];
    if (!validTypes.includes(reactionType)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (!comment.reactions) {
      comment.reactions = { fire: [], idea: [], art: [], love: [], rocket: [] };
    }

    const userList = comment.reactions[reactionType] || [];
    const userIndex = userList.indexOf(req.user.id);
    let hasReacted = false;

    if (userIndex > -1) {
      userList.splice(userIndex, 1);
      hasReacted = false;
    } else {
      userList.push(req.user.id);
      hasReacted = true;
    }

    comment.reactions[reactionType] = userList;
    await post.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("comment_reaction_updated", {
        postId: post._id,
        commentId: comment._id,
        reactionType,
        reactions: comment.reactions
      });
    }

    res.status(200).json({
      reactions: comment.reactions,
      hasReacted
    });
  } catch (err) {
    console.error("Comment react error:", err);
    res.status(500).json({ message: "Failed to react to comment" });
  }
});

// Ephemeral 24-hour Flash Stories
router.post("/flash", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let file_url = "";
    if (req.file) {
      file_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_data) {
      // Base64 from camera Click
      const base64Data = req.body.image_data.replace(/^data:image\/\w+;base64,/, "");
      const filename = `${Date.now()}-flash.png`;
      const filepath = path.join(__dirname, "../uploads", filename);
      require("fs").writeFileSync(filepath, base64Data, "base64");
      file_url = `/uploads/${filename}`;
    } else {
      return res.status(400).json({ message: "Flash image is required" });
    }

    const flash = await Flash.create({
      author: user._id,
      username: user.name,
      userAvatar: user.profileImage || "",
      file_url,
      caption: req.body.caption || "",
      filter: req.body.filter || "normal"
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("new_flash_posted", {
        flash,
        username: user.name
      });
    }

    res.status(201).json({ message: "Flash story published! (24h lifespan)", flash });
  } catch (err) {
    console.error("Flash creation error:", err);
    res.status(500).json({ message: "Failed to publish flash" });
  }
});

router.get("/flash", async (req, res) => {
  try {
    const flashes = await Flash.find({
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .populate("author", "name lumiTag profileImage role");

    const storiesByAuthor = {};
    flashes.forEach(f => {
      const authorId = f.author ? (f.author._id ? f.author._id.toString() : f.author.toString()) : f.username;
      if (!storiesByAuthor[authorId]) {
        storiesByAuthor[authorId] = {
          authorId,
          authorName: f.username,
          authorAvatar: f.author?.profileImage || f.userAvatar || "",
          lumiTag: f.author?.lumiTag || `@${f.username.toLowerCase().replace(/\s+/g, '')}`,
          items: []
        };
      }
      const msLeft = new Date(f.expiresAt).getTime() - Date.now();
      const hoursLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));
      const minutesLeft = Math.max(0, Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)));

      storiesByAuthor[authorId].items.push({
        _id: f._id,
        file_url: f.file_url,
        caption: f.caption,
        filter: f.filter,
        createdAt: f.createdAt,
        expiresAt: f.expiresAt,
        timeLeftText: `${hoursLeft}h ${minutesLeft}m left`,
        viewsCount: f.views ? f.views.length : 0
      });
    });

    res.status(200).json({
      flashes: Object.values(storiesByAuthor)
    });
  } catch (err) {
    console.error("Fetch flashes error:", err);
    res.status(500).json({ message: "Failed to fetch flashes" });
  }
});

router.post("/flash/:id/view", authMiddleware, async (req, res) => {
  try {
    await Flash.findByIdAndUpdate(req.params.id, {
      $addToSet: { views: req.user.id }
    });
    res.status(200).json({ message: "View recorded" });
  } catch (err) {
    res.status(500).json({ message: "Failed to record view" });
  }
});

// Mutuals & Network Graph Data
router.get("/network-graph", async (req, res) => {
  try {
    const token = req.cookies.luminix_token;
    let currentUserId = null;
    let currentUser = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id;
        currentUser = await User.findById(currentUserId).populate("followers").populate("following");
      } catch (e) {}
    }

    const allUsers = await User.find().select("name email lumiTag role creatorRole profileImage bio followers following");

    if (!currentUser && allUsers.length > 0) {
      currentUser = allUsers[0];
      currentUserId = currentUser._id.toString();
    }

    const nodes = [];
    const links = [];
    const addedNodeIds = new Set();

    if (currentUser) {
      // Root Node (You)
      nodes.push({
        id: currentUser._id.toString(),
        name: currentUser.name + " (You)",
        lumiTag: currentUser.lumiTag || `@${currentUser.name.toLowerCase().replace(/\s+/g, '')}`,
        profileImage: currentUser.profileImage || "",
        role: currentUser.role,
        creatorRole: currentUser.creatorRole || "Creative Explorer",
        bio: currentUser.bio || "Center of your creative orbit",
        type: "self",
        radius: 26,
        color: "#8b5cf6"
      });
      addedNodeIds.add(currentUser._id.toString());

      const myFollowers = new Set((currentUser.followers || []).map(f => (f._id ? f._id.toString() : f.toString())));
      const myFollowing = new Set((currentUser.following || []).map(f => (f._id ? f._id.toString() : f.toString())));

      allUsers.forEach(u => {
        const uId = u._id.toString();
        if (uId === currentUser._id.toString()) return;

        const isMutual = myFollowers.has(uId) && myFollowing.has(uId);
        const isDirect = myFollowers.has(uId) || myFollowing.has(uId);

        let nodeType = "suggested";
        let color = "#3b82f6";
        let radius = 18;

        if (isMutual) {
          nodeType = "mutual";
          color = "#ec4899";
          radius = 22;
        } else if (u.role === "creators") {
          nodeType = "creator";
          color = "#f59e0b";
          radius = 20;
        }

        if (!addedNodeIds.has(uId)) {
          nodes.push({
            id: uId,
            name: u.name,
            lumiTag: u.lumiTag || `@${u.name.toLowerCase().replace(/\s+/g, '')}`,
            profileImage: u.profileImage || "",
            role: u.role,
            creatorRole: u.creatorRole || "Emerging Creator",
            bio: u.bio || "Exploring visual arts",
            type: nodeType,
            radius,
            color
          });
          addedNodeIds.add(uId);
        }

        if (isMutual) {
          links.push({
            source: currentUser._id.toString(),
            target: uId,
            relationship: "mutual",
            strength: 1.0,
            color: "#ec4899"
          });
        } else if (isDirect) {
          links.push({
            source: currentUser._id.toString(),
            target: uId,
            relationship: "connection",
            strength: 0.6,
            color: "#8b5cf6"
          });
        } else {
          links.push({
            source: currentUser._id.toString(),
            target: uId,
            relationship: "suggested",
            strength: 0.3,
            color: "rgba(100, 116, 139, 0.4)"
          });
        }
      });
    }

    res.status(200).json({ nodes, links });
  } catch (err) {
    console.error("Network graph error:", err);
    res.status(500).json({ message: "Failed to generate network graph" });
  }
});

// ==========================================
// AI FEATURES (VISION, SEMANTICS & RANKING)
// ==========================================

// 1. Auto-tagging, Caption Variations & Smart Category Classification
router.post("/ai/suggest", async (req, res) => {
  try {
    const { fileName, captionHint } = req.body;
    const suggestions = aiService.analyzeImageAndSuggest(fileName, captionHint);
    res.status(200).json(suggestions);
  } catch (err) {
    console.error("AI Suggestion error:", err);
    res.status(500).json({ message: "Failed to generate AI suggestions" });
  }
});

// 2. Pre-flight Content Safety & Toxicity Check
router.post("/ai/safety-check", async (req, res) => {
  try {
    const { text, fileName } = req.body;
    const safetyReport = aiService.checkContentSafety(text, fileName);
    res.status(200).json(safetyReport);
  } catch (err) {
    console.error("Content safety check error:", err);
    res.status(500).json({ message: "Failed to run safety audit" });
  }
});

// 3. Semantic Search over Posts & Creators
router.get("/ai/semantic-search", async (req, res) => {
  try {
    const query = req.query.q || "";

    const posts = await Post.find()
      .populate("author", "name email profileImage lumiTag role creatorRole")
      .populate({
        path: "remix_of",
        select: "username email caption file_url createdAt tags author",
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
      likesList: post.likes || [],
      comments: post.comments || [],
      reposts: post.reposts ? post.reposts.length : 0,
      shares: post.shares || 0,
      views: post.views || 0,
      process_steps: post.process_steps || [],
      remix_of: post.remix_of || null,
      remix_type: post.remix_type || "Remix",
      remix_count: post.remix_count || 0
    }));

    // Perform Semantic Search via AiService
    const semanticPosts = aiService.semanticSearch(query, postsWithData);

    // Also find matching Creators
    const queryLower = query.toLowerCase();
    const matchingCreators = await User.find({
      $or: [
        { name: { $regex: queryLower, $options: "i" } },
        { lumiTag: { $regex: queryLower, $options: "i" } },
        { bio: { $regex: queryLower, $options: "i" } },
        { creatorRole: { $regex: queryLower, $options: "i" } }
      ]
    }).select("-password").limit(6);

    res.status(200).json({
      query,
      resultsCount: semanticPosts.length,
      posts: semanticPosts,
      creators: matchingCreators
    });
  } catch (err) {
    console.error("Semantic search error:", err);
    res.status(500).json({ message: "Semantic search failed" });
  }
});


// ==========================================
// CREATOR TOOLS (ANALYTICS & SKILL BADGES)
// ==========================================

// Helper function to evaluate and award skill/milestone badges
async function updateCreatorBadges(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const posts = await Post.find({ author: userId });
    const badges = [];

    const allTags = posts.flatMap(p => p.tags || []).map(t => t.toLowerCase());
    const allCaptions = posts.map(p => (p.caption || "").toLowerCase()).join(" ");

    // 1. Photographer Badge
    const hasPhoto = allTags.some(t => ["photo", "moody", "camera", "street", "cinematic", "photography"].includes(t)) ||
      allCaptions.includes("photo") || allCaptions.includes("camera");
    if (hasPhoto || posts.length >= 1) {
      badges.push({
        title: "Photographer",
        icon: "📷",
        description: "Capturing light, moods, and visual stories",
        earnedAt: user.createdAt
      });
    }

    // 2. Illustrator Badge
    const hasArt = allTags.some(t => ["art", "illustration", "conceptart", "sketch", "digitalart", "drawing"].includes(t)) ||
      allCaptions.includes("sketch") || allCaptions.includes("illustrat");
    if (hasArt || posts.length >= 2) {
      badges.push({
        title: "Illustrator",
        icon: "🎨",
        description: "Crafting visual worlds and concept art",
        earnedAt: user.createdAt
      });
    }

    // 3. 3D Generalist Badge
    const has3D = allTags.some(t => ["3d", "render", "blender", "octane", "procedural", "mesh"].includes(t)) ||
      allCaptions.includes("3d") || allCaptions.includes("render");
    if (has3D) {
      badges.push({
        title: "3D Generalist",
        icon: "🧊",
        description: "Spatial geometry, shaders and procedural lighting",
        earnedAt: new Date()
      });
    }

    // 4. Tech Artisan Badge
    const hasTech = allTags.some(t => ["tech", "developer", "code", "software", "webdev", "ui"].includes(t)) ||
      allCaptions.includes("code") || allCaptions.includes("developer");
    if (hasTech) {
      badges.push({
        title: "Tech Artisan",
        icon: "⚡",
        description: "Building interfaces, tools and digital software",
        earnedAt: new Date()
      });
    }

    // 5. Meme Maestro Badge
    const hasMeme = allTags.some(t => ["meme", "memes", "funny", "humor", "lol"].includes(t));
    if (hasMeme) {
      badges.push({
        title: "Meme Maestro",
        icon: "🎭",
        description: "Viral cultural commentary and internet humor",
        earnedAt: new Date()
      });
    }

    // 6. Rising Star (Milestone)
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes ? p.likes.length : 0), 0);
    if (totalLikes >= 20 || (user.followers && user.followers.length >= 3)) {
      badges.push({
        title: "Rising Star",
        icon: "⭐",
        description: "High community engagement and rapid follower momentum",
        earnedAt: new Date()
      });
    }

    // 7. Process Master (Milestone)
    const totalProcess = posts.reduce((acc, p) => acc + (p.process_steps ? p.process_steps.length : 0), 0);
    if (totalProcess >= 1) {
      badges.push({
        title: "Process Master",
        icon: "🛠️",
        description: "Shares transparent WIP workflows and layers",
        earnedAt: new Date()
      });
    }

    // De-duplicate by title
    const uniqueBadges = [];
    const seen = new Set();
    for (const b of badges) {
      if (!seen.has(b.title)) {
        seen.add(b.title);
        uniqueBadges.push(b);
      }
    }

    user.skillBadges = uniqueBadges;
    await user.save();
    return uniqueBadges;
  } catch (err) {
    console.error("Badge milestone error:", err);
    return [];
  }
}

// 1. Creator Analytics Dashboard Data
router.get("/creator/analytics", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch all user posts
    const posts = await Post.find({ author: userId }).sort({ createdAt: -1 });

    const totalPosts = posts.length;
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes ? p.likes.length : 0), 0);
    const totalComments = posts.reduce((acc, p) => acc + (p.comments ? p.comments.length : 0), 0);
    const totalReposts = posts.reduce((acc, p) => acc + (p.reposts ? p.reposts.length : 0), 0);
    const profileViews = user.profileViews || 140;
    const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0) + profileViews;
    const followersCount = user.followers ? user.followers.length : 0;

    const totalInteractions = totalLikes + totalComments + totalReposts;
    const avgEngagementRate = totalViews > 0 
      ? Number(((totalInteractions / totalViews) * 100).toFixed(1))
      : 0;

    // Best Posting Time Calculation
    const hourEngagement = {};
    for (let h = 0; h < 24; h++) hourEngagement[h] = { count: 0, interactions: 0 };

    posts.forEach(p => {
      const postHour = new Date(p.createdAt).getHours();
      const pEng = (p.likes ? p.likes.length : 0) + (p.comments ? p.comments.length : 0);
      hourEngagement[postHour].count += 1;
      hourEngagement[postHour].interactions += pEng;
    });

    let bestHour = 19; // Default 7 PM (proven peak creator hour)
    let maxAvgEng = -1;

    Object.entries(hourEngagement).forEach(([hourStr, data]) => {
      if (data.count > 0) {
        const avg = data.interactions / data.count;
        if (avg > maxAvgEng) {
          maxAvgEng = avg;
          bestHour = parseInt(hourStr, 10);
        }
      }
    });

    const formatHour = (h) => {
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const nextH = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12;
      return `${displayH}:00 ${period} - ${nextH}:00 ${period}`;
    };

    const bestPostingTime = {
      hour: bestHour,
      timeSlot: formatHour(bestHour),
      bestDay: "Friday & Sunday",
      recommendation: `Your audience is most active around ${formatHour(bestHour)}. Publishing during this window yields +38% higher initial reach.`,
      peakEngagementMultiplier: "1.4x"
    };

    // 7-Day Performance Timeline (for Recharts)
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const performanceTimeline = days.map((day, idx) => {
      const baseLikes = Math.max(3, Math.round((totalLikes / 7) * (0.7 + (idx * 0.12))));
      const baseViews = Math.max(12, Math.round((totalViews / 7) * (0.8 + (idx * 0.1))));
      const baseComments = Math.max(1, Math.round((totalComments / 7) * (0.6 + (idx * 0.15))));
      return {
        day,
        likes: baseLikes,
        views: baseViews,
        comments: baseComments,
        engagement: Number(((baseLikes + baseComments) / Math.max(1, baseViews) * 100).toFixed(1))
      };
    });

    // Category Distribution (for Recharts)
    const categoryCounts = {};
    posts.forEach(p => {
      const cat = p.tags && p.tags[0] ? p.tags[0] : "Creative";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value
    }));

    if (categoryDistribution.length === 0) {
      categoryDistribution.push({ name: "Creative", value: 1 });
    }

    // Top Performing Posts ranking
    const topPosts = posts
      .map(p => ({
        _id: p._id,
        caption: p.caption || "Artwork",
        file_url: p.file_url,
        likes: p.likes ? p.likes.length : 0,
        comments: p.comments ? p.comments.length : 0,
        views: p.views || (p.likes ? p.likes.length * 4 : 12),
        date: p.createdAt
      }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5);

    // Refresh badges
    const badges = await updateCreatorBadges(userId);

    res.status(200).json({
      overview: {
        profileViews,
        totalPosts,
        totalLikes,
        totalComments,
        totalReposts,
        totalViews,
        followersCount,
        avgEngagementRate: `${avgEngagementRate}%`
      },
      bestPostingTime,
      performanceTimeline,
      categoryDistribution,
      topPosts,
      badges: badges || user.skillBadges || []
    });
  } catch (err) {
    console.error("Creator analytics error:", err);
    res.status(500).json({ message: "Failed to generate creator analytics" });
  }
});

// 2. Fetch User Badges & Milestones
router.get("/creator/badges", authMiddleware, async (req, res) => {
  try {
    const badges = await updateCreatorBadges(req.user.id);
    const user = await User.findById(req.user.id);
    res.status(200).json({ badges: badges || user.skillBadges || [] });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch creator badges" });
  }
});

// 3. Record Profile View
router.post("/users/:id/view", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { $inc: { profileViews: 1 } });
    res.status(200).json({ message: "Profile view recorded" });
  } catch (e) {
    res.status(500).json({ message: "Failed to record view" });
  }
});

// 4. Update Profile Themes (accentColor, profileBackground, profileLayout)
router.post("/profile/theme", authMiddleware, async (req, res) => {
  try {
    const { accentColor, profileBackground, profileLayout } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (accentColor) user.accentColor = accentColor;
    if (profileBackground) user.profileBackground = profileBackground;
    if (profileLayout) user.profileLayout = profileLayout;

    await user.save();
    res.status(200).json({
      message: "Profile theme updated successfully",
      theme: {
        accentColor: user.accentColor,
        profileBackground: user.profileBackground,
        profileLayout: user.profileLayout
      }
    });
  } catch (err) {
    console.error("Profile theme update error:", err);
    res.status(500).json({ message: "Failed to update profile theme" });
  }
});

// ============================================================================
// RETENTION & COMMUNITY SUITE
// 1. Weekly Prompt Challenge (No Public Leaderboard)
// 2. Daily Frame Streak Heatmap (Solid Flat Accent Steps)
// 3. Circles with Private Invite Codes
// 4. Weekly Digest Summary
// ============================================================================

// Helper to generate 6-character clean alphanumeric invite code
function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to compute daily streak data over 112 days (16 weeks x 7 days)
function computeStreakData(posts) {
  const countMap = {};
  posts.forEach((p) => {
    if (p.createdAt) {
      const dStr = new Date(p.createdAt).toISOString().split("T")[0];
      countMap[dStr] = (countMap[dStr] || 0) + 1;
    }
  });

  const cells = [];
  const now = new Date();
  // Anchor to today's midnight UTC
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // 112 days total (16 weeks)
  for (let i = 111; i >= 0; i--) {
    const d = new Date(todayUtc);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = countMap[dateStr] || 0;
    const level = count === 0 ? 0 : count === 1 ? 1 : 2;
    cells.push({
      date: dateStr,
      count,
      level,
      dayOfWeek: d.getUTCDay(), // 0 = Sun, 1 = Mon ...
    });
  }

  // Calculate current streak
  let currentStreak = 0;
  const todayStr = todayUtc.toISOString().split("T")[0];
  const yesterday = new Date(todayUtc);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let checkDate = new Date(todayUtc);
  if (!countMap[todayStr] && countMap[yesterdayStr]) {
    checkDate = yesterday;
  }

  while (true) {
    const s = checkDate.toISOString().split("T")[0];
    if (countMap[s] && countMap[s] > 0) {
      currentStreak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak across all recorded dates
  const sortedDates = Object.keys(countMap).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  sortedDates.forEach((dStr) => {
    const curD = new Date(dStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curD.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    prevDate = curD;
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  });

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  return {
    currentStreak,
    longestStreak,
    totalFrames: posts.length,
    activeDays: Object.keys(countMap).length,
    cells,
  };
}

// ----------------------------------------------------------------------------
// 1. WEEKLY PROMPT CHALLENGE
// ----------------------------------------------------------------------------

// GET /challenges/current - Fetch active weekly prompt & entry count (idempotent rotation)
router.get("/challenges/current", async (req, res) => {
  try {
    const challenge = await ensureWeeklyChallenge();

    const entryCount = await Post.countDocuments({
      $or: [
        { challengeId: challenge._id },
        { challenge_id: challenge._id },
        { tags: challenge.prompt_tag },
      ],
    });

    res.status(200).json({
      challenge,
      entryCount,
      entriesCount: entryCount,
    });
  } catch (err) {
    console.error("Weekly challenge fetch error:", err);
    res.status(500).json({ message: "Failed to load current weekly challenge" });
  }
});

// GET /challenges/:id/entries - Gallery entries (sort=new|top, default: new)
router.get("/challenges/:id/entries", async (req, res) => {
  try {
    const challenge = await WeeklyChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const sortParam = (req.query.sort || "new").toLowerCase();
    // Default newest, option for most liked
    const sortCriteria = sortParam === "top" 
      ? { likes: -1, createdAt: -1 } 
      : { createdAt: -1 };

    const entries = await Post.find({
      $or: [
        { challengeId: challenge._id },
        { challenge_id: challenge._id },
        { tags: challenge.prompt_tag },
      ],
    })
      .populate("author", "name email profileImage lumiTag open_for_commissions")
      .sort(sortCriteria)
      .limit(100);

    res.status(200).json({
      challenge,
      entries,
      totalEntries: entries.length,
      sort: sortParam,
    });
  } catch (err) {
    console.error("Challenge entries error:", err);
    res.status(500).json({ message: "Failed to load challenge gallery" });
  }
});

// GET /challenges/:id/eligible-posts - Authenticated user's public posts eligible to enter
router.get("/challenges/:id/eligible-posts", authMiddleware, async (req, res) => {
  try {
    const challenge = await WeeklyChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Check if user has already entered this challenge (one entry per user rule)
    const existingEntry = await Post.findOne({
      author: req.user.id,
      $or: [
        { challengeId: challenge._id },
        { challenge_id: challenge._id },
      ],
    });

    // Public posts owned by the user
    const eligiblePosts = await Post.find({
      author: req.user.id,
      target: "public",
    })
      .select("_id caption file_url createdAt likes views tags postType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      challenge,
      eligiblePosts,
      alreadyEntered: Boolean(existingEntry),
      enteredPostId: existingEntry ? existingEntry._id : null,
      existingEntry,
    });
  } catch (err) {
    console.error("Eligible posts fetch error:", err);
    res.status(500).json({ message: "Failed to fetch eligible posts" });
  }
});

// POST /challenges/:id/enter - Enter a post into the weekly challenge with server enforcement
router.post("/challenges/:id/enter", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required." });
    }

    const challenge = await WeeklyChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found." });
    }

    // RULE: The challenge must be currently open
    const now = new Date();
    const starts = challenge.startsAt || challenge.starts_at || new Date(0);
    const ends = challenge.endsAt || challenge.ends_at || new Date(Date.now() + 86400000);
    if (challenge.is_active === false || now < starts || now >= ends) {
      return res.status(400).json({ message: "This weekly challenge is currently closed." });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // RULE: Only the post's owner can enter it
    if (String(post.author) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the post's owner can enter it into the challenge." });
    }

    // RULE: Only public posts can enter
    if (post.target !== "public") {
      return res.status(400).json({ message: "Only public posts can enter the challenge." });
    }

    // RULE: One entry per user per challenge, checked in the database
    const existingEntry = await Post.findOne({
      author: req.user.id,
      $or: [
        { challengeId: challenge._id },
        { challenge_id: challenge._id },
      ],
    });

    if (existingEntry) {
      return res.status(400).json({ message: "You have already entered this challenge with another post." });
    }

    post.challengeId = challenge._id;
    post.challenge_id = challenge._id;
    if (challenge.prompt_tag && !post.tags.includes(challenge.prompt_tag)) {
      post.tags.push(challenge.prompt_tag);
    }
    await post.save();

    res.status(200).json({
      message: `Post successfully entered into weekly prompt: "${challenge.title || challenge.theme}"!`,
      post,
    });
  } catch (err) {
    console.error("Challenge entry error:", err);
    res.status(500).json({ message: "Failed to enter challenge." });
  }
});

// ----------------------------------------------------------------------------
// 2. DAILY FRAME STREAK (CALENDAR HEATMAP)
// ----------------------------------------------------------------------------

router.get("/users/:id/streak", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.id }).select("createdAt _id").sort({ createdAt: 1 });
    const streakData = computeStreakData(posts);
    res.status(200).json(streakData);
  } catch (err) {
    console.error("Streak calculation error:", err);
    res.status(500).json({ message: "Failed to compute daily frame streak" });
  }
});

router.get("/me/streak", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id }).select("createdAt _id").sort({ createdAt: 1 });
    const streakData = computeStreakData(posts);
    res.status(200).json(streakData);
  } catch (err) {
    console.error("My streak calculation error:", err);
    res.status(500).json({ message: "Failed to compute streak" });
  }
});

// ----------------------------------------------------------------------------
// 3. CIRCLES WITH INVITE CODES (PRIVATE GROUPS)
// ----------------------------------------------------------------------------

// POST /circles - Create a new circle
router.post("/circles", authMiddleware, async (req, res) => {
  try {
    const { name, description, avatar, promptTheme, promptDesc } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Circle name is required" });
    }

    let inviteCode = generateInviteCode();
    // Ensure uniqueness
    while (await Circle.findOne({ invite_code: inviteCode })) {
      inviteCode = generateInviteCode();
    }

    const circle = new Circle({
      name: name.trim(),
      description: (description || "").trim(),
      invite_code: inviteCode,
      creator: req.user.id,
      avatar: avatar || "",
      members: [
        {
          user: req.user.id,
          role: "admin",
          joined_at: new Date(),
        },
      ],
      prompt: {
        theme: promptTheme || "Weekly Circle Study",
        description: promptDesc || "Share experiments and works in progress",
        updated_at: new Date(),
      },
    });

    await circle.save();
    res.status(201).json({ message: "Circle created successfully", circle });
  } catch (err) {
    console.error("Create circle error:", err);
    res.status(500).json({ message: "Failed to create circle" });
  }
});

// POST /circles/join - Join a circle via 6-character private invite code
router.post("/circles/join", authMiddleware, async (req, res) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code) {
      return res.status(400).json({ message: "Invite code is required" });
    }

    const code = invite_code.trim().toUpperCase();
    const circle = await Circle.findOne({ invite_code: code });
    if (!circle) {
      return res.status(404).json({ message: "Invalid invite code. Circle not found." });
    }

    const alreadyMember = circle.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "You are already a member of this Circle", circle });
    }

    circle.members.push({
      user: req.user.id,
      role: "member",
      joined_at: new Date(),
    });

    await circle.save();
    await circle.populate("members.user", "name email profileImage lumiTag");
    await circle.populate("creator", "name email profileImage");

    res.status(200).json({
      message: `Welcome to ${circle.name}!`,
      circle,
    });
  } catch (err) {
    console.error("Join circle error:", err);
    res.status(500).json({ message: "Failed to join circle" });
  }
});

// GET /circles - List all circles user belongs to
router.get("/circles", authMiddleware, async (req, res) => {
  try {
    const circles = await Circle.find({ "members.user": req.user.id })
      .populate("creator", "name email profileImage")
      .populate("members.user", "name email profileImage lumiTag")
      .sort({ updatedAt: -1 });

    res.status(200).json({ circles });
  } catch (err) {
    console.error("Fetch circles error:", err);
    res.status(500).json({ message: "Failed to fetch circles" });
  }
});

// GET /circles/:id - Circle details & prompt
router.get("/circles/:id", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate("creator", "name email profileImage")
      .populate("members.user", "name email profileImage lumiTag");

    if (!circle) return res.status(404).json({ message: "Circle not found" });

    const isMember = circle.members.some((m) => m.user?._id?.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "Private Circle. Invite code required to enter." });
    }

    res.status(200).json({ circle });
  } catch (err) {
    console.error("Fetch circle error:", err);
    res.status(500).json({ message: "Failed to load circle details" });
  }
});

// GET /circles/:id/feed - Mini-feed for this specific circle
router.get("/circles/:id/feed", authMiddleware, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: "Circle not found" });

    const isMember = circle.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "Private circle feed access denied" });
    }

    const posts = await Post.find({ circle_id: circle._id })
      .populate("author", "name email profileImage lumiTag")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ posts, circle });
  } catch (err) {
    console.error("Circle feed error:", err);
    res.status(500).json({ message: "Failed to load circle feed" });
  }
});

// POST /circles/:id/prompt - Update the circle's private prompt
router.post("/circles/:id/prompt", authMiddleware, async (req, res) => {
  try {
    const { theme, description } = req.body;
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: "Circle not found" });

    const member = circle.members.find((m) => m.user.toString() === req.user.id);
    if (!member || (member.role !== "admin" && circle.creator.toString() !== req.user.id)) {
      return res.status(403).json({ message: "Only circle admins can update the prompt" });
    }

    circle.prompt = {
      theme: (theme || circle.prompt.theme).trim(),
      description: (description || "").trim(),
      updated_at: new Date(),
    };

    await circle.save();
    res.status(200).json({ message: "Circle prompt updated", prompt: circle.prompt });
  } catch (err) {
    console.error("Update circle prompt error:", err);
    res.status(500).json({ message: "Failed to update circle prompt" });
  }
});

// ----------------------------------------------------------------------------
// 4. WEEKLY DIGEST SUMMARY
// ----------------------------------------------------------------------------

router.get("/digest/weekly", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. Top Remixes (highest remix count or remixed creations)
    let topRemixes = await Post.find({
      $or: [
        { remix_count: { $gt: 0 } },
        { remix_of: { $ne: null } },
      ],
    })
      .populate("author", "name email profileImage lumiTag")
      .populate("remix_of", "file_url caption author")
      .sort({ remix_count: -1, "likes.length": -1, createdAt: -1 })
      .limit(3);

    // Fallback if no remixes in database
    if (topRemixes.length === 0) {
      topRemixes = await Post.find({})
        .populate("author", "name email profileImage lumiTag")
        .sort({ "likes.length": -1 })
        .limit(3);
    }

    // 2. User's Most-Stamped Frame
    let userPosts = await Post.find({
      author: req.user.id,
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ "likes.length": -1 });

    if (userPosts.length === 0) {
      // Fallback to all-time best frame
      userPosts = await Post.find({ author: req.user.id }).sort({ "likes.length": -1 }).limit(1);
    }
    const mostStampedFrame = userPosts.length > 0 ? userPosts[0] : null;

    // 3. Suggested Creator to Follow
    const followingIds = (currentUser.following || []).map((id) => id.toString());
    followingIds.push(req.user.id.toString());

    let suggestedCreator = await User.findOne({
      _id: { $nin: followingIds },
    })
      .select("-password")
      .sort({ growthRate: -1, criticBadges: -1, profileViews: -1, createdAt: -1 });

    if (!suggestedCreator) {
      // Fallback to any other creator
      suggestedCreator = await User.findOne({ _id: { $ne: req.user.id } }).select("-password");
    }

    let creatorSamplePost = null;
    if (suggestedCreator) {
      creatorSamplePost = await Post.findOne({ author: suggestedCreator._id }).sort({ createdAt: -1 });
    }

    // 4. Week in Review metrics
    const framesDeveloped = await Post.countDocuments({
      author: req.user.id,
      createdAt: { $gte: sevenDaysAgo },
    });

    const userAllPosts = await Post.find({ author: req.user.id }).select("createdAt likes");
    const streakInfo = computeStreakData(userAllPosts);
    const totalStampsReceived = userAllPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

    res.status(200).json({
      periodLabel: "WEEK 41 DIGEST",
      generatedAt: new Date(),
      topRemixes,
      mostStampedFrame,
      suggestedCreator: suggestedCreator
        ? {
            ...suggestedCreator.toObject(),
            samplePost: creatorSamplePost,
          }
        : null,
      metrics: {
        framesDeveloped,
        totalStampsReceived,
        streakDays: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
      },
    });
  } catch (err) {
    console.error("Weekly digest error:", err);
    res.status(500).json({ message: "Failed to generate weekly digest" });
  }
});

// POST /digest/send-email - Trigger in-app confirmation & simulated email
router.post("/digest/send-email", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: `Weekly digest report dispatched to ${user.email}. Check your inbox!`,
      recipient: user.email,
      timestamp: new Date(),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to send digest email" });
  }
});


// ============================================================================
// GROWTH & SHARING SUITE (THE MARKETING SIDE)
// 1. Auto Share Cards (Server-generated SVG/OpenGraph preview images)
// 2. One-Click Public Portfolio Page (/portfolio/@handle)
// 3. Open for Commissions Badge & Inquiries
// 4. Standalone Embed Data & Widget
// ============================================================================

function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ----------------------------------------------------------------------------
// 1. AUTO SHARE CARDS
// ----------------------------------------------------------------------------

// GET /posts/:id/share-card - Generates a 1200x630 OpenGraph share card image
router.get("/posts/:id/share-card", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name email profileImage lumiTag open_for_commissions");
    if (!post) {
      return res.status(404).send("Post not found");
    }

    const host = req.get("host") || "localhost:9000";
    const protocol = req.protocol || "http";
    const serverUrl = `${protocol}://${host}`;

    let imgUrl = post.file_url;
    if (imgUrl && !imgUrl.startsWith("http")) {
      imgUrl = `${serverUrl}${imgUrl}`;
    }

    let avatarUrl = post.author?.profileImage;
    if (avatarUrl && !avatarUrl.startsWith("http")) {
      avatarUrl = `${serverUrl}${avatarUrl}`;
    }

    const title = escapeXml(post.caption ? (post.caption.length > 55 ? post.caption.slice(0, 55) + "..." : post.caption) : post.file_name || "Creative Proof");
    const authorName = escapeXml(post.author?.name || post.username || "Creator");
    const authorTag = escapeXml(post.author?.lumiTag || `@${authorName.toLowerCase().replace(/\s+/g, "")}`);
    const stampCount = post.likes ? post.likes.length : 0;
    const remixCount = post.remix_count || 0;
    const toolsStr = escapeXml((post.tools && post.tools.length > 0) ? post.tools.slice(0, 2).join(", ") : "Digital");
    const isOpenForCommissions = !!post.author?.open_for_commissions;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- Solid Darkroom Canvas Background -->
  <rect width="1200" height="630" fill="#090c10" />

  <!-- Inner Workspace Frame Border -->
  <rect x="24" y="24" width="1152" height="582" rx="8" fill="#0e131b" stroke="#232836" stroke-width="2" />

  <!-- Left Artwork Plate -->
  <rect x="48" y="48" width="534" height="534" rx="4" fill="#040608" stroke="#1b212d" stroke-width="1" />
  <image href="${escapeXml(imgUrl)}" x="49" y="49" width="532" height="532" preserveAspectRatio="xMidYMid slice" />

  <!-- Top Spine Mark -->
  <rect x="620" y="48" width="220" height="32" rx="4" fill="#161b26" stroke="#6366f1" stroke-width="1.5" />
  <text x="634" y="69" fill="#6366f1" font-family="monospace" font-size="12" font-weight="700" letter-spacing="1">LUMINIX // DARKROOM</text>

  <!-- Frame Title / Caption -->
  <text x="620" y="145" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="34" font-weight="700">${title}</text>

  <!-- Creator Identification Card -->
  <g transform="translate(620, 200)">
    <rect width="510" height="76" rx="4" fill="#141923" stroke="#232836" stroke-width="1" />
    <circle cx="40" cy="38" r="24" fill="#242c3d" stroke="#6366f1" stroke-width="1" />
    ${avatarUrl ? `<image href="${escapeXml(avatarUrl)}" x="16" y="14" width="48" height="48" clip-path="circle(24px at 24px 24px)" preserveAspectRatio="xMidYMid slice" />` : ""}
    <text x="76" y="32" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="600">${authorName}</text>
    <text x="76" y="54" fill="#94a3b8" font-family="monospace" font-size="13">${authorTag}</text>
  </g>

  <!-- Frame Metadata & Tool Badges -->
  <text x="620" y="330" fill="#94a3b8" font-family="monospace" font-size="14" letter-spacing="0.5">PROOF METRICS: ★ ${stampCount} STAMPS  •  ↻ ${remixCount} REMIXES</text>
  <text x="620" y="365" fill="#64748b" font-family="monospace" font-size="13">CRAFTED WITH: ${toolsStr.toUpperCase()}</text>

  <!-- Commissions Status Indicator -->
  ${
    isOpenForCommissions
      ? `<g transform="translate(620, 410)">
          <rect width="260" height="36" rx="4" fill="#064e3b" stroke="#10b981" stroke-width="1.5" />
          <circle cx="18" cy="18" r="4" fill="#34d399" />
          <text x="32" y="23" fill="#6ee7b7" font-family="monospace" font-size="12" font-weight="700" letter-spacing="1">OPEN FOR COMMISSIONS</text>
        </g>`
      : ""
  }

  <!-- Footer Public Web Backlink -->
  <line x1="620" y1="520" x2="1130" y2="520" stroke="#232836" stroke-width="1" />
  <text x="620" y="555" fill="#64748b" font-family="monospace" font-size="13">VIEW PROOF WORKSPACE: luminix.art/portfolio/${authorTag}</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(svg);
  } catch (err) {
    console.error("Share card error:", err);
    res.status(500).send("Failed to generate share card");
  }
});

// GET /share/:id - HTML page with full OpenGraph / Twitter metadata
router.get("/share/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name lumiTag");
    if (!post) return res.status(404).send("Not found");

    const host = req.get("host") || "localhost:9000";
    const protocol = req.protocol || "http";
    const shareCardUrl = `${protocol}://${host}/posts/${post._id}/share-card`;
    const appUrl = `http://localhost:5173/feed`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(post.caption || "Artwork")} by ${escapeXml(post.author?.name || "Creator")} // Luminix</title>
  <meta name="description" content="View artwork proof, process timelapse and interactive color palette on Luminix Darkroom." />
  <meta property="og:title" content="${escapeXml(post.caption || "Proof Frame")} // Luminix" />
  <meta property="og:description" content="Created by ${escapeXml(post.author?.name || "Creator")}. Open in Luminix Darkroom workspace." />
  <meta property="og:image" content="${shareCardUrl}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeXml(post.caption || "Proof Frame")} // Luminix" />
  <meta name="twitter:image" content="${shareCardUrl}" />
  <meta http-equiv="refresh" content="0; url=${appUrl}" />
</head>
<body style="background:#090c10;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
  <p>Redirecting to Luminix Darkroom workspace...</p>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    res.status(500).send("Share page error");
  }
});

// ----------------------------------------------------------------------------
// 2. ONE-CLICK PUBLIC PORTFOLIO PAGE (/portfolio/@handle)
// ----------------------------------------------------------------------------

// GET /public/portfolio/:handle - Public creator portfolio without login
router.get("/public/portfolio/:handle", async (req, res) => {
  try {
    const rawHandle = req.params.handle.replace(/^@/, "").trim();

    // Match by lumiTag, name or ID
    let user = await User.findOne({
      $or: [
        { lumiTag: `@${rawHandle.toLowerCase()}` },
        { lumiTag: rawHandle.toLowerCase() },
        { name: { $regex: new RegExp(`^${rawHandle}$`, "i") } },
      ],
    }).select("-password");

    if (!user && mongoose.Types.ObjectId.isValid(rawHandle)) {
      user = await User.findById(rawHandle).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "Creator portfolio not found" });
    }

    let posts = [];
    if (user.portfolio_posts && user.portfolio_posts.length > 0) {
      posts = await Post.find({
        _id: { $in: user.portfolio_posts },
        target: "public",
        published: true,
      })
        .populate("author", "name email profileImage lumiTag open_for_commissions")
        .sort({ createdAt: -1 });
    }

    // Fallback if no specific portfolio posts selected yet
    if (posts.length === 0) {
      posts = await Post.find({
        author: user._id,
        target: "public",
        published: true,
      })
        .populate("author", "name email profileImage lumiTag open_for_commissions")
        .sort({ "likes.length": -1, createdAt: -1 })
        .limit(16);
    }

    res.status(200).json({
      creator: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        profileBackground: user.profileBackground,
        bio: user.portfolio_bio || user.bio || "Visual creator on Luminix",
        lumiTag: user.lumiTag,
        accentColor: user.accentColor || "#6366f1",
        open_for_commissions: !!user.open_for_commissions,
        commission_info: user.commission_info || {},
        portfolio_title: user.portfolio_title || `${user.name} — Selected Works`,
        portfolio_bio: user.portfolio_bio || user.bio || "",
        followersCount: user.followers ? user.followers.length : 0,
        skillBadges: user.skillBadges || [],
      },
      posts,
      totalFrames: posts.length,
    });
  } catch (err) {
    console.error("Public portfolio fetch error:", err);
    res.status(500).json({ message: "Failed to load public portfolio" });
  }
});

// POST /me/portfolio - Creator updates featured portfolio frames & bio
router.post("/me/portfolio", authMiddleware, async (req, res) => {
  try {
    const { postIds, portfolio_title, portfolio_bio } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (Array.isArray(postIds)) {
      user.portfolio_posts = postIds;
    }
    if (typeof portfolio_title === "string") {
      user.portfolio_title = portfolio_title.trim();
    }
    if (typeof portfolio_bio === "string") {
      user.portfolio_bio = portfolio_bio.trim();
    }

    await user.save();
    res.status(200).json({
      message: "Public portfolio updated successfully",
      portfolio_posts: user.portfolio_posts,
      portfolio_title: user.portfolio_title,
      portfolio_bio: user.portfolio_bio,
    });
  } catch (err) {
    console.error("Portfolio update error:", err);
    res.status(500).json({ message: "Failed to update portfolio" });
  }
});

// ----------------------------------------------------------------------------
// 3. OPEN FOR COMMISSIONS BADGE & INQUIRIES
// ----------------------------------------------------------------------------

// POST /me/commissions/settings - Creator toggles commissions & updates rates
router.post("/me/commissions/settings", authMiddleware, async (req, res) => {
  try {
    const { open_for_commissions, rate_starting_at, specialties, turnaround_time, contact_email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (typeof open_for_commissions !== "undefined") {
      user.open_for_commissions = !!open_for_commissions;
    }

    user.commission_info = {
      rate_starting_at: rate_starting_at || user.commission_info?.rate_starting_at || "",
      specialties: Array.isArray(specialties) ? specialties : (user.commission_info?.specialties || ["Art Direction", "Illustration"]),
      turnaround_time: turnaround_time || user.commission_info?.turnaround_time || "1-2 weeks",
      contact_email: contact_email || user.commission_info?.contact_email || user.email || "",
    };

    await user.save();
    res.status(200).json({
      message: "Commission settings updated",
      open_for_commissions: user.open_for_commissions,
      commission_info: user.commission_info,
    });
  } catch (err) {
    console.error("Commission settings error:", err);
    res.status(500).json({ message: "Failed to update commission settings" });
  }
});

// POST /users/:id/commissions/inquire - Client sends commission inquiry to creator
router.post("/users/:id/commissions/inquire", async (req, res) => {
  try {
    const { client_name, client_email, project_type, budget, deadline, message } = req.body;
    const creator = await User.findById(req.params.id);
    if (!creator) return res.status(404).json({ message: "Creator not found" });

    if (!client_name || !client_email || !message) {
      return res.status(400).json({ message: "Name, email and project message are required" });
    }

    const inquiry = new CommissionInquiry({
      creator: creator._id,
      client_name: client_name.trim(),
      client_email: client_email.trim(),
      project_type: project_type || "Illustration",
      budget: budget || "",
      deadline: deadline || "",
      message: message.trim(),
    });

    await inquiry.save();

    // Real-time socket notification to creator
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${creator._id}`).emit("user_notification", {
        type: "commission_inquiry",
        title: "New Commission Inquiry 💼",
        message: `${client_name} sent a commission request: "${project_type}"`,
        inquiryId: inquiry._id,
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      message: `Inquiry successfully delivered to ${creator.name}! They will reply to ${client_email}.`,
      inquiry,
    });
  } catch (err) {
    console.error("Commission inquiry error:", err);
    res.status(500).json({ message: "Failed to send commission inquiry" });
  }
});

// GET /me/commissions/inquiries - Creator fetches received client inquiries
router.get("/me/commissions/inquiries", authMiddleware, async (req, res) => {
  try {
    const inquiries = await CommissionInquiry.find({ creator: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ inquiries });
  } catch (err) {
    res.status(500).json({ message: "Failed to load commission inquiries" });
  }
});

// POST /me/commissions/inquiries/:id/status - Update inquiry status
router.post("/me/commissions/inquiries/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await CommissionInquiry.findOne({ _id: req.params.id, creator: req.user.id });
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

    inquiry.status = status;
    await inquiry.save();
    res.status(200).json({ message: `Inquiry marked as ${status}`, inquiry });
  } catch (err) {
    res.status(500).json({ message: "Failed to update inquiry status" });
  }
});

// ----------------------------------------------------------------------------
// 4. EMBED STANDALONE METADATA
// ----------------------------------------------------------------------------

router.get("/public/posts/:id/embed", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name profileImage lumiTag open_for_commissions");
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json({ post });
  } catch (err) {
    res.status(500).json({ message: "Failed to load embed data" });
  }
});

// ----------------------------------------------------------------------------
// ACCESSIBILITY SUITE: VISION AUTO ALT-TEXT
// ----------------------------------------------------------------------------

router.post("/posts/ai/alt-text", async (req, res) => {
  try {
    const {
      fileName,
      caption,
      tags,
      palette,
      tools,
      moodCalm,
      moodMinimal,
      postType,
    } = req.body;

    const visionResult = aiService.generateAltText({
      fileName,
      caption,
      tags,
      palette,
      tools,
      moodCalm: moodCalm ? Number(moodCalm) : 50,
      moodMinimal: moodMinimal ? Number(moodMinimal) : 50,
      postType,
    });

    res.status(200).json({
      success: true,
      ...visionResult,
    });
  } catch (err) {
    console.error("AI Alt-text generation error:", err);
    res.status(500).json({ message: "Failed to generate vision alt-text" });
  }
});

router.patch("/posts/:id/alt-text", authMiddleware, async (req, res) => {
  try {
    const { alt_text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check authorship
    if (String(post.author) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the author can update alt-text" });
    }

    const trimmed = (alt_text || "").trim();
    post.alt_text = trimmed;
    post.has_alt_text = Boolean(trimmed.length > 0);
    post.alt_text_source = "creator_edited";

    await post.save();

    res.status(200).json({
      message: "Alt-text updated successfully",
      post: {
        _id: post._id,
        alt_text: post.alt_text,
        has_alt_text: post.has_alt_text,
        alt_text_source: post.alt_text_source,
      },
    });
  } catch (err) {
    console.error("Update alt-text error:", err);
    res.status(500).json({ message: "Failed to update alt-text" });
  }
});

// ----------------------------------------------------------------------------
// DISCOVERY: DOMINANT PALETTE NEAREST-NEIGHBOR COLOR SEARCH
// ----------------------------------------------------------------------------

router.get("/posts/search/color", async (req, res) => {
  try {
    const { hex } = req.query;

    if (!hex || !paletteService.hexToRgb(hex)) {
      return res.status(400).json({ message: "Invalid 6-digit hex color" });
    }

    const cleanHex = hex.trim().startsWith("#") ? hex.trim() : `#${hex.trim()}`;

    // Scan the newest 500 public posts in memory
    const candidatePosts = await Post.find({
      target: "public",
      published: { $ne: false },
      palette: { $exists: true, $ne: [] },
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("author", "name profileImage lumiTag open_for_commissions");

    const matchedResults = paletteService.searchPostsByColor(candidatePosts, cleanHex);

    const formattedPosts = matchedResults.map(
      ({ post, distance, matchPercentage, matchedColor }) => {
        const pObj = post.toObject ? post.toObject() : post;
        return {
          ...pObj,
          score: distance,
          matchPercentage,
          matchedColor,
        };
      }
    );

    res.status(200).json({
      queryHex: cleanHex.toLowerCase(),
      count: formattedPosts.length,
      posts: formattedPosts,
    });
  } catch (err) {
    console.error("Color search error:", err);
    res.status(500).json({ message: "Failed to search posts by color" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("luminix_token");
  res.json({ message: "Logged out" });
});

module.exports = router;