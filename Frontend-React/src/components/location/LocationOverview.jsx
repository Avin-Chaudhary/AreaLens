import { useLocationStore } from "../../features/location/location.store";
import RadiusSelector from "./RadiusSelector";

export default function LocationOverview() {
  const { selectedCoords } = useLocationStore();

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Area Selection
        </h2>
        <p className="text-sm text-slate-500">
          Choose analysis radius
        </p>
      </div>

      {/* Step 1 */}
      {!selectedCoords && (
        <div
          className="
            rounded-2xl
            border border-dashed border-slate-300
            bg-slate-50
            px-5 py-8
            text-center
          "
        >
          <p className="text-sm text-slate-600">
            📍 Click on the map to select a location
          </p>
        </div>
      )}

      {/* Step 2 */}
      {selectedCoords && (
        <>
          <div className="text-sm text-slate-600 leading-relaxed">
            <span className="font-medium text-slate-900">
              Selected location
            </span>
            <br />
            Lat: {selectedCoords.lat.toFixed(4)}, Lng:{" "}
            {selectedCoords.lng.toFixed(4)}
          </div>

          <RadiusSelector />
        </>
      )}

    </div>
  );
}
