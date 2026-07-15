import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getFloors, createFloor, getFloorOccupancy } from "../api/floors";
import { FLOOR_SIZE_PRESETS } from "../floorSizePresets";
import FloorShapeEditor from "./FloorShapeEditor";
import FloorGrid from "./FloorGrid";

export default function FloorsMap() {
  const [floors, setFloors] = useState([]);
  const [occupancyByFloor, setOccupancyByFloor] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [preset, setPreset] = useState(null);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef(null);

  const loadFloors = async () => {
    setLoading(true);
    try {
      const data = await getFloors();
      setFloors(data);

      const occupancyEntries = await Promise.all(
        data.map((floor) =>
          getFloorOccupancy(floor._id).then((res) => [floor._id, res]),
        ),
      );
      setOccupancyByFloor(Object.fromEntries(occupancyEntries));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFloors();
  }, []);

  const resetForm = () => {
    setName("");
    setPreset(null);
    setShowForm(false);
  };

  const handleCreateFloor = async () => {
    if (!name) {
      alert("Give the floor a name first");
      return;
    }
    if (!preset) {
      alert("Pick a size first");
      return;
    }

    const cells = editorRef.current?.getCells() || [];
    if (cells.length === 0) {
      alert("Draw the floor's shape by tapping the dots");
      return;
    }

    setSaving(true);
    try {
      await createFloor({
        name,
        rows: preset.rows,
        cols: preset.cols,
        cells,
      });
      resetForm();
      loadFloors();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to inventory
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Floor Maps
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Dark squares are occupied, light squares are empty.
            </p>
          </div>

          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="text-base leading-none">+</span>
            Add Floor
          </button>
        </div>

        {showForm && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              New Floor
            </h2>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Floor 1"
                className="mt-1.5 block w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-slate-700">
                Size
              </label>
              <div className="mt-2 flex items-end gap-4">
                {FLOOR_SIZE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 transition-colors ${
                      preset?.id === p.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`rounded-sm ${
                        preset?.id === p.id ? "bg-blue-600" : "bg-slate-400"
                      }`}
                      style={{
                        width: p.previewPx,
                        height: p.previewPx,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {preset && (
              <div className="mt-5">
                <label className="block text-sm font-medium text-slate-700">
                  Draw the shape — tap or drag over the dots
                </label>
                <div className="mt-2">
                  <FloorShapeEditor
                    key={preset.id}
                    ref={editorRef}
                    rows={preset.rows}
                    cols={preset.cols}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => editorRef.current?.clear()}
                  className="mt-2 text-sm text-slate-500 transition-colors hover:text-red-600"
                >
                  Clear drawing
                </button>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFloor}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create Floor"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading floors...</p>
        ) : floors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
            <p className="text-sm text-slate-500">
              No floors yet. Add one to start mapping locations.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {floors.map((floor) => {
              const occ = occupancyByFloor[floor._id];
              return (
                <div
                  key={floor._id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">
                      {floor.name}
                    </h2>
                    <span className="text-sm text-slate-500">
                      {occ ? occ.occupied.length : 0} / {floor.cells.length}{" "}
                      occupied
                    </span>
                  </div>
                  {occ && (
                    <FloorGrid
                      rows={floor.rows}
                      cols={floor.cols}
                      shapeCells={floor.cells}
                      occupied={occ.occupied}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
