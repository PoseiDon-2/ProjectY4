"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, Palette, Award, Sparkles, Star } from "lucide-react"
import type { ProfileCustomization as UserCustomization, UserReward, Reward } from "@/types/rewards"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { rewardsAPI, type UserRewardFromAPI, type RewardAdminItem } from "@/lib/api"

/** สไตล์สำหรับ ID ที่รู้จัก (fallback สำหรับ id ใหม่จาก catalog) */
const THEME_GRADIENT: Record<string, string> = {
    theme_gold: "from-yellow-400 to-orange-500",
    theme_platinum: "from-gray-300 to-gray-500",
    theme_diamond: "from-blue-400 to-cyan-300",
}
const BADGE_ICON: Record<string, string> = {
    badge_heart: "Yellow Heart",
    badge_crown: "Crown",
    badge_star: "Star",
    badge_diamond: "Gem Stone",
}
const FRAME_PREVIEW: Record<string, string> = {
    frame_rainbow: "border-4 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded-full p-[4px]",
    frame_fire: "border-4 border-orange-500 shadow-lg shadow-orange-200",
    frame_ice: "border-4 border-cyan-400 shadow-lg shadow-cyan-200",
}
const TITLE_DISPLAY: Record<string, string> = {
    title_helper: "ผู้ช่วยเหลือ",
    title_guardian: "ผู้พิทักษ์",
    title_legend: "ตำนาน",
}
const DEFAULT_THEME_GRADIENT = "from-gray-400 to-gray-600"
const DEFAULT_FRAME_PREVIEW = "border-2 border-gray-200"

function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace("#", "")
    if (h.length !== 6) return `rgba(128,128,128,${alpha})`
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function getFrameStyle(req: Record<string, unknown> | undefined): { border: string; boxShadow: string; borderRadius: string } | undefined {
    const frameColor = req?.frameColor as string | undefined
    if (!frameColor) return undefined
    const w = (req?.frameWidth as number) ?? 4
    return {
        border: `${w}px solid ${frameColor}`,
        boxShadow: `0 10px 15px -3px ${hexToRgba(frameColor, 0.35)}`,
        borderRadius: "9999px",
    }
}

interface ProfileCustomizationProps {
    onClose?: () => void
    onSave?: (data: UserCustomization) => void
}

/** ชื่อแสดงสำหรับรางวัลตกแต่งโปรไฟล์ (ของที่แลกมา) — ใช้เมื่อไม่มี name จาก catalog */
const PROFILE_REWARD_NAMES: Record<string, string> = {
    theme_gold: "ธีมทอง",
    theme_platinum: "ธีมแพลทินัม",
    theme_diamond: "ธีมเพชร",
    badge_heart: "หัวใจทอง",
    badge_crown: "มงกุฎ",
    badge_star: "ดาวทอง",
    badge_diamond: "เพชร",
    frame_rainbow: "กรอบสีรุ้ง",
    frame_fire: "กรอบเปลวไฟ",
    frame_ice: "กรอบน้ำแข็ง",
    title_helper: "ผู้ช่วยเหลือ",
    title_guardian: "ผู้พิทักษ์",
    title_legend: "ตำนาน",
}

