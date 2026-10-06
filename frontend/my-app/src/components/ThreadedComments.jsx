import React, { useState, useEffect } from "react";
import axios from "axios";
import socket from "../socket";
import "./ThreadedComments.css";
import { FiSend, FiCornerDownRight, FiMessageCircle, FiSmile } from "react-icons/fi";

const EMOJI_MAP = {
  fire: { emoji: "🔥", label: "Fire" },
  idea: { emoji: "💡", label: "Inspiring" },
  art: { emoji: "🎨", label: "Artistic" },
  love: { emoji: "❤️", label: "Love" },
  rocket: { emoji: "🚀", label: "Next Level" },
};

const ThreadedComments = ({ postId, initialComments = [], currentUser, mode }) => {
  const [comments, setComments] = useState(initialComments);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    const handleCommentAdded = (data) => {
      if (data.postId === postId) {
        setComments((prev) => [...prev, data.comment]);
      }
    };

    const handleReactionUpdated = (data) => {
      if (data.postId === postId) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === data.commentId
              ? { ...c, reactions: data.reactions }
              : c
          )
        );
      }
    };

    socket.on("post_comment_added", handleCommentAdded);
    socket.on("comment_reaction_updated", handleReactionUpdated);

    return () => {
      socket.off("post_comment_added", handleCommentAdded);
      socket.off("comment_reaction_updated", handleReactionUpdated);
    };
  }, [postId]);

  const handleAddComment = async (parentId = null, textValue = "") => {
    const textToSubmit = parentId ? replyText : newCommentText;
    if (!textToSubmit.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `http://localhost:9000/posts/${postId}/comments`,
        {
          text: textToSubmit.trim(),
          parentId,
        },
        { withCredentials: true }
      );

      if (parentId) {
        setReplyText("");
        setReplyingToId(null);
      } else {
        setNewCommentText("");
      }

      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      console.error("Error posting comment:", err);
      alert(err.response?.data?.message || "Failed to post comment");
    }
  };

  const handleReact = async (commentId, reactionType) => {
    try {
      await axios.post(
        `http://localhost:9000/posts/${postId}/comments/${commentId}/react`,
        { reactionType },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Error reacting to comment:", err);
    }
  };

  // Group into root comments and child replies
  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId) => comments.filter((c) => c.parentId === parentId);

  const renderCommentItem = (comment, isReply = false) => {
    const replies = getReplies(comment._id);
    const reactions = comment.reactions || {};

    return (
      <div
        key={comment._id}
        className={`comment-thread-item ${isReply ? "is-reply-node" : ""}`}
      >
        <div className="comment-main-card">
          <div className="comment-avatar-slot">
            {comment.userAvatar ? (
              <img
                src={
                  comment.userAvatar.startsWith("http")
                    ? comment.userAvatar
                    : `http://localhost:9000${comment.userAvatar}`
                }
                alt=""
                className="comment-avatar"
              />
            ) : (
              <span className="comment-initial">
                {comment.username?.charAt(0) || "U"}
              </span>
            )}
          </div>

          <div className="comment-body">
            <div className="comment-user-row">
              <span className="comment-username">@{comment.username}</span>
              <span className="comment-timestamp">
                {new Date(comment.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <p className="comment-text">{comment.text}</p>

            {/* Emoji Reaction Bar */}
            <div className="comment-reactions-bar">
              {Object.keys(EMOJI_MAP).map((type) => {
                const count = reactions[type]?.length || 0;
                const hasReacted =
                  currentUser &&
                  reactions[type]?.some(
                    (uid) => (typeof uid === "object" ? uid._id : uid) === currentUser.id
                  );

                return (
                  <button
                    key={type}
                    type="button"
                    className={`reaction-pill ${hasReacted ? "active-reacted" : ""}`}
                    onClick={() => handleReact(comment._id, type)}
                    title={EMOJI_MAP[type].label}
                  >
                    <span className="reaction-emoji">{EMOJI_MAP[type].emoji}</span>
                    {count > 0 && <span className="reaction-count">{count}</span>}
                  </button>
                );
              })}

              {!isReply && (
                <button
                  type="button"
                  className="reply-trigger-btn"
                  onClick={() =>
                    setReplyingToId(replyingToId === comment._id ? null : comment._id)
                  }
                >
                  <FiCornerDownRight /> Reply
                </button>
              )}
            </div>

            {/* Inline reply box */}
            {replyingToId === comment._id && (
              <div className="inline-reply-box">
                <input
                  type="text"
                  placeholder={`Reply to @${comment.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment(comment._id);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="reply-submit-btn"
                  disabled={isSubmitting}
                  onClick={() => handleAddComment(comment._id)}
                >
                  <FiSend />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nested Child Replies */}
        {replies.length > 0 && (
          <div className="nested-replies-list">
            {replies.map((reply) => renderCommentItem(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`threaded-comments-wrapper ${mode ? "dark-theme" : ""}`}>
      <div className="comments-section-header">
        <FiMessageCircle />
        <span>Discussion ({comments.length})</span>
      </div>

      {/* New Top-Level Comment Input */}
      <div className="new-comment-input-bar">
        <input
          type="text"
          placeholder="Share constructive feedback, techniques, or reaction..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddComment(null);
          }}
        />
        <button
          type="button"
          className="send-comment-btn"
          disabled={isSubmitting || !newCommentText.trim()}
          onClick={() => handleAddComment(null)}
        >
          <FiSend />
        </button>
      </div>

      {/* Threaded comments list */}
      <div className="comments-tree-list">
        {rootComments.length === 0 ? (
          <p className="no-comments-hint">No comments yet. Start the creative discussion!</p>
        ) : (
          rootComments.map((root) => renderCommentItem(root, false))
        )}
      </div>
    </div>
  );
};

export default ThreadedComments;
