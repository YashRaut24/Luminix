import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { BsPaletteFill, BsStars } from "react-icons/bs";
import { FiSearch, FiPlus, FiArrowRight, FiCheck, FiSliders } from "react-icons/fi";
import "../styles/color_search.css";

const PRESET_SWATCHES = [
  { label: "Indigo Accent", hex: "#6366f1" },
  { label: "Emerald Green", hex: "#10b981" },
  { label: "Amber Gold", hex: "#f59e0b" },
  { label: "Ruby Crimson", hex: "#ef4444" },
  { label: "Neon Cyan", hex: "#06b6d4" },
  { label: "Hot Magenta", hex: "#ec4899" },
  { label: "Royal Violet", hex: "#8b5cf6" },
  { label: "Cobalt Blue", hex: "#344c98" },
  { label: "Deep Obsidian", hex: "#010102" },
  { label: "Crisp Off-White", hex: "#ffffff" },
];

function hexToRgb(hex) {
  if (!hex) return null;
  const clean = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export default function ColorSearch({ mode }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial hex from URL query ?hex=... or default to #6366f1
  const paramHex = searchParams.get("hex");
  const initialHex =
    paramHex && /^[0-9a-fA-F]{6}$/.test(paramHex.replace(/^#/, ""))
      ? (paramHex.startsWith("#") ? paramHex : `#${paramHex}`).toLowerCase()
      : "#6366f1";

  const [hexInput, setHexInput] = useState(initialHex);
  const [activeHex, setActiveHex] = useState(initialHex);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce ref for 300ms
  const debounceTimerRef = useRef(null);

  // Sync when URL query param changes externally
  useEffect(() => {
    if (paramHex) {
      const formatted = (paramHex.startsWith("#") ? paramHex : `#${paramHex}`).toLowerCase();
      if (/^#[0-9a-fA-F]{6}$/.test(formatted)) {
        setHexInput(formatted);
        setActiveHex(formatted);
      }
    }
  }, [paramHex]);

  // Debounced search trigger (300ms)
  useEffect(() => {
    const clean = hexInput.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
      if (hexInput.length >= 6) {
        setError("Please enter a valid 6-character hex code (e.g. #6366F1)");
      }
      return;
    }

    setError("");
    const formattedHex = `#${clean}`.toLowerCase();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setActiveHex(formattedHex);
      setSearchParams({ hex: clean }, { replace: true });
      executeSearch(formattedHex);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [hexInput]);

  const executeSearch = async (targetHex) => {
    const clean = targetHex.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `http://localhost:9000/posts/search/color?hex=${encodeURIComponent(clean)}`,
        { withCredentials: true }
      );

      if (res.data) {
        setResults(res.data.posts || []);
        setHasSearched(true);
      }
    } catch (err) {
      console.error("Color search failed:", err);
      if (err.response?.status === 400) {
        setError(err.response.data?.message || "Invalid 6-digit hex code.");
      } else {
        setError("Failed to execute color similarity search. Please try again.");
      }
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleColorPickerChange = (e) => {
    const newHex = e.target.value.toLowerCase();
    setHexInput(newHex);
  };

  const handleHexInputChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith("#") && val.length > 0) {
      val = `#${val}`;
    }
    setHexInput(val.toLowerCase());
  };

  const handleSelectPreset = (presetHex) => {
    const formatted = presetHex.toLowerCase();
    setHexInput(formatted);
  };

  const activeRgb = hexToRgb(activeHex) || { r: 99, g: 102, b: 241 };

  return (
    <div className={`color-search-page ${mode ? "dark-mode" : "light-mode"}`}>
      {/* Header Container */}
      <div className="color-search-header">
        <div className="color-search-badge font-mono">
          <BsPaletteFill className="color-search-badge-icon" />
          <span>NEAREST-NEIGHBOR PALETTE DISCOVERY</span>
        </div>
        <h1 className="color-search-title">Discover Creations by Dominant Color</h1>
        <p className="color-search-desc">
          Scan posts in RGB Euclidean space based on their 5 dominant color clusters. Match
          percentage represents distance proximity within threshold (dist ≤ 80).
        </p>

        {/* Navigation Switcher Tabs */}
        <div className="color-search-nav-tabs">
          <button
            type="button"
            className="color-nav-tab is-active font-mono"
            onClick={() => {}}
          >
            <BsPaletteFill /> PALETTE COLOR SEARCH
          </button>
          <button
            type="button"
            className="color-nav-tab font-mono"
            onClick={() => navigate("/feed/search")}
          >
            <BsStars /> SEMANTIC VIBE SEARCH
          </button>
        </div>
      </div>

      {/* Control Console */}
      <div className="color-search-controls-card">
        <div className="color-controls-top-row">
          {/* Native Color Picker Driver */}
          <div className="color-picker-wrapper" title="Click to choose a color">
            <input
              type="color"
              value={activeHex}
              onChange={handleColorPickerChange}
              className="color-picker-input"
              aria-label="Color Picker"
            />
            <span
              className="color-picker-swatch"
              style={{ backgroundColor: activeHex }}
            />
          </div>

          {/* Hex Input Box */}
          <div className="color-hex-field-box">
            <label className="color-field-label font-mono">TARGET HEX</label>
            <input
              type="text"
              value={hexInput}
              onChange={handleHexInputChange}
              placeholder="#6366f1"
              maxLength={7}
              className="color-hex-text-input font-mono"
              aria-label="6-digit hex code"
            />
          </div>

          {/* Metric Telemetry Box */}
          <div className="color-telemetry-box font-mono">
            <div className="telemetry-line">
              <span className="telemetry-key">RGB:</span>
              <span className="telemetry-val">
                {activeRgb.r}, {activeRgb.g}, {activeRgb.b}
              </span>
            </div>
            <div className="telemetry-line">
              <span className="telemetry-key">LIMIT:</span>
              <span className="telemetry-val">dist ≤ 80 (441 max)</span>
            </div>
            <div className="telemetry-line">
              <span className="telemetry-key">MATCH FORMULA:</span>
              <span className="telemetry-val">100 × (1 - d / 160)</span>
            </div>
          </div>
        </div>

        {error && <div className="color-search-error-msg font-mono">{error}</div>}

        {/* Curated Preset Swatches */}
        <div className="color-presets-row">
          <span className="color-presets-label font-mono">CURATED SWATCHES:</span>
          <div className="color-presets-list">
            {PRESET_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                className={`color-preset-pill font-mono ${
                  activeHex.toLowerCase() === swatch.hex.toLowerCase()
                    ? "is-active"
                    : ""
                }`}
                onClick={() => handleSelectPreset(swatch.hex)}
                title={`${swatch.label} (${swatch.hex})`}
              >
                <span
                  className="color-preset-swatch-dot"
                  style={{ backgroundColor: swatch.hex }}
                />
                <span>{swatch.hex.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header Status */}
      <div className="color-results-bar">
        <div className="color-results-bar-left font-mono">
          <span className="results-indicator-dot" style={{ backgroundColor: activeHex }} />
          <span>
            {loading
              ? "COMPUTING NEAREST NEIGHBORS..."
              : `MATCHING FRAMES FOR ${activeHex.toUpperCase()} (${results.length})`}
          </span>
        </div>
        {results.length > 0 && (
          <span className="color-results-sort-badge font-mono">
            SORTED BY NEAREST EUCLIDEAN PROXIMITY
          </span>
        )}
      </div>

      {/* Results Container */}
      {loading ? (
        <div className="color-loading-container font-mono">
          <div className="color-spinner" />
          <span>Scanning newest 500 post dominant color clusters...</span>
        </div>
      ) : results.length > 0 ? (
        <div className="color-results-grid">
          {results.map((post) => (
            <div key={post._id} className="color-result-card">
              {/* Card Image */}
              <div
                className="color-card-image-wrap"
                onClick={() => navigate("/feed")}
                title="View frame on contact sheet"
              >
                <img
                  src={`http://localhost:9000${post.file_url}`}
                  alt={post.alt_text || post.caption || "Palette artwork"}
                  loading="lazy"
                />
                {/* Match % Overlay Tag */}
                <div className="color-match-tag font-mono">
                  <span className="match-percent">{post.matchPercentage}% MATCH</span>
                  <span className="match-distance">Δ {post.score}</span>
                </div>
              </div>

              {/* Card Meta */}
              <div className="color-card-body">
                <div className="color-card-author-row">
                  <span className="color-card-creator font-mono">
                    @{post.username || "creator"}
                  </span>
                  <span className="color-card-date font-mono">
                    {new Date(post.createdAt || post.upload_time).toLocaleDateString()}
                  </span>
                </div>

                {post.caption && (
                  <p className="color-card-caption">
                    {post.caption.length > 70
                      ? `${post.caption.slice(0, 70)}...`
                      : post.caption}
                  </p>
                )}

                {/* 5 Dominant Palette Swatches Row */}
                <div className="color-card-palette-strip">
                  <span className="color-card-palette-label font-mono">PALETTE:</span>
                  <div className="color-card-swatches">
                    {(post.palette || []).map((hex, idx) => {
                      const isClosest =
                        post.matchedColor &&
                        post.matchedColor.toLowerCase() === hex.toLowerCase();

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`color-card-swatch-item ${
                            isClosest ? "is-closest-match" : ""
                          }`}
                          style={{ backgroundColor: hex }}
                          onClick={() => handleSelectPreset(hex)}
                          title={`Click to search by ${hex.toUpperCase()}${
                            isClosest ? " (Nearest match)" : ""
                          }`}
                        >
                          {isClosest && <span className="closest-pin-mark font-mono">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched ? (
        /* Empty State */
        <div className="color-empty-state">
          <div className="color-empty-swatch-visual" style={{ backgroundColor: activeHex }}>
            <BsPaletteFill className="color-empty-icon" />
          </div>
          <h3 className="color-empty-title">No artworks match this color threshold</h3>
          <p className="color-empty-subtitle">
            No frames in the newest 500 posts have a dominant color within RGB Euclidean distance
            ≤ 80 from <strong>{activeHex.toUpperCase()}</strong>.
          </p>
          <div className="color-empty-action-group">
            <button
              type="button"
              className="color-create-post-btn font-mono"
              onClick={() => navigate("/feed/create")}
            >
              <FiPlus /> CREATE POST WITH THIS COLOR
            </button>
            <button
              type="button"
              className="color-reset-preset-btn font-mono"
              onClick={() => handleSelectPreset("#6366f1")}
            >
              TRY ACCENT (#6366F1)
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
