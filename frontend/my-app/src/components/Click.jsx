import React, { useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Click.css";
import { FiZap, FiCamera, FiRefreshCw, FiSend } from "react-icons/fi";

const Click = ({ mode, onClose, onUpload }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [caption, setCaption] = useState("");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFlashStory, setIsFlashStory] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("normal");

  const filters = [
    { id: "normal", name: "Normal", filter: "none" },
    { id: "vibrant", name: "Vibrant", filter: "saturate(1.6) contrast(1.1)" },
    { id: "noir", name: "Noir", filter: "grayscale(1) contrast(1.2)" },
    { id: "cyber", name: "Cyberpunk", filter: "hue-rotate(180deg) saturate(1.5)" },
    { id: "warm", name: "Warm Sun", filter: "sepia(0.3) saturate(1.4)" },
  ];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStarted(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera. Please allow webcam permission.");
    }
  };

  const takePhoto = () => {
    if (!cameraStarted) {
      alert("Please start the camera first");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const chosenFilter = filters.find((f) => f.id === selectedFilter);
    ctx.filter = chosenFilter ? chosenFilter.filter : "none";

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoTaken(true);

    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const retakePhoto = () => {
    setPhotoTaken(false);
    setCameraStarted(false);
    setCaption("");
    startCamera();
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
      <div className="camera-header">
        <h2>{isFlashStory ? "⚡ Ephemeral 24h Flash" : "📷 Instant Camera Post"}</h2>
        <p className="camera-subtitle">
          {isFlashStory
            ? "Capture a moment that vanishes after 24 hours via MongoDB TTL"
            : "Share a live photo with the community"}
        </p>
      </div>

      <div className="camera-preview">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`camera-video ${photoTaken ? "hidden" : ""}`}
        />
        <canvas
          ref={canvasRef}
          className={`camera-canvas ${!photoTaken ? "hidden" : ""}`}
        />

        {!cameraStarted && !photoTaken && (
          <div className="camera-placeholder">
            <div className="camera-icon">📷</div>
            <p>Click "Start Camera" to capture</p>
          </div>
        )}
      </div>

      {/* Filter Chips Bar */}
      {!photoTaken && cameraStarted && (
        <div className="camera-filters-bar">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${selectedFilter === f.id ? "active" : ""}`}
              onClick={() => setSelectedFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {!photoTaken && (
        <div className="camera-controls">
          {!cameraStarted ? (
            <button className="camera-btn primary" onClick={startCamera}>
              <span>📹</span> Start Camera
            </button>
          ) : (
            <button className="camera-btn primary" onClick={takePhoto}>
              <span>📸</span> Take Photo
            </button>
          )}
        </div>
      )}

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
                <FiZap /> Post as <strong>24h Ephemeral Flash</strong> (Story Bar)
              </span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Caption</label>
            <textarea
              className="form-textarea"
              placeholder="What's happening right now?..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
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