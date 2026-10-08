"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; success?: boolean };

export async function addFlower(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const name = (formData.get("name") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim();

  if (!name) return { error: "Flower name is required" };
  if (!unit) return { error: "Unit is required" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("flowers").insert({ name, unit });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/flowers");
  return { success: true };
}

export async function updateFlower(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim();

  if (!name) return { error: "Flower name is required" };
  if (!unit) return { error: "Unit is required" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("flowers")
    .update({ name, unit, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/flowers");
  return { success: true };
}

export async function deleteFlower(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("flowers").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/flowers");
  return { success: true };
}
