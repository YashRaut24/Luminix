import React, { useState,useEffect } from "react";
import { CgProfile } from "react-icons/cg";
import { BsCameraFill, BsTrophy, BsFire } from "react-icons/bs";
import { MdVerified, MdEdit, MdSettings } from "react-icons/md";
import { AiOutlineHeart, AiOutlineStar } from "react-icons/ai";
import { FiTrendingUp, FiMail, FiMapPin, FiCalendar, FiBookmark, FiLock, FiGlobe, FiX } from "react-icons/fi";
import "./Profile.css";
import axios from "axios";
import { useNavigate } from "react-router-dom"

function Profile({ mode, user }) {
    const [isEditing, setIsEditing] = useState(false);
    const [moodStatus, setMoodStatus] = useState("😊");
    const [activeTab, setActiveTab] = useState("all");
    const [image,setImage] = useState(null);
    const [close,setClose] = useState(null);
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [skillBadges, setSkillBadges] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
      const fetchUser = async () => {
        try {
          const res = await axios.get(
            "http://localhost:9000/me",
            { withCredentials: true }
          );

          setProfile(prev => ({
            ...prev,
            name: res.data.user.name,
            handle: res.data.user.email,
            email: res.data.user.email,
            bio: res.data.user.bio || "Tell something about yourself",
            location: res.data.user.location || "Unknown",
            joinDate: res.data.user.createdAt
              ? new Date(res.data.user.createdAt).toLocaleDateString()
              : "Recently joined",
          }));

          setImage(res.data.user.profileImage || null);

          // Record profile view
          if (res.data.user._id) {
            axios.post(`http://localhost:9000/users/${res.data.user._id}/view`).catch(() => {});
          }

          // Fetch verified skill badges
          try {
            const badgeRes = await axios.get("http://localhost:9000/creator/badges", {
              withCredentials: true,
            });
            setSkillBadges(badgeRes.data.badges || []);
          } catch (bErr) {
            console.log("Badges err:", bErr);
          }

          try {
            const colRes = await axios.get("http://localhost:9000/collections", {
              withCredentials: true,
            });
            setCollections(colRes.data.collections || []);
          } catch (colErr) {
            console.log("Collections load err:", colErr);
          }

          } catch (err) {
            console.error("FETCH USER ERROR:", err);
          }
        };

        fetchUser();
      }, []);

    const handleUpload = async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      setImage(file);

      const formData = new FormData();
      formData.append("profile",file);

      try {
        const res = await axios.post(
            "http://localhost:9000/profile/upload",
            formData,
            {
              withCredentials: true,
              headers: { "Content-Type": "multipart/form-data" }
            }
        );

        setImage(res.data.imagePath);
        if (user) {
          const updatedUser = {
            ...user,
            profileImage: res.data.imagePath,
          };

          localStorage.setItem("userData", JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error("UPLOAD ERROR:", err);
        alert(err.response?.data?.message || "Upload failed");
      }

    };
    
    const [profile, setProfile] = useState({
      name: "",
      handle: "",
      bio: "",
      email: "",
      location: "",
      joinDate: "",
      profilePic: "",
      verified: true,
      level: 12,
      xp: 2850,
      maxXP: 3000
    });
    useEffect(() => {
      setEditedProfile(profile);
    }, [profile]);

    useEffect(() => {
      if (!user) return;

      setProfile(prev => ({
        ...prev,
        profile: user.profile || "",
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

  const handleClose = () => {
    setClose(navigate("/feed"));
  }

  return (
    <div className={mode ? "dark-profile-overlay" : "profile-overlay"} onClick={handleClose}>
      
      {!close &&
        (
            <div
              className={mode ? "dark-profile-wrapper" : "profile-wrapper"}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="profile-close-btn" onClick={handleClose}>✕</button>

              <div className="profile-left-section">
                <div className="profile-card-main">
                  {/* <div className="profile-cover-section">
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
                  </div> */}

                  <div className="profile-main-info">
                    
                    
                    <label className="file-upload">
                      {image && 
                      <img className="profile-image" src={
                        image instanceof File
                          ? URL.createObjectURL(image)
                          : `http://localhost:9000${image}`
                      } alt="profile"/>
                      } 
                      <input type="file" accept = "image/" hidden onChange={handleUpload} />
                    </label>


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
                        <span className="user-handle">{profile.handle}</span>
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
                          <span>{profile.email}</span>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <h3 className="subsection-title" style={{ margin: 0 }}>Verified Skill & Milestone Badges</h3>
                    <button
                      type="button"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        color: "#ffffff",
                        border: "none",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                      onClick={() => navigate("/feed/analytics")}
                    >
                      <FiTrendingUp /> Studio Analytics
                    </button>
                  </div>
                  <div className="badges-row">
                    {skillBadges.length > 0 ? (
                      skillBadges.map((b, idx) => (
                        <div key={idx} className="badge-box unlocked" title={b.description}>
                          <span className="badge-emoji">{b.icon || "⭐"}</span>
                          <span className="badge-title">{b.title}</span>
                        </div>
                      ))
                    ) : (
                      badges.map(b => (
                        <div key={b.id} className={`badge-box ${b.unlocked ? "unlocked" : "locked"}`}>
                          <span className="badge-emoji">{b.icon}</span>
                          <span className="badge-title">{b.name}</span>
                        </div>
                      ))
                    )}
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
                    {["all", "moodboards", "mood", "popular"].map(tab => (
                      <button
                        key={tab}
                        className={`post-tab ${activeTab === tab ? "active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === "moodboards" ? "🎨 MOODBOARDS" : tab.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {activeTab === "moodboards" ? (
                    <div className="moodboards-profile-container">
                      {collections.length === 0 ? (
                        <div className="empty-moodboards-view">
                          <FiBookmark className="empty-moodboard-icon" />
                          <h4>No Moodboards Created Yet</h4>
                          <p>Curate your creative inspiration by clicking "Board" on any post in your feed.</p>
                        </div>
                      ) : (
                        <div className="moodboards-cards-grid">
                          {collections.map(board => (
                            <div
                              key={board._id}
                              className="moodboard-card"
                              onClick={() => setSelectedCollection(board)}
                            >
                              <div
                                className="moodboard-card-color-bar"
                                style={{ background: board.colorTheme || "#8b5cf6" }}
                              />
                              <div className="moodboard-card-header">
                                <h4 className="moodboard-title">{board.name}</h4>
                                {board.isPrivate ? (
                                  <span className="privacy-pill private"><FiLock /> Private</span>
                                ) : (
                                  <span className="privacy-pill public"><FiGlobe /> Public</span>
                                )}
                              </div>
                              {board.description && (
                                <p className="moodboard-desc">{board.description}</p>
                              )}

                              {/* Mosaic Preview of Posts in this board */}
                              <div className="moodboard-mosaic">
                                {board.posts && board.posts.length > 0 ? (
                                  board.posts.slice(0, 3).map((item, i) => (
                                    <div key={i} className="mosaic-thumb-slot">
                                      <img
                                        src={`http://localhost:9000${item.file_url}`}
                                        alt={item.caption || "Saved piece"}
                                      />
                                    </div>
                                  ))
                                ) : (
                                  <div className="mosaic-empty-slot">
                                    <span>Empty Board</span>
                                  </div>
                                )}
                              </div>

                              <div className="moodboard-card-footer">
                                <span className="moodboard-items-count">
                                  {board.posts?.length || 0} {(board.posts?.length || 0) === 1 ? "creation" : "creations"}
                                </span>
                                <span className="moodboard-view-btn">View Board →</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
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
                  )}
                </div>

              </div>
            </div>
        )
      } 

      {/* Selected Moodboard View Lightbox Modal */}
      {selectedCollection && (
        <div className="board-viewer-modal-overlay" onClick={() => setSelectedCollection(null)}>
          <div
            className={`board-viewer-modal-content ${mode ? "dark-theme" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="board-viewer-header">
              <div>
                <div className="board-viewer-title-row">
                  <span
                    className="board-color-indicator"
                    style={{ background: selectedCollection.colorTheme }}
                  />
                  <h2>{selectedCollection.name}</h2>
                  {selectedCollection.isPrivate ? (
                    <span className="privacy-pill private"><FiLock /> Private</span>
                  ) : (
                    <span className="privacy-pill public"><FiGlobe /> Public</span>
                  )}
                </div>
                {selectedCollection.description && (
                  <p className="board-viewer-desc">{selectedCollection.description}</p>
                )}
              </div>
              <button
                className="board-close-btn"
                onClick={() => setSelectedCollection(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="board-saved-items-grid">
              {!selectedCollection.posts || selectedCollection.posts.length === 0 ? (
                <div className="board-no-items">
                  <p>No works saved in this board yet.</p>
                </div>
              ) : (
                selectedCollection.posts.map((postItem, idx) => (
                  <div key={idx} className="board-saved-item-card">
                    <img
                      src={`http://localhost:9000${postItem.file_url}`}
                      alt={postItem.caption || "Saved post"}
                      className="board-item-image"
                    />
                    <div className="board-item-info">
                      <span className="board-item-creator">@{postItem.username}</span>
                      <p className="board-item-caption">{postItem.caption}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )} 
      
    </div>
  );
}

export default Profile;