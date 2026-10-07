import { Outlet, Navigate } from "react-router-dom";
import Navbar from "../src/components/Navbar";

function HomePage({
  isAuthenticated,
  userData,
  darkMode,
  changeTheme,
  handleLogout,
  setFeedHeading,
  setSelectedCategory,
}) {
  if (!isAuthenticated) return <Navigate to="/" />;

  return (
    <div className={`darkroom-app-shell ${darkMode ? "darkroom" : "lightbox"}`}>
      <Navbar
        mode={darkMode}
        changeTheme={changeTheme}
        onLogout={handleLogout}
        user={userData}
        setFeedHeading={setFeedHeading}
        setSelectedCategory={setSelectedCategory}
      />
      <div className="darkroom-app-content">
        <Outlet />
      </div>
    </div>
  );
}

export default HomePage;
