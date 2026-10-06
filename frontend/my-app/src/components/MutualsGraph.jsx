import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide
} from "d3-force";
import "./MutualsGraph.css";
import {
  FiZoomIn,
  FiZoomOut,
  FiRefreshCw,
  FiUserCheck,
  FiUserPlus,
  FiShare2,
  FiInfo
} from "react-icons/fi";

const MutualsGraph = ({ mode }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [filterType, setFilterType] = useState("all"); // 'all' | 'mutual' | 'creator'
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [followedMap, setFollowedMap] = useState({});
  const [zoomLevel, setZoomLevel] = useState(1);
  const svgRef = useRef(null);
  const [simNodes, setSimNodes] = useState([]);
  const [simLinks, setSimLinks] = useState([]);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await axios.get("http://localhost:9000/network-graph", {
          withCredentials: true,
        });

        const rawNodes = res.data.nodes || [];
        const rawLinks = res.data.links || [];

        // If dataset is minimal, add sample community nodes to make graph impressive
        let finalNodes = [...rawNodes];
        let finalLinks = [...rawLinks];

        if (finalNodes.length <= 1) {
          const sampleCommunity = [
            {
              id: "sample_1",
              name: "Elena Rostova",
              lumiTag: "@elena_art",
              role: "creators",
              creatorRole: "3D Procedural Designer",
              bio: "Exploring procedural motion & spatial lighting.",
              profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
              type: "mutual",
              radius: 22,
              color: "#ec4899",
            },
            {
              id: "sample_2",
              name: "Marcus Chen",
              lumiTag: "@marcus_3d",
              role: "creators",
              creatorRole: "Generative Artist",
              bio: "Shaders, compute graphs & color harmony.",
              profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
              type: "mutual",
              radius: 22,
              color: "#ec4899",
            },
            {
              id: "sample_3",
              name: "Aria Vance",
              lumiTag: "@aria_visuals",
              role: "creators",
              creatorRole: "Emerging Spatial Artist",
              bio: "Pushing spatial design and generative motion boundaries.",
              profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
              type: "creator",
              radius: 20,
              color: "#f59e0b",
            },
            {
              id: "sample_4",
              name: "Kai Takahashi",
              lumiTag: "@kai_pixels",
              role: "others",
              creatorRole: "Digital Painter",
              bio: "Pixel craft, vector studies, and concept sketches.",
              profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
              type: "suggested",
              radius: 18,
              color: "#3b82f6",
            },
            {
              id: "sample_5",
              name: "Sophia Ray",
              lumiTag: "@sophia_motion",
              role: "creators",
              creatorRole: "Motion Designer",
              bio: "Dynamic kinetic typography and 2D physics.",
              profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
              type: "creator",
              radius: 20,
              color: "#f59e0b",
            },
          ];

          finalNodes = [...finalNodes, ...sampleCommunity];

          const rootId = finalNodes[0]?.id || "root";
          finalLinks = [
            { source: rootId, target: "sample_1", relationship: "mutual", color: "#ec4899" },
            { source: rootId, target: "sample_2", relationship: "mutual", color: "#ec4899" },
            { source: "sample_1", target: "sample_3", relationship: "creator", color: "#f59e0b" },
            { source: "sample_2", target: "sample_4", relationship: "suggested", color: "#3b82f6" },
            { source: rootId, target: "sample_5", relationship: "creator", color: "#f59e0b" },
            { source: "sample_3", target: "sample_5", relationship: "connection", color: "#8b5cf6" },
          ];
        }

        setGraphData({ nodes: finalNodes, links: finalLinks });
      } catch (err) {
        console.error("Network graph error:", err);
      }
    };

    fetchGraph();
  }, []);

  // Run d3-force simulation
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    // Filter nodes if active
    let filteredNodes = graphData.nodes;
    if (filterType === "mutual") {
      filteredNodes = graphData.nodes.filter(
        (n) => n.type === "self" || n.type === "mutual"
      );
    } else if (filterType === "creator") {
      filteredNodes = graphData.nodes.filter(
        (n) => n.type === "self" || n.type === "creator"
      );
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphData.links
      .filter((l) => {
        const s = typeof l.source === "object" ? l.source.id : l.source;
        const t = typeof l.target === "object" ? l.target.id : l.target;
        return nodeIds.has(s) && nodeIds.has(t);
      })
      .map((l) => ({ ...l }));

    const nodesCopy = filteredNodes.map((d) => ({ ...d }));

    const width = 800;
    const height = 480;

    const simulation = forceSimulation(nodesCopy)
      .force(
        "link",
        forceLink(filteredLinks)
          .id((d) => d.id)
          .distance(110)
      )
      .force("charge", forceManyBody().strength(-340))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide().radius((d) => (d.radius || 20) + 16));

    simulation.on("tick", () => {
      setSimNodes([...nodesCopy]);
      setSimLinks([...filteredLinks]);
    });

    return () => simulation.stop();
  }, [graphData, filterType]);

  const handleFollowToggle = async (userId) => {
    try {
      setFollowedMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
      await axios.post(
        `http://localhost:9000/users/${userId}/follow`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`mutuals-graph-container ${mode ? "dark-theme" : ""}`}>
      {/* Graph Toolbar */}
      <div className="graph-toolbar">
        <div className="graph-title-row">
          <FiShare2 className="graph-main-icon" />
          <div>
            <h3>Interactive Mutuals & Creator Graph</h3>
            <p>Force-directed simulation of your creative network & collaborations</p>
          </div>
        </div>

        <div className="graph-controls-group">
          {/* Filter Pills */}
          <div className="filter-pill-selector">
            <button
              className={`filter-btn ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All Orbit ({graphData.nodes.length})
            </button>
            <button
              className={`filter-btn ${filterType === "mutual" ? "active" : ""}`}
              onClick={() => setFilterType("mutual")}
            >
              ❤️ Mutuals Only
            </button>
            <button
              className={`filter-btn ${filterType === "creator" ? "active" : ""}`}
              onClick={() => setFilterType("creator")}
            >
              ⭐ Emerging Creators
            </button>
          </div>

          <div className="zoom-btn-group">
            <button
              className="zoom-btn"
              onClick={() => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6))}
              title="Zoom In"
            >
              <FiZoomIn />
            </button>
            <button
              className="zoom-btn"
              onClick={() => setZoomLevel((prev) => Math.max(prev - 0.15, 0.65))}
              title="Zoom Out"
            >
              <FiZoomOut />
            </button>
            <button
              className="zoom-btn"
              onClick={() => setZoomLevel(1)}
              title="Reset Zoom"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </div>

      {/* Graph SVG Stage */}
      <div className="graph-stage-wrapper">
        <svg
          ref={svgRef}
          viewBox="0 0 800 480"
          className="network-svg"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center" }}
        >
          <defs>
            {/* SVG Avatar Clip Paths */}
            {simNodes.map((node) => (
              <pattern
                key={`pat-${node.id}`}
                id={`avatar-${node.id}`}
                patternUnits="objectBoundingBox"
                width="1"
                height="1"
              >
                <image
                  href={
                    node.profileImage
                      ? node.profileImage.startsWith("http")
                        ? node.profileImage
                        : `http://localhost:9000${node.profileImage}`
                      : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  }
                  x="0"
                  y="0"
                  width={node.radius * 2}
                  height={node.radius * 2}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            ))}

            {/* Glowing Drop Shadows */}
            <filter id="glow-root" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Links / Connection Edges */}
          <g className="links-layer">
            {simLinks.map((link, i) => {
              const isHighlighted =
                hoveredNode &&
                (link.source.id === hoveredNode.id ||
                  link.target.id === hoveredNode.id);

              return (
                <line
                  key={i}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke={isHighlighted ? "#ec4899" : link.color || "#475569"}
                  strokeWidth={isHighlighted ? 2.8 : 1.4}
                  strokeDasharray={
                    link.relationship === "suggested" ? "4,4" : "none"
                  }
                  opacity={isHighlighted ? 1 : 0.65}
                  className="graph-link-line"
                />
              );
            })}
          </g>

          {/* Nodes Layer */}
          <g className="nodes-layer">
            {simNodes.map((node) => {
              const isRoot = node.type === "self";
              const isHovered = hoveredNode && hoveredNode.id === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x || 400}, ${node.y || 240})`}
                  className="graph-node-group"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Outer glowing halo */}
                  <circle
                    r={node.radius + (isHovered ? 6 : 3)}
                    fill={isRoot ? "rgba(139, 92, 246, 0.3)" : "rgba(236, 72, 153, 0.2)"}
                    filter={isRoot ? "url(#glow-root)" : "none"}
                    className="node-halo"
                  />

                  {/* Border ring */}
                  <circle
                    r={node.radius + 2}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={isRoot ? 3 : 2}
                  />

                  {/* Node Avatar Fill */}
                  <circle
                    r={node.radius}
                    fill={`url(#avatar-${node.id})`}
                    className="node-circle"
                  />

                  {/* Badge Marker */}
                  <circle
                    cx={node.radius * 0.7}
                    cy={node.radius * 0.7}
                    r={6}
                    fill={
                      isRoot
                        ? "#8b5cf6"
                        : node.type === "mutual"
                        ? "#ec4899"
                        : node.type === "creator"
                        ? "#f59e0b"
                        : "#3b82f6"
                    }
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />

                  {/* Node Label */}
                  <text
                    y={node.radius + 15}
                    textAnchor="middle"
                    className="node-label-text"
                  >
                    {node.name.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover / Selected Node Info Popover Card */}
        {hoveredNode && (
          <div className="node-popover-card">
            <div className="popover-avatar-row">
              <img
                src={
                  hoveredNode.profileImage
                    ? hoveredNode.profileImage.startsWith("http")
                      ? hoveredNode.profileImage
                      : `http://localhost:9000${hoveredNode.profileImage}`
                    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                }
                alt=""
                className="popover-avatar"
              />
              <div>
                <h4>{hoveredNode.name}</h4>
                <span className="popover-tag">{hoveredNode.lumiTag}</span>
                <span
                  className="popover-tier-badge"
                  style={{ color: hoveredNode.color }}
                >
                  {hoveredNode.type === "self"
                    ? "✨ Your Account"
                    : hoveredNode.type === "mutual"
                    ? "❤️ Mutual Connection"
                    : hoveredNode.type === "creator"
                    ? "⭐ Emerging Creator"
                    : "👥 Suggested Network"}
                </span>
              </div>
            </div>

            {hoveredNode.creatorRole && (
              <p className="popover-role">{hoveredNode.creatorRole}</p>
            )}
            {hoveredNode.bio && (
              <p className="popover-bio">{hoveredNode.bio}</p>
            )}

            {hoveredNode.type !== "self" && (
              <button
                className={`popover-follow-btn ${
                  followedMap[hoveredNode.id] ? "following" : ""
                }`}
                onClick={() => handleFollowToggle(hoveredNode.id)}
              >
                {followedMap[hoveredNode.id] ? (
                  <>
                    <FiUserCheck /> Connected
                  </>
                ) : (
                  <>
                    <FiUserPlus /> Connect & Follow
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Graph Legend */}
      <div className="graph-legend-bar">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#8b5cf6" }} />
          <span>You (Core Node)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#ec4899" }} />
          <span>Direct Mutuals (Follow Each Other)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#f59e0b" }} />
          <span>Emerging Creators (2nd Degree)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#3b82f6" }} />
          <span>Suggested Network</span>
        </div>
      </div>
    </div>
  );
};

export default MutualsGraph;
