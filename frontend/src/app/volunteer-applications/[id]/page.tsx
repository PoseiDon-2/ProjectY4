"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    User,
    Calendar,
    Briefcase,
    Car,
    BikeIcon as Motorcycle,
    Truck,
    ClipboardList,
    MessageSquare,
    CheckCircle,
    XCircle,
    AlertTriangle,
    LinkIcon,
    Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/auth-context"

interface VolunteerApplicationDetailProps {
    params: {
        id: string
    }
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
    requestId: number // Added requestId
}

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
    donationType: "money" | "items" | "volunteer"
    itemDetails?: {
        type: string
        condition: string
        quantity: number
        images: string[]
        deliveryMethod: "send-by-post" | "deliver-in-person"
        deliveryAddress?: string
        deliveryContact?: string
    }
    volunteerDetails?: {
        skillsNeeded: string[]
        location: string
        contact: string
    }
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
        availableTime: "flexible",
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
        skills: ["งานเฉพาะทาง", "งานสร้��งสรรค์"],
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

// Mock data for donation requests (same as in organizer-dashboard for consistency)
const mockDonationRequests: DonationRequest[] = [
    {
        id: 1,
        title: "ช่วยเหลือครอบครัวที่ประสบอุทกภัย",
        description:
            "ครอบครัวของเราประสบอุทกภัยใหญ่ ทำให้บ้านและข้าวของเสียหายหมด ต้องการความช่วยเหลือเร่งด่วนสำหรับที่พักชั่วคราวและสิ่งของจำเป็น",
        category: "ภัยพิบัติ",
        goalAmount: 50000,
        currentAmount: 23500,
        supporters: 47,
        status: "active",
        createdDate: "2024-01-10",
        daysLeft: 15,
        donationType: "money",
    },
    {
        id: 2,
        title: "สร้างห้องสมุดให้โรงเรียนชนบท",
        description: "โรงเรียนบ้านดอนตาลต้องการสร้างห้องสมุดใหม่ เพื่อให้นักเรียนมีแหล่งเรียนรู้และพัฒนาตนเอง",
        category: "การศึกษา",
        goalAmount: 120000,
        currentAmount: 67000,
        supporters: 89,
        status: "active",
        createdDate: "2024-01-05",
        daysLeft: 30,
        donationType: "items",
        itemDetails: {
            type: "หนังสือเรียน, อุปกรณ์การเรียน",
            condition: "ใหม่หรือสภาพดีมาก",
            quantity: 500,
            images: ["/placeholder.svg?height=100&width=150", "/placeholder.svg?height=100&width=150"],
            deliveryMethod: "deliver-in-person",
            deliveryAddress: "โรงเรียนบ้านดอนตาล, 123 หมู่ 4, ต.หนองบัว, อ.เมือง, จ.ขอนแก่น 40000",
            deliveryContact: "ครูสมศรี 089-123-4567",
        },
    },
    {
        id: 3,
        title: "ซื้ออุปกรณ์การแพทย์",
        description: "โรงพยาบาลต้องการอุปกรณ์การแพทย์เพิ่มเติม เพื่อรองรับผู้ป่วยที่เพิ่มขึ้นและยกระดับการรักษา",
        category: "การแพทย์",
        goalAmount: 200000,
        currentAmount: 0,
        supporters: 0,
        status: "pending",
        createdDate: "2024-01-15",
        daysLeft: 45,
        donationType: "volunteer",
        volunteerDetails: {
            skillsNeeded: ["งานเฉพาะทาง (แพทย์/พยาบาล)", "งานประสานงาน"],
            location: "โรงพยาบาลประจำจังหวัด",
            contact: "คุณหมอสมชาย 081-987-6543",
        },
    },
]

const vehicleLabels = {
    motorcycle: "รถจักรยานยนต์",
    car: "รถยนต์",
    pickup: "รถกระบะ",
    van: "รถตู้",
    none: "ไม่มี",
}

const skillLabels = {
    งานใช้แรงงาน: "งานใช้แรงงาน",
    งานเฉพาะทาง: "งานเฉพาะทาง",
    งานสร้างสรรค์: "งานสร้างสรรค์",
    งานประสานงาน: "งานประสานงาน",
    งานครัว: "งานครัว",
    งานขนส่ง: "งานขนส่ง",
}

const timeLabels = {
    morning: "เช้า",
    afternoon: "บ่าย",
    evening: "เย็น",
    flexible: "ยืดหยุ่น",
}

const durationLabels = {
    "half-day": "ครึ่งวัน",
    "full-day": "เต็มวัน",
    "multiple-days": "หลายวัน",
    flexible: "ยืดหยุ่น",
}

const statusLabels = {
    pending: "รอการอนุมัติ",
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธ",
}

const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
}

