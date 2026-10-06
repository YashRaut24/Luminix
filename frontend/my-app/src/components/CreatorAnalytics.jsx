import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CreatorAnalytics.css";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import {
  FiTrendingUp,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiClock,
  FiAward,
  FiCalendar,
  FiUsers,
  FiArrowUpRight,
  FiZap,
  FiLayers
} from "react-icons/fi";
import { BsStars } from "react-icons/bs";

const COLORS = ["#8b5cf6", "#ec4899", "#38bdf8", "#10b981", "#f59e0b", "#6366f1"];

function CreatorAnalytics({ mode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:9000/creator/analytics", {
          withCredentials: true
        });
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className={mode ? "dark-analytics-container" : "analytics-container"}>
        <div className="analytics-loading">
          <div className="loading-spinner" />
          <p>Compiling creator analytics, engagement velocity & audience charts...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    profileViews: 140,
    totalPosts: 4,
    totalLikes: 28,
    totalComments: 9,
    totalViews: 280,
    followersCount: 12,
    avgEngagementRate: "8.4%"
  };

  const bestPostingTime = data?.bestPostingTime || {
    timeSlot: "7:00 PM - 8:00 PM",
    bestDay: "Friday & Sunday",
    recommendation: "Your audience is most active in evening hours.",
    peakEngagementMultiplier: "1.4x"
  };

  const timeline = data?.performanceTimeline || [];
  const categoryData = data?.categoryDistribution || [{ name: "Creative", value: 1 }];
  const topPosts = data?.topPosts || [];
  const badges = data?.badges || [];

  return (
    <div className={mode ? "dark-analytics-container" : "analytics-container"}>
      {/* Header */}
      <div className="analytics-header">
        <div>
          <div className="analytics-pill">
            <BsStars /> Creator Studio Intelligence
          </div>
          <h2>Creator Analytics & Diagnostics</h2>
          <p className="analytics-subtitle">
            Audience behavior, engagement velocity, and personalized posting timing
          </p>
        </div>

        {/* Time range selector */}
        <div className="analytics-range-selector">
          <button
            type="button"
            className={`range-btn ${timeRange === "7d" ? "active" : ""}`}
            onClick={() => setTimeRange("7d")}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`range-btn ${timeRange === "30d" ? "active" : ""}`}
            onClick={() => setTimeRange("30d")}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className={`range-btn ${timeRange === "all" ? "active" : ""}`}
            onClick={() => setTimeRange("all")}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Metric KPI Cards Grid */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Profile Views</span>
            <div className="kpi-icon-badge purple">
              <FiEye />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{overview.profileViews}</span>
            <span className="kpi-trend positive">
              <FiArrowUpRight /> +24%
            </span>
          </div>
          <span className="kpi-caption">Unique creator profile impressions</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Avg Engagement Rate</span>
            <div className="kpi-icon-badge pink">
              <FiTrendingUp />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{overview.avgEngagementRate}</span>
            <span className="kpi-trend positive">
              <FiArrowUpRight /> Top 12%
            </span>
          </div>
          <span className="kpi-caption">(Likes + Comments + Reposts) / Views</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Creations</span>
            <div className="kpi-icon-badge blue">
              <FiLayers />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{overview.totalPosts}</span>
            <span className="kpi-sub-stat">{overview.totalLikes} Total Likes</span>
          </div>
          <span className="kpi-caption">Masterpieces and process strips</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Audience Followers</span>
            <div className="kpi-icon-badge emerald">
              <FiUsers />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{overview.followersCount}</span>
            <span className="kpi-trend positive">
              <FiArrowUpRight /> +4 this week
            </span>
          </div>
          <span className="kpi-caption">Network connections & mutuals</span>
        </div>
      </div>

      {/* Best Posting Time Recommendation Card */}
      <div className="best-timing-card">
        <div className="best-timing-left">
          <div className="timing-icon-box">
            <FiClock />
          </div>
          <div>
            <span className="timing-label">AI Recommended Best Posting Time</span>
            <h3 className="timing-slot">{bestPostingTime.timeSlot}</h3>
            <p className="timing-description">{bestPostingTime.recommendation}</p>
          </div>
        </div>
        <div className="best-timing-right">
          <div className="timing-metric-box">
            <span className="metric-tag">Peak Window</span>
            <span className="metric-highlight">{bestPostingTime.bestDay}</span>
          </div>
          <div className="timing-metric-box">
            <span className="metric-tag">Reach Multiplier</span>
            <span className="metric-highlight emerald-text">
              {bestPostingTime.peakEngagementMultiplier}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Chart 1: 7-Day Performance Trend (AreaChart) */}
        <div className="chart-card wide-chart">
          <div className="chart-card-header">
            <div>
              <h3>Weekly Reach & Engagement Velocity</h3>
              <p>Daily breakdown of content impressions, likes and comments</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={mode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="day" stroke={mode ? "#94a3b8" : "#64748b"} />
                <YAxis stroke={mode ? "#94a3b8" : "#64748b"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: mode ? "#0f172a" : "#ffffff",
                    borderColor: mode ? "#334155" : "#cbd5e1",
                    borderRadius: 10,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.2)"
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#viewsGrad)"
                  name="Views / Reach"
                />
                <Area
                  type="monotone"
                  dataKey="likes"
                  stroke="#ec4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#likesGrad)"
                  name="Likes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category & Medium Breakdown (PieChart) */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Medium & Tag Distribution</h3>
              <p>Content spread across creative categories</p>
            </div>
          </div>
          <div className="chart-wrapper pie-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: mode ? "#0f172a" : "#ffffff",
                    borderColor: mode ? "#334155" : "#cbd5e1",
                    borderRadius: 10
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Verified / Skill Badges Strip */}
      <div className="badges-card">
        <div className="badges-header">
          <div className="badges-title-group">
            <FiAward className="award-icon" />
            <div>
              <h3>Verified Skill & Milestone Badges</h3>
              <p>Badges earned based on creative focus, category mastery & community impact</p>
            </div>
          </div>
          <span className="badges-count-badge">
            {badges.length} Unlocked
          </span>
        </div>

        <div className="badges-grid">
          {badges.map((b, idx) => (
            <div key={idx} className="skill-badge-item">
              <span className="badge-item-icon">{b.icon || "⭐"}</span>
              <div className="badge-item-content">
                <span className="badge-item-title">{b.title}</span>
                <p className="badge-item-desc">{b.description}</p>
                <span className="badge-earned-tag">✓ Verified Creator</span>
              </div>
            </div>
          ))}

          {/* Locked milestone previews */}
          {badges.length < 5 && (
            <div className="skill-badge-item locked">
              <span className="badge-item-icon">🔒</span>
              <div className="badge-item-content">
                <span className="badge-item-title">Meme Maestro</span>
                <p className="badge-item-desc">Publish 2+ creative meme iterations</p>
                <span className="badge-locked-tag">Milestone in progress</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Creations List */}
      {topPosts.length > 0 && (
        <div className="top-posts-card">
          <h3 className="section-title">
            <FiZap /> Top Performing Creations
          </h3>
          <div className="top-posts-table">
            {topPosts.map((post, idx) => (
              <div key={post._id} className="top-post-row">
                <span className="rank-number">0{idx + 1}</span>
                <img
                  src={
                    post.file_url?.startsWith("/uploads")
                      ? `http://localhost:9000${post.file_url}`
                      : post.file_url
                  }
                  alt={post.caption}
                  className="top-post-thumb"
                />
                <div className="top-post-details">
                  <span className="top-post-caption">{post.caption || "Untitled Artwork"}</span>
                  <span className="top-post-date">
                    {new Date(post.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="top-post-stats">
                  <span className="stat-badge">
                    <FiHeart /> {post.likes}
                  </span>
                  <span className="stat-badge">
                    <FiMessageCircle /> {post.comments}
                  </span>
                  <span className="stat-badge">
                    <FiEye /> {post.views}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorAnalytics;
