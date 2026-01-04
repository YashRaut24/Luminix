import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import "./ShowPost.css";

function ShowPost({ mode }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(
          "http://localhost:9000/posts",
          { withCredentials: true }
        );
        setPosts(res.data.posts);
      } catch (err) {
        console.log(err);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className={mode ? "dark-show-posts-wrapper" : "show-posts-wrapper"}>
      {posts.length === 0 ? (
        <p className="no-posts-message">No posts available</p>
      ) : (
        posts.map(post => (
          <PostCard key={post._id} post={post} mode={mode} />
        ))
      )}
    </div>
  );
}

export default ShowPost;
