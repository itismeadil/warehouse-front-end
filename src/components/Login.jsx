import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { t } = useTranslation();
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  if (!authLoading && user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8 sm:bg-graphite-50 sm:px-6">
      <div className="w-full max-w-sm sm:rounded-xl sm:border sm:border-graphite-200 sm:bg-white sm:p-8 sm:shadow-sm sm:max-w-md">
        <h1 className="text-center text-lg font-semibold text-graphite-900 sm:text-start">
          {t("brandName")}
        </h1>
        <p className="mt-1 text-center text-sm text-graphite-500 sm:text-start">
          {t("loginSubtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 sm:mt-8">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-graphite-700"
            >
              {t("email")}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2.5 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:py-2"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-graphite-700"
            >
              {t("password")}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1.5 block w-full rounded-lg border border-graphite-300 px-3 py-2.5 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2.5"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  style={{ color: "#45a1a1" }}
                  aria-hidden="true"
                />
                <span className="text-sm">{t("signingIn")}</span>
              </span>
            ) : (
              t("signIn")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
