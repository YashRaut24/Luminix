import React, { useRef, useState } from "react";
import axios from "axios";
import "./Click.css";

const Click = ({ mode, onClose, onUpload }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [username, setUsername] = useState("");
  const [caption, setCaption] = useState("");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setCameraStarted(true);
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera");
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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    setPhotoTaken(true);

    video.srcObject.getTracks().forEach(track => track.stop());
  };

  const retakePhoto = () => {
    setPhotoTaken(false);
    setCameraStarted(false);
    setUsername("");
    setCaption("");
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      alert("Post uploaded successfully!");
      setIsUploading(false);
      onUpload && onUpload();
      onClose && onClose();
    }, 1500);
  };

  return (
    <div className={mode ? "dark-camera-container" : "camera-container"}>
      <div className="camera-header">
        <h2>Camera Post</h2>
        <p className="camera-subtitle">Capture and share your moment</p>
      </div>

      <div className="camera-preview">
        <video
          ref={videoRef}
          autoPlay
          className={`camera-video ${photoTaken ? "hidden" : ""}`}
        />
        <canvas
          ref={canvasRef}
          className={`camera-canvas ${!photoTaken ? "hidden" : ""}`}
        />
        
        {!cameraStarted && !photoTaken && (
          <div className="camera-placeholder">
            <div className="camera-icon">📷</div>
            <p>Click "Start Camera" to begin</p>
          </div>
        )}
      </div>

      {!photoTaken && (
        <div className="camera-controls">
          {!cameraStarted ? (
            <button className="camera-btn primary" onClick={startCamera}>
              <span>📹</span>
              Start Camera
            </button>
          ) : (
            <button className="camera-btn primary" onClick={takePhoto}>
              <span>📸</span>
              Take Photo
            </button>
          )}
        </div>
      )}

      {photoTaken && (
        <div className="photo-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Caption</label>
            <textarea
              className="form-textarea"
              placeholder="Write a caption for your photo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button 
              className="camera-btn secondary" 
              onClick={retakePhoto}
              disabled={isUploading}
            >
              <span>🔄</span>
              Retake
            </button>
            <button 
              className="camera-btn primary" 
              onClick={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="btn-spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <span>⬆️</span>
                  Upload Post
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