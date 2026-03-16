import { verifyDokuSignature } from "@/lib/doku"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // We need raw body for signature verification
  const rawBody = await request.text()
  
  const isValid = verifyDokuSignature(request.headers, rawBody)
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    const payload = JSON.parse(rawBody)
    const supabase = await createClient()

    // DOKU Notification Payload typically looks like:
    // { order: { invoice_number: 'TRX-1234', amount: 50000 }, transaction: { status: 'SUCCESS' } }
    
    const invoiceNumber = payload.order?.invoice_number
    const status = payload.transaction?.status

    if (!invoiceNumber || !status) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 })
    }

    let localStatus = 'pending'
    if (status === 'SUCCESS' || status === 'PAID') localStatus = 'paid'
    if (status === 'FAILED') localStatus = 'failed'
    if (status === 'EXPIRED') localStatus = 'expired'

    // Update transactions table
    const { error: trxError } = await supabase
      .from('transactions')
      .update({ payment_status: localStatus })
      .eq('transaction_code', invoiceNumber)

    if (trxError) throw trxError

    // Also update payments table if it exists
    await supabase
      .from('payments')
      .update({ 
        status: localStatus, 
        updated_at: new Date().toISOString()
      })
      .eq('reference', invoiceNumber) // adjust correlation if using a different field

    return NextResponse.json({ message: "OK" })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
