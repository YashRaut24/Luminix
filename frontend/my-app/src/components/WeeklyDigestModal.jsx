import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiX, FiMail, FiRepeat, FiAward, FiUserPlus, FiCheck, FiSend } from "react-icons/fi";

export default function WeeklyDigestModal({ isOpen, onClose, user, onSelectFrame }) {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchDigest = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:9000/digest/weekly", {
          withCredentials: true,
        });
        setDigest(res.data);
      } catch (err) {
        console.error("Weekly digest fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDigest();
  }, [isOpen]);

  const handleFollowSuggested = async (creatorId) => {
    try {
      setIsFollowing(true);
      await axios.post(
        `http://localhost:9000/users/${creatorId}/follow`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const handleSendEmailDigest = async () => {
    try {
      setSendingEmail(true);
      const res = await axios.post(
        "http://localhost:9000/digest/send-email",
        {},
        { withCredentials: true }
      );
      setEmailStatus(res.data?.message || "Weekly digest sent to your registered email!");
      setTimeout(() => setEmailStatus(""), 4500);
    } catch (err) {
      setEmailStatus("Failed to send email digest");
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="retention-overlay" onClick={onClose}>
      <div
        className="retention-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Weekly Digest"
      >
        {/* Header */}
        <div className="retention-dialog-header">
          <div className="retention-dialog-title">
            <FiMail style={{ color: "var(--accent)" }} />
            <span>WEEKLY DIGEST // DARKROOM SUMMARY</span>
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

        {/* Body */}
        <div className="retention-dialog-body">
          {loading ? (
            <div style={{ padding: "var(--space-5)", textAlign: "center", fontFamily: "var(--font-mono)" }}>
              PREPARING WEEKLY DIGEST SUMMARY...
            </div>
          ) : digest ? (
            <div className="digest-container">
              {/* Header Banner */}
              <div className="digest-header-banner">
                <div>
                  <div className="font-mono" style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700 }}>
                    {digest.periodLabel}
                  </div>
                  <div style={{ fontSize: "var(--font-lg)", fontWeight: 700, color: "var(--text)" }}>
                    Your Studio Week in Review
                  </div>
                </div>

                <button
                  type="button"
                  className="darkroom-bar__action font-mono"
                  onClick={handleSendEmailDigest}
                  disabled={sendingEmail}
                  title="Receive formatted weekly digest report via email"
                >
                  <FiSend /> {sendingEmail ? "SENDING..." : "EMAIL DIGEST"}
                </button>
              </div>

              {emailStatus && (
                <div
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--accent)",
                    color: "var(--accent)",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-xs)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                  }}
                >
                  ✓ {emailStatus}
                </div>
              )}

              {/* Metrics Row */}
              <div className="digest-metrics-row">
                <div className="digest-metric-box">
                  <span className="digest-metric-num">{digest.metrics?.framesDeveloped || 0}</span>
                  <span className="digest-metric-label">FRAMES DEVELOPED</span>
                </div>
                <div className="digest-metric-box">
                  <span className="digest-metric-num">{digest.metrics?.totalStampsReceived || 0}</span>
                  <span className="digest-metric-label">STAMPS RECEIVED</span>
                </div>
                <div className="digest-metric-box">
                  <span className="digest-metric-num">{digest.metrics?.streakDays || 0}d</span>
                  <span className="digest-metric-label">ACTIVE STREAK</span>
                </div>
                <div className="digest-metric-box">
                  <span className="digest-metric-num">{digest.metrics?.longestStreak || 0}d</span>
                  <span className="digest-metric-label">LONGEST STREAK</span>
                </div>
              </div>

              {/* Columns: Top Remixes, Most-Stamped Frame, Suggested Creator */}
              <div className="digest-grid-columns">
                {/* 1. Top Remixes */}
                <div className="digest-section-card">
                  <div className="digest-section-title">
                    <FiRepeat style={{ color: "var(--accent)" }} />
                    <span>TOP REMIXES OF THE WEEK</span>
                  </div>

                  {digest.topRemixes && digest.topRemixes.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {digest.topRemixes.map((post, idx) => (
                        <div
                          key={post._id || idx}
                          className="digest-remix-item"
                          onClick={() => {
                            if (onSelectFrame) onSelectFrame(post);
                            onClose();
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={
                              post.file_url?.startsWith("http")
                                ? post.file_url
                                : `http://localhost:9000${post.file_url}`
                            }
                            alt=""
                            className="digest-remix-thumb"
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="font-mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
                              @{post.author?.name?.toLowerCase().replace(/\s+/g, "") || "creator"}
                            </div>
                            <div className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
                              {post.remix_count || 1} REMIXES • {post.likes?.length || 0} STAMPS
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="font-mono" style={{ fontSize: "11px", color: "var(--text-3)" }}>
                      No remixes developed this week.
                    </div>
                  )}
                </div>

                {/* 2. Most-Stamped Frame */}
                <div className="digest-section-card">
                  <div className="digest-section-title">
                    <FiAward style={{ color: "var(--accent)" }} />
                    <span>YOUR MOST-STAMPED FRAME</span>
                  </div>

                  {digest.mostStampedFrame ? (
                    <div
                      style={{ display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
                      onClick={() => {
                        if (onSelectFrame) onSelectFrame(digest.mostStampedFrame);
                        onClose();
                      }}
                    >
                      <div style={{ width: "100%", aspectRatio: "16/10", backgroundColor: "#000", overflow: "hidden", borderRadius: "var(--radius-xs)" }}>
                        <img
                          src={
                            digest.mostStampedFrame.file_url?.startsWith("http")
                              ? digest.mostStampedFrame.file_url
                              : `http://localhost:9000${digest.mostStampedFrame.file_url}`
                          }
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)" }}>
                          {digest.mostStampedFrame.caption || "Proof Frame"}
                        </span>
                        <span className="font-mono" style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700 }}>
                          ★ {digest.mostStampedFrame.likes?.length || 0} STAMPS
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono" style={{ fontSize: "11px", color: "var(--text-3)" }}>
                      Post new frames this week to earn stamps and appear here!
                    </div>
                  )}
                </div>

                {/* 3. Suggested Creator */}
                <div className="digest-section-card">
                  <div className="digest-section-title">
                    <FiUserPlus style={{ color: "var(--accent)" }} />
                    <span>SUGGESTED CREATOR TO FOLLOW</span>
                  </div>

                  {digest.suggestedCreator ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div className="digest-creator-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img
                            src={
                              digest.suggestedCreator.profileImage
                                ? (digest.suggestedCreator.profileImage.startsWith("http")
                                    ? digest.suggestedCreator.profileImage
                                    : `http://localhost:9000${digest.suggestedCreator.profileImage}`)
                                : `https://api.dicebear.com/7.x/initials/svg?seed=${digest.suggestedCreator.name}`
                            }
                            alt=""
                            className="digest-creator-avatar"
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "var(--font-sm)", color: "var(--text)" }}>
                              {digest.suggestedCreator.name}
                            </div>
                            <div className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
                              @{digest.suggestedCreator.name?.toLowerCase().replace(/\s+/g, "")}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`darkroom-bar__action font-mono ${isFollowing ? "is-active" : "darkroom-bar__action--primary"}`}
                          onClick={() => handleFollowSuggested(digest.suggestedCreator._id)}
                          disabled={isFollowing}
                        >
                          {isFollowing ? <FiCheck /> : <FiUserPlus />} {isFollowing ? "FOLLOWING" : "FOLLOW"}
                        </button>
                      </div>

                      {digest.suggestedCreator.bio && (
                        <div style={{ fontSize: "var(--font-xs)", color: "var(--text-2)", fontStyle: "italic" }}>
                          “{digest.suggestedCreator.bio}”
                        </div>
                      )}

                      {digest.suggestedCreator.samplePost && (
                        <div
                          style={{
                            width: "100%",
                            height: "100px",
                            backgroundColor: "#000",
                            borderRadius: "var(--radius-xs)",
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            if (onSelectFrame) onSelectFrame(digest.suggestedCreator.samplePost);
                            onClose();
                          }}
                          title="View recent work"
                        >
                          <img
                            src={
                              digest.suggestedCreator.samplePost.file_url?.startsWith("http")
                                ? digest.suggestedCreator.samplePost.file_url
                                : `http://localhost:9000${digest.suggestedCreator.samplePost.file_url}`
                            }
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="font-mono" style={{ fontSize: "11px", color: "var(--text-3)" }}>
                      You are actively connected with the entire network!
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "var(--space-4)", fontFamily: "var(--font-mono)" }}>
              No digest available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
