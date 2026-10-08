"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import type { Farmer } from "./FarmersClient";

// Fix Leaflet marker icons broken by webpack/Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Green marker for located farmers
const GreenIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Auto-fit map bounds to show all markers
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, points]);
  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function FarmersMap({ farmers }: { farmers: Farmer[] }) {
  const located = farmers.filter((f) => f.latitude && f.longitude);
  const points = located.map(
    (f) => [f.latitude!, f.longitude!] as [number, number]
  );

  const defaultCenter: [number, number] =
    points.length > 0 ? points[0] : [7.8731, 80.7718]; // Sri Lanka

  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-green-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-green-100 text-green-700">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-green-900 text-sm">
              Farmer Locations
            </h2>
            <p className="text-xs text-green-500">
              {located.length} of {farmers.length} farmers have a location set
            </p>
          </div>
        </div>
        {located.length < farmers.length && (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            {farmers.length - located.length} missing location
          </span>
        )}
      </div>

      {located.length === 0 ? (
        /* Empty state */
        <div className="h-[340px] flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-900 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-green-200" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-700/50">
              No locations set yet
            </p>
            <p className="text-xs text-green-500/40 mt-0.5">
              Add or edit a farmer and pick their location on the map
            </p>
          </div>
        </div>
      ) : (
        /* Map */
        <MapContainer
          center={defaultCenter}
          zoom={points.length === 1 ? 13 : 7}
          style={{ height: "380px", width: "100%", zIndex: 0 }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <FitBounds points={points} />

          {located.map((farmer) => (
            <Marker
              key={farmer.id}
              position={[farmer.latitude!, farmer.longitude!]}
              icon={GreenIcon}
            >
              <Popup minWidth={180}>
                <div style={{ fontFamily: "inherit", padding: "2px 0" }}>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#14532d",
                      marginBottom: 6,
                    }}
                  >
                    {farmer.name}
                  </p>
                  {farmer.phone && (
                    <p style={{ fontSize: 12, color: "#166534", marginBottom: 3 }}>
                      📞 {farmer.phone}
                    </p>
                  )}
                  {farmer.address && (
                    <p style={{ fontSize: 12, color: "#166534", marginBottom: 3 }}>
                      🏠 {farmer.address}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 10,
                      color: "#86efac",
                      marginTop: 6,
                      fontFamily: "monospace",
                    }}
                  >
                    {Number(farmer.latitude).toFixed(5)},{" "}
                    {Number(farmer.longitude).toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
