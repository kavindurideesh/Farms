"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  X,
  Calendar,
  Loader2,
  DollarSign,
  Package,
  SlidersHorizontal,
  FileText,
  Printer,
  CheckSquare,
  Square,
} from "lucide-react";
import { saveOrder, deleteOrder, updateOrderStatus } from "./actions";
import InvoiceModal from "./InvoiceModal";

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
  buyer?: {
    id?: string;
    name: string;
    phone?: string | null;
    address?: string | null;
  };
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

  // Invoice & Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [invoiceOrders, setInvoiceOrders] = useState<Order[]>([]);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const hasActiveFilters =
    filterBuyer !== "all" || filterStatus !== "all" || filterDate !== "";

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

  // Selection helpers
  function toggleOrderSelection(id: string) {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAllFiltered() {
    const filteredIds = filteredOrders.map((o) => o.id);
    const areAllSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedOrderIds.includes(id));

    if (areAllSelected) {
      setSelectedOrderIds((prev) =>
        prev.filter((id) => !filteredIds.includes(id))
      );
    } else {
      setSelectedOrderIds((prev) =>
        Array.from(new Set([...prev, ...filteredIds]))
      );
    }
  }

  function handleOpenInvoiceForSelected() {
    const selected = orders.filter((o) => selectedOrderIds.includes(o.id));
    if (selected.length === 0) return;
    setInvoiceOrders(selected);
    setIsInvoiceOpen(true);
  }

  function handleOpenInvoiceForSingle(order: Order) {
    setInvoiceOrders([order]);
    setIsInvoiceOpen(true);
  }

  const selectedTotal = useMemo(() => {
    return orders
      .filter((o) => selectedOrderIds.includes(o.id))
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  }, [orders, selectedOrderIds]);

  const areAllFilteredSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  // Form Handlers
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
    setItems(
      order.items.map((i) => ({
        flower_id: i.flower_id,
        quantity: i.quantity,
        rate: i.rate,
      }))
    );
    setFormError(null);
    setIsModalOpen(true);
  }

  function addItem() {
    setItems([
      ...items,
      { flower_id: flowers[0]?.id || "", quantity: 1, rate: 0 },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) {
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
        items,
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
      setSelectedOrderIds((prev) => prev.filter((item) => item !== id));
    });
  }

  function handleStatusChange(id: string, newStatus: string) {
    startTransition(async () => {
      await updateOrderStatus(id, newStatus);
    });
  }

  return (
    <>
      <div className="space-y-5 pb-16 no-print">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-green-900">Orders</h1>
            <p className="text-sm text-green-600/70 mt-0.5">
              {hasActiveFilters
                ? `${filteredOrders.length} of ${orders.length}`
                : `${orders.length}`}{" "}
              order(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedOrderIds.length > 0 && (
              <button
                onClick={handleOpenInvoiceForSelected}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Invoice ({selectedOrderIds.length})</span>
              </button>
            )}
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Order
            </button>
          </div>
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
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none"
            >
              <option value="all">All Statuses</option>
              {["Pending", "Processing", "Completed", "Cancelled"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
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
                className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Selection Bar for Filtered Orders */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between px-2 text-xs text-stone-600">
            <button
              onClick={toggleSelectAllFiltered}
              className="inline-flex items-center gap-1.5 font-medium hover:text-green-800 transition cursor-pointer"
            >
              {areAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-green-600" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
              <span>
                {areAllFilteredSelected
                  ? "Deselect All Filtered"
                  : `Select All Filtered (${filteredOrders.length})`}
              </span>
            </button>
            {selectedOrderIds.length > 0 && (
              <span className="text-stone-500">
                {selectedOrderIds.length} of {orders.length} order(s) selected
              </span>
            )}
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-14 text-center">
            <Package className="w-10 h-10 text-green-200 mx-auto mb-3" />
            {hasActiveFilters ? (
              <>
                <p className="text-green-700/50 text-sm font-medium">
                  No orders match the selected filters
                </p>
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
            {filteredOrders.map((order) => {
              const isSelected = selectedOrderIds.includes(order.id);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                    isSelected
                      ? "border-green-500 ring-2 ring-green-100"
                      : "border-green-100 hover:border-green-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-green-50 pb-4 mb-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox for selection */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="mt-1 w-4 h-4 rounded border-stone-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
                        title="Select this order for invoice"
                      />

                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-green-900">
                            {order.buyer?.name || "Unknown Buyer"}
                          </h3>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value)
                            }
                            disabled={isPending}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none ${
                              STATUS_COLORS[order.status]
                            }`}
                          >
                            {[
                              "Pending",
                              "Processing",
                              "Completed",
                              "Cancelled",
                            ].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-green-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Date:{" "}
                            {order.delivery_date}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-green-800">
                            <DollarSign className="w-3.5 h-3.5" /> Total: Rs{" "}
                            {Number(order.total_amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenInvoiceForSingle(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition cursor-pointer"
                        title="Create and print invoice for this order"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Invoice</span>
                      </button>
                      <button
                        onClick={() => openEdit(order)}
                        className="px-3 py-1.5 bg-green-50 text-green-900 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-green-50 text-green-900/50 border border-green-50 rounded-lg p-3 text-sm"
                      >
                        <p className="font-semibold text-green-900">
                          {item.flower?.name}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {item.quantity} {item.flower?.unit} × Rs {item.rate}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Selection Banner when orders are selected */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 backdrop-blur-sm text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 sm:gap-6 border border-stone-700/60 max-w-[92vw]">
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-emerald-400">
              {selectedOrderIds.length}
            </span>{" "}
            order(s) selected
            <span className="hidden sm:inline mx-2 text-stone-500">|</span>
            <span className="hidden sm:inline text-stone-200 font-medium">
              Total:{" "}
              <strong className="text-white font-bold">
                Rs {selectedTotal.toLocaleString()}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInvoiceForSelected}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl transition shadow-md cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        orders={invoiceOrders}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />

      {/* New / Edit Order Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/25 backdrop-blur-xs px-4 py-6 overflow-y-auto"
          onClick={(e) =>
            e.target === e.currentTarget && setIsModalOpen(false)
          }
        >
          <div className="bg-white rounded-2xl border border-green-100 shadow-2xl w-full max-w-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-50">
              <h2 className="font-bold text-green-900">
                {editOrder ? "Edit Order" : "New Order"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-green-400 hover:bg-green-50 text-green-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-green-900 mb-1">
                    Buyer
                  </label>
                  <select
                    value={buyerId}
                    onChange={(e) => setBuyerId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none"
                  >
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-green-900 mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-green-900 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-green-900 text-sm outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-green-900 text-sm">
                  Order Items
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-200 cursor-pointer"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-3 mb-8">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 items-center bg-gray-50 text-gray-900 p-2 rounded-xl border border-gray-100"
                  >
                    <div className="flex-1">
                      <select
                        value={item.flower_id}
                        onChange={(e) =>
                          updateItem(idx, "flower_id", e.target.value)
                        }
                        className="w-full p-2 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none"
                      >
                        {flowers.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", parseFloat(e.target.value))
                        }
                        required
                        className="w-full p-2 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none"
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Rate (Rs)"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(idx, "rate", parseFloat(e.target.value))
                        }
                        required
                        className="w-full p-2 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    No items added.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-green-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-green-200 text-green-700 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
