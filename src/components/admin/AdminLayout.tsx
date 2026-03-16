"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Coffee, 
  LayoutDashboard, 
  Package, 
  Tags, 
  Settings, 
  LogOut, 
  Menu,
  CreditCard,
  FileText,
  Boxes,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "POS / Kasir", href: "/pos", icon: Coffee },
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Orders", href: "/admin/orders", icon: Clock },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFBF7]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-[#4A3022] text-[#FDFBF7] shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:flex lg:flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-[#FDFBF7]/10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDFBF7] text-[#4A3022]">
              <Coffee className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-wider">IDEOLOGIST</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive 
                    ? "bg-[#FDFBF7] text-[#4A3022]" 
                    : "text-[#FDFBF7]/70 hover:bg-[#FDFBF7]/10 hover:text-[#FDFBF7]"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[#FDFBF7]/10 p-4">
          <form action="/api/auth/logout" method="POST">
             {/* Using a standard Next.js route or server action for logout to keep layout purely client side or server sidable */}
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#FDFBF7]/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topheader mobile */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4A3022] text-white">
            <Coffee className="h-5 w-5" />
          </div>
          
          <div className="w-6" /> {/* Placeholder for right side to center logo */}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
