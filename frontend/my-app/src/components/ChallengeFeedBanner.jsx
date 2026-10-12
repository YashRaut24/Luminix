import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiArrowRight } from "react-icons/fi";
import "../styles/challenge.css";

function formatCountdown(targetDate) {
  if (!targetDate) return "";
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) return "Challenge closed";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function ChallengeFeedBanner() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [entryCount, setEntryCount] = useState(0);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentChallenge = async () => {
      try {
        const res = await axios.get("http://localhost:9000/challenges/current", {
          withCredentials: true,
        });
        if (isMounted && res.data?.challenge) {
          const ch = res.data.challenge;
          setChallenge(ch);
          setEntryCount(res.data.entryCount ?? res.data.entriesCount ?? 0);
          setCountdown(formatCountdown(ch.endsAt || ch.ends_at));
        }
      } catch (err) {
        console.warn("Challenge banner fetch note:", err.message);
      }
    };

    fetchCurrentChallenge();

    // Refresh countdown every minute (60,000 ms)
    const interval = setInterval(() => {
      if (challenge) {
        setCountdown(formatCountdown(challenge.endsAt || challenge.ends_at));
      } else {
        fetchCurrentChallenge();
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [challenge?.endsAt, challenge?.ends_at]);

  if (!challenge) return null;

  const challengeTitle = challenge.title || challenge.theme || "Weekly Prompt";
  const endsAtDate = challenge.endsAt || challenge.ends_at;

  return (
    <div
      className="challenge-feed-banner"
      onClick={() => navigate("/feed/challenge")}
      role="banner"
      aria-label="Weekly Prompt Challenge"
    >
      <div className="challenge-banner-left">
        {/* Warning-colored pulsing dot for urgency (contrast safe: dot only) */}
        <span className="challenge-pulse-dot" aria-hidden="true" />
        <span className="challenge-banner-tag font-mono">WEEKLY PROMPT</span>
        <span className="challenge-banner-title">“{challengeTitle}”</span>
      </div>

      <div className="challenge-banner-right">
        {countdown && (
          <span className="challenge-banner-countdown font-mono" title={endsAtDate ? `Ends: ${new Date(endsAtDate).toLocaleString()}` : ""}>
            Ends in {countdown}
          </span>
        )}
        <span className="challenge-banner-count font-mono">
          {entryCount} {entryCount === 1 ? "entry" : "entries"}
        </span>
        <span className="challenge-banner-action-link font-mono">
          VIEW <FiArrowRight aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
