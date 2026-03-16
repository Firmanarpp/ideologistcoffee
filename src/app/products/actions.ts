"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addProduct(formData: any) {
  const supabase = await createClient()
  
  const { data: products, error: productError } = await supabase
    .from("products")
    .insert([
      {
        name: formData.name,
        sku: formData.sku,
        category_id: formData.category_id,
        price: formData.price,
        stock: formData.stock,
        image: formData.image,
        description: formData.description,
        is_available: formData.is_available,
      }
    ])
    .select()

  if (productError) {
    console.error("Error adding product:", productError)
    return { error: productError.message }
  }

  const product = products?.[0]
  if (!product) {
    return { error: "Failed to create product record." }
  }

  // Insert Variants
  if (formData.variants?.length > 0) {
    const variants = formData.variants.map((v: any) => ({
      product_id: product.id,
      name: v.name,
      price_modifier: v.price_modifier || 0
    }))
    const { error: variantError } = await supabase.from("product_variants").insert(variants)
    if (variantError) {
      console.error("Error adding variants:", variantError)
      return { error: "Product added but variants failed: " + variantError.message }
    }
  }

  // Insert Addons
  if (formData.addons?.length > 0) {
    const addons = formData.addons.map((a: any) => ({
      product_id: product.id,
      name: a.name,
      price: a.price || 0
    }))
    const { error: addonError } = await supabase.from("product_addons").insert(addons)
    if (addonError) {
      console.error("Error adding addons:", addonError)
      return { error: "Product added but addons failed: " + addonError.message }
    }
  }

  revalidatePath("/products")
  revalidatePath("/pos")
  revalidatePath("/dashboard")
  return { success: true, data: product }
}

export async function updateProduct(id: string, formData: any) {
  const supabase = await createClient()

  // DEBUG: Check user session and role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase.from("users").select("role").eq("id", user.id).single() : { data: null }

  // 1. Update Product
  const { data: products, error: productError } = await supabase
    .from("products")
    .update({
      name: formData.name,
      sku: formData.sku,
      category_id: formData.category_id,
      price: formData.price,
      stock: formData.stock,
      image: formData.image,
      description: formData.description,
      is_available: formData.is_available,
    })
    .eq("id", id)
    .select()

  if (productError) {
    console.error("Error updating product:", productError)
    return { error: productError.message }
  }

  const product = products?.[0]
  if (!product) {
    const debugInfo = `User: ${user?.email || 'No Session'}, Role: ${profile?.role || 'No Profile'}, UID: ${user?.id || 'N/A'}`
    return { error: `Product not found or update denied. [DEBUG: ${debugInfo}]` }
  }

  // 2. Sync Variants (Delete & Re-insert)
  const { error: deleteVarError } = await supabase.from("product_variants").delete().eq("product_id", id)
  if (deleteVarError) {
    console.error("Error deleting old variants:", deleteVarError)
    return { error: "Failed to sync variants: " + deleteVarError.message }
  }

  if (formData.variants?.length > 0) {
    const variants = formData.variants.map((v: any) => ({
      product_id: id,
      name: v.name,
      price_modifier: v.price_modifier || 0
    }))
    const { error: insertVarError } = await supabase.from("product_variants").insert(variants)
    if (insertVarError) {
      console.error("Error inserting new variants:", insertVarError)
      return { error: "Product updated but variants failed: " + insertVarError.message }
    }
  }

  // 3. Sync Addons (Delete & Re-insert)
  const { error: deleteAddonError } = await supabase.from("product_addons").delete().eq("product_id", id)
  if (deleteAddonError) {
    console.error("Error deleting old addons:", deleteAddonError)
    return { error: "Failed to sync addons: " + deleteAddonError.message }
  }

  if (formData.addons?.length > 0) {
    const addons = formData.addons.map((a: any) => ({
      product_id: id,
      name: a.name,
      price: a.price || 0
    }))
    const { error: insertAddonError } = await supabase.from("product_addons").insert(addons)
    if (insertAddonError) {
      console.error("Error inserting new addons:", insertAddonError)
      return { error: "Product updated but addons failed: " + insertAddonError.message }
    }
  }

  revalidatePath("/products")
  revalidatePath("/pos")
  revalidatePath("/dashboard")
  
  return { success: true, data: product }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting product:", error)
    return { error: error.message }
  }

  revalidatePath("/products")
  revalidatePath("/pos")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function uploadProductImage(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File
  if (!file) return { error: "No file provided" }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file)

  if (error) {
    console.error("Error uploading image:", error)
    return { error: error.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return { success: true, url: publicUrl }
}
