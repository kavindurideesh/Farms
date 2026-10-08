"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addDeposit(formData: FormData) {
  const supabase = await createClient();
  const buyer_id = formData.get("buyer_id") as string;
  const amountStr = formData.get("amount") as string;
  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string;

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return { error: "Valid amount is required" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("deposits").insert({
    buyer_id,
    amount,
    date,
    notes: notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/buyers/${buyer_id}`);
  return { success: true };
}

export async function deleteDeposit(id: string, buyer_id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("deposits").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/buyers/${buyer_id}`);
  return { success: true };
}
