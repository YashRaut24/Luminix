import React, { useState } from "react";
import axios from "axios";
import "./Styles.css";

function CreatePost(props){
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState("");
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="create-post-container">
      <h2>Create a New Post</h2>
      <form onSubmit={()=>{alert("handleSubmit")}} className="upload-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="text-input"
        />

        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="caption-input"
        />

        <input
          type="file"
          onChange={handleFileChange}
          className="file-input"
        />

        <button type="submit" className="upload-button">
          Upload
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default CreatePost;
