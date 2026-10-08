"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Loader2, LocateFixed } from "lucide-react";

// Fix Leaflet default marker icons broken by webpack/Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Fly map to a new centre whenever `center` changes
function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 13), { duration: 1 });
  }, [center, map]);
  return null;
}

// Place / move marker on map click
function ClickMarker({
  position,
  onMove,
}: {
  position: [number, number];
  onMove: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = (e.target as L.Marker).getLatLng();
          onMove(lat, lng);
        },
      }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type Props = {
  initialLat?: number | null;
  initialLng?: number | null;
  onChange: (lat: number, lng: number) => void;
};

const SRI_LANKA: [number, number] = [7.8731, 80.7718];

export default function MapPicker({ initialLat, initialLng, onChange }: Props) {
  const defaultPos: [number, number] =
    initialLat && initialLng ? [initialLat, initialLng] : SRI_LANKA;

  const [position, setPosition] = useState<[number, number]>(defaultPos);
  const [flyTarget, setFlyTarget] = useState<[number, number]>(defaultPos);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  function handleMove(lat: number, lng: number) {
    setPosition([lat, lng]);
    onChange(lat, lng);
  }

  // Address search via Nominatim (free, no API key)
  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.length === 0) {
        setSearchError("No results found. Try a different address.");
      } else {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        handleMove(lat, lng);
        setFlyTarget([lat, lng]);
      }
    } catch {
      setSearchError("Search failed. Check your connection.");
    } finally {
      setSearching(false);
    }
  }

  // Browser Geolocation (free, no API key)
  function handleMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        handleMove(coords.latitude, coords.longitude);
        setFlyTarget([coords.latitude, coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  return (
    <div className="space-y-2">
      {/* Search bar — intentionally NOT a <form> to avoid nesting inside the farmer form */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            placeholder="Search address on map…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
        >
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {searching ? "…" : "Go"}
        </button>
        <button
          type="button"
          onClick={handleMyLocation}
          disabled={locating}
          title="Use my location"
          className="px-3 py-2 rounded-xl border border-green-200 hover:bg-green-50 text-green-900 text-green-600 transition disabled:opacity-50"
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-red-500">{searchError}</p>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-green-200 z-0">
        <MapContainer
          center={position}
          zoom={initialLat ? 13 : 8}
          style={{ height: "240px", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickMarker position={position} onMove={handleMove} />
          <FlyTo center={flyTarget} />
        </MapContainer>
      </div>

      {/* Coordinates display */}
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 text-green-900 border border-green-100 rounded-lg px-3 py-2">
        <span className="font-semibold">📍</span>
        <span>
          Lat: <span className="font-mono font-semibold">{position[0].toFixed(6)}</span>
          &nbsp;&nbsp;Lng: <span className="font-mono font-semibold">{position[1].toFixed(6)}</span>
        </span>
        <span className="text-green-400 ml-auto">Click map or drag pin to adjust</span>
      </div>
    </div>
  );
}
