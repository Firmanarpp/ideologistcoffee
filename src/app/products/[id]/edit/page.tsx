"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import AdminLayout from "@/components/admin/AdminLayout"
import { ChevronLeft, Save, Loader2, Package, Upload, X, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { updateProduct, uploadProductImage } from "../../actions"
import { createClient } from "@/lib/supabase/client"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category_id: "",
    price: 0,
    stock: 0,
    image: "",
    description: "",
    is_available: true,
    variants: [] as any[],
    addons: [] as any[],
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      // Fetch categories
      const { data: cats } = await supabase.from("categories").select("*").order("name")
      if (cats) setCategories(cats)
      
      // Fetch product with variants and addons
      const { data: product, error } = await supabase
        .from("products")
        .select(`
          *,
          variants:product_variants(*),
          addons:product_addons(*)
        `)
        .eq("id", id)
        .single()
        
      if (error || !product) {
        alert("Product not found")
        router.push("/products")
        return
      }
      
      setFormData({
        name: product.name,
        sku: product.sku || "",
        category_id: product.category_id || "",
        price: Number(product.price),
        stock: product.stock,
        image: product.image || "",
        description: product.description || "",
        is_available: product.is_available,
        variants: product.variants || [],
        addons: product.addons || [],
      })
      
      setIsLoading(false)
    }
    fetchData()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    const res = await updateProduct(id, formData)
    
    if (res.error) {
      alert("Error: " + res.error)
      setIsSaving(false)
    } else {
      router.push("/products")
    }
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/products" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-wide text-[#1A1A1A]">Edit Product</h1>
              <p className="text-sm text-gray-500 mt-1">Modify the details of your item.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Product Name</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Arabica Signature Blend"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-[#4A3022] focus:ring-4 focus:ring-[#4A3022]/5 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">SKU (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. COF-001"
                    value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-[#4A3022] focus:ring-4 focus:ring-[#4A3022]/5 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
                  <select 
                    required
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-[#4A3022] focus:ring-4 focus:ring-[#4A3022]/5 outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Description</label>
                <textarea 
                  rows={4}
                  placeholder="Tell us about this product..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-[#4A3022] focus:ring-4 focus:ring-[#4A3022]/5 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
               <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-4">Pricing & Inventory</h3>
               <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Price (Rp)</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-[#4A3022] focus:ring-4 focus:ring-[#4A3022]/5 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Initial Stock</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    placeholder="10"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-[#4A3022] focus:ring-4 focus:ring-[#4A3022]/5 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Options / Variants */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h3 className="font-bold text-gray-900">Product Options (Variants)</h3>
                <button 
                  type="button"
                  onClick={() => setFormData({
                    ...formData, 
                    variants: [...(formData.variants || []), { name: "", price_modifier: 0 }]
                  })}
                  className="text-xs font-bold text-[#4A3022] hover:text-[#3A251A] flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#4A3022]/10 hover:bg-[#4A3022]/5 transition-all"
                >
                  <Plus className="h-3 w-3" />
                  Add Option
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.variants?.map((variant: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 animate-in slide-in-from-left-2 duration-300">
                    <div className="flex-1">
                      <input 
                        placeholder="Option Name (e.g. Hot, Iced)"
                        value={variant.name}
                        onChange={e => {
                          const newVariants = [...formData.variants]
                          newVariants[idx].name = e.target.value
                          setFormData({...formData, variants: newVariants})
                        }}
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:border-[#4A3022] outline-none transition-all"
                      />
                    </div>
                    <div className="w-32">
                      <input 
                        type="number"
                        placeholder="+ Price"
                        value={variant.price_modifier}
                        onChange={e => {
                          const newVariants = [...formData.variants]
                          newVariants[idx].price_modifier = parseFloat(e.target.value) || 0
                          setFormData({...formData, variants: newVariants})
                        }}
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:border-[#4A3022] outline-none transition-all"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const newVariants = formData.variants.filter((_: any, i: number) => i !== idx)
                        setFormData({...formData, variants: newVariants})
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {!formData.variants?.length && (
                  <p className="text-center py-4 text-xs text-gray-400 italic">No options added yet. (e.g. Hot/Iced)</p>
                )}
              </div>
            </div>

            {/* Add-ons */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h3 className="font-bold text-gray-900">Product Add-ons</h3>
                <button 
                  type="button"
                  onClick={() => setFormData({
                    ...formData, 
                    addons: [...(formData.addons || []), { name: "", price: 0 }]
                  })}
                  className="text-xs font-bold text-[#4A3022] hover:text-[#3A251A] flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#4A3022]/10 hover:bg-[#4A3022]/5 transition-all"
                >
                  <Plus className="h-3 w-3" />
                  Add Add-on
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.addons?.map((addon: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 animate-in slide-in-from-left-2 duration-300">
                    <div className="flex-1">
                      <input 
                        placeholder="Add-on Name (e.g. Extra Shot, Oat Milk)"
                        value={addon.name}
                        onChange={e => {
                          const newAddons = [...formData.addons]
                          newAddons[idx].name = e.target.value
                          setFormData({...formData, addons: newAddons})
                        }}
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:border-[#4A3022] outline-none transition-all"
                      />
                    </div>
                    <div className="w-32">
                      <input 
                        type="number"
                        placeholder="Price"
                        value={addon.price}
                        onChange={e => {
                          const newAddons = [...formData.addons]
                          newAddons[idx].price = parseFloat(e.target.value) || 0
                          setFormData({...formData, addons: newAddons})
                        }}
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:border-[#4A3022] outline-none transition-all"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const newAddons = formData.addons.filter((_: any, i: number) => i !== idx)
                        setFormData({...formData, addons: newAddons})
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {!formData.addons?.length && (
                  <p className="text-center py-4 text-xs text-gray-400 italic">No add-ons added yet. (e.g. Extra Shot)</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-4">Product Image</h3>
              <div className="aspect-square w-full rounded-2xl bg-[#FDFBF7] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 text-center group relative overflow-hidden transition-all hover:border-[#4A3022]/30">
                {formData.image ? (
                  <>
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, image: ""})}
                      className="absolute top-2 right-2 p-1.5 bg-white shadow-md rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Package className="h-10 w-10 text-gray-300 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs text-gray-500 font-medium">Upload or enter URL below</p>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <input 
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    setIsUploading(true)
                    const uploadData = new FormData()
                    uploadData.append('file', file)
                    
                    const res = await uploadProductImage(uploadData)
                    if (res.error) {
                      alert("Upload failed: " + res.error)
                    } else if (res.url) {
                      setFormData({...formData, image: res.url})
                    }
                    setIsUploading(false)
                  }}
                />
                <button 
                  type="button"
                  disabled={isUploading}
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-full py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                  )}
                  {isUploading ? "Uploading..." : "Upload from Device"}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                    <span className="bg-white px-2 text-gray-300">or</span>
                  </div>
                </div>

                <input 
                  type="text"
                  placeholder="Paste Image URL (Public link)"
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-gray-200 focus:border-[#4A3022] outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
               <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-4">Status</h3>
               <div className="flex items-center justify-between">
                 <span className="text-sm font-medium text-gray-700">Available</span>
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, is_available: !formData.is_available})}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    formData.is_available ? "bg-[#4A3022]" : "bg-gray-200"
                  )}
                 >
                   <span className={cn(
                     "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                     formData.is_available ? "translate-x-6" : "translate-x-1"
                   )} />
                 </button>
               </div>
            </div>

            <button 
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4A3022] px-6 py-4 font-bold text-white transition-all hover:bg-[#3A251A] shadow-xl shadow-[#4A3022]/20 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Update Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
