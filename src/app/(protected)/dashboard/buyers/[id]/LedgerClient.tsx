"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Trash2, X, Wallet, Loader2, FileText, Package, Printer } from "lucide-react";
import { addDeposit, deleteDeposit } from "./actions";

type LedgerItem = {
  id: string;
  type: "Order" | "Deposit";
  date: string;
  amount: number;
  description: string;
  flowerType: string | null;
  unit: string | null;
  unitPrice: number | null;
  quantity: number | null;
  is_debit: boolean;
};

export default function LedgerClient({ 
  buyerId, 
  buyerName,
  statementDate,
  ledger, 
  totalOrders, 
  totalDeposits, 
  balance 
}: { 
  buyerId: string;
  buyerName: string;
  statementDate: string;
  ledger: LedgerItem[];
  totalOrders: number;
  totalDeposits: number;
  balance: number;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("buyer_id", buyerId);
    setFormError(null);

    startTransition(async () => {
      const result = await addDeposit(fd);
      if (result.error) {
        setFormError(result.error);
      } else {
        setIsModalOpen(false);
        router.refresh();
      }
    });
  }

  function handleDeleteDeposit(id: string) {
    startTransition(async () => {
      const result = await deleteDeposit(id, buyerId);
      if (!result.error) {
        setDeleteId(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
      </div>

      <div id="ledger-print-root" className="space-y-6">
        <div className="ledger-print-header">
          <div className="ledger-company">
            <Image
              src="/logo.png"
              alt="Kamali's Farms & Flowers logo"
              width={84}
              height={84}
              className="ledger-print-logo"
              loading="eager"
            />
            <div>
              <h1>Kamali&apos;s Farms &amp; Flowers</h1>
              <p>257/B, Palakudawa, Talawila Church, Puttalam, Sri Lanka</p>
              <p>+94710830983 &nbsp; | &nbsp; +94778311886</p>
            </div>
          </div>
          <div className="ledger-invoice-meta">
            <p className="ledger-invoice-label">Invoice</p>
            <p><strong>Customer:</strong> {buyerName}</p>
            <p><strong>Date:</strong> {statementDate}</p>
          </div>
        </div>

      {/* Summary Cards */}
      <div className="ledger-summary grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
          <p className="text-sm text-green-600/70 font-medium mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-green-900">Rs {totalOrders.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
          <p className="text-sm text-green-600/70 font-medium mb-1">Total Deposits</p>
          <p className="text-2xl font-bold text-green-900">Rs {totalDeposits.toLocaleString()}</p>
        </div>
        <div className={`bg-white rounded-2xl border shadow-sm p-6 ${balance > 0 ? 'border-red-200' : 'border-emerald-200'}`}>
          <p className={`text-sm font-medium mb-1 ${balance > 0 ? 'text-red-600/70' : 'text-emerald-600/70'}`}>
            Balance Owed
          </p>
          <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            Rs {balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-50">
          <h2 className="font-bold text-green-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600"/> Transaction Ledger
          </h2>
        <div className="ledger-screen-only flex gap-2">
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Package className="w-4 h-4" /> New Order
          </Link>
          <button
            onClick={() => { setFormError(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Deposit
            </button>
          </div>
        </div>

        {ledger.length === 0 ? (
          <div className="p-10 text-center">
            <Wallet className="w-10 h-10 text-green-200 mx-auto mb-3" />
            <p className="text-green-700/50 text-sm font-medium">No transactions yet.</p>
          </div>
        ) : (
          <div className="ledger-table-shell overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-50 bg-green-50 text-green-900/70">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase">Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-green-700 uppercase">Description</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-green-700 uppercase">Unit Price</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-green-700 uppercase">Quantity</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-green-700 uppercase">Amount</th>
                  <th className="ledger-screen-only px-5 py-3.5 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {ledger.map((item) => (
                  <tr key={item.id} className="hover:bg-green-50 text-green-900/40 transition group">
                    <td className="px-5 py-4 font-mono text-xs text-green-700">{item.date}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-green-900">{item.flowerType}</span>
                      <span className="ml-2 text-xs text-green-600">{item.type}</span>
                      {item.type === "Order" && (
                        <span className="ml-2 text-xs text-green-600/70">{item.description}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.unitPrice === null ? "—" : (
                        <>
                          <span className="ledger-screen-only">Rs </span>
                          {item.unitPrice.toLocaleString()}
                        </>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.quantity === null ? "—" : `${item.quantity.toLocaleString()}${item.unit ? ` ${item.unit}` : ""}`}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      <span className="ledger-screen-only">
                        {item.is_debit ? "+" : "-"} Rs {item.amount.toLocaleString()}
                      </span>
                      <span className="ledger-print-value">
                        {item.is_debit ? "" : "-"}{item.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="ledger-screen-only px-5 py-4 text-right">
                      {item.type === "Deposit" && (
                        deleteId === item.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-red-500 font-medium">Sure?</span>
                            <button onClick={() => handleDeleteDeposit(item.id)} disabled={isPending} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Yes</button>
                            <button onClick={() => setDeleteId(null)} className="text-xs text-gray-500">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3.5 h-3.5"/></button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="ledger-print-totals">
        <p><span>Orders total</span><strong>{totalOrders.toLocaleString()}</strong></p>
        <p><span>Payments received</span><strong>{totalDeposits.toLocaleString()}</strong></p>
        <p className="ledger-print-balance"><span>Balance due</span><strong>{balance.toLocaleString()}</strong></p>
        <p className="ledger-print-currency">All amounts in Sri Lankan Rupees (LKR)</p>
      </div>
      </div>

      {/* Deposit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/25 backdrop-blur-sm px-4" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl border border-green-100 shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-50">
              <h2 className="font-bold text-green-900 flex items-center gap-2"><Wallet className="w-4 h-4 text-green-600"/> Record Deposit</h2>
              <button onClick={() => setIsModalOpen(false)} disabled={isPending} className="p-1.5 rounded-lg text-green-400 hover:bg-green-50 text-green-900"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{formError}</div>}
              
              <div>
                <label className="block text-xs font-semibold text-green-900 mb-1">Date <span className="text-red-400">*</span></label>
                <input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none focus:ring-2 focus:ring-green-500"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-green-900 mb-1">Amount (Rs) <span className="text-red-400">*</span></label>
                <input name="amount" type="number" min="1" step="any" placeholder="0.00" required className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none focus:ring-2 focus:ring-green-500"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-green-900 mb-1">Notes / Method (Optional)</label>
                <input name="notes" type="text" placeholder="e.g. Bank Transfer, Cash" className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none focus:ring-2 focus:ring-green-500"/>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isPending} className="flex-1 rounded-xl border border-green-200 text-green-700 font-semibold text-sm py-2.5 transition disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 transition flex items-center justify-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Save Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
