import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Newspaper, ImageOff, ZoomIn } from "lucide-react";
import { getItems } from "../api/items";
import { partLabel } from "../lib/Partlabel";
import PhotoLightbox from "./PhotoLightbox";

// A single clickable photo tile, used by PhotoGrid below.
function Tile({ photo, className = "", overlay = null, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(photo.url)}
      className={`group relative overflow-hidden bg-graphite-100 ${className}`}
    >
      <img
        src={photo.url}
        alt=""
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-graphite-900/0 transition-colors group-hover:bg-graphite-900/30">
        <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {overlay}
    </button>
  );
}

// Renders a Facebook/Instagram-style photo grid depending on count:
// 1 photo -> full width, 2 -> side by side, 3+ -> big left + stacked right,
// with a "+N" overlay on the last visible tile if there are more than 4.
function PhotoGrid({ photos, onOpen }) {
  const MAX_VISIBLE = 4;
  const visible = photos.slice(0, MAX_VISIBLE);
  const extraCount = photos.length - MAX_VISIBLE;

  if (visible.length === 1) {
    return (
      <div className="grid grid-cols-1 gap-0.5 overflow-hidden rounded-lg">
        <Tile photo={visible[0]} className="aspect-4/3" onOpen={onOpen} />
      </div>
    );
  }

  if (visible.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
        {visible.map((p) => (
          <Tile
            key={p._id}
            photo={p}
            className="aspect-square"
            onOpen={onOpen}
          />
        ))}
      </div>
    );
  }

  // 3 or 4 (with possible "+N more" on the last tile)
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-lg">
      <Tile
        photo={visible[0]}
        className="row-span-2 aspect-square h-full"
        onOpen={onOpen}
      />
      {visible.slice(1).map((p, i) => {
        const isLast = i === visible.slice(1).length - 1;
        return (
          <Tile
            key={p._id}
            photo={p}
            className="aspect-square"
            onOpen={onOpen}
            overlay={
              isLast && extraCount > 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-graphite-900/50">
                  <span className="text-lg font-semibold text-white">
                    +{extraCount}
                  </span>
                </div>
              ) : null
            }
          />
        );
      })}
    </div>
  );
}

export default function SupplierItems() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPhoto, setOpenPhoto] = useState(null);

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
    <div className="mx-auto max-w-xl px-3 sm:px-0">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Newspaper className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-graphite-900">
            {t("supplierDamagedTitle")}
          </h1>
          <p className="truncate text-sm text-graphite-500">
            {t("supplierDamagedDescription")}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-graphite-500">{t("loading")}</p>
      ) : damagedEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-graphite-300 bg-white py-16 text-center">
          <ImageOff className="mx-auto h-8 w-8 text-graphite-300" />
          <p className="mt-3 text-sm text-graphite-500">
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
                className="overflow-hidden rounded-2xl border border-graphite-200 bg-white shadow-sm"
              >
                {/* Post-style header: avatar + name + meta line */}
                <div className="flex items-start gap-3 px-4 py-3">
                  <span
                    className="h-11 w-11 shrink-0 rounded-full border border-graphite-200 shadow-sm"
                    style={{ backgroundColor: item.color }}
                    title={item.color}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-graphite-900">
                      {item.name}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-graphite-500">
                      <span className="font-mono">{item.serialNumber}</span>
                      <span className="text-graphite-300">·</span>
                      <span>PCS/CTN {partLabel(item, part)}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    {t("damagedCount", { count: part.damaged })}
                  </span>
                </div>

                {/* Caption */}
                {part.damageDescription && (
                  <p className="px-4 pb-3 text-sm leading-relaxed text-graphite-700">
                    {part.damageDescription}
                  </p>
                )}

                {/* Photos */}
                {photos.length === 0 ? (
                  <div className="mx-4 mb-4 rounded-lg border border-dashed border-graphite-200 py-8 text-center">
                    <ImageOff className="mx-auto h-6 w-6 text-graphite-300" />
                    <p className="mt-2 text-sm text-graphite-400">
                      {t("supplierNoPhotosYet")}
                    </p>
                  </div>
                ) : (
                  <>
                    <PhotoGrid photos={photos} onOpen={setOpenPhoto} />
                    <p className="px-4 py-2 text-xs text-graphite-400">
                      {t("photoCount", {
                        count: photos.length,
                        max: part.damaged,
                      })}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {openPhoto && (
        <PhotoLightbox url={openPhoto} onClose={() => setOpenPhoto(null)} />
      )}
    </div>
  );
}
