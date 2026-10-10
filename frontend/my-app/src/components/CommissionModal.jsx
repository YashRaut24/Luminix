import React, { useState } from "react";
import axios from "axios";
import { FiX, FiCheck, FiSend, FiClock, FiDollarSign, FiBriefcase } from "react-icons/fi";

export default function CommissionModal({ isOpen, onClose, creator }) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectType, setProjectType] = useState("Digital Illustration");
  const [budget, setBudget] = useState("$250 – $500");
  const [deadline, setDeadline] = useState("2–3 weeks");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !creator) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !message) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(`http://localhost:9000/users/${creator._id}/commissions/inquire`, {
        client_name: clientName,
        client_email: clientEmail,
        project_type: projectType,
        budget,
        deadline,
        message,
      });

      setSuccessMsg(res.data.message || "Commission inquiry sent successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 3500);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit commission inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startingRate = creator.commission_info?.rate_starting_at;
  const turnaround = creator.commission_info?.turnaround_time || "1-2 weeks";
  const specialties = creator.commission_info?.specialties || [];

  return (
    <div className="retention-overlay" onClick={onClose}>
      <div
        className="retention-dialog"
        style={{ maxWidth: "560px" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Commission Inquiry"
      >
        {/* Header */}
        <div className="retention-dialog-header">
          <div className="retention-dialog-title">
            <FiBriefcase style={{ color: "#10b981" }} />
            <span>COMMISSION INQUIRY // @{creator.name?.toLowerCase().replace(/\s+/g, "")}</span>
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
          {/* Creator Commission Banner */}
          <div
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--rule)",
              borderLeft: "3px solid #10b981",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-xs)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="commissions-status-badge is-open">
                <span className="commissions-dot" /> OPEN FOR COMMISSIONS
              </span>

              {startingRate && (
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700 }}>
                  <FiDollarSign /> STARTING AT {startingRate}
                </span>
              )}
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-2)", marginTop: "4px" }}>
              Turnaround: <strong>{turnaround}</strong> • Direct client inquiry for studio work &amp; bespoke creations.
            </div>

            {specialties.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                {specialties.map((spec, i) => (
                  <span
                    key={i}
                    className="font-mono"
                    style={{
                      fontSize: "10px",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--rule)",
                      padding: "2px 6px",
                      borderRadius: "2px",
                      color: "var(--text-3)",
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>

          {successMsg ? (
            <div
              style={{
                padding: "var(--space-5)",
                textAlign: "center",
                backgroundColor: "var(--surface-2)",
                border: "1px solid #10b981",
                borderRadius: "var(--radius-xs)",
                color: "#6ee7b7",
                fontFamily: "var(--font-mono)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                alignItems: "center",
              }}
            >
              <FiCheck style={{ fontSize: "28px" }} />
              <div style={{ fontSize: "14px", fontWeight: 700 }}>{successMsg}</div>
              <p style={{ fontSize: "12px", color: "var(--text-2)", margin: 0 }}>
                {creator.name} has been notified and will review your proposal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div className="commissions-form-grid">
                <div>
                  <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                    YOUR NAME / STUDIO *
                  </label>
                  <input
                    type="text"
                    required
                    className="circles-invite-input font-mono"
                    style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                    placeholder="e.g. Maya Lin, Acme Studios"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                    YOUR EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    className="circles-invite-input font-mono"
                    style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                    placeholder="client@studio.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="commissions-form-grid">
                <div>
                  <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                    PROJECT SCOPE
                  </label>
                  <select
                    className="circles-invite-input font-mono"
                    style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                  >
                    <option value="Digital Illustration">Digital Illustration</option>
                    <option value="Concept Art / Visual Dev">Concept Art / Visual Dev</option>
                    <option value="3D Model / Render">3D Model / Render</option>
                    <option value="Editorial / Cover Art">Editorial / Cover Art</option>
                    <option value="Brand Identity / Iconography">Brand Identity / Iconography</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                    ESTIMATED BUDGET
                  </label>
                  <input
                    type="text"
                    className="circles-invite-input font-mono"
                    style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                    placeholder="$250 – $500, Flexible..."
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                  TIMELINE / DEADLINE
                </label>
                <input
                  type="text"
                  className="circles-invite-input font-mono"
                  style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                  placeholder="e.g. End of Month, Flexible"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div>
                <label className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                  PROJECT BRIEF &amp; DETAILS *
                </label>
                <textarea
                  required
                  rows={3}
                  className="circles-invite-input font-mono"
                  style={{ width: "100%", boxSizing: "border-box", textTransform: "none" }}
                  placeholder="Describe your vision, subject matter, style preferences and references..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <button
                  type="submit"
                  className="darkroom-bar__action darkroom-bar__action--primary font-mono"
                  disabled={isSubmitting || !clientName || !clientEmail || !message}
                  style={{ backgroundColor: "#10b981", borderColor: "#10b981", color: "#000" }}
                >
                  <FiSend /> {isSubmitting ? "SENDING PROPOSAL..." : "SEND INQUIRY TO CREATOR"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
