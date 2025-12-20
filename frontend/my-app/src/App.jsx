import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

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
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const [feedHeading, setFeedHeading] = useState("");
  const [selectedPostType, setSelectedPostType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  function changeTheme() {
    localStorage.setItem("darkMode", !darkMode);
    setDarkMode(prev => !prev);
  }

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem("userData");
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
      setIsAuthenticated(true);
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

  const toggleCreatePost = () => setShowCreate(prev => !prev);
  const toggleSearchUser = () => setShowSearchUser(prev => !prev);
  const toggleClick = () => setShowClick(prev => !prev);
  const toggleProfile = () => setShowProfile(prev => !prev);
  const refreshPosts = () => setRefreshTrigger(prev => prev + 1);

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to="/feed" />
              : <LandingPage onAuthSuccess={handleAuthSuccess} />
          }
        />

        <Route
          path="/feed"
          element={
            isAuthenticated ? (
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
                  setFeedHeading={setFeedHeading}
                  refreshTrigger={refreshTrigger}
                  feedHeading={feedHeading}
                  setSelectedPostType={setSelectedPostType}
                  setSelectedCategory={setSelectedCategory}
                />

                <main>
                  {showCreate && (
                    <CreatePost
                      mode={darkMode}
                      setRefreshTrigger={setRefreshTrigger}
                      user={userData}
                    />
                  )}

                  {showSearchUser && <SearchUser mode={darkMode} />}

                  {showClick && (
                    <Click
                      mode={darkMode}
                      onClose={toggleClick}
                      onUpload={refreshPosts}
                    />
                  )}

                  {showProfile && (
                    <Profile
                      mode={darkMode}
                      onClose={toggleProfile}
                      user={userData}
                    />
                  )}

                  <ShowPost
                    mode={darkMode}
                    refreshTrigger={refreshTrigger}
                    user={userData}
                    feedHeading={feedHeading}
                    selectedCategory={selectedCategory}
                  />
                </main>
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/profile"
          element={
            isAuthenticated
              ? <Profile mode={darkMode} user={userData} />
              : <Navigate to="/" />
          }
        />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
