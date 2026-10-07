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
    <div className="lumi-flash-bar">
      <div className="lumi-flash-bar__scroll">
        {/* Add Flash Story Button */}
        <button
          type="button"
          className="lumi-flash-item"
          onClick={() => navigate("/feed/camera")}
          title="Shoot a 24h Ephemeral Flash via Webcam"
        >
          <div className="lumi-flash-ring lumi-flash-ring--add">
            <div className="lumi-flash-avatar">
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
            <span className="lumi-flash-add-badge">
              <FiPlus />
            </span>
          </div>
          <span className="lumi-flash-author">Add Flash</span>
          <span className="lumi-flash-urgency">24h story</span>
        </button>

        {/* Existing Flash Stories */}
        {stories.map((group) => {
          const latestItem = group.items[group.items.length - 1];
          const timeLeft = latestItem?.timeLeftText?.split(" ")[0] || "3h";

          return (
            <button
              type="button"
              key={group.authorId}
              className="lumi-flash-item"
              onClick={() => openStory(group)}
            >
              <div className="lumi-flash-ring">
                <div className="lumi-flash-avatar">
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
              <span className="lumi-flash-author">{group.authorName}</span>
              <span className="lumi-flash-urgency">ends in {timeLeft}</span>
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
