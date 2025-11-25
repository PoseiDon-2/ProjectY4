
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Eye, EyeOff, Gift, TrendingUp, Award } from "lucide-react"
import type { Reward } from "@/types/rewards"
import { toast } from "@/hooks/use-toast"

interface AdminRewardsManagementProps {
    onClose?: () => void
}

export function AdminRewardsManagement({ onClose }: AdminRewardsManagementProps) {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
    const [activeTab, setActiveTab] = useState("rewards")
    const [newReward, setNewReward] = useState<Partial<Reward>>({
        name: "",
        description: "",
        category: "profile",
        pointsCost: 0,
        image: "",
        isActive: true,
        isLimited: false,
        limitQuantity: undefined,
        remainingQuantity: undefined,
        requirements: {},
    })

    useEffect(() => {
        loadRewards()
    }, [])

    const loadRewards = () => {
        const stored = localStorage.getItem("admin_rewards")
        if (stored) {
            setRewards(JSON.parse(stored))
        } else {
            // Initialize with default rewards
            const defaultRewards: Reward[] = [
                {
                    id: "theme_gold",
                    name: "ธีมทอง",
                    description: "เปลี่ยนธีมโปรไฟล์เป็นสีทองหรูหรา",
                    category: "profile",
                    pointsCost: 500,
                    image: "https://via.placeholder.com/400x300?text=No+Image",
                    isActive: true,
                    isLimited: false,
                    createdBy: "admin",
                    createdAt: new Date().toISOString(),
                },
                {
                    id: "badge_heart",
                    name: "ตราหัวใจทอง",
                    description: "ตราสัญลักษณ์หัวใจทองคำ",
                    category: "badge",
                    pointsCost: 300,
                    image: "https://via.placeholder.com/400x300?text=No+Image",
                    isActive: true,
                    isLimited: false,
                    createdBy: "admin",
                    createdAt: new Date().toISOString(),
                },
            ]
            setRewards(defaultRewards)
            localStorage.setItem("admin_rewards", JSON.stringify(defaultRewards))
        }
    }

    const saveRewards = (updatedRewards: Reward[]) => {
        setRewards(updatedRewards)
        localStorage.setItem("admin_rewards", JSON.stringify(updatedRewards))
    }

    const handleCreateReward = () => {
        if (!newReward.name || !newReward.description || !newReward.pointsCost) {
            toast({
                title: "กรุณากรอกข้อมูลให้ครบถ้วน",
                variant: "destructive",
            })
            return
        }

        const reward: Reward = {
            id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: newReward.name,
            description: newReward.description,
            category: newReward.category || "profile",
            pointsCost: newReward.pointsCost,
            image: newReward.image || "https://via.placeholder.com/400x300?text=No+Image",
            isActive: newReward.isActive ?? true,
            isLimited: newReward.isLimited ?? false,
            limitQuantity: newReward.isLimited ? newReward.limitQuantity : undefined,
            remainingQuantity: newReward.isLimited ? newReward.limitQuantity : undefined,
            createdBy: "admin",
            createdAt: new Date().toISOString(),
            requirements: newReward.requirements || {},
        }

        const updatedRewards = [...rewards, reward]
        saveRewards(updatedRewards)

        setNewReward({
            name: "",
            description: "",
            category: "profile",
            pointsCost: 0,
            image: "",
            isActive: true,
            isLimited: false,
            limitQuantity: undefined,
            remainingQuantity: undefined,
            requirements: {},
        })
        setShowCreateDialog(false)

        toast({
            title: "สร้างรางวัลสำเร็จ!",
            description: `รางวัล "${reward.name}" ได้รับการสร้างแล้ว`,
        })
    }

    const handleEditReward = () => {
        if (!selectedReward) return

        const updatedRewards = rewards.map((reward) => (reward.id === selectedReward.id ? selectedReward : reward))
        saveRewards(updatedRewards)
        setShowEditDialog(false)
        setSelectedReward(null)

        toast({
            title: "แก้ไขรางวัลสำเร็จ!",
            description: `รางวัล "${selectedReward.name}" ได้รับการแก้ไขแล้ว`,
        })
    }

    const handleDeleteReward = (rewardId: string) => {
        const updatedRewards = rewards.filter((reward) => reward.id !== rewardId)
        saveRewards(updatedRewards)

        toast({
            title: "ลบรางวัลสำเร็จ!",
            description: "รางวัลได้รับการลบแล้ว",
        })
    }

    const toggleRewardStatus = (rewardId: string) => {
        const updatedRewards = rewards.map((reward) =>
            reward.id === rewardId ? { ...reward, isActive: !reward.isActive } : reward,
        )
        saveRewards(updatedRewards)
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "profile":
                return "🎨"
            case "badge":
                return "🏆"
            case "feature":
                return "✨"
            case "physical":
                return "📦"
            default:
                return "🎁"
        }
    }

    const getCategoryName = (category: string) => {
        switch (category) {
            case "profile":
                return "ธีมโปรไฟล์"
            case "badge":
                return "ตราสัญลักษณ์"
            case "feature":
                return "ฟีเจอร์พิเศษ"
            case "physical":
                return "ของรางวัลจริง"
            default:
                return "อื่นๆ"
        }
    }

    const getRewardStats = () => {
        const totalRewards = rewards.length
        const activeRewards = rewards.filter((r) => r.isActive).length
        const limitedRewards = rewards.filter((r) => r.isLimited).length
        const categories = [...new Set(rewards.map((r) => r.category))].length

        return { totalRewards, activeRewards, limitedRewards, categories }
    }

    const stats = getRewardStats()

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Gift className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">รางวัลทั้งหมด</p>
                                <p className="text-2xl font-bold">{stats.totalRewards}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Eye className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">รางวัลที่เปิดใช้</p>
                                <p className="text-2xl font-bold">{stats.activeRewards}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Award className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">รางวัลจำกัด</p>
                                <p className="text-2xl font-bold">{stats.limitedRewards}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">หมวดหมู่</p>
                                <p className="text-2xl font-bold">{stats.categories}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="rewards">จัดการรางวัล</TabsTrigger>
                        <TabsTrigger value="analytics">สถิติ</TabsTrigger>
                    </TabsList>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มรางวัลใหม่
                    </Button>
                </div>

                <TabsContent value="rewards" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rewards.map((reward) => (
                            <Card key={reward.id} className={`${!reward.isActive ? "opacity-60" : ""}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getCategoryIcon(reward.category)}</span>
                                            <div>
                                                <CardTitle className="text-base">{reward.name}</CardTitle>
                                                <Badge variant="outline" className="text-xs mt-1">
                                                    {getCategoryName(reward.category)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => toggleRewardStatus(reward.id)}>
                                                {reward.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedReward(reward)
                                                    setShowEditDialog(true)
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteReward(reward.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">{reward.description}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <span className="text-yellow-500">🪙</span>
                                            <span className="font-semibold">{reward.pointsCost.toLocaleString()}</span>
                                        </div>
                                        {reward.isLimited && (
                                            <Badge variant="secondary" className="text-xs">
                                                เหลือ {reward.remainingQuantity}/{reward.limitQuantity}
                                            </Badge>
                                        )}
                                    </div>

                                    {reward.requirements && Object.keys(reward.requirements).length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            {reward.requirements.minLevel && `ระดับ ${reward.requirements.minLevel}+ `}
                                            {reward.requirements.minDonations && `บริจาค ${reward.requirements.minDonations}+ ครั้ง`}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>สถิติรางวัล</CardTitle>
                            <CardDescription>ข้อมูลสถิติการใช้งานรางวัลในระบบ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {["profile", "badge", "feature", "physical"].map((category) => {
                                        const categoryRewards = rewards.filter((r) => r.category === category)
                                        return (
                                            <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                                                <div className="text-2xl mb-1">{getCategoryIcon(category)}</div>
                                                <div className="text-lg font-bold">{categoryRewards.length}</div>
                                                <div className="text-xs text-muted-foreground">{getCategoryName(category)}</div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-2">รางวัลที่ได้รับความนิยม</h4>
                                    <div className="space-y-2">
                                        {rewards.slice(0, 5).map((reward, index) => (
                                            <div key={reward.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">#{index + 1}</span>
                                                    <span>{reward.name}</span>
                                                </div>
                                                <Badge variant="outline">{reward.pointsCost} คะแนน</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Reward Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>เพิ่มรางวัลใหม่</DialogTitle>
                        <DialogDescription>สร้างรางวัลใหม่สำหรับผู้ใช้แลกคะแนน</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">ชื่อรางวัล</Label>
                                <Input
                                    id="name"
                                    value={newReward.name}
                                    onChange={(e) => setNewReward((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="เช่น ธีมทอง"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">หมวดหมู่</Label>
                                <Select
                                    value={newReward.category}
                                    onValueChange={(value) => setNewReward((prev) => ({ ...prev, category: value as any }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="profile">ธีมโปรไฟล์</SelectItem>
                                        <SelectItem value="badge">ตราสัญลักษณ์</SelectItem>
                                        <SelectItem value="feature">ฟีเจอร์พิเศษ</SelectItem>
                                        <SelectItem value="physical">ของรางวัลจริง</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">คำอธิบาย</Label>
                            <Textarea
                                id="description"
                                value={newReward.description}
                                onChange={(e) => setNewReward((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="อธิบายรางวัลนี้"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pointsCost">ราคา (คะแนน)</Label>
                                <Input
                                    id="pointsCost"
                                    type="number"
                                    value={newReward.pointsCost}
                                    onChange={(e) =>
                                        setNewReward((prev) => ({ ...prev, pointsCost: Number.parseInt(e.target.value) || 0 }))
                                    }
                                    placeholder="500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="image">URL รูปภาพ</Label>
                                <Input
                                    id="image"
                                    value={newReward.image}
                                    onChange={(e) => setNewReward((prev) => ({ ...prev, image: e.target.value }))}
                                    placeholder="https://via.placeholder.com/400x300?text=No+Image"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isLimited"
                                checked={newReward.isLimited}
                                onCheckedChange={(checked) => setNewReward((prev) => ({ ...prev, isLimited: checked }))}
                            />
                            <Label htmlFor="isLimited">รางวัลจำกัดจำนวน</Label>
                        </div>

                        {newReward.isLimited && (
                            <div className="space-y-2">
                                <Label htmlFor="limitQuantity">จำนวนที่จำกัด</Label>
                                <Input
                                    id="limitQuantity"
                                    type="number"
                                    value={newReward.limitQuantity || ""}
                                    onChange={(e) =>
                                        setNewReward((prev) => ({
                                            ...prev,
                                            limitQuantity: Number.parseInt(e.target.value) || undefined,
                                            remainingQuantity: Number.parseInt(e.target.value) || undefined,
                                        }))
                                    }
                                    placeholder="100"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>ข้อกำหนด (ไม่บังคับ)</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minLevel">ระดับขั้นต่ำ</Label>
                                    <Input
                                        id="minLevel"
                                        type="number"
                                        value={newReward.requirements?.minLevel || ""}
                                        onChange={(e) =>
                                            setNewReward((prev) => ({
                                                ...prev,
                                                requirements: {
                                                    ...prev.requirements,
                                                    minLevel: Number.parseInt(e.target.value) || undefined,
                                                },
                                            }))
                                        }
                                        placeholder="3"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minDonations">จำนวนการบริจาคขั้นต่ำ</Label>
                                    <Input
                                        id="minDonations"
                                        type="number"
                                        value={newReward.requirements?.minDonations || ""}
                                        onChange={(e) =>
                                            setNewReward((prev) => ({
                                                ...prev,
                                                requirements: {
                                                    ...prev.requirements,
                                                    minDonations: Number.parseInt(e.target.value) || undefined,
                                                },
                                            }))
                                        }
                                        placeholder="5"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleCreateReward}>สร้างรางวัล</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Reward Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>แก้ไขรางวัล</DialogTitle>
                        <DialogDescription>แก้ไขข้อมูลรางวัล</DialogDescription>
                    </DialogHeader>

                    {selectedReward && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">ชื่อรางวัล</Label>
                                    <Input
                                        id="edit-name"
                                        value={selectedReward.name}
                                        onChange={(e) => setSelectedReward((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-pointsCost">ราคา (คะแนน)</Label>
                                    <Input
                                        id="edit-pointsCost"
                                        type="number"
                                        value={selectedReward.pointsCost}
                                        onChange={(e) =>
                                            setSelectedReward((prev) =>
                                                prev ? { ...prev, pointsCost: Number.parseInt(e.target.value) || 0 } : null,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description">คำอธิบาย</Label>
                                <Textarea
                                    id="edit-description"
                                    value={selectedReward.description}
                                    onChange={(e) =>
                                        setSelectedReward((prev) => (prev ? { ...prev, description: e.target.value } : null))
                                    }
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="edit-isActive"
                                    checked={selectedReward.isActive}
                                    onCheckedChange={(checked) =>
                                        setSelectedReward((prev) => (prev ? { ...prev, isActive: checked } : null))
                                    }
                                />
                                <Label htmlFor="edit-isActive">เปิดใช้งาน</Label>
                            </div>

                            {selectedReward.isLimited && (
                                <div className="space-y-2">
                                    <Label htmlFor="edit-remainingQuantity">จำนวนที่เหลือ</Label>
                                    <Input
                                        id="edit-remainingQuantity"
                                        type="number"
                                        value={selectedReward.remainingQuantity || ""}
                                        onChange={(e) =>
                                            setSelectedReward((prev) =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        remainingQuantity: Number.parseInt(e.target.value) || undefined,
                                                    }
                                                    : null,
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleEditReward}>บันทึกการแก้ไข</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
