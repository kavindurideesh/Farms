"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; success?: boolean };

export async function addFarmer(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const latStr = (formData.get("latitude") as string)?.trim();
  const lngStr = (formData.get("longitude") as string)?.trim();

  if (!name) return { error: "Name is required" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("farmers").insert({
    name,
    phone,
    address,
    latitude: latStr ? parseFloat(latStr) : null,
    longitude: lngStr ? parseFloat(lngStr) : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/farmers");
  return { success: true };
}

export async function updateFarmer(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const latStr = (formData.get("latitude") as string)?.trim();
  const lngStr = (formData.get("longitude") as string)?.trim();

  if (!name) return { error: "Name is required" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("farmers")
    .update({
      name,
      phone,
      address,
      latitude: latStr ? parseFloat(latStr) : null,
      longitude: lngStr ? parseFloat(lngStr) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/farmers");
  return { success: true };
}

export async function deleteFarmer(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("farmers").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/farmers");
  return { success: true };
}
