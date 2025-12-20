import React, { useState } from "react";
import "./ShowPost.css";

function ShowPost(props) {
  const [files, setFiles] = useState([
    {
      _id: "1",
      username: "John Doe",
      email: "user@luminix.com",
      target: "public",
      file_url: "https://via.placeholder.com/400",
      file_name: "post1.jpg",
      caption: "Exploring creativity ✨",
      tags: ["art", "design"],
      upload_time: new Date()
    },
    {
      _id: "2",
      username: "John Doe",
      email: "user@luminix.com",
      target: "private",
      file_url: "https://via.placeholder.com/400",
      file_name: "post2.jpg",
      caption: "Late night vibes 🌙",
      tags: ["mood", "night"],
      upload_time: new Date()
    }
  ]);

  const formatTime = (time) => {
    const date = new Date(time);
    return date.toLocaleString();
  };

  const handleDelete = (id) => {
    setFiles(prev => prev.filter(file => file._id !== id));
  };

  return (
    <div className={props.mode ? "dark-show-posts-wrapper" : "show-posts-wrapper"}>
      <div className={props.mode ? "dark-show-posts-container" : "show-posts-container"}>
        {files.length === 0 ? (
          <div className="no-posts-message">
            <p>No posts available for this feed</p>
          </div>
        ) : (
          <div className={props.mode ? "dark-posts-grid" : "posts-grid"}>
            {files.map((file) => (
              <div key={file._id} className="post-card">
                <div className="post-header">
                  <h4>{file.username}</h4>
                  <span className="post-audience">
                    {file.target === "public" ? "🌍 Public" : "🔒 Private"}
                  </span>
                </div>

                <div className="post-image-container">
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="post-image"
                  />
                </div>

                <div className="post-footer">
                  <p className="post-caption">{file.caption}</p>

                  {file.tags && file.tags.length > 0 && (
                    <div className="post-tags">
                      {file.tags.map((tag, index) => (
                        <span key={index} className="tag-chip">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="post-time">{formatTime(file.upload_time)}</p>

                  {/* OWNER ACTIONS (frontend-only) */}
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(file._id)}
                  >
                    Delete
                  </button>
                  <button className="edit-button">Edit</button>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShowPost;
