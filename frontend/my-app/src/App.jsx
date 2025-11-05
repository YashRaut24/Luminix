import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CreatePost from "./components/CreatePost";
import ShowPost from "./components/ShowPost";
import SearchUser from "./components/SearchUser";
import Click from "./components/Click";
import Profile from "./components/Profile";
import LandingPage from "../pages/LandingPage";
import "./App.css";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSearchUser, setShowSearchUser] = useState(false);
  const [showClick, setShowClick] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  function changeTheme() {
    localStorage.setItem("darkMode", !darkMode);
    setDarkMode((prev) => !prev);
  }

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem("userData");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUserData(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Error parsing saved user data:", err);
        localStorage.removeItem("userData");
      }
    }
  }, []);

  const handleAuthSuccess = (user) => {
    setUserData(user);
    setIsAuthenticated(true);
    localStorage.setItem("userData", JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    localStorage.removeItem("userData");
  };

  const toggleCreatePost = () => setShowCreate((prev) => !prev);
  const refreshPosts = () => setRefreshTrigger((prev) => prev + 1);
  const toggleSearchUser = () => setShowSearchUser((prev) => !prev);
  const toggleClick = () => setShowClick((prev) => !prev);
  const toggleProfile = () => setShowProfile((prev) => !prev);

  if (!isAuthenticated) {
    return <LandingPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className={darkMode ? "dark-app-container" : "app-container"}>
      <Navbar
        mode={darkMode}
        changeTheme={changeTheme}
        toggleCreatePost={toggleCreatePost}
        toggleSearchUser={toggleSearchUser}
        toggleClick={toggleClick}
        toggleProfile={toggleProfile}
        onLogout={handleLogout}
        user={userData}
      />

      <main>
        {showCreate && <CreatePost mode={darkMode} setRefreshTrigger={setRefreshTrigger} user={userData} />}
        {showSearchUser && <SearchUser mode={darkMode} />}
        {showClick && <Click mode={darkMode} onClose={toggleClick} onUpload={refreshPosts} />}
        {showProfile && <Profile mode={darkMode} onClose={toggleProfile} user={userData} />}
        <ShowPost mode={darkMode} refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
};

export default App;