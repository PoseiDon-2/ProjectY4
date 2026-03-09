"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminRewardsManagement } from "@/components/admin-rewards-management"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Gift, Shield } from "lucide-react"

export default function AdminRewardsPage() {
    const router = useRouter()
    const { user } = useAuth()

    useEffect(() => {
        if (user && user.role !== "admin") {
            router.push("/")
        }
    }, [user, router])

    if (user && user.role !== "admin") {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/admin-dashboard")}
                                className="hover:bg-pink-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับแดชบอร์ด
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <Gift className="w-6 h-6 text-purple-500" />
                                    จัดการรางวัล
                                </h1>
                                <p className="text-sm text-gray-600">จัดการรางวัลและคะแนนสำหรับผู้ใช้งาน</p>
                            </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700">
                            <Shield className="w-3 h-3 mr-1" />
                            ผู้ดูแลระบบ
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <AdminRewardsManagement />
            </div>
        </div>
    )
}
