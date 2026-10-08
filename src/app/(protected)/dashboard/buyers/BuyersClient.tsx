"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, ShoppingCart, Phone, Home, User, Loader2 } from "lucide-react";
import { addBuyer, updateBuyer, deleteBuyer } from "./actions";

export type Buyer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
};

type Mode = "add" | "edit";

export default function BuyersClient({ initialBuyers }: { initialBuyers: Buyer[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode]               = useState<Mode>("add");
  const [editBuyer, setEditBuyer]     = useState<Buyer | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [formError, setFormError]     = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  function openAdd()              { setMode("add");  setEditBuyer(null);   setFormError(null); setIsModalOpen(true); }
  function openEdit(b: Buyer)     { setMode("edit"); setEditBuyer(b);      setFormError(null); setIsModalOpen(true); }
  function closeModal()           { if (isPending) return; setIsModalOpen(false); setEditBuyer(null); setFormError(null); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFormError(null);
    startTransition(async () => {
      const result = mode === "add" ? await addBuyer(fd) : await updateBuyer(fd);
      if (result.error) { setFormError(result.error); }
      else              { setIsModalOpen(false); setEditBuyer(null); router.refresh(); }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteBuyer(id);
      if (!result.error) { setDeleteId(null); router.refresh(); }
    });
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-900">Buyers</h1>
            <p className="text-sm text-green-600/50 mt-0.5">
              {initialBuyers.length} registered buyer{initialBuyers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Buyer
          </button>
        </div>

        {/* Empty state */}
        {initialBuyers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-900 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-7 h-7 text-green-300" />
            </div>
            <p className="text-green-700/50 text-sm font-medium">No buyers yet</p>
            <button onClick={openAdd} className="mt-5 text-sm text-green-600 font-semibold underline underline-offset-2">
              + Add your first buyer
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-50 bg-green-50 text-green-900/70">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase tracking-wider">Address</th>
                  <th className="px-5 py-3.5 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {initialBuyers.map(buyer => (
                  <tr key={buyer.id} className="hover:bg-green-50 text-green-900/40 transition-colors group">
                    <td className="px-5 py-4 font-semibold text-green-900">
                      <span className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-3.5 h-3.5 text-green-600" />
                        </span>
                        {buyer.name}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-green-700">
                      {buyer.phone
                        ? <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-green-400 shrink-0" />{buyer.phone}</span>
                        : <span className="text-green-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-green-700 max-w-[220px]">
                      {buyer.address
                        ? <span className="flex items-start gap-1.5"><Home className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" /><span className="truncate">{buyer.address}</span></span>
                        : <span className="text-green-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {deleteId === buyer.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-500 font-medium">Delete?</span>
                          <button onClick={() => handleDelete(buyer.id)} disabled={isPending}
                            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg font-semibold transition disabled:opacity-50">
                            {isPending ? "…" : "Yes"}
                          </button>
                          <button onClick={() => setDeleteId(null)} className="text-xs text-green-600 hover:underline font-medium">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition">
                          <Link href={`/dashboard/buyers/${buyer.id}`} title="View Ledger" className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition font-semibold text-xs flex items-center gap-1">
                            Ledger
                          </Link>
                          <button onClick={() => openEdit(buyer)} className="p-1.5 rounded-lg text-green-500 hover:bg-green-100 hover:text-green-700 transition"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteId(buyer.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/25 backdrop-blur-sm px-4"
          onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-2xl border border-green-100 shadow-2xl w-full max-w-sm">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="font-bold text-green-900">
                  {mode === "add" ? "Add Buyer" : "Edit Buyer"}
                </h2>
              </div>
              <button onClick={closeModal} disabled={isPending}
                className="p-1.5 rounded-lg text-green-400 hover:text-green-700 hover:bg-green-50 text-green-900 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {mode === "edit" && <input type="hidden" name="id" value={editBuyer?.id} />}

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span>⚠</span><span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="b-name" className="block text-sm font-semibold text-green-900">
                  Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400 pointer-events-none" />
                  <input id="b-name" name="name" type="text" required autoFocus
                    defaultValue={editBuyer?.name ?? ""}
                    placeholder="e.g. Silva Floral Shop"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="b-phone" className="block text-sm font-semibold text-green-900">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400 pointer-events-none" />
                  <input id="b-phone" name="phone" type="tel"
                    defaultValue={editBuyer?.phone ?? ""}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label htmlFor="b-address" className="block text-sm font-semibold text-green-900">Address</label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-4 h-4 text-green-400 pointer-events-none" />
                  <textarea id="b-address" name="address" rows={2}
                    defaultValue={editBuyer?.address ?? ""}
                    placeholder="e.g. 12 Market Street, Colombo"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} disabled={isPending}
                  className="flex-1 rounded-xl border border-green-200 text-green-700 hover:bg-green-50 text-green-900 font-semibold text-sm py-2.5 transition disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 transition flex items-center justify-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending ? "Saving..." : mode === "add" ? "Add Buyer" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
