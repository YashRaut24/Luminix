import React, { useState } from "react";
import { MdDarkMode } from "react-icons/md";
import { MdLightMode } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { IoMdLogOut } from "react-icons/io";
import LandingPage from "../../pages/LandingPage";

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

   const logout = () => {
  props.onLogout(); 
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
            className="menu-icon-btn camera-btns" 
            onClick={() => handleActionClick(props.toggleClick)}
          >
            <span className="icon-wrapper">📷</span>
          </button>
        </div>
      )}

      <button 
        className={props.mode ? "dark-mode-profile" : "profile"}  
        onClick={props.toggleProfile}
      >
        <CgProfile />
      </button>
      <button 
        className={props.mode ? "dark-theme-toggle" : "theme-toggle"} 
        onClick={props.changeTheme}
      >
        {props.mode ? <MdLightMode /> : <MdDarkMode />}
      </button>

      <button className={props.mode? "dark-logout" : "logout"} onClick={logout}>
        <IoMdLogOut />
      </button>
    </>
  );
};
 
export default Navbar;