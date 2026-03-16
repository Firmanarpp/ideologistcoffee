import { verifyDokuSignature } from "@/lib/doku"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

function mapDokuStatus(rawStatus: string) {
  const status = rawStatus.toUpperCase()

  if (["SUCCESS", "PAID", "SETTLEMENT"].includes(status)) return "paid"
  if (["FAILED", "FAILURE"].includes(status)) return "failed"
  if (["EXPIRED", "CANCELLED", "VOID", "TIMEOUT"].includes(status)) return "expired"

  return "pending"
}

export async function POST(request: Request) {
  // We need raw body for signature verification
  const rawBody = await request.text()
  
  const isValid = verifyDokuSignature(request.headers, rawBody)
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    const payload = JSON.parse(rawBody)
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing Supabase service role configuration" }, { status: 500 })
    }

    // Use service role for callback updates because DOKU calls this endpoint without user auth.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // DOKU Notification Payload typically looks like:
    // { order: { invoice_number: 'TRX-1234', amount: 50000 }, transaction: { status: 'SUCCESS' } }
    
    const invoiceNumber = payload.order?.invoice_number
    const status = payload.transaction?.status || payload.order?.status || payload.status

    if (!invoiceNumber || !status) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 })
    }

    const localStatus = mapDokuStatus(String(status))

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
      .eq('reference', invoiceNumber)

    return NextResponse.json({ message: "OK" })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
