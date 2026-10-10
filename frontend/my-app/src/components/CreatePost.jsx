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
  FiUploadCloud,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiZap,
  FiClock,
  FiSliders,
  FiVolume2,
  FiBookOpen,
  FiMusic,
  FiTarget,
  FiUsers
} from "react-icons/fi";
import { BsPaletteFill, BsStars } from "react-icons/bs";

function CreatePost(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Primary post fields
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");
  const [postType, setPostType] = useState("Creative");
  const [preview, setPreview] = useState(null);
  const [target, setTarget] = useState("public");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef(null);

  // AI Feature States: Auto-tagging, Captions, Category, Safety Check
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [safetyReport, setSafetyReport] = useState(null);

  // Creator Tool: Post Scheduling (node-cron)
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  // Creative Feature 1: Process / WIP thread builder
  const [enableProcessThread, setEnableProcessThread] = useState(false);
  const [processSteps, setProcessSteps] = useState([]);

  // 6 Creation Types States
  const [creationType, setCreationType] = useState("standard"); // "standard" | "before_after" | "time_capsule"
  const [beforeFile, setBeforeFile] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [beforeLabel, setBeforeLabel] = useState("Original Sketch");
  const [afterLabel, setAfterLabel] = useState("Final Master");

  // Series and Chapters State
  const [enableSeries, setEnableSeries] = useState(false);
  const [seriesName, setSeriesName] = useState("");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [totalChapters, setTotalChapters] = useState(1);

  // Time Capsule State
  const [timeCapsuleDate, setTimeCapsuleDate] = useState("");
  const [timeCapsuleHint, setTimeCapsuleHint] = useState("");

  // Sound Layer State
  const [enableSoundLayer, setEnableSoundLayer] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioTitle, setAudioTitle] = useState("");

  // Feedback & Collaboration States
  const [needsCritique, setNeedsCritique] = useState(false);
  const [critiqueQuestion, setCritiqueQuestion] = useState("");
  const [coAuthorUsername, setCoAuthorUsername] = useState("");

  // Discovery Suite States: Palette, Mood Dial, Tools, Provenance
  const [palette, setPalette] = useState(["#1e293b", "#334155", "#6366f1", "#475569", "#0f172a"]);
  const [moodCalm, setMoodCalm] = useState(50);
  const [moodMinimal, setMoodMinimal] = useState(50);
  const [selectedTools, setSelectedTools] = useState(["Figma"]);
  const [customToolInput, setCustomToolInput] = useState("");
  const [inspiredByPost, setInspiredByPost] = useState(null);

  const availableToolPresets = [
    "Figma",
    "Blender",
    "Procreate",
    "Photoshop",
    "Cinema 4D",
    "After Effects",
    "Illustrator",
    "Unity",
    "Unreal Engine",
    "Spline",
    "TouchDesigner",
    "Midjourney"
  ];

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
      setInspiredByPost(location.state.remixPost);
    } else {
      const remixId = searchParams.get("remixOf");
      if (remixId) {
        axios
          .get(`http://localhost:9000/posts/${remixId}`, { withCredentials: true })
          .then((res) => {
            if (res.data.post) {
              setRemixParent(res.data.post);
              setInspiredByPost(res.data.post);
            }
          })
          .catch((err) => console.log("Failed to load remix parent:", err));
      }
    }
  }, [location.state, searchParams]);

  const extractDominantColors = (imgElement) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const w = (canvas.width = 100);
      const h = (canvas.height = 100);
      ctx.drawImage(imgElement, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const colorCounts = {};

      for (let i = 0; i < data.length; i += 16) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const a = data[i + 3];
        if (a < 128) continue;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      const sorted = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
      const colors = sorted.slice(0, 5);
      const fallbacks = ["#1e293b", "#334155", "#6366f1", "#475569", "#0f172a"];
      while (colors.length < 5) {
        colors.push(fallbacks[colors.length]);
      }
      return colors;
    } catch (err) {
      return ["#1e293b", "#334155", "#6366f1", "#475569", "#0f172a"];
    }
  };

  const triggerAiAnalysis = async (selectedFile, textHint) => {
    if (!selectedFile) return;
    setAiLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:9000/ai/suggest",
        {
          fileName: selectedFile.name,
          captionHint: textHint !== undefined ? textHint : caption,
        },
        { withCredentials: true }
      );
      if (res.data) {
        setAiSuggestions(res.data);
        if (res.data.safety) {
          setSafetyReport(res.data.safety);
        }
      }
    } catch (err) {
      console.error("AI Assistant error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      triggerAiAnalysis(selectedFile, caption);

      // Auto-extract 5 dominant palette colors
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = previewUrl;
      img.onload = () => {
        const extracted = extractDominantColors(img);
        setPalette(extracted);
      };
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setAiSuggestions(null);
    setSafetyReport(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [previewSliderPos, setPreviewSliderPos] = useState(50);

  const handleBeforeFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setBeforeFile(selected);
      setBeforePreview(URL.createObjectURL(selected));
    }
  };

  const handleRemoveBeforeFile = () => {
    setBeforeFile(null);
    setBeforePreview(null);
  };

  const handleAudioChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setAudioFile(selected);
      if (!audioTitle) {
        setAudioTitle(selected.name.replace(/\.[^/.]+$/, ""));
      }
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

    if (creationType === "before_after" && !beforeFile) {
      setMessage("Please choose both a 'Before' (original) and 'After' (final) image for the comparison slider.");
      return;
    }

    if (creationType === "time_capsule" && !timeCapsuleDate) {
      setMessage("Please select a future reveal date and time for the Time Capsule.");
      return;
    }

    if (safetyReport && !safetyReport.isSafe) {
      setMessage(`Upload blocked by Content Safety Shield: ${safetyReport.flags?.join(", ") || "Inappropriate/Toxic content detected."}`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("postType", postType);
      formData.append("target", target);
      formData.append("file_url", file);
      formData.append("tags", JSON.stringify(tags));

      // Resolve creation post_type
      let resolvedPostType = "standard";
      if (creationType === "before_after" && beforeFile) {
        resolvedPostType = "before_after";
      } else if (creationType === "time_capsule" && timeCapsuleDate) {
        resolvedPostType = "time_capsule";
      } else if (enableProcessThread && processSteps.some(s => s.file)) {
        resolvedPostType = "timelapse";
      }
      formData.append("post_type", resolvedPostType);

      // 1. Before / After comparison payload
      if (creationType === "before_after" && beforeFile) {
        formData.append("before_image", beforeFile);
        formData.append("before_label", beforeLabel || "Original Sketch");
        formData.append("after_label", afterLabel || "Final Master");
      }

      // 4. Series & Chapters payload
      if (enableSeries && seriesName.trim()) {
        formData.append("series_name", seriesName.trim());
        formData.append("chapter_number", chapterNumber || 1);
        formData.append("total_chapters", totalChapters || 1);
      }

      // 5. Time Capsule payload
      if (creationType === "time_capsule" && timeCapsuleDate) {
        formData.append("time_capsule_reveal", new Date(timeCapsuleDate).toISOString());
        formData.append("time_capsule_hint", timeCapsuleHint || "");
      }

      // 6. Sound Layer payload
      if (enableSoundLayer && audioFile) {
        formData.append("audio_file", audioFile);
        formData.append("audio_title", audioTitle.trim() || audioFile.name);
      }

      // 7. Critique Mode payload
      if (needsCritique) {
        formData.append("needs_critique", true);
        formData.append("critique_question", critiqueQuestion.trim());
      }

      // 8. Co-Author Invitation payload
      if (coAuthorUsername && coAuthorUsername.trim()) {
        formData.append("co_author_username", coAuthorUsername.trim());
      }

      // 9. Discovery Suite: Palette, Mood Dial, Tools, Provenance
      formData.append("palette", JSON.stringify(palette));
      formData.append("mood_calm_energetic", moodCalm);
      formData.append("mood_minimal_detailed", moodMinimal);
      formData.append("tools", JSON.stringify(selectedTools));
      if (inspiredByPost) {
        formData.append("inspired_by", inspiredByPost._id);
      }

      // Append Scheduled Publish Time if active
      if (isScheduled) {
        if (!scheduledDate) {
          setMessage("Please select a date and time for scheduled publishing.");
          return;
        }
        formData.append("scheduled_for", new Date(scheduledDate).toISOString());
      }

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
      setMessage(
        isScheduled
          ? `Piece scheduled! Node-Cron will publish it on ${new Date(scheduledDate).toLocaleString()}`
          : "Creative piece published successfully!"
      );

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

            {/* Creator Tool: Post Scheduling (node-cron) */}
            <div className="form-section schedule-toggle-section">
              <div
                className={`schedule-feature-toggle ${isScheduled ? "enabled" : ""}`}
                onClick={() => setIsScheduled(!isScheduled)}
              >
                <div className="schedule-toggle-left">
                  <FiClock className="toggle-icon" />
                  <div>
                    <span className="toggle-title">Schedule Post (Node-Cron)</span>
                    <p className="toggle-desc">
                      Automate release for peak engagement hours
                    </p>
                  </div>
                </div>
                <div className={`switch-knob ${isScheduled ? "on" : "off"}`}>
                  <span />
                </div>
              </div>

              {isScheduled && (
                <div className="schedule-picker-box">
                  <label className="schedule-picker-label">Publish Date & Time:</label>
                  <input
                    type="datetime-local"
                    className="form-input schedule-datetime-input"
                    value={scheduledDate}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                  {scheduledDate && (
                    <span className="schedule-hint">
                      ⏰ Automated publish scheduled for {new Date(scheduledDate).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Creator Tool: Series & Chapters */}
            <div className="form-section series-toggle-section">
              <div
                className={`schedule-feature-toggle ${enableSeries ? "enabled" : ""}`}
                onClick={() => setEnableSeries(!enableSeries)}
              >
                <div className="schedule-toggle-left">
                  <FiBookOpen className="toggle-icon" />
                  <div>
                    <span className="toggle-title">Series & Chapters</span>
                    <p className="toggle-desc">
                      Group posts into a continuous storyline with reader progression
                    </p>
                  </div>
                </div>
                <div className={`switch-knob ${enableSeries ? "on" : "off"}`}>
                  <span />
                </div>
              </div>

              {enableSeries && (
                <div className="subfeature-panel">
                  <label className="schedule-picker-label">Series Title:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cyberpunk Metropolis, Character Studies 2026"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                  />
                  <div className="series-num-grid">
                    <div>
                      <label className="schedule-picker-label">Chapter #:</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={chapterNumber}
                        onChange={(e) => setChapterNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                    </div>
                    <div>
                      <label className="schedule-picker-label">Total Chapters:</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={totalChapters}
                        onChange={(e) => setTotalChapters(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                    </div>
                  </div>
                  {seriesName && (
                    <span className="schedule-hint">
                      📚 Post will show as "{seriesName} • Chapter {chapterNumber} of {totalChapters}"
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Creator Tool: Sound Layer (Ambient Loop) */}
            <div className="form-section sound-toggle-section">
              <div
                className={`schedule-feature-toggle ${enableSoundLayer ? "enabled" : ""}`}
                onClick={() => setEnableSoundLayer(!enableSoundLayer)}
              >
                <div className="schedule-toggle-left">
                  <FiVolume2 className="toggle-icon" />
                  <div>
                    <span className="toggle-title">Ambient Sound Layer</span>
                    <p className="toggle-desc">
                      Attach a subtle looping audio layer with mono player controls
                    </p>
                  </div>
                </div>
                <div className={`switch-knob ${enableSoundLayer ? "on" : "off"}`}>
                  <span />
                </div>
              </div>

              {enableSoundLayer && (
                <div className="subfeature-panel">
                  <label className="schedule-picker-label">Upload Audio Loop (MP3 / WAV / OGG):</label>
                  <input
                    type="file"
                    accept="audio/*"
                    className="form-input"
                    onChange={handleAudioChange}
                  />
                  {audioFile && (
                    <>
                      <label className="schedule-picker-label" style={{ marginTop: "6px" }}>Audio Track Title:</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Rainy Lo-Fi Rooftop, Cyber Synth Ambience"
                        value={audioTitle}
                        onChange={(e) => setAudioTitle(e.target.value)}
                      />
                      <span className="schedule-hint">
                        🎵 Attached: {audioFile.name} (auto-loops muted by default)
                      </span>
                    </>
                  )}
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
                      Auto-play steps as an interactive time-lapse sequence with scrubber
                    </p>
                  </div>
                </div>
                <div className={`switch-knob ${enableProcessThread ? "on" : "off"}`}>
                  <span />
                </div>
              </div>
            </div>

            {/* Feedback & Collaboration: Co-Author Invitation */}
            <div className="form-section">
              <label className="form-label" style={{ display: "flex", alignItems: "center" }}>
                <FiUsers style={{ marginRight: "6px" }} /> Invite Co-Author (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter @username or creator name to co-author..."
                value={coAuthorUsername}
                onChange={(e) => setCoAuthorUsername(e.target.value)}
                className="form-input"
              />
              <span className="schedule-hint" style={{ fontSize: "11px", color: "var(--text-2)" }}>
                🤝 The post will appear on both creators' profiles upon acceptance.
              </span>
            </div>

            {/* Feedback & Collaboration: Critique Mode */}
            <div className="form-section critique-toggle-section">
              <div
                className={`schedule-feature-toggle ${needsCritique ? "enabled" : ""}`}
                onClick={() => setNeedsCritique(!needsCritique)}
              >
                <div className="schedule-toggle-left">
                  <FiTarget className="toggle-icon" />
                  <div>
                    <span className="toggle-title">Request Critique Mode</span>
                    <p className="toggle-desc">
                      Prompt community feedback with structured "What works / What to try" reviews
                    </p>
                  </div>
                </div>
                <div className={`switch-knob ${needsCritique ? "on" : "off"}`}>
                  <span />
                </div>
              </div>

              {needsCritique && (
                <div className="subfeature-panel">
                  <label className="schedule-picker-label">Specific Question for Critics *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. How is the lighting on the face? Does the silhouette read clearly?"
                    value={critiqueQuestion}
                    onChange={(e) => setCritiqueQuestion(e.target.value)}
                    required={needsCritique}
                  />
                  <span className="schedule-hint">
                    🎯 Critics providing helpful feedback earn the verified "Critic" badge.
                  </span>
                </div>
              )}
            </div>

            {/* Discovery Suite: Dominant Palette, Mood Dial & Tool Tags */}
            <div className="form-section creation-discovery-box">
              <div className="discovery-section-head font-mono">
                <span>[DISCOVERY CALIBRATION // 4 MODES]</span>
              </div>

              {/* 1. Dominant 5-Color Palette */}
              <div className="palette-calibration-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="schedule-picker-label" style={{ margin: 0 }}>
                    5 Dominant Colors (Auto-Extracted from Upload):
                  </label>
                  <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-3)" }}>
                    CLICK SWATCH TO TWEAK
                  </span>
                </div>
                <div className="creation-palette-strip">
                  {palette.map((color, idx) => (
                    <div
                      key={idx}
                      className="creation-swatch-slot"
                      style={{ backgroundColor: color }}
                      title={`Color #${idx + 1}: ${color} (Click to change)`}
                    >
                      <input
                        type="color"
                        value={color.length === 7 ? color : "#6366f1"}
                        onChange={(e) => {
                          const updated = [...palette];
                          updated[idx] = e.target.value;
                          setPalette(updated);
                        }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="darkroom-bar__action"
                    style={{ fontSize: "11px", padding: "4px 8px" }}
                    onClick={() => {
                      const samplePalettes = [
                        ["#090c10", "#161d27", "#6366f1", "#4f46e5", "#f0f4f8"],
                        ["#1e293b", "#0f172a", "#ef4444", "#f59e0b", "#10b981"],
                        ["#2a2d34", "#3f88c5", "#004e89", "#ffba08", "#f45b69"],
                        ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#f5f5f5"]
                      ];
                      const randomSet = samplePalettes[Math.floor(Math.random() * samplePalettes.length)];
                      setPalette(randomSet);
                    }}
                  >
                    RANDOMIZE
                  </button>
                </div>
              </div>

              {/* 2. Mood Dial Calibration */}
              <div className="mood-calibration-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label className="schedule-picker-label" style={{ margin: 0 }}>
                  Mood Dial (Re-ranks search & discovery):
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-3)", marginBottom: "4px" }}>
                      <span>CALM (0)</span>
                      <span className="font-mono" style={{ color: "var(--accent)" }}>{moodCalm}%</span>
                      <span>ENERGETIC (100)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={moodCalm}
                      onChange={(e) => setMoodCalm(Number(e.target.value))}
                      className="mood-range-input"
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-3)", marginBottom: "4px" }}>
                      <span>MINIMAL (0)</span>
                      <span className="font-mono" style={{ color: "var(--accent)" }}>{moodMinimal}%</span>
                      <span>DETAILED (100)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={moodMinimal}
                      onChange={(e) => setMoodMinimal(Number(e.target.value))}
                      className="mood-range-input"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                  {[
                    { label: "Zen Minimal", c: 15, m: 10 },
                    { label: "Cyber Kinetic", c: 85, m: 80 },
                    { label: "Moody Ambient", c: 25, m: 50 },
                    { label: "Maximalist Detail", c: 70, m: 95 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="mood-preset-btn font-mono"
                      onClick={() => {
                        setMoodCalm(preset.c);
                        setMoodMinimal(preset.m);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Creator Tool Tags */}
              <div className="tool-tags-group">
                <label className="schedule-picker-label" style={{ marginBottom: "6px" }}>
                  Tools Used (Appears as "Made with" in Inspector):
                </label>
                <div className="creation-tool-chips-grid">
                  {availableToolPresets.map((tool) => {
                    const isSelected = selectedTools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        className={`creation-tool-chip font-mono ${isSelected ? "is-selected" : ""}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTools(selectedTools.filter((t) => t !== tool));
                          } else {
                            setSelectedTools([...selectedTools, tool]);
                          }
                        }}
                      >
                        {isSelected ? `✓ ${tool}` : tool}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add custom tool (e.g. Cinema 4D, Spline)..."
                    value={customToolInput}
                    onChange={(e) => setCustomToolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customToolInput.trim() && !selectedTools.includes(customToolInput.trim())) {
                          setSelectedTools([...selectedTools, customToolInput.trim()]);
                          setCustomToolInput("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="darkroom-bar__action"
                    onClick={() => {
                      if (customToolInput.trim() && !selectedTools.includes(customToolInput.trim())) {
                        setSelectedTools([...selectedTools, customToolInput.trim()]);
                        setCustomToolInput("");
                      }
                    }}
                  >
                    ADD
                  </button>
                </div>
              </div>

              {/* 4. Provenance Attribution */}
              {inspiredByPost && (
                <div
                  style={{
                    padding: "8px 10px",
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--rule)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <span className="font-mono" style={{ color: "var(--accent)", fontWeight: "700" }}>
                      PROVENANCE ATTRIBUTION:
                    </span>
                    <div style={{ color: "var(--text)", marginTop: "2px" }}>
                      Inspired by @{inspiredByPost.username} ({inspiredByPost.caption?.slice(0, 30) || "Original Proof"})
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={() => setInspiredByPost(null)}
                    title="Remove inspiration attribution"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Creation Format & Media */}
          <div className="form-column right-column">
            {/* Creation Format Segmented Selector */}
            <div className="creation-type-segment-bar">
              <button
                type="button"
                className={`creation-type-btn ${creationType === "standard" ? "active" : ""}`}
                onClick={() => setCreationType("standard")}
              >
                <FiImage /> Standard Frame
              </button>
              <button
                type="button"
                className={`creation-type-btn ${creationType === "before_after" ? "active" : ""}`}
                onClick={() => setCreationType("before_after")}
              >
                <FiSliders /> Before / After Slider
              </button>
              <button
                type="button"
                className={`creation-type-btn ${creationType === "time_capsule" ? "active" : ""}`}
                onClick={() => setCreationType("time_capsule")}
              >
                <FiClock /> Time Capsule
              </button>
            </div>

            {creationType === "before_after" ? (
              <div className="before-after-upload-container">
                <div className="before-after-upload-grid">
                  {/* Before Plate */}
                  <div className="ba-drop-box">
                    <label className="form-label">Before / Original Plate *</label>
                    <input
                      type="text"
                      className="form-input ba-label-input"
                      value={beforeLabel}
                      onChange={(e) => setBeforeLabel(e.target.value)}
                      placeholder="Label (e.g. Original Sketch, Raw Photo)"
                    />
                    {!beforePreview ? (
                      <div className="upload-area ba-upload-area">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBeforeFileChange}
                          id="before-file-input"
                          className="file-input"
                        />
                        <label htmlFor="before-file-input" className="file-input-label">
                          <div className="upload-icon">✏️</div>
                          <p className="upload-text">Upload Before Image</p>
                          <p className="upload-hint">Sketch, raw or unedited</p>
                        </label>
                      </div>
                    ) : (
                      <div className="preview-container ba-preview-box">
                        <img src={beforePreview} alt="Before" className="preview-image" />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={handleRemoveBeforeFile}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* After Plate */}
                  <div className="ba-drop-box">
                    <label className="form-label">After / Final Plate *</label>
                    <input
                      type="text"
                      className="form-input ba-label-input"
                      value={afterLabel}
                      onChange={(e) => setAfterLabel(e.target.value)}
                      placeholder="Label (e.g. Final Master, Color Grade)"
                    />
                    {!preview ? (
                      <div className="upload-area ba-upload-area">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          id="file-input"
                          className="file-input"
                          ref={fileInputRef}
                        />
                        <label htmlFor="file-input" className="file-input-label">
                          <div className="upload-icon">🎨</div>
                          <p className="upload-text">Upload After Image</p>
                          <p className="upload-hint">Finished artwork</p>
                        </label>
                      </div>
                    ) : (
                      <div className="preview-container ba-preview-box">
                        <img src={preview} alt="After" className="preview-image" />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={handleRemoveFile}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Preview Slider when both images uploaded */}
                {beforePreview && preview && (
                  <div className="ba-live-preview-box">
                    <span className="ba-live-tag">Interactive Preview: Drag to Test</span>
                    <div className="before-after-container ba-preview-canvas">
                      <div className="before-after-layer">
                        <img src={preview} alt="After Preview" />
                        <span className="before-after-label before-after-label--after">{afterLabel}</span>
                      </div>
                      <div
                        className="before-after-layer before-after-layer--clipped"
                        style={{ clipPath: `inset(0 calc(100% - ${previewSliderPos}%) 0 0)` }}
                      >
                        <img src={beforePreview} alt="Before Preview" />
                        <span className="before-after-label before-after-label--before">{beforeLabel}</span>
                      </div>
                      <div className="before-after-divider" style={{ left: `${previewSliderPos}%` }}>
                        <div className="before-after-handle">↔</div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={previewSliderPos}
                        onChange={(e) => setPreviewSliderPos(e.target.value)}
                        className="before-after-range"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : creationType === "time_capsule" ? (
              <div className="time-capsule-creator-box">
                <div className="upload-section">
                  <label className="form-label">Hidden Capsule Artwork *</label>
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
                        <div className="upload-icon">🔒</div>
                        <p className="upload-text">Upload Secret Piece</p>
                        <p className="upload-hint">Will stay locked & blurred until reveal date</p>
                      </label>
                    </div>
                  ) : (
                    <div className="preview-container">
                      <img src={preview} alt="Capsule Preview" className="preview-image" />
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

                <div className="subfeature-panel" style={{ marginTop: "16px" }}>
                  <label className="schedule-picker-label">Reveal Date & Time * (Node-Cron Auto-Unlock):</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={timeCapsuleDate}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    onChange={(e) => setTimeCapsuleDate(e.target.value)}
                    required
                  />

                  <label className="schedule-picker-label" style={{ marginTop: "8px" }}>Teaser Hint / Secret Note:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Anniversary secret release, Album art unveiling"
                    value={timeCapsuleHint}
                    onChange={(e) => setTimeCapsuleHint(e.target.value)}
                  />

                  {timeCapsuleDate && (
                    <span className="schedule-hint">
                      ⏳ Capsule unlocks on {new Date(timeCapsuleDate).toLocaleString()}. Visitors will see a live countdown!
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Standard Single Masterpiece Upload */
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
            )}

            {/* AI Creative Co-Pilot: Auto-tagging, Captions, Category, Safety Check */}
            {file && (
              <div className="ai-copilot-card">
                <div className="ai-copilot-header">
                  <div className="ai-badge-row">
                    <span className="ai-engine-pill">
                      <BsStars className="ai-sparkle-icon" /> AI Co-Pilot
                    </span>
                    {safetyReport && (
                      <span className={`safety-shield-pill ${safetyReport.isSafe ? "safe" : "flagged"}`}>
                        {safetyReport.isSafe ? <FiCheckCircle /> : <FiAlertTriangle />}
                        {safetyReport.isSafe ? `Safe (${safetyReport.safetyScore}%)` : `Flagged (${safetyReport.safetyScore}%)`}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ai-refresh-btn"
                    onClick={() => triggerAiAnalysis(file, caption)}
                    disabled={aiLoading}
                    title="Re-run AI Analysis"
                  >
                    <FiZap /> {aiLoading ? "Thinking..." : "Re-Analyze"}
                  </button>
                </div>

                {aiLoading ? (
                  <div className="ai-loading-state">
                    <div className="ai-pulse-bar">
                      <div className="ai-pulse-fill"></div>
                    </div>
                    <p>AI Engine analyzing style semantics, tags & content safety...</p>
                  </div>
                ) : aiSuggestions ? (
                  <div className="ai-results-body">
                    {/* Smart Category Classification */}
                    {aiSuggestions.classifiedCategory && (
                      <div className="ai-category-strip">
                        <div className="ai-category-info">
                          <span className="ai-label">Smart Category:</span>
                          <span className="ai-cat-name">{aiSuggestions.classifiedCategory}</span>
                          <span className="ai-cat-confidence">{aiSuggestions.categoryConfidence}% match</span>
                        </div>
                        {postType !== aiSuggestions.classifiedCategory && (
                          <button
                            type="button"
                            className="ai-apply-cat-btn"
                            onClick={() => setPostType(aiSuggestions.classifiedCategory)}
                          >
                            Apply "{aiSuggestions.classifiedCategory}"
                          </button>
                        )}
                      </div>
                    )}

                    {/* Auto Caption Suggestions */}
                    {aiSuggestions.captionVariations && (
                      <div className="ai-caption-suggestions">
                        <span className="ai-label">Caption Suggestions (click to apply):</span>
                        <div className="ai-captions-grid">
                          <div
                            className="ai-caption-card"
                            onClick={() => setCaption(aiSuggestions.captionVariations.poetic)}
                          >
                            <span className="caption-flavor">🎭 Artistic / Poetic</span>
                            <p>"{aiSuggestions.captionVariations.poetic}"</p>
                          </div>
                          <div
                            className="ai-caption-card"
                            onClick={() => setCaption(aiSuggestions.captionVariations.punchy)}
                          >
                            <span className="caption-flavor">⚡ Punchy & Social</span>
                            <p>"{aiSuggestions.captionVariations.punchy}"</p>
                          </div>
                          <div
                            className="ai-caption-card"
                            onClick={() => setCaption(aiSuggestions.captionVariations.technical)}
                          >
                            <span className="caption-flavor">📐 Workflow / Technical</span>
                            <p>"{aiSuggestions.captionVariations.technical}"</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Auto Tagging Suggestions */}
                    {aiSuggestions.suggestedTags && aiSuggestions.suggestedTags.length > 0 && (
                      <div className="ai-tags-section">
                        <div className="ai-tags-header">
                          <span className="ai-label">Suggested Tags:</span>
                          <button
                            type="button"
                            className="ai-add-all-tags-btn"
                            onClick={() => {
                              const newTags = Array.from(new Set([...tags, ...aiSuggestions.suggestedTags]));
                              setTags(newTags);
                            }}
                          >
                            + Add All Tags
                          </button>
                        </div>
                        <div className="ai-tags-pills">
                          {aiSuggestions.suggestedTags.map((t, idx) => {
                            const isAdded = tags.includes(t);
                            return (
                              <button
                                key={idx}
                                type="button"
                                className={`ai-tag-pill ${isAdded ? "added" : ""}`}
                                onClick={() => {
                                  if (!isAdded) {
                                    setTags([...tags, t]);
                                  }
                                }}
                              >
                                {isAdded ? "✓" : "+"} #{t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Content Safety Check Report */}
                    {safetyReport && !safetyReport.isSafe && (
                      <div className="ai-safety-warning">
                        <FiAlertTriangle />
                        <div>
                          <strong>Content Safety Alert:</strong>
                          <p>{safetyReport.flags?.join(", ")}</p>
                          <small>Upload is blocked until flagged content is removed.</small>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

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
                  {isScheduled ? "Scheduling Creation..." : "Uploading Creation & Workflow..."}
                </>
              ) : (
                <>
                  <span>{isScheduled ? "⏰" : "✨"}</span>
                  {isScheduled
                    ? "Schedule Publication"
                    : (remixParent ? "Publish Remix Piece" : "Publish Creation")}
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
