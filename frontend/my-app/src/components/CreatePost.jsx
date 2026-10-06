import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "./CreatePost.css";
import axios from "axios";
import {
  FiLayers,
  FiPlus,
  FiTrash2,
  FiX,
  FiCheck,
  FiRepeat,
  FiImage,
  FiUploadCloud
} from "react-icons/fi";
import { BsPaletteFill } from "react-icons/bs";

function CreatePost(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Primary post fields
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [postType, setPostType] = useState("Artwork");
  const [preview, setPreview] = useState(null);
  const [target, setTarget] = useState("public");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef(null);

  // Creative Feature 1: Process / WIP thread builder
  const [enableProcessThread, setEnableProcessThread] = useState(false);
  const [processSteps, setProcessSteps] = useState([]);

  // Creative Feature 2: Remix / Respond mode
  const [remixParent, setRemixParent] = useState(null);
  const [remixType, setRemixType] = useState("Style Interpretation");

  const remixTypes = [
    "Style Interpretation",
    "Color Palette Study",
    "Conceptual Response",
    "3D / Motion Spin",
    "Creative Continuation"
  ];

  const phasePresets = [
    "01. Ideation & Rough Sketch",
    "02. Composition & Blockout",
    "03. Color & Value Study",
    "04. Detailing & Texturing",
    "05. Lighting & Post-Processing"
  ];

  // Check if navigating in with a remix post
  useEffect(() => {
    if (location.state?.remixPost) {
      setRemixParent(location.state.remixPost);
    } else {
      const remixId = searchParams.get("remixOf");
      if (remixId) {
        axios
          .get(`http://localhost:9000/posts/${remixId}`, { withCredentials: true })
          .then((res) => {
            if (res.data.post) setRemixParent(res.data.post);
          })
          .catch((err) => console.log("Failed to load remix parent:", err));
      }
    }
  }, [location.state, searchParams]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Process Step handlers
  const handleAddProcessStep = () => {
    if (processSteps.length >= 5) {
      alert("You can add up to 5 process steps per post.");
      return;
    }
    const nextIndex = processSteps.length;
    const defaultLabel = phasePresets[nextIndex] || `Step 0${nextIndex + 1}`;
    setProcessSteps([
      ...processSteps,
      {
        id: Date.now(),
        phase_label: defaultLabel,
        caption: "",
        file: null,
        preview: null,
      },
    ]);
  };

  const handleProcessStepFile = (index, e) => {
    const stepFile = e.target.files[0];
    if (!stepFile) return;

    const updated = [...processSteps];
    updated[index].file = stepFile;
    updated[index].preview = URL.createObjectURL(stepFile);
    setProcessSteps(updated);
  };

  const handleProcessStepChange = (index, field, value) => {
    const updated = [...processSteps];
    updated[index][field] = value;
    setProcessSteps(updated);
  };

  const handleRemoveProcessStep = (index) => {
    const updated = processSteps.filter((_, i) => i !== index);
    setProcessSteps(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !caption.trim() || !target.trim()) {
      setMessage("Please add an image, caption, and select an audience.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("postType", postType);
      formData.append("target", target);
      formData.append("file_url", file);
      formData.append("tags", JSON.stringify(tags));

      // Append Remix info if active
      if (remixParent) {
        formData.append("remix_of", remixParent._id);
        formData.append("remix_type", remixType);
      }

      // Append Process steps if active
      if (enableProcessThread && processSteps.length > 0) {
        const meta = [];
        let validFileIndex = 0;

        processSteps.forEach((step, idx) => {
          if (step.file) {
            formData.append(`process_step_${validFileIndex}`, step.file);
            meta.push({
              step_number: validFileIndex + 1,
              phase_label: step.phase_label,
              caption: step.caption,
            });
            validFileIndex++;
          }
        });

        if (meta.length > 0) {
          formData.append("process_steps_meta", JSON.stringify(meta));
        }
      }

      setIsUploading(true);
      setMessage("");

      await axios.post("http://localhost:9000/post", formData, {
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setIsUploading(false);
      setUploadComplete(true);
      setMessage("Creative piece published successfully!");

      if (props.setRefreshTrigger) {
        props.setRefreshTrigger((prev) => prev + 1);
      }

      setTimeout(() => {
        navigate("/feed");
      }, 1200);
    } catch (err) {
      setIsUploading(false);
      console.error(err);
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  return (
    <div className={props.mode ? "dark-create-post-container" : "create-post-container"}>
      <div className="post-header">
        <h2>{remixParent ? "Remix & Respond" : "Create New Post"}</h2>
        <p className="post-subtitle">
          {remixParent
            ? "Put your creative spin on an existing community creation"
            : "Share finished art, sketches, and full work-in-progress workflows"}
        </p>
      </div>

      {/* Remix Reference Card (if active) */}
      {remixParent && (
        <div className="remix-active-card">
          <div className="remix-active-header">
            <span className="remix-pill-label">
              <BsPaletteFill /> Remixing Creation
            </span>
            <button
              type="button"
              className="remix-cancel-btn"
              onClick={() => setRemixParent(null)}
            >
              <FiX /> Cancel Remix
            </button>
          </div>

          <div className="remix-active-body">
            <img
              src={`http://localhost:9000${remixParent.file_url}`}
              alt="Original work"
              className="remix-original-thumb"
            />
            <div className="remix-original-info">
              <h4>Original by @{remixParent.username}</h4>
              <p className="remix-original-caption">"{remixParent.caption}"</p>

              <div className="remix-type-selector">
                <label>Choose your response flavor:</label>
                <div className="remix-chip-options">
                  {remixTypes.map((type) => (
                    <button
                      type="button"
                      key={type}
                      className={`remix-flavor-chip ${remixType === type ? "active" : ""}`}
                      onClick={() => setRemixType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-grid">
          {/* Left Column: Metadata & Details */}
          <div className="form-column left-column">
            <div className="form-section">
              <label className="form-label">Creative Discipline / Category</label>
              <input
                type="text"
                placeholder="e.g. Digital Illustration, 3D Art, UI Design..."
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">Caption & Creative Story</label>
              <textarea
                placeholder="Describe your piece, inspirations, tools used, or challenges overcome..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="form-textarea"
                rows="4"
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">Audience & Visibility</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="form-select"
              >
                <option value="public">🌍 Public (Community & Feed)</option>
                <option value="private">🔒 Private (Only Me)</option>
              </select>
            </div>

            <div className="form-section">
              <label className="form-label">Tags & Mediums</label>
              <input
                type="text"
                placeholder="Type and press Enter to add tags (e.g. #blender, #sketch)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = tagInput.trim().replace(/^#/, "");
                    if (value && !tags.includes(value)) {
                      setTags([...tags, value]);
                      setTagInput("");
                    }
                  }
                }}
                className="form-input"
              />

              {tags.length > 0 && (
                <div className="tags-container">
                  {tags.map((tag, index) => (
                    <span key={index} className="tag-chip">
                      #{tag}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle Process / WIP Shots */}
            <div className="form-section process-toggle-section">
              <div
                className={`process-feature-toggle ${enableProcessThread ? "enabled" : ""}`}
                onClick={() => {
                  const nextState = !enableProcessThread;
                  setEnableProcessThread(nextState);
                  if (nextState && processSteps.length === 0) {
                    handleAddProcessStep();
                  }
                }}
              >
                <div className="process-toggle-left">
                  <FiLayers className="toggle-icon" />
                  <div>
                    <span className="toggle-title">Attach Process "Making-Of" Thread</span>
                    <p className="toggle-desc">
                      Let viewers swipe through your sketches, layers, and WIP milestones
                    </p>
                  </div>
                </div>
                <div className={`switch-knob ${enableProcessThread ? "on" : "off"}`}>
                  <span />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Final Image & Process Steps */}
          <div className="form-column right-column">
            <div className="upload-section">
              <label className="form-label">Final Artwork / Master Piece *</label>

              {!preview ? (
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                    ref={fileInputRef}
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="file-input-label">
                    <div className="upload-icon">📷</div>
                    <p className="upload-text">Click to upload final artwork</p>
                    <p className="upload-hint">PNG, JPG, WebP up to 15MB</p>
                  </label>
                </div>
              ) : (
                <div className="preview-container">
                  <img src={preview} alt="Preview" className="preview-image" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={handleRemoveFile}
                  >
                    ✕ Remove Image
                  </button>
                </div>
              )}
            </div>

            {/* Process / WIP Steps List */}
            {enableProcessThread && (
              <div className="process-steps-builder">
                <div className="builder-header">
                  <div className="builder-title-row">
                    <FiLayers />
                    <span>Work-In-Progress Steps ({processSteps.length}/5)</span>
                  </div>
                  {processSteps.length < 5 && (
                    <button
                      type="button"
                      className="add-step-btn"
                      onClick={handleAddProcessStep}
                    >
                      <FiPlus /> Add Step
                    </button>
                  )}
                </div>

                <div className="steps-list">
                  {processSteps.map((step, index) => (
                    <div key={step.id} className="step-builder-card">
                      <div className="step-card-header">
                        <span className="step-number-tag">WIP #{index + 1}</span>
                        <input
                          type="text"
                          value={step.phase_label}
                          onChange={(e) =>
                            handleProcessStepChange(index, "phase_label", e.target.value)
                          }
                          placeholder="Phase name (e.g. Lineart, Color)"
                          className="step-phase-input"
                        />
                        <button
                          type="button"
                          className="step-delete-btn"
                          onClick={() => handleRemoveProcessStep(index)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      <div className="step-card-content">
                        <div className="step-upload-box">
                          {step.preview ? (
                            <div className="step-preview-thumb">
                              <img src={step.preview} alt={`Step ${index + 1}`} />
                              <label
                                htmlFor={`step-file-${step.id}`}
                                className="step-change-overlay"
                              >
                                Change
                              </label>
                            </div>
                          ) : (
                            <label
                              htmlFor={`step-file-${step.id}`}
                              className="step-file-picker"
                            >
                              <FiUploadCloud />
                              <span>Select Shot</span>
                            </label>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            id={`step-file-${step.id}`}
                            style={{ display: "none" }}
                            onChange={(e) => handleProcessStepFile(index, e)}
                          />
                        </div>

                        <input
                          type="text"
                          value={step.caption}
                          onChange={(e) =>
                            handleProcessStepChange(index, "caption", e.target.value)
                          }
                          placeholder="Brief note about this stage (optional)..."
                          className="step-note-input"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(isUploading || uploadComplete) && (
              <div className="progress-wrapper">
                {isUploading && (
                  <div className="progress-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <span className="progress-label">{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {uploadComplete && (
                  <div className="success-message">
                    <span className="success-icon">✓</span>
                    <span>Piece published successfully!</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={isUploading || !file}
            >
              {isUploading ? (
                <>
                  <span className="btn-spinner"></span>
                  Uploading Creation & Workflow...
                </>
              ) : (
                <>
                  <span>✨</span>
                  {remixParent ? "Publish Remix Piece" : "Publish Creation"}
                </>
              )}
            </button>
          </div>
        </div>

        {message && !uploadComplete && (
          <div
            className={`alert ${
              message.includes("success") ? "alert-success" : "alert-error"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default CreatePost;
