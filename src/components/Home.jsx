import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { getItems } from "../api/items";
import { getFloors, getFloorOccupancy } from "../api/floors";
import { decodeShape, areaSize } from "../lib/floorShape";
import ItemList from "./ItemList";
import PageHeader from "./PageHeader";

export default function Home() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockStatus, setStockStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
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

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("overview")}
        actions={
          <>
            <div className="relative w-full sm:max-w-xs sm:w-64">
              <span className="pointer-events-none absolute inset-y-0 inset-s-3 flex items-center text-graphite-400">
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
                className="w-full rounded-lg border border-graphite-300 bg-white py-2 ps-10 pe-3 text-sm text-graphite-900 placeholder:text-graphite-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-800 dark:text-graphite-100 dark:placeholder:text-graphite-500"
              />
            </div>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              aria-label={t("filterStockStatus")}
              className="w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-800 dark:text-graphite-100 sm:w-auto"
            >
              <option value="all">{t("stockStatusAll")}</option>
              <option value="in">{t("stockStatusIn")}</option>
              <option value="low">{t("stockStatusLow")}</option>
              <option value="out">{t("stockStatusOut")}</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t("sortItems")}
              className="w-full rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-graphite-600 dark:bg-graphite-800 dark:text-graphite-100 sm:w-auto"
            >
              <option value="name">{t("sortByName")}</option>
              <option value="stockAsc">{t("sortByStockAsc")}</option>
              <option value="stockDesc">{t("sortByStockDesc")}</option>
            </select>
            <button
              onClick={refresh}
              className="flex items-center gap-2 rounded-lg border border-graphite-300 bg-white px-3 py-2 text-sm text-graphite-700 transition-colors hover:bg-graphite-50 dark:border-graphite-600 dark:bg-graphite-800 dark:text-graphite-200 dark:hover:bg-graphite-700"
            >
              <RefreshCw className="h-4 w-4" />
              {t("refresh")}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg bg-graphite-100 p-3 dark:bg-graphite-800 sm:p-4">
          <p className="text-xs text-graphite-500">{t("items")}</p>
          <p className="mt-0.5 text-lg font-medium text-graphite-900 dark:text-graphite-100 sm:text-2xl">
            {items.length}
          </p>
        </div>
        <div className="rounded-lg bg-graphite-100 p-3 dark:bg-graphite-800 sm:p-4">
          <p className="text-xs text-graphite-500">{t("floors")}</p>
          <p className="mt-0.5 text-lg font-medium text-graphite-900 dark:text-graphite-100 sm:text-2xl">
            {stats.floors}
          </p>
        </div>
        <div className="rounded-lg bg-graphite-100 p-3 dark:bg-graphite-800 sm:p-4">
          <p className="text-xs text-graphite-500">{t("occupied")}</p>
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
        sortBy={sortBy}
      />
    </div>
  );
}
