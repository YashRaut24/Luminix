import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import "./ShowPost.css";
import "./PostCard.css";
import MoodboardModal from "./MoodboardModal";
import ThreadedComments from "./ThreadedComments";
import {
  FiHeart,
  FiRepeat,
  FiShare2,
  FiBookmark,
  FiLayers,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiMessageCircle
} from "react-icons/fi";
import { BsPaletteFill, BsStars } from "react-icons/bs";

function PostCard({ post, mode }) {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("userData");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const currentUserId = currentUser ? currentUser.id || currentUser._id : null;
  const initialLiked =
    currentUserId &&
    post.likesList &&
    post.likesList.some(
      (id) => (typeof id === "object" ? id._id : id) === currentUserId
    );

  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [reposted, setReposted] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [reposts, setReposts] = useState(post.reposts || 0);
  const [shares, setShares] = useState(post.shares || 0);

  // Process / Making-Of strip states
  const [showProcessStrip, setShowProcessStrip] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Comments drawer state
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(
    post.comments ? post.comments.length : 0
  );

  // Moodboard modal state
  const [showMoodboardModal, setShowMoodboardModal] = useState(false);

  // Real-time live likes & comments listener via Socket.io
  useEffect(() => {
    const handleLikeUpdate = (data) => {
      if (data.postId === post._id) {
        setLikes(data.likesCount);
        if (currentUserId && data.userId === currentUserId) {
          setLiked(data.isLiked);
        }
      }
    };

    const handleCommentAdded = (data) => {
      if (data.postId === post._id) {
        setCommentsCount((prev) => prev + 1);
      }
    };

    socket.on("post_like_updated", handleLikeUpdate);
    socket.on("post_comment_added", handleCommentAdded);

    return () => {
      socket.off("post_like_updated", handleLikeUpdate);
      socket.off("post_comment_added", handleCommentAdded);
    };
  }, [post._id, currentUserId]);

  const handleLikeClick = async () => {
    try {
      // Optimistic update
      const nextLiked = !liked;
      setLiked(nextLiked);
      setLikes((prev) => prev + (nextLiked ? 1 : -1));

      const res = await axios.post(
        `http://localhost:9000/posts/${post._id}/like`,
        {},
        { withCredentials: true }
      );

      setLiked(res.data.isLiked);
      setLikes(res.data.likesCount);
    } catch (err) {
      console.error("Like toggle error:", err);
    }
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRemixClick = () => {
    navigate("/feed/create", {
      state: {
        remixPost: {
          _id: post._id,
          username: post.username,
          caption: post.caption,
          file_url: post.file_url,
          tags: post.tags,
        },
      },
    });
  };

  const hasProcessSteps = post.process_steps && post.process_steps.length > 0;
  const currentProcessStep = hasProcessSteps ? post.process_steps[activeStepIndex] : null;

  return (
    <div className={mode ? "dark-show-posts-container" : "show-posts-container"}>
      <div className={`post-card ${mode ? "dark-theme" : ""}`}>
        {/* Remix Reference Header (if this post is a remix) */}
        {post.remix_of && (
          <div className="remix-reference-banner">
            <div className="remix-badge">
              <BsPaletteFill /> {post.remix_type || "Creative Remix"}
            </div>
            <div className="remix-parent-summary">
              <img
                src={`http://localhost:9000${post.remix_of.file_url}`}
                alt="Original inspiration"
                className="remix-parent-thumb"
              />
              <div className="remix-parent-details">
                <span className="remix-parent-author">
                  Inspired by @{post.remix_of.username || "creator"}
                </span>
                <span className="remix-parent-caption">
                  "{post.remix_of.caption || "Original piece"}"
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="post-header">
          <div className="post-author-box">
            <div className="post-avatar-placeholder">
              {post.author?.profileImage ? (
                <img
                  src={`http://localhost:9000${post.author.profileImage}`}
                  alt={post.username}
                  className="post-avatar-img"
                />
              ) : (
                <span>{post.username?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>
            <div className="post-user-info">
              <h4 className="post-author-name">{post.username}</h4>
              <span className="post-author-tag">
                {post.author?.lumiTag || `@${post.username?.toLowerCase()}`}
              </span>
            </div>
          </div>

          <div className="post-header-badges">
            {post.recommendationReason && (
              <span className="for-you-affinity-badge" title={`Affinity: ${post.recommendationScore || 0}%`}>
                <BsStars /> {post.recommendationReason}
              </span>
            )}
            {hasProcessSteps && (
              <button
                type="button"
                className={`process-pill-badge ${showProcessStrip ? "active" : ""}`}
                onClick={() => setShowProcessStrip(!showProcessStrip)}
                title="Toggle WIP / Making-Of Strip"
              >
                <FiLayers /> {hasProcessSteps ? `${post.process_steps.length} WIP Shots` : "Process"}
              </button>
            )}
            <span className="post-audience">
              {post.target === "public" ? "🌍 Public" : "🔒 Private"}
            </span>
          </div>
        </div>

        {/* Post Image or Process / Making-Of Strip */}
        <div className="post-image-container">
          {!showProcessStrip ? (
            <img
              src={`http://localhost:9000${post.file_url}`}
              alt={post.file_name || "Luminix Post"}
              className="post-image"
            />
          ) : (
            <div className="process-strip-viewer">
              <div className="process-image-stage">
                <img
                  src={`http://localhost:9000${currentProcessStep.file_url}`}
                  alt={currentProcessStep.phase_label}
                  className="process-stage-image"
                />

                <div className="process-floating-controls">
                  <button
                    className="nav-step-btn prev"
                    disabled={activeStepIndex === 0}
                    onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="step-counter-pill">
                    {activeStepIndex + 1} / {post.process_steps.length}
                  </span>
                  <button
                    className="nav-step-btn next"
                    disabled={activeStepIndex === post.process_steps.length - 1}
                    onClick={() =>
                      setActiveStepIndex((prev) =>
                        Math.min(post.process_steps.length - 1, prev + 1)
                      )
                    }
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>

              {/* Step info overlay */}
              <div className="process-step-info-bar">
                <div className="step-phase-title">
                  <span className="phase-marker">STAGE {activeStepIndex + 1}</span>
                  <strong>{currentProcessStep.phase_label}</strong>
                </div>
                {currentProcessStep.caption && (
                  <p className="step-caption-note">{currentProcessStep.caption}</p>
                )}
              </div>

              {/* Step thumbnails strip */}
              <div className="process-thumbnail-strip">
                {post.process_steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`thumb-scrub-item ${idx === activeStepIndex ? "active" : ""}`}
                    onClick={() => setActiveStepIndex(idx)}
                  >
                    <img
                      src={`http://localhost:9000${step.file_url}`}
                      alt={step.phase_label}
                    />
                    <span className="thumb-label">{idx + 1}</span>
                  </div>
                ))}
                <div
                  className="thumb-scrub-item final-toggle"
                  onClick={() => setShowProcessStrip(false)}
                >
                  <img src={`http://localhost:9000${post.file_url}`} alt="Final" />
                  <span className="thumb-label final">Final</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick toggle button if process thread is available */}
          {hasProcessSteps && !showProcessStrip && (
            <button
              className="quick-process-toggle-btn"
              onClick={() => setShowProcessStrip(true)}
            >
              <FiLayers /> View Making-Of Strip
            </button>
          )}
        </div>

        {/* Interaction Bar with Live Like, Live Comments, Remix & Moodboard */}
        <div className="post-interaction-bar">
          <button
            className={`interaction-btn ${liked ? "active-like" : ""}`}
            onClick={handleLikeClick}
            title="Real-time live like"
          >
            <FiHeart className="interaction-icon" />
            <span className="interaction-count">{likes}</span>
          </button>

          <button
            className={`interaction-btn ${showComments ? "active-comments" : ""}`}
            onClick={() => setShowComments(!showComments)}
            title="Threaded discussion & reactions"
          >
            <FiMessageCircle className="interaction-icon" />
            <span className="interaction-count">{commentsCount}</span>
          </button>

          <button
            className={`interaction-btn ${reposted ? "active-repost" : ""}`}
            onClick={() => {
              setReposted(!reposted);
              setReposts((prev) => prev + (reposted ? -1 : 1));
            }}
          >
            <FiRepeat className="interaction-icon" />
            <span className="interaction-count">{reposts}</span>
          </button>

          {/* Creative Feature: Remix This */}
          <button
            className="interaction-btn remix-btn"
            onClick={handleRemixClick}
            title="Remix or respond with your own creative version"
          >
            <BsPaletteFill className="interaction-icon remix-icon" />
            <span className="interaction-count">
              {post.remix_count > 0 ? `${post.remix_count} Remixes` : "Remix"}
            </span>
          </button>

          {/* Creative Feature: Save to Moodboard */}
          <button
            className="interaction-btn moodboard-btn"
            onClick={() => setShowMoodboardModal(true)}
            title="Save to a curated Moodboard / Collection"
          >
            <FiBookmark className="interaction-icon" />
            <span className="interaction-count">Board</span>
          </button>

          <button
            className="interaction-btn"
            onClick={() => setShares((prev) => prev + 1)}
          >
            <FiShare2 className="interaction-icon" />
            <span className="interaction-count">{shares}</span>
          </button>
        </div>

        {/* Threaded Comments & Emoji Reactions Drawer */}
        {showComments && (
          <ThreadedComments
            postId={post._id}
            initialComments={post.comments || []}
            currentUser={currentUser}
            mode={mode}
          />
        )}

        <div className="post-footer">
          <p className="post-caption">{post.caption}</p>

          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag, i) => (
                <span key={i} className="tag-chip">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="post-footer-meta">
            <p className="post-time">{formatTime(post.upload_time)}</p>
            {post.remix_count > 0 && (
              <span className="remix-chain-indicator">
                <FiRepeat /> Part of a {post.remix_count + 1}-piece creative tree
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Moodboard / Collections modal */}
      <MoodboardModal
        post={post}
        isOpen={showMoodboardModal}
        onClose={() => setShowMoodboardModal(false)}
        mode={mode}
      />
    </div>
  );
}

export default PostCard;
