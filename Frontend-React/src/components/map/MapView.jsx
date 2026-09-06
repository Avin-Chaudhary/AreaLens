import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLocationStore } from "../../features/location/location.store";
import { useState } from "react";

/* Fix default marker icons */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapClickHandler() {
  const setSelectedCoords = useLocationStore(
    (s) => s.setSelectedCoords
  );

  useMapEvents({
    click(e) {
      setSelectedCoords({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}

export default function MapView() {
  const { selectedCoords, selectedRadius } = useLocationStore();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="
          w-full
          h-[320px] lg:h-[520px]
          rounded-3xl
          overflow-hidden
          shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]
          bg-white
          relative
        "
      >
        <MapContainer
          center={[28.6139, 77.209]}
          zoom={11}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler />

          {selectedCoords && (
            <>
              <Marker
                position={[
                  selectedCoords.lat,
                  selectedCoords.lng,
                ]}
              />

              {selectedRadius && (
                <Circle
                  center={[
                    selectedCoords.lat,
                    selectedCoords.lng,
                  ]}
                  radius={selectedRadius}
                  pathOptions={{
                    color: "#2563eb",
                    fillColor: "#60a5fa",
                    fillOpacity: 0.25,
                  }}
                />
              )}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
