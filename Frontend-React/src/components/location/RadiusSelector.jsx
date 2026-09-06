import { useLocationStore } from "../../features/location/location.store";

const RADII = [
  { label: "2 Km", value: 2000 },
  { label: "5 Km", value: 5000 },
  { label: "10 Km", value: 10000 },
];

export default function RadiusSelector() {
  const {
    selectedRadius,
    setSelectedRadius,
    clearAll,
  } = useLocationStore();

  return (
    <div className="space-y-5 animate-fadeIn">

      <h3 className="text-sm font-medium text-slate-700">
        Select Analysis Radius
      </h3>

      {/* Radius Buttons */}
      <div className="flex gap-2">
        {RADII.map((r) => {
          const active = selectedRadius === r.value;

          return (
            <button
              key={r.value}
              onClick={() => setSelectedRadius(r.value)}
              className={`
                flex-1 py-2 rounded-xl text-sm font-medium
                transition
                ${
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                }
              `}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Clear */}
      {selectedRadius && (
        <button
          onClick={clearAll}
          className="
            w-full py-2 rounded-xl
            border border-red-300
            text-red-600 text-sm font-medium
            hover:bg-red-50
            transition
          "
        >
          Clear Selection
        </button>
      )}

    </div>
  );
}
