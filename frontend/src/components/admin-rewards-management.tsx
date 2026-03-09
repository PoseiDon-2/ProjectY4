
"use client"

import { useState, useEffect, useRef } from "react"
import type { CSSProperties } from "react"
import dynamic from "next/dynamic"
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
import { Plus, Edit, Trash2, Eye, EyeOff, Gift, Award, TrendingUp, Loader2, Upload, Smile } from "lucide-react"
import type { Reward } from "@/types/rewards"
import { toast } from "@/hooks/use-toast"
import { adminRewardsAPI } from "@/lib/api"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

interface AdminRewardsManagementProps {
    onClose?: () => void
}

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

/** พาเลตสีสำหรับเลือก gradient (แบบกริดสี) — สีหลากหลายตามสเปกตรัม */
const COLOR_PALETTE: string[] = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6",
    "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#f43f5e", "#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80", "#2dd4bf", "#38bdf8",
    "#60a5fa", "#818cf8", "#c084fc", "#e879f9", "#f472b6", "#fb7185", "#94a3b8", "#64748b",
    "#475569", "#334155", "#1e293b", "#0f172a", "#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8",
    "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#fef2f2", "#fff7ed",
    "#fffbeb", "#fefce8", "#f7fee7", "#f0fdf4", "#ecfdf5", "#f0fdfa", "#ecfeff", "#f0f9ff",
    "#eff6ff", "#eef2ff", "#f5f3ff", "#faf5ff", "#fdf4ff", "#fdf2f8", "#fce7f3", "#ffe4e6",
]

