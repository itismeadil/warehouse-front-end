import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-50 px-4 dark:bg-graphite-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-graphite-900 dark:text-graphite-100">
          404
        </h1>
        <p className="mt-4 text-xl text-graphite-600 dark:text-graphite-400">
          Page not found
        </p>
        <p className="mt-2 text-sm text-graphite-500 dark:text-graphite-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Home className="h-4 w-4" />
          Go to Home
        </button>
      </div>
    </div>
  );
}