export default function VolunteerApplicationDetail({ params }: VolunteerApplicationDetailProps) {
    const router = useRouter()
    const { user } = useAuth()
    const [isApproving, setIsApproving] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)

    const application = mockVolunteerApplications.find((app) => app.id === Number.parseInt(params.id))
    const relatedRequest = application ? mockDonationRequests.find((req) => req.id === application.requestId) : null

    if (!application) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบผู้สมัคร</h2>
                        <p className="text-gray-600 mb-4">ไม่พบข้อมูลผู้สมัครอาสาสมัครที่คุณกำลังมองหา</p>
                        <Button onClick={() => router.push("/organizer-dashboard")} className="bg-pink-500 hover:bg-pink-600">
                            กลับแดชบอร์ด
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Check if user has permission to view this page (only organizer or admin)
    if (!user || (user.role !== "organizer" && user.role !== "admin")) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                        <p className="text-gray-600 mb-4">คุณไม่มีสิทธิ์ในการดูรายละเอียดผู้สมัครอาสาสมัครนี้</p>
                        <Button onClick={() => router.push("/")} className="bg-pink-500 hover:bg-pink-600">
                            กลับหน้าหลัก
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const handleApprove = async () => {
        setIsApproving(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log("Approving volunteer application:", application.id)
        setIsApproving(false)
        // In real app, would update status and redirect
        router.push("/organizer-dashboard") // Redirect back to dashboard after action
    }

    const handleReject = async () => {
        setIsRejecting(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log("Rejecting volunteer application:", application.id)
        setIsRejecting(false)
        // In real app, would update status and redirect
        router.push("/organizer-dashboard") // Redirect back to dashboard after action
    }

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
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-pink-50">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับ
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">รายละเอียดผู้สมัครอาสา #{application.id}</h1>
                                <p className="text-sm text-gray-600">ตรวจสอบข้อมูลผู้สมัครอาสาสมัคร</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={statusColors[application.status as keyof typeof statusColors]}>
                                {statusLabels[application.status as keyof typeof statusLabels]}
                            </Badge>
                            {application.status === "pending" && (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleApprove}
                                        disabled={isApproving}
                                        className="bg-green-500 hover:bg-green-600 text-white"
                                    >
                                        {isApproving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                กำลังอนุมัติ...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                อนุมัติ
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleReject}
                                        disabled={isRejecting}
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                    >
                                        {isRejecting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                                                กำลังปฏิเสธ...
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 mr-2" />
                                                ปฏิเสธ
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Related Donation Request */}
                {relatedRequest && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-orange-500" />
                                สมัครสำหรับคำขอ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-800">{relatedRequest.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{relatedRequest.description}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 bg-transparent"
                                onClick={() => router.push(`/requests/${relatedRequest.id}`)}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                ดูรายละเอียดคำขอ
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-pink-500" />
                            ข้อมูลส่วนตัว
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">ชื่อ-นามสกุล</label>
                                <p className="text-gray-800">{application.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">อายุ</label>
                                <p className="text-gray-800">{application.age} ปี</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">อีเมล</label>
                            <p className="text-gray-800">{application.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">เบอร์โทรศัพท์</label>
                            <p className="text-gray-800">{application.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">ประสบการณ์อาสาสมัคร</label>
                            <p className="text-gray-800">{application.experience || "ไม่มี"}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">ผู้ติดต่อฉุกเฉิน</label>
                                <p className="text-gray-800">{application.emergencyContactName}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">เบอร์โทรฉุกเฉิน</label>
                                <p className="text-gray-800">{application.emergencyContactPhone}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">มีพาหนะส่วนตัว</label>
                            <div className="flex items-center gap-2">
                                {getVehicleIcon(application.hasVehicle)}
                                <p className="text-gray-800">{vehicleLabels[application.hasVehicle]}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Skills and Abilities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-500" />
                            ทักษะและความสามารถ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">ทักษะที่เลือก</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {application.skills.map((skill, index) => (
                                    <Badge key={index} variant="outline" className="border-purple-200 text-purple-700">
                                        {getSkillIcon(skill)} {skillLabels[skill as keyof typeof skillLabels]}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">ทักษะอื่นๆ</label>
                            <p className="text-gray-800">{application.otherSkills || "ไม่มี"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Availability */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            กำหนดการและเวลาที่สะดวก
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">วันที่สะดวก</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {application.availableDates.map((date, index) => (
                                    <Badge key={index} variant="outline" className="border-blue-200 text-blue-700">
                                        {new Date(date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">ช่วงเวลาที่สะดวก</label>
                                <p className="text-gray-800">{timeLabels[application.availableTime]}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">ระยะเวลาที่สามารถช่วยได้</label>
                                <p className="text-gray-800">{durationLabels[application.duration]}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">วันที่สมัคร</label>
                            <p className="text-gray-800">{formatDate(application.appliedDate)}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                {application.status === "pending" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>การจัดการผู้สมัคร</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                onClick={handleApprove}
                                disabled={isApproving}
                                className="w-full bg-green-500 hover:bg-green-600 text-white"
                            >
                                {isApproving ? "กำลังอนุมัติ..." : "อนุมัติผู้สมัคร"}
                            </Button>
                            <Button
                                onClick={handleReject}
                                disabled={isRejecting}
                                variant="outline"
                                className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                            >
                                {isRejecting ? "กำลังปฏิเสธ..." : "ปฏิเสธผู้สมัคร"}
                            </Button>
                            <Button variant="outline" className="w-full bg-transparent">
                                ส่งข้อความถึงผู้สมัคร
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
