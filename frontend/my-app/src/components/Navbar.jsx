import React from "react";
import { BsCameraFill } from "react-icons/bs";
import "./Navbar.css";

const Navbar = ({ toggleCreatePost, toggleSearchUser, toggleClick }) => {
  return (
    <header className="app-header">
      <h1>
        <span className="Ti">
          <img className="luminix-logo" src="./src/images/Luminix.jpg" alt="Luminix Logo" />
        </span>
        <span className="logo">Luminix</span>
      </h1>

      <div className="action-buttons">
        <button className="plus-button" onClick={toggleCreatePost}>
          +
        </button>
        <button className="search-user-button" onClick={toggleSearchUser}>
          🔍
        </button>
        <button className="camera-button" onClick={toggleClick}>
          <BsCameraFill />
        </button>
      </div>
    </header>
  );
};

export default Navbar;