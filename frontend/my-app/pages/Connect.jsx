import "./Connect.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ConnectCard from "./ConnectCard";
import MutualsGraph from "../src/components/MutualsGraph";
import {
  FiAward,
  FiTrendingUp,
  FiRepeat,
  FiArrowRight,
  FiHeart,
  FiUserPlus
} from "react-icons/fi";
import { BsPaletteFill } from "react-icons/bs";

function Connect(props) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [spotlight, setSpotlight] = useState(null);
  const [remixChains, setRemixChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followedSpotlight, setFollowedSpotlight] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch contacts
        const contactsRes = await axios.get("http://localhost:9000/contacts", {
          withCredentials: true,
        });

        const transformedContacts = contactsRes.data.map((contact) => ({
          ...contact,
          lumiTag:
            contact.lumiTag ||
            `@${contact.name.toLowerCase().replace(/\s+/g, "")}`,
          mutuals:
            contact.followers?.length > 0
              ? `${contact.followers.length} mutual${
                  contact.followers.length > 1 ? "s" : ""
                }`
              : "No mutuals yet",
        }));
        setContacts(transformedContacts);

        // 2. Fetch Creator Spotlight of the Week (auto-picked by growth rate)
        try {
          const spotlightRes = await axios.get("http://localhost:9000/spotlight", {
            withCredentials: true,
          });
          setSpotlight(spotlightRes.data);
        } catch (spotErr) {
          console.error("Spotlight fetch error:", spotErr);
        }

        // 3. Fetch Creative Remix Chains / Trees
        try {
          const remixRes = await axios.get("http://localhost:9000/remix-trees", {
            withCredentials: true,
          });
          setRemixChains(remixRes.data || []);
        } catch (treeErr) {
          console.error("Remix trees fetch error:", treeErr);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching Connect data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const creators = contacts.filter((p) => p.role === "creators");
  const knownPeople = contacts.filter((p) => p.role === "knownPeople");
  const others = contacts.filter((p) => p.role === "others");

  if (loading) {
    return (
      <div className={props.darkMode ? "dark-connect-container" : "connect-container"}>
        <div className="connect-loading-state">
          <p>Discovering creators & creative remix trees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={props.darkMode ? "dark-connect-container" : "connect-container"}>
      {/* 🌟 1. CREATOR SPOTLIGHT OF THE WEEK */}
      {spotlight && spotlight.creator && (
        <section className="spotlight-section">
          <div className="spotlight-banner-header">
            <div className="spotlight-badge-pill">
              <FiAward /> CREATOR SPOTLIGHT OF THE WEEK
            </div>
            <div className="growth-metric-badge">
              <FiTrendingUp /> {spotlight.spotlightStats?.growthRate || "+312% Growth Velocity"}
              <span className="growth-subtext"> (Based on Engagement Acceleration)</span>
            </div>
          </div>

          <div className="spotlight-card">
            <div className="spotlight-creator-info">
              <div className="spotlight-avatar-box">
                <img
                  src={
                    spotlight.creator.profileImage ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                  }
                  alt={spotlight.creator.name}
                  className="spotlight-avatar"
                />
                <span className="spotlight-star-marker">🌟</span>
              </div>

              <div className="spotlight-meta">
                <div className="spotlight-name-row">
                  <h3>{spotlight.creator.name}</h3>
                  <span className="emerging-tier-tag">Emerging Creator</span>
                </div>
                <span className="spotlight-handle">{spotlight.creator.lumiTag}</span>
                <p className="spotlight-role-title">
                  {spotlight.creator.creatorRole || "3D Visuals & Generative Motion"}
                </p>
                <p className="spotlight-bio">{spotlight.creator.bio}</p>

                <div className="spotlight-action-row">
                  <button
                    className={`spotlight-follow-btn ${followedSpotlight ? "followed" : ""}`}
                    onClick={() => setFollowedSpotlight(!followedSpotlight)}
                  >
                    <FiUserPlus /> {followedSpotlight ? "Following" : "Connect & Follow"}
                  </button>
                  {spotlight.featuredPost && (
                    <button
                      className="spotlight-remix-btn"
                      onClick={() =>
                        navigate("/feed/create", {
                          state: {
                            remixPost: {
                              _id: spotlight.featuredPost._id,
                              username: spotlight.creator.name,
                              caption: spotlight.featuredPost.caption,
                              file_url: spotlight.featuredPost.file_url,
                            },
                          },
                        })
                      }
                    >
                      <BsPaletteFill /> Remix Featured Piece
                    </button>
                  )}
                </div>
              </div>
            </div>

            {spotlight.featuredPost && (
              <div className="spotlight-featured-piece">
                <div className="featured-piece-preview">
                  <img
                    src={
                      spotlight.featuredPost.file_url?.startsWith("http")
                        ? spotlight.featuredPost.file_url
                        : `http://localhost:9000${spotlight.featuredPost.file_url}`
                    }
                    alt="Featured artwork"
                  />
                  <div className="featured-piece-overlay">
                    <span className="featured-label">Breakout Work</span>
                    <span className="featured-stats">
                      <FiHeart /> {spotlight.featuredPost.likes || 0}
                      {spotlight.featuredPost.remix_count > 0 && (
                        <> • <FiRepeat /> {spotlight.featuredPost.remix_count} remixes</>
                      )}
                    </span>
                  </div>
                </div>
                <p className="featured-caption">"{spotlight.featuredPost.caption}"</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 🌳 2. CREATIVE REMIX TREES & COLLABORATION CHAINS */}
      <section className="remix-trees-section">
        <div className="remix-trees-header">
          <div>
            <h2 className="card-connect-label" style={{ margin: 0 }}>
              🌳 Creative Remix Trees
            </h2>
            <p className="section-subtext">
              See how creators build, iterate, and respond to each other's works
            </p>
          </div>
          <button
            className="explore-create-btn"
            onClick={() => navigate("/feed/create")}
          >
            <BsPaletteFill /> Start a Creative Thread
          </button>
        </div>

        {remixChains.length === 0 ? (
          <div className="remix-tree-sample-showcase">
            <div className="remix-chain-card">
              <div className="chain-node original-node">
                <span className="chain-node-tag">Root Piece</span>
                <img
                  src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80"
                  alt="Original"
                  className="chain-thumb"
                />
                <span className="chain-creator">@elena_art</span>
                <span className="chain-title">"Neon Genesis Flora"</span>
              </div>

              <div className="chain-arrow">
                <span className="arrow-line"></span>
                <span className="remix-flavor-badge">Style Swap</span>
                <FiArrowRight />
              </div>

              <div className="chain-node remix-node">
                <span className="chain-node-tag remix-tag">Remix #1</span>
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"
                  alt="Remix 1"
                  className="chain-thumb"
                />
                <span className="chain-creator">@marcus_3d</span>
                <span className="chain-title">"3D Procedural Spin"</span>
              </div>

              <div className="chain-arrow">
                <span className="arrow-line"></span>
                <span className="remix-flavor-badge">Color Study</span>
                <FiArrowRight />
              </div>

              <div className="chain-node remix-node branch-node">
                <span className="chain-node-tag remix-tag">Remix #2</span>
                <img
                  src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80"
                  alt="Remix 2"
                  className="chain-thumb"
                />
                <span className="chain-creator">@kai_pixels</span>
                <span className="chain-title">"Pastel Geometry"</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="remix-chains-grid">
            {remixChains.map((child) => (
              <div key={child._id} className="remix-chain-card">
                {child.remix_of && (
                  <div className="chain-node original-node">
                    <span className="chain-node-tag">Original Work</span>
                    <img
                      src={`http://localhost:9000${child.remix_of.file_url}`}
                      alt="Original"
                      className="chain-thumb"
                    />
                    <span className="chain-creator">
                      @{child.remix_of.username || "creator"}
                    </span>
                    <span className="chain-title">
                      "{child.remix_of.caption?.slice(0, 24) || "Creation"}..."
                    </span>
                  </div>
                )}

                <div className="chain-arrow">
                  <span className="remix-flavor-badge">
                    {child.remix_type || "Remix"}
                  </span>
                  <FiArrowRight />
                </div>

                <div className="chain-node remix-node">
                  <span className="chain-node-tag remix-tag">Interpretation</span>
                  <img
                    src={`http://localhost:9000${child.file_url}`}
                    alt="Remix"
                    className="chain-thumb"
                  />
                  <span className="chain-creator">@{child.username}</span>
                  <span className="chain-title">
                    "{child.caption?.slice(0, 24) || "Response"}..."
                  </span>
                </div>

                <button
                  className="chain-remix-action-btn"
                  onClick={() =>
                    navigate("/feed/create", {
                      state: { remixPost: child },
                    })
                  }
                  title="Branch off this chain with your own interpretation"
                >
                  <BsPaletteFill /> Add Branch
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🌐 3. INTERACTIVE MUTUALS & CREATOR GRAPH */}
      <section className="network-graph-section">
        <MutualsGraph mode={props.darkMode} />
      </section>

      {/* 4. EMERGING CONTENT CREATORS */}
      {creators.length > 0 && (
        <div className="top-section-connect">
          <p className="card-connect-label">✨ Emerging Content Creators</p>
          <div className="connect-card-container">
            {creators.map((contact) => (
              <ConnectCard
                key={contact._id}
                contact={contact}
                darkMode={props.darkMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. PEOPLE YOU MAY KNOW */}
      {knownPeople.length > 0 && (
        <div className="middle-section-connect">
          <p className="card-connect-label">👥 People You May Know</p>
          <div className="connect-card-container">
            {knownPeople.map((contact) => (
              <ConnectCard
                key={contact._id}
                contact={contact}
                darkMode={props.darkMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. FOLLOW MORE PEOPLES */}
      {others.length > 0 && (
        <div className="bottom-section-connect">
          <p className="card-connect-label">🌍 Discover More Creators</p>
          <div className="connect-card-container">
            {others.map((contact) => (
              <ConnectCard
                key={contact._id}
                contact={contact}
                darkMode={props.darkMode}
              />
            ))}
          </div>
        </div>
      )}

      {contacts.length === 0 && (
        <div className="no-contacts-message">
          <p>No community members found yet. Be the first to build on Luminix!</p>
        </div>
      )}
    </div>
  );
}

export default Connect;