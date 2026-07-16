import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Map } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, match: (path) => path === "/" },
  { to: "/add", label: "Add item", icon: Plus, match: (path) => path === "/add" },
  { to: "/floors", label: "Floor maps", icon: Map, match: (path) => path === "/floors" },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <aside className="w-44 flex-shrink-0">
          <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-2 pb-3 pt-1 text-sm font-semibold text-slate-900">
              Warehouse
            </p>
            <nav className="space-y-1">
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
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
