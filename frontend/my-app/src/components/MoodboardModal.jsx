import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MoodboardModal.css";
import { FiFolderPlus, FiCheck, FiLock, FiGlobe, FiX } from "react-icons/fi";

const MoodboardModal = ({ post, isOpen, onClose, mode }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#8b5cf6");
  const [statusMessage, setStatusMessage] = useState("");

  const colorOptions = [
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444"  // Rose
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:9000/collections", {
        withCredentials: true,
      });
      setCollections(res.data.collections || []);
    } catch (err) {
      console.error("Error fetching collections:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePost = async (collectionId) => {
    try {
      const res = await axios.post(
        `http://localhost:9000/collections/${collectionId}/toggle-post`,
        { postId: post._id },
        { withCredentials: true }
      );

      setStatusMessage(res.data.message);
      setTimeout(() => setStatusMessage(""), 2500);

      // Refresh collections to update check state
      fetchCollections();
    } catch (err) {
      console.error("Toggle collection error:", err);
      alert("Failed to update moodboard.");
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const res = await axios.post(
        "http://localhost:9000/collections",
        {
          name: newBoardName,
          description: newBoardDesc,
          isPrivate,
          colorTheme: selectedColor,
          initialPostId: post._id,
        },
        { withCredentials: true }
      );

      setStatusMessage(`Saved to new moodboard "${newBoardName}"!`);
      setTimeout(() => setStatusMessage(""), 2500);

      setNewBoardName("");
      setNewBoardDesc("");
      setIsCreating(false);
      fetchCollections();
    } catch (err) {
      console.error("Error creating collection:", err);
      alert("Failed to create moodboard.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="moodboard-modal-overlay" onClick={onClose}>
      <div
        className={`moodboard-modal-content ${mode ? "dark-theme" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="moodboard-modal-header">
          <div>
            <h3>Save to Moodboard</h3>
            <p className="modal-subtitle">Organize inspiring works into curated collections</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {statusMessage && (
          <div className="modal-status-banner">
            <FiCheck /> {statusMessage}
          </div>
        )}

        <div className="modal-preview-strip">
          <img
            src={`http://localhost:9000${post.file_url}`}
            alt={post.caption || "Post preview"}
            className="mini-post-thumb"
          />
          <div className="mini-post-info">
            <span className="mini-post-author">By @{post.username}</span>
            <p className="mini-post-caption">{post.caption || "Creative Work"}</p>
          </div>
        </div>

        {!isCreating ? (
          <div className="collections-list-wrapper">
            <div className="collections-list-header">
              <span>Your Moodboards</span>
              <button
                className="create-board-btn"
                onClick={() => setIsCreating(true)}
              >
                <FiFolderPlus /> New Moodboard
              </button>
            </div>

            {loading ? (
              <p className="loading-text">Loading your collections...</p>
            ) : collections.length === 0 ? (
              <div className="empty-collections-state">
                <p>No moodboards created yet.</p>
                <button
                  className="primary-accent-btn"
                  onClick={() => setIsCreating(true)}
                >
                  Create Your First Moodboard
                </button>
              </div>
            ) : (
              <div className="collections-list">
                {collections.map((col) => {
                  const isSaved = col.posts.some(
                    (p) => (typeof p === "object" ? p._id : p) === post._id
                  );

                  return (
                    <div
                      key={col._id}
                      className={`collection-item-row ${isSaved ? "saved-active" : ""}`}
                      onClick={() => handleTogglePost(col._id)}
                    >
                      <div className="collection-color-tag" style={{ background: col.colorTheme }} />
                      <div className="collection-details">
                        <div className="collection-name-row">
                          <span className="collection-name">{col.name}</span>
                          {col.isPrivate ? (
                            <span className="privacy-pill private"><FiLock /> Private</span>
                          ) : (
                            <span className="privacy-pill public"><FiGlobe /> Public</span>
                          )}
                        </div>
                        <span className="collection-count">
                          {col.posts.length} {col.posts.length === 1 ? "work" : "works"} saved
                        </span>
                      </div>

                      <div className={`checkbox-circle ${isSaved ? "checked" : ""}`}>
                        {isSaved && <FiCheck />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreateCollection} className="new-board-form">
            <div className="form-group">
              <label>Moodboard Name *</label>
              <input
                type="text"
                placeholder="e.g. Cyberpunk Aesthetics, Color Studies..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                required
                autoFocus
                className="board-input"
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                placeholder="What inspires this collection?"
                value={newBoardDesc}
                onChange={(e) => setNewBoardDesc(e.target.value)}
                className="board-textarea"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Accent Color</label>
              <div className="color-palette-picker">
                {colorOptions.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={`color-swatch ${selectedColor === color ? "active" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="form-group privacy-toggle-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <span>Keep this moodboard private (only visible to you)</span>
              </label>
            </div>

            <div className="board-form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsCreating(false)}
              >
                Back
              </button>
              <button type="submit" className="btn-save-board">
                Create & Save Work
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MoodboardModal;
