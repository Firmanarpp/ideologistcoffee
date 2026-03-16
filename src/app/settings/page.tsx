"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Save, Store, MapPin, Phone, Receipt, Percent, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { updateSettings } from "./actions"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    store_name: "Ideologist",
    whatsapp: "",
    address: "",
    tax: 11,
    service_charge: 5,
    footer_receipt: ""
  })

  useEffect(() => {
    async function fetchSettings() {
      const supabase = createClient()
      const { data } = await supabase.from("settings").select("*").limit(1).single()
      if (data) {
        setFormData({
          store_name: data.store_name,
          whatsapp: data.whatsapp || "",
          address: data.address || "",
          tax: Number(data.tax),
          service_charge: Number(data.service_charge),
          footer_receipt: data.footer_receipt || ""
        })
      }
      setIsLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    
    const res = await updateSettings(formData)
    if (res.error) {
      alert("Error saving settings: " + res.error)
    } else {
      alert("Settings saved successfully!")
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#4A3022]" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide text-[#1A1A1A]">Store Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your shop details, taxes, and receipt configurations.</p>
          </div>
          <button 
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4A3022] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#3A251A] shadow-lg shadow-[#4A3022]/20 disabled:opacity-50 disabled:transform-none hover:-translate-y-0.5"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8 space-y-8">
          
          {/* General Information */}
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#FDFBF7] flex items-center justify-center">
                <Store className="h-4 w-4 text-[#4A3022]" />
              </div>
              General Information
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Store Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.store_name}
                  onChange={e => setFormData({...formData, store_name: e.target.value})}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-3 text-sm focus:border-[#4A3022] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4A3022]/5 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.whatsapp}
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    placeholder="+62..."
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 pl-11 pr-5 py-3 text-sm focus:border-[#4A3022] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4A3022]/5 transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Store Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                  <textarea 
                    rows={3}
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter full address..."
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 pl-11 pr-5 py-3 text-sm focus:border-[#4A3022] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4A3022]/5 transition-all font-medium resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Financials & Taxes */}
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#FDFBF7] flex items-center justify-center">
                <Percent className="h-4 w-4 text-[#4A3022]" />
              </div>
              Financials & Taxes
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Tax Rate (PPN %)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.tax}
                  onChange={e => setFormData({...formData, tax: parseFloat(e.target.value)})}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-3 text-sm focus:border-[#4A3022] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4A3022]/5 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Service Charge (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.service_charge}
                  onChange={e => setFormData({...formData, service_charge: parseFloat(e.target.value)})}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-3 text-sm focus:border-[#4A3022] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4A3022]/5 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Receipt Customization */}
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#FDFBF7] flex items-center justify-center">
                <Receipt className="h-4 w-4 text-[#4A3022]" />
              </div>
              Receipt Customization
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Footer Message</label>
              <textarea 
                rows={2}
                value={formData.footer_receipt}
                onChange={e => setFormData({...formData, footer_receipt: e.target.value})}
                placeholder="Thank you for your visit!"
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm focus:border-[#4A3022] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4A3022]/5 transition-all font-medium resize-none"
              />
              <p className="text-xs text-gray-500 ml-1">This message will appear at the bottom of printed thermal receipts.</p>
            </div>
          </div>

        </div>
      </form>
    </AdminLayout>
  )
}
