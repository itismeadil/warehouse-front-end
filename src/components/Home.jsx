import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { getItems } from "../api/items";
import { getFloors, getFloorOccupancy } from "../api/floors";
import { decodeShape, areaSize } from "../lib/floorShape";
import ItemList from "./ItemList";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ floors: 0, occupiedPct: 0 });

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  };

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("overview")}
        </h1>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-slate-400">
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
                className="w-full rounded-lg border border-slate-300 bg-white ps-10 pe-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              onClick={toggleLanguage}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <span className="inline-flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {i18n.language === "ar" ? "English" : "العربية"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-xs text-slate-500">{t("items")}</p>
          <p className="mt-0.5 text-2xl font-medium text-slate-900">
            {items.length}
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-xs text-slate-500">{t("floors")}</p>
          <p className="mt-0.5 text-2xl font-medium text-slate-900">
            {stats.floors}
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-xs text-slate-500">{t("occupied")}</p>
          <p className="mt-0.5 text-2xl font-medium text-slate-900">
            {stats.occupiedPct}%
          </p>
        </div>
      </div>

      <ItemList items={items} loading={itemsLoading} searchTerm={searchTerm} />
    </div>
  );
}
