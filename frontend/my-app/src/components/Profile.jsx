import React, { useState, useEffect } from "react";
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
  
  const [profile, setProfile] = useState({
    name: user?.name || "User",
    handle: `@${user?.name?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
    bio: "Digital artist & photographer 📸 | Capturing moments ✨ | #Creative #Photography",
    email: user?.email || "user@luminix.com",
    location: "San Francisco, CA",
    joinDate: "January 2024",
    profilePic: "https://via.placeholder.com/150",
    verified: true,
    level: 12,
    xp: 2850,
    maxXP: 3000
  });

  const [editedProfile, setEditedProfile] = useState(profile);

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        handle: `@${user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}`
      }));
      setEditedProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        handle: `@${user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}`
      }));
    }
  }, [user]);

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
    const nextIndex = (currentIndex + 1) % moods.length;
    setMoodStatus(moods[nextIndex]);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
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
                    type="text"
                    className="edit-name-input"
                    value={editedProfile.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your name"
                  />
                  <input
                    type="text"
                    className="edit-handle-input"
                    value={editedProfile.handle}
                    onChange={(e) => handleChange('handle', e.target.value)}
                    placeholder="@username"
                  />
                  <textarea
                    className="edit-bio-textarea"
                    value={editedProfile.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Tell us about yourself"
                    rows="3"
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
                      type="email"
                      className="detail-edit-input"
                      value={editedProfile.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  )}
                </div>
                <div className="detail-row">
                  <FiMapPin />
                  {!isEditing ? (
                    <span>{profile.location}</span>
                  ) : (
                    <input
                      type="text"
                      className="detail-edit-input"
                      value={editedProfile.location}
                      onChange={(e) => handleChange('location', e.target.value)}
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
                    <button className="save-profile-btn" onClick={handleSave}>
                      <span>Save</span>
                    </button>
                    <button className="cancel-profile-btn" onClick={handleCancel}>
                      <span>Cancel</span>
                    </button>
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

        <div className="profile-right-section">
          <div className="stats-grid">
            <div className="mini-stat-card">
              <div className="stat-icon-box">
                <AiOutlineStar />
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.inspiringPosts}</span>
                <span className="stat-text">Inspiring Posts</span>
              </div>
            </div>

            <div className="mini-stat-card">
              <div className="stat-icon-box">
                <BsFire />
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.streakDays}</span>
                <span className="stat-text">Day Streak</span>
              </div>
            </div>

            <div className="mini-stat-card">
              <div className="stat-icon-box">
                <FiTrendingUp />
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.topLikedMonth}</span>
                <span className="stat-text">Top Post Likes</span>
              </div>
            </div>
          </div>

          <div className="quick-actions-row">
            <button className="quick-action-btn primary">
              <BsCameraFill />
              <span>Upload Post</span>
            </button>
            <button className="quick-action-btn secondary">
              <MdSettings />
              <span>Settings</span>
            </button>
          </div>

          <div className="level-progress-section">
            <div className="level-header-row">
              <div className="level-badge-chip">
                <BsTrophy />
                <span>Level {profile.level}</span>
              </div>
              <span className="xp-progress-text">{profile.xp} / {profile.maxXP} XP</span>
            </div>
            <div className="xp-progress-bar">
              <div 
                className="xp-progress-fill" 
                style={{ width: `${(profile.xp / profile.maxXP) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="achievements-section">
            <h3 className="subsection-title">Achievements</h3>
            <div className="badges-row">
              {badges.map(badge => (
                <div 
                  key={badge.id} 
                  className={`badge-box ${badge.unlocked ? 'unlocked' : 'locked'}`}
                  title={badge.name}
                >
                  <span className="badge-emoji">{badge.icon}</span>
                  <span className="badge-title">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pinned-posts-section">
            <h3 className="subsection-title">Pinned Creations</h3>
            <div className="pinned-posts-grid">
              {pinnedPosts.map(post => (
                <div key={post.id} className="pinned-post-item">
                  <img src={post.image} alt="Pinned" />
                  <div className="pinned-post-overlay">
                    <AiOutlineHeart />
                    <span>{post.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-posts-section">
            <div className="posts-tabs-row">
              <button 
                className={`post-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Posts
              </button>
              <button 
                className={`post-tab ${activeTab === 'mood' ? 'active' : ''}`}
                onClick={() => setActiveTab('mood')}
              >
                By Mood
              </button>
              <button 
                className={`post-tab ${activeTab === 'popular' ? 'active' : ''}`}
                onClick={() => setActiveTab('popular')}
              >
                Popular
              </button>
            </div>

            <div className="recent-posts-grid">
              {recentPosts.map(post => (
                <div key={post.id} className="recent-post-item">
                  <img src={post.image} alt="Post" />
                  <div className="recent-post-overlay">
                    <span className="post-mood-badge">{post.mood}</span>
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