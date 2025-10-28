import React, { useState } from "react";
import { BsFire, BsTrophy, BsShield, BsLightning } from "react-icons/bs";
import { MdVerified, MdPhotoLibrary, MdGroups } from "react-icons/md";
import { AiOutlineStar, AiOutlineHeart } from "react-icons/ai";
import { FiArrowRight } from "react-icons/fi";
import SignUp from "./SignUp";
import SignIn from "./SignIn";
import "./LandingPage.css";

function LandingPage({ onGetStarted }) {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const features = [
    {
      icon: <BsFire />,
      title: "Mood-Based Sharing",
      description: "Express yourself with mood tags and connect with others feeling the same vibe"
    },
    {
      icon: <BsTrophy />,
      title: "Level Up System",
      description: "Earn XP, unlock achievements, and showcase your journey with gamified rewards"
    },
    {
      icon: <MdGroups />,
      title: "Authentic Connections",
      description: "Build meaningful relationships in a community that values real interactions"
    },
    {
      icon: <BsShield />,
      title: "Privacy First",
      description: "Your data, your control. We prioritize your privacy and security above all"
    },
    {
      icon: <MdPhotoLibrary />,
      title: "Creative Showcase",
      description: "Pin your best work, organize by mood, and let your creativity shine"
    },
    {
      icon: <BsLightning />,
      title: "Streak Rewards",
      description: "Stay consistent, build habits, and get rewarded for your daily engagement"
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "2M+", label: "Posts Shared" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Community Support" }
  ];

  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <MdVerified />
            <span>Welcome to the Future of Social Media</span>
          </div>
          
          <h1 className="hero-title">
            Share Your
            <span className="title-highlight"> Moments</span>
            <br />
            Connect with
            <span className="title-highlight"> Purpose</span>
          </h1>
          
          <p className="hero-description">
            Luminix is where authentic connections meet creative expression. 
            Share your story, discover inspiring content, and be part of a 
            community that celebrates real moments.
          </p>
          
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => setShowSignUp(true)}>
              <span>Get Started Free</span>
              <FiArrowRight />
            </button>
            <button className="btn-secondary" onClick={() => setShowSignIn(true)}>
              <span>Sign In</span>
            </button>
          </div>

          <div className="hero-social-proof">
            <div className="avatar-group">
              <div className="avatar">👤</div>
              <div className="avatar">👤</div>
              <div className="avatar">👤</div>
              <div className="avatar">👤</div>
              <div className="avatar-count">+50K</div>
            </div>
            <div className="social-proof-text">
              <div className="rating-stars">
                <AiOutlineStar className="filled" />
                <AiOutlineStar className="filled" />
                <AiOutlineStar className="filled" />
                <AiOutlineStar className="filled" />
                <AiOutlineStar className="filled" />
              </div>
              <p>Loved by creators worldwide</p>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-header">
              <div className="card-avatar">🎨</div>
              <div className="card-info">
                <span className="card-name">Creative Post</span>
                <span className="card-mood">feeling inspired ✨</span>
              </div>
            </div>
            <div className="card-image"></div>
            <div className="card-stats">
              <span><AiOutlineHeart /> 1.2K</span>
              <span><BsFire /> 15 day streak</span>
            </div>
          </div>

          <div className="floating-card card-2">
            <div className="achievement-badge">
              <BsTrophy />
              <div className="achievement-info">
                <span className="achievement-title">Trendsetter</span>
                <span className="achievement-desc">Achievement Unlocked!</span>
              </div>
            </div>
          </div>

          <div className="floating-card card-3">
            <div className="level-display">
              <span className="level-label">Level 12</span>
              <div className="level-progress">
                <div className="level-fill" style={{ width: "75%" }}></div>
              </div>
              <span className="xp-text">2850 / 3000 XP</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <h3 className="stat-number">{stat.number}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <div className="section-header">
          <span className="section-badge">Features</span>
          <h2 className="section-title">Everything You Need to Thrive</h2>
          <p className="section-description">
            Discover powerful features designed to enhance your social experience
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Your Journey?</h2>
          <p className="cta-description">
            Join thousands of creators sharing their moments and building meaningful connections
          </p>
          <button className="btn-primary large" onClick={() => setShowSignUp(true)}>
            <span>Create Your Account</span>
            <FiArrowRight />
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Luminix</h3>
            <p>Share moments, connect with purpose</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#updates">Updates</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#blog">Blog</a>
              <a href="#careers">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact</a>
              <a href="#privacy">Privacy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Luminix. All rights reserved.</p>
        </div>
      </footer>

      {showSignUp && <SignUp onClose={() => setShowSignUp(false)} onSwitchToSignIn={() => { setShowSignUp(false); setShowSignIn(true); }} onSuccess={onGetStarted} />}
      {showSignIn && <SignIn onClose={() => setShowSignIn(false)} onSwitchToSignUp={() => { setShowSignIn(false); setShowSignUp(true); }} onSuccess={onGetStarted} />}
    </div>
  );
}

export default LandingPage;