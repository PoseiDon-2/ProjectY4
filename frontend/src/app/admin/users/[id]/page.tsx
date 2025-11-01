"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Heart,
    Gift,
    FileText,
    AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"

interface UserDetailProps {
    params: {
        id: string
    }
}

// Mock user data
const mockUserDetail = {
    id: 1,
    email: "user@example.com",
    firstName: "สมชาย",
    lastName: "ใจดี",
    phone: "081-234-5678",
    avatar: "/placeholder.svg?height=100&width=100",
    joinDate: "2024-01-01",
    lastLogin: "2024-01-20T10:30:00Z",
    totalDonated: 15000,
    donationCount: 8,
    favoriteCategories: ["การแพทย์", "การศึกษา"],
    interests: ["medical-health", "education-learning", "disaster-relief"],
    role: "user",
    isVerified: true,
    isEmailVerified: true,
    status: "active",
    location: "กรุงเทพมหานคร",
    donationHistory: [
        {
            id: 1,
            requestTitle: "ช่วยเหลือผู้ประสบภัยน้ำท่วม",
            amount: 5000,
            date: "2024-01-15",
            type: "money",
            status: "completed",
        },
        {
            id: 2,
            requestTitle: "ซื้ออุปกรณ์การแพทย์",
            amount: 3000,
            date: "2024-01-10",
            type: "money",
            status: "completed",
        },
        {
            id: 3,
            requestTitle: "สร้างห้องเรียนใหม่",
            items: "หนังสือเรียน 20 เล่ม",
            date: "2024-01-05",
            type: "items",
            status: "completed",
        },
    ],
    favoriteRequests: [
        {
            id: 1,
            title: "ช่วยเหลือสัตว์จรจัด",
            category: "สัตว์",
            addedDate: "2024-01-18",
        },
        {
            id: 2,
            title: "ปลูกป่าชุมชน",
            category: "สิ่งแวดล้อม",
            addedDate: "2024-01-16",
        },
    ],
    activityLog: [
        {
            id: 1,
            action: "donation",
            description: "บริจาค ฿5,000 ให้โครงการช่วยเหลือผู้ประสบภัยน้ำท่วม",
            date: "2024-01-15T14:30:00Z",
        },
        {
            id: 2,
            action: "favorite",
            description: "เพิ่มโครงการ 'ช่วยเหลือสัตว์จรจัด' ในรายการที่สนใจ",
            date: "2024-01-18T09:15:00Z",
        },
        {
            id: 3,
            action: "login",
            description: "เข้าสู่ระบบ",
            date: "2024-01-20T10:30:00Z",
        },
    ],
}

const roleLabels = {
    user: "ผู้ใช้",
    organizer: "ผู้จัดการ",
    admin: "ผู้ดูแลระบบ",
}

const roleColors = {
    user: "bg-blue-100 text-blue-700",
    organizer: "bg-green-100 text-green-700",
    admin: "bg-purple-100 text-purple-700",
}

const statusLabels = {
    active: "ใช้งานอยู่",
    suspended: "ระงับการใช้งาน",
    banned: "ถูกแบน",
}

const statusColors = {
    active: "bg-green-100 text-green-700",
    suspended: "bg-yellow-100 text-yellow-700",
    banned: "bg-red-100 text-red-700",
}

