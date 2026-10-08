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
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);