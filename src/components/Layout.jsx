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
  Calculator,
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
    to: "/accounting",
    label: "accounting",
    icon: Calculator,
    match: (path) => path === "/accounting",
    roles: ["admin", "accountant"], // manager is deliberately excluded here
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
      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-graphite-200 bg-white sm:flex">
          {/* Logo section */}
          <div className="flex items-center gap-2.5 border-b border-graphite-200 px-6 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-base font-bold text-white shadow-sm">
              ق
            </span>
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-tight text-graphite-900">
                {t("brandName")}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-graphite-500">
                {t("warehouse")}
              </p>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-graphite-600 hover:bg-graphite-50 hover:text-graphite-900"
                  }`}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>

          {/* User section at bottom */}
          <div className="border-t border-graphite-200 px-3 py-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-graphite-900">
                  {user?.name}
                </p>
                <p className="text-xs capitalize text-graphite-500">
                  {user?.role}
                </p>
              </div>
            </div>
            <div className="mt-2 space-y-1 px-3">
              <button
                onClick={toggleLanguage}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-graphite-600 transition-colors hover:bg-graphite-50"
              >
                <Languages className="h-4 w-4" aria-hidden="true" />
                {i18n.language === "ar" ? "English" : "العربية"}
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t("logout")}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1">
          <div className="mx-auto max-w-5xl">
            {/* Mobile header */}
            <header className="sticky top-0 z-40 border-b border-primary-600 bg-primary-500 sm:hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-base font-bold text-white shadow-sm">
                    ق
                  </span>
                  <div className="leading-tight">
                    <p className="text-base font-semibold tracking-tight text-white">
                      {t("brandName")}
                    </p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-primary-100">
                      {t("warehouse")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleLanguage}
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    <Languages className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <div
                    data-user-menu
                    className="relative flex items-center gap-1 border-s border-white/20 ps-2"
                  >
                    <button
                      onClick={() => setUserMenuOpen((prev) => !prev)}
                      className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/10"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-primary-100 transition-transform ${
                          userMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-graphite-200 bg-white p-1.5 shadow-lg">
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
                        ? "bg-primary-600 text-white"
                        : "text-graphite-500 hover:text-graphite-900"
                    }`}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    <span className="truncate">{t(item.label)}</span>
                  </Link>
                );
              })}
            </nav>

            <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
