"use client"

import { RewardsStore } from "@/components/rewards-store"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Gift } from "lucide-react"
import { useRouter } from "next/navigation"

export default function RewardsPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="hover:bg-pink-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับ
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Gift className="w-6 h-6 text-purple-500" />
                                ร้านรางวัล
                            </h1>
                            <p className="text-sm text-gray-600">ใช้คะแนนที่สะสมจากการบริจาคเพื่อแลกรางวัลพิเศษ</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <RewardsStore />
            </div>
        </div>
    )
}
