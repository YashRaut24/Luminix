import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { MdDarkMode, MdLightMode, MdOutlineRssFeed } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { IoMdLogOut } from "react-icons/io";
import { MdOutlinePeopleAlt } from "react-icons/md";

import "./Navbar.css";

const Navbar = (props) => {
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);
  const [showFeedMenu, setShowFeedMenu] = useState(false);

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
    "Sensitive",
  ];

  const handleCategoryClick = (category) => {
    props.setFeedHeading(category);
    props.setSelectedCategory(category);
    navigate("/feed"); // ensure feed page
    setShowFeedMenu(false);
  };

  const logout = () => {
    props.onLogout();
    navigate("/");
  };

  return (
    <>
      <div className="logo-button" onClick={() => setShowMenu(!showMenu)}>
        <img
          className="luminix-logo"
          src="./src/images/Luminix.jpg"
          alt="Luminix Logo"
        />
      </div>

      {showMenu && (
        <div className="circular-menu">
          <button
            className="menu-icon-btn search-btn"
            onClick={() => navigate("/feed/search")}
          >
            🔍
          </button>

          <button
            className="menu-icon-btn create-btn"
            onClick={() => navigate("/feed/create")}
          >
            +
          </button>

          <button
            className="menu-icon-btn camera-btns"
            onClick={() => navigate("/feed/camera")}
          >
            📷
          </button>
        </div>
      )}

      <button
        className={props.mode ? "dark-feed-button" : "feedbutton"}
        onClick={() => {
          navigate("/feed");
          setShowFeedMenu(!showFeedMenu);
        }}
      >
        <MdOutlineRssFeed />
      </button>

      {showFeedMenu && (
        <div className="feed-menu">
          {categories.map((item, index) => (
            <button
              key={index}
              className="category-item"
              onClick={() => handleCategoryClick(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <button
        className={props.mode ? "dark-mode-profile" : "profile"}
        onClick={() => navigate("/feed/profile")}
      >
        {props.user?.profileImage ? (
          <img
            className="profile-display-image"
            src={`http://localhost:9000${props.user.profileImage}`}
            alt="profile"
          />
        ) : (
          <CgProfile />
        )}
      </button>

      <button
        className={props.mode ? "dark-theme-people-button" : "people-button"}
        onClick={() => navigate("/feed/connect")}
      >
        <MdOutlinePeopleAlt />
      </button>

      <button
        className={props.mode ? "dark-theme-toggle" : "theme-toggle"}
        onClick={props.changeTheme}
      >
        {props.mode ? <MdLightMode /> : <MdDarkMode />}
      </button>

      <button
        className={props.mode ? "dark-logout" : "logout"}
        onClick={logout}
      >
        <IoMdLogOut />
      </button>
    </>
  );
};

export default Navbar;
