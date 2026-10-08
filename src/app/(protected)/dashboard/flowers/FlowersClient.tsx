"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Flower2, Loader2, Tag } from "lucide-react";
import { addFlower, updateFlower, deleteFlower } from "./actions";

export type Flower = {
  id: string;
  name: string;
  unit: string;
  created_at: string;
};

const UNITS = ["Stem", "Bunch", "Dozen", "Box", "Piece", "Kg", "Gram"];

type Mode = "add" | "edit";

export default function FlowersClient({
  initialFlowers,
}: {
  initialFlowers: Flower[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [editFlower, setEditFlower] = useState<Flower | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setMode("add");
    setEditFlower(null);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEdit(flower: Flower) {
    setMode("edit");
    setEditFlower(flower);
    setFormError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsModalOpen(false);
    setEditFlower(null);
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFormError(null);

    startTransition(async () => {
      const result =
        mode === "add" ? await addFlower(formData) : await updateFlower(formData);
      if (result.error) {
        setFormError(result.error);
      } else {
        setIsModalOpen(false);
        setEditFlower(null);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteFlower(id);
      if (!result.error) {
        setDeleteId(null);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-900">Flowers</h1>
            <p className="text-sm text-green-600/50 mt-0.5">
              {initialFlowers.length} flower type{initialFlowers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Flower
          </button>
        </div>

        {/* Empty state */}
        {initialFlowers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-900 flex items-center justify-center mx-auto mb-4">
              <Flower2 className="w-7 h-7 text-green-300" />
            </div>
            <p className="text-green-700/50 text-sm font-medium">No flowers yet</p>
            <p className="text-green-600/30 text-xs mt-1">
              Add your first flower type to get started
            </p>
            <button
              onClick={openAdd}
              className="mt-5 text-sm text-green-600 hover:text-green-800 font-semibold underline underline-offset-2 transition"
            >
              + Add Flower
            </button>
          </div>
        ) : (
          /* Table */
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-50 bg-green-50 text-green-900/70">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider">
                    Flower Name
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-5 py-3.5 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {initialFlowers.map((flower, i) => (
                  <tr
                    key={flower.id}
                    className="hover:bg-green-50 text-green-900/40 transition-colors group"
                  >
                    <td className="px-5 py-4 text-green-400 text-xs font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <Flower2 className="w-3.5 h-3.5 text-green-600" />
                        </span>
                        <span className="font-semibold text-green-900">
                          {flower.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-900 border border-green-200 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <Tag className="w-3 h-3" />
                        {flower.unit}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {deleteId === flower.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-500 font-medium">
                            Delete?
                          </span>
                          <button
                            onClick={() => handleDelete(flower.id)}
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
                            onClick={() => openEdit(flower)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-green-500 hover:bg-green-100 hover:text-green-700 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(flower.id)}
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
        )}
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/25 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl border border-green-100 shadow-2xl w-full max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <Flower2 className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="font-bold text-green-900">
                  {mode === "add" ? "Add Flower" : "Edit Flower"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                disabled={isPending}
                className="p-1.5 rounded-lg text-green-400 hover:text-green-700 hover:bg-green-50 text-green-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {mode === "edit" && (
                <input type="hidden" name="id" value={editFlower?.id} />
              )}

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span>⚠</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Flower Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="flower-name"
                  className="block text-sm font-semibold text-green-900"
                >
                  Flower Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Flower2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400 pointer-events-none" />
                  <input
                    id="flower-name"
                    name="name"
                    type="text"
                    required
                    autoFocus
                    defaultValue={editFlower?.name ?? ""}
                    placeholder="e.g. Rose, Lily, Jasmine"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <label
                  htmlFor="flower-unit"
                  className="block text-sm font-semibold text-green-900"
                >
                  Unit <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400 pointer-events-none" />
                  <select
                    id="flower-unit"
                    name="unit"
                    required
                    defaultValue={editFlower?.unit ?? "Stem"}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm text-green-900 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition appearance-none cursor-pointer"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-400">
                    ▾
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
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
                    ? "Add Flower"
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
