import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import MoodboardModal from "./MoodboardModal";
import ThreadedComments from "./ThreadedComments";
import {
  FiHeart,
  FiRepeat,
  FiBookmark,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiMessageCircle,
  FiLock,
  FiGlobe
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
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

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

  // Double-tap like animation
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef(0);

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

  const handleImageDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (!liked) {
        handleLikeClick();
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 500);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const hasProcessSteps = post.process_steps && post.process_steps.length > 0;
  const currentProcessStep = hasProcessSteps ? post.process_steps[activeStepIndex] : null;

  return (
    <>
      <div className="post-card">
        {/* Remix Reference Header (if this post is a remix) */}
        {post.remix_of && (
          <div className="post-card__remix-banner">
            <div className="post-card__remix-badge">
              <BsPaletteFill /> {post.remix_type || "Remix"}
            </div>
            <div className="post-card__remix-parent-info">
              {post.remix_of.file_url && (
                <img
                  src={`http://localhost:9000${post.remix_of.file_url}`}
                  alt="Original"
                  className="post-card__remix-parent-thumb"
                />
              )}
              <span>@{post.remix_of.username || "creator"}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="post-card__header">
          <div className="post-card__author">
            <div className="post-card__avatar">
              {post.author?.profileImage ? (
                <img
                  src={`http://localhost:9000${post.author.profileImage}`}
                  alt={post.username}
                />
              ) : (
                <span>{post.username?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>
            <div className="post-card__author-meta">
              <div className="post-card__author-row">
                <span className="post-card__author-name">{post.username}</span>
                <span className="post-card__author-handle">
                  {post.author?.lumiTag || `@${post.username?.toLowerCase()}`}
                </span>
                {likes >= 10 && (
                  <span className="chip chip--trending" title="Trending creative work">
                    Trending
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="post-card__header-right">
            {/* Show Curated chip only when affinity score is high or reason exists */}
            {post.recommendationReason && (
              <span
                className="chip chip--curated"
                title={`${post.recommendationReason} (${post.recommendationScore || 0}% match)`}
              >
                <BsStars /> Curated
              </span>
            )}

            {/* Public/Private lock icon with hover tooltip */}
            <span
              className="post-card__privacy-icon"
              title={post.target === "public" ? "Public creation" : "Private"}
            >
              {post.target === "public" ? <FiGlobe /> : <FiLock />}
            </span>

            {/* Timestamp on right of header */}
            <span className="post-card__time">{formatTime(post.upload_time)}</span>
          </div>
        </div>

        {/* Post Image: sits directly under header, aspect-ratio 4:3 in feed, natural in masonry */}
        <div className="post-card__media" onClick={handleImageDoubleTap}>
          {showHeartBurst && (
            <div className="post-card__heart-burst">
              <FiHeart />
            </div>
          )}

          {hasProcessSteps && (
            <button
              type="button"
              className="post-card__wip-badge"
              onClick={(e) => {
                e.stopPropagation();
                setShowProcessStrip(!showProcessStrip);
              }}
              title="Toggle WIP / Making-Of steps"
            >
              <FiLayers /> WIP
            </button>
          )}

          {!showProcessStrip ? (
            <img
              src={`http://localhost:9000${post.file_url}`}
              alt={post.file_name || "Luminix Post"}
              loading="lazy"
            />
          ) : (
            <div className="post-card__process-viewer" onClick={(e) => e.stopPropagation()}>
              <div className="post-card__process-stage">
                <img
                  src={`http://localhost:9000${currentProcessStep.file_url}`}
                  alt={currentProcessStep.phase_label}
                />
                <div className="post-card__process-nav">
                  <button
                    className="btn btn--icon"
                    disabled={activeStepIndex === 0}
                    onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  >
                    <FiChevronLeft />
                  </button>
                  <span style={{ fontSize: "11px", fontWeight: "600", padding: "0 4px" }}>
                    {activeStepIndex + 1}/{post.process_steps.length}
                  </span>
                  <button
                    className="btn btn--icon"
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

              <div className="post-card__process-thumbs">
                {post.process_steps.map((step, idx) => (
                  <img
                    key={idx}
                    src={`http://localhost:9000${step.file_url}`}
                    alt={step.phase_label}
                    className={`post-card__process-thumb ${idx === activeStepIndex ? "is-active" : ""}`}
                    onClick={() => setActiveStepIndex(idx)}
                  />
                ))}
                <span
                  className="chip chip--curated"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowProcessStrip(false)}
                >
                  Final
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="post-card__actions">
          <div className="post-card__actions-left">
            <button
              className={`post-card__action-btn ${liked ? "is-liked" : ""}`}
              onClick={handleLikeClick}
              title={liked ? "Unlike" : "Like"}
            >
              <FiHeart style={{ fill: liked ? "currentColor" : "none" }} />
              {likes === 0 ? (
                <span className="post-card__like-nudge">Be the first to like</span>
              ) : (
                <span>{likes}</span>
              )}
            </button>

            <button
              className="post-card__action-btn"
              onClick={() => setShowComments(!showComments)}
              title="Comments"
            >
              <FiMessageCircle />
              <span>{commentsCount}</span>
            </button>

            <button
              className={`post-card__action-btn ${reposted ? "is-reposted" : ""}`}
              onClick={() => {
                setReposted(!reposted);
                setReposts((prev) => prev + (reposted ? -1 : 1));
              }}
              title="Repost"
            >
              <FiRepeat />
              <span>{reposts}</span>
            </button>
          </div>

          <div className="post-card__actions-right">
            <button
              className="btn--remix"
              onClick={handleRemixClick}
              title="Remix this piece"
            >
              <BsPaletteFill />
              <span>{post.remix_count > 0 ? `Remixed ${post.remix_count}x` : "Remix"}</span>
            </button>

            <button
              className="btn btn--icon"
              onClick={() => setShowMoodboardModal(true)}
              title="Save to Moodboard"
            >
              <FiBookmark />
            </button>
          </div>
        </div>

        {/* Threaded Comments Drawer */}
        {showComments && (
          <ThreadedComments
            postId={post._id}
            initialComments={post.comments || []}
            currentUser={currentUser}
            mode={mode}
          />
        )}

        {/* Caption and Tags (Below Actions) */}
        <div className="post-card__body">
          {post.caption && (
            <div>
              <p className={`post-card__caption ${!isCaptionExpanded && post.caption.length > 90 ? "is-clamped" : ""}`}>
                {post.caption}
              </p>
              {post.caption.length > 90 && (
                <button
                  type="button"
                  className="post-card__more-btn"
                  onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                >
                  {isCaptionExpanded ? "less" : "more"}
                </button>
              )}
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="post-card__tags">
              {post.tags.map((tag, i) => (
                <span key={i} className="post-card__tag-link">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Moodboard / Collections modal */}
      <MoodboardModal
        post={post}
        isOpen={showMoodboardModal}
        onClose={() => setShowMoodboardModal(false)}
        mode={mode}
      />
    </>
  );
}

export default PostCard;
