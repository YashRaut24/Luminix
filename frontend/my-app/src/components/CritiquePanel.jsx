import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import socket from "../socket";
import "./CritiquePanel.css";
import { FiTarget, FiCheck, FiStar, FiAlertCircle, FiX } from "react-icons/fi";

const CritiquePanel = ({ postId, currentUser, mode }) => {
  const [data, setData] = useState({
    critiqueOpen: false,
    critiqueQuestion: "",
    isOwner: false,
    canCritique: false,
    mine: null,
    critiques: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Owner state for asking / reopening critique
  const [askQuestion, setAskQuestion] = useState("");
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Reviewer form state
  const [works, setWorks] = useState("");
  const [tryNext, setTryNext] = useState("");
  const [isSubmittingCritique, setIsSubmittingCritique] = useState(false);

  // Fetch critiques and permissions from server
  const fetchCritiques = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:9000/posts/${postId}/critiques`, {
        withCredentials: true,
      });
      setData(res.data);
      if (res.data.critiqueQuestion && !askQuestion) {
        setAskQuestion(res.data.critiqueQuestion);
      }
      setErrorMessage("");
    } catch (err) {
      console.error("Failed to load critiques:", err);
      // Fail gracefully without crashing
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchCritiques();
  }, [fetchCritiques]);

  // Real-time socket listener for new critiques
  useEffect(() => {
    if (!postId) return;
    const handleCritiqueAdded = (payload) => {
      if (payload.postId === postId) {
        fetchCritiques();
      }
    };

    socket.on("post_critique_added", handleCritiqueAdded);
    return () => {
      socket.off("post_critique_added", handleCritiqueAdded);
    };
  }, [postId, fetchCritiques]);

  // 1. Owner Toggles Open / Close
  const handleToggleCritique = async (shouldOpen) => {
    setErrorMessage("");
    try {
      setIsTogglingStatus(true);
      const payload = { open: shouldOpen };
      if (shouldOpen) {
        payload.question = askQuestion.trim();
      }
      const res = await axios.post(
        `http://localhost:9000/posts/${postId}/critique/toggle`,
        payload,
        { withCredentials: true }
      );
      setData((prev) => ({
        ...prev,
        critiqueOpen: res.data.critiqueOpen,
        critiqueQuestion: res.data.critiqueQuestion,
      }));
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update critique status.";
      setErrorMessage(msg);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // 2. Reviewer Submits Critique (What works & What to try next)
  const handleSubmitCritique = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const worksTrim = works.trim();
    const tryNextTrim = tryNext.trim();

    if (worksTrim.length < 10 || tryNextTrim.length < 10) {
      setErrorMessage("Both 'What works' and 'What to try next' must be at least 10 characters.");
      return;
    }

    try {
      setIsSubmittingCritique(true);
      const res = await axios.post(
        `http://localhost:9000/posts/${postId}/critique`,
        { works: worksTrim, tryNext: tryNextTrim },
        { withCredentials: true }
      );

      // Re-fetch to guarantee sync with Critic badge aggregations
      await fetchCritiques();
      setWorks("");
      setTryNext("");
    } catch (err) {
      // EDGE CASE: Duplicate submission returns 409 with clear message
      const msg = err.response?.data?.message || "Failed to submit critique.";
      setErrorMessage(msg);
    } finally {
      setIsSubmittingCritique(false);
    }
  };

  // 3. Owner Toggles "Helpful"
  const handleToggleHelpful = async (critiqueId) => {
    try {
      const res = await axios.post(
        `http://localhost:9000/posts/${postId}/critique/${critiqueId}/helpful`,
        {},
        { withCredentials: true }
      );

      // Update in local state
      setData((prev) => {
        const updatedCritique = res.data.critique;
        const updatedList = prev.critiques.map((c) =>
          c._id === critiqueId
            ? { ...c, helpful: updatedCritique.helpful, isCritic: updatedCritique.isCritic }
            : c
        );
        // Re-sort: helpful ones first
        updatedList.sort((a, b) => (b.helpful === a.helpful ? 0 : b.helpful ? 1 : -1));

        return {
          ...prev,
          critiques: updatedList,
          mine: prev.mine && prev.mine._id === critiqueId
            ? { ...prev.mine, helpful: updatedCritique.helpful, isCritic: updatedCritique.isCritic }
            : prev.mine,
        };
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to toggle helpful mark.";
      setErrorMessage(msg);
    }
  };

  const { critiqueOpen, critiqueQuestion, isOwner, mine, critiques } = data;

  // Validation states
  const worksLen = works.trim().length;
  const tryLen = tryNext.trim().length;
  const canSubmitReview = worksLen >= 10 && worksLen <= 500 && tryLen >= 10 && tryLen <= 500;

  const askLen = askQuestion.trim().length;
  const canSubmitAsk = askLen >= 5 && askLen <= 200;

  if (loading && critiques.length === 0 && !critiqueQuestion) {
    return null;
  }

  // If closed and user is not owner and there are zero critiques, don't show clutter
  if (!critiqueOpen && !isOwner && critiques.length === 0) {
    return null;
  }

  return (
    <div className={`critique-panel-container ${mode ? "dark-theme" : ""}`}>
      {/* Panel Top Header */}
      <div className="critique-panel-header">
        <span className="critique-panel-title">
          <FiTarget style={{ color: "var(--accent)" }} /> Structured Critique
        </span>
        <span
          className={`critique-panel-status-pill ${
            critiqueOpen ? "is-open" : "is-closed"
          }`}
        >
          {critiqueOpen ? "Critique Open" : "Critique Closed"}
        </span>
      </div>

      {/* Accessible Error Alert */}
      {errorMessage && (
        <div role="alert" className="critique-alert-error">
          <FiAlertCircle style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: 0,
            }}
            title="Dismiss error"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* QUESTION DISPLAY & OWNER CONTROLS */}
      {critiqueOpen ? (
        <div className="critique-question-box">
          <div className="critique-question-topline">
            <span className="critique-question-label">Creator's Focus Question</span>
            {isOwner && (
              <button
                type="button"
                className="critique-close-btn"
                disabled={isTogglingStatus}
                onClick={() => handleToggleCritique(false)}
                title="Close critique to stop accepting new submissions"
              >
                {isTogglingStatus ? "Closing..." : "Close Critique"}
              </button>
            )}
          </div>
          <p className="critique-question-text">"{critiqueQuestion}"</p>
        </div>
      ) : isOwner ? (
        /* Owner sees "Ask for critique" form when closed */
        <div className="critique-ask-form">
          <div className="critique-question-topline">
            <span className="critique-question-label">Ask for Targeted Feedback</span>
          </div>
          <p className="critique-ask-desc">
            State one specific question so reviewers focus on what you need (e.g., "Is the lighting too flat in the foreground?").
          </p>
          <input
            type="text"
            className="critique-input font-mono"
            placeholder="Focus question (5 to 200 characters)..."
            value={askQuestion}
            maxLength={200}
            onChange={(e) => setAskQuestion(e.target.value)}
          />
          <div className="critique-char-row">
            <span>
              {askLen < 5 ? `Needs at least ${5 - askLen} more characters` : "Ready to ask"}
            </span>
            <span>{askLen}/200</span>
          </div>
          <button
            type="button"
            className="critique-submit-btn"
            disabled={!canSubmitAsk || isTogglingStatus}
            onClick={() => handleToggleCritique(true)}
          >
            {isTogglingStatus ? "Opening..." : "Ask for Critique"}
          </button>
        </div>
      ) : critiqueQuestion ? (
        /* Reviewer sees the closed question if critiques exist */
        <div className="critique-question-box">
          <span className="critique-question-label">Closed Focus Question</span>
          <p className="critique-question-text">"{critiqueQuestion}"</p>
        </div>
      ) : null}

      {/* REVIEWER SUBMISSION AREA */}
      {!isOwner && critiqueOpen && (
        <>
          {mine ? (
            /* Replaced by reviewer's own critique once submitted */
            <div className="critique-submitted-banner">
              <FiCheck /> You submitted a critique for this post
            </div>
          ) : (
            /* Two-field form: What works & What to try next */
            <form onSubmit={handleSubmitCritique} className="critique-reviewer-form">
              {/* Field 1: What works */}
              <div className="critique-form-field">
                <div className="critique-form-field-header">
                  <label
                    htmlFor={`critique-works-${postId}`}
                    className="critique-form-field-label"
                  >
                    <span className="critique-field-indicator critique-field-indicator--works" />
                    What Works (Strengths)
                  </label>
                  <span className="critique-char-row">
                    {worksLen < 10 ? `${10 - worksLen} chars needed` : `${worksLen}/500`}
                  </span>
                </div>
                <textarea
                  id={`critique-works-${postId}`}
                  className="critique-textarea"
                  placeholder="What is working well? Highlight strengths, composition, mood, anatomy... (min 10 chars)"
                  value={works}
                  maxLength={500}
                  onChange={(e) => setWorks(e.target.value)}
                  required
                />
              </div>

              {/* Field 2: What to try next */}
              <div className="critique-form-field">
                <div className="critique-form-field-header">
                  <label
                    htmlFor={`critique-try-${postId}`}
                    className="critique-form-field-label"
                  >
                    <span className="critique-field-indicator critique-field-indicator--try" />
                    What to Try Next (Actionable Suggestion)
                  </label>
                  <span className="critique-char-row">
                    {tryLen < 10 ? `${10 - tryLen} chars needed` : `${tryLen}/500`}
                  </span>
                </div>
                <textarea
                  id={`critique-try-${postId}`}
                  className="critique-textarea"
                  placeholder="What actionable experiment or adjustment should the creator try next? (min 10 chars)"
                  value={tryNext}
                  maxLength={500}
                  onChange={(e) => setTryNext(e.target.value)}
                  required
                />
              </div>

              {/* Form submit disabled until both fields reach 10 characters */}
              <button
                type="submit"
                className="critique-submit-btn"
                disabled={!canSubmitReview || isSubmittingCritique}
              >
                {isSubmittingCritique ? "Submitting..." : "Submit Critique"}
              </button>
            </form>
          )}
        </>
      )}

      {/* CRITIQUES LIST (Sorted helpful first) */}
      <div className="critiques-list">
        <div className="critiques-list-title">
          <span>Critiques ({critiques.length})</span>
          {critiques.length > 0 && (
            <span style={{ fontSize: "10px", color: "var(--text-3)", textTransform: "none" }}>
              Helpful reviews ranked first
            </span>
          )}
        </div>

        {critiques.length === 0 ? (
          <p className="critique-empty-hint">
            {critiqueOpen
              ? "No critiques submitted yet. Be the first to share constructive feedback!"
              : "No critiques were submitted for this frame."}
          </p>
        ) : (
          critiques.map((critique) => {
            const isMine = Boolean(mine && mine._id === critique._id);
            return (
              <div
                key={critique._id}
                className={`critique-card ${isMine ? "is-mine" : ""}`}
              >
                {/* Header: Author + Critic Badge + Date + Helpful toggle */}
                <div className="critique-card-header">
                  <div className="critique-author-meta">
                    {critique.authorAvatar ? (
                      <img
                        src={`http://localhost:9000${critique.authorAvatar}`}
                        alt={critique.authorName}
                        className="critique-avatar"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="critique-avatar" />
                    )}
                    <span className="critique-author-name">
                      @{critique.authorName}
                    </span>

                    {/* Reputation Signal: Critic badge at 5 helpful marks across all posts */}
                    {critique.isCritic && (
                      <span className="critic-badge-pill" title="Critic: Awarded 5+ helpful critiques by creators">
                        <FiStar style={{ fontSize: "9px" }} /> Critic
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      className="font-mono"
                      style={{ fontSize: "10px", color: "var(--text-3)" }}
                    >
                      {new Date(critique.createdAt).toLocaleDateString()}
                    </span>

                    {/* Only post owner toggles helpful */}
                    {isOwner ? (
                      <button
                        type="button"
                        className={`critique-helpful-btn ${
                          critique.helpful ? "is-helpful" : ""
                        }`}
                        onClick={() => handleToggleHelpful(critique._id)}
                        title={
                          critique.helpful
                            ? "Click to remove helpful mark"
                            : "Mark as helpful (awards progress toward Critic badge)"
                        }
                      >
                        {critique.helpful ? (
                          <>
                            <FiCheck /> Helpful
                          </>
                        ) : (
                          "Mark Helpful"
                        )}
                      </button>
                    ) : critique.helpful ? (
                      <span className="critique-helpful-tag" title="Creator marked this critique as helpful">
                        <FiCheck /> Helpful
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Body: Two blocks with 3px left border and neutral text labels */}
                <div className="critique-blocks">
                  {/* Block 1: What works */}
                  <div className="critique-block critique-block--works">
                    <span className="critique-block-label">What works</span>
                    <p className="critique-block-content">{critique.works}</p>
                  </div>

                  {/* Block 2: What to try next */}
                  <div className="critique-block critique-block--try">
                    <span className="critique-block-label">What to try next</span>
                    <p className="critique-block-content">{critique.tryNext}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CritiquePanel;
