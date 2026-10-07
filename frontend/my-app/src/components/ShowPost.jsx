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
  FiGrid
} from "react-icons/fi";
import { BsStars } from "react-icons/bs";

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

  // Category filter
  const filteredPosts = posts.filter((post) => {
    if (!selectedCategory || selectedCategory === "All" || selectedCategory === "Your feed") {
      return true;
    }
    const cat = selectedCategory.toLowerCase();
    const matchesTag = post.tags && post.tags.some((t) => t.toLowerCase().includes(cat));
    const matchesCaption = post.caption && post.caption.toLowerCase().includes(cat);
    return matchesTag || matchesCaption;
  });

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
              NO FRAMES RECORDED IN THIS SELECTION
            </p>
            <button
              type="button"
              className="darkroom-bar__action darkroom-bar__action--primary"
              onClick={() => navigate("/feed/create")}
            >
              <FiPlus /> DEVELOP FIRST FRAME
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

            {/* TAB: REMIX TREE */}
            {inspectorTab === "remix" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-2)", fontWeight: "600" }}>
                  LINEAGE & DERIVATIVES
                </span>
                {selectedPost.remix_of ? (
                  <div
                    style={{
                      border: "1px solid var(--rule)",
                      borderRadius: "var(--radius-xs)",
                      padding: "10px",
                      backgroundColor: "var(--surface-2)",
                    }}
                  >
                    <span className="font-mono" style={{ fontSize: "10px", color: "var(--accent)" }}>
                      ORIGINAL INSPIRATION
                    </span>
                    <p style={{ fontSize: "12px", color: "var(--text)", marginTop: "4px" }}>
                      Remixed from @{selectedPost.remix_of.username || "creator"}
                    </p>
                    {selectedPost.remix_of.caption && (
                      <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
                        "{selectedPost.remix_of.caption}"
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                    This piece is a root original creation.
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
