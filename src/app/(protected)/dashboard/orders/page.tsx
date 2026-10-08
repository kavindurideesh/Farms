import { createClient } from "@/lib/supabase/server";
import OrdersClient from "./OrdersClient";
import Link from "next/link";

export default async function OrdersPage() {
  const supabase = await createClient();

  // Fetch reference data for the form dropdowns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: buyersData } = await (supabase as any).from("buyers").select("id, name").order("name");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: flowersData } = await (supabase as any).from("flowers").select("id, name, unit").order("name");

  // Fetch orders with nested buyer and items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ordersData, error } = await (supabase as any)
    .from("orders")
    .select(`
      id, buyer_id, delivery_date, status, total_amount,
      buyer:buyers(name),
      items:order_items(
        flower_id, quantity, rate,
        flower:flowers(name, unit)
      )
    `)
    .order("delivery_date", { ascending: false });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <p className="text-red-700 font-semibold text-sm">Database error loading orders</p>
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
        <p className="text-red-400 text-xs mt-3">Make sure you have run the orders SQL in Supabase.</p>
      </div>
    );
  }

  if (!buyersData?.length || !flowersData?.length) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <p className="text-amber-800 font-semibold text-sm">Missing Data</p>
        <p className="text-amber-600 text-xs mt-1">You need at least one Buyer and one Flower to create orders.</p>
        <div className="mt-4 flex gap-3 justify-center">
          <Link href="/dashboard/buyers" className="text-xs bg-amber-200 text-amber-900 px-3 py-1.5 rounded font-medium hover:bg-amber-300">Add Buyer</Link>
          <Link href="/dashboard/flowers" className="text-xs bg-amber-200 text-amber-900 px-3 py-1.5 rounded font-medium hover:bg-amber-300">Add Flower</Link>
        </div>
      </div>
    );
  }

  return (
    <OrdersClient 
      orders={ordersData || []} 
      buyers={buyersData} 
      flowers={flowersData} 
    />
  );
}
