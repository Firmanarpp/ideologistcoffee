import { createClient } from "@/lib/supabase/server"
import AdminLayout from "@/components/admin/AdminLayout"
import { Package, Plus, Search, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import DeleteProductButton from "./DeleteProductButton"

export const revalidate = 0 // always fresh for admin dashboard

export default async function ProductsPage() {
  const supabase = await createClient()

  // Fetch products with their categories
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (name)
    `)
    .order("created_at", { ascending: false })

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide text-[#1A1A1A]">Products</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your coffee shop items and inventory.</p>
          </div>
          <Link href="/products/new">
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#4A3022] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3A251A] shadow-lg shadow-[#4A3022]/20">
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </Link>
        </div>

        {/* Filters Box */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#4A3022] focus:ring-1 focus:ring-[#4A3022] focus:outline-none transition-colors bg-gray-50/50 hover:bg-white"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FDFBF7] text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products?.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          {product.image ? (
                             <img src={product.image} alt={product.name} className="h-full w-full object-cover rounded-lg" />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A] group-hover:text-[#4A3022] transition-colors">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                        {product.categories?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#1A1A1A]">
                      Rp {product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
                        <span className="font-medium">{product.stock}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.is_available 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {product.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/products/${product.id}/edit`}>
                          <button className="p-2 text-gray-400 hover:text-[#4A3022] hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                        </Link>
                        <DeleteProductButton id={product.id} />
                      </div>
                    </td>
                  </tr>
                ))}

                {products?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                       <div className="flex flex-col items-center justify-center text-gray-400">
                          <Package className="h-12 w-12 mb-4 text-gray-300" />
                          <p className="text-lg font-medium text-gray-900 mb-1">No products found</p>
                          <p className="text-sm">Get started by creating a new product.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
