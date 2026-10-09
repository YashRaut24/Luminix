import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { MdDarkMode, MdLightMode, MdOutlinePeopleAlt } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { IoMdLogOut } from "react-icons/io";
import { FiTrendingUp, FiSearch, FiPlus, FiCamera, FiGrid, FiBriefcase, FiEdit3 } from "react-icons/fi";

const Navbar = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    props.onLogout();
    navigate("/");
  };

  return (
    <aside className="darkroom-spine">
      {/* Top: Workspace Logo */}
      <div className="darkroom-spine__top">
        <div
          className="darkroom-spine__logo"
          onClick={() => navigate("/feed")}
          title="Luminix Darkroom / Lightbox"
        >
          <img
            src="/src/images/Luminix.jpg"
            alt="Luminix"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Mid: Primary Tool Navigation */}
      <nav className="darkroom-spine__mid">
        <button
          type="button"
          className={`darkroom-spine__btn ${location.pathname === "/feed" ? "is-active" : ""}`}
          onClick={() => navigate("/feed")}
          data-label="Contact Sheet"
          title="Contact Sheet"
        >
          <FiGrid />
        </button>

        <button
          type="button"
          className={`darkroom-spine__btn ${location.pathname === "/feed/search" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/search")}
          data-label="Search Creators"
          title="Search Creators"
        >
          <FiSearch />
        </button>

        <button
          type="button"
          className={`darkroom-spine__btn ${location.pathname === "/feed/create" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/create")}
          data-label="New Frame"
          title="New Frame"
        >
          <FiPlus />
        </button>

        <button
          type="button"
          className={`darkroom-spine__btn ${location.pathname === "/feed/camera" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/camera")}
          data-label="24h Flash"
          title="24h Flash"
        >
          <FiCamera />
        </button>

        <button
          type="button"
          className={`darkroom-spine__btn ${location.pathname === "/feed/connect" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/connect")}
          data-label="Creator Network"
          title="Creator Network"
        >
          <MdOutlinePeopleAlt />
        </button>

        <button
          type="button"
          className={`darkroom-spine__btn ${location.pathname === "/feed/analytics" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/analytics")}
          data-label="Creator Analytics"
          title="Creator Analytics"
        >
          <FiTrendingUp />
        </button>

        <button
          type="button"
          className={`darkroom-spine__btn ${location.pathname === "/feed/collab" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/collab")}
          data-label="Collab Board"
          title="Collab Board"
        >
          <FiBriefcase />
        </button>

        <button
          type="button"
          className={`darkroom-spine__btn ${location.pathname === "/feed/sketch" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/sketch")}
          data-label="Live Sketch"
          title="Live Sketch Room"
        >
          <FiEdit3 />
        </button>
      </nav>

      {/* Bottom: Theme, Profile & Session */}
      <div className="darkroom-spine__bottom">
        <div className="darkroom-spine__divider" />

        {/* Theme Toggle: Darkroom / Lightbox */}
        <button
          type="button"
          className="darkroom-spine__btn"
          onClick={props.changeTheme}
          data-label="Darkroom / Lightbox"
          title="Darkroom / Lightbox"
        >
          {props.mode ? <MdLightMode /> : <MdDarkMode />}
        </button>

        {/* Profile */}
        <button
          type="button"
          className={`darkroom-spine__btn ${location.pathname === "/feed/profile" ? "is-active" : ""}`}
          onClick={() => navigate("/feed/profile")}
          data-label="Creator Profile"
          title="Creator Profile"
        >
          {props.user?.profileImage ? (
            <img
              src={`http://localhost:9000${props.user.profileImage}`}
              alt="profile"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-xs)",
                objectFit: "cover",
              }}
            />
          ) : (
            <CgProfile />
          )}
        </button>

        {/* Logout */}
        <button
          type="button"
          className="darkroom-spine__btn"
          onClick={logout}
          data-label="Logout"
          title="Logout"
        >
          <IoMdLogOut />
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
