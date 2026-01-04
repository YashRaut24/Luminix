import React, { useState } from "react";
import "./ShowPost.css";

function PostCard({ post, mode }) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [reposts, setReposts] = useState(post.reposts || 0);
  const [shares, setShares] = useState(post.shares || 0);

  const formatTime = (time) => {
    return new Date(time).toLocaleString();
  };

  return (
    <div className={mode ? "dark-show-posts-container" : "show-posts-container"}>
      <div className="post-card">

        <div className="post-header">
          <h4>{post.username}</h4>
          <span className="post-audience">
            {post.target === "public" ? "🌍 Public" : "🔒 Private"}
          </span>
        </div>

        <div className="post-image-container">
          <img
            src={`http://localhost:9000${post.file_url}`}
            alt={post.file_name}
            className="post-image"
          />
        </div>

        <div className="post-interaction-bar">
          <button
            className={`interaction-btn ${liked ? "active-like" : ""}`}
            onClick={() => {
              setLiked(!liked);
              setLikes(prev => prev + (liked ? -1 : 1));
            }}
          >
            ♥ {likes}
          </button>

          <button
            className={`interaction-btn ${reposted ? "active-repost" : ""}`}
            onClick={() => {
              setReposted(!reposted);
              setReposts(prev => prev + (reposted ? -1 : 1));
            }}
          >
            ↻ {reposts}
          </button>

          <button
            className="interaction-btn"
            onClick={() => setShares(prev => prev + 1)}
          >
            ⤴ {shares}
          </button>
        </div>

        <div className="post-footer">
          <p className="post-caption">{post.caption}</p>

          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag, i) => (
                <span key={i} className="tag-chip">#{tag}</span>
              ))}
            </div>
          )}

          <p className="post-time">{formatTime(post.upload_time)}</p>
        </div>

      </div>
    </div>
  );
}

export default PostCard;
