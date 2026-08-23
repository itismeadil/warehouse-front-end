import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  Map as MapIcon,
  Users as UsersIcon,
  TrendingUp,
  ShoppingCart,
  Clock,
  Plus,
  Calculator,
} from "lucide-react";
import { getItems } from "../api/items";
import { getFloors, getFloorOccupancy } from "../api/floors";
import { getUsers } from "../api/users";
import {
  getSalesInvoiceAggregate,
  getPurchaseInvoices,
  getReservations,
} from "../api/accountant";
import { decodeShape, areaSize } from "../lib/floorShape";
import { stockStatusOf } from "../lib/stockStatus";

function StatCard({ icon: Icon, label, value, tone = "graphite", to }) {
  const tones = {
    graphite:
      "bg-graphite-100 text-graphite-600 dark:bg-graphite-800 dark:text-graphite-300",
    amber:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    green:
      "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300",
    primary:
      "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300",
  };

  const content = (
    <div className="flex items-center gap-3 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm transition-colors dark:border-graphite-700 dark:bg-graphite-800">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-graphite-500 dark:text-graphite-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-xl font-semibold text-graphite-900 dark:text-graphite-100">
          {value}
        </p>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block hover:opacity-90">
      {content}
    </Link>
  ) : (
    content
  );
}

function QuickAction({ icon: Icon, label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm transition-colors hover:bg-graphite-50 dark:border-graphite-700 dark:bg-graphite-800 dark:hover:bg-graphite-700"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="text-sm font-medium text-graphite-900 dark:text-graphite-100">
        {label}
      </span>
    </Link>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    floorsCount: 0,
    occupiedPct: 0,
    usersByRole: {},
    totalUsers: 0,
    salesThisMonth: 0,
    purchasesThisMonth: 0,
    pendingReservations: 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const now = new Date();
        const monthParam = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}`;

        // Each data source is independent — if one fails (e.g. a service
        // is briefly down), the rest of the dashboard still renders
        // instead of the whole page breaking.
        const results = await Promise.allSettled([
          getItems(),
          getFloors(),
          getUsers(),
          getSalesInvoiceAggregate({ type: "monthly", month: monthParam }),
          getPurchaseInvoices(),
          getReservations({ status: "active" }),
        ]);

        const [
          itemsResult,
          floorsResult,
          usersResult,
          salesResult,
          purchasesResult,
          reservationsResult,
        ] = results;

        const next = { ...stats };

        if (itemsResult.status === "fulfilled") {
          const items = itemsResult.value || [];
          next.totalItems = items.length;
          next.lowStockCount = items.filter(
            (i) => stockStatusOf(i.stock) === "low",
          ).length;
          next.outOfStockCount = items.filter(
            (i) => stockStatusOf(i.stock) === "out",
          ).length;
        }

        if (floorsResult.status === "fulfilled") {
          const floors = floorsResult.value || [];
          next.floorsCount = floors.length;

          const occupancies = await Promise.allSettled(
            floors.map((f) => getFloorOccupancy(f._id)),
          );
          let totalCells = 0;
          let occupiedCells = 0;
          floors.forEach((floor, i) => {
            totalCells += decodeShape(
              floor.rows,
              floor.cols,
              floor.shape,
            ).length;
            const occ = occupancies[i];
            if (occ.status === "fulfilled") {
              occupiedCells += occ.value.occupied.reduce(
                (sum, o) => sum + areaSize(o.area),
                0,
              );
            }
          });
          next.occupiedPct =
            totalCells > 0
              ? Math.round((occupiedCells / totalCells) * 100)
              : 0;
        }

        if (usersResult.status === "fulfilled") {
          const users = usersResult.value || [];
          next.totalUsers = users.length;
          next.usersByRole = users.reduce((acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
          }, {});
        }

        if (salesResult.status === "fulfilled") {
          next.salesThisMonth = salesResult.value?.total || 0;
        }

        if (purchasesResult.status === "fulfilled") {
          const purchases = purchasesResult.value || [];
          const thisMonth = purchases.filter((p) => {
            const d = new Date(p.date || p.createdAt);
            return (
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth()
            );
          });
          next.purchasesThisMonth = thisMonth.reduce(
            (sum, p) => sum + (p.totalAmount || 0),
            0,
          );
        }

        if (reservationsResult.status === "fulfilled") {
          next.pendingReservations = (reservationsResult.value || []).length;
        }

        setStats(next);

        // Surface a soft warning if some sources genuinely failed, without
        // blocking the rest of the dashboard from showing.
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          setError(t("dashboardPartialLoadWarning"));
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"
          style={{ color: "#45a1a1" }}
        />
        <p className="text-sm text-graphite-500 dark:text-graphite-400">
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-5 text-lg font-semibold text-graphite-900 dark:text-graphite-100">
        {t("adminDashboard")}
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          {error}
        </div>
      )}

      {/* Inventory */}
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500 dark:text-graphite-400">
        {t("inventory")}
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Package} label={t("items")} value={stats.totalItems} to="/" />
        <StatCard
          icon={AlertTriangle}
          label={t("stockStatusLow")}
          value={stats.lowStockCount}
          tone={stats.lowStockCount > 0 ? "amber" : "graphite"}
          to="/"
        />
        <StatCard
          icon={AlertTriangle}
          label={t("stockStatusOut")}
          value={stats.outOfStockCount}
          tone={stats.outOfStockCount > 0 ? "amber" : "graphite"}
          to="/"
        />
        <StatCard
          icon={MapIcon}
          label={t("occupied")}
          value={`${stats.occupiedPct}%`}
          to="/floors"
        />
      </div>

      {/* Finance */}
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500 dark:text-graphite-400">
        {t("finance")}
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label={t("salesThisMonth")}
          value={stats.salesThisMonth.toFixed(2)}
          tone="green"
          to="/accounting"
        />
        <StatCard
          icon={ShoppingCart}
          label={t("purchasesThisMonth")}
          value={stats.purchasesThisMonth.toFixed(2)}
          to="/accounting"
        />
        <StatCard
          icon={Clock}
          label={t("pendingReservations")}
          value={stats.pendingReservations}
          tone={stats.pendingReservations > 0 ? "primary" : "graphite"}
          to="/accounting"
        />
        <StatCard
          icon={UsersIcon}
          label={t("totalUsers")}
          value={stats.totalUsers}
          to="/users"
        />
      </div>

      {/* Users by role — only shown when there's more than one role to break down */}
      {Object.keys(stats.usersByRole).length > 0 && (
        <div className="mb-6 rounded-xl border border-graphite-200 bg-white p-4 shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite-500 dark:text-graphite-400">
            {t("usersByRole")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <span
                key={role}
                className="rounded-full bg-graphite-100 px-3 py-1 text-xs font-medium capitalize text-graphite-700 dark:bg-graphite-700 dark:text-graphite-200"
              >
                {role}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-500 dark:text-graphite-400">
        {t("quickActions")}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction icon={Plus} label={t("addItem")} to="/add" />
        <QuickAction icon={MapIcon} label={t("floorMaps")} to="/floors" />
        <QuickAction icon={Calculator} label={t("accounting")} to="/accounting" />
        <QuickAction icon={UsersIcon} label={t("manageUsers")} to="/users" />
      </div>
    </div>
  );
}
