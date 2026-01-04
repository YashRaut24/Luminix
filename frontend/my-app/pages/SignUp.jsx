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

  const[name,setName] = useState("");
  const[email,setEmail] = useState("");
  const[password,setPassword] = useState("");
  const[confirmPassword,setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); 

    const formData = {
      name,
      email,
      password
    };

    if(password !== confirmPassword){
      alert("Password doesn't match please try again!")
    }else{
      axios.post("http://localhost:9000/signup",formData)
      .then(res=>{
        alert(res.data.message);
        onSuccess?.(res.data.user);
        onSwitchToSignIn();
      })
      .catch(err => {
      console.error(err);
      alert(err.response?.data?.message || "Server error");
    });
    }
    console.log("Submitting:", { name, email, password });
  };


  return (
    <div className="signup-container" >
      <div className="signup-page" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>

        <div className="signup-header">
          <h2>Create Account</h2>
          <p>Join Luminix and start sharing your moments</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit} >

          <div className="signup-form-containers">
            <label>Full Name</label>
            <div className="input-containers">
              <MdPerson className="input-icon" />
              <input
                type="text"
                value={name}
                placeholder="Enter your name"
                onChange={(e)=>setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="signup-form-containers">
            <label>Email</label>
            <div className="input-containers">
              <MdEmail className="input-icon" />
              <input
                type="email"
                value={email}
                placeholder="Enter your email"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="signup-form-containers">
            <label>Password</label>
            <div className="input-containers">
              <MdLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"                
                onChange={(e)=>setPassword(e.target.value)}
                required
                minLength={6}
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

          <div className="signup-form-containers">
            <label>Confirm Password</label>
            <div className="input-containers">
              <MdLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                onChange={(e)=>setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="show-password-buttons"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button">
            Create Account
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?
            <button onClick={onSwitchToSignIn}> Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
