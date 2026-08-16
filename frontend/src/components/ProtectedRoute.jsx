import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Wrap a route element with this to require login, and optionally a
// specific role. Redirects to /login, remembering where the user was
// headed so LoginPage can send them back after a successful sign-in.
export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // avoid a flash-redirect while session restores

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
