import React, { useState } from "react";
import { FiX, FiShare2, FiCopy, FiCheck, FiDownload, FiCode } from "react-icons/fi";
import { FaWhatsapp, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function ShareCardModal({ isOpen, onClose, post }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState("preview"); // "preview" | "embed"

  if (!isOpen || !post) return null;

  const serverUrl = "http://localhost:9000";
  const shareCardUrl = `${serverUrl}/share/${post._id}/card.png`;
  const shareWebUrl = `${serverUrl}/share/${post._id}`;
  const embedUrl = `${window.location.origin}/embed/frame/${post._id}`;

  const creatorName = post.author?.name || post.username || "Creator";
  const captionText = post.caption || "Creative Proof";
  const shareMessage = `Check out "${captionText}" by ${creatorName} on Luminix Darkroom:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareWebUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const embedCodeSnippet = `<iframe src="${embedUrl}" width="480" height="580" frameborder="0" scrolling="no" style="border:1px solid #232836;border-radius:4px;overflow:hidden;background:#090c10;"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const handleDownloadCard = async () => {
    try {
      const res = await fetch(shareCardUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `luminix-${post._id}-share-card.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(shareCardUrl, "_blank");
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage + " " + shareWebUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareWebUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareWebUrl)}`;

  return (
    <div className="retention-overlay" onClick={onClose}>
      <div
        className="retention-dialog share-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Auto Share Card & Embed"
      >
        {/* Header */}
        <div className="retention-dialog-header">
          <div className="retention-dialog-title">
            <FiShare2 style={{ color: "var(--accent)" }} />
            <span>AUTO SHARE CARD // SOCIAL PREVIEW &amp; EMBED</span>
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
          {/* Segmented Control */}
          <div className="darkroom-segmented" style={{ width: "max-content", alignSelf: "flex-start" }}>
            <button
              type="button"
              className={`darkroom-segmented__btn ${activeTab === "preview" ? "is-active" : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              SOCIAL SHARE CARD
            </button>
            <button
              type="button"
              className={`darkroom-segmented__btn ${activeTab === "embed" ? "is-active" : ""}`}
              onClick={() => setActiveTab("embed")}
            >
              EMBED WIDGET CODE
            </button>
          </div>

          {activeTab === "preview" ? (
            <>
              {/* Server-Generated Vector Preview Plate (1200x630) */}
              <div>
                <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "block", marginBottom: "4px" }}>
                  DYNAMIC 1200×630 OPEN GRAPH PREVIEW (WHATSAPP, X, LINKEDIN):
                </span>
                <div className="share-card-preview-plate">
                  <img src={shareCardUrl} alt="Luminix Social Share Card" />
                </div>
              </div>

              {/* Quick Network Sharing Buttons */}
              <div className="share-actions-grid">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-network-btn"
                  title="Share to WhatsApp"
                >
                  <FaWhatsapp style={{ color: "#25d366", fontSize: "14px" }} />
                  <span>WHATSAPP</span>
                </a>

                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-network-btn"
                  title="Share to X (Twitter)"
                >
                  <FaTwitter style={{ color: "#1da1f2", fontSize: "14px" }} />
                  <span>X (TWITTER)</span>
                </a>

                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-network-btn"
                  title="Share to LinkedIn"
                >
                  <FaLinkedin style={{ color: "#0a66c2", fontSize: "14px" }} />
                  <span>LINKEDIN</span>
                </a>

                <button
                  type="button"
                  className="share-network-btn"
                  onClick={handleDownloadCard}
                  title="Download clean SVG vector plate"
                >
                  <FiDownload />
                  <span>SAVE CARD</span>
                </button>
              </div>

              {/* Direct Link Copy */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--rule)",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-xs)",
                }}
              >
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {shareWebUrl}
                </span>

                <button
                  type="button"
                  className="darkroom-bar__action darkroom-bar__action--primary font-mono"
                  onClick={handleCopyLink}
                >
                  {copiedLink ? <FiCheck /> : <FiCopy />} {copiedLink ? "COPIED" : "COPY LINK"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Embed Code Snippet View */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div>
                  <span className="font-mono" style={{ fontSize: "11px", color: "var(--text)", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    EMBED THIS FRAME ON EXTERNAL WEBSITES:
                  </span>
                  <p style={{ fontSize: "12px", color: "var(--text-2)", margin: 0 }}>
                    Embed your artwork and process on Substack, personal portfolios, Medium, or Notion. Visitors can view your piece and jump straight to your Luminix studio.
                  </p>
                </div>

                <textarea
                  className="embed-code-textarea"
                  rows={4}
                  readOnly
                  value={embedCodeSnippet}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono"
                    style={{ fontSize: "11px", color: "var(--accent)", textDecoration: "none" }}
                  >
                    ↗ Preview Standalone Embed Frame
                  </a>

                  <button
                    type="button"
                    className="darkroom-bar__action darkroom-bar__action--primary font-mono"
                    onClick={handleCopyEmbed}
                  >
                    {copiedEmbed ? <FiCheck /> : <FiCode />} {copiedEmbed ? "COPIED IFRAME" : "COPY EMBED CODE"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
