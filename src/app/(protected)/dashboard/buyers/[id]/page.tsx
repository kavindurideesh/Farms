import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LedgerClient from "./LedgerClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function BuyerLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id: buyerId } = await params;

  // 1. Get Buyer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: buyer, error: buyerErr } = await (supabase as any).from("buyers").select("*").eq("id", buyerId).single();
  if (buyerErr || !buyer) return notFound();

  // 2. Get Orders (Debit) - Assuming non-Cancelled orders count towards balance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (supabase as any)
    .from("orders")
    .select(`
      id, delivery_date, total_amount, status,
      items:order_items(
        quantity, rate,
        flower:flowers(name, unit)
      )
    `)
    .eq("buyer_id", buyerId)
    .neq("status", "Cancelled")
    .order("delivery_date", { ascending: true });

  // 3. Get Deposits (Credit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deposits } = await (supabase as any)
    .from("deposits")
    .select("*")
    .eq("buyer_id", buyerId)
    .order("date", { ascending: true });

  // 4. Combine into Ledger Array
  const ledger = [];
  let totalOrders = 0;
  let totalDeposits = 0;

  for (const o of (orders || [])) {
    const amount = Number(o.total_amount);
    totalOrders += amount;
    const items = o.items || [];

    if (items.length === 0) {
      ledger.push({
        id: o.id,
        type: "Order" as const,
        date: o.delivery_date,
        amount,
        description: `Order #${o.id.substring(0, 6).toUpperCase()} (${o.status})`,
        flowerType: null,
        unit: null,
        unitPrice: null,
        quantity: null,
        is_debit: true,
      });
      continue;
    }

    items.forEach((item: {
      quantity: number;
      rate: number;
      flower: { name: string; unit: string } | null;
    }, index: number) => {
      const unitPrice = Number(item.rate);
      const quantity = Number(item.quantity);
      ledger.push({
        id: `${o.id}-${index}`,
        type: "Order" as const,
        date: o.delivery_date,
        amount: unitPrice * quantity,
        description: `Order #${o.id.substring(0, 6).toUpperCase()} (${o.status})`,
        flowerType: item.flower?.name || "Unknown flower",
        unit: item.flower?.unit || null,
        unitPrice,
        quantity,
        is_debit: true,
      });
    });
  }

  for (const d of (deposits || [])) {
    const amount = Number(d.amount);
    totalDeposits += amount;
    ledger.push({
      id: d.id,
      type: "Deposit" as const,
      date: d.date,
      amount: amount,
      description: d.notes || "Payment Received",
      flowerType: d.notes || "Payment Received",
      unit: null,
      unitPrice: null,
      quantity: null,
      is_debit: false,
    });
  }

  // Sort chronologically (oldest first)
  ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const balance = totalOrders - totalDeposits;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/buyers" className="p-2 rounded-xl border border-green-200 bg-white text-green-600 hover:bg-green-50 text-green-900 transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-green-900">{buyer.name}&apos;s Ledger</h1>
          <p className="text-sm text-green-600/60 mt-0.5">View transaction history and balance</p>
        </div>
      </div>

      <LedgerClient 
        buyerId={buyerId}
        buyerName={buyer.name}
        statementDate={new Date().toISOString().slice(0, 10)}
        ledger={ledger}
        totalOrders={totalOrders}
        totalDeposits={totalDeposits}
        balance={balance}
      />
    </div>
  );
}
