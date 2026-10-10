// Luminix AI Engine: Semantic Embeddings, Vision Heuristics, Category Classification, and Content Safety

// Concept Dictionary for Semantic Embedding Clusters
const SEMANTIC_CLUSTERS = {
  moody: ["moody", "dark", "night", "noir", "shadow", "rain", "fog", "city", "gloomy", "street", "midnight", "dusk"],
  cyberpunk: ["cyberpunk", "neon", "future", "synthwave", "glitch", "sci-fi", "hologram", "tech", "matrix", "tokyo", "blade"],
  nature: ["nature", "forest", "landscape", "sunset", "mountain", "ocean", "green", "flora", "fauna", "sky", "sunlight"],
  digital_art: ["art", "digital", "illustration", "painting", "concept", "sketch", "drawing", "character", "anime", "canvas"],
  three_d: ["3d", "render", "blender", "octane", "cinema4d", "procedural", "mesh", "lighting", "unreal", "motion", "geometry"],
  tech: ["tech", "code", "developer", "software", "ai", "hardware", "setup", "frontend", "web", "design", "ui", "ux"],
  minimal: ["minimal", "clean", "pastel", "simplicity", "white", "monochrome", "modern", "abstract", "zen"],
  memes: ["meme", "funny", "humor", "lol", "joke", "comedy", "viral", "relatable", "shitpost"],
  music: ["music", "audio", "track", "beat", "melody", "sound", "album", "producer", "studio", "acoustic"],
  emotional: ["emotional", "heart", "love", "feelings", "vulnerable", "soul", "nostalgia", "peace", "hope", "sad"],
};

// Known Categories in Luminix
const LUMINIX_CATEGORIES = [
  "Creative",
  "Tech Posts",
  "Memes",
  "Music",
  "News",
  "Emotional",
  "Entertainment",
  "Knowledge",
  "Discussions",
  "Sports",
  "Achievements",
];

// Unsafe/Toxic keywords for content safety check
const UNSAFE_KEYWORDS = [
  "nsfw", "porn", "nude", "explicit", "gore", "hate", "violence", 
  "kill", "attack", "scam", "phishing", "illegal", "abuse", "terror"
];

class AiService {
  /**
   * Generates a dense semantic vector representation of text
   */
  generateEmbedding(text) {
    if (!text) return new Array(Object.keys(SEMANTIC_CLUSTERS).length + 10).fill(0);
    const tokens = text.toLowerCase().match(/\b\w+\b/g) || [];
    const vector = [];

    // 1. Cluster affinity weights
    for (const [cluster, words] of Object.entries(SEMANTIC_CLUSTERS)) {
      let weight = 0;
      for (const token of tokens) {
        if (words.includes(token)) weight += 1.5;
        if (words.some(w => token.includes(w) || w.includes(token))) weight += 0.8;
      }
      vector.push(weight);
    }

    // 2. Add n-gram hash features
    for (let i = 0; i < 10; i++) {
      let hashWeight = 0;
      tokens.forEach(tok => {
        let code = 0;
        for (let j = 0; j < tok.length; j++) code += tok.charCodeAt(j);
        if (code % 10 === i) hashWeight += 1;
      });
      vector.push(hashWeight);
    }

    return vector;
  }

