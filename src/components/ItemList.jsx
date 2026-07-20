import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
          style={{ color: '#45a1a1' }}
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
    <div className="flex flex-col gap-1.5">
      {filteredItems.map((item) => (
        <button
          key={item._id}
          onClick={() => handleItemClick(item)}
          className="flex items-center justify-between rounded-lg border border-graphite-200 bg-white px-4 py-3 text-start shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="h-4 w-4 shrink-0 rounded-sm border border-graphite-300"
              style={{ backgroundColor: item.color }}
              title={item.color}
            />
            <span className="truncate font-medium text-graphite-900">
              {item.name}
            </span>
          </div>
          <span className="shrink-0 ps-3 text-sm text-graphite-500">
            {item.serialNumber}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ItemList;
