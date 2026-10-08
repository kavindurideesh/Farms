import { createClient } from "@/lib/supabase/server";
import BuyersClient, { type Buyer } from "./BuyersClient";

export default async function BuyersPage() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("buyers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <p className="text-red-700 font-semibold text-sm">Database error</p>
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
        <p className="text-red-400 text-xs mt-3">
          Make sure you have run the buyers SQL in Supabase.
        </p>
      </div>
    );
  }

  return <BuyersClient initialBuyers={(data as Buyer[]) ?? []} />;
}
