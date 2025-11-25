"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Coins, Crown, Palette, Award, Gift, Sparkles } from "lucide-react"
import type { Reward, UserPoints } from "@/types/rewards"
import { pointsSystem } from "@/lib/points-system"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

const MOCK_REWARDS: Reward[] = [
    // Profile Themes
    {
        id: "theme_gold",
        name: "ธีมทอง",
        description: "เปลี่ยนธีมโปรไฟล์เป็นสีทองหรูหรา",
        category: "profile",
        pointsCost: 500,
        image: "https://via.placeholder.com/400x300?text=No+Image",
        isActive: true,
        isLimited: false,
        createdBy: "system",
        createdAt: "2024-01-01",
    },
    {
        id: "theme_platinum",
        name: "ธีมแพลทินัม",
        description: "ธีมสีเงินแพลทินัมสุดพรีเมียม",
        category: "profile",
        pointsCost: 1000,
        image: "https://via.placeholder.com/400x300?text=No+Image",
        isActive: true,
        isLimited: false,
        createdBy: "system",
        createdAt: "2024-01-01",
    },
    {
        id: "theme_diamond",
        name: "ธีมเพชร",
        description: "ธีมเพชรสุดหรู สำหรับผู้บริจาคระดับตำนาน",
        category: "profile",
        pointsCost: 2500,
        image: "https://via.placeholder.com/400x300?text=No+Image",
        isActive: true,
        isLimited: true,
        limitQuantity: 100,
        remainingQuantity: 87,
        createdBy: "system",
        createdAt: "2024-01-01",
        requirements: { minLevel: 5 },
    },
    // Profile Badges
    {
        id: "badge_heart",
        name: "ตราหัวใจทอง",
        description: "ตราสัญลักษณ์หัวใจทองคำ",
        category: "badge",
        pointsCost: 300,
        image: "https://via.placeholder.com/400x300?text=No+Image",
        isActive: true,
        isLimited: false,
        createdBy: "system",
        createdAt: "2024-01-01",
    },
    {
        id: "badge_crown",
        name: "มงกุฎแห่งความดี",
        description: "มงกุฎสำหรับผู้บริจาคชั้นสูง",
        category: "badge",
        pointsCost: 800,
        image: "/golden-crown-badge.png",
        isActive: true,
        isLimited: false,
        createdBy: "system",
        createdAt: "2024-01-01",
        requirements: { minLevel: 3 },
    },
    // Profile Frames
    {
        id: "frame_rainbow",
        name: "กรอบสีรุ้ง",
        description: "กรอบโปรไฟล์สีรุ้งสวยงาม",
        category: "profile",
        pointsCost: 400,
        image: "https://via.placeholder.com/400x300?text=No+Image",
        isActive: true,
        isLimited: false,
        createdBy: "system",
        createdAt: "2024-01-01",
    },
    {
        id: "frame_fire",
        name: "กรอบเปลวไฟ",
        description: "กรอบเปลวไฟสำหรับผู้บริจาคที่ร้อนแรง",
        category: "profile",
        pointsCost: 600,
        image: "https://via.placeholder.com/400x300?text=No+Image",
        isActive: true,
        isLimited: false,
        createdBy: "system",
        createdAt: "2024-01-01",
    },
    // Special Features
    {
        id: "feature_priority",
        name: "การแสดงผลพิเศษ",
        description: "คำขอบริจาคของคุณจะแสดงในลำดับต้นๆ",
        category: "feature",
        pointsCost: 1500,
        image: "https://via.placeholder.com/400x300?text=No+Image",
        isActive: true,
        isLimited: false,
        createdBy: "system",
        createdAt: "2024-01-01",
        requirements: { minLevel: 4 },
    },
]

