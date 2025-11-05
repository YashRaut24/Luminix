import React, { useState } from "react";
import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff } from "react-icons/md";
import "./SignUp.css";
import axios from "axios";

function SignUp({ onClose, onSwitchToSignIn, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      axios.post("http://localhost:9000/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      .then((response) => {
        alert("Account created successfully!");
        if (onSuccess) {
          onSuccess({
            name: formData.name,
            email: formData.email
          });
        }
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      })
      .catch((error) => {
        if (error.response?.data?.error) {
          alert(error.response.data.error);
        } else {
          alert("Error while signing up!");
        }
      });
    }
  };

  return (
    <div className="signup-container" onClick={onClose}>
      <div className="signup-page" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        
        <div className="signup-header">
          <h2>Create Account</h2>
          <p>Join Luminix and start sharing your moments</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="signup-form-containers">
            <label>Full Name</label>
            <div className="input-containers">
              <MdPerson className="input-icon" />
              <input
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'error' : ''}
              />
            </div>
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="signup-form-containers">
            <label>Email</label>
            <div className="input-containers">
              <MdEmail className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="signup-form-containers">
            <label>Password</label>
            <div className="input-containers">
              <MdLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={errors.password ? 'error' : ''}
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

          <div className="signup-form-containers">
            <label>Confirm Password</label>
            <div className="input-containers">
              <MdLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="show-password-buttons"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="submit-button">
            Create Account
          </button>
        </form>

        <div className="signup-footer">
          <p>Already have an account? <button onClick={onSwitchToSignIn}>Sign In</button></p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;