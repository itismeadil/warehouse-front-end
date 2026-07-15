import ItemList from "./ItemList";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Warehouse Inventory
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track items, parts, and stock across locations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/floors"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Floor Maps
            </Link>
            <Link
              to="/add"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="text-base leading-none">+</span>
              Add Item
            </Link>
          </div>
        </div>

        <ItemList />
      </div>
    </div>
  );
}
