import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import FlashStoriesBar from "./FlashStoriesBar";
import OnboardingModal from "./OnboardingModal";
import { BsStars, BsColumnsGap } from "react-icons/bs";
import { FiClock, FiGrid, FiArrowUp } from "react-icons/fi";
import "./ShowPost.css";

function ShowPost({ mode, refreshTrigger, feedHeading, selectedCategory, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState("for-you"); // "for-you" | "recent"
  const [layoutMode, setLayoutMode] = useState("feed"); // "feed" | "masonry"
  const [userProfileSummary, setUserProfileSummary] = useState(null);
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
      if (res.data.userProfile) {
        setUserProfileSummary(res.data.userProfile);
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

  // Back-to-top scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 380) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className={mode ? "dark-show-posts-wrapper" : "show-posts-wrapper"}>
      <div className={mode ? "dark-show-posts-container" : "show-posts-container"}>
        {/* Story-Style Top Bar (Avatar Rings for Flash Stories) */}
        <FlashStoriesBar user={user} mode={mode} />

        {/* Feed Controls Header: Switchers for For-You/Recent & Feed/Masonry */}
        <div className="feed-controls-header">
          <div className="feed-controls-left">
            <div className="feed-view-switch-row">
              <button
                type="button"
                className={`feed-switch-btn ${feedMode === "for-you" ? "active" : ""}`}
                onClick={() => setFeedMode("for-you")}
              >
                <BsStars className="feed-switch-icon" />
                <span>For You</span>
                <span className="feed-switch-sub">AI Ranked</span>
              </button>
              <button
                type="button"
                className={`feed-switch-btn ${feedMode === "recent" ? "active" : ""}`}
                onClick={() => setFeedMode("recent")}
              >
                <FiClock className="feed-switch-icon" />
                <span>Recent</span>
                <span className="feed-switch-sub">Live</span>
              </button>
            </div>

            {/* Pinterest-style Masonry vs Linear Feed Toggle */}
            <div className="layout-toggle-row">
              <button
                type="button"
                className={`layout-btn ${layoutMode === "feed" ? "active" : ""}`}
                onClick={() => setLayoutMode("feed")}
                title="Linear Feed View"
              >
                <FiGrid />
                <span>Feed</span>
              </button>
              <button
                type="button"
                className={`layout-btn ${layoutMode === "masonry" ? "active" : ""}`}
                onClick={() => setLayoutMode("masonry")}
                title="Pinterest-Style Masonry Grid"
              >
                <BsColumnsGap />
                <span>Masonry</span>
              </button>
            </div>
          </div>

          <div className="feed-controls-right">
            {feedMode === "for-you" && (
              <button
                type="button"
                className="tune-interests-btn"
                onClick={() => setShowOnboarding(true)}
              >
                <BsStars /> Tune Interests
              </button>
            )}
          </div>
        </div>

        {feedHeading && feedHeading !== "Your feed" && (
          <div className="feed-heading-banner">
            <h2>{feedHeading} Feed</h2>
            <p>Showing curated creative works for #{feedHeading.toLowerCase()}</p>
          </div>
        )}

        {/* Skeleton Shimmer Loaders */}
        {loading ? (
          <div
            className={
              layoutMode === "masonry"
                ? mode
                  ? "dark-masonry-grid"
                  : "masonry-grid"
                : mode
                ? "dark-posts-grid"
                : "posts-grid"
            }
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className={`skeleton-post-card ${mode ? "dark-theme" : ""}`}>
                <div className="skeleton-header">
                  <div className="skeleton-avatar shimmer" />
                  <div className="skeleton-user-lines">
                    <div className="skeleton-line short shimmer" />
                    <div className="skeleton-line tiny shimmer" />
                  </div>
                </div>
                <div
                  className="skeleton-media shimmer"
                  style={{ height: layoutMode === "masonry" && n % 2 === 0 ? "360px" : "280px" }}
                />
                <div className="skeleton-body">
                  <div className="skeleton-line shimmer" />
                  <div className="skeleton-line medium shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="no-posts-message">
            <p>No creations available in this view. Be the first to share or remix!</p>
          </div>
        ) : (
          <div
            className={
              layoutMode === "masonry"
                ? mode
                  ? "dark-masonry-grid"
                  : "masonry-grid"
                : mode
                ? "dark-posts-grid"
                : "posts-grid"
            }
          >
            {filteredPosts.map((post) => (
              <PostCard key={post._id} post={post} mode={mode} />
            ))}
          </div>
        )}

        {/* Floating "Back to Top" Pill */}
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
