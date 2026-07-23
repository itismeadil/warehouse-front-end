import { useState, useEffect } from "react";
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
  ChevronDown,
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-user-menu]")) setUserMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-graphite-50 pb-20 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-primary-600 bg-primary-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-base font-bold text-white shadow-sm">
              ق
            </span>
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-tight text-white">
                {t("brandName")}
              </p>
              <p className="hidden text-[11px] font-medium uppercase tracking-wide text-primary-100 sm:block">
                {t("warehouse")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 sm:px-3"
            >
              <Languages className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                {i18n.language === "ar" ? "English" : "العربية"}
              </span>
            </button>

            <div
              data-user-menu
              className="relative flex items-center gap-1 border-s border-white/20 ps-2"
            >
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/10 sm:cursor-default sm:p-0 sm:hover:bg-transparent"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white sm:hidden">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>

                <div className="hidden text-end sm:block">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs capitalize text-primary-100">
                    {user?.role}
                  </p>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-primary-100 transition-transform sm:hidden ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <button
                onClick={handleLogout}
                aria-label={t("logout")}
                className="hidden rounded-lg p-2 text-primary-100 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <LogOut className="h-4 w-4" />
              </button>

              {userMenuOpen && (
                <div className="absolute inset-e-0 top-full z-50 mt-2 w-48 rounded-xl border border-graphite-200 bg-white p-1.5 shadow-lg sm:hidden">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium text-graphite-900">
                      {user?.name}
                    </p>
                    <p className="text-xs capitalize text-graphite-500">
                      {user?.role}
                    </p>
                  </div>
                  <div className="my-1 border-t border-graphite-100" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Nav items: centered box below header on larger screens */}
      <div className="mx-auto hidden max-w-6xl px-4 pt-6 sm:block sm:px-6">
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

      {/* Nav items: fixed bottom tab bar on mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-graphite-200 bg-white px-1 py-1.5 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] sm:hidden">
        {navItems.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={`${item.to}-${item.label}-mobile`}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                active
                  ? "text-primary-700"
                  : "text-graphite-500 hover:text-graphite-900"
              }`}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate">{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
