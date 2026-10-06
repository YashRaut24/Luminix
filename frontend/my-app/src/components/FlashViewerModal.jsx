import React, { useState, useEffect } from "react";
import "./FlashViewerModal.css";
import { FiX, FiClock, FiChevronLeft, FiChevronRight, FiZap } from "react-icons/fi";

const FlashViewerModal = ({ storyGroup, initialIndex = 0, onClose, onNextGroup }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const items = storyGroup.items || [];
  const currentItem = items[currentIndex];

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, storyGroup]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (onNextGroup) onNextGroup();
      else onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!currentItem) return null;

  return (
    <div className="flash-viewer-overlay" onClick={onClose}>
      <div
        className="flash-viewer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Story Segment Progress Bars */}
        <div className="story-progress-strip">
          {items.map((_, idx) => (
            <div key={idx} className="story-segment-bar">
              <div
                className="story-segment-fill"
                style={{
                  width:
                    idx < currentIndex
                      ? "100%"
                      : idx === currentIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="story-viewer-header">
          <div className="story-header-user">
            <img
              src={
                storyGroup.authorAvatar
                  ? storyGroup.authorAvatar.startsWith("http")
                    ? storyGroup.authorAvatar
                    : `http://localhost:9000${storyGroup.authorAvatar}`
                  : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
              }
              alt=""
              className="story-header-avatar"
            />
            <div className="story-header-names">
              <span className="story-header-author">{storyGroup.authorName}</span>
              <span className="story-header-tag">{storyGroup.lumiTag}</span>
            </div>
            <div className="ttl-clock-pill">
              <FiClock /> {currentItem.timeLeftText || "24h TTL"}
            </div>
          </div>

          <button className="story-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Media stage */}
        <div className="story-media-stage">
          <img
            src={
              currentItem.file_url.startsWith("http")
                ? currentItem.file_url
                : `http://localhost:9000${currentItem.file_url}`
            }
            alt="Flash moment"
            className="story-image"
          />

          <button
            className="story-nav-edge left"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <FiChevronLeft />
          </button>
          <button className="story-nav-edge right" onClick={handleNext}>
            <FiChevronRight />
          </button>
        </div>

        {/* Story footer caption */}
        {currentItem.caption && (
          <div className="story-footer-caption">
            <p>{currentItem.caption}</p>
          </div>
        )}

        <div className="story-ephemeral-notice">
          <FiZap /> 24-Hour Ephemeral Flash • Auto-deletes via MongoDB TTL index
        </div>
      </div>
    </div>
  );
};

export default FlashViewerModal;
