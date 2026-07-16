import { useState, useEffect } from "react";
import { getItems } from "../api/items";
import { getFloors, getFloorOccupancy } from "../api/floors";
import { decodeShape, areaSize } from "../lib/floorShape";
import ItemList from "./ItemList";

export default function Home() {
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
        occupiedPct: totalCells > 0 ? Math.round((occupiedCells / totalCells) * 100) : 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadItems();
    loadFloorStats();
  }, []);

  const refresh = () => {
    loadItems();
    loadFloorStats();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-slate-900">Overview</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, serial, or color"
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={refresh}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-xs text-slate-500">Items</p>
          <p className="mt-0.5 text-2xl font-medium text-slate-900">
            {items.length}
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-xs text-slate-500">Floors</p>
          <p className="mt-0.5 text-2xl font-medium text-slate-900">
            {stats.floors}
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-xs text-slate-500">Occupied</p>
          <p className="mt-0.5 text-2xl font-medium text-slate-900">
            {stats.occupiedPct}%
          </p>
        </div>
      </div>

      <ItemList items={items} loading={itemsLoading} searchTerm={searchTerm} />
    </div>
  );
}
