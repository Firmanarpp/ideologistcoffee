import AdminLayout from "@/components/admin/AdminLayout"
import ReportCard from "./ReportCard"

export default function ReportsPage() {
  const reportTypes = ['Daily Sales', 'Weekly Sales', 'Monthly Sales', 'Top Products', 'Payment Methods']

  return (
    <AdminLayout>
       <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide text-[#1A1A1A]">Reports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Export your sales and inventory data in CSV format.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map(report => (
                <ReportCard key={report} title={report} />
            ))}
        </div>
      </div>
    </AdminLayout>
  )
}
