const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  profileImage: {
    type: String,
    default: "",
  },
  profileBackground: {
    type: String,
    default: "",
  },
  lumiTag: {
    type: String,
    default: function() {
      return `@${this.name.toLowerCase().replace(/\s+/g, '')}`;
    }
  },
  role: {
    type: String,
    enum: ["creators", "knownPeople", "others"],
    default: "others"
  },
  creatorRole: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  growthRate: {
    type: Number,
    default: 0
  },
  spotlightBadge: {
    type: Boolean,
    default: false
  },
  skillBadges: [{
    title: { type: String },
    icon: { type: String },
    earnedAt: { type: Date, default: Date.now },
    description: { type: String }
  }],
  profileViews: {
    type: Number,
    default: 0
  },
  accentColor: {
    type: String,
    default: "#8b5cf6"
  },
  profileLayout: {
    type: String,
    enum: ["grid", "list", "showcase"],
    default: "grid"
  },
  followedSeries: [{
    type: String
  }],
  seriesProgress: [{
    series_id: String,
    last_chapter: Number,
    updatedAt: { type: Date, default: Date.now }
  }],
  criticBadges: {
    type: Number,
    default: 0
  },
  // Growth & Sharing Fields
  open_for_commissions: {
    type: Boolean,
    default: false
  },
  commission_info: {
    rate_starting_at: { type: String, default: "" },
    specialties: [{ type: String }],
    turnaround_time: { type: String, default: "1-2 weeks" },
    contact_email: { type: String, default: "" }
  },
  portfolio_posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }],
  portfolio_title: {
    type: String,
    default: ""
  },
  portfolio_bio: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);