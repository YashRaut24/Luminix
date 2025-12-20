import React, { useState } from "react";
import "./SearchUser.css";

function SearchUser({ mode }) {
  const [username, setUsername] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Dummy posts (frontend-only)
  const dummyPosts = [
    {
      _id: "1",
      username: "john",
      file_url: "https://via.placeholder.com/400",
      file_name: "post1.jpg",
      caption: "Creative vibes ✨",
      tags: ["art", "design"],
      createdAt: new Date()
    },
    {
      _id: "2",
      username: "john",
      file_url: "https://via.placeholder.com/400",
      file_name: "post2.jpg",
      caption: "Late night thoughts 🌙",
      tags: ["mood"],
      createdAt: new Date()
    },
    {
      _id: "3",
      username: "emma",
      file_url: "https://via.placeholder.com/400",
      file_name: "post3.jpg",
      caption: "Sunset love 🌅",
      tags: ["nature"],
      createdAt: new Date()
    }
  ];

  const handleSearch = () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearched(false);

    // 🔁 Simulate API delay
    setTimeout(() => {
      const results = dummyPosts.filter(
        post => post.username.toLowerCase() === username.toLowerCase()
      );

      setSearchResults(results);
      setSearched(true);
      setIsLoading(false);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={mode ? "dark-search-user-container" : "search-user-container"}>
      <div className="search-header">
        <h2>Search User Posts</h2>
        <p className="search-subtitle">Find posts by username</p>
      </div>

      <div className="search-form">
        <input
          type="text"
          placeholder="Enter username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          className="search-input"
        />
        <button
          onClick={handleSearch}
          className="search-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="btn-spinner"></span>
              Searching...
            </>
          ) : (
            <>
              <span>🔍</span>
              Search
            </>
          )}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Searching for posts...</p>
        </div>
      )}

      {!isLoading && (
        <div className="search-results">
          {searched ? (
            searchResults.length > 0 ? (
              <div className="posts-grid">
                {searchResults.map((file) => (
                  <div key={file._id} className="post-card">
                    <div className="post-image-container">
                      <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="post-image"
                      />
                    </div>
                    <div className="post-footer">
                      <p className="post-username">@{file.username}</p>
                      {file.caption && (
                        <p className="post-caption">{file.caption}</p>
                      )}
                      <div className="post-meta">
                        <span className="post-time">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                        {file.tags && file.tags.length > 0 && (
                          <div className="post-stats">
                            <span className="stat-item">
                              <span className="stat-icon">🏷️</span>
                              {file.tags.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <p>No posts found for "{username}"</p>
                <p style={{ fontSize: "14px", marginTop: "8px", opacity: 0.7 }}>
                  Try searching for a different username
                </p>
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

export default SearchUser;
