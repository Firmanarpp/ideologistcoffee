import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'

const CLIENT_ID = process.env.DOKU_CLIENT_ID || ''
const SECRET_KEY = process.env.DOKU_SECRET_KEY || ''
const BASE_URL = process.env.DOKU_BASE_URL_SANDBOX || 'https://api-sandbox.doku.com'

export async function createDokuPayment(transactionInfo: {
  amount: number,
  invoiceNumber: string,
  paymentMethod: 'VIRTUAL_ACCOUNT_BCA' | 'CREDIT_CARD' | 'QRIS',
  customerName: string,
  customerEmail: string,
  callbackUrl?: string,
  lineItems?: { name: string, price: number, quantity: number }[]
}) {
  const reqId = uuidv4()
  const timestamp = new Date().toISOString().split('.')[0] + 'Z' // DOKU preferred format

  // Minimal payload example for a generic DOKU checkout page
  const payload = {
    order: {
      amount: transactionInfo.amount,
      invoice_number: transactionInfo.invoiceNumber,
      currency: "IDR",
      callback_url: transactionInfo.callbackUrl || "http://localhost:3000/pos", // fallback
      line_items: transactionInfo.lineItems || []
    },
    payment: {
      payment_due_date: 60 // minutes
    },
    customer: {
      name: transactionInfo.customerName,
      email: transactionInfo.customerEmail,
      phone: "6281234567890" // placeholder for mandatory field
    }
  }

  const targetPath = '/checkout/v1/payment'
  const bodyString = JSON.stringify(payload)

  // DOKU Signature generation
  const digest = crypto.createHash('sha256').update(bodyString).digest('base64')

  const componentFormatToSign =
    `Client-Id:${CLIENT_ID}\n` +
    `Request-Id:${reqId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${targetPath}\n` +
    `Digest:${digest}`

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(componentFormatToSign)
    .digest('base64')

  const headers = {
    'Client-Id': CLIENT_ID,
    'Request-Id': reqId,
    'Request-Timestamp': timestamp,
    'Signature': `HMACSHA256=${signature}`,
    'Content-Type': 'application/json'
  }

  const response = await fetch(`${BASE_URL}${targetPath}`, {
    method: 'POST',
    headers,
    body: bodyString
  })

  return await response.json()
}

export function verifyDokuSignature(headers: Headers, rawBody: string) {
  const clientId = headers.get('client-id')
  const reqId = headers.get('request-id')
  const timestamp = headers.get('request-timestamp')
  const signature = headers.get('signature')?.replace('HMACSHA256=', '')
  const targetPath = headers.get('request-target') || '/api/payment/doku-callback' // fallback

  if (!clientId || !reqId || !timestamp || !signature) {
    return false
  }

  const digest = crypto.createHash('sha256').update(rawBody).digest('base64')

  const componentFormatToSign =
    `Client-Id:${clientId}\n` +
    `Request-Id:${reqId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${targetPath}\n` +
    `Digest:${digest}`

  const calculatedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(componentFormatToSign)
    .digest('base64')

  return calculatedSignature === signature
}
