import React, { useState } from "react";
import axios from "axios";
import {
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff
} from "react-icons/md";
import "./SignIn.css";

function SignIn({ onClose, onSwitchToSignUp, onAuthSuccess }) {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:9000/signin",
        formData,
        { withCredentials: true }
      );

      onAuthSuccess(res.data.user);
      console.log("LOGIN RESPONSE:", res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="signin-container" onClick={onClose}>
      <div className="signin-page" onClick={(e) => e.stopPropagation()}>
        <button className="close-button font-mono" onClick={onClose} title="Close">✕</button>

        <div className="signin-header">
          <div className="signin-badge font-mono">[SESSION // AUTHENTICATION]</div>
          <h2>Sign In to Workspace</h2>
          <p>Access your proofs, critique bays, and co-authored projects</p>
        </div>

        <form className="signin-form" onSubmit={handleSubmit}>
          <div className="signin-form-containers">
            <label className="font-mono">EMAIL ADDRESS</label>
            <div className="input-containers">
              <MdEmail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="creator@luminix.studio"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="signin-form-containers">
            <label className="font-mono">PASSWORD</label>
            <div className="input-containers">
              <MdLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="show-password-buttons"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Remember session</span>
            </label>
            <button type="button" className="forgot-password font-mono">
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="submit-button font-mono">
            SIGN IN TO DARKROOM
          </button>
        </form>

        <div className="signin-footer">
          <p>
            Don't have an account?
            <button onClick={onSwitchToSignUp} className="font-mono"> Create Account</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
