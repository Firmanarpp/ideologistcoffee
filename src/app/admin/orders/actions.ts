"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateOrderStatus(id: string, newStatus: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .update({ order_status: newStatus })
    .eq('id', id)
    .select()

  if (error) {
    console.error("Error updating order status:", error)
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No rows updated. Check RLS policies.")
    return { error: "Permission denied or order not found." }
  }

  revalidatePath("/admin/orders")
  revalidatePath("/admin/transactions")
  revalidatePath("/dashboard")
  
  return { success: true, data }
}
