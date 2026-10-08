import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogOut, LayoutDashboard, Users, Flower2, ShoppingCart, Package } from "lucide-react";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#f0faf3]">
      {/* Header */}
      <header className="border-b border-green-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-green-100 bg-white flex items-center justify-center shadow-sm shrink-0">
                <Image
                  src="/logo.png"
                  alt="Kamali's Flowers"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-green-900 tracking-tight text-sm">
                Kamali&apos;s Flowers
              </span>
            </div>

            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 text-green-900 transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/farmers"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 text-green-900 transition"
              >
                <Users className="w-4 h-4" />
                Farmers
              </Link>
              <Link
                href="/dashboard/flowers"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 text-green-900 transition"
              >
                <Flower2 className="w-4 h-4" />
                Flowers
              </Link>
              <Link
                href="/dashboard/buyers"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 text-green-900 transition"
              >
                <ShoppingCart className="w-4 h-4" />
                Buyers
              </Link>
              <Link
                href="/dashboard/orders"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 text-green-900 transition"
              >
                <Package className="w-4 h-4" />
                Orders
              </Link>
            </nav>
          </div>

          {/* User + Sign out */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-green-600/50 hidden sm:block">{user?.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm text-green-700 hover:text-red-600 transition font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
