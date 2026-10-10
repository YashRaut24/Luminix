import React, { useState, useEffect } from "react";
import axios from "axios";
import { BsFire } from "react-icons/bs";
import { FiCalendar, FiCheckCircle } from "react-icons/fi";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DailyFrameStreak({ userId, mode }) {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        setLoading(true);
        const url = userId
          ? `http://localhost:9000/users/${userId}/streak`
          : `http://localhost:9000/me/streak`;
        const res = await axios.get(url, { withCredentials: true });
        setStreakData(res.data);
      } catch (err) {
        console.error("Fetch streak error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [userId]);

  if (loading) {
    return (
      <div className="streak-heatmap-container">
        <div className="streak-heatmap-title">
          <FiCalendar /> LOADING DAILY FRAME STREAK...
        </div>
      </div>
    );
  }

  if (!streakData) return null;

  const { currentStreak, longestStreak, totalFrames, activeDays, cells } = streakData;

  return (
    <div className="streak-heatmap-container">
      {/* Top Header & Counter Badges */}
      <div className="streak-heatmap-header">
        <div className="streak-heatmap-title">
          <FiCalendar /> DAILY FRAME STREAK & CALENDAR
        </div>

        <div className="streak-counter-badges">
          <div className="streak-counter-badge" title="Current consecutive days active">
            <BsFire /> {currentStreak} {currentStreak === 1 ? "DAY" : "DAYS"} STREAK
          </div>
          <div className="streak-counter-badge streak-counter-badge--neutral" title="Longest active streak">
            LONGEST: {longestStreak}d
          </div>
          <div className="streak-counter-badge streak-counter-badge--neutral" title="Total frames developed">
            {totalFrames} FRAMES
          </div>
        </div>
      </div>

      {/* Solid Flat Heatmap Grid (No Gradients) */}
      <div className="streak-matrix-wrapper">
        <div className="streak-matrix" role="grid" aria-label="Daily Frame Streak Calendar">
          {cells.map((cell, idx) => (
            <div
              key={cell.date || idx}
              className={`streak-cell level-${cell.level}`}
              onMouseEnter={() => setHoveredCell(cell)}
              onMouseLeave={() => setHoveredCell(null)}
              title={`${cell.date}: ${cell.count} ${cell.count === 1 ? "frame" : "frames"}`}
            />
          ))}
        </div>
      </div>

      {/* Legend & Hover Info */}
      <div className="streak-legend-row">
        <div>
          {hoveredCell ? (
            <span style={{ color: "var(--text)" }}>
              <strong>{hoveredCell.date}</strong>: {hoveredCell.count} {hoveredCell.count === 1 ? "frame developed" : "frames developed"}
            </span>
          ) : (
            <span>{activeDays} ACTIVE DAYS IN LAST 16 WEEKS</span>
          )}
        </div>

        <div className="streak-legend-steps">
          <span>LESS</span>
          <div className="streak-legend-box level-0" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--rule)" }} title="0 frames" />
          <div className="streak-legend-box level-1" style={{ backgroundColor: "#6366f1" }} title="1 frame" />
          <div className="streak-legend-box level-2" style={{ backgroundColor: "#4f46e5" }} title="2+ frames" />
          <span>MORE</span>
        </div>
      </div>
    </div>
  );
}
