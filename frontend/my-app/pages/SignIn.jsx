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
        <button className="close-button" onClick={onClose}>✕</button>

        <div className="signin-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to Luminix</p>
        </div>

        <form className="signin-form" onSubmit={handleSubmit}>

          <div className="signin-form-containers">
            <label>Email</label>
            <div className="input-containers">
              <MdEmail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="signin-form-containers">
            <label>Password</label>
            <div className="input-containers">
              <MdLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="show-password-buttons"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button type="button" className="forgot-password">
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="submit-button">
            Sign In
          </button>
        </form>

        <div className="signin-footer">
          <p>
            Don't have an account?
            <button onClick={onSwitchToSignUp}> Sign Up</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
