import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import FlashStoriesBar from "./FlashStoriesBar";
import { BsStars } from "react-icons/bs";
import { FiClock } from "react-icons/fi";
import "./ShowPost.css";

function ShowPost({ mode, refreshTrigger, feedHeading, selectedCategory, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState("for-you"); // "for-you" | "recent"
  const [userProfileSummary, setUserProfileSummary] = useState(null);

  useEffect(() => {
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

    fetchPosts();
  }, [refreshTrigger, feedMode]);

  // Optional category filter if user selected a feed category
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
        {/* 24-Hour Ephemeral Flash Stories */}
        <FlashStoriesBar user={user} mode={mode} />

        {/* Feed Switcher: Personalized 'For You' vs 'All Recent' */}
        <div className="feed-controls-header">
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
              <span className="feed-switch-sub">Chronological</span>
            </button>
          </div>

          {feedMode === "for-you" && userProfileSummary && (
            <div className="for-you-affinity-summary">
              <span className="affinity-label">✨ Top Interests:</span>
              {userProfileSummary.topTags && userProfileSummary.topTags.length > 0 ? (
                userProfileSummary.topTags.slice(0, 3).map((t, i) => (
                  <span key={i} className="affinity-tag-chip">
                    #{t}
                  </span>
                ))
              ) : (
                <span className="affinity-subtext">
                  Ranked by creator momentum & global affinity
                </span>
              )}
            </div>
          )}
        </div>

        {feedHeading && feedHeading !== "Your feed" && (
          <div className="feed-heading-banner">
            <h2>{feedHeading} Feed</h2>
            <p>Showing curated creative works for #{feedHeading.toLowerCase()}</p>
          </div>
        )}

        {loading ? (
          <div className="no-posts-message">
            <p>✨ Loading creative creations...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="no-posts-message">
            <p>No posts available in this view. Be the first to share or remix!</p>
          </div>
        ) : (
          <div className={mode ? "dark-posts-grid" : "posts-grid"}>
            {filteredPosts.map((post) => (
              <PostCard key={post._id} post={post} mode={mode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShowPost;
