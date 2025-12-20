import React, { useState } from "react";
import "./CreatePost.css";

function CreatePost(props){
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState("");
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [postType, setPostType] = useState("");
  const [preview, setPreview] = useState(null);
  const [target, setTarget] = useState("public");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    document.querySelector(".file-input").value = "";
  };

  // ✅ FRONTEND-ONLY SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!file || !username.trim() || !caption.trim() || !target.trim() || !postType.trim()) {
      setMessage("Please fill all fields before posting.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage("");

    // 🔁 Fake upload progress (UI only)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadComplete(true);
          setMessage("Uploaded Successfully!");

          setTimeout(() => {
            setUploadComplete(false);
            setUploadProgress(0);
            setMessage("");
            setFile(null);
            setPreview(null);
            setUsername("");
            setCaption("");
            setPostType("");
            setTags([]);
            setTarget("public");
            document.querySelector(".file-input").value = "";
          }, 2000);

          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div className={props.mode ? "dark-create-post-container" : "create-post-container"}>
      <div className="post-header">
        <h2>Create New Post</h2>
        <p className="post-subtitle">Share your moment with the world</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-grid">

          {/* LEFT COLUMN */}
          <div className="form-column left-column">
            <div className="form-section">
              <label className="form-label">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">Caption</label>
              <textarea
                placeholder="What's on your mind?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="form-textarea"
                rows="4"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Audience</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="form-select"
              >
                <option value="public">🌍 Public</option>
                <option value="followers">👥 Followers Only</option>
                <option value="close-friends">💚 Close Friends</option>
                <option value="private">🔒 Only Me</option>
              </select>
            </div>

            <div className="form-section">
              <label className="form-label">Tags</label>
              <input
                type="text"
                placeholder="Type and press Enter to add tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = tagInput.trim().replace(/^#/, "");
                    if (value && !tags.includes(value)) {
                      setTags([...tags, value]);
                      setTagInput("");
                    }
                  }
                }}
                className="form-input"
              />

              {tags.length > 0 && (
                <div className="tags-container">
                  {tags.map((tag, index) => (
                    <span key={index} className="tag-chip">
                      #{tag}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => setTags(tags.filter(t => t !== tag))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="form-column right-column">
            <div className="form-section">
              <label className="form-label">Post Type</label>
              <input
                type="text"
                placeholder="Enter post type"
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="upload-section">
              <label className="form-label">Upload Image</label>

              {!preview ? (
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="file-input-label">
                    <div className="upload-icon">📷</div>
                    <p className="upload-text">Click to upload or drag & drop</p>
                    <p className="upload-hint">PNG, JPG, GIF up to 10MB</p>
                  </label>
                </div>
              ) : (
                <div className="preview-container">
                  <img src={preview} alt="Preview" className="preview-image" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={handleRemoveFile}
                  >
                    ✕ Remove Image
                  </button>
                </div>
              )}
            </div>

            {(isUploading || uploadComplete) && (
              <div className="progress-wrapper">
                {isUploading && (
                  <div className="progress-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <span className="progress-label">{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {uploadComplete && (
                  <div className="success-message">
                    <span className="success-icon">✓</span>
                    <span>Upload Complete!</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={isUploading || !file}
            >
              {isUploading ? (
                <>
                  <span className="btn-spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Post Now
                </>
              )}
            </button>
          </div>
        </div>

        {message && !uploadComplete && (
          <div className={`alert ${message.includes("Success") ? "alert-success" : "alert-error"}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default CreatePost;
