"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import AdminLayout from "@/components/admin/AdminLayout"
import { formatCurrency } from "@/lib/utils"
import { Clock, CheckCircle2, Flame, BellRing, User, Loader2 } from "lucide-react"
import { updateOrderStatus } from "./actions"

export default function OrdersQueuePage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const supabase = createClient()

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          items:transaction_items(
            qty,
            price,
            product:products(name)
          )
        `)
        .in('order_status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false }) // Newest first is better for staff

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error("Supabase link check - Current Project:", process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('order-updates')
      .on('postgres_changes', { event: '*', table: 'transactions', schema: 'public' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    console.log(`[StatusUpdate] Triggering change for ${id} to ${newStatus}`)
    setIsProcessing(id)
    try {
      const res = await updateOrderStatus(id, newStatus)
      console.log("[StatusUpdate] Response:", res)
      
      if (res.error) {
        alert("Gagal Update: " + res.error)
      } else if (res.success) {
        // Force immediate refresh
        await fetchOrders()
      }
    } catch (err) {
      console.error("[StatusUpdate] Critical Error:", err)
      alert("Terjadi kesalahan sistem.")
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide text-[#1A1A1A]">Order Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage preparation flow and notify customers.</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A3022] border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-[#4A3022]/40 uppercase tracking-widest">{order.transaction_code}</span>
                  <StatusPill status={order.order_status} />
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start animate-in slide-in-from-left-2 duration-300">
                        <p className="text-sm font-bold text-[#1A1A1A]">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-[#FDFBF7] text-[#4A3022] text-xs font-black mr-2">{item.qty}x</span>
                          {item.product?.name || 'Unknown Product'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                       <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">No items recorded</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-50 mt-auto">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(order.total)}</span>
                   </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1">
                        {order.order_status === 'pending' && (
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            disabled={isProcessing === order.id}
                            className="w-full py-3 rounded-2xl bg-[#4A3022] text-white text-xs font-black uppercase tracking-widest hover:bg-[#3d281c] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 disabled:opacity-50 active:scale-95"
                          >
                            {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
                            Start Preparing
                          </button>
                        )}
                        {order.order_status === 'preparing' && (
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            disabled={isProcessing === order.id}
                            className="w-full py-3 rounded-2xl bg-purple-600 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100 disabled:opacity-50 active:scale-95"
                          >
                            {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                            Mark as Ready
                          </button>
                        )}
                        {order.order_status === 'ready' && (
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            disabled={isProcessing === order.id}
                            className="w-full py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50 active:scale-95"
                          >
                            {isProcessing === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Complete Order
                          </button>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => {
                          if(confirm("Cancel this order?")) handleUpdateStatus(order.id, 'cancelled')
                        }}
                        disabled={isProcessing === order.id}
                        className="w-full py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        Cancel Order
                      </button>
                    </div>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="col-span-full py-24 text-center">
                 <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
                       <Clock className="h-8 w-8 text-gray-200" />
                    </div>
                 </div>
                 <h3 className="text-lg font-bold text-gray-400">No active orders</h3>
                 <p className="text-sm text-gray-400 mt-1">Staff will see new orders here as they come in.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: any = {
    pending: 'bg-gray-100 text-gray-500',
    preparing: 'bg-blue-100 text-blue-600',
    ready: 'bg-purple-100 text-purple-600'
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${config[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  )
}
