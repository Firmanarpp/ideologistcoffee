"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addCategory(name: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .insert([{ name }])
    .select()

  if (error) return { error: error.message }
  
  revalidatePath("/categories")
  revalidatePath("/pos")
  revalidatePath("/products")
  return { data }
}

export async function updateCategory(id: string, name: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)
    .select()

  if (error) return { error: error.message }
  
  revalidatePath("/categories")
  revalidatePath("/pos")
  revalidatePath("/products")
  return { data }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  
  revalidatePath("/categories")
  revalidatePath("/pos")
  revalidatePath("/products")
  revalidatePath("/dashboard")
  return { success: true }
}
