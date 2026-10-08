import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, Flower2, ShoppingCart, Package } from "lucide-react";
import Image from "next/image";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: farmerCount } = await (supabase as any).from("farmers").select("*", { count: "exact", head: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: flowerCount } = await (supabase as any).from("flowers").select("*", { count: "exact", head: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: buyerCount }  = await (supabase as any).from("buyers").select("*", { count: "exact", head: true });

  // Get upcoming orders (Pending or Processing)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upcomingOrders } = await (supabase as any)
    .from("orders")
    .select(`
      id, delivery_date, status, total_amount,
      buyer:buyers(name)
    `)
    .in("status", ["Pending", "Processing"])
    .order("delivery_date", { ascending: true })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-green-900">Dashboard</h1>
        <p className="text-sm text-green-600/60 mt-0.5">
          Welcome back, <span className="font-semibold text-green-800">{user?.email}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/farmers" className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 hover:border-green-300 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-900">{farmerCount ?? 0}</p>
          <p className="text-sm text-green-600/60 mt-1 font-medium">Farmers</p>
        </Link>

        <Link href="/dashboard/flowers" className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 hover:border-green-300 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white transition">
              <Flower2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-900">{flowerCount ?? 0}</p>
          <p className="text-sm text-green-600/60 mt-1 font-medium">Flower Types</p>
        </Link>

        <Link href="/dashboard/buyers" className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 hover:border-green-300 hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-900">{buyerCount ?? 0}</p>
          <p className="text-sm text-green-600/60 mt-1 font-medium">Buyers</p>
        </Link>
      </div>

      {/* Upcoming Orders Section */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-green-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-green-900">Upcoming Orders</h2>
          </div>
          <Link href="/dashboard/orders" className="text-xs font-semibold text-green-600 hover:text-green-800">
            View All →
          </Link>
        </div>
        
        {(!upcomingOrders || upcomingOrders.length === 0) ? (
          <div className="p-8 text-center">
            <p className="text-sm text-green-600/60">No pending or processing orders.</p>
          </div>
        ) : (
          <div className="divide-y divide-green-50">
            {upcomingOrders.map((order: any) => (
              <div key={order.id} className="p-5 flex items-center justify-between hover:bg-green-50 text-green-900/30 transition">
                <div>
                  <h3 className="font-bold text-green-900 text-sm">{order.buyer?.name}</h3>
                  <p className="text-xs text-green-600 mt-1">Delivery: {order.delivery_date}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                  <p className="font-semibold text-green-800 text-sm">Rs {Number(order.total_amount).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
