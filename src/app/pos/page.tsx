"use client"

import { useState, useEffect, useRef } from "react"
import { useCartStore } from "@/store/cart"
import { Search, Coffee, Tags, Plus, Minus, Trash2, ChevronRight, LogOut, CheckCircle2, User, Phone, MapPin, ClipboardList, Eraser, RotateCcw } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { processCheckout, lookupCustomerByPhone } from "./actions"
import AdminLayout from "@/components/admin/AdminLayout"

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  
  // Checkout Processing
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<any>(null)
  const [showConfirmModal, setShowConfirmModal] = useState<{show: boolean, method: string | null}>({ show: false, method: null })

  // Customer Information
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderType, setOrderType] = useState('Dine In') // Dine In, Take Away, Delivery
  const [tableNumber, setTableNumber] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)

  const cart = useCartStore()

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        
        if (Array.isArray(data)) {
          setProducts(data)
          
          // Extract unique categories
          const cats = new Set<string>()
          data.forEach((p: any) => {
            if (p.categories?.name) {
              cats.add(p.categories.name)
            }
          })
          setCategories(['All', ...Array.from(cats)])
        } else {
          console.error("API returned non-array data:", data)
          setProducts([])
        }
      } catch (err) {
        console.error("Failed to load products", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.categories?.name === activeCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const taxRate = 0.11 // 11% PPN
  const subtotal = cart.getSubtotal()
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount

  // Phone lookup logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (customerPhone.length >= 10) {
        setIsSearchingCustomer(true)
        try {
          const result = await lookupCustomerByPhone(customerPhone)
          if (result.name && !customerName) {
            setCustomerName(result.name)
          }
        } catch (err) {
          console.debug("Customer phone not found in history")
        } finally {
          setIsSearchingCustomer(false)
        }
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [customerPhone])

  const handleNewOrder = () => {
    cart.clearCart()
    setCustomerName('')
    setCustomerPhone('')
    setOrderType('Dine In')
    setTableNumber('')
    setOrderNotes('')
    setCheckoutSuccess(false)
  }

  const handleCheckout = async (method: string) => {
    if (cart.items.length === 0) return

    if (method === 'Cash' && !showConfirmModal.show) {
      setShowConfirmModal({ show: true, method })
      return
    }

    setShowConfirmModal({ show: false, method: null })
    setIsCheckingOut(true)

    try {
      const result = await processCheckout({
        items: cart.items,
        subtotal,
        tax: taxAmount,
        total,
        paymentMethod: method,
        customerDetails: {
          name: customerName || "Walk-in Customer",
          phone: customerPhone,
          orderType,
          tableNumber: orderType === 'Dine In' ? tableNumber : '',
          notes: orderNotes
        }
      })

      if (result.error) {
        alert(result.error)
        return
      }

      if (result.redirectUrl) {
        // Redirect to DOKU Checkout URL
        window.location.href = result.redirectUrl
        return
      }

      // If no redirect, just success
      setLastTransaction({
        transactionCode: result.transactionCode || `TRX-${Date.now()}`,
        customerDetails: {
          name: customerName || "Walk-in Customer",
          phone: customerPhone,
          orderType,
          tableNumber: orderType === 'Dine In' ? tableNumber : '',
          notes: orderNotes
        },
        items: [...cart.items],
        subtotal,
        tax: taxAmount,
        total,
        paymentMethod: method
      })
      
      setIsCheckingOut(false)
      setCheckoutSuccess(true)
      cart.clearCart()
      // We'll keep the customer info for the receipt, then reset on "New Order"
      setTimeout(() => setCheckoutSuccess(false), 3000)
    } catch (err) {
      console.error("Checkout failed", err)
      alert("Checkout failed. Please try again.")
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-64px)] overflow-hidden lg:pr-[400px]">

        {/* Categories Bar */}
        <div className="bg-[#FDFBF7] px-6 py-4 flex gap-3 overflow-x-auto shrink-0 border-b border-[#e2d6c8] hide-scrollbar z-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
                activeCategory === cat 
                  ? "bg-[#4A3022] text-white border-[#4A3022] shadow-md shadow-[#4A3022]/10" 
                  : "bg-white text-gray-600 border-[#e2d6c8] hover:border-[#4A3022] hover:text-[#4A3022]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A3022] border-t-transparent"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
               <Coffee className="h-16 w-16 mb-4 opacity-50" />
               <p className="text-xl font-medium text-gray-600">No products found</p>
               <p className="text-sm mt-2 focus:text-gray-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-24 lg:pb-0">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  disabled={product.stock <= 0}
                  className={cn(
                    "group relative bg-white rounded-[2rem] transition-all duration-500 flex flex-col h-full overflow-hidden border border-transparent self-stretch",
                    product.stock > 0 
                      ? "hover:shadow-[0_20px_50px_rgba(74,48,34,0.12)] hover:-translate-y-2 cursor-pointer" 
                      : "opacity-60 cursor-not-allowed grayscale-[50%]"
                  )}
                >
                  {/* Image Container with Full-bleed look */}
                  <div className="aspect-[4/5] w-full relative overflow-hidden bg-[#fbf9f6]">
                    {product.image ? (
                       <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                       />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center bg-[#f4ece3]">
                        <Coffee className="h-12 w-12 text-[#4A3022]/20" />
                       </div>
                    )}
                    
                    {/* Hover Overlay Icon */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-500 text-[#4A3022]">
                        <Plus className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Inventory Badge Container */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 scale-90 group-hover:scale-100 transition-transform duration-500">
                      {product.stock <= 10 && product.stock > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold text-orange-700 shadow-sm border border-orange-100">
                           <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                           ONLY {product.stock}
                        </div>
                      )}
                      {product.stock <= 0 && (
                        <div className="px-3 py-1.5 rounded-full bg-gray-900/90 backdrop-blur-md text-[10px] font-bold text-white shadow-sm">
                           OUT OF STOCK
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-5 flex flex-col flex-1">
                    <h4 className="text-[15px] font-bold text-[#1A1A1A] group-hover:text-[#4A3022] transition-colors duration-300 leading-tight">
                      {product.name}
                    </h4>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Price</span>
                        <span className="text-base font-black text-[#4A3022]">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                      <div className="h-8 w-8 rounded-full border border-[#e2d6c8] flex items-center justify-center text-[#e2d6c8] group-hover:bg-[#4A3022] group-hover:border-[#4A3022] group-hover:text-white transition-all duration-500">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* FIXED CART BAR (Right Side) */}
      <aside className="fixed inset-y-0 right-0 z-40 w-full lg:w-[400px] bg-white border-l border-[#e2d6c8] shadow-2xl flex flex-col transition-transform duration-300 transform lg:translate-x-0 translate-x-full">
        <div className="p-6 border-b border-[#e2d6c8] bg-[#FDFBF7] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-wide text-[#1A1A1A]">Current Order</h2>
            <p className="text-sm text-gray-500 mt-1">{cart.items.length} Items</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => cart.clearCart()}
              title="Clear Cart"
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Eraser className="h-5 w-5" />
            </button>
            <button 
              onClick={handleNewOrder}
              title="New Order"
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Customer Information Section */}
        <div className="p-4 border-b border-[#e2d6c8] bg-white space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>Customer Info</span>
            </div>
            {isSearchingCustomer && (
              <div className="flex items-center gap-1 text-[#4A3022] normal-case animate-pulse">
                <Search className="h-3 w-3 animate-spin" />
                <span>Checking phone...</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input 
                type="text"
                placeholder="WhatsApp"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#4A3022] focus:border-[#4A3022] outline-none transition-all"
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input 
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#4A3022] focus:border-[#4A3022] outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select 
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#4A3022] focus:border-[#4A3022] outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Dine In">Dine In</option>
              <option value="Take Away">Take Away</option>
              <option value="Delivery">Delivery</option>
            </select>
            
            {orderType === 'Dine In' && (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Table No"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#4A3022] focus:border-[#4A3022] outline-none transition-all animate-in fade-in zoom-in-95 duration-200"
                />
              </div>
            )}
          </div>

          <div className="relative">
            <ClipboardList className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <textarea 
              placeholder="Order notes for kitchen..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={1}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#4A3022] focus:border-[#4A3022] outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdfaf5]">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
               <Tags className="h-12 w-12 mb-4" />
               <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.cartItemId} className="bg-white p-4 rounded-2xl border border-[#e2d6c8] shadow-sm relative group animate-in slide-in-from-right-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-4">
                    <h4 className="font-semibold text-sm text-[#1A1A1A]">{item.name}</h4>
                    {item.variant && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.variant.name} (+Rp {item.variant.price_modifier.toLocaleString()})</p>
                    )}
                    {item.addons.map(addon => (
                      <p key={addon.id} className="text-xs text-gray-500 mt-0.5">+ {addon.name} (+Rp {addon.price.toLocaleString()})</p>
                    ))}
                    {item.note && (
                       <p className="text-[10px] text-orange-600 mt-1 italic bg-orange-50 px-2 py-0.5 rounded">Note: {item.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#4A3022] text-sm">
                      Rp {((item.basePrice + (item.variant?.price_modifier || 0) + item.addons.reduce((a, b) => a + b.price, 0)) * item.qty).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 bg-[#FDFBF7] rounded-xl border border-[#e2d6c8] p-1">
                    <button 
                      onClick={() => item.qty > 1 ? cart.updateQty(item.cartItemId, item.qty - 1) : cart.removeItem(item.cartItemId)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-[#4A3022] hover:shadow-sm transition-all text-gray-500"
                    >
                      {item.qty > 1 ? <Minus className="h-4 w-4" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-[#1A1A1A]">{item.qty}</span>
                    <button 
                      onClick={() => cart.updateQty(item.cartItemId, item.qty + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-[#4A3022] hover:shadow-sm transition-all text-gray-500"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="bg-white border-t border-[#e2d6c8] p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-gray-500 font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 font-medium">
              <span>Tax (11%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="h-px w-full bg-[#e2d6c8] my-2" />
            <div className="flex justify-between text-xl font-bold tracking-tight text-[#1A1A1A]">
              <span>Total</span>
              <span className="text-[#4A3022]">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button 
              onClick={() => handleCheckout('Cash')}
              disabled={cart.items.length === 0 || isCheckingOut || checkoutSuccess}
              className="w-full py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#FDFBF7] text-[#4A3022] border border-[#e2d6c8] hover:border-[#4A3022] hover:bg-[#f4ece3]"
            >
              Cash Payment
            </button>
            <button 
              onClick={() => handleCheckout('QRIS')}
              disabled={cart.items.length === 0 || isCheckingOut || checkoutSuccess}
              className="w-full py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#FDFBF7] text-[#4A3022] border border-[#e2d6c8] hover:border-[#4A3022] hover:bg-[#f4ece3]"
            >
              QRIS
            </button>
          </div>
          
          <button 
            onClick={() => handleCheckout('DOKU')}
            disabled={cart.items.length === 0 || isCheckingOut || checkoutSuccess}
            className="w-full py-4 rounded-xl bg-[#4A3022] text-white font-bold transition-all shadow-lg shadow-[#4A3022]/30 hover:bg-[#3A251A] hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isCheckingOut ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : checkoutSuccess ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
                Done!
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                Pay with DOKU (Gateway)
                <ChevronRight className="h-5 w-5 opacity-70" />
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Modal Sukses / Receipt */}
      {checkoutSuccess && lastTransaction && (
        <ReceiptModal 
          transaction={lastTransaction} 
          onClose={handleNewOrder} 
        />
      )}

      {/* Product Customization Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          cart={cart}
        />
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal.show && (
        <ConfirmationModal 
          onConfirm={() => handleCheckout(showConfirmModal.method!)}
          onClose={() => setShowConfirmModal({ show: false, method: null })}
          title="Konfirmasi Pembayaran"
          message="Pastikan Anda sudah menerima uang tunai dari customer sebelum memproses pesanan ini."
        />
      )}
    </AdminLayout>
  )
}

function ProductModal({ product, onClose, cart }: { product: any, onClose: () => void, cart: any }) {
  const [qty, setQty] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<any | null>(
    product.product_variants?.length ? product.product_variants[0] : null
  )
  const [selectedAddons, setSelectedAddons] = useState<any[]>([])
  const [note, setNote] = useState('')

  const handleAdd = () => {
    cart.addItem({
      cartItemId: (Date.now() + Math.random()).toString(),
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      qty,
      variant: selectedVariant,
      addons: selectedAddons,
      note
    })
    onClose()
  }

  const toggleAddon = (addon: any) => {
    if (selectedAddons.find(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id))
    } else {
      setSelectedAddons([...selectedAddons, addon])
    }
  }

  const currentPrice = product.price + (selectedVariant?.price_modifier || 0) + selectedAddons.reduce((sum, a) => sum + a.price, 0)
  const totalPrice = currentPrice * qty

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Images */}
        <div className="h-40 bg-[#4A3022] relative shrink-0">
           {/* If product had image, it would be here */}
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
           <div className="absolute inset-x-6 bottom-6 text-white text-shadow-sm">
              <h2 className="text-2xl font-bold tracking-wide">{product.name}</h2>
              <p className="opacity-90 font-medium mt-1">{formatCurrency(product.price)}</p>
           </div>
           <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex justify-center items-center transition-colors">
             ✕
           </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8 hide-scrollbar">
          
          {/* Variants */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div>
              <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-3">Options</h3>
              <div className="grid grid-cols-2 gap-3">
                {product.product_variants.map((variant: any) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={cn(
                      "px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left flex justify-between",
                      selectedVariant?.id === variant.id 
                        ? "border-[#4A3022] bg-[#FDFBF7] text-[#4A3022] shadow-sm shadow-[#4A3022]/10" 
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <span>{variant.name}</span>
                    {variant.price_modifier > 0 && <span className="opacity-60">+{formatCurrency(variant.price_modifier)}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {product.product_addons && product.product_addons.length > 0 && (
            <div>
              <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-3">Add-ons</h3>
              <div className="space-y-2">
                {product.product_addons.map((addon: any) => {
                  const isSelected = selectedAddons.some(a => a.id === addon.id)
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between",
                        isSelected 
                          ? "border-[#4A3022] bg-[#FDFBF7] text-[#4A3022]" 
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("h-5 w-5 rounded border flex items-center justify-center transition-colors", isSelected ? "bg-[#4A3022] border-[#4A3022] text-white" : "border-gray-300")}>
                          {isSelected && <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="opacity-60">+{formatCurrency(addon.price)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-3">Notes</h3>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. Less ice, extra hot..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm focus:border-[#4A3022] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4A3022] transition-colors resize-none"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-3 text-center">Quantity</h3>
            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-14 h-14 rounded-2xl bg-[#FDFBF7] border border-[#e2d6c8] flex items-center justify-center text-[#4A3022] hover:bg-white transition-all shadow-sm active:scale-95"
              >
                <Minus className="h-6 w-6" />
              </button>
              <span className="text-3xl font-bold w-12 text-center text-[#1A1A1A]">{qty}</span>
              <button 
                onClick={() => setQty(qty + 1)}
                 className="w-14 h-14 rounded-2xl bg-[#FDFBF7] border border-[#e2d6c8] flex items-center justify-center text-[#4A3022] hover:bg-white transition-all shadow-sm active:scale-95"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
           <button 
             onClick={handleAdd}
             className="w-full h-14 rounded-xl bg-[#4A3022] text-white font-bold tracking-wide flex items-center justify-between px-6 transition-transform hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-[#4A3022]/20"
           >
             <span>Add to Order</span>
             <span>{formatCurrency(totalPrice)}</span>
           </button>
        </div>
      </div>
    </div>
  )
}

function ReceiptModal({ transaction, onClose }: { transaction: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center bg-[#FDFBF7] border-b border-[#e2d6c8] relative">
          <div className="absolute top-4 right-4 text-[#4A3022] hover:bg-gray-100 rounded-lg p-1 cursor-pointer" onClick={onClose}>
            ✕
          </div>
          <div className="h-16 w-16 bg-[#FDFBF7] border-2 border-[#4A3022] border-dashed rounded-full flex items-center justify-center mx-auto mb-4 text-[#4A3022]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Payment Success!</h2>
          <p className="text-sm text-gray-500 mt-1">{transaction.transactionCode}</p>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Customer Area */}
          <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
               <span className="font-bold text-gray-400 uppercase">Customer</span>
               <span className="font-bold text-[#1A1A1A]">{transaction.customerDetails.name}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-gray-500">Order Type</span>
               <span className="font-medium text-[#4A3022]">{transaction.customerDetails.orderType}</span>
            </div>
            {transaction.customerDetails.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-[#1A1A1A]">{transaction.customerDetails.phone}</span>
              </div>
            )}
            {transaction.customerDetails.tableNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Table</span>
                <span className="font-medium text-[#1A1A1A]">{transaction.customerDetails.tableNumber}</span>
              </div>
            )}
            {transaction.customerDetails.notes && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 block mb-1">Kitchen Notes:</span>
                <span className="italic text-[#1A1A1A]">{transaction.customerDetails.notes}</span>
              </div>
            )}
          </div>

          {/* Items Summary */}
          <div className="space-y-2">
            {transaction.items.map((item: any) => (
              <div key={item.cartItemId} className="flex justify-between text-xs">
                <span>{item.qty}x {item.name}</span>
                <span className="font-medium">{formatCurrency((item.basePrice + (item.variant?.price_modifier || 0) + item.addons.reduce((a: any, b: any) => a + b.price, 0)) * item.qty)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between text-xs">
               <span className="text-gray-500">Subtotal</span>
               <span>{formatCurrency(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
               <span className="text-gray-500">Tax (11%)</span>
               <span>{formatCurrency(transaction.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 text-[#4A3022]">
               <span>Total</span>
               <span>{formatCurrency(transaction.total)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button 
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-[#4A3022] text-white font-bold tracking-wide shadow-lg shadow-[#4A3022]/20 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            New Order
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmationModal({ onConfirm, onClose, title, message }: { onConfirm: () => void, onClose: () => void, title: string, message: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center bg-[#FDFBF7] border-b border-[#e2d6c8]">
           <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="h-14 w-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <CheckCircle2 className="h-8 w-8" />
              </div>
           </div>
           <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">{title}</h2>
           <p className="text-sm text-gray-500 mt-3 leading-relaxed px-4">
             {message}
           </p>
        </div>

        <div className="p-8 flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className="w-full h-14 rounded-2xl bg-[#4A3022] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#4A3022]/20 hover:bg-[#3A251A] hover:-translate-y-0.5 transition-all active:scale-95"
          >
            Proses Pesanan
          </button>
          <button 
            onClick={onClose}
            className="w-full h-14 rounded-2xl bg-white text-gray-400 font-bold hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  )
}
