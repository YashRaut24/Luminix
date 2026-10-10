import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FiAward, FiExternalLink } from "react-icons/fi";

export default function EmbedFrame() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmbedData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:9000/public/posts/${id}/embed`);
        setPost(res.data.post);
      } catch (err) {
        console.error("Embed load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmbedData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ backgroundColor: "#090c10", color: "#64748b", fontFamily: "monospace", padding: "20px", textAlign: "center", fontSize: "12px" }}>
        LOADING LUMINIX EMBED...
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ backgroundColor: "#090c10", color: "#64748b", fontFamily: "monospace", padding: "20px", textAlign: "center", fontSize: "12px" }}>
        FRAME NOT FOUND
      </div>
    );
  }

  const imgUrl = post.file_url?.startsWith("http")
    ? post.file_url
    : `http://localhost:9000${post.file_url}`;

  const authorName = post.author?.name || post.username || "Creator";
  const authorTag = post.author?.lumiTag || `@${authorName.toLowerCase().replace(/\s+/g, "")}`;
  const avatarUrl = post.author?.profileImage
    ? (post.author.profileImage.startsWith("http")
        ? post.author.profileImage
        : `http://localhost:9000${post.author.profileImage}`)
    : `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`;

  return (
    <div className="embed-widget-container">
      {/* Header */}
      <div className="embed-widget-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img
            src={avatarUrl}
            alt={authorName}
            style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
          />
          <span className="font-mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
            {authorTag}
          </span>
        </div>

        <span className="font-mono" style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700 }}>
          [ LUMINIX ]
        </span>
      </div>

      {/* Main Image */}
      <div className="embed-widget-artwork">
        <img src={imgUrl} alt={post.caption || "Proof"} />
      </div>

      {/* Footer */}
      <div className="embed-widget-footer">
        <div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px" }}>
            {post.caption || post.file_name || "Creative Proof"}
          </div>
          <div className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)", display: "flex", alignItems: "center", gap: "4px" }}>
            <FiAward style={{ color: "var(--accent)" }} /> {post.likes?.length || 0} STAMPS
          </div>
        </div>

        <a
          href={`http://localhost:5173/feed`}
          target="_blank"
          rel="noopener noreferrer"
          className="darkroom-bar__action darkroom-bar__action--primary font-mono"
          style={{ textDecoration: "none", fontSize: "11px", padding: "4px 8px" }}
        >
          VIEW IN APP <FiExternalLink />
        </a>
      </div>
    </div>
  );
}
