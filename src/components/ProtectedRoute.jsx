import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap a route's element with this. Pass roles={["admin"]} to also restrict
// by role — omit it to just require any logged-in user.
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite-50">
        <div className="flex gap-1.5">
          <div className="h-8 w-1.5 animate-pulse rounded-full bg-primary-600" style={{ animationDelay: '0ms' }}></div>
          <div className="h-8 w-1.5 animate-pulse rounded-full bg-primary-600" style={{ animationDelay: '150ms' }}></div>
          <div className="h-8 w-1.5 animate-pulse rounded-full bg-primary-600" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Remember where the user was trying to go, so Login can send them
    // back here after a successful sign-in instead of always to "/".
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
