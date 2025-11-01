'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { ProfileCustomization } from "@/components/profile-customization"
import { PointsDisplay } from "@/components/points-display"
import { pointsSystem } from "@/lib/points-system"
import type { UserPoints, ProfileCustomization as ProfileCustomizationType } from "@/types/rewards"
import {
    User,
    Mail,
    Phone,
    Calendar,
    Heart,
    Gift,
    LogOut,
    Edit3,
    ArrowLeft,
    Trophy,
    BarChart3,
    Shield,
    DollarSign,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    Palette,
} from "lucide-react"

interface Donation {
    id: string
    requestId: string
    requestTitle: string
    type: "money" | "item"
    date: string
    status: "completed" | "pending" | "shipped" | "received" | "cancelled"
    amount?: number
    items?: { name: string; quantity: number; status?: string }[]
    paymentMethod?: string
    trackingNumber?: string
}

export default function Profile() {
    const router = useRouter()
    const { user, logout, isLoading, fetchUser } = useAuth()
    const [activeTab, setActiveTab] = useState<"profile" | "donations" | "favorites">("profile")
    const [showCustomization, setShowCustomization] = useState(false)
    const [userPoints, setUserPoints] = useState<UserPoints | null>(null)
    const [profileCustomization, setProfileCustomization] = useState<ProfileCustomizationType | null>(null)
    const [donations, setDonations] = useState<Donation[]>([])

    // บังคับดึงข้อมูลใหม่ทุกครั้งที่ mount
    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    // ใช้ useEffect แทนการ redirect ใน render
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login")
        }
    }, [user, isLoading, router])

    // แสดง Loading ขณะรอ
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
                <div className="text-lg font-medium text-gray-600">กำลังโหลดโปรไฟล์...</div>
            </div>
        )
    }

    // ถ้าไม่มี user → redirect แล้ว
    if (!user) {
        return null
    }

    // แปลง role เป็น lowercase
    const displayRole = user.role.toLowerCase() as "user" | "organizer" | "admin"

    useEffect(() => {
        if (user) {
            pointsSystem.loadFromStorage()
            setUserPoints(pointsSystem.getUserPoints(user.id))

            const saved = localStorage.getItem(`profile_customization_${user.id}`)
            if (saved) {
                try {
                    setProfileCustomization(JSON.parse(saved))
                } catch (e) {
                    console.error("Failed to parse customization:", e)
                }
            }

            // ดึง donations
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/donations`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                    "Content-Type": "application/json",
                },
            })
                .then((res) => res.json())
                .then((data: Donation[]) => setDonations(data))
                .catch((err) => console.error("Failed to fetch donations:", err))
        }
    }, [user])

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`
    }

    const getUserLevel = (totalDonated: number) => {
        if (totalDonated >= 50000) return { level: "ทอง", color: "bg-yellow-500", icon: "Trophy" }
        if (totalDonated >= 20000) return { level: "เงิน", color: "bg-gray-400", icon: "Second Place Medal" }
        if (totalDonated >= 5000) return { level: "ทองแดง", color: "bg-orange-500", icon: "Third Place Medal" }
        return { level: "เริ่มต้น", color: "bg-blue-500", icon: "Star" }
    }

    const renderCustomizedAvatar = () => {
        const theme = profileCustomization?.theme ?? "default"
        const frame = profileCustomization?.frame ?? "none"
        const badge = profileCustomization?.badge ?? ""

        const themeGradient = {
            default: "from-pink-500 to-purple-500",
            gold: "from-yellow-400 to-orange-500",
            platinum: "from-gray-300 to-gray-500",
            diamond: "from-blue-400 to-cyan-300",
        }[theme]

        const frameClass = {
            none: "border-2 border-gray-200",
            rainbow: "border-4 border-gradient-to-r from-red-500 via-yellow-500 to-blue-500",
            fire: "border-4 border-orange-500 shadow-lg shadow-orange-200",
            ice: "border-4 border-cyan-400 shadow-lg shadow-cyan-200",
        }[frame]

        const badgeIcon = {
            "": "",
            heart: "Yellow Heart",
            crown: "Crown",
            star: "Star",
            diamond: "Gem Stone",
        }[badge]

        return (
            <div className="relative inline-block">
                <div className={`p-1 rounded-full ${frameClass}`}>
                    <Avatar className="w-24 h-24 mx-auto">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={`${user.firstName} ${user.lastName}`} />
                        <AvatarFallback className={`text-2xl bg-gradient-to-r ${themeGradient} text-white`}>
                            {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {badgeIcon && (
                    <div className="absolute -top-2 -right-2 text-2xl">{badgeIcon}</div>
                )}

                <Badge className={`absolute -bottom-2 -right-2 ${userLevel.color} text-white text-xs`}>
                    {userLevel.icon === "Trophy" ? "Trophy" : userLevel.icon === "Second Place Medal" ? "Second Place Medal" : userLevel.icon === "Third Place Medal" ? "Third Place Medal" : "Star"} {userLevel.level}
                </Badge>
            </div>
        )
    }

    const getDonationStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return { text: "สำเร็จ", class: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3 mr-1" /> }
            case "pending":
                return { text: "รอดำเนินการ", class: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3 mr-1" /> }
            case "shipped":
                return { text: "จัดส่งแล้ว", class: "bg-blue-100 text-blue-700", icon: <Truck className="w-3 h-3 mr-1" /> }
            case "received":
                return { text: "ได้รับแล้ว", class: "bg-purple-100 text-purple-700", icon: <CheckCircle className="w-3 h-3 mr-1" /> }
            case "cancelled":
                return { text: "ยกเลิก", class: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3 mr-1" /> }
            default:
                return { text: status, class: "bg-gray-100 text-gray-700", icon: null }
        }
    }

    const userLevel = getUserLevel(user.totalDonated)

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="hover:bg-pink-50">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับหน้าหลัก
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">โปรไฟล์ของฉัน</h1>
                                <p className="text-sm text-gray-600">จัดการข้อมูลส่วนตัวและดูประวัติการบริจาค</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/rewards")}
                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 bg-transparent"
                            >
                                <Gift className="w-4 h-4 mr-2" />
                                ร้านรางวัล
                            </Button>
                            {displayRole === "organizer" && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/organizer-dashboard")}
                                    className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    แดชบอร์ดผู้จัดการ
                                </Button>
                            )}
                            {displayRole === "admin" && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/admin-dashboard")}
                                    className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    แดชบอร์ดผู้ดูแลระบบ
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                ออกจากระบบ
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <Card className="text-center">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {renderCustomizedAvatar()}
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {user.firstName} {user.lastName}
                                        </h2>
                                        <p className="text-gray-600">{user.email}</p>
                                        {profileCustomization?.title && profileCustomization.title !== "none" && (
                                            <Badge variant="outline" className="mt-1">
                                                {profileCustomization.title === "helper"
                                                    ? "ผู้ช่วยเหลือ"
                                                    : profileCustomization.title === "guardian"
                                                        ? "ผู้พิทักษ์"
                                                        : profileCustomization.title === "legend"
                                                            ? "ตำนาน"
                                                            : ""}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-pink-600">฿{formatAmount(user.totalDonated)}</div>
                                            <div className="text-xs text-gray-500">ยอดบริจาครวม</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">{user.donationCount}</div>
                                            <div className="text-xs text-gray-500">ครั้งที่บริจาค</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Button variant="outline" className="w-full bg-transparent">
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            แก้ไขโปรไฟล์
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full bg-transparent"
                                            onClick={() => setShowCustomization(true)}
                                        >
                                            <Palette className="w-4 h-4 mr-2" />
                                            ตกแต่งโปรไฟล์
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {userPoints && (
                            <div className="mt-6">
                                <PointsDisplay userPoints={userPoints} />
                            </div>
                        )}

                        {/* Quick Stats */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    สถิติการบริจาค
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">เป้าหมายถัดไป</span>
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                                        {user.totalDonated >= 50000 ? "สูงสุดแล้ว!" : `฿${formatAmount(50000 - user.totalDonated)} เหลือ`}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">หมวดหมู่ที่ชื่นชอบ</span>
                                    <div className="flex gap-1">
                                        {(user.favoriteCategories ?? []).map((category, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {category}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">สมาชิกตั้งแต่</span>
                                    <span className="text-sm font-medium">
                                        {new Date(user.joinDate).toLocaleDateString("th-TH", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tab Navigation */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="flex border-b">
                                    <button
                                        onClick={() => setActiveTab("profile")}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "profile"
                                            ? "border-b-2 border-pink-500 text-pink-600 bg-pink-50"
                                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                            }`}
                                    >
                                        <User className="w-4 h-4 mr-2 inline" />
                                        ข้อมูลส่วนตัว
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("donations")}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "donations"
                                            ? "border-b-2 border-pink-500 text-pink-600 bg-pink-50"
                                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                            }`}
                                    >
                                        <Gift className="w-4 h-4 mr-2 inline" />
                                        ประวัติการบริจาค
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("favorites")}
                                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "favorites"
                                            ? "border-b-2 border-pink-500 text-pink-600 bg-pink-50"
                                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                            }`}
                                    >
                                        <Heart className="w-4 h-4 mr-2 inline" />
                                        รายการที่สนใจ
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tab Content */}
                        {activeTab === "profile" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-pink-500" />
                                        ข้อมูลส่วนตัว
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">ชื่อ</label>
                                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-800">{user.firstName}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">นามสกุล</label>
                                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-800">{user.lastName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">อีเมล</label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-800">{user.email}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-800">{user.phone}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">วันที่สมัครสมาชิก</label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-800">
                                                {new Date(user.joinDate).toLocaleDateString("th-TH", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "donations" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Gift className="w-5 h-5 text-pink-500" />
                                        ประวัติการบริจาค
                                    </CardTitle>
                                    <p className="text-sm text-gray-600">รายการการบริจาคทั้งหมดของคุณ</p>
                                </CardHeader>
                                <CardContent>
                                    {donations.length > 0 ? (
                                        <div className="space-y-4">
                                            {donations.map((donation) => {
                                                const statusBadge = getDonationStatusBadge(donation.status)
                                                return (
                                                    <Card key={donation.id} className="p-4 hover:shadow-md transition-shadow">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <Link
                                                                href={`/donation/${donation.requestId}`}
                                                                className="text-lg font-semibold text-gray-800 hover:text-pink-600 transition-colors"
                                                            >
                                                                {donation.requestTitle}
                                                            </Link>
                                                            <Badge className={`${statusBadge.class} text-xs px-2 py-1`}>
                                                                {statusBadge.icon}
                                                                {statusBadge.text}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            {new Date(donation.date).toLocaleDateString("th-TH", {
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </p>

                                                        {donation.type === "money" ? (
                                                            <div className="flex items-center gap-2 text-gray-700 text-sm">
                                                                <DollarSign className="w-4 h-4" />
                                                                <span>
                                                                    บริจาคเงิน: <span className="font-bold">฿{formatAmount(donation.amount || 0)}</span>
                                                                </span>
                                                                {donation.paymentMethod && (
                                                                    <span className="text-gray-500">({donation.paymentMethod})</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-gray-700 text-sm">
                                                                    <Package className="w-4 h-4" />
                                                                    <span>บริจาคสิ่งของ:</span>
                                                                </div>
                                                                <ul className="list-disc list-inside text-sm text-gray-600 ml-6">
                                                                    {donation.items?.map((item, idx) => (
                                                                        <li key={idx}>
                                                                            {item.name} ({item.quantity} ชิ้น)
                                                                            {item.status && (
                                                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                                                    {item.status === "shipped"
                                                                                        ? "จัดส่งแล้ว"
                                                                                        : item.status === "received"
                                                                                            ? "ได้รับแล้ว"
                                                                                            : "รอดำเนินการ"}
                                                                                </Badge>
                                                                            )}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                {donation.trackingNumber && (
                                                                    <div className="flex items-center gap-2 text-gray-700 text-sm mt-2">
                                                                        <Truck className="w-4 h-4" />
                                                                        <span>
                                                                            เลขติดตามพัสดุ: <span className="font-medium">{donation.trackingNumber}</span>
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>ยังไม่มีประวัติการบริจาค</p>
                                            <p className="text-sm mt-1">เริ่มบริจาคเพื่อช่วยเหลือผู้อื่น</p>
                                            <Button onClick={() => router.push("/")} className="mt-4 bg-pink-500 hover:bg-pink-600">
                                                เริ่มบริจาค
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "favorites" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Heart className="w-5 h-5 text-pink-500" />
                                        รายการที่สนใจ
                                    </CardTitle>
                                    <p className="text-sm text-gray-600">คำขอบริจาคที่คุณสนใจ</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <p className="text-gray-600">คุณมีรายการที่สนใจ 3 รายการ</p>
                                        <Button variant="outline" onClick={() => router.push("/favorites")} className="bg-transparent">
                                            ดูทั้งหมด
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Customization Dialog */}
            <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ตกแต่งโปรไฟล์</DialogTitle>
                        <DialogDescription>ปรับแต่งรูปลักษณ์โปรไฟล์ของคุณด้วยรางวัลที่ได้รับ</DialogDescription>
                    </DialogHeader>
                    <ProfileCustomization onClose={() => setShowCustomization(false)} />
                </DialogContent>
            </Dialog>
        </div>
    )
}