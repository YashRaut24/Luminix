import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import Navbar from "./components/Navbar";
import ShowPost from "./components/ShowPost";
import CreatePost from "./components/CreatePost";
import SearchUser from "./components/SearchUser";
import Click from "./components/Click";
import Profile from "./components/Profile";
import CreatorAnalytics from "./components/CreatorAnalytics";
import CommandPalette from "./components/CommandPalette";
import CollabBoard from "./components/CollabBoard";
import LiveSketchRoom from "./components/LiveSketchRoom";

import "./App.css";
import HomePage from "../pages/HomePage";
import Connect from "../pages/Connect";
import NotificationToast from "./components/NotificationToast";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const [showCreate, setShowCreate] = useState(false);
  const [showSearchUser, setShowSearchUser] = useState(false);
  const [showClick, setShowClick] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [feedHeading, setFeedHeading] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const handleAuthSuccess = (user) => {
    setUserData(user);
    setIsAuthenticated(true);
    localStorage.setItem("userData", JSON.stringify(user));
  };
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:9000/me", {
          credentials: "include",
        });
        if (!res.ok) throw new Error();

        const data = await res.json();
        setUserData(data.user);
        setIsAuthenticated(true);
        localStorage.setItem("userData", JSON.stringify(data.user));
      } catch {
        setIsAuthenticated(false);
        setUserData(null);
        localStorage.removeItem("userData");
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("darkroom", darkMode);
    document.body.classList.toggle("lightbox", !darkMode);
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const changeTheme = () => {
    localStorage.setItem("darkMode", !darkMode);
    setDarkMode(prev => !prev);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    localStorage.removeItem("userData");
  };

  return (
    <main>
    <Routes>

  <Route
    path="/"
    element={
      isAuthenticated
        ? <Navigate to="/feed" />
        : <LandingPage
            onAuthSuccess={handleAuthSuccess}
            darkMode={darkMode}
            changeTheme={changeTheme}
          />
    }
  />
  <Route
    path="/signin"
    element={
      isAuthenticated
        ? <Navigate to="/feed" />
        : <LandingPage
            onAuthSuccess={handleAuthSuccess}
            darkMode={darkMode}
            changeTheme={changeTheme}
            initialModal="signin"
          />
    }
  />
  <Route
    path="/signup"
    element={
      isAuthenticated
        ? <Navigate to="/feed" />
        : <LandingPage
            onAuthSuccess={handleAuthSuccess}
            darkMode={darkMode}
            changeTheme={changeTheme}
            initialModal="signup"
          />
    }
  />

  <Route
    path="/feed"
    element={
      <HomePage
        isAuthenticated={isAuthenticated}
        userData={userData}
        darkMode={darkMode}
        changeTheme={changeTheme}
        handleLogout={handleLogout}
        setFeedHeading={setFeedHeading}
        setSelectedCategory={setSelectedCategory}
      />
    }
  >
    <Route
      index
      element={
        <ShowPost
          mode={darkMode}
          refreshTrigger={refreshTrigger}
          user={userData}
          feedHeading={feedHeading}
          selectedCategory={selectedCategory}
        />
      }
    />

    <Route
      path="profile"
      element={<Profile mode={darkMode} user={userData} />}
    />

    <Route
      path="search"
      element={<SearchUser mode={darkMode} />}
    />

    <Route
      path="create"
      element={
        <CreatePost
          mode={darkMode}
          user={userData}
          setRefreshTrigger={setRefreshTrigger}
        />
      }
    />
    
    <Route
      path="connect"
      element={
        <Connect
          mode={darkMode}
          darkMode={darkMode}
          user={userData}
        />
      }
    />

    <Route
      path="camera"
      element={
        <Click
          mode={darkMode}
          onClose={() => {}}
          onUpload={() => setRefreshTrigger(prev => prev + 1)}
        />
      }
    />

    <Route
      path="analytics"
      element={
        <CreatorAnalytics
          mode={darkMode}
          user={userData}
        />
      }
    />

    <Route
      path="collab"
      element={
        <CollabBoard
          mode={darkMode}
          user={userData}
        />
      }
    />

    <Route
      path="sketch"
      element={
        <LiveSketchRoom
          mode={darkMode}
          user={userData}
        />
      }
    />
  </Route>

</Routes>

      <NotificationToast user={userData} />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setFeedHeading(cat);
        }}
        onToggleTheme={changeTheme}
        mode={darkMode}
      />
    </main>
  );
}

export default App;
