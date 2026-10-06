import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Click.css";
import {
  FiZap,
  FiCamera,
  FiRefreshCw,
  FiSend,
  FiClock,
  FiGrid,
  FiSun,
  FiSliders,
  FiCheck
} from "react-icons/fi";
import { BsStars } from "react-icons/bs";

const Click = ({ mode, onClose, onUpload }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rawImageRef = useRef(null); // Stores captured raw frame for live re-editing

  const [caption, setCaption] = useState("");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFlashStory, setIsFlashStory] = useState(true);

  // Photo Editor Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [selectedFilter, setSelectedFilter] = useState("normal");

  // Creator Webcam Tools: Grid Overlay & Countdown Timer
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0); // 0 (Instant), 3, or 5
  const [countdown, setCountdown] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);

  const filters = [
    { id: "normal", name: "Normal", filter: "" },
    { id: "vibrant", name: "Vibrant", filter: "saturate(1.6)" },
    { id: "noir", name: "Noir (B&W)", filter: "grayscale(1)" },
    { id: "cyber", name: "Cyberpunk", filter: "hue-rotate(180deg) saturate(1.8)" },
    { id: "warm", name: "Warm Sun", filter: "sepia(0.35) saturate(1.4)" },
    { id: "pastel", name: "Pastel Dream", filter: "hue-rotate(-25deg) saturate(1.2)" },
    { id: "emerald", name: "Emerald", filter: "hue-rotate(90deg) saturate(1.3)" }
  ];

  const getCombinedFilterString = () => {
    const preset = filters.find((f) => f.id === selectedFilter);
    const basePreset = preset && preset.filter ? `${preset.filter} ` : "";
    return `${basePreset}brightness(${brightness}%) contrast(${contrast}%)`.trim();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStarted(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera. Please allow webcam permission in your browser.");
    }
  };

  const executePhotoSnap = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!video || !canvas) return;

    // Flash effect trigger
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 300);

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Save raw original snapshot for live post-capture editing
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext("2d");
    offCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    rawImageRef.current = offscreen;

    // Draw filtered output
    ctx.filter = getCombinedFilterString();
    ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);

    setPhotoTaken(true);

    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  // Re-apply live editor adjustments after photo has been taken
  useEffect(() => {
    if (photoTaken && rawImageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = getCombinedFilterString();
      ctx.drawImage(rawImageRef.current, 0, 0, canvas.width, canvas.height);
    }
  }, [brightness, contrast, selectedFilter, photoTaken]);

  const handleCaptureClick = () => {
    if (!cameraStarted) {
      startCamera();
      return;
    }

    if (timerDuration > 0) {
      let count = timerDuration;
      setCountdown(count);
      const timer = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(timer);
          setCountdown(null);
          executePhotoSnap();
        }
      }, 1000);
    } else {
      executePhotoSnap();
    }
  };

  const retakePhoto = () => {
    setPhotoTaken(false);
    setCameraStarted(false);
    setCaption("");
    rawImageRef.current = null;
    startCamera();
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSelectedFilter("normal");
  };

  const handleSubmit = async () => {
    if (!photoTaken) return;

    try {
      setIsUploading(true);
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/png");

      if (isFlashStory) {
        // Publish as 24-hour Ephemeral Flash Post
        await axios.post(
          "http://localhost:9000/flash",
          {
            image_data: imageData,
            caption: caption || "Captured via Luminix Camera",
            filter: selectedFilter,
          },
          { withCredentials: true }
        );
      } else {
        // Upload as regular post
        const blob = await (await fetch(imageData)).blob();
        const formData = new FormData();
        formData.append("file_url", blob, "camera-shot.png");
        formData.append("caption", caption || "Camera Snap");
        formData.append("target", "public");

        await axios.post("http://localhost:9000/post", formData, {
          withCredentials: true,
        });
      }

      setIsUploading(false);
      if (onUpload) onUpload();
      if (onClose) onClose();
      navigate("/feed");
    } catch (err) {
      setIsUploading(false);
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Failed to publish capture");
    }
  };

  return (
    <div className={mode ? "dark-camera-container" : "camera-container"}>
      {/* Header */}
      <div className="camera-header">
        <div className="camera-badge-pill">
          <BsStars /> Creator Camera & Photo Studio
        </div>
        <h2>{isFlashStory ? "⚡ Ephemeral 24h Flash" : "📷 Instant Studio Post"}</h2>
        <p className="camera-subtitle">
          {isFlashStory
            ? "Live capture with custom filters, grid overlay & countdown timer"
            : "Share a live creation directly to the community feed"}
        </p>
      </div>

      {/* Camera / Photo Canvas Viewport */}
      <div className="camera-preview">
        {/* Flash Effect on Snapping */}
        {flashEffect && <div className="camera-flash-overlay" />}

        {/* Big Countdown Number Overlay */}
        {countdown !== null && (
          <div className="camera-countdown-overlay">
            <span className="countdown-number">{countdown}</span>
            <span className="countdown-subtext">Smile! 📸</span>
          </div>
        )}

        {/* 3x3 Rule-of-Thirds Grid Overlay */}
        {showGridOverlay && (
          <div className="rule-of-thirds-grid">
            <div className="grid-line horizontal-1" />
            <div className="grid-line horizontal-2" />
            <div className="grid-line vertical-1" />
            <div className="grid-line vertical-2" />
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ filter: getCombinedFilterString() }}
          className={`camera-video ${photoTaken ? "hidden" : ""}`}
        />

        <canvas
          ref={canvasRef}
          className={`camera-canvas ${!photoTaken ? "hidden" : ""}`}
        />

        {!cameraStarted && !photoTaken && (
          <div className="camera-placeholder">
            <div className="camera-icon">📷</div>
            <p>Click "Start Camera" to access viewfinder</p>
          </div>
        )}
      </div>

      {/* Creator Webcam Toolbar: Timer & Rule-of-Thirds Grid */}
      {!photoTaken && cameraStarted && (
        <div className="creator-toolbar-strip">
          <div className="toolbar-group">
            <span className="toolbar-label">
              <FiClock /> Timer:
            </span>
            <div className="timer-pill-buttons">
              <button
                type="button"
                className={`timer-pill ${timerDuration === 0 ? "active" : ""}`}
                onClick={() => setTimerDuration(0)}
              >
                Off
              </button>
              <button
                type="button"
                className={`timer-pill ${timerDuration === 3 ? "active" : ""}`}
                onClick={() => setTimerDuration(3)}
              >
                3s
              </button>
              <button
                type="button"
                className={`timer-pill ${timerDuration === 5 ? "active" : ""}`}
                onClick={() => setTimerDuration(5)}
              >
                5s
              </button>
            </div>
          </div>

          <div className="toolbar-group">
            <button
              type="button"
              className={`grid-toggle-btn ${showGridOverlay ? "active" : ""}`}
              onClick={() => setShowGridOverlay(!showGridOverlay)}
              title="Toggle Rule-of-Thirds Composition Grid"
            >
              <FiGrid />
              <span>3x3 Grid {showGridOverlay ? "On" : "Off"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Photo Studio Editor Controls (Sliders for Brightness & Contrast) */}
      {(cameraStarted || photoTaken) && (
        <div className="photo-editor-panel">
          <div className="editor-panel-header">
            <span className="editor-panel-title">
              <FiSliders /> Photo Adjustments & Aesthetic Filters
            </span>
            {(brightness !== 100 || contrast !== 100 || selectedFilter !== "normal") && (
              <button
                type="button"
                className="reset-adjustments-btn"
                onClick={resetAdjustments}
              >
                Reset
              </button>
            )}
          </div>

          {/* Brightness & Contrast Sliders */}
          <div className="sliders-row">
            <div className="slider-control">
              <div className="slider-header">
                <span className="slider-label">
                  <FiSun /> Brightness
                </span>
                <span className="slider-value">{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="180"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="range-slider"
              />
            </div>

            <div className="slider-control">
              <div className="slider-header">
                <span className="slider-label">
                  <FiSliders /> Contrast
                </span>
                <span className="slider-value">{contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="180"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="range-slider"
              />
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="camera-filters-bar">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`filter-chip ${selectedFilter === f.id ? "active" : ""}`}
                onClick={() => setSelectedFilter(f.id)}
              >
                {selectedFilter === f.id && <FiCheck className="chip-check" />}
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Snap / Retake Controls */}
      {!photoTaken && (
        <div className="camera-controls">
          {!cameraStarted ? (
            <button className="camera-btn primary" onClick={startCamera}>
              <span>📹</span> Start Camera
            </button>
          ) : (
            <button
              className="camera-btn primary snap-btn"
              onClick={handleCaptureClick}
              disabled={countdown !== null}
            >
              <span>📸</span>
              {timerDuration > 0
                ? `Capture (${timerDuration}s Timer)`
                : "Capture Photo"}
            </button>
          )}
        </div>
      )}

      {/* Post-Capture Publishing Form */}
      {photoTaken && (
        <div className="photo-form">
          <div className="form-group flash-toggle-group">
            <label className="flash-radio-label">
              <input
                type="checkbox"
                checked={isFlashStory}
                onChange={(e) => setIsFlashStory(e.target.checked)}
              />
              <span className="flash-option-text">
                <FiZap /> Post as <strong>24h Ephemeral Flash</strong> (Top Story Bar)
              </span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Caption</label>
            <textarea
              className="form-textarea"
              placeholder="Add a thought or mood to this shot..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
            />
          </div>

          <div className="form-actions">
            <button
              className="camera-btn secondary"
              onClick={retakePhoto}
              disabled={isUploading}
            >
              <FiRefreshCw /> Retake
            </button>
            <button
              className="camera-btn primary"
              onClick={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="btn-spinner"></span> Publishing...
                </>
              ) : (
                <>
                  <FiSend /> {isFlashStory ? "Post 24h Flash" : "Upload Post"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Click;