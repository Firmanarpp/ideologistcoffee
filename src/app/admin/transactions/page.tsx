"use client"

import AdminLayout from "@/components/admin/AdminLayout"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, cn } from "@/lib/utils"
import { Calendar, CreditCard, User, Clock, ChevronRight, X, Package, Receipt, MapPin, Phone, Info } from "lucide-react"
import { useState, useEffect } from "react"
import TransactionStatusUpdate from "./TransactionStatusUpdate"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)

  const fetchTransactions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("transactions")
      .select(`
        *,
        cashier:users!transactions_cashier_id_fkey(email),
        items:transaction_items(
          *,
          product:products(name, image, sku)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)
    
    if (data) setTransactions(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return (
    <AdminLayout>
       <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide text-[#1A1A1A]">Transaction History</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage all store sales.</p>
          </div>
          <button className="rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filter Date
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FDFBF7] border-b border-gray-100">
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500">Invoice & Date</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500">Customer & Cashier</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500">Payment</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Total</th>
                  <th className="px-6 py-5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A3022] border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : transactions?.map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#4A3022] transition-colors">{trx.transaction_code}</span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {new Date(trx.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {trx.customer_name}
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5 ml-5">via {(trx.cashier as any)?.email || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gray-100 text-gray-600">
                          <CreditCard className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">{trx.payment_method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col gap-2">
                          <div className="flex flex-col gap-1">
                            <StatusBadge type="payment" status={trx.payment_status} />
                            <StatusBadge type="order" status={trx.order_status} />
                          </div>
                          <TransactionStatusUpdate id={trx.id} currentStatus={trx.order_status} />
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-[#1A1A1A]">
                      {formatCurrency(trx.total)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => setSelectedTransaction(trx)}
                        className="p-2 rounded-lg text-gray-400 hover:text-[#4A3022] hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {!isLoading && !transactions?.length && (
            <div className="py-24 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
                   <CreditCard className="h-8 w-8 text-gray-200" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-400">No transactions recorded</h3>
              <p className="text-sm text-gray-400 mt-1">Start making sales in the POS to see data here.</p>
            </div>
          )}
        </div>
      </div>

      {selectedTransaction && (
        <TransactionDetailModal 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
        />
      )}
    </AdminLayout>
  )
}

function StatusBadge({ type, status }: { type: 'payment' | 'order', status: string }) {
  const configs: Record<string, { label: string, color: string }> = {
    // Unified Statuses
    paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    pending: { label: 'Pending', color: 'bg-orange-50 text-orange-700 border-orange-100' },
    failed: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-100' },
    preparing: { label: 'Preparing', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    ready: { label: 'Ready for Pickup', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-100' },
  }

  const config = configs[status.toLowerCase()] || { label: status, color: 'bg-gray-50 text-gray-500 border-gray-100' }

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider", config.color)}>
      {type === 'order' && <span className="mr-1 opacity-50">Order:</span>}
      {config.label}
    </span>
  )
}

function TransactionDetailModal({ transaction, onClose }: { transaction: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 bg-[#FDFBF7] border-b border-[#e2d6c8] relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-white border border-[#e2d6c8] rounded-2xl flex items-center justify-center text-[#4A3022] shadow-sm">
              <Receipt className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight uppercase">{transaction.transaction_code}</h2>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {new Date(transaction.created_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth hide-scrollbar">
          {/* Customer & Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Customer Details</h3>
              <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Name</p>
                    <p className="text-sm font-black text-[#1A1A1A]">{transaction.customer_name || 'Walk-in Customer'}</p>
                  </div>
                </div>
                {transaction.customer_phone && (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-black text-[#1A1A1A]">{transaction.customer_phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Order Type</h3>
              <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type / Table</p>
                    <p className="text-sm font-black text-[#1A1A1A]">
                      {transaction.order_type} {transaction.table_number ? `- Table ${transaction.table_number}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Method</p>
                    <p className="text-sm font-black text-[#1A1A1A] uppercase">{transaction.payment_method}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Order Items ({transaction.items?.length || 0})</h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transaction.items?.map((item: any) => (
                    <tr key={item.id} className="group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                            {item.product?.image ? (
                              <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-300">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1A1A1A]">{item.product?.name || 'Unknown Product'}</p>
                            <p className="text-[10px] text-gray-400 font-medium">SKU: {item.product?.sku || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-600">
                        {item.qty}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-[#1A1A1A]">
                        {formatCurrency(item.qty * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Internal Notes</h3>
              <div className="bg-orange-50/30 rounded-3xl p-6 border border-orange-100/50 flex gap-4">
                <Info className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-sm text-[#4A3022] font-medium italic leading-relaxed">
                  "{transaction.notes}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="p-8 bg-[#FDFBF7] border-t border-[#e2d6c8] shrink-0">
          <div className="max-w-xs ml-auto space-y-3">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-[#1A1A1A]">{formatCurrency(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Tax (11%)</span>
              <span className="text-[#1A1A1A]">{formatCurrency(transaction.tax)}</span>
            </div>
            <div className="h-px w-full bg-[#e2d6c8] my-2" />
            <div className="flex justify-between items-center text-xl font-black text-[#1A1A1A] tracking-tighter">
              <span className="text-sm uppercase tracking-widest text-[#4A3022]">Grand Total</span>
              <span className="text-2xl">{formatCurrency(transaction.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
