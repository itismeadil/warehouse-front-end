import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Plus, Map } from "lucide-react";

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
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <header className="w-full">
          <div className="sticky top-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-slate-900">
                  {t("warehouse")}
                </p>
              </div>
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      {t(item.label)}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
