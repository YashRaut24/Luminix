import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft, FiPlus, FiCheck, FiX, FiClock } from "react-icons/fi";
import PostCard from "./PostCard";
import "../styles/challenge.css";

function formatCountdown(targetDate) {
  if (!targetDate) return "";
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) return "Challenge closed";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function ChallengePage({ mode, user }) {
  const navigate = useNavigate();
  const { id: routeChallengeId } = useParams();

  const [challenge, setChallenge] = useState(null);
  const [entries, setEntries] = useState([]);
  const [sortBy, setSortBy] = useState("new"); // "new" (default) or "top"
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Post Picker Modal state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [eligiblePosts, setEligiblePosts] = useState([]);
  const [alreadyEntered, setAlreadyEntered] = useState(false);
  const [enteredPostId, setEnteredPostId] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerStatus, setPickerStatus] = useState(null); // { type: 'error', text: '' }
  const [submitting, setSubmitting] = useState(false);

  // Fetch challenge & entries
  const fetchChallengeAndEntries = useCallback(async (challengeId, sortMode = "new") => {
    try {
      setLoading(true);
      let targetChallenge = null;

      if (challengeId) {
        const chRes = await axios.get(`http://localhost:9000/challenges/${challengeId}/entries?sort=${sortMode}`, {
          withCredentials: true,
        });
        targetChallenge = chRes.data.challenge;
        setEntries(chRes.data.entries || []);
      } else {
        const curRes = await axios.get("http://localhost:9000/challenges/current", {
          withCredentials: true,
        });
        targetChallenge = curRes.data.challenge;
        if (targetChallenge?._id) {
          const entRes = await axios.get(`http://localhost:9000/challenges/${targetChallenge._id}/entries?sort=${sortMode}`, {
            withCredentials: true,
          });
          setEntries(entRes.data.entries || []);
        }
      }

      setChallenge(targetChallenge);
      if (targetChallenge) {
        setCountdown(formatCountdown(targetChallenge.endsAt || targetChallenge.ends_at));
      }
    } catch (err) {
      console.error("Challenge fetch error:", err);
      setStatusMessage({ type: "error", text: "Failed to load challenge." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallengeAndEntries(routeChallengeId, sortBy);
  }, [routeChallengeId, sortBy, fetchChallengeAndEntries]);

  // Refresh countdown timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (challenge) {
        setCountdown(formatCountdown(challenge.endsAt || challenge.ends_at));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [challenge]);

  // Fetch eligible posts for picker modal
  const openPostPicker = async () => {
    if (!challenge?._id) return;
    setIsPickerOpen(true);
    setPickerStatus(null);
    try {
      setPickerLoading(true);
      const res = await axios.get(`http://localhost:9000/challenges/${challenge._id}/eligible-posts`, {
        withCredentials: true,
      });
      setEligiblePosts(res.data.eligiblePosts || []);
      setAlreadyEntered(Boolean(res.data.alreadyEntered));
      setEnteredPostId(res.data.enteredPostId || null);

      if (res.data.alreadyEntered) {
        setPickerStatus({
          type: "error",
          text: "You have already entered this challenge with a post.",
        });
      } else if (res.data.eligiblePosts && res.data.eligiblePosts.length > 0) {
        setSelectedPostId(res.data.eligiblePosts[0]._id);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load your posts.";
      setPickerStatus({ type: "error", text: msg });
    } finally {
      setPickerLoading(false);
    }
  };

  const closePostPicker = () => {
    setIsPickerOpen(false);
    setPickerStatus(null);
    setSelectedPostId("");
  };

  // Keyboard shortcut: Escape closes modal picker
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPickerOpen) {
        closePostPicker();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPickerOpen]);

  // Submit selected post to challenge
  const handleSubmitEntry = async (e) => {
    e?.preventDefault();
    if (!selectedPostId || !challenge?._id) return;

    try {
      setSubmitting(true);
      setPickerStatus(null);
      const res = await axios.post(
        `http://localhost:9000/challenges/${challenge._id}/enter`,
        { postId: selectedPostId },
        { withCredentials: true }
      );

      setStatusMessage({
        type: "success",
        text: res.data?.message || "Post successfully entered into the challenge!",
      });
      setAlreadyEntered(true);
      setEnteredPostId(selectedPostId);
      closePostPicker();

      // Refresh gallery entries
      fetchChallengeAndEntries(challenge._id, sortBy);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to enter challenge.";
      setPickerStatus({ type: "error", text: errMsg });
      setStatusMessage({ type: "error", text: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const challengeTitle = challenge?.title || challenge?.theme || "Weekly Prompt";
  const challengePrompt = challenge?.prompt || challenge?.description || "Explore this week's creative constraint.";
  const endsAtDate = challenge?.endsAt || challenge?.ends_at;

  return (
    <div className="challenge-page-container">
      {/* Top Navigation */}
      <div style={{ marginBottom: "16px" }}>
        <button
          type="button"
          className="challenge-back-btn"
          onClick={() => navigate("/feed")}
        >
          <FiArrowLeft /> Back to Feed
        </button>
      </div>

      {/* Hero Section */}
      <div className="challenge-hero-card">
        <div className="challenge-hero-meta">
          <span className="challenge-week-badge font-mono">
            {challenge?.week_number ? `WEEK ${challenge.week_number} // CREATIVE PROMPT` : "WEEKLY CHALLENGE"}
          </span>

          {countdown && (
            <div className="challenge-hero-timer font-mono" title={endsAtDate ? `Ends: ${new Date(endsAtDate).toLocaleString()}` : ""}>
              {/* Warning-colored pulsing dot for urgency (contrast safe: dot only) */}
              <span className="challenge-pulse-dot" aria-hidden="true" />
              <span>Ends in {countdown}</span>
            </div>
          )}
        </div>

        <h1 className="challenge-hero-title">“{challengeTitle}”</h1>
        <p className="challenge-hero-prompt">{challengePrompt}</p>

        {/* Primary Action Button */}
        <div className="challenge-hero-actions">
          {alreadyEntered ? (
            <button
              type="button"
              className="challenge-primary-btn is-entered"
              disabled
            >
              <FiCheck /> Entered with your post
            </button>
          ) : (
            <button
              type="button"
              className="challenge-primary-btn"
              onClick={openPostPicker}
            >
              <FiPlus /> Enter with a post
            </button>
          )}
        </div>

        {/* Status Line for Server Messages */}
        {statusMessage && (
          <div
            className={`challenge-status-line ${
              statusMessage.type === "success"
                ? "challenge-status-line--success"
                : "challenge-status-line--error"
            }`}
          >
            {statusMessage.text}
          </div>
        )}
      </div>

      {/* Controls Bar: Sort Toggle (Newest default / Most liked) */}
      <div className="challenge-controls-bar">
        <div className="challenge-sort-group">
          <button
            type="button"
            className={`challenge-sort-btn font-mono ${sortBy === "new" ? "is-active" : ""}`}
            onClick={() => setSortBy("new")}
          >
            Newest
          </button>
          <button
            type="button"
            className={`challenge-sort-btn font-mono ${sortBy === "top" ? "is-active" : ""}`}
            onClick={() => setSortBy("top")}
          >
            Most liked
          </button>
        </div>

        <span className="challenge-entries-counter font-mono">
          [ {entries.length} {entries.length === 1 ? "ENTRY" : "ENTRIES"} ]
        </span>
      </div>

      {/* Entries Gallery or Empty State */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
          LOADING CHALLENGE GALLERY...
        </div>
      ) : entries.length === 0 ? (
        /* Empty State 1: No entries in challenge yet (strictly one action) */
        <div className="challenge-empty-box">
          <p className="challenge-empty-title">No entries yet for “{challengeTitle}”</p>
          <p className="challenge-empty-desc">
            A shared prompt lowers the creative barrier. Be the first creator to share your take on this constraint!
          </p>
          <button
            type="button"
            className="challenge-empty-action"
            onClick={openPostPicker}
          >
            Enter with a post
          </button>
        </div>
      ) : (
        <div className="challenge-grid">
          {entries.map((post, index) => (
            <PostCard
              key={post._id}
              post={post}
              index={index}
              isSelected={false}
              onSelect={() => {}}
            />
          ))}
        </div>
      )}

      {/* Modal Post Picker: Select existing public post */}
      {isPickerOpen && (
        <div
          className="post-picker-overlay"
          onClick={closePostPicker} /* Click outside closes it */
          role="dialog"
          aria-modal="true"
          aria-labelledby="picker-modal-title"
        >
          <div
            className="post-picker-modal"
            onClick={(e) => e.stopPropagation()} /* Prevents backdrop click */
          >
            <div className="post-picker-header">
              <span id="picker-modal-title" className="post-picker-title font-mono">
                SELECT A POST TO ENTER
              </span>
              <button
                type="button"
                className="post-picker-close"
                onClick={closePostPicker}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="post-picker-body">
              <p className="post-picker-hint">
                Choose one of your public posts that fits the weekly prompt <strong>“{challengeTitle}”</strong>. Only one entry per creator is permitted.
              </p>

              {/* Status Line for Server Error / Info */}
              {pickerStatus && (
                <div
                  className={`challenge-status-line ${
                    pickerStatus.type === "error"
                      ? "challenge-status-line--error"
                      : "challenge-status-line--success"
                  }`}
                >
                  {pickerStatus.text}
                </div>
              )}

              {pickerLoading ? (
                <div style={{ padding: "30px", textAlign: "center", fontFamily: "var(--font-mono)" }}>
                  LOADING YOUR POSTS...
                </div>
              ) : eligiblePosts.length === 0 ? (
                /* Empty State 2: User has no public posts (strictly one action) */
                <div className="challenge-empty-box" style={{ padding: "32px 16px" }}>
                  <p className="challenge-empty-title">You have no public posts to enter</p>
                  <p className="challenge-empty-desc">
                    Publish an artwork or sketch first to submit it to this week's creative prompt.
                  </p>
                  <button
                    type="button"
                    className="challenge-empty-action"
                    onClick={() => {
                      closePostPicker();
                      navigate("/feed/create");
                    }}
                  >
                    Create a Post
                  </button>
                </div>
              ) : (
                <div className="post-picker-grid">
                  {eligiblePosts.map((post) => {
                    const isSelected = selectedPostId === post._id;
                    return (
                      <div
                        key={post._id}
                        className={`post-picker-card ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setSelectedPostId(post._id)}
                      >
                        <img
                          src={`http://localhost:9000${post.file_url}`}
                          alt={post.caption || "Post thumbnail"}
                          className="post-picker-thumb"
                        />
                        <div className="post-picker-card-info">
                          <p className="post-picker-card-caption">
                            {post.caption || "Untitled frame"}
                          </p>
                          <span className="post-picker-card-date font-mono">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="post-picker-selected-check" aria-hidden="true">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="post-picker-footer">
              <button
                type="button"
                className="post-picker-cancel-btn"
                onClick={closePostPicker}
              >
                Cancel
              </button>

              <button
                type="button"
                className="post-picker-submit-btn"
                disabled={!selectedPostId || alreadyEntered || submitting}
                onClick={handleSubmitEntry}
              >
                {submitting ? "Entering..." : "Submit Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
