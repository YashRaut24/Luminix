import React, { useState,useEffect } from "react";
import { CgProfile } from "react-icons/cg";
import { BsCameraFill, BsTrophy, BsFire } from "react-icons/bs";
import { MdVerified, MdEdit, MdSettings } from "react-icons/md";
import { AiOutlineHeart, AiOutlineStar } from "react-icons/ai";
import { FiTrendingUp, FiMail, FiMapPin, FiCalendar } from "react-icons/fi";
import "./Profile.css";

function Profile({ mode, onClose, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [moodStatus, setMoodStatus] = useState("😊");
  const [activeTab, setActiveTab] = useState("all");
  useEffect(() => {
    if (!user) return;

    setProfile(prev => ({
      ...prev,
      name: user.name || "",
      handle: user.email || "",
      email: user.email || "",
      bio: user.bio || "Tell something about yourself",
      location: user.location || "Unknown",
      joinDate: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : "Recently joined"
    }));
  }, [user]);
console.log("USER PROP:", user);

  const [profile, setProfile] = useState({
    name: "",
    handle: "",
    bio: "",
    email: "",
    location: "",
    joinDate: "",
    profilePic: "https://via.placeholder.com/150",
    verified: true,
    level: 12,
    xp: 2850,
    maxXP: 3000
  });


  const [editedProfile, setEditedProfile] = useState(profile);

  const stats = {
    inspiringPosts: 23,
    streakDays: 15,
    topLikedMonth: 1240
  };

  const badges = [
    { id: 1, name: "Early Adopter", icon: "🏆", unlocked: true },
    { id: 2, name: "Streak Master", icon: "🔥", unlocked: true },
    { id: 3, name: "Trendsetter", icon: "⭐", unlocked: true },
    { id: 4, name: "Legend", icon: "👑", unlocked: false }
  ];

  const pinnedPosts = [
    { id: 1, image: "https://via.placeholder.com/300", likes: 450 },
    { id: 2, image: "https://via.placeholder.com/300", likes: 380 },
    { id: 3, image: "https://via.placeholder.com/300", likes: 520 }
  ];

  const recentPosts = [
    { id: 4, image: "https://via.placeholder.com/300", mood: "happy" },
    { id: 5, image: "https://via.placeholder.com/300", mood: "creative" },
    { id: 6, image: "https://via.placeholder.com/300", mood: "chill" },
    { id: 7, image: "https://via.placeholder.com/300", mood: "energetic" },
    { id: 8, image: "https://via.placeholder.com/300", mood: "inspired" },
    { id: 9, image: "https://via.placeholder.com/300", mood: "peaceful" }
  ];

  const moods = ["😊", "😎", "🤩", "😌", "🔥", "✨", "🎨", "📸"];

  const handleMoodChange = () => {
    const currentIndex = moods.indexOf(moodStatus);
    setMoodStatus(moods[(currentIndex + 1) % moods.length]);
  };

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className={mode ? "dark-profile-overlay" : "profile-overlay"} onClick={onClose}>
      <div
        className={mode ? "dark-profile-wrapper" : "profile-wrapper"}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="profile-close-btn" onClick={onClose}>✕</button>

        {/* LEFT SECTION */}
        <div className="profile-left-section">
          <div className="profile-card-main">
            <div className="profile-cover-section">
              <div className="cover-gradient"></div>

              <div className="profile-avatar-wrapper">
                <div className="avatar-glow"></div>
                <img src={profile.profilePic} alt="Profile" className="profile-avatar" />
                {profile.verified && (
                  <div className="verified-badge">
                    <MdVerified />
                  </div>
                )}
              </div>
            </div>

            <div className="profile-main-info">
              {!isEditing ? (
                <>
                  <div className="name-section">
                    <h1 className="user-name">{profile.name}</h1>
                    <span className="user-handle">{profile.handle}</span>
                  </div>
                  <p className="user-bio">{profile.bio}</p>
                </>
              ) : (
                <>
                  <input
                    className="edit-name-input"
                    value={editedProfile.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                  <input
                    className="edit-handle-input"
                    value={editedProfile.handle}
                    onChange={(e) => handleChange("handle", e.target.value)}
                  />
                  <textarea
                    className="edit-bio-textarea"
                    rows="3"
                    value={editedProfile.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                  />
                </>
              )}

              <div className="profile-details-list">
                <div className="detail-row">
                  <FiMail />
                  {!isEditing ? (
                    <span>{profile.email}</span>
                  ) : (
                    <input
                      className="detail-edit-input"
                      value={editedProfile.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  )}
                </div>

                <div className="detail-row">
                  <FiMapPin />
                  {!isEditing ? (
                    <span>{profile.location}</span>
                  ) : (
                    <input
                      className="detail-edit-input"
                      value={editedProfile.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                    />
                  )}
                </div>

                <div className="detail-row">
                  <FiCalendar />
                  <span>Joined {profile.joinDate}</span>
                </div>
              </div>

              <div className="profile-action-btns">
                {!isEditing ? (
                  <button className="edit-profile-btn" onClick={handleEdit}>
                    <MdEdit />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="edit-action-group">
                    <button className="save-profile-btn" onClick={handleSave}>Save</button>
                    <button className="cancel-profile-btn" onClick={handleCancel}>Cancel</button>
                  </div>
                )}
              </div>

              <button className="mood-selector" onClick={handleMoodChange}>
                <span className="mood-emoji">{moodStatus}</span>
                <span className="mood-text">Current Mood</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="profile-right-section">
          <div className="stats-grid">
            <div className="mini-stat-card">
              <AiOutlineStar />
              <span>{stats.inspiringPosts}</span>
            </div>
            <div className="mini-stat-card">
              <BsFire />
              <span>{stats.streakDays}</span>
            </div>
            <div className="mini-stat-card">
              <FiTrendingUp />
              <span>{stats.topLikedMonth}</span>
            </div>
          </div>

          <div className="level-progress-section">
            <div className="level-header-row">
              <BsTrophy />
              <span>Level {profile.level}</span>
            </div>
            <div className="xp-progress-bar">
              <div
                className="xp-progress-fill"
                style={{ width: `${(profile.xp / profile.maxXP) * 100}%` }}
              />
            </div>
          </div>

          <div className="achievements-section">
            <h3 className="subsection-title">Achievements</h3>
            <div className="badges-row">
              {badges.map(b => (
                <div key={b.id} className={`badge-box ${b.unlocked ? "unlocked" : "locked"}`}>
                  <span className="badge-emoji">{b.icon}</span>
                  <span className="badge-title">{b.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pinned-posts-section">
            <h3 className="subsection-title">Pinned Creations</h3>
            <div className="pinned-posts-grid">
              {pinnedPosts.map(p => (
                <div key={p.id} className="pinned-post-item">
                  <img src={p.image} alt="" />
                  <div className="pinned-post-overlay">
                    <AiOutlineHeart />
                    <span>{p.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-posts-section">
            <div className="posts-tabs-row">
              {["all", "mood", "popular"].map(tab => (
                <button
                  key={tab}
                  className={`post-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="recent-posts-grid">
              {recentPosts.map(p => (
                <div key={p.id} className="recent-post-item">
                  <img src={p.image} alt="" />
                  <div className="recent-post-overlay">
                    <span className="post-mood-badge">{p.mood}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;