"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Plus, Pencil, Trash2, X,
  MapPin, Phone, Home, User, Loader2
} from "lucide-react";
import { addFarmer, updateFarmer, deleteFarmer } from "./actions";

// Leaflet uses browser APIs — load only on client
const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] rounded-xl border border-green-200 bg-green-50 text-green-900 flex items-center justify-center text-sm text-green-400">
      Loading map…
    </div>
  ),
});

const FarmersMap = dynamic(() => import("./FarmersMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm h-[430px] flex items-center justify-center text-sm text-green-400">
      Loading map…
    </div>
  ),
});

export type Farmer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

type Mode = "add" | "edit";

export default function FarmersClient({
  initialFarmers,
}: {
  initialFarmers: Farmer[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [editFarmer, setEditFarmer] = useState<Farmer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // lat/lng state — controlled separately (map picker sets them)
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  function openAdd() {
    setMode("add");
    setEditFarmer(null);
    setLat(null);
    setLng(null);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEdit(farmer: Farmer) {
    setMode("edit");
    setEditFarmer(farmer);
    setLat(farmer.latitude);
    setLng(farmer.longitude);
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsModalOpen(false);
    setEditFarmer(null);
    setFormError(null);
  }

  function handleMapChange(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Inject map coordinates into form data
    formData.set("latitude", lat !== null ? String(lat) : "");
    formData.set("longitude", lng !== null ? String(lng) : "");
    setFormError(null);

    startTransition(async () => {
      const result =
        mode === "add" ? await addFarmer(formData) : await updateFarmer(formData);

      if (result.error) {
        setFormError(result.error);
      } else {
        setIsModalOpen(false);
        setEditFarmer(null);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteFarmer(id);
      if (!result.error) {
        setDeleteId(null);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-900">Farmers</h1>
            <p className="text-sm text-green-600/50 mt-0.5">
              {initialFarmers.length} registered farmer{initialFarmers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Farmer
          </button>
        </div>

        {/* Locations map — always visible */}
        <FarmersMap farmers={initialFarmers} />

        {/* Empty state */}
        {initialFarmers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-900 flex items-center justify-center mx-auto mb-4">
              <User className="w-7 h-7 text-green-300" />
            </div>
            <p className="text-green-700/50 text-sm font-medium">No farmers yet</p>
            <p className="text-green-600/30 text-xs mt-1">
              Click the button above to add your first farmer
            </p>
            <button
              onClick={openAdd}
              className="mt-5 text-sm text-green-600 hover:text-green-800 font-semibold underline underline-offset-2 transition"
            >
              + Add Farmer
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-50 bg-green-50 text-green-900/70">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider">Address</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider">Location</th>
                    <th className="px-5 py-3.5 w-28" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {initialFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-green-50 text-green-900/40 transition-colors group">
                      <td className="px-5 py-4 font-semibold text-green-900">{farmer.name}</td>
                      <td className="px-5 py-4 text-green-700">
                        {farmer.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-green-400 shrink-0" />
                            {farmer.phone}
                          </span>
                        ) : (
                          <span className="text-green-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-green-700 max-w-[200px]">
                        {farmer.address ? (
                          <span className="flex items-start gap-1.5">
                            <Home className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                            <span className="truncate">{farmer.address}</span>
                          </span>
                        ) : (
                          <span className="text-green-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {farmer.latitude && farmer.longitude ? (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                            <MapPin className="w-3 h-3" />
                            {Number(farmer.latitude).toFixed(4)}, {Number(farmer.longitude).toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-xs text-green-300">Not set</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {deleteId === farmer.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-500 font-medium">Delete?</span>
                            <button
                              onClick={() => handleDelete(farmer.id)}
                              disabled={isPending}
                              className="text-xs bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                              {isPending ? "…" : "Yes"}
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              disabled={isPending}
                              className="text-xs text-green-600 hover:underline font-medium"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openEdit(farmer)}
                              title="Edit"
                              className="p-1.5 rounded-lg text-green-500 hover:bg-green-100 hover:text-green-700 transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(farmer.id)}
                              title="Delete"
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/25 backdrop-blur-sm px-4 py-6 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl border border-green-100 shadow-2xl w-full max-w-lg my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-50">
              <h2 className="font-bold text-green-900">
                {mode === "add" ? "Add New Farmer" : "Edit Farmer"}
              </h2>
              <button
                onClick={closeModal}
                disabled={isPending}
                className="p-1.5 rounded-lg text-green-400 hover:text-green-700 hover:bg-green-50 text-green-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              {mode === "edit" && (
                <input type="hidden" name="id" value={editFarmer?.id} />
              )}

              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <span>⚠</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="farmer-name" className="block text-sm font-semibold text-green-900">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400 pointer-events-none" />
                  <input
                    id="farmer-name"
                    name="name"
                    type="text"
                    required
                    autoFocus
                    defaultValue={editFarmer?.name ?? ""}
                    placeholder="e.g. Ravi Kumar"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="farmer-phone" className="block text-sm font-semibold text-green-900">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400 pointer-events-none" />
                  <input
                    id="farmer-phone"
                    name="phone"
                    type="tel"
                    defaultValue={editFarmer?.phone ?? ""}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label htmlFor="farmer-address" className="block text-sm font-semibold text-green-900">
                  Address
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-4 h-4 text-green-400 pointer-events-none" />
                  <textarea
                    id="farmer-address"
                    name="address"
                    rows={2}
                    defaultValue={editFarmer?.address ?? ""}
                    placeholder="e.g. 45 Garden Road, Colombo"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                  />
                </div>
              </div>

              {/* Map picker */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-green-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-green-500" />
                  Pick Location on Map
                  <span className="text-green-400 font-normal text-xs">(optional)</span>
                </label>
                {/* key forces fresh map when switching add/edit */}
                <MapPicker
                  key={editFarmer?.id ?? "new"}
                  initialLat={editFarmer?.latitude}
                  initialLng={editFarmer?.longitude}
                  onChange={handleMapChange}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-green-200 text-green-700 hover:bg-green-50 text-green-900 font-semibold text-sm py-2.5 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 transition flex items-center justify-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending
                    ? "Saving..."
                    : mode === "add"
                    ? "Add Farmer"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
