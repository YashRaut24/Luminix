import React, { useState, useEffect } from "react";
import axios from "axios";
import "./FlashStoriesBar.css";
import socket from "../socket";
import FlashViewerModal from "./FlashViewerModal";
import { FiPlus, FiZap, FiCamera } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const FlashStoriesBar = ({ user, mode }) => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const fetchFlashes = async () => {
    try {
      const res = await axios.get("http://localhost:9000/flash", {
        withCredentials: true,
      });
      setStories(res.data.flashes || []);
    } catch (err) {
      console.error("Error fetching flash stories:", err);
    }
  };

  useEffect(() => {
    fetchFlashes();

    const handleNewFlash = () => {
      fetchFlashes();
    };

    socket.on("new_flash_posted", handleNewFlash);
    return () => {
      socket.off("new_flash_posted", handleNewFlash);
    };
  }, []);

  const openStory = (storyGroup) => {
    setActiveStoryGroup(storyGroup);
    setActiveItemIndex(0);
  };

  return (
    <div className={`flash-bar-container ${mode ? "dark-theme" : ""}`}>
      <div className="flash-stories-scroll">
        {/* Quick Add Flash Button */}
        <div
          className="flash-story-item add-flash-item"
          onClick={() => navigate("/feed/camera")}
          title="Shoot a 24h Ephemeral Flash via Webcam"
        >
          <div className="story-ring-wrapper add-ring">
            <div className="story-avatar-holder add-avatar">
              {user?.profileImage ? (
                <img
                  src={
                    user.profileImage.startsWith("http")
                      ? user.profileImage
                      : `http://localhost:9000${user.profileImage}`
                  }
                  alt="You"
                />
              ) : (
                <span className="user-initial">{user?.name?.charAt(0) || "U"}</span>
              )}
              <div className="add-badge-plus">
                <FiPlus />
              </div>
            </div>
          </div>
          <span className="story-author-name">Add Flash</span>
          <span className="story-time-badge">24h Story</span>
        </div>

        {/* Existing Flash Stories */}
        {stories.map((group) => {
          const latestItem = group.items[group.items.length - 1];
          return (
            <div
              key={group.authorId}
              className="flash-story-item"
              onClick={() => openStory(group)}
            >
              <div className="story-ring-wrapper active-ring">
                <div className="story-avatar-holder">
                  <img
                    src={
                      group.authorAvatar
                        ? group.authorAvatar.startsWith("http")
                          ? group.authorAvatar
                          : `http://localhost:9000${group.authorAvatar}`
                        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={group.authorName}
                  />
                  <span className="flash-zap-badge">
                    <FiZap />
                  </span>
                </div>
              </div>
              <span className="story-author-name">{group.authorName}</span>
              <span className="story-time-badge">
                {latestItem?.timeLeftText?.split(" ")[0] || "24h"} left
              </span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Lightbox */}
      {activeStoryGroup && (
        <FlashViewerModal
          storyGroup={activeStoryGroup}
          initialIndex={activeItemIndex}
          onClose={() => setActiveStoryGroup(null)}
          onNextGroup={() => {
            const currentIdx = stories.findIndex(
              (s) => s.authorId === activeStoryGroup.authorId
            );
            if (currentIdx < stories.length - 1) {
              setActiveStoryGroup(stories[currentIdx + 1]);
              setActiveItemIndex(0);
            } else {
              setActiveStoryGroup(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default FlashStoriesBar;
