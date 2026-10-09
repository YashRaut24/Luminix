import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import socket from "../socket";
import {
  FiEdit3,
  FiTrash2,
  FiDownload,
  FiShare2,
  FiUsers,
  FiCheck,
  FiSquare
} from "react-icons/fi";
import { LuEraser } from "react-icons/lu";
import "./LiveSketchRoom.css";

const PALETTE = [
  "#111827", // Black / Ink
  "#6366f1", // Indigo Accent
  "#ef4444", // Red
  "#10b981", // Emerald Green
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#ffffff", // White
];

function LiveSketchRoom({ user, mode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomId = searchParams.get("room") || "studio-alpha";

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  // Tool states
  const [tool, setTool] = useState("pen"); // "pen" | "eraser"
  const [color, setColor] = useState("#6366f1");
  const [strokeSize, setStrokeSize] = useState(4);
  const [activeUsers, setActiveUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Redraw helper
  const drawLine = (x0, y0, x1, y1, strokeColor, size, isEraser = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size;

    if (isEraser) {
      ctx.strokeStyle = "#ffffff";
    } else {
      ctx.strokeStyle = strokeColor;
    }

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  };

  // Setup canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Socket Connection and Event Listeners
  useEffect(() => {
    const userInfo = {
      id: user?._id || user?.id || `anon-${Math.random().toString(36).slice(2, 6)}`,
      name: user?.name || "Guest Creator",
      profileImage: user?.profileImage || "",
    };

    socket.emit("join_sketch_room", { roomId, user: userInfo });

    const handleRoomInit = (data) => {
      setActiveUsers(data.users || []);
      if (data.selfColor) setColor(data.selfColor);

      // Replay existing strokes for newly joined creator
      if (data.strokes && data.strokes.length > 0) {
        data.strokes.forEach((s) => {
          drawLine(s.x0, s.y0, s.x1, s.y1, s.color, s.size, s.isEraser);
        });
      }
    };

    const handleRoomUsers = (users) => {
      setActiveUsers(users || []);
    };

    const handleRemoteStroke = (stroke) => {
      drawLine(
        stroke.x0,
        stroke.y0,
        stroke.x1,
        stroke.y1,
        stroke.color,
        stroke.size,
        stroke.isEraser
      );
    };

    const handleRemoteClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleRemoteCursor = (cursor) => {
      if (!cursor.user) return;
      setRemoteCursors((prev) => ({
        ...prev,
        [cursor.user.id]: cursor,
      }));
    };

    socket.on("sketch_room_init", handleRoomInit);
    socket.on("sketch_room_users", handleRoomUsers);
    socket.on("sketch_stroke", handleRemoteStroke);
    socket.on("sketch_clear", handleRemoteClear);
    socket.on("sketch_cursor", handleRemoteCursor);

    return () => {
      socket.emit("leave_sketch_room", { roomId });
      socket.off("sketch_room_init", handleRoomInit);
      socket.off("sketch_room_users", handleRoomUsers);
      socket.off("sketch_stroke", handleRemoteStroke);
      socket.off("sketch_clear", handleRemoteClear);
      socket.off("sketch_cursor", handleRemoteCursor);
    };
  }, [roomId, user]);

  // Drawing event handlers
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    isDrawing.current = true;
    const { x, y } = getCanvasCoords(e);
    lastPoint.current = { x, y };
  };

  const handlePointerMove = (e) => {
    const { x, y } = getCanvasCoords(e);

    // Broadcast cursor position to collaborators
    socket.emit("sketch_cursor", {
      roomId,
      cursor: {
        x,
        y,
        user: {
          id: user?._id || user?.id || socket.id,
          name: user?.name || "Creator",
        },
        color,
      },
    });

    if (!isDrawing.current) return;

    const x0 = lastPoint.current.x;
    const y0 = lastPoint.current.y;
    const x1 = x;
    const y1 = y;

    const isEraser = tool === "eraser";

    // Draw locally
    drawLine(x0, y0, x1, y1, color, strokeSize, isEraser);

    // Broadcast stroke to room
    socket.emit("sketch_stroke", {
      roomId,
      stroke: {
        x0,
        y0,
        x1,
        y1,
        color,
        size: strokeSize,
        isEraser,
      },
    });

    lastPoint.current = { x, y };
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
  };

  const handleClear = () => {
    if (!window.confirm("Clear the shared canvas for everyone in this room?")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    socket.emit("sketch_clear", { roomId });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `luminix-collab-${roomId}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="sketch-room-container">
      {/* Header with Room Info and Presence Strip */}
      <div className="sketch-room-header">
        <div className="sketch-room-info">
          <h2 className="sketch-room-title">
            <FiEdit3 /> Live Sketch Room
          </h2>
          <span className="sketch-room-code-tag">Room: {roomId}</span>
        </div>

        {/* Active Collaborators Presence Strip (2-4 users) */}
        <div className="sketch-presence-bar">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}>
            Collaborators ({activeUsers.length}):
          </span>

          {activeUsers.map((u, idx) => (
            <div key={idx} className="sketch-creator-chip">
              <span
                className="sketch-creator-color-dot"
                style={{ backgroundColor: u.color || "#6366f1" }}
              />
              <span>@{u.name}</span>
            </div>
          ))}

          <button
            type="button"
            className="sketch-share-btn"
            onClick={handleCopyLink}
            title="Copy invite link to share with collaborators"
          >
            {copiedLink ? <><FiCheck /> Copied</> : <><FiShare2 /> Invite</>}
          </button>
        </div>
      </div>

      {/* Workspace: Toolbar + Collaborative Canvas */}
      <div className="sketch-workspace">
        <div className="sketch-toolbar">
          <div className="sketch-tool-group">
            {/* Pen Tool */}
            <button
              type="button"
              className={`sketch-tool-btn ${tool === "pen" ? "active" : ""}`}
              onClick={() => setTool("pen")}
              title="Brush Pen"
            >
              <FiEdit3 />
            </button>

            {/* Eraser Tool */}
            <button
              type="button"
              className={`sketch-tool-btn ${tool === "eraser" ? "active" : ""}`}
              onClick={() => setTool("eraser")}
              title="Eraser"
            >
              <LuEraser />
            </button>

            {/* Stroke Width Slider */}
            <input
              type="range"
              min="2"
              max="28"
              value={strokeSize}
              onChange={(e) => setStrokeSize(parseInt(e.target.value, 10))}
              className="sketch-size-slider"
              title="Stroke Width"
            />
            <span className="sketch-size-label">{strokeSize}px</span>
          </div>

          {/* Color Palette Swatches */}
          <div className="sketch-swatch-picker">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={`sketch-swatch ${color === c && tool === "pen" ? "active" : ""}`}
                style={{ backgroundColor: c, border: c === "#ffffff" ? "1px solid var(--rule)" : undefined }}
                onClick={() => {
                  setColor(c);
                  setTool("pen");
                }}
              />
            ))}
          </div>

          {/* Canvas Actions */}
          <div className="sketch-tool-group">
            <button
              type="button"
              className="sketch-tool-btn"
              onClick={handleClear}
              title="Clear Canvas"
            >
              <FiTrash2 />
            </button>
            <button
              type="button"
              className="sketch-tool-btn"
              onClick={handleDownload}
              title="Download PNG Snapshot"
            >
              <FiDownload />
            </button>
          </div>
        </div>

        {/* Canvas Area with Remote Cursor Overlay */}
        <div className="sketch-canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="sketch-canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />

          {/* Remote Collaborator Pointers */}
          {Object.values(remoteCursors).map((rc) => {
            if (!rc.user || rc.user.id === (user?._id || user?.id || socket.id)) return null;
            return (
              <div
                key={rc.user.id}
                className="sketch-remote-cursor"
                style={{ left: `${rc.x}px`, top: `${rc.y}px` }}
              >
                <div
                  className="sketch-cursor-dot"
                  style={{ backgroundColor: rc.color || "#10b981" }}
                />
                <span className="sketch-cursor-name">{rc.user.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LiveSketchRoom;
