import { useState, useEffect } from "react";
import { getItems } from "../api/items";

export default function SupplierItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getItems()
      .then((data) => setItems(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Only items that actually have a damaged part are relevant here
  const itemsWithDamage = items
    .map((item) => ({
      ...item,
      damagedParts: (item.parts || []).filter((p) => (p.damaged || 0) > 0),
    }))
    .filter((item) => item.damagedParts.length > 0);

  return (
    <div>
      <h1 className="text-lg font-semibold text-graphite-900">
        Damaged parts
      </h1>
      <p className="mt-1 text-sm text-graphite-500">
        Items assigned to you with reported damage.
      </p>

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-graphite-500">Loading...</p>
        ) : itemsWithDamage.length === 0 ? (
          <div className="rounded-lg border border-dashed border-graphite-300 bg-white py-12 text-center">
            <p className="text-sm text-graphite-500">
              No damaged parts on your assigned items right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {itemsWithDamage.map((item) => (
              <div
                key={item._id}
                className="rounded-lg border border-graphite-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-sm border border-graphite-300"
                    style={{ backgroundColor: item.color }}
                    title={item.color}
                  />
                  <div>
                    <p className="font-medium text-graphite-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-graphite-500">
                      Serial: {item.serialNumber}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 border-t border-graphite-100 pt-3">
                  {item.damagedParts.map((part) => (
                    <div
                      key={part._id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-graphite-700">{part.name}</span>
                      <span className="font-medium text-red-600">
                        {part.damaged} damaged
                      </span>
                    </div>
                  ))}
                </div>

                {/* Photo upload for damaged parts lands here later */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
