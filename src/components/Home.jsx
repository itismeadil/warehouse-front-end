import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, SlidersHorizontal, X } from "lucide-react";
import { getItems } from "../api/items";
import { getFloors, getFloorOccupancy } from "../api/floors";
import { decodeShape, areaSize } from "../lib/floorShape";
import ItemList from "./ItemList";

export default function Home() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [stockStatus, setStockStatus] = useState("all");
  const [supplierId, setSupplierId] = useState("all");
  const [stats, setStats] = useState({ floors: 0, occupiedPct: 0 });

  const loadItems = async () => {
    setItemsLoading(true);
    try {
      const data = await getItems();
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadFloorStats = async () => {
    try {
      const floors = await getFloors();
      const occupancies = await Promise.all(
        floors.map((floor) => getFloorOccupancy(floor._id)),
      );

      let totalCells = 0;
      let occupiedCells = 0;

      floors.forEach((floor, i) => {
        totalCells += decodeShape(floor.rows, floor.cols, floor.shape).length;
        occupiedCells += occupancies[i].occupied.reduce(
          (sum, o) => sum + areaSize(o.area),
          0,
        );
      });

      setStats({
        floors: floors.length,
        occupiedPct:
          totalCells > 0 ? Math.round((occupiedCells / totalCells) * 100) : 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // avoid calling setState synchronously in the effect body
    (async () => {
      await loadItems();
      await loadFloorStats();
    })();
  }, []);

  const refresh = () => {
    loadItems();
    loadFloorStats();
  };

  // The suppliers to offer come from the loaded items themselves, so the
  // dropdown never lists someone with nothing in the warehouse.
  const supplierOptions = useMemo(() => {
    const byId = new Map();
    items.forEach((item) => {
      const supplier = item.supplierId;
      if (supplier?._id)
        byId.set(supplier._id, supplier.name || supplier.email);
    });
    return [...byId].map(([id, name]) => ({ id, name }));
  }, [items]);

  const filtersActive = stockStatus !== "all" || supplierId !== "all";

  const clearFilters = () => {
    setStockStatus("all");
    setSupplierId("all");
  };

  const selectClasses =
    "mt-1.5 block w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100";

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-graphite-900 dark:text-graphite-100">
          {t("overview")}
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:max-w-xs sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 inset-s-3 flex items-center text-graphite-400 dark:text-graphite-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("search_placeholder_overview")}
              className="w-full rounded-lg border border-graphite-300 bg-white py-2 ps-10 pe-3 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-700 dark:text-graphite-100 dark:placeholder:text-graphite-500"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              filtersActive
                ? "border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                : "border-graphite-300 bg-white text-graphite-700 hover:bg-graphite-50 dark:border-graphite-600 dark:bg-graphite-800 dark:text-graphite-300 dark:hover:bg-graphite-700"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("advancedFilters")}
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-700 hover:bg-graphite-50 transition-colors dark:border-graphite-600 dark:bg-graphite-800 dark:text-graphite-300 dark:hover:bg-graphite-700"
          >
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-5 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-graphite-900 dark:text-graphite-100">
              {t("advancedFilters")}
            </h2>
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-graphite-500 transition-colors hover:text-graphite-900 dark:text-graphite-400 dark:hover:text-graphite-100"
              >
                <X className="h-3.5 w-3.5" />
                {t("clearFilters")}
              </button>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
                {t("stockStatus")}
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className={selectClasses}
              >
                <option value="all">{t("stockStatusAll")}</option>
                <option value="in">{t("stockStatusIn")}</option>
                <option value="low">{t("stockStatusLow")}</option>
                <option value="out">{t("stockStatusOut")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-graphite-700 dark:text-graphite-300">
                {t("supplier")}
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={selectClasses}
              >
                <option value="all">{t("allSuppliers")}</option>
                <option value="none">{t("noSupplier")}</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-graphite-100 p-3 dark:bg-graphite-800 sm:p-4">
          <p className="text-xs text-graphite-500 dark:text-graphite-400">
            {t("items")}
          </p>
          <p className="mt-0.5 text-lg font-medium text-graphite-900 dark:text-graphite-100 sm:text-2xl">
            {items.length}
          </p>
        </div>
        <div className="rounded-xl bg-graphite-100 p-3 dark:bg-graphite-800 sm:p-4">
          <p className="text-xs text-graphite-500 dark:text-graphite-400">
            {t("floors")}
          </p>
          <p className="mt-0.5 text-lg font-medium text-graphite-900 dark:text-graphite-100 sm:text-2xl">
            {stats.floors}
          </p>
        </div>
        <div className="rounded-xl bg-graphite-100 p-3 dark:bg-graphite-800 sm:p-4">
          <p className="text-xs text-graphite-500 dark:text-graphite-400">
            {t("occupied")}
          </p>
          <p className="mt-0.5 text-lg font-medium text-graphite-900 dark:text-graphite-100 sm:text-2xl">
            {stats.occupiedPct}%
          </p>
        </div>
      </div>

      <ItemList
        items={items}
        loading={itemsLoading}
        searchTerm={searchTerm}
        stockStatus={stockStatus}
        supplierId={supplierId}
      />
    </div>
  );
}
