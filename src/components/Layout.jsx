import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Plus, Map, Languages } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "home", icon: Home, match: (path) => path === "/" },
  {
    to: "/add",
    label: "addItem",
    icon: Plus,
    match: (path) => path === "/add",
  },
  {
    to: "/floors",
    label: "floorMaps",
    icon: Map,
    match: (path) => path === "/floors",
  },
];

export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  };

  return (
    <div className="min-h-screen bg-graphite-50">
      <header className="sticky top-0 z-40 border-b border-graphite-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-base font-semibold text-graphite-900">
            {t("warehouse")}
          </p>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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

          <button
            onClick={toggleLanguage}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm font-medium text-graphite-700 transition-colors hover:bg-graphite-50"
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            {i18n.language === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
