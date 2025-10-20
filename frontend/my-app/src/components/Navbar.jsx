import React, { useState } from "react";
import { BsCameraFill } from "react-icons/bs";
import { MdDarkMode } from "react-icons/md";
import { MdLightMode } from "react-icons/md";
import "./Navbar.css";

const Navbar = (props) => {
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
            onClick={() => handleActionClick(props.toggleSearchUser)}
          >
            <span className="icon-wrapper">🔍</span>
          </button>
          
          <button 
            className="menu-icon-btn create-btn" 
            onClick={() => handleActionClick(props.toggleCreatePost)}
          >
            <span className="icon-wrapper">+</span>
          </button>
          
          <button 
            className="menu-icon-btn camera-btn" 
            onClick={() => handleActionClick(props.toggleClick)}
          >
            <span className="icon-wrapper"><BsCameraFill /></span>
          </button>
        </div>
      )}

      <div>
        <button className={props.mode? "dark-theme-toggle" : "theme-toggle"} onClick={props.changeTheme}>{props.mode?<MdDarkMode/>:<MdLightMode/>}</button>
      </div>
    </>
  );
};

export default Navbar;