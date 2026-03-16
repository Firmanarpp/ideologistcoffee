"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ReportCard({ title }: { title: string }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    const supabase = createClient()
    
    let csvContent = ""
    let fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_report.csv`

    try {
      if (title.includes('Sales')) {
        // Simple logic for sales reports
        const { data } = await supabase
          .from("transactions")
          .select("transaction_code, customer_name, total, payment_method, created_at")
          .eq("payment_status", "paid")
          .order("created_at", { ascending: false })

        if (data && data.length > 0) {
          const headers = Object.keys(data[0]).join(",")
          const rows = data.map(row => Object.values(row).join(","))
          csvContent = [headers, ...rows].join("\n")
        }
      } else if (title === 'Top Products') {
        const { data } = await supabase
          .from("transaction_items")
          .select("product_id, qty, products(name)")
          
        if (data) {
          // Aggregate by product
          const aggregated = data.reduce((acc: any, item: any) => {
            const name = item.products?.name || 'Unknown'
            acc[name] = (acc[name] || 0) + item.qty
            return acc
          }, {})
          
          csvContent = "Product Name,Total Quantity Sold\n" + 
            Object.entries(aggregated).map(([name, qty]) => `${name},${qty}`).join("\n")
        }
      } else {
        // Default: just a mockup if not specific
        csvContent = "Date,Description,Amount\n2026-03-17,Placeholder Data,0"
      }

      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert("No data found for this report.")
      }
    } catch (err) {
      console.error(err)
      alert("Error exporting report.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 flex flex-col justify-between h-52 group hover:border-[#4A3022]/30 transition-all hover:shadow-xl hover:shadow-[#4A3022]/5">
      <div>
        <div className="h-10 w-10 rounded-xl bg-[#FDFBF7] flex items-center justify-center text-[#4A3022] mb-4 group-hover:scale-110 transition-transform">
          <Download className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-lg text-[#1A1A1A]">{title} Report</h3>
        <p className="text-xs text-gray-500 mt-1">Exported as standard CSV format</p>
      </div>
      <button 
        onClick={handleExport}
        disabled={isExporting}
        className="flex justify-center items-center gap-2 w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-[#4A3022] hover:text-white transition-all border border-gray-200 hover:border-transparent active:scale-95 disabled:opacity-50"
      >
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isExporting ? 'Exporting...' : 'Download CSV'}
      </button>
    </div>
  )
}