export function ProfileCustomization({ onClose, onSave }: ProfileCustomizationProps) {
    const { user } = useAuth()
    const [customization, setCustomization] = useState<UserCustomization>({
        userId: "",
        theme: "default",
        badge: "",
        frame: "none",
        title: "none",
        background: "",
        effects: [],
    })
    const [userRewards, setUserRewards] = useState<UserReward[]>([])
    const [catalogRewards, setCatalogRewards] = useState<RewardAdminItem[]>([])

    // โหลด catalog (GET /rewards) สำหรับรายการธีม/ตรา/กรอบ/ตำแหน่ง
    useEffect(() => {
        rewardsAPI.getList()
            .then((res) => setCatalogRewards(Array.isArray(res.data) ? res.data : []))
            .catch(() => setCatalogRewards([]))
    }, [])

    // รายการตัวเลือกจาก catalog + ตัวฟรี (default/none) — อ่านจาก requirements ก่อน แล้ว fallback ไป map
    const themeOptions = useMemo(() => {
        const free = { id: "default" as const, name: "ธีมปกติ", gradient: "from-pink-500 to-purple-500" }
        const fromCatalog = catalogRewards
            .filter((r) => r.id.startsWith("theme_"))
            .map((r) => {
                const req = (r.requirements ?? {}) as Record<string, string | undefined>
                const gradient = req.gradient ?? THEME_GRADIENT[r.id] ?? DEFAULT_THEME_GRADIENT
                return { id: r.id, name: r.name, gradient }
            })
        return [free, ...fromCatalog]
    }, [catalogRewards])
    const badgeOptions = useMemo(() => {
        const free = { id: "" as const, name: "ไม่มีตรา", icon: "" }
        const fromCatalog = catalogRewards
            .filter((r) => r.id.startsWith("badge_"))
            .map((r) => {
                const req = (r.requirements ?? {}) as Record<string, string | undefined>
                const icon = req.icon ?? BADGE_ICON[r.id] ?? "Award"
                return { id: r.id, name: r.name, icon }
            })
        return [free, ...fromCatalog]
    }, [catalogRewards])
    const frameOptions = useMemo(() => {
        const free = { id: "none" as const, name: "ไม่มีกรอบ", preview: DEFAULT_FRAME_PREVIEW, frameColor: undefined as string | undefined, frameWidth: undefined as number | undefined }
        const fromCatalog = catalogRewards
            .filter((r) => r.id.startsWith("frame_"))
            .map((r) => {
                const req = (r.requirements ?? {}) as Record<string, string | number | undefined>
                const preview = (req.preview as string) ?? FRAME_PREVIEW[r.id] ?? DEFAULT_FRAME_PREVIEW
                const frameColor = req.frameColor as string | undefined
                const frameWidth = (req.frameWidth as number) ?? 4
                return { id: r.id, name: r.name, preview, frameColor, frameWidth }
            })
        return [free, ...fromCatalog]
    }, [catalogRewards])
    const titleOptions = useMemo(() => {
        const free = { id: "none" as const, name: "ไม่มีตำแหน่ง", display: "" }
        const fromCatalog = catalogRewards
            .filter((r) => r.id.startsWith("title_"))
            .map((r) => {
                const req = (r.requirements ?? {}) as Record<string, string | undefined>
                const display = req.displayText ?? TITLE_DISPLAY[r.id] ?? r.name
                return { id: r.id, name: r.name, display }
            })
        return [free, ...fromCatalog]
    }, [catalogRewards])

    // โหลดข้อมูลเมื่อ user พร้อม
    useEffect(() => {
        if (!user?.id) return

        const saved = localStorage.getItem(`profile_customization_${user.id}`)
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Record<string, unknown>
                // Migrate old short ids to full id (theme "gold" -> "theme_gold")
                const theme = parsed.theme === "gold" ? "theme_gold" : parsed.theme === "platinum" ? "theme_platinum" : parsed.theme === "diamond" ? "theme_diamond" : parsed.theme
                const badge = parsed.badge === "heart" ? "badge_heart" : parsed.badge === "crown" ? "badge_crown" : parsed.badge === "star" ? "badge_star" : parsed.badge === "diamond" ? "badge_diamond" : parsed.badge
                const frame = parsed.frame === "rainbow" ? "frame_rainbow" : parsed.frame === "fire" ? "frame_fire" : parsed.frame === "ice" ? "frame_ice" : parsed.frame
                const title = parsed.title === "helper" ? "title_helper" : parsed.title === "guardian" ? "title_guardian" : parsed.title === "legend" ? "title_legend" : parsed.title
                setCustomization(prev => ({
                    ...prev,
                    ...parsed,
                    userId: user.id,
                    theme: (theme as string) ?? "default",
                    badge: (badge as string) ?? "",
                    frame: (frame as string) ?? "none",
                    title: (title as string) ?? "none",
                }))
            } catch (e) {
                console.error("Failed to parse customization:", e)
            }
        } else {
            setCustomization(prev => ({ ...prev, userId: user.id }))
        }

        // โหลดรางวัลที่แลกแล้วจาก API เป็นหลัก; fallback ไป localStorage ถ้า API ล้มเหลว
        rewardsAPI.getMyRewards()
            .then((res) => {
                const raw = Array.isArray(res.data) ? res.data : []
                const list = raw.map((r: UserRewardFromAPI) => ({
                    id: r.id,
                    userId: user.id,
                    rewardId: r.rewardId,
                    isActive: r.isActive !== false,
                    purchasedAt: r.purchasedAt ?? "",
                    reward: {} as Reward,
                })) as UserReward[]
                setUserRewards(list)
            })
            .catch(() => {
                const rewards = localStorage.getItem(`user_rewards_${user.id}`)
                if (rewards) {
                    try {
                        setUserRewards(JSON.parse(rewards))
                    } catch (e) {
                        console.error("Failed to parse rewards:", e)
                    }
                }
            })
    }, [user?.id])

    const saveCustomization = () => {
        if (!user?.id) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถบันทึกได้ กรุณาล็อกอินใหม่",
                variant: "destructive",
            })
            return
        }

        localStorage.setItem(`profile_customization_${user.id}`, JSON.stringify(customization))
        toast({
            title: "บันทึกการตกแต่งสำเร็จ!",
            description: "การตกแต่งโปรไฟล์ของคุณได้รับการบันทึกแล้ว",
        })
        onSave?.(customization)
        onClose?.()
    }

    const hasReward = (rewardId: string): boolean => {
        return userRewards.some((reward) => reward.rewardId === rewardId && reward.isActive)
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    const themeForPreview = themeOptions.find((t) => t.id === customization.theme) || themeOptions[0]
    const frameForPreview = frameOptions.find((f) => f.id === customization.frame) || frameOptions[0]
    const badgeForPreview = customization.badge ? badgeOptions.find((b) => b.id === customization.badge) : null
    const titleForPreview = titleOptions.find((t) => t.id === customization.title) || titleOptions[0]

    const getRewardDisplayName = (rewardId: string) =>
        catalogRewards.find((r) => r.id === rewardId)?.name ?? PROFILE_REWARD_NAMES[rewardId] ?? rewardId

    const renderCustomizedAvatar = () => {
        if (!user) return null
        return (
            <div className="text-center space-y-4">
                <div className="relative inline-block">
                    {(() => {
                        const req = frameForPreview?.id && frameForPreview.id !== "none"
                            ? catalogRewards.find((r) => r.id === frameForPreview.id)?.requirements as Record<string, unknown> | undefined
                            : undefined
                        const frameStyle = getFrameStyle(req)
                        if (frameStyle) {
                            return (
                                <div className="p-0 rounded-full" style={frameStyle}>
                                    <Avatar className="w-24 h-24 rounded-full border-0">
                                        <AvatarImage src={user.avatar || "https://via.placeholder.com/400x300?text=No+Image"} alt={`${user.firstName} ${user.lastName}`} />
                                        <AvatarFallback className={`text-2xl bg-gradient-to-r ${themeForPreview?.gradient ?? DEFAULT_THEME_GRADIENT} text-white rounded-full`}>
                                            {getInitials(user.firstName, user.lastName)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            )
                        }
                        return (
                            <div className={`p-1 rounded-full ${frameForPreview?.preview ?? DEFAULT_FRAME_PREVIEW}`}>
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={user.avatar || "https://via.placeholder.com/400x300?text=No+Image"} alt={`${user.firstName} ${user.lastName}`} />
                                    <AvatarFallback className={`text-2xl bg-gradient-to-r ${themeForPreview?.gradient ?? DEFAULT_THEME_GRADIENT} text-white`}>
                                        {getInitials(user.firstName, user.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        )
                    })()}
                    {badgeForPreview?.icon && (
                        <div className="absolute -top-2 -right-2 text-2xl">
                            {badgeForPreview.icon}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-bold">
                        {user.firstName} {user.lastName}
                    </h3>
                    {titleForPreview?.display && (
                        <Badge variant="outline" className="mt-1">
                            {titleForPreview.display}
                        </Badge>
                    )}
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <Sparkles className="w-12 h-12 mb-3 text-gray-300" />
                <p>กรุณาล็อกอินเพื่อตกแต่งโปรไฟล์</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Preview Section */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        ตัวอย่างโปรไฟล์
                    </CardTitle>
                    <CardDescription>ดูตัวอย่างการตกแต่งโปรไฟล์ของคุณ</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    {renderCustomizedAvatar()}
                </CardContent>
            </Card>

            {/* รางวัลที่คุณมี (ของที่แลกมา — ใช้เลือกในแท็บด้านล่าง) */}
            {userRewards.filter((r) => r.isActive).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-amber-500" />
                            รางวัลที่คุณมี
                        </CardTitle>
                        <CardDescription>
                            ของที่แลกมาจะใช้เลือกในแท็บ ธีม / ตรา / กรอบ / ตำแหน่ง ด้านล่าง
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {userRewards
                                .filter((r) => r.isActive)
                                .map((r) => (
                                    <Badge key={r.id} variant="secondary" className="text-sm">
                                        {getRewardDisplayName(r.rewardId)}
                                    </Badge>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Customization Options */}
            <Tabs defaultValue="themes" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="themes" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        ธีม
                    </TabsTrigger>
                    <TabsTrigger value="badges" className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        ตรา
                    </TabsTrigger>
                    <TabsTrigger value="frames" className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        กรอบ
                    </TabsTrigger>
                    <TabsTrigger value="titles" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        ตำแหน่ง
                    </TabsTrigger>
                </TabsList>

                {/* ธีม */}
                <TabsContent value="themes" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {themeOptions.map((theme) => {
                            const isLocked = theme.id !== "default" && !hasReward(theme.id)
                            return (
                                <Card
                                    key={theme.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${customization.theme === theme.id ? "ring-2 ring-purple-500" : ""
                                        } ${isLocked ? "opacity-50" : ""}`}
                                    onClick={() => !isLocked && setCustomization(prev => ({ ...prev, theme: theme.id }))}
                                >
                                    <CardContent className="p-4 text-center">
                                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${theme.gradient} mx-auto mb-2`} />
                                        <p className="text-sm font-medium">{theme.name}</p>
                                        {isLocked && (
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                ต้องซื้อ
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                {/* ตรา */}
                <TabsContent value="badges" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {badgeOptions.map((badge) => {
                            const isLocked = badge.id !== "" && !hasReward(badge.id)
                            return (
                                <Card
                                    key={badge.id || "none"}
                                    className={`cursor-pointer transition-all hover:shadow-md ${customization.badge === badge.id ? "ring-2 ring-purple-500" : ""
                                        } ${isLocked ? "opacity-50" : ""}`}
                                    onClick={() => !isLocked && setCustomization(prev => ({ ...prev, badge: badge.id }))}
                                >
                                    <CardContent className="p-4 text-center">
                                        {badge.id ? (
                                            <div className="text-3xl mb-2">{badge.icon}</div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">ไม่มี</span>
                                            </div>
                                        )}
                                        <p className="text-sm font-medium">{badge.name}</p>
                                        {isLocked && (
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                ต้องซื้อ
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                {/* กรอบ */}
                <TabsContent value="frames" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {frameOptions.map((frame) => {
                            const isLocked = frame.id !== "none" && !hasReward(frame.id)
                            return (
                                <Card
                                    key={frame.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${customization.frame === frame.id ? "ring-2 ring-purple-500" : ""
                                        } ${isLocked ? "opacity-50" : ""}`}
                                    onClick={() => !isLocked && setCustomization(prev => ({ ...prev, frame: frame.id }))}
                                >
                                    <CardContent className="p-4 text-center">
                                        {frame.frameColor ? (
                                            <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-muted/50" style={getFrameStyle({ frameColor: frame.frameColor, frameWidth: frame.frameWidth })}>
                                                <div className="w-full h-full rounded-full bg-muted" />
                                            </div>
                                        ) : (
                                            <div className={`w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2 ${frame.preview}`} />
                                        )}
                                        <p className="text-sm font-medium">{frame.name}</p>
                                        {isLocked && (
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                ต้องซื้อ
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                {/* ตำแหน่ง */}
                <TabsContent value="titles" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {titleOptions.map((title) => {
                            const isLocked = title.id !== "none" && !hasReward(title.id)
                            return (
                                <Card
                                    key={title.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${customization.title === title.id ? "ring-2 ring-purple-500" : ""
                                        } ${isLocked ? "opacity-50" : ""}`}
                                    onClick={() => !isLocked && setCustomization(prev => ({ ...prev, title: title.id }))}
                                >
                                    <CardContent className="p-4 text-center">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mb-2 flex items-center justify-center text-white text-xs font-medium">
                                            {title.display || "ไม่มี"}
                                        </div>
                                        <p className="text-sm font-medium">{title.name}</p>
                                        {isLocked && (
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                ต้องซื้อ
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>
            </Tabs>

            {/* ปุ่มบันทึก */}
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose}>
                    ยกเลิก
                </Button>
                <Button onClick={saveCustomization}>
                    บันทึกการตกแต่ง
                </Button>
            </div>
        </div>
    )
}