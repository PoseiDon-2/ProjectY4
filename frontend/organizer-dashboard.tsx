"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    Eye,
    Edit,
    Trash2,
    BarChart3,
    Users,
    DollarSign,
    Clock,
    ArrowLeft,
    UserCheck,
    Calendar,
    Phone,
    Briefcase,
    Car,
    PowerCircle as Motorcycle,
    Truck,
    ClipboardList,
    MessageSquare,
    CheckCircle,
    XCircle,
    Mail,
    LinkIcon,
    Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "./src/app/auth-context"
import OrganizerReceiptManagement from "@/components/organizer-receipt-management" // Import receipt management component

interface DonationRequest {
    id: number
    title: string
    description: string
    category: string
    goalAmount: number
    currentAmount: number
    supporters: number
    status: "pending" | "active" | "completed" | "rejected"
    createdDate: string
    daysLeft: number
}

interface VolunteerApplication {
    id: number
    name: string
    email: string
    phone: string
    age: number
    experience: string
    emergencyContactName: string
    emergencyContactPhone: string
    hasVehicle: "motorcycle" | "car" | "pickup" | "van" | "none"
    skills: string[]
    otherSkills: string
    availableDates: string[]
    availableTime: "morning" | "afternoon" | "evening" | "flexible"
    duration: "half-day" | "full-day" | "multiple-days" | "flexible"
    status: "pending" | "approved" | "rejected"
    appliedDate: string
    requestId: number // Added requestId to link to a specific donation request
}

// Mock data for organizer's requests
const organizerRequests: DonationRequest[] = [
    {
        id: 1,
        title: "ช่วยเหลือครอบครัวที่ประสบอุทกภัย",
        description: "ครอบครัวของเราประสบอุทกภัยใหญ่ ทำให้บ้านและข้าวของเสียหายหมด",
        category: "ภัยพิบัติ",
        goalAmount: 50000,
        currentAmount: 23500,
        supporters: 47,
        status: "active",
        createdDate: "2024-01-10",
        daysLeft: 15,
    },
    {
        id: 2,
        title: "สร้างห้องสมุดให้โรงเรียนชนบท",
        description: "โรงเรียนบ้านดอนตาลต้องการสร้างห้องสมุดใหม่",
        category: "การศึกษา",
        goalAmount: 120000,
        currentAmount: 67000,
        supporters: 89,
        status: "active",
        createdDate: "2024-01-05",
        daysLeft: 30,
    },
    {
        id: 3,
        title: "ซื้ออุปกรณ์การแพทย์",
        description: "โรงพยาบาลต้องการอุปกรณ์การแพทย์เพิ่มเติม",
        category: "การแพทย์",
        goalAmount: 200000,
        currentAmount: 0,
        supporters: 0,
        status: "pending",
        createdDate: "2024-01-15",
        daysLeft: 45,
    },
]

