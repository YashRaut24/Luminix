import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CommandPalette.css";
import {
  FiSearch,
  FiHome,
  FiCamera,
  FiTrendingUp,
  FiUser,
  FiPlus,
  FiUsers,
  FiMoon,
  FiSun,
  FiCornerDownLeft,
  FiCompass,
  FiX
} from "react-icons/fi";
import { BsStars, BsPaletteFill } from "react-icons/bs";

const COMMANDS = [
  { id: "feed", title: "Feed & Explorations", subtitle: "Go to community feed", icon: <FiHome />, path: "/feed", category: "Navigation" },
  { id: "search", title: "Semantic Discovery", subtitle: "Search creations by vibe or keyword", icon: <FiCompass />, path: "/feed/search", category: "Navigation" },
  { id: "create", title: "Create New Piece", subtitle: "Publish artwork or WIP thread", icon: <FiPlus />, path: "/feed/create", category: "Actions" },
  { id: "camera", title: "Studio Camera (Click)", subtitle: "Capture photo with custom filters & grid", icon: <FiCamera />, path: "/feed/camera", category: "Actions" },
  { id: "analytics", title: "Creator Studio Analytics", subtitle: "Audience metrics, best timing & charts", icon: <FiTrendingUp />, path: "/feed/analytics", category: "Creator Tools" },
  { id: "connect", title: "Mutuals Graph & Connect", subtitle: "Visualize creator network in 2D force space", icon: <FiUsers />, path: "/feed/connect", category: "Community" },
  { id: "profile", title: "Creator Profile", subtitle: "View your moodboards, badges & works", icon: <FiUser />, path: "/feed/profile", category: "Navigation" },
  { id: "cat-creative", title: "Creative Showcase", subtitle: "Filter posts by #Creative", icon: <BsPaletteFill />, category: "Categories", action: "filter-creative" },
  { id: "cat-tech", title: "Tech & Dev Art", subtitle: "Filter posts by #Tech", icon: <BsStars />, category: "Categories", action: "filter-tech" },
  { id: "cat-3d", title: "3D & Motion Graphics", subtitle: "Filter posts by #3D", icon: <BsStars />, category: "Categories", action: "filter-3d" },
];

function CommandPalette({ isOpen, onClose, onSelectCategory, onToggleTheme, mode }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCommands = COMMANDS.filter((cmd) => {
    const text = `${cmd.title} ${cmd.subtitle} ${cmd.category}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const handleSelect = (cmd) => {
    if (cmd.path) {
      navigate(cmd.path);
    } else if (cmd.action && onSelectCategory) {
      if (cmd.action === "filter-creative") onSelectCategory("Creative");
      if (cmd.action === "filter-tech") onSelectCategory("Tech Posts");
      if (cmd.action === "filter-3d") onSelectCategory("Creative");
      navigate("/feed");
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`command-palette-backdrop ${mode ? "dark-theme" : ""}`} onClick={onClose}>
      <div className="command-palette-modal" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Box */}
        <div className="palette-input-wrapper">
          <FiSearch className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or jump to page... (ESC to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="palette-input"
          />
          {query && (
            <button type="button" className="palette-clear-btn" onClick={() => setQuery("")}>
              <FiX />
            </button>
          )}
          <span className="palette-esc-badge">ESC</span>
        </div>

        {/* Results List */}
        <div className="palette-results-list">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  className={`palette-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="palette-item-left">
                    <span className="palette-item-icon">{cmd.icon}</span>
                    <div className="palette-item-texts">
                      <span className="palette-item-title">{cmd.title}</span>
                      <span className="palette-item-subtitle">{cmd.subtitle}</span>
                    </div>
                  </div>
                  <div className="palette-item-right">
                    <span className="palette-category-tag">{cmd.category}</span>
                    {isSelected && <FiCornerDownLeft className="palette-enter-icon" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="palette-empty-state">
              <p>No matching commands found for "{query}"</p>
            </div>
          )}
        </div>

        {/* Palette Footer */}
        <div className="palette-footer">
          <div className="footer-shortcut-hints">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> Navigate
            </span>
            <span>
              <kbd>↵</kbd> Select
            </span>
            <span>
              <kbd>ESC</kbd> Close
            </span>
          </div>
          <span className="footer-brand">Luminix Quick Jump</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
