import { getDashboardStats } from "./data"
import { formatCurrency } from "@/lib/utils"
import RevenueChart from "@/components/admin/RevenueChart"

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-wide text-[#1A1A1A]">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back. Here is what&apos;s happening today.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Revenue (Today)" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={DollarSign} 
          trend="Real-time sales"
          trendUp={true}
        />
        <MetricCard 
          title="Transactions" 
          value={stats.trxCount.toString()} 
          icon={Receipt} 
          trend="Total orders today"
          trendUp={true}
        />
        <MetricCard 
          title="Best Seller" 
          value={stats.bestSeller} 
          icon={Coffee} 
          trend="Top performance"
        />
        <MetricCard 
          title="Low Stock" 
          value={`${stats.lowStock.length} Items`} 
          icon={AlertTriangle} 
          trend={stats.lowStock.map(p => p.name).join(", ") || "No warnings"}
          trendUp={stats.lowStock.length === 0}
          alert={stats.lowStock.length > 0}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-[#1A1A1A]">Revenue Overview</h2>
            <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">Last 7 Days</div>
          </div>
          <RevenueChart data={stats.chartData} />
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-[#1A1A1A]">Recent Orders</h2>
            <Link href="/admin/transactions" className="text-sm text-[#4A3022] hover:underline font-medium">View All</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {stats.recentTrx.map((trx) => (
              <div key={trx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${trx.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {trx.payment_method === 'Cash' ? <DollarSign className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{trx.transaction_code}</p>
                    <p className="text-xs text-gray-500">{trx.payment_method} • {new Date(trx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-sm font-medium text-[#1A1A1A]">{formatCurrency(trx.total)}</p>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase transition-colors ${
                      trx.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {trx.payment_status}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      trx.order_status === 'completed' ? 'bg-gray-100 text-gray-500' :
                      trx.order_status === 'ready' ? 'bg-purple-100 text-purple-600' :
                      trx.order_status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                      'bg-orange-100 text-orange-600 border border-orange-200'
                    }`}>
                      {trx.order_status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {stats.recentTrx.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-gray-400 py-12">
                <Receipt className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No orders today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  alert 
}: { 
  title: string, 
  value: string, 
  icon: any, 
  trend?: string, 
  trendUp?: boolean,
  alert?: boolean
}) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm border ${alert ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${alert ? 'bg-orange-100 text-orange-600' : 'bg-[#FDFBF7] text-[#4A3022]'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">{value}</h3>
        {trend && (
          <p className={`mt-1 flex items-center text-sm ${
            alert ? 'text-orange-600 font-semibold' : 
            trendUp === true ? 'text-emerald-600' : 
            trendUp === false ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {trendUp === true && <TrendingUp className="mr-1 h-3 w-3" />}
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}

import { DollarSign, Receipt, Coffee, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
