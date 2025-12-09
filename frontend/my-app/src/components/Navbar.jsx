import React, { useState } from "react";
import { MdDarkMode } from "react-icons/md";
import { MdLightMode } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { IoMdLogOut } from "react-icons/io";
import LandingPage from "../../pages/LandingPage";
import { MdOutlineRssFeed } from "react-icons/md";

import "./Navbar.css";

const Navbar = (props) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [displayFeed, setDisplayFeed] = useState(false);
  const [feedContent, setFeedContent] = useState([]);

  const handleLogoClick = () => {
    setShowMenu(!showMenu);
  };

  const handleFeedClick = () => {
    setShowFeed(!showFeed);
  };
  
  const handleActionClick = (action) => {
    action();
    setShowMenu(false); 
  };

  const logout = () => {
    props.onLogout(); 
  };

  const categories = [
    "Your feed",
    "News",
    "Memes",
    "Emotional",
    "Entertainment",
    "Knowledge",
    "Creative",
    "Discussions",
    "Sports",
    "Achievements",
    "Music",
    "Tech Posts",
    "Sensitive"
  ];

  const content = [
    "Your feed",
    "News feed",
    "Memes page",
    "Emotional Cards",
    "Reels effect",
    "Knowledge gain",
    "Creative design",
    "Discussion forum",
    "Sports keeda",
    "Achievements section",
    "Music loves",
    "Tech posts",
    "Sensitive feed"
  ]
  
  const handleDisplayFeed = (index) => {
    props.setFeedHeading(content[index]);
    setFeedContent(content[index]);
    setDisplayFeed(true);
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

      <div>
        <button className={props.mode ? "dark-feed-button" : "feedbutton"} onClick={handleFeedClick}><MdOutlineRssFeed /></button>
        {showFeed && (
          <div className="feed-menu">
              {categories.map((item, index) => (
              <button key={index} className="category-item" onClick={()=>{handleDisplayFeed(index)}}>
                {item}
              </button>
              ))}
          </div>
        )}
      </div>
      {displayFeed && (
        <div className={props.mode ? "dark-feed-page" : "feed-page"}>
          <h2>{props.feedHeading}</h2>
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