// Mock data for volunteer applications
const mockVolunteerApplications: VolunteerApplication[] = [
    {
        id: 101,
        name: "สมชาย ใจดี",
        email: "somchai@example.com",
        phone: "081-111-2222",
        age: 28,
        experience: "เคยเป็นอาสาสมัครช่วยงานซ่อมแซมบ้านหลังน้ำท่วม 2 ครั้ง",
        emergencyContactName: "สมศรี ใจดี",
        emergencyContactPhone: "081-333-4444",
        hasVehicle: "car",
        skills: ["งานใช้แรงงาน", "งานขนส่ง"],
        otherSkills: "สามารถขับรถกระบะได้",
        availableDates: ["2025-08-10", "2025-08-11"],
        availableTime: "full-day",
        duration: "full-day",
        status: "pending",
        appliedDate: "2025-08-01T10:00:00Z",
        requestId: 1, // Linked to "ช่วยเหลือครอบครัวที่ประสบอุทกภัย"
    },
    {
        id: 102,
        name: "อรุณี มีสุข",
        email: "arunee@example.com",
        phone: "089-555-6666",
        age: 35,
        experience: "เคยจัดกิจกรรมสำหรับเด็กและเยาวชน",
        emergencyContactName: "มานะ มีสุข",
        emergencyContactPhone: "089-777-8888",
        hasVehicle: "none",
        skills: ["งานเฉพาะทาง", "งานสร้างสรรค์"],
        otherSkills: "มีความสามารถในการสอนศิลปะ",
        availableDates: ["2025-08-15"],
        availableTime: "afternoon",
        duration: "half-day",
        status: "pending",
        appliedDate: "2025-08-02T14:30:00Z",
        requestId: 2, // Linked to "สร้างห้องสมุดให้โรงเรียนชนบท"
    },
    {
        id: 103,
        name: "วีระชัย กล้าหาญ",
        email: "weerachai@example.com",
        phone: "087-999-0000",
        age: 40,
        experience: "เคยเป็นอาสาสมัครในโรงพยาบาลสนาม",
        emergencyContactName: "สมใจ กล้าหาญ",
        emergencyContactPhone: "087-111-2222",
        hasVehicle: "pickup",
        skills: ["งานเฉพาะทาง", "งานขนส่ง"],
        otherSkills: "มีความรู้ด้านการปฐมพยาบาลเบื้องต้น",
        availableDates: ["2025-08-20", "2025-08-21", "2025-08-22"],
        availableTime: "flexible",
        duration: "multiple-days",
        status: "approved",
        appliedDate: "2025-08-03T09:00:00Z",
        requestId: 3, // Linked to "ซื้ออุปกรณ์การแพทย์"
    },
]

