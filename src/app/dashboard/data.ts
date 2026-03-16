import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Today's Revenue
  const { data: todayTrx } = await supabase
    .from('transactions')
    .select('total')
    .eq('payment_status', 'paid')
    .gte('created_at', today.toISOString())

  const totalRevenue = todayTrx?.reduce((sum, trx) => sum + Number(trx.total), 0) || 0

  // 2. Transaction Count
  const { count: trxCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // 3. Low Stock Items
  const { data: lowStock } = await supabase
    .from('products')
    .select('name')
    .lte('stock', 10)
    .gt('stock', 0)

  // 4. Recent Transactions
  const { data: recentTrx } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // 5. Chart Data (Last 7 Days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)
  
  const { data: weekData } = await supabase
    .from('transactions')
    .select('total, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', sevenDaysAgo.toISOString())

  // Group by day
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dayTotal = weekData
      ?.filter(t => new Date(t.created_at).toDateString() === d.toDateString())
      .reduce((sum, t) => sum + Number(t.total), 0) || 0
    
    chartData.push({ name: dayName, total: dayTotal })
  }

  // 6. Best Seller
  const { data: topSales } = await supabase
    .from('transaction_items')
    .select('qty, products(name)')
    
  let bestSeller = "No data"
  if (topSales && topSales.length > 0) {
    const counts = topSales.reduce((acc: any, item: any) => {
      const name = item.products?.name || 'Unknown'
      acc[name] = (acc[name] || 0) + item.qty
      return acc
    }, {})
    bestSeller = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0][0]
  }

  return {
    totalRevenue,
    trxCount: trxCount || 0,
    lowStock: lowStock || [],
    recentTrx: recentTrx || [],
    bestSeller,
    chartData
  }
}
