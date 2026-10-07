import React, { useState, useEffect } from "react";
import axios from "axios";
import socket from "../socket";
import FlashViewerModal from "./FlashViewerModal";
import { FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const FlashStoriesBar = ({ user }) => {
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
    <div className="darkroom-flash-strip">
      <div className="darkroom-flash-strip__scroll">
        {/* Add Flash Story Button */}
        <button
          type="button"
          className="darkroom-flash-item"
          onClick={() => navigate("/feed/camera")}
          title="Shoot a 24h Ephemeral Flash"
        >
          <div className="darkroom-flash-ring darkroom-flash-ring--add">
            <div className="darkroom-flash-avatar">
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
                <span>{user?.name?.charAt(0) || "U"}</span>
              )}
            </div>
            <span className="darkroom-flash-add-icon">
              <FiPlus />
            </span>
          </div>
          <div className="darkroom-flash-countdown">
            <div className="darkroom-flash-countdown__fill" style={{ width: "100%" }} />
          </div>
          <span className="darkroom-flash-author">Add Flash</span>
        </button>

        {/* Existing Flash Stories */}
        {stories.map((group) => {
          const latestItem = group.items[group.items.length - 1];
          const timeLeftText = latestItem?.timeLeftText?.split(" ")[0] || "18h";
          const hoursLeft = parseInt(timeLeftText, 10) || 12;
          const ratioPercent = Math.min(100, Math.max(8, (hoursLeft / 24) * 100));

          return (
            <button
              type="button"
              key={group.authorId}
              className="darkroom-flash-item"
              onClick={() => openStory(group)}
              title={`${group.authorName} (${timeLeftText} left)`}
            >
              <div className="darkroom-flash-ring is-unviewed">
                <div className="darkroom-flash-avatar">
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
                </div>
              </div>

              {/* Solid Countdown bar for 24h lifetime */}
              <div className="darkroom-flash-countdown">
                <div
                  className="darkroom-flash-countdown__fill"
                  style={{ width: `${ratioPercent}%` }}
                />
              </div>

              <div className="darkroom-flash-meta">
                <span className="darkroom-flash-author">{group.authorName}</span>
                <span className="darkroom-flash-timer">{timeLeftText}</span>
              </div>
            </button>
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
