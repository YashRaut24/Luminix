import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import MoodboardModal from "./MoodboardModal";

function PostCard({ post, index = 0, isSelected, onSelect, onAddPin }) {
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
  const [likes, setLikes] = useState(post.likes || 0);
  const [showMoodboardModal, setShowMoodboardModal] = useState(false);
  const [pins, setPins] = useState(post.pins || []);

  const frameNumber = String(index + 1).padStart(2, "0");

  // Real-time live stamp listener via Socket.io
  useEffect(() => {
    const handleLikeUpdate = (data) => {
      if (data.postId === post._id) {
        setLikes(data.likesCount);
        if (currentUserId && data.userId === currentUserId) {
          setLiked(data.isLiked);
        }
      }
    };

    socket.on("post_like_updated", handleLikeUpdate);
    return () => {
      socket.off("post_like_updated", handleLikeUpdate);
    };
  }, [post._id, currentUserId]);

  const handleLikeClick = async (e) => {
    e?.stopPropagation();
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
      console.error("Stamp toggle error:", err);
    }
  };

  const handleRemixClick = (e) => {
    e?.stopPropagation();
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

  const handleMediaClick = (e) => {
    // Alt-click or Shift-click drops a numbered pin
    if (e.altKey || e.shiftKey) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
      const newPin = {
        id: Date.now(),
        number: pins.length + 1,
        x: Math.round(x),
        y: Math.round(y),
        note: `Note #${pins.length + 1} at (${Math.round(x)}%, ${Math.round(y)}%)`,
      };
      const updatedPins = [...pins, newPin];
      setPins(updatedPins);
      if (onAddPin) onAddPin(post._id, newPin);
      return;
    }

    // Normal click selects frame for Inspector
    if (onSelect) {
      onSelect(post, pins);
    }
  };

  const hasProcessSteps = post.process_steps && post.process_steps.length > 0;

  return (
    <>
      <div
        className={`darkroom-frame ${isSelected ? "is-selected" : ""}`}
        onClick={() => onSelect && onSelect(post, pins)}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(
            "application/json",
            JSON.stringify({
              postId: post._id,
              caption: post.caption,
              file_url: post.file_url,
              username: post.username,
            })
          );
        }}
      >
        {/* Top metadata strip: Frame number + Creator tag */}
        <div className="darkroom-frame__header">
          <span className="darkroom-frame__index">FRAME {frameNumber}</span>
          <span className="darkroom-frame__creator">@{post.username}</span>
        </div>

        {/* Media Holder */}
        <div className="darkroom-frame__media" onClick={handleMediaClick}>
          <img
            src={`http://localhost:9000${post.file_url}`}
            alt={post.file_name || `Frame ${frameNumber}`}
            loading="lazy"
          />

          {/* Numbered Pin Notes */}
          {pins.map((pin, i) => (
            <div
              key={pin.id || i}
              className="darkroom-pin"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              onClick={(e) => e.stopPropagation()}
            >
              {pin.number || i + 1}
              <span className="darkroom-pin__tooltip">
                {pin.note || `Pin #${i + 1}`}
              </span>
            </div>
          ))}

          {/* Process / Remix Badge */}
          {hasProcessSteps && (
            <span className="darkroom-frame__badge">
              WIP [{post.process_steps.length}]
            </span>
          )}
        </div>

        {/* Hover-revealed action strip */}
        <div
          className="darkroom-frame__actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={`darkroom-frame__btn ${liked ? "is-stamped" : ""}`}
            onClick={handleLikeClick}
            title={liked ? "Remove Stamp" : "Stamp Frame"}
          >
            STAMP{" "}
            <span className="darkroom-frame__stamp-text font-mono">
              {likes}
            </span>
          </button>

          <button
            type="button"
            className="darkroom-frame__btn"
            onClick={handleRemixClick}
            title="Remix Frame"
          >
            REMIX
          </button>

          <button
            type="button"
            className="darkroom-frame__btn"
            onClick={() => setShowMoodboardModal(true)}
            title="Save to Board"
          >
            SAVE
          </button>
        </div>
      </div>

      {/* Moodboard / Collections modal */}
      <MoodboardModal
        post={post}
        isOpen={showMoodboardModal}
        onClose={() => setShowMoodboardModal(false)}
      />
    </>
  );
}

export default PostCard;
