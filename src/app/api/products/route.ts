import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  // Fetch available products with related data
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (name),
      product_variants (*),
      product_addons (*)
    `)
    .eq("is_available", true)
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(products || [])
}
