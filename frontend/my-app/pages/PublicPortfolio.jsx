import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiShare2, FiExternalLink, FiBriefcase, FiX, FiCheck, FiCopy, FiCompass } from "react-icons/fi";
import CommissionModal from "../src/components/CommissionModal";

export default function PublicPortfolio() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:9000/public/portfolio/${handle}`);
        setData(res.data);
      } catch (err) {
        console.error("Public portfolio error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [handle]);

  const handleCopyPortfolioLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="portfolio-public-page" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="font-mono" style={{ color: "var(--text-3)", letterSpacing: "1px" }}>
          LOADING CREATOR PORTFOLIO...
        </div>
      </div>
    );
  }

  if (!data || !data.creator) {
    return (
      <div className="portfolio-public-page" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "420px", padding: "var(--space-4)" }}>
          <h2 style={{ color: "var(--text)" }}>Portfolio Not Found</h2>
          <p style={{ color: "var(--text-2)", fontSize: "14px" }}>
            The creator "@{handle}" has not published a public portfolio yet or the handle is incorrect.
          </p>
          <button
            type="button"
            className="darkroom-bar__action darkroom-bar__action--primary font-mono"
            onClick={() => navigate("/")}
          >
            Explore Luminix Darkroom
          </button>
        </div>
      </div>
    );
  }

  const { creator, posts } = data;

  return (
    <div className="portfolio-public-page">
      {/* Top Public Bar */}
      <header className="portfolio-public-nav">
        <div
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", letterSpacing: "1px" }}>
            [ LUMINIX // PUBLIC PORTFOLIO ]
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="darkroom-bar__action font-mono"
            onClick={handleCopyPortfolioLink}
            title="Copy Public Link"
          >
            {copiedLink ? <FiCheck /> : <FiCopy />} {copiedLink ? "COPIED" : "SHARE LINK"}
          </button>

          <button
            type="button"
            className="darkroom-bar__action darkroom-bar__action--primary font-mono"
            onClick={() => navigate("/signup")}
          >
            CREATE YOUR PORTFOLIO
          </button>
        </div>
      </header>

      {/* Main Portfolio Content */}
      <main className="portfolio-public-hero">
        {/* Creator Identity Header Card */}
        <div className="portfolio-header-card">
          <div className="portfolio-creator-id">
            <img
              src={
                creator.profileImage
                  ? (creator.profileImage.startsWith("http")
                      ? creator.profileImage
                      : `http://localhost:9000${creator.profileImage}`)
                  : `https://api.dicebear.com/7.x/initials/svg?seed=${creator.name}`
              }
              alt={creator.name}
              className="portfolio-avatar"
            />

            <div className="portfolio-title-group">
              <h1>{creator.name}</h1>
              <div className="portfolio-handle-tag">
                {creator.lumiTag || `@${creator.name.toLowerCase().replace(/\s+/g, "")}`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            {creator.open_for_commissions && (
              <button
                type="button"
                className="commissions-status-badge is-open"
                onClick={() => setShowCommissionModal(true)}
                title="Send commission request"
              >
                <span className="commissions-dot" /> OPEN FOR COMMISSIONS
              </button>
            )}

            <button
              type="button"
              className="darkroom-bar__action font-mono"
              onClick={() => setShowCommissionModal(true)}
              style={{ backgroundColor: "var(--surface-2)" }}
            >
              <FiBriefcase /> INQUIRE FOR WORK
            </button>
          </div>

          <div style={{ width: "100%", marginTop: "var(--space-2)" }}>
            <p className="portfolio-bio-text">{creator.bio}</p>

            {creator.skillBadges && creator.skillBadges.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {creator.skillBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="font-mono"
                    style={{
                      fontSize: "11px",
                      backgroundColor: "var(--surface-2)",
                      border: "1px solid var(--rule)",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-xs)",
                      color: "var(--text)",
                    }}
                  >
                    {badge.icon || "⭐"} {badge.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gallery Section Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--rule)", paddingBottom: "var(--space-2)" }}>
          <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)", fontWeight: 700 }}>
            FEATURED WORKS // {posts.length} FRAMES
          </span>
          <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
            CLICK ANY FRAME TO INSPECT
          </span>
        </div>

        {/* Portfolio Gallery Grid */}
        <div className="portfolio-grid">
          {posts.map((post, idx) => {
            const frameNum = String(idx + 1).padStart(2, "0");
            const imgUrl = post.file_url?.startsWith("http")
              ? post.file_url
              : `http://localhost:9000${post.file_url}`;

            return (
              <div
                key={post._id}
                className="portfolio-frame-card"
                onClick={() => setSelectedFrame(post)}
              >
                <div className="portfolio-frame-thumb">
                  <img src={imgUrl} alt={post.caption || "Frame"} loading="lazy" />
                </div>
                <div className="portfolio-frame-caption">
                  <span>FRAME #{frameNum}</span>
                  <span style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                    {post.caption || post.file_name || "Untitled Master"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Frame Lightbox Modal */}
      {selectedFrame && (
        <div className="retention-overlay" onClick={() => setSelectedFrame(null)}>
          <div
            className="retention-dialog"
            style={{ maxWidth: "860px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="retention-dialog-header">
              <span className="font-mono" style={{ fontSize: "11px", color: "var(--text)", fontWeight: 700 }}>
                [LIGHTBOX INSPECTION // {selectedFrame.caption || "FRAME"}]
              </span>
              <button
                type="button"
                className="darkroom-bar__action"
                onClick={() => setSelectedFrame(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="retention-dialog-body" style={{ alignItems: "center" }}>
              <div style={{ width: "100%", maxHeight: "65vh", backgroundColor: "#000", overflow: "hidden", borderRadius: "var(--radius-xs)", display: "flex", justifyContent: "center" }}>
                <img
                  src={
                    selectedFrame.file_url?.startsWith("http")
                      ? selectedFrame.file_url
                      : `http://localhost:9000${selectedFrame.file_url}`
                  }
                  alt=""
                  style={{ maxHeight: "65vh", maxWidth: "100%", objectFit: "contain" }}
                />
              </div>

              <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", paddingTop: "var(--space-2)" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                    {selectedFrame.caption || selectedFrame.file_name}
                  </div>
                  <div className="font-mono" style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                    Developed on {new Date(selectedFrame.createdAt).toLocaleDateString()} • ★ {selectedFrame.likes?.length || 0} Stamps
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="darkroom-bar__action font-mono"
                    onClick={() => {
                      setSelectedFrame(null);
                      setShowCommissionModal(true);
                    }}
                  >
                    <FiBriefcase /> INQUIRE ON SIMILAR WORK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commission Inquiry Modal */}
      <CommissionModal
        isOpen={showCommissionModal}
        onClose={() => setShowCommissionModal(false)}
        creator={creator}
      />
    </div>
  );
}
