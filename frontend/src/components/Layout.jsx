import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Layout.css";

export default function Layout({ children }) {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__brand">
          <span className="layout__mark">ST</span>
          <div>
            <h1 className="layout__title">SaniTrust</h1>
            <span className="tag layout__subtitle">
              Public Toilet &amp; Sanitation Trust Index
            </span>
          </div>
        </div>
        <nav className="layout__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `layout__link ${isActive ? "is-active" : ""}`}
          >
            Citizen Map
          </NavLink>
          {user?.role === "municipal" && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `layout__link ${isActive ? "is-active" : ""}`}
            >
              Municipal Dashboard
            </NavLink>
          )}
        </nav>
        <div className="layout__session">
          {!loading && isAuthenticated && (
            <>
              <span className="layout__session-info">
                <span className="layout__session-name">{user.name}</span>
                <span className="tag layout__session-role">{user.role}</span>
              </span>
              <button className="layout__logout" onClick={handleLogout}>
                Sign out
              </button>
            </>
          )}
          {!loading && !isAuthenticated && (
            <NavLink to="/login" className="layout__login-link">
              Sign in
            </NavLink>
          )}
        </div>
      </header>
      <main className="layout__main">{children}</main>
    </div>
  );
}
