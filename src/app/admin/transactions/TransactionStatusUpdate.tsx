"use client"

import { useState } from "react"
import { updateOrderStatus } from "../orders/actions"
import { Loader2, ChevronDown, Flame, BellRing, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TransactionStatusUpdate({ id, currentStatus }: { id: string, currentStatus: string }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleUpdate = async (newStatus: string) => {
    if (newStatus === currentStatus) return
    setIsUpdating(true)
    setIsOpen(false)
    const res = await updateOrderStatus(id, newStatus)
    if (res.error) alert("Error: " + res.error)
    setIsUpdating(false)
  }

  const renderActionButton = () => {
    if (isUpdating) {
      return (
        <button disabled className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-wider w-full">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating...
        </button>
      )
    }

    switch (currentStatus.toLowerCase()) {
      case 'pending':
        return (
          <button 
            onClick={() => handleUpdate('preparing')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4A3022] text-white text-[9px] font-black uppercase tracking-wider hover:bg-[#3d281c] transition-all w-full shadow-sm"
          >
            <Flame className="h-3 w-3" />
            Start Preparing
          </button>
        )
      case 'preparing':
        return (
          <button 
            onClick={() => handleUpdate('ready')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider hover:bg-purple-700 transition-all w-full shadow-sm"
          >
            <BellRing className="h-3 w-3" />
            Mark as Ready
          </button>
        )
      case 'ready':
        return (
          <button 
            onClick={() => handleUpdate('completed')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all w-full shadow-sm"
          >
            <CheckCircle2 className="h-3 w-3" />
            Complete Order
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex-1">
        {renderActionButton()}
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUpdating}
          className="p-1.5 rounded-lg bg-white border border-gray-100 hover:bg-gray-50 text-gray-400 transition-colors disabled:opacity-50"
        >
          <ChevronDown className="h-3 w-3" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-20 w-32 rounded-xl bg-white shadow-2xl border border-gray-100 p-1 animate-in fade-in zoom-in duration-200">
              <p className="px-3 py-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Actions</p>
              <button
                onClick={() => {
                  if(confirm("Cancel this order?")) handleUpdate('cancelled')
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <XCircle className="h-3 w-3" />
                Cancel Order
              </button>
              <button
                onClick={() => handleUpdate('pending')}
                className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors text-gray-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Status
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RotateCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}