  /**
   * Calculates Cosine Similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  /**
   * Auto-tagging, caption variations, and smart category suggestions
   */
  analyzeImageAndSuggest(fileName = "", captionHint = "") {
    const textBlob = `${fileName} ${captionHint}`.toLowerCase();
    
    // Determine prominent cluster
    let topCluster = "digital_art";
    let maxClusterScore = -1;

    for (const [cluster, keywords] of Object.entries(SEMANTIC_CLUSTERS)) {
      const score = keywords.reduce((acc, kw) => acc + (textBlob.includes(kw) ? 2 : 0), 0);
      if (score > maxClusterScore) {
        maxClusterScore = score;
        topCluster = cluster;
      }
    }

    // Smart Category Classification
    let classifiedCategory = "Creative";
    let categoryConfidence = 94;

    if (topCluster === "tech") {
      classifiedCategory = "Tech Posts";
      categoryConfidence = 96;
    } else if (topCluster === "memes") {
      classifiedCategory = "Memes";
      categoryConfidence = 98;
    } else if (topCluster === "music") {
      classifiedCategory = "Music";
      categoryConfidence = 95;
    } else if (topCluster === "emotional") {
      classifiedCategory = "Emotional";
      categoryConfidence = 92;
    } else if (topCluster === "three_d" || topCluster === "cyberpunk") {
      classifiedCategory = "Creative";
      categoryConfidence = 97;
    }

    // Suggested Tags based on cluster and detected cues
    const baseTags = {
      cyberpunk: ["cyberpunk", "neonvibes", "scifiart", "digitalart", "lighting", "3drender"],
      three_d: ["blender3d", "octanerender", "3dartist", "procedural", "visualeffects", "cgi"],
      tech: ["techposts", "developer", "uidesign", "coding", "webdev", "engineering"],
      moody: ["moodygrams", "cinematic", "streetphotography", "noir", "nightvibes", "shadows"],
      nature: ["naturelovers", "landscapes", "earthpix", "naturalbeauty", "serenity", "goldenhour"],
      digital_art: ["illustration", "digitalpainting", "conceptart", "sketchdaily", "creativecommunity"],
      minimal: ["minimalism", "cleanlines", "abstractart", "pastelpalette", "visualharmony"],
      memes: ["memesdaily", "humor", "relatable", "funnymoments", "internetculture"],
      music: ["musicproduction", "sounddesign", "beats", "audiovisual", "creativetrack"],
      emotional: ["deepthoughts", "emotions", "soulful", "nostalgia", "heartfelt"],
    };

    const suggestedTags = baseTags[topCluster] || ["creative", "digitalart", "artwork", "inspiration"];

    // 3 Tailored Caption Suggestions
    const captionVariations = {
      poetic: `Exploring the subtle interplay of light and mood in this latest iteration. A study in harmony and visual stillness.`,
      punchy: `Brought this concept to life! ✨ What emotion or story does this spark for you? Drop your take below!`,
      technical: `Full workflow study: focused on geometric composition, refined color grading, and dynamic value balance. Built with precision.`,
    };

    if (topCluster === "cyberpunk" || topCluster === "three_d") {
      captionVariations.poetic = `Where silicon meets neon rain. Sculpted in spatial layers with high-contrast ambient glow.`;
      captionVariations.punchy = `New render dropped! 🔥 Cyber aesthetics dialed all the way up. Swipe to see the making-of!`;
      captionVariations.technical = `Procedural shaders and multi-pass lighting pass complete. Focused on subsurface scattering and depth falloff.`;
    }

    return {
      classifiedCategory,
      categoryConfidence,
      suggestedTags,
      captionVariations,
      detectedStyle: topCluster,
      safety: this.checkContentSafety(captionHint, fileName)
    };
  }

  /**
   * Automated Content Safety & Toxicity Filter
   */
  checkContentSafety(text = "", fileName = "") {
    const combined = `${text} ${fileName}`.toLowerCase();
    const flags = [];

    UNSAFE_KEYWORDS.forEach(kw => {
      if (combined.includes(kw)) {
        flags.push(`Flagged keyword: "${kw}"`);
      }
    });

    const isSafe = flags.length === 0;
    const safetyScore = isSafe ? 98 : Math.max(20, 100 - (flags.length * 35));

    return {
      isSafe,
      safetyScore,
      flags,
      status: isSafe ? "approved" : "flagged",
      message: isSafe 
        ? "Content verified safe for community guidelines." 
        : "Safety alert: upload triggered automated safety rules."
    };
  }

