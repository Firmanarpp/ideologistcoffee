"use server"

import { createClient } from "@/lib/supabase/server"
import { createDokuPayment } from "@/lib/doku"
import { revalidatePath } from "next/cache"

export async function processCheckout(data: {
  items: any[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  customerDetails: {
    name: string
    phone?: string
    orderType: string
    tableNumber?: string
    notes?: string
  }
}) {
  const supabase = await createClient()

  // 1. Get current cashier
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  const transactionCode = `TRX-${Date.now()}`

  // 2. Determine initial status
  let initialStatus = 'pending'
  if (data.paymentMethod === 'Cash' || data.paymentMethod === 'QRIS') {
    initialStatus = 'paid' // Assuming manual verification for QRIS/Cash at counter
  }

  // 3. Insert Transaction
  const { data: transaction, error: trxError } = await supabase
    .from('transactions')
    .insert({
      transaction_code: transactionCode,
      cashier_id: user.id,
      customer_name: data.customerDetails.name || "Walk-in Customer",
      customer_phone: data.customerDetails.phone,
      order_type: data.customerDetails.orderType,
      table_number: data.customerDetails.tableNumber,
      notes: data.customerDetails.notes,
      subtotal: data.subtotal,
      tax: data.tax,
      discount: 0,
      total: data.total,
      payment_method: data.paymentMethod,
      payment_status: initialStatus
    })
    .select()
    .single()

  if (trxError) return { error: trxError.message }

  // 4. Insert Items
  const itemsToInsert = data.items.map(item => ({
    transaction_id: transaction.id,
    product_id: item.productId,
    qty: item.qty,
    price: item.basePrice,
    variant: JSON.stringify(item.variant),
    addons: JSON.stringify(item.addons)
  }))

  await supabase.from('transaction_items').insert(itemsToInsert)

  // 5. Handle DOKU if requested
  if (data.paymentMethod === 'DOKU') {
    try {
      const dokuRes = await createDokuPayment({
        amount: data.total,
        invoiceNumber: transactionCode,
        paymentMethod: 'CREDIT_CARD', // generic for DOKU checkout
        customerName: 'Ideologist Coffee Guest',
        customerEmail: 'guest@ideologist.com',
        lineItems: [
          ...data.items.map(item => ({
            name: item.name,
            price: item.basePrice + (item.variant?.price_modifier || 0) + item.addons.reduce((a: any, b: any) => a + b.price, 0),
            quantity: item.qty
          })),
          ...(data.tax > 0 ? [{
            name: 'PPN 11%',
            price: Math.round(data.tax),
            quantity: 1
          }] : [])
        ]
      })

      console.log("DOKU API Response:", JSON.stringify(dokuRes, null, 2));

      if (dokuRes.response?.payment?.url) {
        await supabase.from('payments').insert({
          transaction_id: transaction.id,
          provider: 'doku',
          reference: dokuRes.response.payment.url,
          amount: data.total,
          status: 'pending',
          raw_request: JSON.stringify({ message: "Checkout Requested" }),
          raw_response: JSON.stringify(dokuRes)
        })

        return { success: true, redirectUrl: dokuRes.response.payment.url }
      } else {
        return { error: `DOKU Error: ${dokuRes.error?.message || "Internal Error"}`, details: dokuRes }
      }
    } catch (err: any) {
      console.error("DOKU Exception:", err);
      return { error: err.message }
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/admin/transactions")
  revalidatePath("/admin/orders")

  return { success: true, redirectUrl: null, transactionCode }
}

export async function lookupCustomerByPhone(phone: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('transactions')
    .select('customer_name')
    .eq('customer_phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return { error: "Not found" }
  return { name: data.customer_name }
}