export default function OrganizerDashboard() {
    const router = useRouter()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<
        "overview" | "requests" | "volunteer-applicants" | "analytics" | "receipts"
    >("overview")
    const [selectedRequestForReceipts, setSelectedRequestForReceipts] = useState<DonationRequest | null>(null)

    // Redirect if not organizer
    if (!user || user.role !== "organizer") {
        router.push("/")
        return null
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

    const getStatusColor = (status: string) => {
        const colors = {
            pending: "bg-yellow-100 text-yellow-700",
            active: "bg-green-100 text-green-700",
            completed: "bg-blue-100 text-blue-700",
            rejected: "bg-red-100 text-red-700",
            approved: "bg-green-100 text-green-700", // For volunteer status
        }
        return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700"
    }

    const getStatusText = (status: string) => {
        const texts = {
            pending: "รอการอนุมัติ",
            active: "กำลังระดมทุน",
            completed: "เสร็จสิ้น",
            rejected: "ถูกปฏิเสธ",
            approved: "อนุมัติแล้ว", // For volunteer status
        }
        return texts[status as keyof typeof texts] || status
    }

    const totalRaised = organizerRequests.reduce((sum, req) => sum + req.currentAmount, 0)
    const totalSupporters = organizerRequests.reduce((sum, req) => sum + req.supporters, 0)
    const activeRequests = organizerRequests.filter((req) => req.status === "active").length
    const pendingVolunteerApplications = mockVolunteerApplications.filter((app) => app.status === "pending").length

    const getVehicleIcon = (vehicleType: string) => {
        switch (vehicleType) {
            case "motorcycle":
                return <Motorcycle className="w-4 h-4 text-gray-500" />
            case "car":
                return <Car className="w-4 h-4 text-gray-500" />
            case "pickup":
                return <Truck className="w-4 h-4 text-gray-500" />
            case "van":
                return <Car className="w-4 h-4 text-gray-500" /> // Using car icon for van for simplicity
            default:
                return null
        }
    }

    const getSkillIcon = (skill: string) => {
        switch (skill) {
            case "งานใช้แรงงาน":
                return <Briefcase className="w-4 h-4 text-gray-500" />
            case "งานเฉพาะทาง":
                return <ClipboardList className="w-4 h-4 text-gray-500" />
            case "งานสร้างสรรค์":
                return <MessageSquare className="w-4 h-4 text-gray-500" />
            case "งานประสานงาน":
                return <ClipboardList className="w-4 h-4 text-gray-500" />
            case "งานครัว":
                return <Briefcase className="w-4 h-4 text-gray-500" />
            case "งานขนส่ง":
                return <Truck className="w-4 h-4 text-gray-500" />
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="hover:bg-pink-50">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับหน้าหลัก
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ดผู้จัดการ</h1>
                                <p className="text-sm text-gray-600">{user.organizationName || `${user.firstName} ${user.lastName}`}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/story-management")}
                                className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                จัดการ Stories
                            </Button>
                            <Button
                                onClick={() => router.push("/create-request")}
                                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                สร้างคำขอใหม่
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4">
                {/* Tab Navigation */}
                <Card className="mb-6">
                    <CardContent className="p-0">
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "overview"
                                        ? "border-b-2 border-pink-500 text-pink-600 bg-pink-50"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4 mr-2 inline" />
                                ภาพรวม
                            </button>
                            <button
                                onClick={() => setActiveTab("requests")}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "requests"
                                        ? "border-b-2 border-pink-500 text-pink-600 bg-pink-50"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                            >
                                <Eye className="w-4 h-4 mr-2 inline" />
                                คำขอของฉัน
                            </button>
                            <button
                                onClick={() => setActiveTab("volunteer-applicants")}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "volunteer-applicants"
                                        ? "border-b-2 border-pink-500 text-pink-600 bg-pink-50"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                            >
                                <UserCheck className="w-4 h-4 mr-2 inline" />
                                ผู้สมัครอาสา
                                {pendingVolunteerApplications > 0 && (
                                    <Badge className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        {pendingVolunteerApplications}
                                    </Badge>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("receipts")}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "receipts"
                                        ? "border-b-2 border-pink-500 text-pink-600 bg-pink-50"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                            >
                                <Receipt className="w-4 h-4 mr-2 inline" />
                                จัดการสลิป
                            </button>
                            <button
                                onClick={() => setActiveTab("analytics")}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "analytics"
                                        ? "border-b-2 border-pink-500 text-pink-600 bg-pink-50"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4 mr-2 inline" />
                                สถิติ
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid gap-6 md:grid-cols-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">ยอดระดมทุนรวม</p>
                                            <p className="text-2xl font-bold text-green-600">฿{formatAmount(totalRaised)}</p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">ผู้สนับสนุนรวม</p>
                                            <p className="text-2xl font-bold text-blue-600">{totalSupporters}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">คำขอที่กำลังดำเนินการ</p>
                                            <p className="text-2xl font-bold text-purple-600">{activeRequests}</p>
                                        </div>
                                        <Clock className="w-8 h-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">คำขอทั้งหมด</p>
                                            <p className="text-2xl font-bold text-pink-600">{organizerRequests.length}</p>
                                        </div>
                                        <BarChart3 className="w-8 h-8 text-pink-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Stories ทั้งหมด</p>
                                            <p className="text-2xl font-bold text-purple-600">12</p>
                                        </div>
                                        <BarChart3 className="w-8 h-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">ผู้สมัครอาสาใหม่</p>
                                            <p className="text-2xl font-bold text-orange-600">{pendingVolunteerApplications}</p>
                                        </div>
                                        <UserCheck className="w-8 h-8 text-orange-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Requests */}
                        <Card>
                            <CardHeader>
                                <CardTitle>คำขอล่าสุด</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {organizerRequests.slice(0, 3).map((request) => {
                                        const progressPercentage = (request.currentAmount / request.goalAmount) * 100
                                        return (
                                            <div key={request.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-medium text-gray-800">{request.title}</h4>
                                                        <Badge className={getStatusColor(request.status)}>{getStatusText(request.status)}</Badge>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">ระดมทุนได้</span>
                                                            <span className="font-semibold">
                                                                ฿{formatAmount(request.currentAmount)} / ฿{formatAmount(request.goalAmount)}
                                                            </span>
                                                        </div>
                                                        <Progress value={progressPercentage} className="h-2" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-transparent"
                                                        onClick={() => router.push(`/requests/${request.id}`)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="bg-transparent">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                        {/* Recent Volunteer Applications */}
                        <Card>
                            <CardHeader>
                                <CardTitle>ผู้สมัครอาสาสมัครล่าสุด</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockVolunteerApplications.slice(0, 3).map((applicant) => {
                                        const relatedRequest = organizerRequests.find((req) => req.id === applicant.requestId)
                                        return (
                                            <div key={applicant.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-gray-800">{applicant.name}</h4>
                                                        <Badge className={getStatusColor(applicant.status)}>
                                                            {getStatusText(applicant.status)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        <Mail className="w-3 h-3 inline mr-1" />
                                                        {applicant.email}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <Phone className="w-3 h-3 inline mr-1" />
                                                        {applicant.phone}
                                                    </p>
                                                    {relatedRequest && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <LinkIcon className="w-3 h-3 inline mr-1" />
                                                            สมัครสำหรับ:{" "}
                                                            <Button
                                                                variant="link"
                                                                className="p-0 h-auto text-sm text-pink-600 hover:text-pink-700"
                                                                onClick={() => router.push(`/requests/${relatedRequest.id}`)}
                                                            >
                                                                {relatedRequest.title}
                                                            </Button>
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {applicant.skills.map((skill, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                {getSkillIcon(skill)} {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-transparent"
                                                    onClick={() => router.push(`/volunteer-applications/${applicant.id}`)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>การดำเนินการด่วน</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    onClick={() => router.push("/create-story")}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    สร้าง Story ใหม่
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/story-management")}
                                    className="w-full bg-transparent"
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    ดู Stories ทั้งหมด
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "requests" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">คำขอบริจาคทั้งหมด</h2>
                            <Button
                                onClick={() => router.push("/create-request")}
                                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-pink-600"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                สร้างคำขอใหม่
                            </Button>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {organizerRequests.map((request) => {
                                const progressPercentage = (request.currentAmount / request.goalAmount) * 100
                                return (
                                    <Card key={request.id} className="overflow-hidden">
                                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                            <span className="text-gray-400">รูปภาพ</span>
                                        </div>

                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="font-bold text-gray-800 line-clamp-2 flex-1">{request.title}</h3>
                                                    <Badge className={getStatusColor(request.status)}>{getStatusText(request.status)}</Badge>
                                                </div>

                                                <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">ระดมทุนได้</span>
                                                        <span className="font-semibold">
                                                            ฿{formatAmount(request.currentAmount)} / ฿{formatAmount(request.goalAmount)}
                                                        </span>
                                                    </div>
                                                    <Progress value={progressPercentage} className="h-2" />
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>{request.supporters} ผู้สนับสนุน</span>
                                                        <span>เหลือ {request.daysLeft} วัน</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 bg-transparent"
                                                        onClick={() => router.push(`/requests/${request.id}`)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        ดู
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 bg-transparent"
                                                        onClick={() => {
                                                            setSelectedRequestForReceipts(request)
                                                            setActiveTab("receipts")
                                                        }}
                                                    >
                                                        <Receipt className="w-4 h-4 mr-1" />
                                                        สลิป
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                                                        <Edit className="w-4 h-4 mr-1" />
                                                        แก้ไข
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                )}

                {activeTab === "volunteer-applicants" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">ผู้สมัครอาสาสมัครทั้งหมด</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {mockVolunteerApplications.map((applicant) => {
                                const relatedRequest = organizerRequests.find((req) => req.id === applicant.requestId)
                                return (
                                    <Card key={applicant.id} className="overflow-hidden">
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="font-bold text-gray-800 line-clamp-2 flex-1">{applicant.name}</h3>
                                                    <Badge className={getStatusColor(applicant.status)}>{getStatusText(applicant.status)}</Badge>
                                                </div>

                                                <p className="text-sm text-gray-600">
                                                    <Mail className="w-4 h-4 inline mr-1" />
                                                    {applicant.email}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <Phone className="w-4 h-4 inline mr-1" />
                                                    {applicant.phone}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 inline mr-1" />
                                                    สมัครเมื่อ {new Date(applicant.appliedDate).toLocaleDateString("th-TH")}
                                                </p>

                                                {relatedRequest && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <LinkIcon className="w-4 h-4 inline mr-1" />
                                                        สมัครสำหรับ:{" "}
                                                        <Button
                                                            variant="link"
                                                            className="p-0 h-auto text-sm text-pink-600 hover:text-pink-700"
                                                            onClick={() => router.push(`/requests/${relatedRequest.id}`)}
                                                        >
                                                            {relatedRequest.title}
                                                        </Button>
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap gap-1 pt-2">
                                                    {applicant.skills.map((skill, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {getSkillIcon(skill)} {skill}
                                                        </Badge>
                                                    ))}
                                                    {applicant.hasVehicle !== "none" && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {getVehicleIcon(applicant.hasVehicle)} มี{" "}
                                                            {applicant.hasVehicle === "motorcycle"
                                                                ? "มอเตอร์ไซค์"
                                                                : applicant.hasVehicle === "car"
                                                                    ? "รถยนต์"
                                                                    : applicant.hasVehicle === "pickup"
                                                                        ? "รถกระบะ"
                                                                        : "รถตู้"}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 bg-transparent"
                                                        onClick={() => router.push(`/volunteer-applications/${applicant.id}`)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        ดูรายละเอียด
                                                    </Button>
                                                    {applicant.status === "pending" && (
                                                        <>
                                                            <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                อนุมัติ
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                ปฏิเสธ
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                )}

                {activeTab === "receipts" && (
                    <div className="space-y-6">
                        {selectedRequestForReceipts ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedRequestForReceipts(null)}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        กลับ
                                    </Button>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">จัดการสลิปการรับเงิน</h2>
                                        <p className="text-gray-600">สำหรับ: {selectedRequestForReceipts.title}</p>
                                    </div>
                                </div>
                                <OrganizerReceiptManagement
                                    requestId={selectedRequestForReceipts.id.toString()}
                                    requestTitle={selectedRequestForReceipts.title}
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-800">เลือกคำขอเพื่อจัดการสลิป</h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {organizerRequests.map((request) => (
                                        <Card
                                            key={request.id}
                                            className="hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => setSelectedRequestForReceipts(request)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="font-bold text-gray-800 line-clamp-2 flex-1">{request.title}</h3>
                                                        <Badge className={getStatusColor(request.status)}>{getStatusText(request.status)}</Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">ระดมทุนได้</span>
                                                        <span className="font-semibold">฿{formatAmount(request.currentAmount)}</span>
                                                    </div>
                                                    <Button className="w-full" size="sm">
                                                        <Receipt className="w-4 h-4 mr-2" />
                                                        จัดการสลิป
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "analytics" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">สถิติและการวิเคราะห์</h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>ประสิทธิภาพการระดมทุน</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {organizerRequests
                                            .filter((req) => req.status === "active")
                                            .map((request) => {
                                                const progressPercentage = (request.currentAmount / request.goalAmount) * 100
                                                return (
                                                    <div key={request.id} className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="font-medium truncate">{request.title}</span>
                                                            <span className="text-gray-600">{Math.round(progressPercentage)}%</span>
                                                        </div>
                                                        <Progress value={progressPercentage} className="h-2" />
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>การแจกแจงตามหมวดหมู่</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {["ภัยพิบัติ", "การแพทย์", "การศึกษา", "สัตว์"].map((category) => {
                                            const categoryRequests = organizerRequests.filter((req) => req.category === category)
                                            const categoryTotal = categoryRequests.reduce((sum, req) => sum + req.currentAmount, 0)
                                            return (
                                                <div key={category} className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">{category}</span>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold">฿{formatAmount(categoryTotal)}</div>
                                                        <div className="text-xs text-gray-500">{categoryRequests.length} คำขอ</div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
