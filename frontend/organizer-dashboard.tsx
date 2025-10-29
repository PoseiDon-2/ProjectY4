"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "./src/app/auth-context"
import OrganizerReceiptManagement from "@/components/organizer-receipt-management" // Import receipt management component

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface DonationRequest {
    id: string // UUID
    title: string
    description: string
    category: {
        id: string
        name: string
    }
    target_amount: number
    current_amount: number
    supporters: number
    status: string // PENDING, APPROVED, REJECTED, DRAFT, etc.
    created_at: string
    expires_at: string | null
    accepts_money: boolean
    accepts_items: boolean
    accepts_volunteer: boolean
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

    // State for API data
    const [organizerRequests, setOrganizerRequests] = useState<DonationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Edit dialog state
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingRequest, setEditingRequest] = useState<DonationRequest | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editTargetAmount, setEditTargetAmount] = useState<string>("")
    const [editLocation, setEditLocation] = useState("")
    const [editUrgency, setEditUrgency] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    // Redirect if not organizer
    useEffect(() => {
        if (!user || user.role !== "organizer") {
            router.push("/")
        }
    }, [user, router])

    // Fetch organizer's donation requests
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true)
                const token = localStorage.getItem("auth_token")

                if (!token) {
                    setError("กรุณาเข้าสู่ระบบ")
                    return
                }

                const response = await axios.get(`${API_URL}/donation-requests/my/requests`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                console.log("📊 Organizer requests:", response.data)

                // API returns paginated data
                const requests = response.data.data || response.data
                setOrganizerRequests(Array.isArray(requests) ? requests : [])
            } catch (err: any) {
                console.error("Error fetching requests:", err)
                setError(err.response?.data?.message || "ไม่สามารถโหลดข้อมูลได้")
            } finally {
                setLoading(false)
            }
        }

        if (user && user.role === "organizer") {
            fetchRequests()
        }
    }, [user])

    // Show loading while checking auth
    if (!user) {
        return null
    }

    // Don't render if not organizer (will redirect via useEffect)
    if (user.role !== "organizer") {
        return null
    }

    const formatAmount = (amount: number | null | undefined) => {
        // Handle NaN, null, undefined
        const validAmount = Number(amount)
        if (isNaN(validAmount) || amount == null) {
            return "0"
        }
        return new Intl.NumberFormat("th-TH").format(validAmount)
    }

    const getStatusColor = (status: string) => {
        const statusUpper = status?.toUpperCase()
        const colors: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-700",
            APPROVED: "bg-green-100 text-green-700",
            REJECTED: "bg-red-100 text-red-700",
            DRAFT: "bg-gray-100 text-gray-700",
            COMPLETED: "bg-blue-100 text-blue-700",
        }
        return colors[statusUpper] || "bg-gray-100 text-gray-700"
    }

    const getStatusText = (status: string) => {
        const statusUpper = status?.toUpperCase()
        const texts: Record<string, string> = {
            PENDING: "รอการอนุมัติ",
            APPROVED: "อนุมัติแล้ว",
            REJECTED: "ถูกปฏิเสธ",
            DRAFT: "แบบร่าง",
            COMPLETED: "เสร็จสิ้น",
        }
        return texts[statusUpper] || status
    }

    const canEditStatus = (status: string) => {
        const s = status?.toUpperCase()
        return s === "DRAFT" || s === "REJECTED"
    }

    const openEdit = (req: DonationRequest) => {
        setEditingRequest(req)
        setEditTitle(req.title || "")
        setEditDescription(req.description || "")
        setEditTargetAmount(String(req.target_amount ?? ""))
        setEditLocation((req as any).location ?? "")
        setEditUrgency((req as any).urgency ?? "")
        setSaveError(null)
        setIsEditOpen(true)
    }

    const submitEdit = async () => {
        if (!editingRequest) return
        const token = localStorage.getItem("auth_token")
        if (!token) {
            setSaveError("กรุณาเข้าสู่ระบบ")
            return
        }
        if (!canEditStatus(editingRequest.status)) {
            setSaveError("แก้ไขได้เฉพาะคำขอสถานะ แบบร่าง หรือ ถูกปฏิเสธ")
            return
        }

        const payload: Record<string, any> = {}
        if (editTitle !== editingRequest.title) payload.title = editTitle
        if (editDescription !== editingRequest.description) payload.description = editDescription
        if (editTargetAmount !== String(editingRequest.target_amount ?? "")) payload.goal_amount = Number(editTargetAmount || 0)
        if ((editingRequest as any).location !== editLocation && editLocation) payload.location = editLocation
        if ((editingRequest as any).urgency !== editUrgency && editUrgency) payload.urgency = editUrgency

        if (Object.keys(payload).length === 0) {
            setIsEditOpen(false)
            return
        }

        try {
            setSaving(true)
            setSaveError(null)
            await axios.put(`${API_URL}/donation-requests/${editingRequest.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            })

            // Refresh local list optimistically
            setOrganizerRequests((prev) =>
                prev.map((r) => (r.id === editingRequest.id ? { ...r, ...payload, target_amount: payload.goal_amount ?? r.target_amount } : r))
            )
            setIsEditOpen(false)
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || "บันทึกไม่สำเร็จ"
            setSaveError(msg)
        } finally {
            setSaving(false)
        }
    }

    const totalRaised = organizerRequests.reduce((sum, req) => sum + (req.current_amount || 0), 0)
    const totalSupporters = organizerRequests.reduce((sum, req) => sum + (req.supporters || 0), 0)
    const activeRequests = organizerRequests.filter((req) => req.status === "APPROVED").length
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
                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                        <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Card className="mb-6 border-red-200 bg-red-50">
                        <CardContent className="p-6">
                            <p className="text-red-600">❌ {error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Tab Navigation */}
                {!loading && (
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
                )}

                {/* Tab Content */}
                {!loading && activeTab === "overview" && (
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
                                        const currentAmount = request.current_amount || 0
                                        const targetAmount = request.target_amount || 1
                                        const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
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
                                                                ฿{formatAmount(currentAmount)} / ฿{formatAmount(targetAmount)}
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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-transparent"
                                                        onClick={() => openEdit(request)}
                                                    >
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

                {!loading && activeTab === "requests" && (
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

                        {organizerRequests.length === 0 ? (
                            <Card className="p-8">
                                <div className="text-center">
                                    <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">ยังไม่มีคำขอบริจาค</h3>
                                    <p className="text-gray-500 mb-4">สร้างคำขอบริจาคแรกของคุณเพื่อเริ่มต้น</p>
                                    <Button
                                        onClick={() => router.push("/create-request")}
                                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        สร้างคำขอใหม่
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {organizerRequests.map((request) => {
                                const currentAmount = request.current_amount || 0
                                const targetAmount = request.target_amount || 1
                                const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

                                // Calculate days left
                                const daysLeft = request.expires_at
                                    ? Math.ceil((new Date(request.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                    : 0

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

                                                {request.accepts_money && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">ระดมทุนได้</span>
                                                        <span className="font-semibold">
                                                            ฿{formatAmount(currentAmount)} / ฿{formatAmount(targetAmount)}
                                                        </span>
                                                    </div>
                                                    <Progress value={progressPercentage} className="h-2" />
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>{request.supporters || 0} ผู้สนับสนุน</span>
                                                        {daysLeft > 0 && <span>เหลือ {daysLeft} วัน</span>}
                                                    </div>
                                                </div>
                                                )}

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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 bg-transparent"
                                                        onClick={() => openEdit(request)}
                                                        disabled={!canEditStatus(request.status)}
                                                    >
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
                        )}
                    </div>
                )}

                {!loading && activeTab === "volunteer-applicants" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">ผู้สมัครอาสาสมัครทั้งหมด</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {mockVolunteerApplications.map((applicant) => {
                                const relatedRequest = organizerRequests.find((req) => req.id === String(applicant.requestId))
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

                {!loading && activeTab === "receipts" && (
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
                                    requestId={selectedRequestForReceipts.id}
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
                                                        <span className="font-semibold">฿{formatAmount(request.current_amount || 0)}</span>
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

                {!loading && activeTab === "analytics" && (
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
                                            .filter((req) => req.status === "APPROVED" && req.accepts_money)
                                            .map((request) => {
                                                const currentAmount = request.current_amount || 0
                                                const targetAmount = request.target_amount || 1
                                                const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
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
                                            const categoryRequests = organizerRequests.filter((req) => req.category?.name === category)
                                            const categoryTotal = categoryRequests.reduce((sum, req) => sum + (req.current_amount || 0), 0)
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

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>แก้ไขคำขอบริจาค</DialogTitle>
                    </DialogHeader>
                    {editingRequest && (
                        <div className="space-y-4">
                            {!canEditStatus(editingRequest.status) && (
                                <div className="text-sm text-red-600">แก้ไขได้เฉพาะสถานะ แบบร่าง หรือ ถูกปฏิเสธ</div>
                            )}
                            {saveError && <div className="text-sm text-red-600">{saveError}</div>}
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">ชื่อคำขอ</Label>
                                <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">รายละเอียด</Label>
                                <Textarea id="edit-description" rows={4} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-target">เป้าหมายระดมทุน (บาท)</Label>
                                <Input
                                    id="edit-target"
                                    type="number"
                                    inputMode="numeric"
                                    value={editTargetAmount}
                                    onChange={(e) => setEditTargetAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-location">สถานที่</Label>
                                <Input id="edit-location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-urgency">ความเร่งด่วน (LOW/MEDIUM/HIGH)</Label>
                                <Input id="edit-urgency" placeholder="LOW | MEDIUM | HIGH" value={editUrgency} onChange={(e) => setEditUrgency(e.target.value.toUpperCase())} />
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={saving}>
                                    ยกเลิก
                                </Button>
                                <Button onClick={submitEdit} disabled={saving || !canEditStatus(editingRequest.status)}>
                                    {saving ? "กำลังบันทึก..." : "บันทึก"}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
