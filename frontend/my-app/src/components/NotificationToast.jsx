import React, { useState, useEffect } from "react";
import socket from "../socket";
import "./NotificationToast.css";
import { FiX, FiHeart, FiUserCheck, FiMessageSquare, FiZap } from "react-icons/fi";

const NotificationToast = ({ user }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (user && user.id) {
      // Join user specific room for direct notifications
      socket.emit("join_user", user.id);
    }

    const handleNotification = (notif) => {
      const newToast = {
        id: Date.now() + Math.random(),
        type: notif.type,
        title: notif.title || "Luminix Notification",
        message: notif.message,
        avatar: notif.avatar,
        timestamp: new Date(),
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 4));

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4500);
    };

    const handleFlashPosted = (data) => {
      if (user && data.username !== user.name) {
        handleNotification({
          type: "flash",
          title: "New 24h Flash! ⚡",
          message: `${data.username} just posted an ephemeral flash story`,
          avatar: data.flash?.userAvatar,
        });
      }
    };

    socket.on("user_notification", handleNotification);
    socket.on("new_flash_posted", handleFlashPosted);

    return () => {
      socket.off("user_notification", handleNotification);
      socket.off("new_flash_posted", handleFlashPosted);
    };
  }, [user]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case "like":
        return <FiHeart className="toast-icon like" />;
      case "follow":
        return <FiUserCheck className="toast-icon follow" />;
      case "comment":
        return <FiMessageSquare className="toast-icon comment" />;
      case "flash":
        return <FiZap className="toast-icon flash" />;
      default:
        return <FiHeart className="toast-icon" />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="notification-toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type}`}>
          <div className="toast-icon-wrapper">{getIcon(toast.type)}</div>

          {toast.avatar ? (
            <img
              src={
                toast.avatar.startsWith("http")
                  ? toast.avatar
                  : `http://localhost:9000${toast.avatar}`
              }
              alt=""
              className="toast-avatar"
            />
          ) : null}

          <div className="toast-body">
            <span className="toast-title">{toast.title}</span>
            <p className="toast-message">{toast.message}</p>
          </div>

          <button
            className="toast-dismiss-btn"
            onClick={() => removeToast(toast.id)}
          >
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
