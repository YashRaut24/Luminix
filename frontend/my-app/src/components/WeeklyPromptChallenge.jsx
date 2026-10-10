import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiX, FiAward, FiCheck, FiSend, FiClock, FiPlus } from "react-icons/fi";
import { BsStars } from "react-icons/bs";

export default function WeeklyPromptChallenge({ isOpen, onClose, user, onSelectFrame }) {
  const [challenge, setChallenge] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [selectedPostToEnter, setSelectedPostToEnter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState("");
  const [stampedMap, setStampedMap] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    const fetchChallengeData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:9000/challenges/current", {
          withCredentials: true,
        });

        const ch = res.data.challenge;
        setChallenge(ch);

        if (ch?._id) {
          const entRes = await axios.get(
            `http://localhost:9000/challenges/${ch._id}/entries`,
            { withCredentials: true }
          );
          const fetchedEntries = entRes.data.entries || [];
          setEntries(fetchedEntries);

          // Populate user's stamped state
          const stamped = {};
          fetchedEntries.forEach((e) => {
            if (user && e.likes && e.likes.includes(user._id || user.id)) {
              stamped[e._id] = true;
            }
          });
          setStampedMap(stamped);
        }

        // Also fetch user's own posts for easy submission
        if (user) {
          try {
            const myPostsRes = await axios.get("http://localhost:9000/posts", {
              withCredentials: true,
            });
            const myPosts = (myPostsRes.data.posts || []).filter(
              (p) => (p.author?._id || p.author) === (user._id || user.id)
            );
            setUserPosts(myPosts);
            if (myPosts.length > 0) {
              setSelectedPostToEnter(myPosts[0]._id);
            }
          } catch (e) {
            console.log("Could not load user posts:", e);
          }
        }
      } catch (err) {
        console.error("Weekly challenge load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeData();
  }, [isOpen, user]);

  const handleStampToggle = async (post) => {
    try {
      const isCurrentlyStamped = !!stampedMap[post._id];
      setStampedMap((prev) => ({
        ...prev,
        [post._id]: !isCurrentlyStamped,
      }));

      await axios.post(
        `http://localhost:9000/posts/${post._id}/like`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Stamp error:", err);
    }
  };

  const handleEnterFrame = async (e) => {
    e.preventDefault();
    if (!selectedPostToEnter || !challenge) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `http://localhost:9000/challenges/${challenge._id}/enter`,
        { postId: selectedPostToEnter },
        { withCredentials: true }
      );

      setSubmissionSuccess(`Frame submitted to "${challenge.theme}"!`);
      // Re-fetch entries
      const entRes = await axios.get(
        `http://localhost:9000/challenges/${challenge._id}/entries`,
        { withCredentials: true }
      );
      setEntries(entRes.data.entries || []);
      setTimeout(() => setSubmissionSuccess(""), 4000);
    } catch (err) {
      alert("Failed to submit frame to weekly prompt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="retention-overlay" onClick={onClose}>
      <div
        className="retention-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Weekly Prompt Challenge"
      >
        {/* Modal Header */}
        <div className="retention-dialog-header">
          <div className="retention-dialog-title">
            <BsStars style={{ color: "var(--accent)" }} />
            <span>WEEKLY PROMPT CHALLENGE // GALLERY</span>
          </div>
          <button
            type="button"
            className="darkroom-bar__action"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Modal Body */}
        <div className="retention-dialog-body">
          {loading ? (
            <div style={{ padding: "var(--space-5)", textAlign: "center", fontFamily: "var(--font-mono)" }}>
              LOADING WEEKLY CHALLENGE...
            </div>
          ) : challenge ? (
            <>
              {/* Challenge Hero Banner */}
              <div className="challenge-theme-card">
                <div className="challenge-theme-badge">
                  WEEK {challenge.week_number} THEME CHALLENGE // OPEN FOR STAMPS
                </div>
                <h2 className="challenge-theme-title">“{challenge.theme}”</h2>
                <p className="challenge-theme-desc">{challenge.description}</p>

                {challenge.rules && challenge.rules.length > 0 && (
                  <div className="challenge-rules-list">
                    {challenge.rules.map((rule, idx) => (
                      <span key={idx} className="challenge-rule-tag">
                        • {rule}
                      </span>
                    ))}
                    <span className="challenge-rule-tag" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>
                      ✓ Voting by Stamps (No Public Leaderboard)
                    </span>
                  </div>
                )}
              </div>

              {/* Enter Frame Section */}
              {user && userPosts.length > 0 && (
                <div
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--rule)",
                    padding: "var(--space-3) var(--space-4)",
                    borderRadius: "var(--radius-xs)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "var(--space-2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiAward style={{ color: "var(--accent)" }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600 }}>
                      SUBMIT YOUR FRAME:
                    </span>
                    <select
                      className="discovery-tool-select font-mono"
                      value={selectedPostToEnter}
                      onChange={(e) => setSelectedPostToEnter(e.target.value)}
                      style={{ maxWidth: "260px" }}
                    >
                      {userPosts.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.caption ? p.caption.slice(0, 30) : p.file_name || "Frame"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="darkroom-bar__action darkroom-bar__action--primary font-mono"
                    onClick={handleEnterFrame}
                    disabled={isSubmitting}
                  >
                    <FiSend /> {isSubmitting ? "ENTERING..." : "ENTER PROMPT"}
                  </button>

                  {submissionSuccess && (
                    <div style={{ width: "100%", color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                      ✓ {submissionSuccess}
                    </div>
                  )}
                </div>
              )}

              {/* Gallery Header */}
              <div className="challenge-gallery-header">
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)" }}>
                  SUBMISSIONS ({entries.length} FRAMES) — STAMP FRAMES YOU ADMIRE
                </span>
                <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
                  COMMUNITY VOTING // NO COMPETITIVE LEADERBOARD
                </span>
              </div>

              {/* Unranked Community Gallery Grid */}
              {entries.length === 0 ? (
                <div
                  style={{
                    padding: "var(--space-5)",
                    textAlign: "center",
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--rule)",
                    borderRadius: "var(--radius-xs)",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-3)",
                  }}
                >
                  NO SUBMISSIONS YET. BE THE FIRST TO POST WITH THEME “{challenge.theme.toUpperCase()}”!
                </div>
              ) : (
                <div className="challenge-gallery-grid">
                  {entries.map((post) => {
                    const isStamped = !!stampedMap[post._id];
                    return (
                      <div key={post._id} className="challenge-entry-card">
                        <div
                          className="challenge-entry-thumb"
                          onClick={() => {
                            if (onSelectFrame) onSelectFrame(post);
                            onClose();
                          }}
                          style={{ cursor: "pointer" }}
                          title="View in Lightbox Inspector"
                        >
                          <img
                            src={
                              post.file_url?.startsWith("http")
                                ? post.file_url
                                : `http://localhost:9000${post.file_url}`
                            }
                            alt={post.caption || "Challenge Entry"}
                            loading="lazy"
                          />
                        </div>

                        <div className="challenge-entry-info">
                          <span className="challenge-author-tag">
                            @{post.author?.name?.toLowerCase().replace(/\s+/g, "") || "creator"}
                          </span>

                          <button
                            type="button"
                            className={`challenge-stamp-btn ${isStamped ? "is-stamped" : ""}`}
                            onClick={() => handleStampToggle(post)}
                            title={isStamped ? "You stamped this frame" : "Stamp this frame"}
                          >
                            <FiAward /> {isStamped ? "STAMPED" : "STAMP"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: "var(--space-4)", fontFamily: "var(--font-mono)" }}>
              No active challenge currently scheduled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
