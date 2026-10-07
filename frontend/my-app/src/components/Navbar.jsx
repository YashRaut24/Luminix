import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { MdDarkMode, MdLightMode, MdOutlineRssFeed } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { IoMdLogOut } from "react-icons/io";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { FiTrendingUp, FiSearch, FiPlus, FiCamera } from "react-icons/fi";

const Navbar = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

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
    navigate("/feed");
    setShowFeedMenu(false);
  };

  const logout = () => {
    props.onLogout();
    navigate("/");
  };

  return (
    <>
      {/* Isolated 56px Circular Logo Container */}
      <div
        className="lumi-logo-container"
        onClick={() => setShowMenu(!showMenu)}
        title="Luminix Navigation"
      >
        <img
          src="./src/images/Luminix.jpg"
          alt="Luminix"
        />
      </div>

      {/* Radial action dock */}
      {showMenu && (
        <div className="lumi-radial-dock">
          <button
            type="button"
            className="lumi-radial-dock__btn"
            onClick={() => {
              navigate("/feed/search");
              setShowMenu(false);
            }}
            title="Search Creators"
          >
            <FiSearch />
          </button>

          <button
            type="button"
            className="lumi-radial-dock__btn"
            onClick={() => {
              navigate("/feed/create");
              setShowMenu(false);
            }}
            title="Create Post"
          >
            <FiPlus />
          </button>

          <button
            type="button"
            className="lumi-radial-dock__btn"
            onClick={() => {
              navigate("/feed/camera");
              setShowMenu(false);
            }}
            title="Shoot Flash"
          >
            <FiCamera />
          </button>
        </div>
      )}

      {/* Category selector button */}
      <button
        type="button"
        className="btn--icon"
        style={{
          position: "fixed",
          top: "24px",
          left: "92px",
          width: "44px",
          height: "44px",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-full)",
          zIndex: 80,
        }}
        onClick={() => setShowFeedMenu(!showFeedMenu)}
        title="Browse Topic Categories"
      >
        <MdOutlineRssFeed style={{ fontSize: "20px" }} />
      </button>

      {showFeedMenu && (
        <div
          style={{
            position: "fixed",
            top: "76px",
            left: "92px",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            boxShadow: "var(--shadow-floating)",
            zIndex: 90,
            maxHeight: "360px",
            overflowY: "auto",
          }}
        >
          {categories.map((item, index) => (
            <button
              key={index}
              type="button"
              className="btn btn--ghost"
              style={{ justifyContent: "flex-start", padding: "6px 12px", fontSize: "13px" }}
              onClick={() => handleCategoryClick(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Solid Surface Right Navigation Rail */}
      <div className="lumi-right-rail">
        <button
          type="button"
          className={`lumi-rail-btn ${location.pathname === "/feed/profile" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/profile")}
          data-tooltip="Your Profile"
        >
          {props.user?.profileImage ? (
            <img
              src={`http://localhost:9000${props.user.profileImage}`}
              alt="profile"
            />
          ) : (
            <CgProfile />
          )}
        </button>

        <button
          type="button"
          className={`lumi-rail-btn ${location.pathname === "/feed/connect" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/connect")}
          data-tooltip="Creator Network"
        >
          <MdOutlinePeopleAlt />
        </button>

        <button
          type="button"
          className={`lumi-rail-btn ${location.pathname === "/feed/analytics" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/analytics")}
          data-tooltip="Creator Analytics"
        >
          <FiTrendingUp />
        </button>

        <div className="lumi-rail-divider" />

        <button
          type="button"
          className="lumi-rail-btn"
          onClick={props.changeTheme}
          data-tooltip={props.mode ? "Light Mode" : "Dark Mode"}
        >
          {props.mode ? <MdLightMode /> : <MdDarkMode />}
        </button>

        <button
          type="button"
          className="lumi-rail-btn"
          onClick={logout}
          data-tooltip="Logout"
        >
          <IoMdLogOut />
        </button>
      </div>
    </>
  );
};

export default Navbar;
