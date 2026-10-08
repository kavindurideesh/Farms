"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type OrderItemPayload = {
  flower_id: string;
  quantity: number;
  rate: number;
};

export type OrderPayload = {
  id?: string;
  buyer_id: string;
  delivery_date: string;
  status: string;
  items: OrderItemPayload[];
};

export async function saveOrder(payload: OrderPayload) {
  const supabase = await createClient();
  
  // Calculate total
  const total_amount = payload.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

  let orderId = payload.id;

  if (orderId) {
    // Update existing order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("orders")
      .update({
        buyer_id: payload.buyer_id,
        delivery_date: payload.delivery_date,
        status: payload.status,
        total_amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
      
    if (error) return { error: error.message };

    // Delete old items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("order_items").delete().eq("order_id", orderId);
  } else {
    // Insert new order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("orders")
      .insert({
        buyer_id: payload.buyer_id,
        delivery_date: payload.delivery_date,
        status: payload.status,
        total_amount,
      })
      .select("id")
      .single();
      
    if (error) return { error: error.message };
    orderId = data.id;
  }

  // Insert new items
  if (payload.items.length > 0) {
    const itemsToInsert = payload.items.map(item => ({
      order_id: orderId,
      flower_id: item.flower_id,
      quantity: item.quantity,
      rate: item.rate,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: itemsError } = await (supabase as any).from("order_items").insert(itemsToInsert);
    if (itemsError) return { error: itemsError.message };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
    
  if (error) return { error: error.message };
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteOrder(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("orders").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  return { success: true };
}
