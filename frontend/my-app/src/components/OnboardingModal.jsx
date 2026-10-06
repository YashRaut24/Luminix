import React, { useState, useEffect } from "react";
import axios from "axios";
import "./OnboardingModal.css";
import { FiCheck, FiUsers, FiArrowRight, FiX, FiCompass } from "react-icons/fi";
import { BsStars } from "react-icons/bs";

const CATEGORIES = [
  { id: "digitalart", label: "Digital Illustration", emoji: "🎨", tag: "digitalart" },
  { id: "three_d", label: "3D & Procedural Art", emoji: "🧊", tag: "blender3d" },
  { id: "photography", label: "Moody & Street Photography", emoji: "📷", tag: "moodygrams" },
  { id: "cyberpunk", label: "Cyberpunk & Sci-Fi", emoji: "⚡", tag: "cyberpunk" },
  { id: "tech", label: "Tech, Code & UI", emoji: "💻", tag: "developer" },
  { id: "memes", label: "Memes & Internet Humor", emoji: "🎭", tag: "memesdaily" },
  { id: "music", label: "Music Production & Sound", emoji: "🎵", tag: "musicproduction" },
  { id: "nature", label: "Nature & Landscapes", emoji: "🌿", tag: "earthpix" },
];

function OnboardingModal({ isOpen, onClose, onComplete, mode }) {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState(["digitalart", "three_d"]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch suggested creators
      axios
        .get("http://localhost:9000/network-graph", { withCredentials: true })
        .then((res) => {
          if (res.data?.nodes) {
            const others = res.data.nodes.filter((n) => n.type !== "root").slice(0, 4);
            setSuggestedCreators(others);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const toggleInterest = (tag) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const toggleFollow = async (creatorId) => {
    try {
      const nextSet = new Set(followedIds);
      if (nextSet.has(creatorId)) {
        nextSet.delete(creatorId);
      } else {
        nextSet.add(creatorId);
      }
      setFollowedIds(nextSet);

      await axios.post(
        `http://localhost:9000/users/${creatorId}/follow`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.log("Follow toggle error:", err);
    }
  };

  const handleFinish = () => {
    setIsSubmitting(true);
    localStorage.setItem("luminix_onboarding_completed", "true");
    localStorage.setItem("luminix_seeded_interests", JSON.stringify(selectedInterests));

    setTimeout(() => {
      setIsSubmitting(false);
      if (onComplete) onComplete(selectedInterests);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className={`onboarding-backdrop ${mode ? "dark-theme" : ""}`} onClick={onClose}>
      <div className="onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <button className="onboarding-close-btn" onClick={onClose}>
          <FiX />
        </button>

        {/* Modal Progress Indicator */}
        <div className="onboarding-steps-indicator">
          <span className={`step-dot ${step === 1 ? "active" : "done"}`} />
          <span className={`step-dot ${step === 2 ? "active" : ""}`} />
        </div>

        {step === 1 ? (
          <div className="onboarding-step-view">
            <div className="onboarding-header">
              <span className="onboarding-pill">
                <BsStars /> Step 1 of 2
              </span>
              <h2>Tailor Your Creative Feed</h2>
              <p>Pick at least 2 interests to seed your personalized "For You" feed</p>
            </div>

            <div className="interests-grid">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedInterests.includes(cat.tag);
                return (
                  <div
                    key={cat.id}
                    className={`interest-card ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleInterest(cat.tag)}
                  >
                    <span className="interest-emoji">{cat.emoji}</span>
                    <span className="interest-name">{cat.label}</span>
                    <div className="interest-check-bubble">
                      {isSelected ? <FiCheck /> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="onboarding-footer">
              <span className="selected-count">
                {selectedInterests.length} selected
              </span>
              <button
                type="button"
                className="onboarding-next-btn"
                disabled={selectedInterests.length < 1}
                onClick={() => setStep(2)}
              >
                <span>Continue</span>
                <FiArrowRight />
              </button>
            </div>
          </div>
        ) : (
          <div className="onboarding-step-view">
            <div className="onboarding-header">
              <span className="onboarding-pill">
                <FiUsers /> Step 2 of 2
              </span>
              <h2>Follow Emerging Creators</h2>
              <p>Discover talented artists shaping community aesthetics</p>
            </div>

            <div className="creators-follow-list">
              {suggestedCreators.length > 0 ? (
                suggestedCreators.map((creator) => {
                  const isFollowing = followedIds.has(creator.id);
                  return (
                    <div key={creator.id} className="creator-follow-row">
                      <img
                        src={
                          creator.profileImage ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${creator.name}`
                        }
                        alt={creator.name}
                        className="creator-row-avatar"
                      />
                      <div className="creator-row-info">
                        <span className="creator-row-name">{creator.name}</span>
                        <span className="creator-row-role">
                          {creator.creatorRole || "Creator"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`creator-follow-btn ${isFollowing ? "following" : ""}`}
                        onClick={() => toggleFollow(creator.id)}
                      >
                        {isFollowing ? "Following" : "+ Follow"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="creators-empty-hint">
                  <p>You're all set! Ready to dive into the tailored creations.</p>
                </div>
              )}
            </div>

            <div className="onboarding-footer">
              <button
                type="button"
                className="onboarding-back-btn"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="onboarding-finish-btn"
                onClick={handleFinish}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Personalizing Feed..." : "Start Exploring Luminix ✨"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingModal;
