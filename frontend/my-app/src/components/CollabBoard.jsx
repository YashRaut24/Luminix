import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiUsers,
  FiPlus,
  FiSend,
  FiX,
  FiCheck,
  FiBriefcase,
  FiExternalLink,
  FiClock,
  FiMessageSquare
} from "react-icons/fi";
import "./CollabBoard.css";

const ROLE_FILTERS = [
  "All",
  "Musician / Audio",
  "3D / Animation",
  "Illustration",
  "UI / Visual Design",
  "Writing / Lore",
];

function CollabBoard({ user, mode }) {
  const [collabs, setCollabs] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCollabForPitch, setSelectedCollabForPitch] = useState(null);
  const [selectedCollabPitches, setSelectedCollabPitches] = useState(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newRole, setNewRole] = useState("Musician / Audio");
  const [newDesc, setNewDesc] = useState("");
  const [newSkills, setNewSkills] = useState("");
  const [newTimeline, setNewTimeline] = useState("Flexible");

  // Pitch form state
  const [pitchMessage, setPitchMessage] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [pitchSubmitting, setPitchSubmitting] = useState(false);

  const fetchCollabs = async () => {
    try {
      setLoading(true);
      const url =
        activeFilter === "All"
          ? "http://localhost:9000/collabs"
          : `http://localhost:9000/collabs?role=${encodeURIComponent(activeFilter)}`;
      const res = await axios.get(url, { withCredentials: true });
      setCollabs(res.data.collabs || []);
    } catch (err) {
      console.error("Failed to load collabs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollabs();
  }, [activeFilter]);

  const handleCreateCollab = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      await axios.post(
        "http://localhost:9000/collabs",
        {
          title: newTitle,
          description: newDesc,
          role_needed: newRole,
          skills_needed: newSkills,
          project_timeline: newTimeline,
        },
        { withCredentials: true }
      );

      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      setNewSkills("");
      fetchCollabs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post collab request");
    }
  };

  const handleSendPitch = async (e) => {
    e.preventDefault();
    if (!pitchMessage.trim() || !selectedCollabForPitch) return;

    try {
      setPitchSubmitting(true);
      await axios.post(
        `http://localhost:9000/collabs/${selectedCollabForPitch._id}/pitch`,
        {
          message: pitchMessage,
          portfolio_link: portfolioLink,
        },
        { withCredentials: true }
      );

      alert("Pitch sent to the creator!");
      setSelectedCollabForPitch(null);
      setPitchMessage("");
      setPortfolioLink("");
      fetchCollabs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit pitch");
    } finally {
      setPitchSubmitting(false);
    }
  };

  const currentUserId = user?._id || user?.id;

  return (
    <div className="collab-board-page">
      {/* Top Header */}
      <div className="collab-board-header">
        <div className="collab-header-left">
          <h1>Collab Board</h1>
          <p className="collab-header-subtitle">
            Find creative counterparts, pitch your craft, and build collaborative projects
          </p>
        </div>

        <button
          type="button"
          className="collab-create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus /> Post Collab Call
        </button>
      </div>

      {/* Role / Skill Filters */}
      <div className="collab-filter-strip">
        {ROLE_FILTERS.map((role) => (
          <button
            key={role}
            type="button"
            className={`collab-filter-btn ${activeFilter === role ? "active" : ""}`}
            onClick={() => setActiveFilter(role)}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Collab Listings Grid */}
      <div className="collab-cards-grid">
        {collabs.length === 0 && !loading ? (
          <div className="collab-empty-state">
            <FiUsers style={{ fontSize: "32px", marginBottom: "8px" }} />
            <p>No open collaboration calls in this category yet.</p>
            <p style={{ fontSize: "12px" }}>Be the first to post a call for collaborators!</p>
          </div>
        ) : (
          collabs.map((collab) => {
            const isOwner = currentUserId && String(collab.author?._id || collab.author) === String(currentUserId);
            const hasPitched = currentUserId && collab.pitches?.some(
              (p) => String(p.applicant?._id || p.applicant) === String(currentUserId)
            );

            return (
              <div key={collab._id} className="collab-card">
                <div className="collab-card-top">
                  <span className="collab-role-tag">
                    <FiBriefcase /> {collab.role_needed}
                  </span>

                  <h3 className="collab-card-title">{collab.title}</h3>
                  <p className="collab-card-desc">{collab.description}</p>

                  {collab.skills_needed && collab.skills_needed.length > 0 && (
                    <div className="collab-skills-list">
                      {collab.skills_needed.map((skill, sIdx) => (
                        <span key={sIdx} className="collab-skill-pill">
                          #{skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="collab-card-footer">
                  <div className="collab-author-preview">
                    {collab.author?.profileImage || collab.author_avatar ? (
                      <img
                        src={`http://localhost:9000${collab.author?.profileImage || collab.author_avatar}`}
                        alt={collab.username}
                        className="collab-avatar"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="collab-avatar" style={{ background: "var(--rule)" }} />
                    )}
                    <div>
                      <div className="collab-author-name">@{collab.username}</div>
                      <div className="collab-author-sub">Timeline: {collab.project_timeline}</div>
                    </div>
                  </div>

                  <div className="collab-card-actions">
                    {isOwner ? (
                      <button
                        type="button"
                        className="collab-pitches-view-btn"
                        onClick={() => setSelectedCollabPitches(collab)}
                      >
                        <FiMessageSquare /> Pitches ({collab.pitches?.length || 0})
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="collab-pitch-btn"
                        disabled={hasPitched}
                        onClick={() => setSelectedCollabForPitch(collab)}
                      >
                        {hasPitched ? <><FiCheck /> Pitched</> : <><FiSend /> Pitch</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Post Collab Request */}
      {showCreateModal && (
        <div className="collab-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="collab-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="collab-modal-header">
              <h3>Post Collab Call</h3>
              <button
                type="button"
                className="critique-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateCollab} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="collab-form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  className="collab-input"
                  placeholder="e.g. Seeking ambient synth composer for 3D cyberpunk scene"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="collab-form-group">
                <label>Role Needed *</label>
                <select
                  className="collab-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="Musician / Audio">Musician / Audio</option>
                  <option value="3D / Animation">3D / Animation</option>
                  <option value="Illustration">Illustration</option>
                  <option value="UI / Visual Design">UI / Visual Design</option>
                  <option value="Writing / Lore">Writing / Lore</option>
                  <option value="Colorist / Retoucher">Colorist / Retoucher</option>
                </select>
              </div>

              <div className="collab-form-group">
                <label>Project Overview & Expectations *</label>
                <textarea
                  className="collab-textarea"
                  rows="3"
                  placeholder="Describe what you're making, the aesthetic, and what you're looking for..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                />
              </div>

              <div className="collab-form-group">
                <label>Desired Skills (comma separated)</label>
                <input
                  type="text"
                  className="collab-input"
                  placeholder="e.g. Ableton, Synthwave, Sound Design"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                />
              </div>

              <div className="collab-form-group">
                <label>Timeline</label>
                <input
                  type="text"
                  className="collab-input"
                  placeholder="e.g. 2-3 Weeks, Flexible, Fast Sprint"
                  value={newTimeline}
                  onChange={(e) => setNewTimeline(e.target.value)}
                />
              </div>

              <button type="submit" className="collab-submit-btn">
                Publish Call to Board
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Send Pitch */}
      {selectedCollabForPitch && (
        <div className="collab-modal-backdrop" onClick={() => setSelectedCollabForPitch(null)}>
          <div className="collab-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="collab-modal-header">
              <h3>Pitch to @{selectedCollabForPitch.username}</h3>
              <button
                type="button"
                className="critique-modal-close"
                onClick={() => setSelectedCollabForPitch(null)}
              >
                <FiX />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-2)", margin: 0 }}>
              Project: <strong>{selectedCollabForPitch.title}</strong>
            </p>

            <form onSubmit={handleSendPitch} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="collab-form-group">
                <label>Your Short Pitch *</label>
                <textarea
                  className="collab-textarea"
                  rows="4"
                  placeholder="Introduce yourself, your craft, and why you'd be a great fit for this piece..."
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  required
                />
              </div>

              <div className="collab-form-group">
                <label>Portfolio / Sample Link (optional)</label>
                <input
                  type="url"
                  className="collab-input"
                  placeholder="https://..."
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
                />
              </div>

              <button type="submit" className="collab-submit-btn" disabled={pitchSubmitting}>
                {pitchSubmitting ? "Sending..." : "Submit Pitch"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Creator Pitches Inbox */}
      {selectedCollabPitches && (
        <div className="collab-modal-backdrop" onClick={() => setSelectedCollabPitches(null)}>
          <div className="collab-modal-card" style={{ maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="collab-modal-header">
              <h3>Pitches Received ({selectedCollabPitches.pitches?.length || 0})</h3>
              <button
                type="button"
                className="critique-modal-close"
                onClick={() => setSelectedCollabPitches(null)}
              >
                <FiX />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {selectedCollabPitches.pitches?.length === 0 ? (
                <p style={{ color: "var(--text-2)", fontSize: "13px" }}>No pitches received yet.</p>
              ) : (
                selectedCollabPitches.pitches.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px",
                      backgroundColor: "var(--frame-bg)",
                      border: "1px solid var(--rule)",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                        @{p.username}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--text)", margin: 0, lineHeight: 1.4 }}>
                      {p.message}
                    </p>

                    {p.portfolio_link && (
                      <a
                        href={p.portfolio_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "12px",
                          color: "var(--accent)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "4px",
                        }}
                      >
                        <FiExternalLink /> Portfolio Link
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollabBoard;
