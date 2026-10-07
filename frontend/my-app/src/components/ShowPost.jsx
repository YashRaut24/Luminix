import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PostCard from "./PostCard";
import FlashStoriesBar from "./FlashStoriesBar";
import OnboardingModal from "./OnboardingModal";
import { BsStars, BsColumnsGap } from "react-icons/bs";
import { FiClock, FiGrid, FiArrowUp, FiPlus, FiUsers, FiCompass } from "react-icons/fi";

function ShowPost({ mode, refreshTrigger, feedHeading, selectedCategory, user }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState("for-you"); // "for-you" | "recent"
  const [layoutMode, setLayoutMode] = useState("feed"); // "feed" | "masonry"
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [followedMap, setFollowedMap] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

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

      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedCreators = async () => {
    try {
      const res = await axios.get("http://localhost:9000/spotlight", {
        withCredentials: true,
      });
      if (res.data?.weeklyTopCreators) {
        setSuggestedCreators(res.data.weeklyTopCreators.slice(0, 3));
      }
    } catch (err) {
      // Non-blocking fallback
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchSuggestedCreators();
  }, [refreshTrigger, feedMode]);

  // Back-to-top scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 380);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFollowToggle = async (creatorId) => {
    try {
      setFollowedMap((prev) => ({ ...prev, [creatorId]: !prev[creatorId] }));
      await axios.post(
        `http://localhost:9000/users/${creatorId}/follow`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

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

  return (
    <div className="lumi-page-container">
      <div className="lumi-main-content">
        {/* Story-Style Top Bar (Slim 96px strip) */}
        <FlashStoriesBar user={user} mode={mode} />

        {/* Single Sticky Toolbar (48px) */}
        <div className="lumi-toolbar">
          <div className="lumi-toolbar__left">
            {/* Segmented Control [For You | Recent] */}
            <div className="lumi-segmented-control">
              <button
                type="button"
                className={`lumi-segmented-control__item ${feedMode === "for-you" ? "is-active" : ""}`}
                onClick={() => setFeedMode("for-you")}
              >
                <BsStars />
                <span>For You</span>
              </button>
              <button
                type="button"
                className={`lumi-segmented-control__item ${feedMode === "recent" ? "is-active" : ""}`}
                onClick={() => setFeedMode("recent")}
              >
                <FiClock />
                <span>Recent</span>
              </button>
            </div>
          </div>

          <div className="lumi-toolbar__right">
            {feedMode === "for-you" && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowOnboarding(true)}
              >
                <BsStars /> Tune Interests
              </button>
            )}

            {/* Layout Toggle: Icon-only buttons */}
            <button
              type="button"
              className={`btn--icon ${layoutMode === "feed" ? "is-active" : ""}`}
              onClick={() => setLayoutMode("feed")}
              title="Feed View (Fixed 4:3)"
            >
              <FiGrid />
            </button>
            <button
              type="button"
              className={`btn--icon ${layoutMode === "masonry" ? "is-active" : ""}`}
              onClick={() => setLayoutMode("masonry")}
              title="Masonry Grid View (Natural Ratio)"
            >
              <BsColumnsGap />
            </button>

            {/* Single Primary CTA per View */}
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => navigate("/feed/create")}
            >
              <FiPlus /> Create Post
            </button>
          </div>
        </div>

        {feedHeading && feedHeading !== "Your feed" && (
          <div style={{ marginTop: "16px", marginBottom: "8px" }}>
            <span className="chip chip--curated" style={{ fontSize: "14px", padding: "6px 14px" }}>
              #{feedHeading}
            </span>
          </div>
        )}

        {/* Skeleton Loaders (Solid --surface-2 opacity pulse) */}
        {loading ? (
          <div className={layoutMode === "masonry" ? "lumi-masonry-grid" : "lumi-feed-grid"}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="skeleton-post-card">
                <div className="skeleton-header">
                  <div className="skeleton skeleton-avatar" />
                  <div className="skeleton-user-lines">
                    <div className="skeleton skeleton-line skeleton-line--short" />
                    <div className="skeleton skeleton-line skeleton-line--medium" />
                  </div>
                </div>
                <div
                  className="skeleton skeleton-media"
                  style={{ height: layoutMode === "masonry" && n % 2 === 0 ? "340px" : "240px" }}
                />
                <div className="skeleton-user-lines" style={{ marginTop: "8px" }}>
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line skeleton-line--medium" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State with single CTA */
          <div className="empty-state">
            <FiCompass className="empty-state__icon" />
            <h3 className="empty-state__headline">No creations found in this view</h3>
            <p className="empty-state__subtext">
              Be the first creator to publish inspiration or try tuning your interest preferences.
            </p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => navigate("/feed/create")}
            >
              <FiPlus /> Create First Post
            </button>
          </div>
        ) : (
          <div className={layoutMode === "masonry" ? "lumi-masonry-grid" : "lumi-feed-grid"}>
            {filteredPosts.map((post, index) => (
              <React.Fragment key={post._id}>
                <PostCard post={post} mode={mode} />

                {/* Social Proof: Suggested Creators strip after every 6th post */}
                {(index + 1) % 6 === 0 && suggestedCreators.length > 0 && (
                  <div className="lumi-suggested-strip">
                    <div className="lumi-suggested-strip__header">
                      <span className="lumi-suggested-strip__title">
                        <FiUsers style={{ marginRight: "6px" }} /> Suggested Creators for You
                      </span>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => navigate("/feed/connect")}
                      >
                        Explore all &rarr;
                      </button>
                    </div>
                    <div className="lumi-suggested-strip__grid">
                      {suggestedCreators.map((creator) => {
                        const isFollowed = followedMap[creator._id];
                        return (
                          <div key={creator._id} className="lumi-suggested-card">
                            <div className="lumi-suggested-card__user">
                              <img
                                src={
                                  creator.profileImage
                                    ? `http://localhost:9000${creator.profileImage}`
                                    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                                }
                                alt={creator.name}
                                className="lumi-suggested-card__avatar"
                              />
                              <div>
                                <p className="lumi-suggested-card__name">{creator.name}</p>
                                <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                                  {creator.creationsCount || 1} creations
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className={`btn ${isFollowed ? "btn--secondary" : "chip--success"}`}
                              style={{
                                padding: "4px 10px",
                                minHeight: "28px",
                                fontSize: "12px",
                                cursor: "pointer",
                                border: "1px solid var(--border)",
                              }}
                              onClick={() => handleFollowToggle(creator._id)}
                            >
                              {isFollowed ? "Following" : "Follow"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Floating Back to Top Pill */}
        {showBackToTop && (
          <button
            type="button"
            className="back-to-top-pill"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title="Scroll back to top"
          >
            <FiArrowUp /> Back to top
          </button>
        )}

        {/* Onboarding Interest Setup Modal */}
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => fetchPosts()}
          mode={mode}
        />
      </div>
    </div>
  );
}

export default ShowPost;
