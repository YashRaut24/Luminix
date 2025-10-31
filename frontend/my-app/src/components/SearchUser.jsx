import React, { useState } from "react";
import axios from "axios";
import "./SearchUser.css";

function SearchUser({ mode }) {
  const [username, setUsername] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearched(false);

    try {
      const response = await axios.get(`/api/users/${username}/posts`);
      setSearchResults(response.data);
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch posts");
      setSearchResults([]);
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
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
                      <p className="post-username">@{file.username || username}</p>
                      {file.caption && (
                        <p className="post-caption">{file.caption}</p>
                      )}
                      <div className="post-meta">
                        <span className="post-time">
                          {file.createdAt 
                            ? new Date(file.createdAt).toLocaleDateString()
                            : "Recent"
                          }
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
                <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
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