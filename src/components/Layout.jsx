import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  Plus,
  Map,
  Users,
  Languages,
  LogOut,
  Newspaper,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ALL_NAV_ITEMS = [
  {
    to: "/",
    label: "home",
    icon: Home,
    match: (path) => path === "/",
    roles: ["admin", "manager"],
  },
  {
    to: "/",
    label: "feed",
    icon: Newspaper,
    match: (path) => path === "/",
    roles: ["supplier"],
  },
  {
    to: "/add",
    label: "addItem",
    icon: Plus,
    match: (path) => path === "/add",
    roles: ["admin", "manager"],
  },
  {
    to: "/floors",
    label: "floorMaps",
    icon: Map,
    match: (path) => path === "/floors",
    roles: ["admin", "manager"],
  },
  {
    to: "/users",
    label: "manageUsers",
    icon: Users,
    match: (path) => path === "/users",
    roles: ["admin"], // manager is deliberately excluded here
  },
];

export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.role),
  );

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-graphite-50">
      <header className="sticky top-0 z-40 border-b border-graphite-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-base font-semibold text-graphite-900">
            {t("warehouse")}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50"
            >
              <Languages className="h-4 w-4" aria-hidden="true" />
              {i18n.language === "ar" ? "English" : "العربية"}
            </button>

            <div className="flex items-center gap-2 border-s border-graphite-200 ps-2">
              <div className="text-end">
                <p className="text-sm font-medium text-graphite-900">
                  {user?.name}
                </p>
                <p className="text-xs capitalize text-graphite-500">
                  {user?.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                aria-label={t("logout")}
                className="rounded-lg p-2 text-graphite-400 transition-colors hover:bg-graphite-100 hover:text-graphite-700"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Nav items: separate centered box below the header */}
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <nav className="mx-auto flex w-full max-w-fit flex-wrap items-center justify-center gap-1 rounded-xl border border-graphite-200 bg-white p-2 shadow-sm">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-graphite-600 hover:bg-graphite-100 hover:text-graphite-900"
                }`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
