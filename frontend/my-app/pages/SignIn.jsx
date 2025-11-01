import React, { useState } from "react";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import "./SignIn.css";
import axios from "axios";

function SignIn({ onClose, onSwitchToSignUp, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      axios.post("http://localhost:9000/signin", formData)
        .then(() => {
          alert("Signed in successfully!");
          onSuccess && onSuccess();
        })
        .catch(() => {
          alert("Invalid email or password!");
        });
    }
  };

  return (
    <div className="signin-container" onClick={onClose}>
      <div className="signin-page" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>

        <div className="signin-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to Luminix</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="signin-form-containers">
            <label>Email</label>
            <div className="input-containers">
              <MdEmail className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={errors.email ? "error" : ""}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="signin-form-containers">
            <label>Password</label>
            <div className="input-containers">
              <MdLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={errors.password ? "error" : ""}
              />
              <button
                type="button"
                className="show-password-buttons"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="forgot-password">Forgot Password?</button>
          </div>

          <button type="submit" className="submit-button">Sign In</button>
        </form>

        <div className="signin-footer">
          <p>Don’t have an account? <button onClick={onSwitchToSignUp}>Sign Up</button></p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
