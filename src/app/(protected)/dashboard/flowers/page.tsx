import { createClient } from "@/lib/supabase/server";
import FlowersClient, { type Flower } from "./FlowersClient";

export default async function FlowersPage() {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("flowers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <p className="text-red-700 font-semibold text-sm">Database error</p>
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
        <p className="text-red-400 text-xs mt-3">
          Make sure you have run the flowers SQL in Supabase.
        </p>
      </div>
    );
  }

  return <FlowersClient initialFlowers={(data as Flower[]) ?? []} />;
}
