"use client"

import { RewardsStore } from "@/components/rewards-store"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function RewardsPage() {
    const router = useRouter()

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 p-2 hover:bg-gray-100">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับ
                </Button>

                <h1 className="text-3xl font-bold mb-2">ร้านรางวัล</h1>
                <p className="text-muted-foreground">ใช้คะแนนที่สะสมจากการบริจาคเพื่อแลกรางวัลพิเศษ</p>
            </div>

            <RewardsStore />
        </div>
    )
}
