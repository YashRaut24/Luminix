import React, { useState } from "react";
import axios from "axios";
import "./CreatePost.css";

function CreatePost(props){
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState("");
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [target, setTarget] = useState("public");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const generatedURL = URL.createObjectURL(selectedFile);
      setPreview(generatedURL);
    }
  };

  return (
    <div className={props.mode ? "dark-create-post-container" : "create-post-container"}>
      <h2>Create a New Post</h2>
      <form onSubmit={(e) => { e.preventDefault(); alert("handleSubmit"); }} className="upload-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="text-input"
        />

        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="caption-input"
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />

        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="audience-select"
        >
          <option value="public">🌍 Public</option>
          <option value="followers">👥 Followers</option>
          <option value="close-friends">💚 Close Friends</option>
          <option value="private">🔒 Private</option>
        </select>

        {preview && (
          <div className="preview-section">
            <img src={preview} alt="preview" className="preview-img" />
            <button 
              type="button" 
              onClick={() => { 
                setFile(null); 
                setPreview(null);
                document.querySelector('.file-input').value = '';
              }}
            >
              Remove
            </button>
          </div>
        )}
        <input
          type="text"
          placeholder="Add tags (press Enter)"
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
          className="tag-input"
        />
        <div className="tag-section">

        <div className="tag-list">
          {tags.map((tag, index) => (
            <span key={index} className="tag-chip">
              #{tag}
              <button
                type="button"
                className="remove-tag"
                onClick={() =>
                  setTags(tags.filter((t) => t !== tag))
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

        <button type="submit" className="upload-button">
          Upload
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default CreatePost;