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
        <div className="loader"></div>
        <style>{`
          .loader {
            width: 45px;
            aspect-ratio: 1;
            --c: no-repeat linear-gradient(#317272 0 0);
            background: 
              var(--c) 0%   50%,
              var(--c) 50%  50%,
              var(--c) 100% 50%;
            background-size: 20% 100%;
            animation: l1 1s infinite linear;
          }
          @keyframes l1 {
            0%  {background-size: 20% 100%,20% 100%,20% 100%}
            33% {background-size: 20% 10% ,20% 100%,20% 100%}
            50% {background-size: 20% 100%,20% 10% ,20% 100%}
            66% {background-size: 20% 100%,20% 100%,20% 10% }
            100%{background-size: 20% 100%,20% 100%,20% 100%}
          }
        `}</style>
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
