import { Outlet, Navigate } from "react-router-dom";
import Navbar from "../src/components/Navbar";
import { useState } from "react";
import "../src/components/Navbar.css"
function HomePage({
  isAuthenticated,
  userData,
  darkMode,
  changeTheme,
  handleLogout,
  setFeedHeading,
  setSelectedCategory
}) {
  if (!isAuthenticated) return <Navigate to="/" />;

  return (
    // <div className={darkMode ? "dark-app-container" : "app-container"}>
    <div>
      <Navbar
        mode={darkMode}
        changeTheme={changeTheme}
        onLogout={handleLogout}
        user={userData}
        setFeedHeading={setFeedHeading}
        setSelectedCategory={setSelectedCategory}
      />

        <div className="home-page">
            <Outlet />
        </div>
    </div>
  );
}

export default HomePage;
