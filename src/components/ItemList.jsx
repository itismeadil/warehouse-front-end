import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

const StockBadge = ({ stock }) => {
  const qty = stock || 0;

  if (qty === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
        Out of stock
      </span>
    );
  }

  if (qty <= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        {qty} left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-200">
      {qty} in stock
    </span>
  );
};

const ItemList = ({ items, loading, searchTerm = "", onChanged }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(term) ||
        item.serialNumber?.toLowerCase().includes(term) ||
        item.color?.toLowerCase().includes(term),
    );
  }, [items, searchTerm]);

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
      <div className="rounded-lg border border-dashed border-graphite-300 bg-white py-12 text-center">
        <p className="text-sm text-graphite-500">
          {items.length === 0 ? t("no_items_yet") : t("no_items_match_search")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-graphite-200 bg-white shadow-sm">
      {/* Header row - hidden on mobile */}
      <div className="hidden border-b border-graphite-200 bg-graphite-50 px-4 py-2.5 sm:grid sm:grid-cols-[1.5rem_1fr_10rem_9rem_1.25rem] sm:items-center sm:gap-4">
        <span />
        <span className="text-xs font-medium uppercase tracking-wide text-graphite-400">
          {t("item")}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-graphite-400">
          {t("serialNumber")}
        </span>
        <span className="text-right text-xs font-medium uppercase tracking-wide text-graphite-400">
          Stock
        </span>
        <span />
      </div>

      <div className="divide-y divide-graphite-100">
        {filteredItems.map((item) => (
          <button
            key={item._id}
            onClick={() => handleItemClick(item)}
            className="group flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-primary-50/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:grid sm:grid-cols-[1.5rem_1fr_10rem_9rem_1.25rem] sm:items-center sm:gap-4"
          >
            <span
              className="h-4 w-4 shrink-0 rounded-sm border border-graphite-300"
              style={{ backgroundColor: item.color }}
              title={item.color}
            />

            <div className="min-w-0 flex-1 sm:flex-none">
              <p className="truncate text-sm font-medium text-graphite-900">
                {item.name}
              </p>
              {/* Serial + stock show under name on mobile only */}
              <p className="truncate text-xs text-graphite-500 sm:hidden">
                {item.serialNumber}
              </p>
              <div className="mt-1 sm:hidden">
                <StockBadge stock={item.stock} />
              </div>
            </div>

            <span className="hidden truncate text-sm text-graphite-600 sm:block">
              {item.serialNumber}
            </span>

            <div className="hidden justify-end sm:flex">
              <StockBadge stock={item.stock} />
            </div>

            <ChevronRight className="hidden h-4 w-4 shrink-0 text-graphite-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-400 sm:block" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ItemList;
