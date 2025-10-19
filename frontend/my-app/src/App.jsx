import React, { useState } from "react";
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

  const toggleCreatePost = () => setShowCreate((prev) => !prev);
  const refreshPosts = () => setRefreshTrigger((prev) => prev + 1);
  const toggleSearchUser = () => setShowSearchUser((prev) => !prev);
  const toggleClick = () => setShowClick((prev) => !prev);
  

  return (
    <div className="app-container">
      <Navbar 
        toggleCreatePost={toggleCreatePost}
        toggleSearchUser={toggleSearchUser}
        toggleClick={toggleClick}
      />

      <main>
        {showCreate && <CreatePost setRefreshTrigger={setRefreshTrigger} />}
        {showSearchUser && <SearchUser />}
        {showClick && <Click onClose={toggleClick} onUpload={refreshPosts} />}

        <ShowPost refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
};

export default App;