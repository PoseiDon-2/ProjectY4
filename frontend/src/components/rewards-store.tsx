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
import { Coins, Crown, Palette, Award, Gift, Sparkles, Loader2 } from "lucide-react"
import type { Reward, UserPoints } from "@/types/rewards"
import { pointsSystem } from "@/lib/points-system"
import { pointsAPI, rewardsAPI } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

function mapApiToReward(item: {
    id: string
    name: string
    description: string
    category: string
    pointsCost: number
    image: string | null
    isActive: boolean
    isLimited: boolean
    limitQuantity?: number
    remainingQuantity?: number
    requirements?: Record<string, unknown>
    createdBy: string
    createdAt: string
}): Reward {
    return {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category as Reward["category"],
        pointsCost: item.pointsCost,
        image: item.image ?? "https://via.placeholder.com/400x300?text=No+Image",
        isActive: item.isActive,
        isLimited: item.isLimited,
        limitQuantity: item.limitQuantity,
        remainingQuantity: item.remainingQuantity,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        requirements: item.requirements ?? {},
    }
}

export function RewardsStore() {
    const { user } = useAuth()
    const [rewards, setRewards] = useState<Reward[]>([])
    const [rewardsLoading, setRewardsLoading] = useState(true)
    const [userPoints, setUserPoints] = useState<UserPoints | null>(null)
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string>("all")
    const [redeemLoading, setRedeemLoading] = useState(false)

    useEffect(() => {
        rewardsAPI.getList().then((res) => {
            const list = Array.isArray(res.data) ? res.data.map(mapApiToReward) : []
            setRewards(list)
        }).catch(() => {
            setRewards([])
        }).finally(() => {
            setRewardsLoading(false)
        })
    }, [])

    useEffect(() => {
        if (!user) return
        pointsSystem.loadFromStorage()
        setUserPoints(pointsSystem.getUserPoints(user.id))

        pointsSystem.getUserPointsWithSync(user.id).then((up) => {
            if (up) setUserPoints(up)
        })
    }, [user])

    const filteredRewards = rewards.filter((reward) => {
        if (activeCategory === "all") return true
        return reward.category === activeCategory
    })

    const canPurchase = (reward: Reward): boolean => {
        if (!userPoints) return false
        if (userPoints.availablePoints < reward.pointsCost) return false
        if (reward.isLimited && reward.remainingQuantity === 0) return false
        return true
    }

    const handlePurchase = (reward: Reward) => {
        setSelectedReward(reward)
        setShowConfirmDialog(true)
    }

    const confirmPurchase = async () => {
        if (!selectedReward || !user || !userPoints) return

        setRedeemLoading(true)
        try {
            const res = await rewardsAPI.redeem(selectedReward.id)
            if (userPoints) {
                setUserPoints({ ...userPoints, availablePoints: res.data.availablePoints })
            }
            const up = await pointsSystem.getUserPointsWithSync(user.id)
            if (up) setUserPoints(up)
            toast({
                title: "แลกรางวัลสำเร็จ!",
                description: `คุณได้รับ ${selectedReward.name} แล้ว`,
            })
            setShowConfirmDialog(false)
            setSelectedReward(null)
            setRewards((prev) => {
                const r = prev.find((x) => x.id === selectedReward.id)
                if (!r || !r.isLimited || r.remainingQuantity == null) return prev
                return prev.map((x) =>
                    x.id === selectedReward.id ? { ...x, remainingQuantity: Math.max(0, (x.remainingQuantity ?? 0) - 1) } : x
                )
            })
        } catch (e: unknown) {
            let msg: string | null = null
            if (e && typeof e === "object" && "response" in e) {
                const res = (e as { response?: { data?: Record<string, unknown> } }).response
                const data = res?.data
                if (data && typeof data === "object") {
                    if (typeof data.message === "string") msg = data.message
                    else if (data.errors && typeof data.errors === "object") {
                        const err = data.errors as Record<string, string[]>
                        const first = Object.values(err).flat().find((s) => typeof s === "string")
                        if (first) msg = first
                    }
                }
            }
            toast({
                title: msg || "แลกรางวัลไม่สำเร็จ",
                description: msg ? undefined : "คะแนนไม่เพียงพอหรือไม่ผ่านเงื่อนไข",
                variant: "destructive",
            })
        } finally {
            setRedeemLoading(false)
        }
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
                    <p className="text-sm text-muted-foreground mt-3">
                        คะแนนมาจากการบริจาคที่ได้รับการอนุมัติแล้ว (เงิน/สิ่งของ/แรงงาน)
                    </p>
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
                    {rewardsLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-12">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            กำลังโหลดรางวัล...
                        </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRewards.map((reward) => (
                            <Card key={reward.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-square relative flex items-center justify-center bg-muted/50">
                                    {reward.id.startsWith("theme_") ? (
                                        <div className={`w-full h-full bg-gradient-to-r ${(reward.requirements as Record<string, string>)?.gradient ?? "from-gray-400 to-gray-600"}`} />
                                    ) : reward.id.startsWith("badge_") ? (
                                        <div className="w-full h-full flex items-center justify-center text-6xl">
                                            {(reward.requirements as Record<string, string>)?.icon ?? "🎁"}
                                        </div>
                                    ) : reward.id.startsWith("frame_") ? (() => {
                                        const req = reward.requirements as Record<string, unknown> | undefined
                                        const frameColor = req?.frameColor as string | undefined
                                        if (frameColor) {
                                            const w = (req?.frameWidth as number) ?? 4
                                            const h = frameColor.replace("#", "")
                                            const hexToRgba = (hex: string, a: number) => {
                                                if (hex.length !== 6) return `rgba(128,128,128,${a})`
                                                return `rgba(${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)},${a})`
                                            }
                                            const style = { border: `${w}px solid ${frameColor}`, boxShadow: `0 10px 15px -3px ${hexToRgba(h, 0.35)}`, borderRadius: "9999px" }
                                            return <div className="w-full h-full rounded-full flex items-center justify-center bg-muted/50" style={style}><div className="w-full h-full rounded-full bg-muted" /></div>
                                        }
                                        return <div className={`w-full h-full rounded-full bg-gray-200 flex items-center justify-center ${(reward.requirements as Record<string, string>)?.preview ?? "border-2 border-gray-200"}`}><div className="w-full h-full rounded-full bg-muted" /></div>
                                    })() : reward.id.startsWith("title_") ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-pink-400 text-white font-medium text-lg px-4 text-center">
                                            {(reward.requirements as Record<string, string>)?.displayText ?? reward.name}
                                        </div>
                                    ) : (
                                        <img
                                            src={reward.image || "https://via.placeholder.com/400x300?text=No+Image"}
                                            alt={reward.name}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
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
                                                : reward.isLimited && reward.remainingQuantity === 0
                                                    ? "หมดแล้ว"
                                                    : "ไม่สามารถซื้อได้"
                                            : "แลกรางวัล"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ยืนยันการแลกรางวัล</DialogTitle>
                        <DialogDescription>
                            คุณต้องการแลก "{selectedReward?.name}" ด้วยคะแนน {selectedReward?.pointsCost?.toLocaleString()} คะแนนใช่หรือไม่?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={confirmPurchase} disabled={redeemLoading}>
                            {redeemLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            ยืนยันการแลก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
