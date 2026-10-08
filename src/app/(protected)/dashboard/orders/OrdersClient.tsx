"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Calendar, Loader2, DollarSign, Package, SlidersHorizontal } from "lucide-react";
import { saveOrder, deleteOrder, updateOrderStatus } from "./actions";

export type OrderItem = {
  id?: string;
  flower_id: string;
  quantity: number;
  rate: number;
  flower?: { name: string; unit: string };
};

export type Order = {
  id: string;
  buyer_id: string;
  delivery_date: string;
  status: string;
  total_amount: number;
  buyer?: { name: string };
  items: OrderItem[];
};

export type BuyerOption = { id: string; name: string };
export type FlowerOption = { id: string; name: string; unit: string };

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Processing: "bg-blue-100 text-blue-800 border-blue-200",
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function OrdersClient({
  orders,
  buyers,
  flowers,
}: {
  orders: Order[];
  buyers: BuyerOption[];
  flowers: FlowerOption[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  
  // Form State
  const [buyerId, setBuyerId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [status, setStatus] = useState("Pending");
  const [items, setItems] = useState<OrderItem[]>([]);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter state
  const [filterBuyer, setFilterBuyer] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const hasActiveFilters = filterBuyer !== "all" || filterStatus !== "all" || filterDate !== "";

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          (filterBuyer === "all" || o.buyer_id === filterBuyer) &&
          (filterStatus === "all" || o.status === filterStatus) &&
          (!filterDate || o.delivery_date === filterDate)
      ),
    [orders, filterBuyer, filterStatus, filterDate]
  );

  function clearFilters() {
    setFilterBuyer("all");
    setFilterStatus("all");
    setFilterDate("");
  }

  function openAdd() {
    setEditOrder(null);
    setBuyerId(buyers[0]?.id || "");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setStatus("Pending");
    setItems([{ flower_id: flowers[0]?.id || "", quantity: 1, rate: 0 }]);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEdit(order: Order) {
    setEditOrder(order);
    setBuyerId(order.buyer_id);
    setDeliveryDate(order.delivery_date);
    setStatus(order.status);
    setItems(order.items.map(i => ({ flower_id: i.flower_id, quantity: i.quantity, rate: i.rate })));
    setFormError(null);
    setIsModalOpen(true);
  }

  function addItem() {
    setItems([...items, { flower_id: flowers[0]?.id || "", quantity: 1, rate: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return setFormError("Add at least one item.");
    setFormError(null);

    startTransition(async () => {
      const result = await saveOrder({
        id: editOrder?.id,
        buyer_id: buyerId,
        delivery_date: deliveryDate,
        status,
        items
      });
      if (result.error) {
        setFormError(result.error);
      } else {
        setIsModalOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this order?")) return;
    startTransition(async () => {
      await deleteOrder(id);
    });
  }

  function handleStatusChange(id: string, newStatus: string) {
    startTransition(async () => {
      await updateOrderStatus(id, newStatus);
    });
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-900">Orders</h1>
            <p className="text-sm text-green-600/50 mt-0.5">
              {hasActiveFilters ? `${filteredOrders.length} of ${orders.length}` : `${orders.length}`} order(s)
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Order
          </button>
        </div>

        {/* Filters: buyer, status, date */}
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-900 shrink-0">
            <SlidersHorizontal className="w-4 h-4" /> Filter
          </span>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1">
            <select
              value={filterBuyer}
              onChange={(e) => setFilterBuyer(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none"
            >
              <option value="all">All Buyers</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none"
            >
              <option value="all">All Statuses</option>
              {["Pending", "Processing", "Completed", "Cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none"
            />
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>


        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-14 text-center">
            <Package className="w-10 h-10 text-green-200 mx-auto mb-3" />
            {hasActiveFilters ? (
              <>
                <p className="text-green-700/50 text-sm font-medium">No orders match the selected filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <p className="text-green-700/50 text-sm font-medium">No orders yet</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 hover:border-green-300 transition">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-green-50 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-green-900">{order.buyer?.name}</h3>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={isPending}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none ${STATUS_COLORS[order.status]}`}
                      >
                        {["Pending", "Processing", "Completed", "Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-green-600">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Date: {order.delivery_date}</span>
                      <span className="flex items-center gap-1 font-semibold text-green-800"><DollarSign className="w-3.5 h-3.5"/> Total: Rs {Number(order.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(order)} className="px-3 py-1.5 bg-green-50 text-green-900 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition">Edit</button>
                    <button onClick={() => handleDelete(order.id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition">Delete</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="bg-green-50 text-green-900/50 border border-green-50 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-green-900">{item.flower?.name}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {item.quantity} {item.flower?.unit} × Rs {item.rate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/25 backdrop-blur-sm px-4 py-6 overflow-y-auto" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl border border-green-100 shadow-2xl w-full max-w-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-50">
              <h2 className="font-bold text-green-900">{editOrder ? "Edit Order" : "New Order"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-50 text-green-900"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {formError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{formError}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-green-900 mb-1">Buyer</label>
                  <select value={buyerId} onChange={e => setBuyerId(e.target.value)} className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none">
                    {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-green-900 mb-1">Delivery Date</label>
                  <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-green-900 mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none">
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-green-900 text-sm">Order Items</h3>
                <button type="button" onClick={addItem} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-200">+ Add Item</button>
              </div>

              <div className="space-y-3 mb-8">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-gray-50 text-gray-900 p-2 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <select value={item.flower_id} onChange={e => updateItem(idx, 'flower_id', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none">
                        {flowers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.unit})</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <input type="number" min="0.1" step="any" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value))} required className="w-full p-2 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none"/>
                    </div>
                    <div className="w-28">
                      <input type="number" min="0" step="any" placeholder="Rate (Rs)" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value))} required className="w-full p-2 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none"/>
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No items added.</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-green-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-green-200 text-green-700 font-semibold text-sm">Cancel</button>
                <button type="submit" disabled={isPending} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
