import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import FlashStoriesBar from "./FlashStoriesBar";
import "./ShowPost.css";

function ShowPost({ mode, refreshTrigger, feedHeading, selectedCategory, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:9000/posts", {
          withCredentials: true,
        });
        setPosts(res.data.posts || []);
      } catch (err) {
        console.error("Fetch posts error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [refreshTrigger]);

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
