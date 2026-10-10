import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiX, FiUsers, FiPlus, FiKey, FiCopy, FiCheck, FiShare2, FiEdit2, FiGrid } from "react-icons/fi";
import { MdOutlineGroups } from "react-icons/md";

export default function CirclesWorkspace({ isOpen, onClose, user, onSelectFrame }) {
  const [circles, setCircles] = useState([]);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [circleFeed, setCircleFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteInput, setInviteInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Create circle form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDesc, setNewCircleDesc] = useState("");
  const [newPromptTheme, setNewPromptTheme] = useState("Studio Study #01");
  const [newPromptDesc, setNewPromptDesc] = useState("Share your preliminary sketches and material tests");
  const [creating, setCreating] = useState(false);

  // Edit prompt state
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPromptTheme, setEditedPromptTheme] = useState("");
  const [editedPromptDesc, setEditedPromptDesc] = useState("");

  const fetchCircles = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:9000/circles", {
        withCredentials: true,
      });
      const list = res.data.circles || [];
      setCircles(list);
      if (list.length > 0 && !selectedCircle) {
        setSelectedCircle(list[0]);
      }
    } catch (err) {
      console.error("Fetch circles error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCircles();
    }
  }, [isOpen]);

  // Fetch feed when selected circle changes
  useEffect(() => {
    if (!selectedCircle) return;
    const fetchFeed = async () => {
      try {
        const res = await axios.get(
          `http://localhost:9000/circles/${selectedCircle._id}/feed`,
          { withCredentials: true }
        );
        setCircleFeed(res.data.posts || []);
        setEditedPromptTheme(selectedCircle.prompt?.theme || "");
        setEditedPromptDesc(selectedCircle.prompt?.description || "");
      } catch (err) {
        console.error("Fetch circle feed error:", err);
      }
    };
    fetchFeed();
  }, [selectedCircle]);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    try {
      setJoining(true);
      setJoinMsg("");
      const res = await axios.post(
        "http://localhost:9000/circles/join",
        { invite_code: inviteInput.trim() },
        { withCredentials: true }
      );
      setJoinMsg(`Joined ${res.data.circle?.name}!`);
      setInviteInput("");
      await fetchCircles();
      setSelectedCircle(res.data.circle);
      setTimeout(() => setJoinMsg(""), 4000);
    } catch (err) {
      setJoinMsg(err.response?.data?.message || "Invalid invite code");
    } finally {
      setJoining(false);
    }
  };

  const handleCreateCircle = async (e) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;
    try {
      setCreating(true);
      const res = await axios.post(
        "http://localhost:9000/circles",
        {
          name: newCircleName.trim(),
          description: newCircleDesc.trim(),
          promptTheme: newPromptTheme.trim(),
          promptDesc: newPromptDesc.trim(),
        },
        { withCredentials: true }
      );
      setShowCreateModal(false);
      setNewCircleName("");
      setNewCircleDesc("");
      await fetchCircles();
      setSelectedCircle(res.data.circle);
    } catch (err) {
      alert("Failed to create circle");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSavePrompt = async () => {
    if (!selectedCircle) return;
    try {
      const res = await axios.post(
        `http://localhost:9000/circles/${selectedCircle._id}/prompt`,
        {
          theme: editedPromptTheme,
          description: editedPromptDesc,
        },
        { withCredentials: true }
      );
      setSelectedCircle((prev) => ({
        ...prev,
        prompt: res.data.prompt,
      }));
      setIsEditingPrompt(false);
    } catch (err) {
      alert("Failed to update prompt. Only circle admins can modify prompts.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="retention-overlay" onClick={onClose}>
      <div
        className="retention-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Private Circles Workspace"
      >
        {/* Header */}
        <div className="retention-dialog-header">
          <div className="retention-dialog-title">
            <MdOutlineGroups style={{ color: "var(--accent)" }} />
            <span>PRIVATE CIRCLES // INVITE CODE NETWORK</span>
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
          {/* Top Actions: Join by Code & New Circle Button */}
          <div className="circles-top-actions">
            <form onSubmit={handleJoinByCode} className="circles-input-group">
              <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)" }}>
                INVITE CODE:
              </span>
              <input
                type="text"
                className="circles-invite-input"
                placeholder="E.G. LUM9X2"
                maxLength={8}
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
              />
              <button
                type="submit"
                className="darkroom-bar__action font-mono"
                disabled={joining || !inviteInput.trim()}
              >
                <FiKey /> {joining ? "JOINING..." : "ENTER"}
              </button>
              {joinMsg && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: "11px",
                    color: joinMsg.includes("Invalid") ? "#ef4444" : "var(--accent)",
                  }}
                >
                  {joinMsg}
                </span>
              )}
            </form>

            <button
              type="button"
              className="darkroom-bar__action darkroom-bar__action--primary font-mono"
              onClick={() => setShowCreateModal(true)}
            >
              <FiPlus /> CREATE CIRCLE
            </button>
          </div>

          {/* Circles Switcher Bar */}
          {circles.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "4px",
                borderBottom: "1px solid var(--rule)",
              }}
            >
              {circles.map((c) => {
                const isSelected = selectedCircle?._id === c._id;
                return (
                  <button
                    key={c._id}
                    type="button"
                    className={`darkroom-bar__action font-mono ${isSelected ? "is-active" : ""}`}
                    onClick={() => setSelectedCircle(c)}
                  >
                    <span>{c.name}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-3)", marginLeft: "4px" }}>
                      ({c.members?.length || 1})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Circle Content */}
          {loading ? (
            <div style={{ padding: "var(--space-4)", textAlign: "center", fontFamily: "var(--font-mono)" }}>
              LOADING CIRCLES...
            </div>
          ) : selectedCircle ? (
            <div className="circle-detail-container">
              {/* Circle Info Bar with Copyable Invite Code */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                  padding: "var(--space-3)",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--rule)",
                  borderRadius: "var(--radius-xs)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "var(--font-md)", color: "var(--text)" }}>
                    {selectedCircle.name}
                  </div>
                  {selectedCircle.description && (
                    <div style={{ fontSize: "var(--font-xs)", color: "var(--text-2)", marginTop: "2px" }}>
                      {selectedCircle.description}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
                    MEMBERS: {selectedCircle.members?.length || 1}
                  </span>

                  <button
                    type="button"
                    className="circle-code-badge"
                    onClick={() => handleCopyCode(selectedCircle.invite_code)}
                    title="Click to copy private invite code"
                  >
                    {copiedCode ? <FiCheck /> : <FiCopy />} CODE: {selectedCircle.invite_code}
                  </button>
                </div>
              </div>

              {/* Circle's Private Prompt Banner */}
              <div className="circle-prompt-banner">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="circle-prompt-label">CIRCLE PRIVATE PROMPT</span>
                  <button
                    type="button"
                    className="darkroom-bar__action font-mono"
                    style={{ fontSize: "10px", padding: "2px 6px" }}
                    onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                  >
                    <FiEdit2 /> {isEditingPrompt ? "CANCEL" : "EDIT PROMPT"}
                  </button>
                </div>

                {!isEditingPrompt ? (
                  <>
                    <div className="circle-prompt-theme">
                      “{selectedCircle.prompt?.theme || "Weekly Circle Study"}”
                    </div>
                    <div className="circle-prompt-desc">
                      {selectedCircle.prompt?.description || "Share your works in progress and explorations"}
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                    <input
                      type="text"
                      className="circles-invite-input font-mono"
                      style={{ width: "100%", boxSizing: "border-box" }}
                      value={editedPromptTheme}
                      onChange={(e) => setEditedPromptTheme(e.target.value)}
                      placeholder="Prompt Theme"
                    />
                    <textarea
                      rows={2}
                      className="circles-invite-input font-mono"
                      style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                      value={editedPromptDesc}
                      onChange={(e) => setEditedPromptDesc(e.target.value)}
                      placeholder="Prompt Description / Guidelines"
                    />
                    <button
                      type="button"
                      className="darkroom-bar__action darkroom-bar__action--primary font-mono"
                      style={{ alignSelf: "flex-end" }}
                      onClick={handleSavePrompt}
                    >
                      SAVE PROMPT
                    </button>
                  </div>
                )}
              </div>

              {/* Circle Mini-Feed */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)" }}>
                  MINI-FEED // {circleFeed.length} FRAMES DEVELOPED
                </span>
              </div>

              {circleFeed.length === 0 ? (
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
                  NO FRAMES IN THIS CIRCLE YET. SHARE THE INVITE CODE TO YOUR STUDIO OR CLASS!
                </div>
              ) : (
                <div className="challenge-gallery-grid">
                  {circleFeed.map((post) => (
                    <div
                      key={post._id}
                      className="challenge-entry-card"
                      onClick={() => {
                        if (onSelectFrame) onSelectFrame(post);
                        onClose();
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="challenge-entry-thumb">
                        <img
                          src={
                            post.file_url?.startsWith("http")
                              ? post.file_url
                              : `http://localhost:9000${post.file_url}`
                          }
                          alt={post.caption || "Circle Frame"}
                          loading="lazy"
                        />
                      </div>
                      <div className="challenge-entry-info">
                        <span className="challenge-author-tag">
                          @{post.author?.name?.toLowerCase().replace(/\s+/g, "") || "creator"}
                        </span>
                        <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: "var(--space-5)",
                textAlign: "center",
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--rule)",
                borderRadius: "var(--radius-xs)",
                fontFamily: "var(--font-mono)",
                color: "var(--text-2)",
              }}
            >
              You haven't joined any circles yet. Enter an invite code above or create a new circle!
            </div>
          )}
        </div>

        {/* Modal to Create New Circle */}
        {showCreateModal && (
          <div className="retention-overlay" onClick={() => setShowCreateModal(false)}>
            <div
              className="retention-dialog"
              style={{ maxWidth: "480px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="retention-dialog-header">
                <div className="retention-dialog-title">
                  <FiPlus style={{ color: "var(--accent)" }} />
                  <span>NEW PRIVATE CIRCLE</span>
                </div>
                <button
                  type="button"
                  className="darkroom-bar__action"
                  onClick={() => setShowCreateModal(false)}
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleCreateCircle} className="retention-dialog-body">
                <div>
                  <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                    CIRCLE NAME:
                  </label>
                  <input
                    type="text"
                    required
                    className="circles-invite-input font-mono"
                    style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                    placeholder="e.g. RISD Typography Studio, Tokyo Night Shutter"
                    value={newCircleName}
                    onChange={(e) => setNewCircleName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                    DESCRIPTION:
                  </label>
                  <input
                    type="text"
                    className="circles-invite-input font-mono"
                    style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                    placeholder="Small private group for class critiques"
                    value={newCircleDesc}
                    onChange={(e) => setNewCircleDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                    INITIAL CIRCLE PROMPT THEME:
                  </label>
                  <input
                    type="text"
                    className="circles-invite-input font-mono"
                    style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                    value={newPromptTheme}
                    onChange={(e) => setNewPromptTheme(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                    PROMPT INSTRUCTIONS:
                  </label>
                  <textarea
                    rows={2}
                    className="circles-invite-input font-mono"
                    style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                    value={newPromptDesc}
                    onChange={(e) => setNewPromptDesc(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="darkroom-bar__action darkroom-bar__action--primary font-mono"
                  disabled={creating || !newCircleName.trim()}
                  style={{ marginTop: "var(--space-2)" }}
                >
                  {creating ? "CREATING..." : "GENERATE INVITE CODE & CREATE"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
