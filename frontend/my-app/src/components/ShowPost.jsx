import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ShowPost.css";

function ShowPost(props) {
  const [files, setFiles] = useState([]);
  const[displayEdit,setDisplayEdit] = useState(false);
  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [props.refreshTrigger]);

 const fetchFiles = () => {
  if (!props.user?.email) return; 

  axios
    .get("http://localhost:9000/files", {
      params: { email: props.user.email },
    })
    .then((response) => {
      setFiles(response.data);
    })
    .catch((error) => {
      console.error("Error fetching files", error);
    });
};


  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:9000/delete/${id}`)
      .then(() => {
        fetchFiles();
      })
      .catch((error) => {
        console.error("Error deleting file", error);
      });
  };

  const formatTime = (time) => {
    const date = new Date(time);
    return date.toLocaleString();
  };

  return (
    <div className={props.mode ? "dark-show-posts-container" : "show-posts-container"}>
      <h2>Your Feed</h2>
      <div className="posts-grid">
        {files.map((file) => (
          <div key={file._id} className="post-card">
            <div className="post-header">
              <h4>{file.username}</h4>
              <span className="post-audience">
                {file.target === "public" ? "🌍 Public" : "🔒 Private"}
              </span>
            </div>

            <div className="post-image-container">
              <img
                src={file.file_url}
                alt={file.file_name}
                className="post-image"
              />
            </div>

            <div className="post-footer">
              <p className="post-caption">{file.caption}</p>

              {file.tags && file.tags.length > 0 && (
                <div className="post-tags">
                  {file.tags.map((tag, index) => (
                    <span key={index} className="tag-chip">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="post-time">{formatTime(file.upload_time)}</p>

              {file.email === props.user?.email && (
                <button
                  className="delete-button"
                  onClick={() => handleDelete(file._id)}
                >
                  Delete
                </button>   
              )}

              {file.email === props.user?.email && (
                <button
                  className="edit-button"
                >
                  Edit
                </button>   
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShowPost;