"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; success?: boolean };

export async function addBuyer(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const name    = (formData.get("name")    as string)?.trim();
  const phone   = (formData.get("phone")   as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  if (!name) return { error: "Name is required" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("buyers").insert({ name, phone, address });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/buyers");
  return { success: true };
}

export async function updateBuyer(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id      = formData.get("id") as string;
  const name    = (formData.get("name")    as string)?.trim();
  const phone   = (formData.get("phone")   as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  if (!name) return { error: "Name is required" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("buyers")
    .update({ name, phone, address, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/buyers");
  return { success: true };
}

export async function deleteBuyer(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("buyers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/buyers");
  return { success: true };
}
