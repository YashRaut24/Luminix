import React, { useState } from "react";
import { BsCameraFill } from "react-icons/bs";
import "./Navbar.css";

const Navbar = ({ toggleCreatePost, toggleSearchUser, toggleClick }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogoClick = () => {
    setShowMenu(!showMenu);
  };

  const handleActionClick = (action) => {
    action();
    setShowMenu(false);
  };

  return (
    <>
      <div className="logo-button" onClick={handleLogoClick}>
        <img className="luminix-logo" src="./src/images/Luminix.jpg" alt="Luminix Logo" />
      </div>

      {showMenu && (
        <div className="circular-menu">
          <button 
            className="menu-icon-btn search-btn" 
            onClick={() => handleActionClick(toggleSearchUser)}
          >
            <span className="icon-wrapper">🔍</span>
          </button>
          
          <button 
            className="menu-icon-btn create-btn" 
            onClick={() => handleActionClick(toggleCreatePost)}
          >
            <span className="icon-wrapper">+</span>
          </button>
          
          <button 
            className="menu-icon-btn camera-btn" 
            onClick={() => handleActionClick(toggleClick)}
          >
            <span className="icon-wrapper"><BsCameraFill /></span>
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;