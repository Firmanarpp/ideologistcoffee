"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateSettings(formData: any) {
  const supabase = await createClient()

  // We usually have only one settings row, but we'll fetch/upsert appropriately
  const { data: existing } = await supabase.from("settings").select("id").limit(1).single()

  let res
  if (existing) {
    res = await supabase
      .from("settings")
      .update({
        store_name: formData.store_name,
        address: formData.address,
        whatsapp: formData.whatsapp,
        tax: formData.tax,
        service_charge: formData.service_charge,
        footer_receipt: formData.footer_receipt,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .select()
  } else {
    res = await supabase
      .from("settings")
      .insert([
        {
          store_name: formData.store_name,
          address: formData.address,
          whatsapp: formData.whatsapp,
          tax: formData.tax,
          service_charge: formData.service_charge,
          footer_receipt: formData.footer_receipt,
        }
      ])
      .select()
  }

  if (res.error) {
    console.error("Error updating settings:", res.error)
    return { error: res.error.message }
  }

  revalidatePath("/settings")
  revalidatePath("/pos")
  revalidatePath("/") // For homepage if it uses settings
  return { data: res.data }
}
