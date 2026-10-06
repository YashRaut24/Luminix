import React, { useState, useEffect } from "react";
import "./SearchUser.css";
import axios from "axios";
import { Link } from "react-router-dom";
import { BsStars } from "react-icons/bs";
import { FiSearch, FiUser, FiHeart, FiMessageCircle, FiLayers, FiCompass } from "react-icons/fi";

function SearchUser({ mode }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [matchingCreators, setMatchingCreators] = useState([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Semantic Search Prompts
  const promptSuggestions = [
    { label: "🌃 Moody city photos", query: "moody city street photography night" },
    { label: "⚡ Cyberpunk neon", query: "cyberpunk neon glitch sci-fi" },
    { label: "🎨 Concept illustration", query: "digital illustration concept art" },
    { label: "📐 3D procedural renders", query: "3d procedural render blender lighting" },
    { label: "💻 Tech & dev setups", query: "tech developer code web software" },
    { label: "😂 Relatable memes", query: "memes humor funny viral" },
  ];

  const handleSearch = async (overrideQuery) => {
    const activeQuery = (overrideQuery !== undefined ? overrideQuery : query).trim();
    if (!activeQuery) {
      setError("Please enter a concept, tag, or creator name");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearched(false);

    try {
      const res = await axios.get(
        `http://localhost:9000/ai/semantic-search?q=${encodeURIComponent(activeQuery)}`,
        { withCredentials: true }
      );

      if (res.data) {
        setSearchResults(res.data.posts || []);
        setMatchingCreators(res.data.creators || []);
      }
      setSearched(true);
    } catch (err) {
      console.error("Semantic search failed:", err);
      setError("Failed to complete semantic search. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleChipClick = (chipQuery) => {
    setQuery(chipQuery);
    handleSearch(chipQuery);
  };

  return (
    <div className={mode ? "dark-search-user-container" : "search-user-container"}>
      {/* Header */}
      <div className="search-header">
        <div className="semantic-pill-badge">
          <BsStars className="sparkle-icon" />
          <span>AI Semantic Discovery Engine</span>
        </div>
        <h2>Discover Creations by Meaning</h2>
        <p className="search-subtitle">
          Search by conceptual vibe, visual style, technical keywords, or creator handle
        </p>
      </div>

      {/* Semantic Search Input Bar */}
      <div className="search-form">
        <div className="input-search-wrapper">
          <FiSearch className="search-input-icon" />
          <input
            type="text"
            placeholder='Try "moody city photos", "neon anime cyber", or creator name...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          className="search-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="btn-spinner"></span>
              Embedding...
            </>
          ) : (
            <>
              <BsStars />
              Search
            </>
          )}
        </button>
      </div>

      {/* Quick Prompt Inspiration Chips */}
      <div className="semantic-chips-row">
        <span className="chips-label">Inspirations:</span>
        <div className="chips-scroll">
          {promptSuggestions.map((item, index) => (
            <button
              key={index}
              type="button"
              className="semantic-chip-btn"
              onClick={() => handleChipClick(item.query)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Computing semantic vector similarities across creations...</p>
        </div>
      )}

      {!isLoading && searched && (
        <div className="search-results-section">
          {/* Matching Creators Row (if any) */}
          {matchingCreators.length > 0 && (
            <div className="creators-results-box">
              <h3 className="section-title">
                <FiUser /> Matching Creators ({matchingCreators.length})
              </h3>
              <div className="creators-grid">
                {matchingCreators.map((creator) => (
                  <div key={creator._id} className="creator-search-card">
                    <img
                      src={
                        creator.profileImage ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.name}`
                      }
                      alt={creator.name}
                      className="creator-search-avatar"
                    />
                    <div className="creator-search-info">
                      <span className="creator-search-name">{creator.name}</span>
                      <span className="creator-search-tag">
                        {creator.lumiTag || `@${creator.name.toLowerCase().replace(/\s+/g, "")}`}
                      </span>
                      <span className="creator-role-tag">
                        {creator.creatorRole || "Creator"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Results */}
          <div className="posts-results-box">
            <h3 className="section-title">
              <FiCompass /> Matching Creations ({searchResults.length})
            </h3>

            {searchResults.length > 0 ? (
              <div className="posts-grid">
                {searchResults.map((post) => {
                  const imageUrl = post.file_url?.startsWith("/uploads")
                    ? `http://localhost:9000${post.file_url}`
                    : post.file_url;

                  return (
                    <div key={post._id} className="post-card">
                      <div className="post-image-container">
                        <img
                          src={imageUrl}
                          alt={post.file_name || "Luminix Post"}
                          className="post-image"
                        />
                        {post.matchScore !== undefined && (
                          <div className="semantic-match-score">
                            <BsStars />
                            <span>{post.matchScore}% Match</span>
                          </div>
                        )}
                        {post.process_steps && post.process_steps.length > 0 && (
                          <div className="post-process-badge">
                            <FiLayers /> WIP Strip
                          </div>
                        )}
                      </div>

                      <div className="post-footer">
                        <div className="post-author-row">
                          <span className="post-username">@{post.username}</span>
                          <span className="post-time">
                            {new Date(post.upload_time || post.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {post.caption && (
                          <p className="post-caption">{post.caption}</p>
                        )}

                        {post.tags && post.tags.length > 0 && (
                          <div className="post-tags-row">
                            {post.tags.slice(0, 4).map((t, idx) => (
                              <span key={idx} className="post-tag-item">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="post-stats-row">
                          <span className="stat-pill">
                            <FiHeart /> {post.likes || 0}
                          </span>
                          <span className="stat-pill">
                            <FiMessageCircle /> {post.comments ? post.comments.length : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <p>No creations matched the semantic concept "{query}"</p>
                <p style={{ fontSize: "14px", marginTop: "8px", opacity: 0.7 }}>
                  Try using broader aesthetic descriptors like "neon", "minimal", or "nature"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchUser;
