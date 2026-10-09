import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import MoodboardModal from "./MoodboardModal";
import {
  FiLock,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiRepeat,
  FiBookmark,
  FiPlus,
  FiTarget,
  FiUsers,
  FiMessageSquare,
  FiSend,
  FiStar,
  FiX,
  FiCheck
} from "react-icons/fi";
import "../styles/feedback_collab.css";

function PostCard({ post, index = 0, isSelected, onSelect, onAddPin }) {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("userData");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = currentUser ? currentUser.id || currentUser._id : null;

  const isAuthor =
    currentUserId &&
    (post.author?._id === currentUserId || post.author === currentUserId);

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

  // 1. Before/After Slider State
  const [sliderPos, setSliderPos] = useState(50);

  // 2. Process Time-Lapse State
  const [isTimelapseActive, setIsTimelapseActive] = useState(false);
  const [timelapseIndex, setTimelapseIndex] = useState(0);
  const [isTimelapsePlaying, setIsTimelapsePlaying] = useState(false);

  // 3. Version History State
  const [currentVersionIdx, setCurrentVersionIdx] = useState(
    post.versions?.length ? post.versions.length - 1 : 0
  );
  const [showVersionUploadModal, setShowVersionUploadModal] = useState(false);
  const [revisionFile, setRevisionFile] = useState(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  // 4. Series Follow State
  const [isSeriesFollowed, setIsSeriesFollowed] = useState(false);

  // 5. Time Capsule Countdown State
  const [capsuleTimeLeft, setCapsuleTimeLeft] = useState("");
  const [isCapsuleUnlocked, setIsCapsuleUnlocked] = useState(
    Boolean(post.time_capsule?.is_revealed)
  );

  // 6. Sound Layer State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

  // 7. Critique Mode State
  const [critiquesList, setCritiquesList] = useState(post.critiques || []);
  const [showCritiqueModal, setShowCritiqueModal] = useState(false);
  const [whatWorks, setWhatWorks] = useState("");
  const [whatToTry, setWhatToTry] = useState("");
  const [isSubmittingCritique, setIsSubmittingCritique] = useState(false);

  // 8. Co-Authors State
  const [coAuthorsList, setCoAuthorsList] = useState(post.co_authors || []);
  const acceptedCoAuthors = coAuthorsList.filter((ca) => ca.status === "accepted");
  const pendingCoAuthorInvite =
    currentUserId &&
    coAuthorsList.find(
      (ca) =>
        String(ca.user?._id || ca.user) === String(currentUserId) &&
        ca.status === "pending"
    );

  // 9. Whisper Notes State
  const [showWhisperModal, setShowWhisperModal] = useState(false);
  const [whisperText, setWhisperText] = useState("");
  const [isSubmittingWhisper, setIsSubmittingWhisper] = useState(false);
  const [showCreatorWhispersTray, setShowCreatorWhispersTray] = useState(false);
  const [creatorWhispers, setCreatorWhispers] = useState([]);

  const frameNumber = String(index + 1).padStart(2, "0");

  // All timelapse sequence frames = process steps + final master piece
  const timelapseFrames = [
    ...(post.process_steps || []),
    {
      phase_label: "Final Masterpiece",
      file_url: post.file_url,
    },
  ];

  // Socket listener for real-time like updates
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

  // Time Capsule Countdown loop
  useEffect(() => {
    if (!post.time_capsule?.is_capsule || isCapsuleUnlocked) return;

    const targetDate = new Date(post.time_capsule.reveal_date).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setIsCapsuleUnlocked(true);
        setCapsuleTimeLeft("00:00:00");
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setCapsuleTimeLeft(
          `${days > 0 ? `${days}d ` : ""}${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [post.time_capsule, isCapsuleUnlocked]);

  // Process Time-Lapse Autoplay Timer
  useEffect(() => {
    if (!isTimelapsePlaying || timelapseFrames.length <= 1) return;

    const timer = setInterval(() => {
      setTimelapseIndex((prev) => (prev + 1) % timelapseFrames.length);
    }, 1200);

    return () => clearInterval(timer);
  }, [isTimelapsePlaying, timelapseFrames.length]);

  // Socket listener for real-time critiques
  useEffect(() => {
    const handleCritiqueAdded = (data) => {
      if (data.postId === post._id) {
        setCritiquesList((prev) => [...prev, data.critique]);
      }
    };
    socket.on("post_critique_added", handleCritiqueAdded);
    return () => socket.off("post_critique_added", handleCritiqueAdded);
  }, [post._id]);

  const handleSubmitCritique = async (e) => {
    e?.preventDefault();
    if (!whatWorks.trim() || !whatToTry.trim()) return;
    try {
      setIsSubmittingCritique(true);
      const res = await axios.post(
        `http://localhost:9000/posts/${post._id}/critique`,
        { what_works: whatWorks, what_to_try: whatToTry },
        { withCredentials: true }
      );
      setCritiquesList(res.data.critiques || []);
      setWhatWorks("");
      setWhatToTry("");
      setIsSubmittingCritique(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit critique");
      setIsSubmittingCritique(false);
    }
  };

  const handleMarkHelpful = async (critiqueId) => {
    try {
      await axios.post(
        `http://localhost:9000/posts/${post._id}/critique/${critiqueId}/helpful`,
        {},
        { withCredentials: true }
      );
      setCritiquesList((prev) =>
        prev.map((c) => (c._id === critiqueId ? { ...c, is_helpful: true } : c))
      );
    } catch (err) {
      console.error("Mark helpful error:", err);
    }
  };

  const handleCoAuthorResponse = async (status) => {
    try {
      const res = await axios.post(
        `http://localhost:9000/posts/${post._id}/co-author/respond`,
        { status },
        { withCredentials: true }
      );
      setCoAuthorsList(res.data.post?.co_authors || []);
    } catch (err) {
      alert("Failed to respond to co-author invitation");
    }
  };

  const handleSendWhisper = async (e) => {
    e?.preventDefault();
    if (!whisperText.trim()) return;
    try {
      setIsSubmittingWhisper(true);
      await axios.post(
        `http://localhost:9000/posts/${post._id}/whisper`,
        { note: whisperText },
        { withCredentials: true }
      );
      alert("Whisper note delivered privately to creator!");
      setWhisperText("");
      setShowWhisperModal(false);
      setIsSubmittingWhisper(false);
    } catch (err) {
      alert("Failed to send whisper note");
      setIsSubmittingWhisper(false);
    }
  };

  const handleOpenCreatorWhispers = async () => {
    try {
      setShowCreatorWhispersTray(true);
      const res = await axios.get(`http://localhost:9000/posts/${post._id}/whispers`, {
        withCredentials: true,
      });
      setCreatorWhispers(res.data.whispers || []);
    } catch (err) {
      console.error("Failed to load whispers:", err);
    }
  };

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

    if (onSelect) {
      onSelect(post, pins);
    }
  };

  const handleFollowSeriesToggle = async (e) => {
    e.stopPropagation();
    try {
      setIsSeriesFollowed(!isSeriesFollowed);
      await axios.post(
        "http://localhost:9000/series/follow",
        { series_id: post.series.series_id },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Follow series error:", err);
    }
  };

  const handleUploadNewVersion = async (e) => {
    e.preventDefault();
    if (!revisionFile) return;

    try {
      setIsUploadingVersion(true);
      const formData = new FormData();
      formData.append("revision_file", revisionFile);
      formData.append("note", revisionNote || `Revision v${(post.versions?.length || 1) + 1}`);

      const res = await axios.post(
        `http://localhost:9000/posts/${post._id}/versions`,
        formData,
        { withCredentials: true }
      );

      if (res.data?.post?.versions) {
        post.versions = res.data.post.versions;
        setCurrentVersionIdx(post.versions.length - 1);
      }
      setShowVersionUploadModal(false);
      setRevisionFile(null);
      setRevisionNote("");
    } catch (err) {
      console.error("Upload revision error:", err);
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const toggleSoundLayer = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch((err) => console.log("Audio play prevented:", err));
      setIsPlayingAudio(true);
    }
  };

  // Determine active media URL based on version scrubber
  const activeVersion =
    post.versions && post.versions[currentVersionIdx]
      ? post.versions[currentVersionIdx]
      : null;
  const activeDisplayUrl = activeVersion ? activeVersion.file_url : post.file_url;

  const isBeforeAfter =
    post.post_type === "before_after" && Boolean(post.before_after?.before_image_url);

  const isLockedCapsule =
    post.time_capsule?.is_capsule && !isCapsuleUnlocked;

  const hasVersions = post.versions && post.versions.length > 1;

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
        {/* Top metadata strip: Frame number + Creator tag + Co-authors */}
        <div className="darkroom-frame__header">
          <span className="darkroom-frame__index font-mono">FRAME {frameNumber}</span>
          <span className="darkroom-frame__creator">
            @{post.username}
            {acceptedCoAuthors.length > 0 && (
              <span className="coauthor-authorship-tag">
                &nbsp;&amp; {acceptedCoAuthors.map((ca, i) => (
                  <strong key={i}>@{ca.username}</strong>
                ))}
              </span>
            )}
          </span>
        </div>

        {/* Co-Author Pending Invitation Banner */}
        {pendingCoAuthorInvite && (
          <div className="coauthor-invite-banner" onClick={(e) => e.stopPropagation()}>
            <span className="coauthor-invite-banner-text">
              <FiUsers /> You're invited as co-author!
            </span>
            <div className="coauthor-btn-group">
              <button
                type="button"
                className="coauthor-accept-btn"
                onClick={() => handleCoAuthorResponse("accepted")}
              >
                Accept 🤝
              </button>
              <button
                type="button"
                className="coauthor-decline-btn"
                onClick={() => handleCoAuthorResponse("declined")}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* 1. Critique Mode Banner */}
        {post.needs_critique && (
          <div className="critique-mode-banner" onClick={(e) => e.stopPropagation()}>
            <div className="critique-mode-badge">
              <FiTarget /> Needs Critique
            </div>
            {post.critique_question && (
              <p className="critique-question-text">"{post.critique_question}"</p>
            )}
            <div className="critique-actions-row">
              <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)" }}>
                {critiquesList.length} critique{critiquesList.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                className="critique-open-btn"
                onClick={() => setShowCritiqueModal(true)}
              >
                Critique Piece
              </button>
            </div>
          </div>
        )}

        {/* 4. Series & Chapters Strip */}
        {post.series?.series_name && (
          <div className="series-banner" onClick={(e) => e.stopPropagation()}>
            <div className="series-meta">
              <span className="series-title font-mono">{post.series.series_name}</span>
              <span className="series-chapter font-mono">
                CH {post.series.chapter_number}/{post.series.total_chapters}
              </span>
            </div>
            <button
              type="button"
              className={`series-follow-btn ${isSeriesFollowed ? "is-following" : ""}`}
              onClick={handleFollowSeriesToggle}
            >
              {isSeriesFollowed ? "FOLLOWING SERIES" : "FOLLOW SERIES"}
            </button>
          </div>
        )}

        {/* 3. Version History Bar */}
        {(hasVersions || isAuthor) && (
          <div className="version-history-bar" onClick={(e) => e.stopPropagation()}>
            <div className="version-pill-group">
              {(post.versions || [{ version_number: 1 }]).map((ver, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`version-pill ${idx === currentVersionIdx ? "is-active" : ""}`}
                  onClick={() => setCurrentVersionIdx(idx)}
                >
                  v{ver.version_number}
                </button>
              ))}
              {isAuthor && (
                <button
                  type="button"
                  className="version-pill"
                  onClick={() => setShowVersionUploadModal(true)}
                  title="Upload New Version / Revision"
                >
                  <FiPlus /> REV
                </button>
              )}
            </div>
            {activeVersion?.note && (
              <span className="version-note">{activeVersion.note}</span>
            )}
          </div>
        )}

        {/* Media Holder */}
        <div className="darkroom-frame__media" onClick={handleMediaClick}>
          {/* 5. Time Capsule Locked View */}
          {isLockedCapsule ? (
            <div className="time-capsule-locked">
              <img
                src={`http://localhost:9000${post.file_url}`}
                alt="Locked"
                className="time-capsule-bg-blur"
              />
              <div className="time-capsule-content">
                <div className="time-capsule-icon">
                  <FiLock />
                </div>
                <span className="time-capsule-badge">TIME CAPSULE LOCKED</span>
                <span className="time-capsule-timer font-mono">{capsuleTimeLeft}</span>
                {post.time_capsule?.hint && (
                  <p className="time-capsule-hint">"{post.time_capsule.hint}"</p>
                )}
                <button
                  type="button"
                  className="time-capsule-notify-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert("We will notify you when this time capsule unlocks!");
                  }}
                >
                  NOTIFY ON REVEAL
                </button>
              </div>
            </div>
          ) : isBeforeAfter ? (
            /* 1. Before/After Slider View */
            <div className="before-after-container" onClick={(e) => e.stopPropagation()}>
              {/* After Image Layer (Bottom) */}
              <div className="before-after-layer">
                <img
                  src={`http://localhost:9000${post.before_after?.after_image_url || activeDisplayUrl}`}
                  alt="After"
                />
              </div>

              {/* Before Image Layer (Top, clipped with inset) */}
              <div
                className="before-after-layer before-after-layer--clipped"
                style={{
                  clipPath: `inset(0 calc(100% - ${sliderPos}%) 0 0)`,
                }}
              >
                <img
                  src={`http://localhost:9000${post.before_after?.before_image_url}`}
                  alt="Before"
                />
              </div>

              {/* Slider Divider Line */}
              <div
                className="before-after-divider"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="before-after-handle font-mono">↔</div>
              </div>

              {/* Native range input driver */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="before-after-range"
                aria-label="Before/After divider"
              />

              <span className="before-after-label before-after-label--before">
                {post.before_after?.before_label || "Original"}
              </span>
              <span className="before-after-label before-after-label--after">
                {post.before_after?.after_label || "Final"}
              </span>
            </div>
          ) : isTimelapseActive ? (
            /* 2. Process Time-Lapse Player */
            <div className="timelapse-viewer" onClick={(e) => e.stopPropagation()}>
              <div className="timelapse-stage">
                <img
                  src={`http://localhost:9000${timelapseFrames[timelapseIndex]?.file_url}`}
                  alt="Timelapse Phase"
                />
              </div>
              <div className="timelapse-controls">
                <div className="timelapse-controls-row">
                  <button
                    type="button"
                    className={`timelapse-btn ${isTimelapsePlaying ? "is-active" : ""}`}
                    onClick={() => setIsTimelapsePlaying(!isTimelapsePlaying)}
                  >
                    {isTimelapsePlaying ? <FiPause /> : <FiPlay />}{" "}
                    {isTimelapsePlaying ? "PAUSE" : "PLAY"}
                  </button>
                  <span className="timelapse-phase-text font-mono">
                    PHASE {timelapseIndex + 1}/{timelapseFrames.length}:{" "}
                    {timelapseFrames[timelapseIndex]?.phase_label || "WIP"}
                  </span>
                  <button
                    type="button"
                    className="timelapse-btn"
                    onClick={() => setIsTimelapseActive(false)}
                  >
                    EXIT
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max={timelapseFrames.length - 1}
                  value={timelapseIndex}
                  onChange={(e) => setTimelapseIndex(Number(e.target.value))}
                  className="timelapse-scrubber"
                />
              </div>
            </div>
          ) : (
            /* Standard Frame Image View */
            <>
              <img
                src={`http://localhost:9000${activeDisplayUrl}`}
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

              {/* Timelapse Trigger Badge */}
              {timelapseFrames.length > 1 && (
                <button
                  type="button"
                  className="darkroom-frame__badge"
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTimelapseActive(true);
                    setIsTimelapsePlaying(true);
                  }}
                  title="Auto-play Process Time-Lapse"
                >
                  <FiPlay style={{ marginRight: "3px" }} /> TIMELAPSE [{timelapseFrames.length}]
                </button>
              )}

              {post.time_capsule?.is_capsule && isCapsuleUnlocked && (
                <span className="darkroom-frame__badge" style={{ color: "var(--warning)" }}>
                  ⏳ CAPSULE UNLOCKED
                </span>
              )}
            </>
          )}
        </div>

        {/* 6. Sound Layer Widget */}
        {post.sound_layer?.audio_url && (
          <div className="sound-layer-bar" onClick={(e) => e.stopPropagation()}>
            <audio
              ref={audioRef}
              src={`http://localhost:9000${post.sound_layer.audio_url}`}
              loop={Boolean(post.sound_layer.auto_loop)}
            />
            <div className="sound-layer-info font-mono">
              <span>{isPlayingAudio ? "♫ PLAYING:" : "♫ AMBIENT:"}</span>
              <span>{post.sound_layer.audio_title || "SOUND LOOP"}</span>
            </div>
            <button
              type="button"
              className={`sound-layer-toggle ${isPlayingAudio ? "is-playing" : ""}`}
              onClick={toggleSoundLayer}
            >
              {isPlayingAudio ? <FiVolume2 /> : <FiVolumeX />}{" "}
              {isPlayingAudio ? "MUTE" : "PLAY AUDIO"}
            </button>
          </div>
        )}

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

          {isAuthor ? (
            <button
              type="button"
              className="darkroom-frame__btn"
              onClick={handleOpenCreatorWhispers}
              title="View private whisper feedback"
            >
              WHISPERS ({post.whisper_count || creatorWhispers.length || 0})
            </button>
          ) : (
            <button
              type="button"
              className="darkroom-frame__btn"
              onClick={() => setShowWhisperModal(true)}
              title="Send private feedback visible only to the creator"
            >
              WHISPER
            </button>
          )}
        </div>
      </div>

      {/* Moodboard / Collections modal */}
      <MoodboardModal
        post={post}
        isOpen={showMoodboardModal}
        onClose={() => setShowMoodboardModal(false)}
      />

      {/* Version History Revision Upload Modal */}
      {showVersionUploadModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowVersionUploadModal(false)}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--rule)",
              borderRadius: "var(--radius-sm)",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4
              className="font-mono"
              style={{ fontSize: "14px", marginBottom: "16px", color: "var(--text)" }}
            >
              UPLOAD REVISION (v{(post.versions?.length || 1) + 1})
            </h4>
            <form onSubmit={handleUploadNewVersion}>
              <div style={{ marginBottom: "12px" }}>
                <label
                  className="font-mono"
                  style={{ display: "block", fontSize: "11px", color: "var(--text-3)", marginBottom: "4px" }}
                >
                  REVISION ARTWORK FILE *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setRevisionFile(e.target.files[0])}
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    color: "var(--text)",
                    backgroundColor: "var(--surface-2)",
                    padding: "8px",
                    borderRadius: "var(--radius-xs)",
                    border: "1px solid var(--rule)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  className="font-mono"
                  style={{ display: "block", fontSize: "11px", color: "var(--text-3)", marginBottom: "4px" }}
                >
                  REVISION NOTE / CHANGELOG
                </label>
                <input
                  type="text"
                  placeholder="e.g. Color graded highlights, fixed anatomy"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    color: "var(--text)",
                    backgroundColor: "var(--surface-2)",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-xs)",
                    border: "1px solid var(--rule)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  className="timelapse-btn"
                  onClick={() => setShowVersionUploadModal(false)}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="timelapse-btn is-active"
                  disabled={isUploadingVersion || !revisionFile}
                >
                  {isUploadingVersion ? "UPLOADING..." : "PUBLISH REVISION"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Structured Critique Modal */}
      {showCritiqueModal && (
        <div
          className="critique-modal-backdrop"
          onClick={() => setShowCritiqueModal(false)}
        >
          <div
            className="critique-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="critique-modal-header">
              <h3 className="critique-modal-title">
                <FiTarget style={{ color: "var(--accent)" }} /> Critique Room
              </h3>
              <button
                type="button"
                className="critique-modal-close"
                onClick={() => setShowCritiqueModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="critique-modal-body">
              {/* Creator's specific question */}
              {post.critique_question && (
                <div className="critique-question-box">
                  <div className="critique-question-label">Creator's Specific Focus Question:</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>
                    "{post.critique_question}"
                  </div>
                </div>
              )}

              {/* Structured Submission Form (What works / What to try) */}
              <form onSubmit={handleSubmitCritique} className="critique-form">
                <div className="critique-field-group">
                  <label className="critique-field-label critique-field-label--works">
                    <FiCheck /> What Works (Strengths & Effective Elements) *
                  </label>
                  <textarea
                    className="critique-textarea"
                    placeholder="e.g. Strong atmospheric lighting, clear silhouette, great anatomical accuracy..."
                    value={whatWorks}
                    onChange={(e) => setWhatWorks(e.target.value)}
                    required
                  />
                </div>

                <div className="critique-field-group">
                  <label className="critique-field-label critique-field-label--try">
                    <FiStar /> What to Try (Constructive Ideas & Alternate Variations) *
                  </label>
                  <textarea
                    className="critique-textarea"
                    placeholder="e.g. Try pushing the rim light contrast higher, or experiment with warmer bounce light..."
                    value={whatToTry}
                    onChange={(e) => setWhatToTry(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="critique-submit-btn"
                  disabled={isSubmittingCritique}
                >
                  {isSubmittingCritique ? "Submitting..." : "Submit Structured Critique"}
                </button>
              </form>

              {/* Critiques List */}
              <div className="critique-list-header">
                Community Reviews ({critiquesList.length})
              </div>

              {critiquesList.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-2)", textAlign: "center", margin: "10px 0" }}>
                  No critiques yet. Be the first to provide constructive feedback!
                </p>
              ) : (
                critiquesList.map((critique, cIdx) => (
                  <div key={critique._id || cIdx} className="critique-card">
                    <div className="critique-card-header">
                      <div className="critique-author-info">
                        {critique.profile_picture ? (
                          <img
                            src={`http://localhost:9000${critique.profile_picture}`}
                            alt={critique.username}
                            className="critique-author-avatar"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="critique-author-avatar" style={{ backgroundColor: "var(--rule)" }} />
                        )}
                        <span className="critique-author-name">@{critique.username}</span>

                        {/* Critic Badge indicator */}
                        {(critique.is_helpful || critique.author?.criticBadges > 0) && (
                          <span className="critic-badge-tag">★ Critic</span>
                        )}
                      </div>

                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}>
                        {new Date(critique.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="critique-structured-body">
                      <div className="critique-block critique-block--works">
                        <div className="critique-block-title critique-block-title--works">WHAT WORKS:</div>
                        <p className="critique-block-text">{critique.what_works}</p>
                      </div>

                      <div className="critique-block critique-block--try">
                        <div className="critique-block-title critique-block-title--try">WHAT TO TRY:</div>
                        <p className="critique-block-text">{critique.what_to_try}</p>
                      </div>
                    </div>

                    {/* Author Helpful Button */}
                    {isAuthor && (
                      <button
                        type="button"
                        className={`critique-helpful-btn ${critique.is_helpful ? "is-helpful" : ""}`}
                        disabled={critique.is_helpful}
                        onClick={() => handleMarkHelpful(critique._id)}
                      >
                        {critique.is_helpful ? <><FiCheck /> Marked Helpful (Critic Badge Awarded)</> : <><FiStar /> Mark as Helpful (Award Critic Badge)</>}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Whisper Note Modal (Visitor -> Creator) */}
      {showWhisperModal && (
        <div
          className="critique-modal-backdrop"
          onClick={() => setShowWhisperModal(false)}
        >
          <div
            className="critique-modal"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="critique-modal-header">
              <h3 className="critique-modal-title">
                🤫 Whisper to @{post.username}
              </h3>
              <button
                type="button"
                className="critique-modal-close"
                onClick={() => setShowWhisperModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="critique-modal-body">
              <div className="whisper-notice-banner">
                🔒 Private feedback: only @{post.username} can read this note. It will never appear publicly.
              </div>

              <form onSubmit={handleSendWhisper} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <textarea
                  className="critique-textarea"
                  rows="4"
                  placeholder="Share private thoughts, tips, or words of encouragement..."
                  value={whisperText}
                  onChange={(e) => setWhisperText(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="critique-submit-btn"
                  disabled={isSubmittingWhisper}
                >
                  {isSubmittingWhisper ? "Delivering..." : "Send Whisper Note"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Creator Whisper Notes Tray (Creator Only) */}
      {showCreatorWhispersTray && (
        <div
          className="critique-modal-backdrop"
          onClick={() => setShowCreatorWhispersTray(false)}
        >
          <div
            className="critique-modal"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="critique-modal-header">
              <h3 className="critique-modal-title">
                🤫 Private Whisper Notes ({creatorWhispers.length})
              </h3>
              <button
                type="button"
                className="critique-modal-close"
                onClick={() => setShowCreatorWhispersTray(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="critique-modal-body">
              <div className="whisper-notice-banner">
                Private notes sent by community members directly to you.
              </div>

              {creatorWhispers.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-2)", textAlign: "center", margin: "16px 0" }}>
                  No whisper notes received on this piece yet.
                </p>
              ) : (
                creatorWhispers.map((w, wIdx) => (
                  <div key={w._id || wIdx} className="whisper-card-item">
                    <div className="whisper-card-meta">
                      <span style={{ fontWeight: "700", color: "var(--text)" }}>@{w.username}</span>
                      <span>{new Date(w.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="whisper-card-content">{w.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PostCard;
