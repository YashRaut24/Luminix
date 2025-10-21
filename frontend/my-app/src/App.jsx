import React, { useState,useEffect } from "react";
import Navbar from "./components/Navbar";
import CreatePost from "./components/CreatePost";
import ShowPost from "./components/ShowPost";
import SearchUser from "./components/SearchUser";
import Click from "./components/Click";
import "./App.css";

const App = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showSearchUser, setShowSearchUser] = useState(false);
  const [showClick, setShowClick] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  let [darkMode,setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  function changeTheme() {
    localStorage.setItem("darkMode", !darkMode);
    setDarkMode((prev)=>!prev);
  }

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const toggleCreatePost = () => setShowCreate((prev) => !prev);
  const refreshPosts = () => setRefreshTrigger((prev) => prev + 1);
  const toggleSearchUser = () => setShowSearchUser((prev) => !prev);
  const toggleClick = () => setShowClick((prev) => !prev);
  

  return (
    <div className={darkMode? "dark-app-container" : "app-container"}>
      <Navbar 
        mode={darkMode}
        changeTheme={changeTheme}
        toggleCreatePost={toggleCreatePost}
        toggleSearchUser={toggleSearchUser}
        toggleClick={toggleClick}
      />

      <main>
        {showCreate && <CreatePost mode = {darkMode} setRefreshTrigger={setRefreshTrigger} />}
        {showSearchUser && <SearchUser mode = {darkMode}/>}
        {showClick && <Click mode = {darkMode} onClose={toggleClick} onUpload={refreshPosts} />}

        <ShowPost mode = {darkMode} refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
};

export default App;