export default function UserDetail({ params }: UserDetailProps) {
    const router = useRouter()
    const { user: currentUser } = useAuth()
    const [activeTab, setActiveTab] = useState("profile")
    const [isDeleting, setIsDeleting] = useState(false)

    const user = mockUserDetail

    // Check if current user has permission to view this page
    if (!currentUser || currentUser.role !== "admin") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                        <p className="text-gray-600 mb-4">คุณไม่มีสิทธิ์ในการดูข้อมูลผู้ใช้</p>
                        <Button onClick={() => router.push("/")} className="bg-pink-500 hover:bg-pink-600">
                            กลับหน้าหลัก
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const handleDeleteUser = async () => {
        if (!confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้? การกระทำนี้ไม่สามารถยกเลิกได้")) {
            return
        }

        setIsDeleting(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log("Deleting user:", user.id)
        setIsDeleting(false)
        // In real app, would redirect after successful deletion
        router.push("/admin-dashboard")
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`
    }

    const getActionIcon = (action: string) => {
        const icons = {
            donation: Gift,
            favorite: Heart,
            login: User,
            edit: Edit,
            register: User,
        }
        return icons[action as keyof typeof icons] || User
    }

    const getActionColor = (action: string) => {
        const colors = {
            donation: "text-green-500",
            favorite: "text-pink-500",
            login: "text-blue-500",
            edit: "text-orange-500",
            register: "text-purple-500",
        }
        return colors[action as keyof typeof colors] || "text-gray-500"
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-pink-50">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับ
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">ข้อมูลผู้ใช้</h1>
                                <p className="text-sm text-gray-600">จัดการและดูรายละเอียดผู้ใช้</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                                {statusLabels[user.status as keyof typeof statusLabels]}
                            </Badge>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/admin/users/edit/${user.id}`)}
                                    className="bg-transparent"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    แก้ไข
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDeleteUser}
                                    disabled={isDeleting}
                                    className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                                            กำลังลบ...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            ลบ
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardContent className="p-6 text-center">
                                <div className="space-y-4">
                                    <div className="relative inline-block">
                                        <Avatar className="w-24 h-24 mx-auto">
                                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={`${user.firstName} ${user.lastName}`} />
                                            <AvatarFallback className="text-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                                                {getInitials(user.firstName, user.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-2 -right-2">
                                            {user.isVerified ? (
                                                <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-500 bg-white rounded-full" />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {user.firstName} {user.lastName}
                                        </h2>
                                        <p className="text-gray-600">{user.email}</p>
                                        <Badge className={`mt-2 ${roleColors[user.role as keyof typeof roleColors]}`}>
                                            {roleLabels[user.role as keyof typeof roleLabels]}
                                        </Badge>
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
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-lg">สถิติ</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">สมาชิกตั้งแต่</span>
                                    <span className="text-sm font-medium">{formatDate(user.joinDate)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">เข้าสู่ระบบล่าสุด</span>
                                    <span className="text-sm font-medium">{formatDateTime(user.lastLogin)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">รายการที่สนใจ</span>
                                    <span className="text-sm font-medium">{user.favoriteRequests.length} รายการ</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">การยืนยันอีเมล</span>
                                    <div className="flex items-center gap-1">
                                        {user.isEmailVerified ? (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="text-sm font-medium">{user.isEmailVerified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-4 bg-white">
                                <TabsTrigger value="profile">ข้อมูลส่วนตัว</TabsTrigger>
                                <TabsTrigger value="donations">ประวัติการบริจาค</TabsTrigger>
                                <TabsTrigger value="favorites">รายการที่สนใจ</TabsTrigger>
                                <TabsTrigger value="activity">กิจกรรม</TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="w-5 h-5 text-pink-500" />
                                            ข้อมูลส่วนตัว
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
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
                                                {user.isEmailVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
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
                                            <label className="text-sm font-medium text-gray-700">ที่อยู่</label>
                                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-800">{user.location}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">ความสนใจ</label>
                                            <div className="flex flex-wrap gap-2">
                                                {user.interests.map((interest, index) => (
                                                    <Badge key={index} variant="secondary" className="bg-pink-100 text-pink-700">
                                                        {interest}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="donations" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Gift className="w-5 h-5 text-pink-500" />
                                            ประวัติการบริจาค ({user.donationHistory.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {user.donationHistory.map((donation) => (
                                                <div key={donation.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                                        {donation.type === "money" ? (
                                                            <Gift className="w-5 h-5 text-green-500" />
                                                        ) : (
                                                            <FileText className="w-5 h-5 text-blue-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-medium text-gray-800">{donation.requestTitle}</h4>
                                                            <div className="text-right">
                                                                {donation.amount && (
                                                                    <span className="font-bold text-green-600">฿{formatAmount(donation.amount)}</span>
                                                                )}
                                                                {donation.items && <span className="font-bold text-blue-600">{donation.items}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">{formatDate(donation.date)}</span>
                                                            <Badge className="bg-green-100 text-green-700">
                                                                {donation.status === "completed" ? "สำเร็จ" : "รอดำเนินการ"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="favorites" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-pink-500" />
                                            รายการที่สนใจ ({user.favoriteRequests.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {user.favoriteRequests.map((favorite) => (
                                                <div key={favorite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <Heart className="w-5 h-5 text-pink-500" />
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">{favorite.title}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="secondary">{favorite.category}</Badge>
                                                                <span className="text-sm text-gray-500">เพิ่มเมื่อ {formatDate(favorite.addedDate)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm" className="bg-transparent">
                                                        ดูรายละเอียด
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="activity" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-blue-500" />
                                            กิจกรรมล่าสุด
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {user.activityLog.map((activity) => {
                                                const ActionIcon = getActionIcon(activity.action)
                                                const iconColor = getActionColor(activity.action)
                                                return (
                                                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                                        <div className={`w-10 h-10 bg-white rounded-full flex items-center justify-center`}>
                                                            <ActionIcon className={`w-5 h-5 ${iconColor}`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-gray-800">{activity.description}</p>
                                                            <span className="text-sm text-gray-500">{formatDateTime(activity.date)}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}
