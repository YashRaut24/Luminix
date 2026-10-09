import React, { useState } from "react";
import {
  MdEmail,
  MdLock,
  MdPerson,
  MdVisibility,
  MdVisibilityOff
} from "react-icons/md";
import "./SignUp.css";
import axios from 'axios';

function SignUp({ onClose, onSwitchToSignIn, onSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      name,
      email,
      password
    };

    if (password !== confirmPassword) {
      alert("Password doesn't match please try again!");
    } else {
      axios.post("http://localhost:9000/signup", formData)
        .then(res => {
          alert(res.data.message);
          onSuccess?.(res.data.user);
          onSwitchToSignIn();
        })
        .catch(err => {
          console.error(err);
          alert(err.response?.data?.message || "Server error");
        });
    }
  };

  return (
    <div className="signup-container" onClick={onClose}>
      <div className="signup-page" onClick={(e) => e.stopPropagation()}>
        <button className="close-button font-mono" onClick={onClose} title="Close">✕</button>

        <div className="signup-header">
          <div className="signup-badge font-mono">[SESSION // REGISTRATION]</div>
          <h2>Create Workspace Account</h2>
          <p>Join the Darkroom community of visual creators and peer critics</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-form-containers">
            <label className="font-mono">CREATOR CALLSIGN / FULL NAME</label>
            <div className="input-containers">
              <MdPerson className="input-icon" />
              <input
                type="text"
                value={name}
                placeholder="Elena Vance"
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="signup-form-containers">
            <label className="font-mono">EMAIL ADDRESS</label>
            <div className="input-containers">
              <MdEmail className="input-icon" />
              <input
                type="email"
                value={email}
                placeholder="creator@luminix.studio"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="signup-form-containers">
            <label className="font-mono">PASSWORD</label>
            <div className="input-containers">
              <MdLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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

          <div className="signup-form-containers">
            <label className="font-mono">CONFIRM PASSWORD</label>
            <div className="input-containers">
              <MdLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="show-password-buttons"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button font-mono">
            INITIALIZE CREATOR ACCOUNT
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?
            <button onClick={onSwitchToSignIn} className="font-mono"> Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
