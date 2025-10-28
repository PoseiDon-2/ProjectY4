import { AdminRewardsManagement } from "@/components/admin-rewards-management"

export default function AdminRewardsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">จัดการรางวัล</h1>
                <p className="text-muted-foreground">จัดการรางวัลและคะแนนสำหรับผู้ใช้งาน</p>
            </div>

            <AdminRewardsManagement />
        </div>
    )
}
