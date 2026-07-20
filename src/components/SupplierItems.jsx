import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getItems } from "../api/items";
import { partLabel } from "../lib/Partlabel";

export default function SupplierItems() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getItems()
      .then((data) => setItems(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const damagedEntries = items.flatMap((item) =>
    (item.parts || [])
      .filter((p) => (p.damaged || 0) > 0)
      .map((part) => ({ item, part })),
  );

  return (
    <div>
      <h1 className="text-lg font-semibold text-graphite-900">
        {t("supplierDamagedTitle")}
      </h1>
      <p className="mt-1 text-sm text-graphite-500">
        {t("supplierDamagedDescription")}
      </p>

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-graphite-500">{t("loading")}</p>
        ) : damagedEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-graphite-300 bg-white py-12 text-center">
            <p className="text-sm text-graphite-500">
              {t("supplierNoDamagedParts")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {damagedEntries.map(({ item, part }) => {
              const photos = part.photos || [];
              return (
                <div
                  key={part._id}
                  className="overflow-hidden rounded-xl border border-graphite-200 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3 border-b border-graphite-100 px-4 py-3">
                    <span
                      className="h-9 w-9 shrink-0 rounded-lg border border-graphite-300"
                      style={{ backgroundColor: item.color }}
                      title={item.color}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-graphite-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-graphite-500">
                        {t("part")} {partLabel(item, part)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    {part.damageDescription && (
                      <p className="mb-4 rounded-lg bg-graphite-50 px-3 py-2 text-sm text-graphite-700">
                        {part.damageDescription}
                      </p>
                    )}

                    {photos.length === 0 ? (
                      <p className="py-6 text-center text-sm text-graphite-400">
                        {t("supplierNoPhotosYet")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {photos.map((photo) => (
                          <div
                            key={photo._id}
                            className="aspect-square overflow-hidden rounded-lg border border-graphite-200 bg-graphite-50"
                          >
                            <img
                              src={photo.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