/** แปลง gradient string เป็น hex คู่ (from, to) — รองรับ from-[#hex] to-[#hex] */
function parseGradientHex(gradient: string): { from: string; to: string } | null {
    const fromMatch = gradient.match(/from-\[#([0-9a-fA-F]{6})\]/)
    const toMatch = gradient.match(/to-\[#([0-9a-fA-F]{6})\]/)
    if (fromMatch && toMatch) return { from: fromMatch[1], to: toMatch[1] }
    return null
}

/** Preset สำหรับรางวัลประเภทธีม (gradient Tailwind) */
const THEME_GRADIENT_PRESETS: { value: string; label: string }[] = [
    { value: "from-pink-500 to-purple-500", label: "ปกติ (ชมพู-ม่วง)" },
    { value: "from-yellow-400 to-orange-500", label: "ทอง" },
    { value: "from-gray-300 to-gray-500", label: "แพลทินัม" },
    { value: "from-blue-400 to-cyan-300", label: "เพชร" },
]
/** Preset สำหรับตรา (อีโมจิหรือชื่อ) */
const BADGE_ICON_PRESETS: { value: string; label: string }[] = [
    { value: "💛", label: "หัวใจทอง" },
    { value: "👑", label: "มงกุฎ" },
    { value: "⭐", label: "ดาวทอง" },
    { value: "💎", label: "เพชร" },
]
/** Preset สำหรับกรอบ (Tailwind classes) — แอดมินเลือกแบบเห็นภาพ */
const FRAME_PREVIEW_PRESETS: { value: string; label: string }[] = [
    { value: "border-2 border-gray-200", label: "ไม่มีกรอบ" },
    { value: "border-4 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded-full p-[4px]", label: "กรอบสีรุ้ง" },
]

/** ความหนากรอบ — กดเลือกแล้วเปลี่ยนความหนาของกรอบที่เลือกไว้ */
const FRAME_WIDTHS: { value: "2" | "4" | "8"; label: string }[] = [
    { value: "2", label: "บาง" },
    { value: "4", label: "กลาง" },
    { value: "8", label: "หนา" },
]

/** แปลง hex เป็น rgba สำหรับเงากรอบ (แอดมินไม่ต้องรู้ Tailwind) */
function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace("#", "")
    if (h.length !== 6) return `rgba(128,128,128,${alpha})`
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

/** แสดงสไตล์กรอบจาก requirements (รองรับ frameColor+frameWidth หรือ preview class) */
function getFrameStyle(req: Record<string, unknown> | undefined): CSSProperties | undefined {
    const frameColor = req?.frameColor as string | undefined
    if (!frameColor) return undefined
    const w = (req?.frameWidth as number) ?? 4
    return {
        border: `${w}px solid ${frameColor}`,
        boxShadow: `0 10px 15px -3px ${hexToRgba(frameColor, 0.35)}`,
        borderRadius: "9999px",
    }
}

function getProfileTypeFromId(id: string): "theme" | "badge" | "frame" | "title" | null {
    if (id.startsWith("theme_")) return "theme"
    if (id.startsWith("badge_")) return "badge"
    if (id.startsWith("frame_")) return "frame"
    if (id.startsWith("title_")) return "title"
    return null
}

export function AdminRewardsManagement({ onClose }: AdminRewardsManagementProps) {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
    const [activeTab, setActiveTab] = useState("rewards")
    const [rewardCategoryFilter, setRewardCategoryFilter] = useState<"all" | "theme" | "badge" | "frame" | "title">("all")
    const [uploadImageLoading, setUploadImageLoading] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState<"create" | "edit" | null>(null)
    const createImageInputRef = useRef<HTMLInputElement>(null)
    const editImageInputRef = useRef<HTMLInputElement>(null)
    const [newReward, setNewReward] = useState<Partial<Reward> & { profileTypeFilter?: "theme" | "badge" | "frame" | "title" }>({
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
        profileTypeFilter: undefined,
    })

    const loadRewards = async () => {
        setLoading(true)
        try {
            const res = await adminRewardsAPI.getList()
            const list = Array.isArray(res.data) ? res.data.map(mapApiToReward) : []
            setRewards(list)
        } catch (e: unknown) {
            const msg = e && typeof e === "object" && "response" in e && (e as { response?: { data?: { message?: string } } }).response?.data?.message
            toast({ title: msg || "โหลดรายการรางวัลไม่สำเร็จ", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRewards()
    }, [])

    const handleCreateReward = async () => {
        if (!newReward.name || !newReward.description || newReward.pointsCost == null) {
            toast({
                title: "กรุณากรอกข้อมูลให้ครบถ้วน",
                variant: "destructive",
            })
            return
        }
        if (newReward.category === "profile" && !newReward.profileTypeFilter) {
            toast({ title: "กรุณาเลือกประเภทสำหรับตกแต่ง (ธีม/ตรา/กรอบ/ตำแหน่ง)", variant: "destructive" })
            return
        }
        setActionLoading("create")
        try {
            await adminRewardsAPI.create({
                ...(newReward.category === "profile" && newReward.profileTypeFilter ? { profileType: newReward.profileTypeFilter } : {}),
                name: newReward.name,
                description: newReward.description,
                category: newReward.category || "profile",
                pointsCost: Number(newReward.pointsCost),
                image: newReward.image || undefined,
                isActive: newReward.isActive ?? true,
                isLimited: newReward.isLimited ?? false,
                limitQuantity: newReward.isLimited ? newReward.limitQuantity : undefined,
                remainingQuantity: newReward.isLimited ? newReward.remainingQuantity ?? newReward.limitQuantity : undefined,
                requirements: newReward.requirements,
            })
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
                profileTypeFilter: undefined,
            })
            setShowCreateDialog(false)
            await loadRewards()
            toast({ title: "สร้างรางวัลสำเร็จ!", description: `รางวัล "${newReward.name}" ได้รับการสร้างแล้ว` })
        } catch (e: unknown) {
            const msg = e && typeof e === "object" && "response" in e && (e as { response?: { data?: { message?: string } } }).response?.data?.message
            toast({ title: msg || "สร้างรางวัลไม่สำเร็จ", variant: "destructive" })
        } finally {
            setActionLoading(null)
        }
    }

    const handleEditReward = async () => {
        if (!selectedReward) return
        setActionLoading(selectedReward.id)
        try {
            await adminRewardsAPI.update(selectedReward.id, {
                name: selectedReward.name,
                description: selectedReward.description,
                category: selectedReward.category,
                pointsCost: selectedReward.pointsCost,
                image: selectedReward.image || null,
                isActive: selectedReward.isActive,
                isLimited: selectedReward.isLimited,
                limitQuantity: selectedReward.limitQuantity,
                remainingQuantity: selectedReward.remainingQuantity,
                requirements: selectedReward.requirements,
            })
            setShowEditDialog(false)
            setSelectedReward(null)
            await loadRewards()
            toast({ title: "แก้ไขรางวัลสำเร็จ!", description: `รางวัล "${selectedReward.name}" ได้รับการแก้ไขแล้ว` })
        } catch (e: unknown) {
            const msg = e && typeof e === "object" && "response" in e && (e as { response?: { data?: { message?: string } } }).response?.data?.message
            toast({ title: msg || "แก้ไขรางวัลไม่สำเร็จ", variant: "destructive" })
        } finally {
            setActionLoading(null)
        }
    }

    const handleUploadRewardImage = async (file: File, mode: "create" | "edit") => {
        setUploadImageLoading(true)
        try {
            const res = await adminRewardsAPI.uploadRewardImage(file)
            const url = res.data?.url
            if (url) {
                if (mode === "create") setNewReward((prev) => ({ ...prev, image: url }))
                else setSelectedReward((prev) => (prev ? { ...prev, image: url } : null))
                toast({ title: "อัปโหลดรูปสำเร็จ", description: "ใช้รูปนี้เป็นรูปรางวัล" })
            }
        } catch (e: unknown) {
            const msg = e && typeof e === "object" && "response" in e && (e as { response?: { data?: { message?: string } } }).response?.data?.message
            toast({ title: msg || "อัปโหลดรูปไม่สำเร็จ", variant: "destructive" })
        } finally {
            setUploadImageLoading(false)
        }
    }

    const handleDeleteReward = async (rewardId: string) => {
        setActionLoading(rewardId)
        try {
            await adminRewardsAPI.delete(rewardId)
            await loadRewards()
            toast({ title: "ลบรางวัลสำเร็จ!", description: "รางวัลได้รับการลบแล้ว" })
        } catch (e: unknown) {
            const msg = e && typeof e === "object" && "response" in e && (e as { response?: { data?: { message?: string } } }).response?.data?.message
            toast({ title: msg || "ลบรางวัลไม่สำเร็จ", variant: "destructive" })
        } finally {
            setActionLoading(null)
        }
    }

    const toggleRewardStatus = async (rewardId: string) => {
        const reward = rewards.find((r) => r.id === rewardId)
        if (!reward) return
        setActionLoading(rewardId)
        try {
            await adminRewardsAPI.update(rewardId, { isActive: !reward.isActive })
            await loadRewards()
        } catch (e: unknown) {
            const msg = e && typeof e === "object" && "response" in e && (e as { response?: { data?: { message?: string } } }).response?.data?.message
            toast({ title: msg || "เปลี่ยนสถานะไม่สำเร็จ", variant: "destructive" })
        } finally {
            setActionLoading(null)
        }
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
                    {/* แถบจำแนกหมวดหมู่ */}
                    <div className="inline-flex p-1.5 rounded-xl bg-muted/70 border border-border/50 shadow-sm gap-1">
                        {[
                            { value: "all" as const, label: "ทั้งหมด" },
                            { value: "theme" as const, label: "ธีม" },
                            { value: "badge" as const, label: "ตรา" },
                            { value: "frame" as const, label: "กรอบ" },
                            { value: "title" as const, label: "ตำแหน่ง" },
                        ].map(({ value, label }) => (
                            <Button
                                key={value}
                                variant={rewardCategoryFilter === value ? "default" : "ghost"}
                                size="sm"
                                className="rounded-lg min-w-[4.25rem] h-9 font-medium transition-all"
                                onClick={() => setRewardCategoryFilter(value)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-8">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            กำลังโหลดรายการรางวัล...
                        </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(rewardCategoryFilter === "all"
                            ? rewards
                            : rewards.filter((r) => {
                                if (rewardCategoryFilter === "theme") return r.id.startsWith("theme_")
                                if (rewardCategoryFilter === "badge") return r.id.startsWith("badge_")
                                if (rewardCategoryFilter === "frame") return r.id.startsWith("frame_")
                                if (rewardCategoryFilter === "title") return r.id.startsWith("title_")
                                return true
                            })
                        ).map((reward) => (
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
                                            <Button variant="ghost" size="sm" onClick={() => toggleRewardStatus(reward.id)} disabled={actionLoading === reward.id}>
                                                {actionLoading === reward.id ? <Loader2 className="h-4 w-4 animate-spin" /> : reward.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setSelectedReward(reward); setShowEditDialog(true); }}
                                                disabled={actionLoading === reward.id}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteReward(reward.id)}
                                                className="text-red-500 hover:text-red-700"
                                                disabled={actionLoading === reward.id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {reward.category === "profile" && (reward.id.startsWith("theme_") || reward.id.startsWith("badge_") || reward.id.startsWith("frame_") || reward.id.startsWith("title_")) && (
                                    <div className="px-6 pt-0 pb-2 flex items-center gap-2">
                                        {reward.id.startsWith("theme_") && (
                                            <div className={`w-10 h-10 rounded-full border border-border shrink-0 bg-gradient-to-r ${(reward.requirements as Record<string, string>)?.gradient ?? "from-gray-400 to-gray-600"}`} />
                                        )}
                                        {reward.id.startsWith("badge_") && (
                                            <div className="w-10 h-10 rounded-full border border-border bg-muted flex items-center justify-center text-2xl shrink-0">
                                                {(reward.requirements as Record<string, string>)?.icon ?? "🎁"}
                                            </div>
                                        )}
                                        {reward.id.startsWith("frame_") && (() => {
                                            const req = reward.requirements as Record<string, unknown> | undefined
                                            const style = getFrameStyle(req)
                                            const previewClass = (req?.preview as string) ?? "border-2 border-gray-200"
                                            if (style) return <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-muted/50"><div style={style} className="w-8 h-8 rounded-full"><div className="w-full h-full rounded-full bg-muted" /></div></div>
                                            return <div className={`w-10 h-10 rounded-full bg-gray-200 shrink-0 ${previewClass}`}><div className="w-full h-full rounded-full bg-muted" /></div>
                                        })()}
                                        {reward.id.startsWith("title_") && (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium shrink-0 px-1 truncate max-w-[6rem]">
                                                {(reward.requirements as Record<string, string>)?.displayText ?? reward.name}
                                            </div>
                                        )}
                                    </div>
                                )}
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

                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    )}
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
                                    onValueChange={(value) => setNewReward((prev) => ({ ...prev, category: value as any, profileTypeFilter: undefined }))}
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

                        {newReward.category === "profile" && (
                            <>
                                <div className="space-y-2">
                                    <Label>ประเภทสำหรับตกแต่ง</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: "theme" as const, label: "ธีม" },
                                            { value: "badge" as const, label: "ตรา" },
                                            { value: "frame" as const, label: "กรอบ" },
                                            { value: "title" as const, label: "ตำแหน่ง" },
                                        ].map(({ value, label }) => (
                                            <Button
                                                key={value}
                                                type="button"
                                                variant={newReward.profileTypeFilter === value ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setNewReward((prev) => ({ ...prev, profileTypeFilter: value }))}
                                            >
                                                {label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    ระบบจะสร้างรหัสรางวัลจากประเภทและชื่อให้เอง (เช่น ธีม + มรกต → theme_morkot) ไม่ต้องกรอก ID
                                </p>
                                {newReward.profileTypeFilter === "theme" && (
                                    <div className="space-y-3">
                                        <Label>สีไล่ระดับ (Gradient)</Label>
                                        <p className="text-xs text-muted-foreground">เลือกสีจากพาเลต (สีต้นทาง → สีปลายทาง)</p>
                                        {(() => {
                                            const req = (newReward.requirements as Record<string, string> | undefined)?.gradient ?? ""
                                            const parsed = parseGradientHex(req)
                                            const fromHex = parsed?.from ?? "8b5cf6"
                                            const toHex = parsed?.to ?? "ec4899"
                                            const setGradient = (from: string, to: string) => setNewReward((prev) => ({
                                                ...prev,
                                                requirements: { ...(prev.requirements as Record<string, unknown> || {}), gradient: `from-[#${from}] to-[#${to}]` },
                                            }))
                                            return (
                                                <div className="flex gap-4 flex-wrap">
                                                    <div>
                                                        <p className="text-xs font-medium mb-1">สีต้นทาง</p>
                                                        <div className="grid grid-cols-8 gap-0.5 w-44 border rounded-md p-1.5 bg-muted/30">
                                                            {COLOR_PALETTE.map((hex) => (
                                                                <button
                                                                    key={hex}
                                                                    type="button"
                                                                    className="w-5 h-5 rounded border-2 border-transparent hover:border-primary"
                                                                    style={{ backgroundColor: hex }}
                                                                    title={hex}
                                                                    onClick={() => setGradient(hex.replace("#", ""), toHex)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium mb-1">สีปลายทาง</p>
                                                        <div className="grid grid-cols-8 gap-0.5 w-44 border rounded-md p-1.5 bg-muted/30">
                                                            {COLOR_PALETTE.map((hex) => (
                                                                <button
                                                                    key={hex}
                                                                    type="button"
                                                                    className="w-5 h-5 rounded border-2 border-transparent hover:border-primary"
                                                                    style={{ backgroundColor: hex }}
                                                                    title={hex}
                                                                    onClick={() => setGradient(fromHex, hex.replace("#", ""))}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {(parsed != null || req === "") && (
                                                        <div className="flex items-end">
                                                            <div className="w-12 h-12 rounded-full bg-muted border shrink-0" style={{ background: parsed ? `linear-gradient(135deg, #${fromHex}, #${toHex})` : "linear-gradient(135deg, #8b5cf6, #ec4899)" }} />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
                                {newReward.profileTypeFilter === "badge" && (
                                    <div className="space-y-2">
                                        <Label>ไอคอนตรา (อีโมจิหรือชื่อ)</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {BADGE_ICON_PRESETS.map((p) => (
                                                <Button
                                                    key={p.value}
                                                    type="button"
                                                    variant={((newReward.requirements as Record<string, string> | undefined)?.icon ?? "") === p.value ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setNewReward((prev) => ({
                                                        ...prev,
                                                        requirements: { ...(prev.requirements as Record<string, unknown> || {}), icon: p.value },
                                                    }))}
                                                >
                                                    <span className="mr-1">{p.value}</span> {p.label}
                                                </Button>
                                            ))}
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setShowEmojiPicker("create")}>
                                            <Smile className="h-4 w-4 mr-2" />
                                            เปิดตัวเลือกอีโมจิ (เหมือน Win+;)
                                        </Button>
                                        <Input
                                            placeholder="หรือใส่อีโมจิ/ข้อความโดยตรง"
                                            value={(newReward.requirements as Record<string, string> | undefined)?.icon ?? ""}
                                            onChange={(e) => setNewReward((prev) => ({
                                                ...prev,
                                                requirements: { ...(prev.requirements as Record<string, unknown> || {}), icon: e.target.value },
                                            }))}
                                        />
                                    </div>
                                )}
                                {newReward.profileTypeFilter === "frame" && (
                                    <div className="space-y-4">
                                        <Label>สไตล์กรอบ</Label>
                                        <p className="text-xs text-muted-foreground">กดเลือกสีจากพาเลต (ไม่ต้องรู้โค้ด) หรือเลือก Preset</p>
                                        {/* Preset: ไม่มีกรอบ, กรอบสีรุ้ง */}
                                        <div className="flex flex-wrap gap-2">
                                            {FRAME_PREVIEW_PRESETS.map((p) => {
                                                const req = (newReward.requirements || {}) as Record<string, unknown>
                                                const selected = !req.frameColor && (req.preview === p.value)
                                                return (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => setNewReward((prev) => ({
                                                            ...prev,
                                                            requirements: { preview: p.value },
                                                        }))}
                                                        className={`rounded-lg border-2 p-2 transition-all hover:opacity-90 ${selected ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-full shrink-0 ${p.value}`}>
                                                            <div className="w-full h-full rounded-full bg-muted" />
                                                        </div>
                                                        <span className="block text-xs mt-1 text-center font-medium">{p.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {/* ความหนากรอบ — ใช้เมื่อเลือกสีเองแล้ว */}
                                        <div>
                                            <p className="text-xs font-medium mb-1.5">ความหนากรอบ</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {FRAME_WIDTHS.map((w) => {
                                                    const req = (newReward.requirements || {}) as Record<string, unknown>
                                                    const hasColor = !!req.frameColor
                                                    const currentW = (req.frameWidth as number) ?? 4
                                                    const selected = hasColor && currentW === Number(w.value)
                                                    return (
                                                        <button
                                                            key={w.value}
                                                            type="button"
                                                            onClick={() => {
                                                                if (!hasColor) return
                                                                setNewReward((prev) => ({
                                                                    ...prev,
                                                                    requirements: { ...(prev.requirements as Record<string, unknown> || {}), frameWidth: Number(w.value) as 2 | 4 | 8 },
                                                                }))
                                                            }}
                                                            disabled={!hasColor}
                                                            className={`rounded-md border px-3 py-1.5 text-sm transition-all ${selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted"} ${!hasColor ? "opacity-50 cursor-not-allowed" : ""}`}
                                                        >
                                                            {w.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        {/* พาเลตสีกรอบ — เลือกสีเอง (เหมือนเลือกสีธีม) */}
                                        <div>
                                            <p className="text-xs font-medium mb-1.5">เลือกสีกรอบ</p>
                                            <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/30">
                                                {COLOR_PALETTE.map((hex) => {
                                                    const req = (newReward.requirements || {}) as Record<string, unknown>
                                                    const selected = (req.frameColor as string) === hex
                                                    return (
                                                        <button
                                                            key={hex}
                                                            type="button"
                                                            onClick={() => setNewReward((prev) => ({
                                                                ...prev,
                                                                requirements: { ...(prev.requirements as Record<string, unknown> || {}), frameColor: hex, frameWidth: (prev.requirements as Record<string, unknown>)?.frameWidth ?? 4 },
                                                            }))}
                                                            className={`w-7 h-7 rounded border-2 transition-all hover:scale-110 ${selected ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
                                                            style={{ backgroundColor: hex }}
                                                            title={hex}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        {/* ตัวอย่าง */}
                                        <div className="flex gap-3 items-center pt-2 border-t">
                                            <span className="text-xs text-muted-foreground">ตัวอย่าง</span>
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden bg-muted/50">
                                                {(() => {
                                                    const req = newReward.requirements as Record<string, unknown> | undefined
                                                    const style = getFrameStyle(req)
                                                    const previewClass = (req?.preview as string)?.trim() || "border-2 border-gray-200"
                                                    if (style) {
                                                        return <div style={style} className="w-12 h-12 rounded-full"><div className="w-full h-full rounded-full bg-muted" /></div>
                                                    }
                                                    return <div className={`w-12 h-12 rounded-full ${previewClass}`}><div className="w-full h-full rounded-full bg-muted" /></div>
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {newReward.profileTypeFilter === "title" && (
                                    <div className="space-y-2">
                                        <Label>ข้อความที่แสดง (ตำแหน่ง)</Label>
                                        <Input
                                            placeholder="เช่น ผู้ช่วยเหลือ, ผู้พิทักษ์, ตำนาน"
                                            value={(newReward.requirements as Record<string, string> | undefined)?.displayText ?? ""}
                                            onChange={(e) => setNewReward((prev) => ({
                                                ...prev,
                                                requirements: { ...(prev.requirements as Record<string, unknown> || {}), displayText: e.target.value },
                                            }))}
                                        />
                                    </div>
                                )}
                            </>
                        )}

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
                            {(newReward.category !== "profile" || (newReward.profileTypeFilter !== "theme" && newReward.profileTypeFilter !== "badge")) && (
                                <div className="space-y-2">
                                    <Label htmlFor="image">URL รูปภาพ</Label>
                                    <Input
                                        id="image"
                                        value={newReward.image || ""}
                                        onChange={(e) => setNewReward((prev) => ({ ...prev, image: e.target.value }))}
                                        placeholder="หรืออัปโหลดด้านล่าง"
                                    />
                                    <input
                                        ref={createImageInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/gif"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0]
                                            if (f) handleUploadRewardImage(f, "create")
                                            e.target.value = ""
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={uploadImageLoading}
                                        onClick={() => createImageInputRef.current?.click()}
                                    >
                                        {uploadImageLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                        อัปโหลดรูป
                                    </Button>
                                    {newReward.image && (
                                        <div className="mt-2">
                                            <img src={newReward.image} alt="Preview" className="h-24 w-auto rounded border object-cover" />
                                        </div>
                                    )}
                                </div>
                            )}
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

                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleCreateReward} disabled={actionLoading === "create"}>
                            {actionLoading === "create" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            สร้างรางวัล
                        </Button>
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

                            {selectedReward.category === "profile" && getProfileTypeFromId(selectedReward.id) === "theme" && (
                                <div className="space-y-3">
                                    <Label>สีไล่ระดับ (Gradient)</Label>
                                    <p className="text-xs text-muted-foreground">เลือกสีจากพาเลต (สีต้นทาง → สีปลายทาง)</p>
                                    {(() => {
                                        const req = (selectedReward.requirements as Record<string, string> | undefined)?.gradient ?? ""
                                        const parsed = parseGradientHex(req)
                                        const fromHex = parsed?.from ?? "8b5cf6"
                                        const toHex = parsed?.to ?? "ec4899"
                                        const setGradient = (from: string, to: string) => setSelectedReward((prev) => (prev ? {
                                            ...prev,
                                            requirements: { ...(prev.requirements as Record<string, unknown> || {}), gradient: `from-[#${from}] to-[#${to}]` },
                                        } : null))
                                        return (
                                            <div className="flex gap-4 flex-wrap">
                                                <div>
                                                    <p className="text-xs font-medium mb-1">สีต้นทาง</p>
                                                    <div className="grid grid-cols-8 gap-0.5 w-44 border rounded-md p-1.5 bg-muted/30">
                                                        {COLOR_PALETTE.map((hex) => (
                                                            <button
                                                                key={hex}
                                                                type="button"
                                                                className="w-5 h-5 rounded border-2 border-transparent hover:border-primary"
                                                                style={{ backgroundColor: hex }}
                                                                title={hex}
                                                                onClick={() => setGradient(hex.replace("#", ""), toHex)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium mb-1">สีปลายทาง</p>
                                                    <div className="grid grid-cols-8 gap-0.5 w-44 border rounded-md p-1.5 bg-muted/30">
                                                        {COLOR_PALETTE.map((hex) => (
                                                            <button
                                                                key={hex}
                                                                type="button"
                                                                className="w-5 h-5 rounded border-2 border-transparent hover:border-primary"
                                                                style={{ backgroundColor: hex }}
                                                                title={hex}
                                                                onClick={() => setGradient(fromHex, hex.replace("#", ""))}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-end">
                                                    <div className="w-12 h-12 rounded-full border shrink-0" style={{ background: `linear-gradient(135deg, #${fromHex}, #${toHex})` }} />
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}
                            {selectedReward.category === "profile" && getProfileTypeFromId(selectedReward.id) === "badge" && (
                                <div className="space-y-2">
                                    <Label>ไอคอนตรา (อีโมจิหรือชื่อ)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {BADGE_ICON_PRESETS.map((p) => (
                                            <Button
                                                key={p.value}
                                                type="button"
                                                variant={((selectedReward.requirements as Record<string, string> | undefined)?.icon ?? "") === p.value ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedReward((prev) => (prev ? {
                                                    ...prev,
                                                    requirements: { ...(prev.requirements as Record<string, unknown> || {}), icon: p.value },
                                                } : null))}
                                            >
                                                <span className="mr-1">{p.value}</span> {p.label}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowEmojiPicker("edit")}>
                                        <Smile className="h-4 w-4 mr-2" />
                                        เปิดตัวเลือกอีโมจิ (เหมือน Win+;)
                                    </Button>
                                    <Input
                                        placeholder="หรือใส่อีโมจิ/ข้อความโดยตรง"
                                        value={(selectedReward.requirements as Record<string, string> | undefined)?.icon ?? ""}
                                        onChange={(e) => setSelectedReward((prev) => (prev ? {
                                            ...prev,
                                            requirements: { ...(prev.requirements as Record<string, unknown> || {}), icon: e.target.value },
                                        } : null))}
                                    />
                                </div>
                            )}
                            {selectedReward.category === "profile" && getProfileTypeFromId(selectedReward.id) === "frame" && (
                                <div className="space-y-4">
                                    <Label>สไตล์กรอบ</Label>
                                    <p className="text-xs text-muted-foreground">กดเลือกสีจากพาเลต (ไม่ต้องรู้โค้ด) หรือเลือก Preset</p>
                                    <div className="flex flex-wrap gap-2">
                                        {FRAME_PREVIEW_PRESETS.map((p) => {
                                            const req = (selectedReward.requirements || {}) as Record<string, unknown>
                                            const selected = !req.frameColor && (req.preview === p.value)
                                            return (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => setSelectedReward((prev) => (prev ? { ...prev, requirements: { preview: p.value } } : null))}
                                                    className={`rounded-lg border-2 p-2 transition-all hover:opacity-90 ${selected ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full shrink-0 ${p.value}`}>
                                                        <div className="w-full h-full rounded-full bg-muted" />
                                                    </div>
                                                    <span className="block text-xs mt-1 text-center font-medium">{p.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium mb-1.5">ความหนากรอบ</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {FRAME_WIDTHS.map((w) => {
                                                const req = (selectedReward.requirements || {}) as Record<string, unknown>
                                                const hasColor = !!req.frameColor
                                                const currentW = (req.frameWidth as number) ?? 4
                                                const selected = hasColor && currentW === Number(w.value)
                                                return (
                                                    <button
                                                        key={w.value}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!hasColor || !selectedReward) return
                                                            setSelectedReward({
                                                                ...selectedReward,
                                                                requirements: { ...(selectedReward.requirements as Record<string, unknown> || {}), frameWidth: Number(w.value) as 2 | 4 | 8 },
                                                            })
                                                        }}
                                                        disabled={!hasColor}
                                                        className={`rounded-md border px-3 py-1.5 text-sm transition-all ${selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted"} ${!hasColor ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    >
                                                        {w.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium mb-1.5">เลือกสีกรอบ</p>
                                        <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/30">
                                            {COLOR_PALETTE.map((hex) => {
                                                const req = (selectedReward.requirements || {}) as Record<string, unknown>
                                                const selected = (req.frameColor as string) === hex
                                                return (
                                                    <button
                                                        key={hex}
                                                        type="button"
                                                        onClick={() => setSelectedReward((prev) => (prev ? {
                                                            ...prev,
                                                            requirements: { ...(prev.requirements as Record<string, unknown> || {}), frameColor: hex, frameWidth: (prev.requirements as Record<string, unknown>)?.frameWidth ?? 4 },
                                                        } : null))}
                                                        className={`w-7 h-7 rounded border-2 transition-all hover:scale-110 ${selected ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
                                                        style={{ backgroundColor: hex }}
                                                        title={hex}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-center pt-2 border-t">
                                        <span className="text-xs text-muted-foreground">ตัวอย่าง</span>
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden bg-muted/50">
                                            {(() => {
                                                const req = selectedReward.requirements as Record<string, unknown> | undefined
                                                const style = getFrameStyle(req)
                                                const previewClass = (req?.preview as string)?.trim() || "border-2 border-gray-200"
                                                if (style) return <div style={style} className="w-12 h-12 rounded-full"><div className="w-full h-full rounded-full bg-muted" /></div>
                                                return <div className={`w-12 h-12 rounded-full ${previewClass}`}><div className="w-full h-full rounded-full bg-muted" /></div>
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {selectedReward.category === "profile" && getProfileTypeFromId(selectedReward.id) === "title" && (
                                <div className="space-y-2">
                                    <Label>ข้อความที่แสดง (ตำแหน่ง)</Label>
                                    <Input
                                        placeholder="เช่น ผู้ช่วยเหลือ, ผู้พิทักษ์, ตำนาน"
                                        value={(selectedReward.requirements as Record<string, string> | undefined)?.displayText ?? ""}
                                        onChange={(e) => setSelectedReward((prev) => (prev ? {
                                            ...prev,
                                            requirements: { ...(prev.requirements as Record<string, unknown> || {}), displayText: e.target.value },
                                        } : null))}
                                    />
                                </div>
                            )}

                            {(selectedReward.category !== "profile" || (getProfileTypeFromId(selectedReward.id) !== "theme" && getProfileTypeFromId(selectedReward.id) !== "badge")) && (
                                <div className="space-y-2">
                                    <Label htmlFor="edit-image">URL รูปภาพ</Label>
                                    <Input
                                        id="edit-image"
                                        value={selectedReward.image || ""}
                                        onChange={(e) =>
                                            setSelectedReward((prev) => (prev ? { ...prev, image: e.target.value } : null))
                                        }
                                        placeholder="หรืออัปโหลดด้านล่าง"
                                    />
                                    <input
                                        ref={editImageInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/gif"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0]
                                            if (f) handleUploadRewardImage(f, "edit")
                                            e.target.value = ""
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={uploadImageLoading}
                                        onClick={() => editImageInputRef.current?.click()}
                                    >
                                        {uploadImageLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                        อัปโหลดรูป
                                    </Button>
                                    {selectedReward.image && (
                                        <div className="mt-2">
                                            <img src={selectedReward.image} alt="Preview" className="h-24 w-auto rounded border object-cover" />
                                        </div>
                                    )}
                                </div>
                            )}

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
                        <Button onClick={handleEditReward} disabled={!!selectedReward && actionLoading === selectedReward.id}>
                            {selectedReward && actionLoading === selectedReward.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            บันทึกการแก้ไข
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Emoji Picker Dialog (เหมือน Win+;) */}
            <Dialog open={showEmojiPicker !== null} onOpenChange={(open) => !open && setShowEmojiPicker(null)}>
                <DialogContent className="max-w-sm p-0 overflow-hidden">
                    <DialogHeader className="p-3 pb-0">
                        <DialogTitle>เลือกอีโมจิ</DialogTitle>
                        <DialogDescription>คลิกอีโมจิที่ต้องการใช้เป็นตรา</DialogDescription>
                    </DialogHeader>
                    <div className="p-2 max-h-[360px] overflow-auto">
                        <EmojiPicker
                            onEmojiClick={(data) => {
                                const emoji = data.emoji
                                if (showEmojiPicker === "create") {
                                    setNewReward((prev) => ({
                                        ...prev,
                                        requirements: { ...(prev.requirements as Record<string, unknown> || {}), icon: emoji },
                                    }))
                                } else if (showEmojiPicker === "edit" && selectedReward) {
                                    setSelectedReward({
                                        ...selectedReward,
                                        requirements: { ...(selectedReward.requirements as Record<string, unknown> || {}), icon: emoji },
                                    })
                                }
                                setShowEmojiPicker(null)
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
