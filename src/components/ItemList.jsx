import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronLeft, Package } from "lucide-react";
import EmptyState from "./EmptyState";

const StockBadge = ({ stock }) => {
  const qty = stock || 0;
  const { t } = useTranslation();

  if (qty === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800">
        {t("outOfStock")}
      </span>
    );
  }

  if (qty <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800">
        {t("stockLeft", { count: qty })}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:ring-primary-700">
      {t("stockInStock", { count: qty })}
    </span>
  );
};

const ItemList = ({
  items,
  loading,
  searchTerm = "",
  stockStatus = "all",
  sortBy = "name",
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase(i18n.language);
    const filtered = items.filter((item) => {
      const qty = item.stock || 0;
      const matchesTerm =
        !term ||
        item.name?.toLocaleLowerCase(i18n.language).includes(term) ||
        item.serialNumber?.toLocaleLowerCase(i18n.language).includes(term) ||
        item.color?.toLocaleLowerCase(i18n.language).includes(term);
      const matchesStock =
        stockStatus === "all" ||
        (stockStatus === "out" && qty === 0) ||
        (stockStatus === "low" && qty >= 1 && qty <= 5) ||
        (stockStatus === "in" && qty > 5);
      return matchesTerm && matchesStock;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "stockAsc") return (a.stock || 0) - (b.stock || 0);
      if (sortBy === "stockDesc") return (b.stock || 0) - (a.stock || 0);
      return (a.name || "").localeCompare(b.name || "", i18n.language, {
        sensitivity: "base",
      });
    });
  }, [i18n.language, items, searchTerm, sortBy, stockStatus]);

  const handleItemClick = (item) => {
    // Pass the item via navigation state so ItemDetail doesn't need to
    // re-fetch it; ItemDetail falls back to fetching by id if this is
    // missing (e.g. a direct page refresh).
    navigate(`/items/${item._id}`, { state: { item } });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ color: "#45a1a1" }}
        />
        <p className="text-sm text-graphite-500">{t("loading_inventory")}</p>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={items.length === 0 ? t("no_items_yet") : t("no_items_match_search")}
        action={
          items.length === 0
            ? {
                label: t("addItem"),
                onClick: () => navigate("/add"),
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-graphite-200 bg-white shadow-sm dark:border-graphite-700 dark:bg-graphite-800">
      {/* Header row - hidden on mobile */}
      <div className="hidden border-b border-graphite-200 bg-graphite-50 px-4 py-2.5 dark:border-graphite-700 dark:bg-graphite-900 sm:grid sm:grid-cols-[1.5rem_1fr_10rem_9rem_1.25rem] sm:items-center sm:gap-4">
        <span />
        <span className="text-xs font-medium uppercase tracking-wide text-graphite-400">
          {t("item")}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-graphite-400">
          {t("serialNumber")}
        </span>
        <span className="text-right text-xs font-medium uppercase tracking-wide text-graphite-400">
          {t("stock")}
        </span>
        <span />
      </div>

      <div className="divide-y divide-graphite-100 dark:divide-graphite-700">
        {filteredItems.map((item) => (
          <button
            key={item._id}
            onClick={() => handleItemClick(item)}
            className="group flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-primary-50/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:hover:bg-primary-900/20 sm:grid sm:grid-cols-[1.5rem_1fr_10rem_9rem_1.25rem] sm:items-center sm:gap-4"
          >
            <span
              className="h-4 w-4 shrink-0 rounded-sm border border-graphite-300"
              style={{ backgroundColor: item.color }}
              title={item.color}
            />

            <div className="min-w-0 flex-1 sm:flex-none">
              <p className="truncate text-sm font-medium text-graphite-900 dark:text-graphite-100">
                {item.name}
              </p>
              {/* Serial + stock show under name on mobile only */}
              <p className="truncate text-xs text-graphite-500 dark:text-graphite-400 sm:hidden">
                {item.serialNumber}
              </p>
              <div className="mt-1 sm:hidden">
                <StockBadge stock={item.stock} />
              </div>
            </div>

            <span className="hidden truncate text-sm text-graphite-600 dark:text-graphite-300 sm:block">
              {item.serialNumber}
            </span>

            <div className="hidden justify-end sm:flex">
              <StockBadge stock={item.stock} />
            </div>

            {isRTL ? (
              <ChevronLeft className="hidden h-4 w-4 shrink-0 text-graphite-300 transition-transform group-hover:-translate-x-0.5 group-hover:text-primary-400 sm:block" />
            ) : (
              <ChevronRight className="hidden h-4 w-4 shrink-0 text-graphite-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-400 sm:block" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ItemList;
