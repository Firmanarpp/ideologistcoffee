"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { Tags, Plus, Edit, Trash2, Loader2, X, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { addCategory, updateCategory, deleteCategory } from "./actions"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("categories")
      .select("*, products(count)")
      .order("name")
    if (data) setCategories(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleOpenModal = (cat: any | null = null) => {
    setEditingCategory(cat)
    setCategoryName(cat ? cat.name : "")
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) return
    
    setIsSubmitting(true)
    let res
    if (editingCategory) {
      res = await updateCategory(editingCategory.id, categoryName)
    } else {
      res = await addCategory(categoryName)
    }

    if (res.error) {
      alert("Error: " + res.error)
      setIsSubmitting(false)
    } else {
      await fetchCategories()
      setIsModalOpen(false)
      setIsSubmitting(false)
      setCategoryName("")
      setEditingCategory(null)
    }
  }

  const handleDelete = async (id: string) => {
    const cat = categories.find(c => c.id === id)
    if (cat?.products?.[0]?.count > 0) {
      if (!confirm(`This category has ${cat.products[0].count} products. Deleting it will set them to 'Uncategorized'. Proceed?`)) return
    } else {
      if (!confirm("Are you sure you want to delete this category?")) return
    }

    const res = await deleteCategory(id)
    if (res.error) {
      alert("Error: " + res.error)
    } else {
      await fetchCategories()
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide text-[#1A1A1A]">Categories</h1>
            <p className="text-sm text-gray-500 mt-1">Organize your menu items seamlessly.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4A3022] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3A251A] shadow-lg shadow-[#4A3022]/20"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FDFBF7] text-gray-600 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium w-1/2">Category Name</th>
                <th className="px-6 py-4 font-medium w-1/4">Total Products</th>
                <th className="px-6 py-4 font-medium text-right w-1/4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#4A3022]/20" />
                  </td>
                </tr>
              ) : categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#FDFBF7] flex items-center justify-center text-[#4A3022]">
                        <Tags className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-[#1A1A1A]">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {cat.products?.[0]?.count || 0} items
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(cat)}
                        className="p-2 text-gray-400 hover:text-[#4A3022] hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#4A3022]/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[2.5rem] w-full max-w-md relative shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Category Name</label>
                <input 
                  autoFocus
                  required
                  type="text"
                  placeholder="e.g. Hot Coffee"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#4A3022] focus:ring-4 focus:ring-[#4A3022]/5 outline-none transition-all font-medium"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !categoryName.trim()}
                  className="flex-1 py-4 font-bold text-white bg-[#4A3022] rounded-2xl shadow-xl shadow-[#4A3022]/20 hover:bg-[#3A251A] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Save className="h-5 w-5" />
                      {editingCategory ? 'Update' : 'Create'}
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
