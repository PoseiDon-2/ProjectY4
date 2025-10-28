import { DonationStatusDashboard } from "@/components/donation-status-dashboard"

export default function StatusTrackingPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">ติดตามสถานะการบริจาค</h1>
                <p className="text-gray-600 mt-2">ติดตามและจัดการสถานะการบริจาคทั้งหมด</p>
            </div>

            <DonationStatusDashboard />
        </div>
    )
}