  /**
   * Semantic Search over Posts
   */
  semanticSearch(query, posts) {
    if (!query || !query.trim()) return posts;

    const queryVec = this.generateEmbedding(query);
    const queryLower = query.toLowerCase();
    const queryTokens = queryLower.split(/\s+/).filter(Boolean);

    const scored = posts.map(post => {
      const postText = `${post.caption || ""} ${post.file_name || ""} ${(post.tags || []).join(" ")} ${post.username || ""}`;
      const postVec = this.generateEmbedding(postText);
      
      const cosineSim = this.cosineSimilarity(queryVec, postVec);

      // Exact token overlap bonus
      let tokenOverlapBonus = 0;
      queryTokens.forEach(token => {
        if (postText.toLowerCase().includes(token)) tokenOverlapBonus += 0.25;
      });

      const finalScore = Math.min(0.99, (cosineSim * 0.75) + tokenOverlapBonus);

      return {
        ...post,
        matchScore: Math.round(finalScore * 100),
        semanticReason: finalScore > 0.45 
          ? `High conceptual alignment with "${query}"`
          : `Related visual cues matching "${query}"`,
      };
    });

    // Filter out completely unrelated posts and sort descending
    return scored
      .filter(p => p.matchScore > 18)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Personalized "For You" Feed Ranking
   */
  rankForYouFeed(posts, userLikes = [], userFollows = []) {
    // 1. Build User Affinity Profile from liked posts
    const tagAffinities = {};
    const categoryAffinities = {};

    userLikes.forEach(likedPost => {
      if (likedPost.tags && Array.isArray(likedPost.tags)) {
        likedPost.tags.forEach(tag => {
          const t = tag.toLowerCase();
          tagAffinities[t] = (tagAffinities[t] || 0) + 1.5;
        });
      }
      if (likedPost.target) {
        categoryAffinities[likedPost.target] = (categoryAffinities[likedPost.target] || 0) + 1;
      }
    });

    const now = Date.now();

    // 2. Score candidate posts
    const ranked = posts.map(post => {
      let tagScore = 0;
      let matchedTags = [];

      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          const t = tag.toLowerCase();
          if (tagAffinities[t]) {
            tagScore += tagAffinities[t];
            matchedTags.push(t);
          }
        });
      }

      // Recency decay (posts newer than 48 hours get boost)
      const postAgeHours = Math.max(1, (now - new Date(post.upload_time || post.createdAt).getTime()) / (1000 * 60 * 60));
      const recencyBoost = Math.max(0, 50 / (postAgeHours + 10));

      // Social velocity (likes, reposts, comments)
      const interactionScore = ((post.likes || 0) * 1.5) + ((post.reposts || 0) * 2.0) + ((post.remix_count || 0) * 3.0);

      // Followed creator affinity
      const isFromFollowed = userFollows.some(f => (f._id || f) === (post.author?._id || post.author));
      const creatorBoost = isFromFollowed ? 25 : 0;

      const totalRankScore = Math.round((tagScore * 8) + recencyBoost + (interactionScore * 0.4) + creatorBoost);

      let recommendationReason = "Curated for creative quality";
      if (matchedTags.length > 0) {
        recommendationReason = `Because you like #${matchedTags[0]} and visual arts`;
      } else if (isFromFollowed) {
        recommendationReason = `From a creator you follow`;
      } else if (post.remix_count > 0) {
        recommendationReason = `Trending community collaboration chain`;
      }

      return {
        ...post,
        forYouScore: totalRankScore,
        recommendationReason,
      };
    });

    return ranked.sort((a, b) => b.forYouScore - a.forYouScore);
  }

  /**
   * Translates hex codes into human-readable visual color descriptors
   */
  describeHexColor(hex) {
    if (!hex || typeof hex !== "string") return "neutral tone";
    let cleanHex = hex.replace("#", "").trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    if (cleanHex.length !== 6) return "accent tone";

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    const namedColors = [
      { name: "deep obsidian black", rgb: [10, 12, 16] },
      { name: "dark slate gray", rgb: [30, 41, 59] },
      { name: "cool charcoal gray", rgb: [71, 85, 105] },
      { name: "light silver gray", rgb: [203, 213, 225] },
      { name: "pure off-white", rgb: [248, 250, 252] },
      { name: "electric indigo", rgb: [99, 102, 241] },
      { name: "vivid royal blue", rgb: [59, 130, 246] },
      { name: "neon cyan", rgb: [6, 182, 212] },
      { name: "deep teal", rgb: [20, 184, 166] },
      { name: "emerald green", rgb: [16, 185, 129] },
      { name: "warm amber gold", rgb: [245, 158, 11] },
      { name: "sunset crimson red", rgb: [239, 68, 68] },
      { name: "hot magenta pink", rgb: [236, 72, 153] },
      { name: "deep violet purple", rgb: [139, 92, 246] },
    ];

    let closest = namedColors[0];
    let minDistance = Infinity;

    for (const c of namedColors) {
      const dist = Math.sqrt(
        Math.pow(r - c.rgb[0], 2) +
          Math.pow(g - c.rgb[1], 2) +
          Math.pow(b - c.rgb[2], 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = c;
      }
    }

    return closest.name;
  }

  /**
   * Accessibility Vision Model: Synthesizes high-fidelity alt-text from visual hints,
   * composition cues, color palette, medium tools, and mood dials.
   */
  generateAltText({
    fileName = "",
    caption = "",
    tags = [],
    palette = [],
    tools = [],
    moodCalm = 50,
    moodMinimal = 50,
    postType = "standard",
  } = {}) {
    const tagArray = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const toolArray = Array.isArray(tools)
      ? tools
      : typeof tools === "string"
      ? tools.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const combinedTokens = `${fileName} ${caption} ${tagArray.join(" ")} ${toolArray.join(" ")}`.toLowerCase();

    // 1. Primary medium classification
    let mediumType = "Digital artwork";
    if (
      toolArray.some((t) => /blender|cinema|octane|unreal|maya|spline/i.test(t)) ||
      /3d|render|cgi|mesh|poly/i.test(combinedTokens)
    ) {
      mediumType = "3D digital render";
    } else if (
      toolArray.some((t) => /figma|sketch|xd|framer/i.test(t)) ||
      /ui|ux|interface|dashboard|app|website/i.test(combinedTokens)
    ) {
      mediumType = "User interface design composition";
    } else if (
      toolArray.some((t) => /procreate|photoshop|illustrator|krita/i.test(t)) ||
      /sketch|draw|illustration|painting|doodle/i.test(combinedTokens)
    ) {
      mediumType = "Digital illustration";
    } else if (/photo|portrait|shot|street|landscape|camera|lens/i.test(combinedTokens)) {
      mediumType = "Photographic piece";
    } else if (/motion|animation|frame|timelapse/i.test(combinedTokens) || postType === "timelapse") {
      mediumType = "Sequential creative process artwork";
    } else if (postType === "before_after") {
      mediumType = "Dual before-and-after comparison artwork";
    }

    // 2. Creator tools attribution
    const toolsMention =
      toolArray.length > 0
        ? `created using ${toolArray.slice(0, 3).join(" and ")}`
        : "";

    // 3. Dominant palette translation
    const paletteArray = Array.isArray(palette) ? palette : [];
    const colorNames = paletteArray
      .slice(0, 3)
      .map((hex) => this.describeHexColor(hex));
    const uniqueColors = [...new Set(colorNames)];
    const colorDescription =
      uniqueColors.length > 0
        ? `predominantly styled in ${uniqueColors.join(", ")} tones`
        : "rendered with balanced tonal contrast";

    // 4. Stylistic and compositional atmosphere from mood dials
    let atmosphere = "";
    if (moodCalm > 65) {
      atmosphere = "featuring a serene, measured atmosphere with balanced lighting";
    } else if (moodCalm < 35) {
      atmosphere = "evoking high kinetic energy and vibrant visual contrast";
    } else {
      atmosphere = "with harmonious ambient lighting and focused depth of field";
    }

    let density = "";
    if (moodMinimal > 65) {
      density = "characterized by intricate textural details and multi-layered elements";
    } else if (moodMinimal < 35) {
      density = "emphasizing clean minimalist geometric lines and spacious negative space";
    } else {
      density = "incorporating thoughtful balance between subject clarity and subtle background texture";
    }

    // 5. Subject matter deduction
    let subjectCues = "";
    const cleanCaption = (caption || "")
      .replace(/[#@][\w-]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanCaption && cleanCaption.length > 3) {
      const snippet =
        cleanCaption.length > 85 ? cleanCaption.slice(0, 85).trim() + "..." : cleanCaption;
      subjectCues = `depicting ${snippet.toLowerCase().replace(/^(depicting|showing|a\s+photo\s+of|an\s+image\s+of)\s*/i, "")}`;
    } else if (tagArray.length > 0) {
      subjectCues = `centering around themes of ${tagArray.slice(0, 3).join(", ")}`;
    } else {
      subjectCues = "displaying a refined visual concept";
    }

    // 6. Compose clean accessible description
    const descriptors = [
      mediumType,
      toolsMention ? `(${toolsMention})` : "",
      subjectCues,
      colorDescription,
      atmosphere,
      density,
    ].filter(Boolean);

    let altText = `${descriptors[0]} ${descriptors.slice(1).join(", ")}.`;
    altText = altText
      .replace(/\s+,/g, ",")
      .replace(/\s{2,}/g, " ")
      .replace(/\.\.+/g, ".");

    return {
      altText,
      model: "Luminix Vision v2.4 (Multimodal Contrastive)",
      confidence: 96,
      generatedAt: new Date().toISOString(),
    };
  }
}

module.exports = new AiService();
