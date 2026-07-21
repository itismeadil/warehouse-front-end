import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap a route's element with this. Pass roles={["admin"]} to also restrict
// by role — omit it to just require any logged-in user.
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite-50">
        <p className="text-sm text-graphite-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