export function RewardsStore() {
    const { user } = useAuth()
    const [userPoints, setUserPoints] = useState<UserPoints | null>(null)
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string>("all")

    useEffect(() => {
        if (user) {
            pointsSystem.loadFromStorage()
            setUserPoints(pointsSystem.getUserPoints(user.id))
        }
    }, [user])

    const filteredRewards = MOCK_REWARDS.filter((reward) => {
        if (activeCategory === "all") return true
        return reward.category === activeCategory
    })

    const canPurchase = (reward: Reward): boolean => {
        if (!userPoints) return false
        if (userPoints.availablePoints < reward.pointsCost) return false
        if (reward.requirements?.minLevel && userPoints.level < reward.requirements.minLevel) return false
        if (reward.isLimited && reward.remainingQuantity === 0) return false
        return true
    }

    const handlePurchase = (reward: Reward) => {
        setSelectedReward(reward)
        setShowConfirmDialog(true)
    }

    const confirmPurchase = () => {
        if (!selectedReward || !user || !userPoints) return

        const success = pointsSystem.spendPoints(
            user.id,
            selectedReward.pointsCost,
            "reward_purchase",
            `ซื้อ ${selectedReward.name}`,
            selectedReward.id,
        )

        if (success) {
            setUserPoints(pointsSystem.getUserPoints(user.id))
            toast({
                title: "ซื้อรางวัลสำเร็จ!",
                description: `คุณได้รับ ${selectedReward.name} แล้ว`,
            })
        } else {
            toast({
                title: "ซื้อรางวัลไม่สำเร็จ",
                description: "คะแนนไม่เพียงพอ",
                variant: "destructive",
            })
        }

        setShowConfirmDialog(false)
        setSelectedReward(null)
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "profile":
                return <Palette className="h-4 w-4" />
            case "badge":
                return <Award className="h-4 w-4" />
            case "feature":
                return <Sparkles className="h-4 w-4" />
            default:
                return <Gift className="h-4 w-4" />
        }
    }

    if (!user || !userPoints) {
        return <div>กรุณาเข้าสู่ระบบเพื่อดูร้านรางวัล</div>
    }

    return (
        <div className="space-y-6">
            {/* Points Display */}
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <Coins className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">คะแนนที่ใช้ได้</p>
                                <p className="text-3xl font-bold text-yellow-700">{userPoints.availablePoints.toLocaleString()}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="px-4 py-2 text-lg">
                            <Crown className="h-5 w-5 mr-2" />
                            {userPoints.levelName}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        ทั้งหมด
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        ธีม
                    </TabsTrigger>
                    <TabsTrigger value="badge" className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        ตรา
                    </TabsTrigger>
                    <TabsTrigger value="feature" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        ฟีเจอร์
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeCategory} className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRewards.map((reward) => (
                            <Card key={reward.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-square relative">
                                    <img
                                        src={reward.image || "https://via.placeholder.com/400x300?text=No+Image"}
                                        alt={reward.name}
                                        className="w-full h-full object-cover"
                                    />
                                    {reward.isLimited && (
                                        <Badge className="absolute top-2 right-2 bg-red-500">
                                            จำกัด {reward.remainingQuantity}/{reward.limitQuantity}
                                        </Badge>
                                    )}
                                </div>

                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                                        {getCategoryIcon(reward.category)}
                                    </div>
                                    <CardDescription>{reward.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Coins className="h-4 w-4 text-yellow-500" />
                                            <span className="font-semibold">{reward.pointsCost.toLocaleString()}</span>
                                        </div>
                                        {reward.requirements?.minLevel && (
                                            <Badge variant="outline" className="text-xs">
                                                ระดับ {reward.requirements.minLevel}+
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        onClick={() => handlePurchase(reward)}
                                        disabled={!canPurchase(reward)}
                                        variant={canPurchase(reward) ? "default" : "secondary"}
                                    >
                                        {!canPurchase(reward)
                                            ? userPoints.availablePoints < reward.pointsCost
                                                ? "คะแนนไม่พอ"
                                                : reward.requirements?.minLevel && userPoints.level < reward.requirements.minLevel
                                                    ? "ระดับไม่พอ"
                                                    : reward.isLimited && reward.remainingQuantity === 0
                                                        ? "หมดแล้ว"
                                                        : "ไม่สามารถซื้อได้"
                                            : "ซื้อรางวัล"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ยืนยันการซื้อรางวัล</DialogTitle>
                        <DialogDescription>
                            คุณต้องการซื้อ "{selectedReward?.name}" ด้วยคะแนน {selectedReward?.pointsCost.toLocaleString()} คะแนนใช่หรือไม่?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={confirmPurchase}>ยืนยันการซื้อ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
