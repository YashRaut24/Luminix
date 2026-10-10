import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PostCard from "./PostCard";
import FlashStoriesBar from "./FlashStoriesBar";
import OnboardingModal from "./OnboardingModal";
import ThreadedComments from "./ThreadedComments";
import {
  FiClock,
  FiPlus,
  FiX,
  FiLayers,
  FiRepeat,
  FiBookmark,
  FiFileText,
  FiGrid,
  FiSliders,
  FiCompass
} from "react-icons/fi";
import { BsStars } from "react-icons/bs";

function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function colorDistance(hex1, hex2) {
  try {
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  } catch (e) {
    return 999;
  }
}

function ShowPost({ mode, refreshTrigger, feedHeading, selectedCategory, user }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState("for-you"); // "for-you" | "recent"
  const [isDense, setIsDense] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostPins, setSelectedPostPins] = useState([]);
  const [inspectorTab, setInspectorTab] = useState("notes"); // "process" | "remix" | "notes" | "boards"
  const [trayCollapsed, setTrayCollapsed] = useState(false);
  const [traySlots, setTraySlots] = useState([null, null, null, null, null, null]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Discovery Suite States: Palette Search, Mood Dial, Tool Filter, On This Day
  const [colorFilter, setColorFilter] = useState(null);
  const [toolFilter, setToolFilter] = useState("All");
  const [showPalettePopover, setShowPalettePopover] = useState(false);
  const [showMoodDialPopover, setShowMoodDialPopover] = useState(false);
  const [moodCalm, setMoodCalm] = useState(50);
  const [moodMinimal, setMoodMinimal] = useState(50);
  const [isMoodActive, setIsMoodActive] = useState(false);
  const [onThisDayPost, setOnThisDayPost] = useState(null);
  const [onThisDayMilestone, setOnThisDayMilestone] = useState("ON THIS DAY");
  const [dismissOnThisDay, setDismissOnThisDay] = useState(false);
  const [customHexInput, setCustomHexInput] = useState("");

  const presetFilterColors = [
    "#6366f1", // Indigo Accent
    "#ef4444", // Ruby
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#8b5cf6", // Violet
    "#14b8a6", // Teal
    "#3b82f6", // Blue
    "#f8fafc", // White
    "#090c10"  // Dark Obsidian
  ];

  const availableToolsList = [
    "All",
    "Figma",
    "Blender",
    "Procreate",
    "Photoshop",
    "Cinema 4D",
    "After Effects",
    "Illustrator",
    "Unity",
    "Unreal Engine",
    "Spline",
    "TouchDesigner",
    "Midjourney"
  ];

  // Fetch On-This-Day historical post
  useEffect(() => {
    if (user) {
      axios
        .get("http://localhost:9000/posts/on-this-day", { withCredentials: true })
        .then((res) => {
          if (res.data?.post) {
            setOnThisDayPost(res.data.post);
            setOnThisDayMilestone(res.data.milestoneLabel || "ON THIS DAY");
          }
        })
        .catch((err) => console.log("On-this-day fetch note:", err.message));
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const endpoint =
        feedMode === "for-you"
          ? "http://localhost:9000/posts/for-you"
          : "http://localhost:9000/posts";

      const res = await axios.get(endpoint, {
        withCredentials: true,
      });

      const fetched = res.data.posts || [];
      setPosts(fetched);
      if (fetched.length > 0 && !selectedPost) {
        setSelectedPost(fetched[0]);
        setSelectedPostPins(fetched[0].pins || []);
      }
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshTrigger, feedMode]);

  // Combined Filters & Mood Dial Ranking
  let filteredPosts = posts.filter((post) => {
    // 1. Category filter
    if (selectedCategory && selectedCategory !== "All" && selectedCategory !== "Your feed") {
      const cat = selectedCategory.toLowerCase();
      const matchesTag = post.tags && post.tags.some((t) => t.toLowerCase().includes(cat));
      const matchesCaption = post.caption && post.caption.toLowerCase().includes(cat);
      if (!matchesTag && !matchesCaption) return false;
    }

    // 2. Tool tags filter
    if (toolFilter && toolFilter !== "All") {
      if (!post.tools || !post.tools.some((t) => t.toLowerCase() === toolFilter.toLowerCase())) {
        return false;
      }
    }

    // 3. Dominant Color Palette filter
    if (colorFilter) {
      if (!post.palette || post.palette.length === 0) return false;
      const match = post.palette.some((c) => colorDistance(c, colorFilter) <= 85);
      if (!match) return false;
    }

    return true;
  });

  // 4. Mood Dial re-ranking (Closest Euclidean distance to chosen calm & minimal coordinates)
  if (isMoodActive) {
    filteredPosts = [...filteredPosts].sort((a, b) => {
      const aDist = Math.hypot(
        (a.mood_calm_energetic ?? 50) - moodCalm,
        (a.mood_minimal_detailed ?? 50) - moodMinimal
      );
      const bDist = Math.hypot(
        (b.mood_calm_energetic ?? 50) - moodCalm,
        (b.mood_minimal_detailed ?? 50) - moodMinimal
      );
      return aDist - bDist;
    });
  }

  const handleFrameSelect = (post, pins = []) => {
    setSelectedPost(post);
    setSelectedPostPins(pins || post.pins || []);
  };

  const handleSlotDrop = (e, slotIndex) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const frameData = JSON.parse(dataStr);
      setTraySlots((prev) => {
        const next = [...prev];
        next[slotIndex] = frameData;
        return next;
      });
    } catch (err) {
      console.error("Drop frame error:", err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="darkroom-feed-layout">
      {/* Center Contact Sheet Column */}
      <main className="darkroom-sheet-column">
        {/* Flash Stories Bar */}
        <FlashStoriesBar user={user} mode={mode} />

        {/* Workspace Bar */}
        <div className="darkroom-bar">
          <div className="darkroom-bar__left">
            <span className="darkroom-bar__meta font-mono">
              SHEET: {filteredPosts.length} FRAMES
            </span>

            {/* Segmented Control */}
            <div className="darkroom-segmented">
              <button
                type="button"
                className={`darkroom-segmented__btn ${feedMode === "for-you" ? "is-active" : ""}`}
                onClick={() => setFeedMode("for-you")}
              >
                FOR YOU
              </button>
              <button
                type="button"
                className={`darkroom-segmented__btn ${feedMode === "recent" ? "is-active" : ""}`}
                onClick={() => setFeedMode("recent")}
              >
                RECENT
              </button>
            </div>

            {feedMode === "for-you" && (
              <button
                type="button"
                className="darkroom-bar__action"
                onClick={() => setShowOnboarding(true)}
              >
                <BsStars /> TUNE
              </button>
            )}

            {/* Discovery Suite Tool Toggles */}
            <div className="discovery-tools-bar">
              {/* Palette Search Toggle */}
              <button
                type="button"
                className={`discovery-tool-btn font-mono ${showPalettePopover || colorFilter ? "is-active" : ""}`}
                onClick={() => {
                  setShowPalettePopover(!showPalettePopover);
                  setShowMoodDialPopover(false);
                }}
                title="Search and filter by 5 dominant colors"
              >
                <FiSliders />
                {colorFilter ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span className="chip-swatch" style={{ backgroundColor: colorFilter }} />
                    {colorFilter.toUpperCase()}
                  </span>
                ) : (
                  "PALETTE"
                )}
              </button>

              {/* Mood Dial Toggle */}
              <button
                type="button"
                className={`discovery-tool-btn font-mono ${showMoodDialPopover || isMoodActive ? "is-active" : ""}`}
                onClick={() => {
                  setShowMoodDialPopover(!showMoodDialPopover);
                  setShowPalettePopover(false);
                }}
                title="Two-slider mood dial: Calm ↔ Energetic, Minimal ↔ Detailed"
              >
                <FiCompass />
                {isMoodActive ? "MOOD ON" : "MOOD DIAL"}
              </button>

              {/* Tool Tag Filter */}
              <select
                className="discovery-tool-select font-mono"
                value={toolFilter}
                onChange={(e) => setToolFilter(e.target.value)}
                title="Filter feed by creator tool used"
              >
                {availableToolsList.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool === "All" ? "TOOL: ALL" : `TOOL: ${tool.toUpperCase()}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="darkroom-bar__right">
            <button
              type="button"
              className={`darkroom-bar__action ${isDense ? "is-active" : ""}`}
              onClick={() => setIsDense(!isDense)}
              title="Toggle Grid Density"
            >
              <FiGrid /> {isDense ? "COMFORT" : "DENSE"}
            </button>

            <button
              type="button"
              className="darkroom-bar__action darkroom-bar__action--primary"
              onClick={() => navigate("/feed/create")}
            >
              <FiPlus /> NEW FRAME
            </button>
          </div>
        </div>

        {/* Discovery 1. Palette Search Popover Panel */}
        {showPalettePopover && (
          <div className="discovery-palette-panel">
            <div className="palette-panel-header font-mono">
              <span>[PALETTE SEARCH // DOMINANT SWATCHES]</span>
              <span style={{ fontSize: "10px", color: "var(--text-3)" }}>
                CLICK SWATCH OR ENTER HEX CODE
              </span>
            </div>

            <div className="palette-swatches-row">
              {presetFilterColors.map((hex) => (
                <div
                  key={hex}
                  className={`palette-swatch-item ${colorFilter === hex ? "is-selected" : ""}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setColorFilter(colorFilter === hex ? null : hex)}
                  title={`Filter by ${hex}`}
                />
              ))}

              <div className="palette-custom-input-box">
                <input
                  type="color"
                  className="palette-color-picker"
                  value={colorFilter || "#6366f1"}
                  onChange={(e) => setColorFilter(e.target.value)}
                  title="Pick custom color"
                />
                <input
                  type="text"
                  placeholder="#hex"
                  value={customHexInput}
                  onChange={(e) => setCustomHexInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customHexInput.trim()) {
                      const hex = customHexInput.startsWith("#") ? customHexInput : `#${customHexInput}`;
                      setColorFilter(hex);
                    }
                  }}
                  className="palette-hex-text-input font-mono"
                />
                <button
                  type="button"
                  className="discovery-tool-btn font-mono"
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  onClick={() => {
                    if (customHexInput.trim()) {
                      const hex = customHexInput.startsWith("#") ? customHexInput : `#${customHexInput}`;
                      setColorFilter(hex);
                    }
                  }}
                >
                  APPLY
                </button>
                {colorFilter && (
                  <button
                    type="button"
                    className="discovery-tool-btn font-mono"
                    style={{ fontSize: "10px", padding: "4px 8px" }}
                    onClick={() => {
                      setColorFilter(null);
                      setCustomHexInput("");
                    }}
                  >
                    RESET
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Discovery 2. Mood Dial Popover Panel */}
        {showMoodDialPopover && (
          <div className="discovery-mood-panel">
            <div className="mood-panel-top font-mono">
              <span>[MOOD DIAL // RE-RANK FEED ENGINE]</span>
              <span className="mood-slider-active-val">
                {isMoodActive ? "● RE-RANKING ACTIVE" : "○ INACTIVE (DEFAULT CHRONO)"}
              </span>
            </div>

            <div className="mood-sliders-grid">
              {/* Slider 1: Calm ↔ Energetic */}
              <div className="mood-slider-group">
                <div className="mood-slider-labels font-mono">
                  <span>CALM (0%)</span>
                  <span className="mood-slider-active-val">{moodCalm}%</span>
                  <span>ENERGETIC (100%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={moodCalm}
                  onChange={(e) => {
                    setMoodCalm(Number(e.target.value));
                    setIsMoodActive(true);
                  }}
                  className="mood-range-input"
                />
              </div>

              {/* Slider 2: Minimal ↔ Detailed */}
              <div className="mood-slider-group">
                <div className="mood-slider-labels font-mono">
                  <span>MINIMAL (0%)</span>
                  <span className="mood-slider-active-val">{moodMinimal}%</span>
                  <span>DETAILED (100%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={moodMinimal}
                  onChange={(e) => {
                    setMoodMinimal(Number(e.target.value));
                    setIsMoodActive(true);
                  }}
                  className="mood-range-input"
                />
              </div>
            </div>

            <div className="mood-panel-footer">
              <div className="mood-presets-row font-mono">
                <span style={{ fontSize: "10px", color: "var(--text-3)" }}>PRESETS:</span>
                {[
                  { label: "Zen Minimal", c: 15, m: 10 },
                  { label: "Cyber Kinetic", c: 85, m: 80 },
                  { label: "Moody Ambient", c: 25, m: 50 },
                  { label: "Hyper Detailed", c: 70, m: 95 }
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="mood-preset-btn font-mono"
                    onClick={() => {
                      setMoodCalm(p.c);
                      setMoodMinimal(p.m);
                      setIsMoodActive(true);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="mood-action-btns">
                <button
                  type="button"
                  className="mood-toggle-apply font-mono"
                  onClick={() => setIsMoodActive(!isMoodActive)}
                >
                  {isMoodActive ? "DISABLE MOOD RANKING" : "APPLY MOOD RANKING"}
                </button>
                <button
                  type="button"
                  className="mood-toggle-reset font-mono"
                  onClick={() => {
                    setMoodCalm(50);
                    setMoodMinimal(50);
                    setIsMoodActive(false);
                  }}
                >
                  RESET
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Discovery Filter Badges Row */}
        {(colorFilter || toolFilter !== "All" || isMoodActive) && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
            <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
              ACTIVE DISCOVERY FILTERS:
            </span>

            {colorFilter && (
              <span className="active-filter-chip font-mono">
                <span className="chip-swatch" style={{ backgroundColor: colorFilter }} />
                COLOR: {colorFilter.toUpperCase()}
                <button type="button" className="chip-clear-btn" onClick={() => setColorFilter(null)}>
                  ✕
                </button>
              </span>
            )}

            {toolFilter !== "All" && (
              <span className="active-filter-chip font-mono">
                TOOL: {toolFilter.toUpperCase()}
                <button type="button" className="chip-clear-btn" onClick={() => setToolFilter("All")}>
                  ✕
                </button>
              </span>
            )}

            {isMoodActive && (
              <span className="active-filter-chip font-mono">
                MOOD: {moodCalm}% CALM / {moodMinimal}% DETAIL
                <button type="button" className="chip-clear-btn" onClick={() => setIsMoodActive(false)}>
                  ✕
                </button>
              </span>
            )}
          </div>
        )}

        {/* Discovery 4. On This Day: Resurface Historical Work with Remix Prompt */}
        {onThisDayPost && !dismissOnThisDay && (
          <div className="darkroom-on-this-day-banner">
            <div className="on-this-day-left">
              <img
                src={`http://localhost:9000${onThisDayPost.file_url}`}
                alt={onThisDayPost.caption}
                className="on-this-day-thumb"
              />
              <div className="on-this-day-meta">
                <span className="on-this-day-badge font-mono">
                  [ON THIS DAY // {onThisDayMilestone}]
                </span>
                <span className="on-this-day-title">
                  {onThisDayPost.caption || "Untitled Masterpiece"}
                </span>
                <span className="on-this-day-sub font-mono">
                  Created on {new Date(onThisDayPost.createdAt).toLocaleDateString()} • Resurfaced from your archive
                </span>
              </div>
            </div>

            <div className="on-this-day-right">
              <button
                type="button"
                className="on-this-day-btn-remix font-mono"
                onClick={() =>
                  navigate("/feed/create", {
                    state: {
                      remixPost: {
                        _id: onThisDayPost._id,
                        username: onThisDayPost.username,
                        caption: onThisDayPost.caption,
                        file_url: onThisDayPost.file_url,
                        tags: onThisDayPost.tags,
                      },
                    },
                  })
                }
              >
                <FiRepeat /> REMIX & REVISIT
              </button>
              <button
                type="button"
                className="on-this-day-btn-dismiss font-mono"
                onClick={() => setDismissOnThisDay(true)}
                title="Dismiss milestone"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Contact Sheet Grid */}
        {loading ? (
          <div className={`contact-sheet ${isDense ? "contact-sheet--dense" : ""}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="darkroom-frame"
                style={{ height: "220px", opacity: 0.5 }}
              >
                <div className="darkroom-frame__header">
                  <span className="darkroom-frame__index font-mono">LOADING</span>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p className="font-mono" style={{ color: "var(--text-3)", marginBottom: "16px" }}>
              NO FRAMES MATCHING CURRENT DISCOVERY CRITERIA
            </p>
            <button
              type="button"
              className="darkroom-bar__action darkroom-bar__action--primary"
              onClick={() => {
                setColorFilter(null);
                setToolFilter("All");
                setIsMoodActive(false);
              }}
            >
              RESET ALL DISCOVERY FILTERS
            </button>
          </div>
        ) : (
          <div className={`contact-sheet ${isDense ? "contact-sheet--dense" : ""}`}>
            {filteredPosts.map((post, index) => (
              <PostCard
                key={post._id}
                post={post}
                index={index}
                isSelected={selectedPost?._id === post._id}
                onSelect={(p, pins) => handleFrameSelect(p, pins)}
                onSelectColor={(hex) => setColorFilter(hex)}
                onAddPin={(postId, newPin) => {
                  if (selectedPost?._id === postId) {
                    setSelectedPostPins((prev) => [...prev, newPin]);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* 4. Collapsible Bottom Tray */}
        <div className={`darkroom-tray ${trayCollapsed ? "is-collapsed" : ""}`}>
          <button
            type="button"
            className="darkroom-tray__handle"
            onClick={() => setTrayCollapsed(!trayCollapsed)}
          >
            {trayCollapsed ? "▲ EXPAND TRAY" : "▼ COLLAPSE TRAY"}
          </button>
          <span className="darkroom-tray__label">FILMSTRIP TRAY</span>
          <div className="darkroom-tray__slots">
            {traySlots.map((item, idx) => (
              <div
                key={idx}
                className={`darkroom-tray__slot ${item ? "has-item" : ""}`}
                onDrop={(e) => handleSlotDrop(e, idx)}
                onDragOver={handleDragOver}
                title={item ? `${item.caption || "Frame"} (Click to Inspect)` : `Drop frame here into Slot #${idx + 1}`}
                onClick={() => {
                  if (item) {
                    const match = posts.find((p) => p._id === item.postId);
                    if (match) setSelectedPost(match);
                  }
                }}
              >
                {item ? (
                  <img
                    src={`http://localhost:9000${item.file_url}`}
                    alt="Slot"
                  />
                ) : (
                  <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
                    #{idx + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 3. Right Inspector (380px fixed width, slide-in) */}
      {selectedPost && (
        <aside className="darkroom-inspector">
          <div className="darkroom-inspector__header">
            <span>INSPECTOR: @{selectedPost.username}</span>
            <button
              type="button"
              className="darkroom-inspector__close"
              onClick={() => setSelectedPost(null)}
              title="Close Inspector"
            >
              <FiX />
            </button>
          </div>

          <div className="darkroom-inspector__tabs">
            <button
              type="button"
              className={`darkroom-inspector__tab ${inspectorTab === "notes" ? "is-active" : ""}`}
              onClick={() => setInspectorTab("notes")}
            >
              <FiFileText style={{ marginRight: "4px" }} /> NOTES
            </button>
            <button
              type="button"
              className={`darkroom-inspector__tab ${inspectorTab === "process" ? "is-active" : ""}`}
              onClick={() => setInspectorTab("process")}
            >
              <FiLayers style={{ marginRight: "4px" }} /> PROCESS
            </button>
            <button
              type="button"
              className={`darkroom-inspector__tab ${inspectorTab === "remix" ? "is-active" : ""}`}
              onClick={() => setInspectorTab("remix")}
            >
              <FiRepeat style={{ marginRight: "4px" }} /> REMIX
            </button>
            <button
              type="button"
              className={`darkroom-inspector__tab ${inspectorTab === "boards" ? "is-active" : ""}`}
              onClick={() => setInspectorTab("boards")}
            >
              <FiBookmark style={{ marginRight: "4px" }} /> BOARDS
            </button>
          </div>

          <div className="darkroom-inspector__body">
            {/* Frame Overview */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4 / 3",
                  backgroundColor: "var(--frame-bg)",
                  border: "1px solid var(--rule)",
                  borderRadius: "var(--radius-xs)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={`http://localhost:9000${selectedPost.file_url}`}
                  alt={selectedPost.caption}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <p style={{ fontSize: "13px", lineHeight: "1.4", color: "var(--text)" }}>
                {selectedPost.caption}
              </p>
              <div className="font-mono" style={{ fontSize: "11px", color: "var(--text-3)" }}>
                TIMESTAMP: {new Date(selectedPost.upload_time).toLocaleString()}
              </div>

              {/* Discovery: Tool Tags "Made with" line */}
              {selectedPost.tools && selectedPost.tools.length > 0 && (
                <div className="inspector-tools-box">
                  <span className="inspector-tools-label font-mono">MADE WITH:</span>
                  <div className="inspector-tools-chips">
                    {selectedPost.tools.map((t, idx) => (
                      <span key={idx} className="inspector-tool-chip font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Discovery: 5 Dominant Color Swatches */}
              {selectedPost.palette && selectedPost.palette.length > 0 && (
                <div className="inspector-palette-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="inspector-tools-label font-mono">DOMINANT PALETTE:</span>
                    <span className="font-mono" style={{ fontSize: "9px", color: "var(--text-3)" }}>
                      CLICK SWATCH TO FILTER
                    </span>
                  </div>
                  <div className="inspector-palette-swatches">
                    {selectedPost.palette.slice(0, 5).map((hex, idx) => (
                      <div
                        key={idx}
                        className="inspector-palette-item font-mono"
                        style={{ backgroundColor: hex }}
                        onClick={() => setColorFilter(hex)}
                        title={`Filter feed by color ${hex}`}
                      >
                        {hex}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TAB: NOTES (Numbered Pins) */}
            {inspectorTab === "notes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)", fontWeight: "600" }}>
                  PIN NOTES ({selectedPostPins.length})
                </span>
                <p style={{ fontSize: "12px", color: "var(--text-3)", lineHeight: "1.4" }}>
                  Tip: Hold <strong>Alt</strong> (or <strong>Shift</strong>) and click anywhere on the frame image to place a numbered pin.
                </p>
                {selectedPostPins.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      border: "1px dashed var(--rule)",
                      borderRadius: "var(--radius-xs)",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "var(--text-3)",
                    }}
                  >
                    No pins placed on this frame yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {selectedPostPins.map((pin, i) => (
                      <div
                        key={pin.id || i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 10px",
                          backgroundColor: "var(--surface-2)",
                          border: "1px solid var(--rule)",
                          borderRadius: "var(--radius-xs)",
                          fontSize: "12px",
                        }}
                      >
                        <span
                          className="font-mono"
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            backgroundColor: "var(--pin-bg)",
                            color: "var(--pin-text)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "700",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span style={{ flex: 1, color: "var(--text)" }}>
                          {pin.note || `Note #${i + 1}`}
                        </span>
                        <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
                          ({pin.x}%, {pin.y}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Threaded comments inside inspector notes */}
                <div style={{ marginTop: "12px" }}>
                  <ThreadedComments
                    postId={selectedPost._id}
                    initialComments={selectedPost.comments || []}
                    currentUser={user}
                    mode={mode}
                  />
                </div>
              </div>
            )}

            {/* TAB: PROCESS */}
            {inspectorTab === "process" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)", fontWeight: "600" }}>
                  MAKING-OF PHASES
                </span>
                {selectedPost.process_steps && selectedPost.process_steps.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {selectedPost.process_steps.map((step, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: "1px solid var(--rule)",
                          borderRadius: "var(--radius-xs)",
                          overflow: "hidden",
                          backgroundColor: "var(--surface-2)",
                        }}
                      >
                        <div style={{ height: "160px", backgroundColor: "var(--frame-bg)" }}>
                          <img
                            src={`http://localhost:9000${step.file_url}`}
                            alt={step.phase_label}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        </div>
                        <div style={{ padding: "8px 10px" }}>
                          <span className="font-mono" style={{ fontSize: "10px", color: "var(--accent)" }}>
                            STAGE {idx + 1}
                          </span>
                          <h5 style={{ fontSize: "12px", color: "var(--text)", margin: "2px 0" }}>
                            {step.phase_label}
                          </h5>
                          {step.caption && (
                            <p style={{ fontSize: "11px", color: "var(--text-2)" }}>
                              {step.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                    No intermediate WIP phases uploaded for this frame.
                  </p>
                )}
              </div>
            )}

            {/* TAB: REMIX & PROVENANCE TREE */}
            {inspectorTab === "remix" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)", fontWeight: "600" }}>
                  PROVENANCE CHAIN & ATTRIBUTION
                </span>

                {/* Interactive Attribution Tree */}
                {selectedPost.inspired_by || selectedPost.remix_of || (selectedPost.provenance_chain && selectedPost.provenance_chain.length > 0) ? (
                  <div className="inspector-provenance-chain">
                    <span className="inspector-tools-label font-mono" style={{ color: "var(--accent)" }}>
                      LINEAGE // RESPECTFUL ATTRIBUTION:
                    </span>

                    {/* 1. Ancestors / Root in chain */}
                    {selectedPost.provenance_chain && selectedPost.provenance_chain.map((anc, aIdx) => (
                      <React.Fragment key={anc._id || aIdx}>
                        <div
                          className="provenance-tree-step"
                          onClick={() => setSelectedPost(anc)}
                          title="Click to inspect ancestor proof in Darkroom"
                        >
                          <img
                            src={`http://localhost:9000${anc.file_url}`}
                            alt={anc.caption}
                            className="provenance-step-thumb"
                          />
                          <div className="provenance-step-info">
                            <span className="provenance-step-label font-mono">
                              {aIdx === 0 ? "ROOT ORIGINAL WORK" : `LINEAGE PROOF #${aIdx + 1}`}
                            </span>
                            <span className="provenance-step-author font-mono">@{anc.username || "creator"}</span>
                            <span className="provenance-step-caption">{anc.caption || "Untitled Work"}</span>
                          </div>
                        </div>
                        <div className="provenance-chain-arrow font-mono">↓</div>
                      </React.Fragment>
                    ))}

                    {/* 2. Direct Inspired By / Remix Parent */}
                    {(selectedPost.inspired_by || selectedPost.remix_of) &&
                      (!selectedPost.provenance_chain ||
                        !selectedPost.provenance_chain.some(
                          (p) => p._id === (selectedPost.inspired_by?._id || selectedPost.remix_of?._id)
                        )) && (
                        <>
                          {(() => {
                            const parent = selectedPost.inspired_by || selectedPost.remix_of;
                            return (
                              <div
                                className="provenance-tree-step"
                                onClick={() => setSelectedPost(parent)}
                                title="Click to inspect inspiration source"
                              >
                                <img
                                  src={`http://localhost:9000${parent.file_url}`}
                                  alt={parent.caption}
                                  className="provenance-step-thumb"
                                />
                                <div className="provenance-step-info">
                                  <span className="provenance-step-label font-mono">
                                    DIRECT INSPIRATION SOURCE
                                  </span>
                                  <span className="provenance-step-author font-mono">
                                    @{parent.username || "creator"}
                                  </span>
                                  <span className="provenance-step-caption">
                                    "{parent.caption || "Original Inspiration"}"
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                          <div className="provenance-chain-arrow font-mono">↓</div>
                        </>
                      )}

                    {/* 3. Current Proof */}
                    <div className="provenance-tree-step" style={{ borderColor: "var(--accent)" }}>
                      <img
                        src={`http://localhost:9000${selectedPost.file_url}`}
                        alt={selectedPost.caption}
                        className="provenance-step-thumb"
                      />
                      <div className="provenance-step-info">
                        <span className="provenance-step-label font-mono" style={{ color: "var(--accent)" }}>
                          CURRENT PROOF (THIS WORK)
                        </span>
                        <span className="provenance-step-author font-mono">@{selectedPost.username}</span>
                        <span className="provenance-step-caption">{selectedPost.caption || "Current Proof"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                    This frame is a root original creation with no upstream derivative chain.
                  </p>
                )}

                <button
                  type="button"
                  className="darkroom-bar__action darkroom-bar__action--primary"
                  style={{ alignSelf: "flex-start", marginTop: "8px" }}
                  onClick={() =>
                    navigate("/feed/create", {
                      state: {
                        remixPost: {
                          _id: selectedPost._id,
                          username: selectedPost.username,
                          caption: selectedPost.caption,
                          file_url: selectedPost.file_url,
                          tags: selectedPost.tags,
                        },
                      },
                    })
                  }
                >
                  <FiRepeat /> REMIX THIS FRAME
                </button>
              </div>
            )}

            {/* TAB: BOARDS */}
            {inspectorTab === "boards" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)", fontWeight: "600" }}>
                  SAVE TO MOODBOARD
                </span>
                <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                  Drag this frame onto the filmstrip tray below or add directly into your collection boards.
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["Inspirations", "Color Palettes", "Typography", "Archived"].map((board, i) => (
                    <button
                      key={i}
                      type="button"
                      className="darkroom-bar__action"
                      onClick={() => alert(`Saved frame to board: ${board}`)}
                    >
                      <FiBookmark /> {board}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Onboarding Interest Setup Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => fetchPosts()}
        mode={mode}
      />
    </div>
  );
}

export default ShowPost;
