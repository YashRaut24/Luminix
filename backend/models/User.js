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
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);