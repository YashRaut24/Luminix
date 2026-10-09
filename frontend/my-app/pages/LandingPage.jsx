import React, { useState } from "react";
import {
  FiArrowRight,
  FiSliders,
  FiLayers,
  FiClock,
  FiMusic,
  FiMessageSquare,
  FiUsers,
  FiEdit3,
  FiEye,
  FiLock,
  FiSun,
  FiMoon,
  FiCheckCircle,
  FiTerminal,
  FiCompass,
  FiShield,
  FiTrendingUp
} from "react-icons/fi";
import SignUp from "./SignUp";
import SignIn from "./SignIn";
import "./LandingPage.css";

function LandingPage({ onAuthSuccess, darkMode = true, changeTheme, initialModal = null }) {
  const [showSignUp, setShowSignUp] = useState(initialModal === "signup");
  const [showSignIn, setShowSignIn] = useState(initialModal === "signin");

  // Interactive Hero Before/After slider state
  const [sliderPos, setSliderPos] = useState(52);

  // Interactive Hero Timelapse / Version scrubber state
  const [activeVersion, setActiveVersion] = useState(2);

  const versionsData = [
    {
      v: "v1",
      tag: "Rough Wire & Concept",
      desc: "Initial perspective blocking and geometric light rays setup.",
      color: "#1e293b",
      contrast: "Low",
      status: "Concept Draft"
    },
    {
      v: "v2",
      tag: "Ink & Value Layer",
      desc: "Midtone shading, ambient occlusion passes, and structural inking.",
      color: "#0f172a",
      contrast: "Medium",
      status: "Inking Pass"
    },
    {
      v: "v3",
      tag: "Master Lightbox Proof",
      desc: "Final color calibration, sound layer synchronization, and critic stamp approval.",
      color: "#090c10",
      contrast: "Calibrated",
      status: "Master Approved"
    }
  ];

  const tools = [
    {
      badge: "ENGINE 01",
      icon: <FiSliders />,
      title: "Before / After Split Slider",
      desc: "Pure CSS split-view inspection. Drag a precision divider to compare raw drafts vs final graded proofs without compression artifacts."
    },
    {
      badge: "ENGINE 02",
      icon: <FiLayers />,
      title: "Process Timelapse & Versions",
      desc: "Scrub chronological revision shots. Store and inspect v1, v2, and master proofs with creator release notes on every step."
    },
    {
      badge: "ENGINE 03",
      icon: <FiCompass />,
      title: "Series & Episodic Chapters",
      desc: "Curate multi-part narratives ('Chapter 3 of 8'). Readers follow ongoing series and resume right where they left off."
    },
    {
      badge: "ENGINE 04",
      icon: <FiClock />,
      title: "Time Capsule Scheduled Releases",
      desc: "Blur-free locked frames that reveal at an exact countdown date. Scheduled drops with verified release timestamps."
    },
    {
      badge: "ENGINE 05",
      icon: <FiMusic />,
      title: "Atmospheric Sound Layers",
      desc: "Attach ambient 432Hz spatial audio loops directly to visual proofs. Muted by default with a lightweight tactile mono control."
    },
    {
      badge: "ENGINE 06",
      icon: <FiEye />,
      title: "High-Res Proofing Lightbox",
      desc: "Inspect contact sheets under 100% pixel fidelity with monochrome frame counters, calibration metadata, and zero algorithmic clutter."
    }
  ];

  const feedbackProtocols = [
    {
      badge: "PROTOCOL 01",
      icon: <FiMessageSquare />,
      title: "Structured Critique Bay",
      desc: "Creators ask one precise technical question. Reviewers answer with structured 'What Works' and 'What to Try' fields, earning verified Critic Badges."
    },
    {
      badge: "PROTOCOL 02",
      icon: <FiUsers />,
      title: "Co-Author Attribution",
      desc: "Publish collaborative proofs that appear simultaneously on both creators' profiles once approved. True dual-ownership credit."
    },
    {
      badge: "PROTOCOL 03",
      icon: <FiTrendingUp />,
      title: "Collaborator Pitch Board",
      desc: "Looking for a 3D animator, colorist, or sound designer? Post open creative calls, filter by discipline, and exchange focused pitches."
    },
    {
      badge: "PROTOCOL 04",
      icon: <FiLock />,
      title: "Confidential Whisper Notes",
      desc: "Provide private peer critique visible exclusively to the author. Safe, constructive feedback away from public eyes."
    },
    {
      badge: "PROTOCOL 05",
      icon: <FiEdit3 />,
      title: "Live Synchronous Sketch Room",
      desc: "Multi-creator shared canvas powered by real-time WebSockets. Brainstorm, draw, and critique together with zero latency."
    },
    {
      badge: "PROTOCOL 06",
      icon: <FiShield />,
      title: "Lossless Creator Ownership",
      desc: "Solid surfaces, zero ads, zero algorithmic feed suppression. You own your proof archive and your peer network."
    }
  ];

  const stats = [
    { num: "50K+", label: "Verified Creators", meta: "ACROSS 140+ DISCIPLINES" },
    { num: "2.4M+", label: "Proofs Stamped", meta: "ZERO COMPRESSION NOISE" },
    { num: "98.6%", label: "Constructive Critique", meta: "STRUCTURED PEER REVIEWS" },
    { num: "0%", label: "Algorithmic Noise", meta: "100% CHRONOLOGICAL & WORKSPACE-DRIVEN" }
  ];

  const handleSuccess = (user) => {
    setShowSignUp(false);
    onAuthSuccess?.(user);
  };

  return (
    <div className={`darkroom-landing-wrapper ${darkMode ? "darkroom" : "lightbox"}`}>
      {/* Top Studio Masthead */}
      <header className="darkroom-landing-masthead">
        <div className="masthead-left">
          <div className="masthead-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="brand-glyph">
              <span className="glyph-letter">L</span>
            </div>
            <div className="brand-text">
              <span className="brand-title">LUMINIX</span>
              <span className="brand-tag font-mono">[DARKROOM // LIGHTBOX v2.4]</span>
            </div>
          </div>
        </div>

        <nav className="masthead-nav">
          <a href="#showcase" className="masthead-link font-mono">// LIGHTBOX SHOWCASE</a>
          <a href="#creation-tools" className="masthead-link font-mono">// CREATION ENGINES</a>
          <a href="#feedback-protocol" className="masthead-link font-mono">// CRITIQUE PROTOCOL</a>
          <a href="#workflow" className="masthead-link font-mono">// SPEC WORKFLOW</a>
        </nav>

        <div className="masthead-right">
          {changeTheme && (
            <button
              type="button"
              className="masthead-theme-btn font-mono"
              onClick={changeTheme}
              title={`Switch to ${darkMode ? "Lightbox" : "Darkroom"}`}
            >
              {darkMode ? <FiSun /> : <FiMoon />}
              <span className="theme-btn-label">{darkMode ? "LIGHTBOX" : "DARKROOM"}</span>
            </button>
          )}

          <button
            type="button"
            className="masthead-btn-secondary font-mono"
            onClick={() => setShowSignIn(true)}
          >
            SIGN IN
          </button>

          <button
            type="button"
            className="masthead-btn-primary font-mono"
            onClick={() => setShowSignUp(true)}
          >
            <span>ENTER DARKROOM</span>
            <FiArrowRight />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="darkroom-hero">
        <div className="hero-grid">
          {/* Left Column: Editorial Intro */}
          <div className="hero-intro">
            <div className="hero-status-pill font-mono">
              <span className="status-dot"></span>
              <span>PROOFING ENGINE ONLINE // ZERO ALGORITHMIC NOISE</span>
            </div>

            <h1 className="hero-headline">
              The Darkroom Workspace <br />
              <span className="hero-headline-accent">for Visual Creators.</span>
            </h1>

            <p className="hero-lead">
              Luminix is an editorial contact sheet and inspection workspace. 
              Drag real-time Before/After sliders, scrub process timelapses, 
              participate in structured peer critique bays, and co-author proofs with fellow creators.
            </p>

            <div className="hero-action-row">
              <button
                type="button"
                className="hero-btn-accent font-mono"
                onClick={() => setShowSignUp(true)}
              >
                <span>INITIALIZE WORKSPACE</span>
                <FiArrowRight />
              </button>

              <button
                type="button"
                className="hero-btn-outline font-mono"
                onClick={() => setShowSignIn(true)}
              >
                ACCESS WORKSPACE
              </button>

              <a href="#showcase" className="hero-btn-anchor font-mono">
                [INSPECT DEMO]
              </a>
            </div>

            {/* Technical Specs Readout */}
            <div className="hero-tech-readout font-mono">
              <div className="readout-item">
                <span className="readout-label">CALIBRATION</span>
                <span className="readout-val">100% LOSSLESS</span>
              </div>
              <div className="readout-divider">|</div>
              <div className="readout-item">
                <span className="readout-label">PEER REVIEWS</span>
                <span className="readout-val">STRUCTURED</span>
              </div>
              <div className="readout-divider">|</div>
              <div className="readout-item">
                <span className="readout-label">LATENCY</span>
                <span className="readout-val">12ms WS</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Hero Lightbox Preview */}
          <div className="hero-preview-frame" id="showcase">
            <div className="preview-top-bar font-mono">
              <span className="frame-index">[FRAME 01 // INTERACTIVE PROOF INSPECTION]</span>
              <span className="frame-status">● LIVE WORKSPACE</span>
            </div>

            {/* Interactive Before / After Split Slider Card */}
            <div className="hero-slider-inspection-box">
              <div className="inspection-slider-container">
                {/* Back Layer: Sketch / Draft */}
                <div className="slider-layer slider-layer-before">
                  <div className="slider-canvas-art draft-art">
                    <div className="art-wireframe-lines">
                      <div className="wire-grid"></div>
                      <div className="wire-circle"></div>
                      <div className="wire-focal">
                        <span className="wire-label font-mono">[RAW DRAFT // v1]</span>
                      </div>
                    </div>
                  </div>
                  <div className="slider-tag slider-tag-left font-mono">
                    RAW SKETCH / WIREFRAME
                  </div>
                </div>

                {/* Front Layer: Final Graded Master (Clipped) */}
                <div
                  className="slider-layer slider-layer-after"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                >
                  <div className="slider-canvas-art master-art">
                    <div className="art-master-render">
                      <div className="master-glow-shape"></div>
                      <div className="master-focal">
                        <span className="master-label font-mono">[FINAL PROOF // v3 MASTER]</span>
                      </div>
                    </div>
                  </div>
                  <div className="slider-tag slider-tag-right font-mono">
                    MASTER PROOF (CALIBRATED)
                  </div>
                </div>

                {/* Draggable Divider Handle */}
                <div className="slider-divider-line" style={{ left: `${sliderPos}%` }}>
                  <div className="slider-handle-knob font-mono">
                    <span>{sliderPos}%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="5"
                  max="95"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="slider-native-input"
                  aria-label="Before/After divider slider"
                />
              </div>

              <div className="slider-footer-controls font-mono">
                <span className="control-hint">← DRAG SLIDER TO INSPECT EDITS →</span>
                <span className="control-coords">SPLIT: {sliderPos}% // 100% SCALE</span>
              </div>
            </div>

            {/* Mini Contact Sheet Strip in Hero */}
            <div className="hero-contact-sheet-preview">
              {/* Card A: Process Scrubber */}
              <div className="mini-preview-card">
                <div className="mini-card-head font-mono">
                  <span>[PROCESS TIMELAPSE]</span>
                  <span className="accent-tag">{versionsData[activeVersion].v}</span>
                </div>
                <div className="mini-version-scrubber font-mono">
                  {versionsData.map((ver, idx) => (
                    <button
                      key={ver.v}
                      type="button"
                      className={`mini-version-btn ${activeVersion === idx ? "is-active" : ""}`}
                      onClick={() => setActiveVersion(idx)}
                    >
                      {ver.v}
                    </button>
                  ))}
                </div>
                <div className="mini-version-desc">
                  <div className="version-title font-mono">{versionsData[activeVersion].tag}</div>
                  <p>{versionsData[activeVersion].desc}</p>
                </div>
              </div>

              {/* Card B: Structured Critique */}
              <div className="mini-preview-card">
                <div className="mini-card-head font-mono">
                  <span>[CRITIQUE BAY]</span>
                  <span className="status-badge font-mono">NEEDS CRITIQUE</span>
                </div>
                <div className="mini-critique-prompt font-mono">
                  Q: "How is the tonal contrast on the focal rim light?"
                </div>
                <div className="mini-critique-response">
                  <div className="critique-field">
                    <span className="field-tag font-mono">WHAT WORKS:</span>
                    <span className="field-text">Clean edge separation and accurate color temperature.</span>
                  </div>
                  <div className="critique-field">
                    <span className="field-tag font-mono">WHAT TO TRY:</span>
                    <span className="field-text">Step down shadow density by 0.3 EV for printing.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & Calibration Readout */}
      <section className="darkroom-stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-index font-mono">[CALIBRATION 0{i + 1}]</div>
                <div className="stat-value">{s.num}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-meta font-mono">{s.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creation Engines Suite */}
      <section className="darkroom-features-section" id="creation-tools">
        <div className="section-head">
          <div className="section-pretitle font-mono">[SUITE 01 // WORKSPACE CAPABILITIES]</div>
          <h2 className="section-title">Six Purpose-Built Creation Engines</h2>
          <p className="section-sub">
            Built from scratch for creators who demand high-fidelity inspection tools over shallow scrolling.
          </p>
        </div>

        <div className="features-grid">
          {tools.map((t, i) => (
            <div key={i} className="feature-frame">
              <div className="feature-frame-top font-mono">
                <span className="feature-badge">{t.badge}</span>
                <span className="feature-icon">{t.icon}</span>
              </div>
              <h3 className="feature-title">{t.title}</h3>
              <p className="feature-description">{t.desc}</p>
              <div className="feature-frame-bottom font-mono">
                <span>STATUS: COMPILED</span>
                <span>PROOF VERIFIED</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feedback & Collaboration Protocols */}
      <section className="darkroom-features-section alt-bg" id="feedback-protocol">
        <div className="section-head">
          <div className="section-pretitle font-mono">[SUITE 02 // PEER INTERACTION]</div>
          <h2 className="section-title">Structured Feedback, Not Spam Comments</h2>
          <p className="section-sub">
            Elevate peer critique with dedicated review fields, collaborative co-authorship, and synchronous sketch rooms.
          </p>
        </div>

        <div className="features-grid">
          {feedbackProtocols.map((p, i) => (
            <div key={i} className="feature-frame">
              <div className="feature-frame-top font-mono">
                <span className="feature-badge">{p.badge}</span>
                <span className="feature-icon">{p.icon}</span>
              </div>
              <h3 className="feature-title">{p.title}</h3>
              <p className="feature-description">{p.desc}</p>
              <div className="feature-frame-bottom font-mono">
                <span>PROTOCOL: ACTIVE</span>
                <span>SECURE PEER LINK</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Matrix: Legacy Social vs Darkroom Lightbox */}
      <section className="darkroom-matrix-section" id="workflow">
        <div className="section-head">
          <div className="section-pretitle font-mono">[COMPARATIVE SPECIFICATION]</div>
          <h2 className="section-title">Architected for Precision</h2>
          <p className="section-sub">
            Why serious visual artists and designers are migrating to the Luminix workspace.
          </p>
        </div>

        <div className="matrix-table-wrap font-mono">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="th-dimension">WORKFLOW ATTRIBUTE</th>
                <th className="th-legacy">LEGACY SOCIAL PLATFORMS</th>
                <th className="th-luminix">LUMINIX DARKROOM WORKSPACE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="td-dim">Image Fidelity & Compression</td>
                <td className="td-neg">Aggressive WebP compression & artifacts</td>
                <td className="td-pos">Lossless proofing lightbox & 100% zoom</td>
              </tr>
              <tr>
                <td className="td-dim">Revision Inspection</td>
                <td className="td-neg">Single flat image; process hidden</td>
                <td className="td-pos">Interactive Before/After slider & v1-v3 scrubber</td>
              </tr>
              <tr>
                <td className="td-dim">Feedback Format</td>
                <td className="td-neg">Unmoderated emoji comments & algorithmic spam</td>
                <td className="td-pos">Structured critique ('What works' / 'What to try')</td>
              </tr>
              <tr>
                <td className="td-dim">Creative Collaboration</td>
                <td className="td-neg">Manual mention tags; solo credit</td>
                <td className="td-pos">Co-author dual profiles & Collab Pitch Board</td>
              </tr>
              <tr>
                <td className="td-dim">Live Brainstorming</td>
                <td className="td-neg">None; requires third-party tools</td>
                <td className="td-pos">Built-in WebSocket Live Sketch Room</td>
              </tr>
              <tr>
                <td className="td-dim">Feed Distribution</td>
                <td className="td-neg">Opaque algorithmic engagement bait</td>
                <td className="td-pos">Chronological contact sheet & discipline filters</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Terminal Call to Action */}
      <section className="darkroom-cta-section">
        <div className="cta-frame">
          <div className="cta-terminal-header font-mono">
            <span className="terminal-title">[SESSION PROMPT // ROOT]</span>
            <span className="terminal-status">READY FOR INITIALIZATION</span>
          </div>

          <div className="cta-body">
            <div className="cta-code-line font-mono">
              <span className="code-prompt">$</span>
              <span className="code-cmd">luminix init --workspace --creator</span>
            </div>

            <h2 className="cta-headline">Ready to Enter the Darkroom?</h2>
            <p className="cta-desc">
              Join thousands of creators sharing proofs, running structured critiques, and building collaborative bodies of work.
            </p>

            <div className="cta-btn-row">
              <button
                type="button"
                className="cta-btn-primary font-mono"
                onClick={() => setShowSignUp(true)}
              >
                <span>CREATE WORKSPACE ACCOUNT</span>
                <FiArrowRight />
              </button>

              <button
                type="button"
                className="cta-btn-secondary font-mono"
                onClick={() => setShowSignIn(true)}
              >
                SIGN IN TO SESSION
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Footer */}
      <footer className="darkroom-landing-footer font-mono">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <span className="footer-glyph">L</span>
              <span className="footer-name">LUMINIX</span>
            </div>
            <p className="footer-tagline">
              The precision Darkroom & Lightbox workspace for visual creators.
            </p>
            <div className="footer-sys-status">
              <span className="status-indicator">●</span>
              <span>SYSTEM ALL CLEAR // SERVER: US-EAST // LATENCY 12ms</span>
            </div>
          </div>

          <div className="footer-link-col">
            <div className="footer-col-title">[ENGINES]</div>
            <a href="#showcase">Before / After Slider</a>
            <a href="#creation-tools">Process Timelapse</a>
            <a href="#creation-tools">Series & Chapters</a>
            <a href="#creation-tools">Time Capsules</a>
            <a href="#creation-tools">Ambient Sound</a>
          </div>

          <div className="footer-link-col">
            <div className="footer-col-title">[PROTOCOLS]</div>
            <a href="#feedback-protocol">Structured Critique</a>
            <a href="#feedback-protocol">Co-Authoring</a>
            <a href="#feedback-protocol">Collab Pitch Board</a>
            <a href="#feedback-protocol">Confidential Whispers</a>
            <a href="#feedback-protocol">Live Sketch Room</a>
          </div>

          <div className="footer-link-col">
            <div className="footer-col-title">[WORKSPACE]</div>
            <button type="button" onClick={() => setShowSignIn(true)} className="footer-text-btn">
              Sign In
            </button>
            <button type="button" onClick={() => setShowSignUp(true)} className="footer-text-btn">
              Create Account
            </button>
            {changeTheme && (
              <button type="button" onClick={changeTheme} className="footer-text-btn">
                Toggle Theme ({darkMode ? "Lightbox" : "Darkroom"})
              </button>
            )}
            <span className="spec-version">SPEC v2.40.8</span>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-legal">
            &copy; {new Date().getFullYear()} LUMINIX STUDIO SYSTEMS. ALL RIGHTS RESERVED.
          </div>
          <div className="footer-meta">
            PRECISION PROOFING // ZERO GRADIENTS // SOLID SURFACES
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      {showSignUp && (
        <SignUp
          onClose={() => setShowSignUp(false)}
          onSwitchToSignIn={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {showSignIn && (
        <SignIn
          onClose={() => setShowSignIn(false)}
          onSwitchToSignUp={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
          onAuthSuccess={(user) => {
            setShowSignIn(false);
            onAuthSuccess?.(user);
          }}
        />
      )}
    </div>
  );
}

export default LandingPage;