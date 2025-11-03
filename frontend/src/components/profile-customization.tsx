"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, Palette, Award, Sparkles, Star } from "lucide-react"
import type { ProfileCustomization as UserCustomization, UserReward } from "@/types/rewards"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface ProfileCustomizationProps {
    onClose?: () => void
}

const THEMES = [
    { id: "default",   name: "ธีมปกติ",      gradient: "from-pink-500 to-purple-500", preview: "#e879f9" },
    { id: "gold",      name: "ธีมทอง",       gradient: "from-yellow-400 to-orange-500", preview: "#f59e0b" },
    { id: "platinum",  name: "ธีมแพลทินัม", gradient: "from-gray-300 to-gray-500",   preview: "#6b7280" },
    { id: "diamond",   name: "ธีมเพชร",       gradient: "from-blue-400 to-cyan-300",   preview: "#06b6d4" },
] as const

const BADGES = [
    { id: "heart",   name: "หัวใจทอง", icon: "Yellow Heart", color: "text-yellow-500" },
    { id: "crown",   name: "มงกุฎ",      icon: "Crown",      color: "text-yellow-600" },
    { id: "star",    name: "ดาวทอง",    icon: "Star",       color: "text-yellow-500" },
    { id: "diamond", name: "เพชร",      icon: "Gem Stone",  color: "text-blue-500" },
] as const

const FRAMES = [
    { id: "none",    name: "ไม่มีกรอบ", preview: "border-2 border-gray-200" },
    { id: "rainbow", name: "กรอบสีรุ้ง", preview: "border-4 border-gradient-to-r from-red-500 via-yellow-500 to-blue-500" },
    { id: "fire",    name: "กรอบเปลวไฟ", preview: "border-4 border-orange-500 shadow-lg shadow-orange-200" },
    { id: "ice",     name: "กรอบน้ำแข็ง", preview: "border-4 border-cyan-400 shadow-lg shadow-cyan-200" },
] as const

const TITLES = [
    { id: "none",     name: "ไม่มีตำแหน่ง", display: "" },
    { id: "helper",   name: "ผู้ช่วยเหลือ",   display: "ผู้ช่วยเหลือ" },
    { id: "guardian", name: "ผู้พิทักษ์",    display: "ผู้พิทักษ์" },
    { id: "legend",   name: "ตำนาน",        display: "ตำนาน" },
] as const

export function ProfileCustomization({ onClose }: ProfileCustomizationProps) {
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

    // โหลดข้อมูลเมื่อ user พร้อม
    useEffect(() => {
        if (!user?.id) return

        const saved = localStorage.getItem(`profile_customization_${user.id}`)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setCustomization({ ...customization, ...parsed, userId: user.id })
            } catch (e) {
                console.error("Failed to parse customization:", e)
            }
        } else {
            setCustomization(prev => ({ ...prev, userId: user.id }))
        }

        const rewards = localStorage.getItem(`user_rewards_${user.id}`)
        if (rewards) {
            try {
                setUserRewards(JSON.parse(rewards))
            } catch (e) {
                console.error("Failed to parse rewards:", e)
            }
        }
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
        onClose?.()
    }

    const hasReward = (rewardId: string): boolean => {
        return userRewards.some((reward) => reward.rewardId === rewardId && reward.isActive)
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    const renderCustomizedAvatar = () => {
        if (!user) return null

        const theme = THEMES.find((t) => t.id === customization.theme) || THEMES[0]
        const frame = FRAMES.find((f) => f.id === customization.frame) || FRAMES[0]
        const badge = BADGES.find((b) => b.id === customization.badge)
        const title = TITLES.find((t) => t.id === customization.title) || TITLES[0]

        return (
            <div className="text-center space-y-4">
                <div className="relative inline-block">
                    <div className={`p-1 rounded-full ${frame.preview}`}>
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={user.avatar || "https://via.placeholder.com/400x300?text=No+Image"} alt={`${user.firstName} ${user.lastName}`} />
                            <AvatarFallback className={`text-2xl bg-gradient-to-r ${theme.gradient} text-white`}>
                                {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    {badge && (
                        <div className="absolute -top-2 -right-2 text-2xl">
                            {badge.icon}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-bold">
                        {user.firstName} {user.lastName}
                    </h3>
                    {title.display && (
                        <Badge variant="outline" className="mt-1">
                            {title.display}
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
                        {THEMES.map((theme) => {
                            const isLocked = theme.id !== "default" && !hasReward(`theme_${theme.id}`)
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
                        <Card
                            className={`cursor-pointer transition-all hover:shadow-md ${customization.badge === "" ? "ring-2 ring-purple-500" : ""
                                }`}
                            onClick={() => setCustomization(prev => ({ ...prev, badge: "" }))}
                        >
                            <CardContent className="p-4 text-center">
                                <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">ไม่มี</span>
                                </div>
                                <p className="text-sm font-medium">ไม่มีตรา</p>
                            </CardContent>
                        </Card>
                        {BADGES.map((badge) => {
                            const isLocked = !hasReward(`badge_${badge.id}`)
                            return (
                                <Card
                                    key={badge.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${customization.badge === badge.id ? "ring-2 ring-purple-500" : ""
                                        } ${isLocked ? "opacity-50" : ""}`}
                                    onClick={() => !isLocked && setCustomization(prev => ({ ...prev, badge: badge.id }))}
                                >
                                    <CardContent className="p-4 text-center">
                                        <div className="text-3xl mb-2">{badge.icon}</div>
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
                        {FRAMES.map((frame) => {
                            const isLocked = frame.id !== "none" && !hasReward(`frame_${frame.id}`)
                            return (
                                <Card
                                    key={frame.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${customization.frame === frame.id ? "ring-2 ring-purple-500" : ""
                                        } ${isLocked ? "opacity-50" : ""}`}
                                    onClick={() => !isLocked && setCustomization(prev => ({ ...prev, frame: frame.id }))}
                                >
                                    <CardContent className="p-4 text-center">
                                        <div className={`w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2 ${frame.preview}`} />
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
                        {TITLES.map((title) => {
                            const isLocked = title.id !== "none" && !hasReward(`title_${title.id}`)
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