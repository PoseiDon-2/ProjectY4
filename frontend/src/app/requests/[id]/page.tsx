"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    DollarSign,
    Users,
    Tag,
    Info,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Package,
    Phone,
    Truck,
    MapPin,
    Hourglass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "../../../../auth-context"

interface DonationRequestDetailProps {
    params: {
        id: string
    }
}

interface ItemDonationRecord {
    id: string
    donorName: string
    donorPhone: string
    donorEmail?: string
    isAnonymous: boolean
    itemDetails: string // e.g., "เสื้อผ้าเด็กชาย อายุ 5-10 ปี สภาพดี จำนวน 20 ชุด"
    quantity?: string // e.g., "20 ชุด"
    condition?: string // e.g., "good"
    deliveryMethod: "send-to-address" | "drop-off"
    trackingNumber?: string
    donationDate: string
    status: "pending" | "received" | "not_received" // Added status for item donation record
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
        deliveryAddress?: string
        deliveryContact?: string
    }
    itemDonations?: ItemDonationRecord[] // Added for tracking individual item donations
    volunteerDetails?: {
        skillsNeeded: string[]
        location: string
        contact: string
    }
}

// Mock data for donation requests (expanded to include item/volunteer details and itemDonations)
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
        goalAmount: 120000, // This goal is for money, but this request is for items. This might need clarification in a real app.
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
            deliveryAddress: "โรงเรียนบ้านดอนตาล, 123 หมู่ 4, ต.หนองบัว, อ.เมือง, จ.ขอนแก่น 40000",
            deliveryContact: "ครูสมศรี 089-123-4567",
        },
        itemDonations: [
            {
                id: "item-001",
                donorName: "นายใจดี มีสุข",
                donorPhone: "081-111-2222",
                donorEmail: "jaidee@example.com",
                isAnonymous: false,
                itemDetails: "หนังสือเรียนคณิตศาสตร์ ม.ปลาย 10 เล่ม, นิทานเด็ก 5 เล่ม",
                quantity: "15 เล่ม",
                condition: "good",
                deliveryMethod: "send-to-address",
                trackingNumber: "TH1234567890",
                donationDate: "2024-01-12T10:30:00Z",
                status: "pending", // Default status
            },
            {
                id: "item-002",
                donorName: "ไม่ระบุชื่อ",
                donorPhone: "ไม่ระบุ",
                donorEmail: "ไม่ระบุ",
                isAnonymous: true,
                itemDetails: "โต๊ะอ่านหนังสือเด็ก 2 ตัว, เก้าอี้ 4 ตัว",
                quantity: "6 ชิ้น",
                condition: "like-new",
                deliveryMethod: "drop-off",
                donationDate: "2024-01-13T14:00:00Z",
                status: "received", // Example received status
            },
            {
                id: "item-003",
                donorName: "นางสาวเมตตา จิตใจงาม",
                donorPhone: "092-333-4444",
                isAnonymous: false,
                itemDetails: "สมุด ดินสอ ยางลบ ปากกา รวม 50 ชิ้น",
                quantity: "50 ชิ้น",
                condition: "new",
                deliveryMethod: "drop-off",
                donationDate: "2024-01-14T09:00:00Z",
                status: "not_received", // Example not received status
            },
        ],
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

export default function RequestDetail({ params }: DonationRequestDetailProps) {
    const router = useRouter()
    const { user } = useAuth()

    const [currentRequest, setCurrentRequest] = useState<DonationRequest | undefined>(
        mockDonationRequests.find((req) => req.id === Number.parseInt(params.id)),
    )

    if (!currentRequest) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบคำขอ</h2>
                        <p className="text-gray-600 mb-4">ไม่พบข้อมูลคำขอบริจาคที่คุณกำลังมองหา</p>
                        <Button onClick={() => router.push("/organizer-dashboard")} className="bg-pink-500 hover:bg-pink-600">
                            กลับแดชบอร์ด
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Check if user has permission to view this page (only organizer or admin)
    // For mock purposes, assuming user.id matches organizer.id or user.role is admin
    // In a real app, you'd fetch the actual organizer ID from the request data
    const isOrganizer = user?.role === "organizer" && currentRequest.id === 2 // Mocking organizer for request ID 2
    const isAdmin = user?.role === "admin"

    if (!user || (!isOrganizer && !isAdmin)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                        <p className="text-gray-600 mb-4">คุณไม่มีสิทธิ์ในการดูรายละเอียดคำขอบริจาคนี้</p>
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

    const getStatusColor = (status: string) => {
        const colors = {
            pending: "bg-yellow-100 text-yellow-700",
            active: "bg-green-100 text-green-700",
            completed: "bg-blue-100 text-blue-700",
            rejected: "bg-red-100 text-red-700",
        }
        return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700"
    }

    const getStatusText = (status: string) => {
        const texts = {
            pending: "รอการอนุมัติ",
            active: "กำลังระดมทุน",
            completed: "เสร็จสิ้น",
            rejected: "ถูกปฏิเสธ",
        }
        return texts[status as keyof typeof texts] || status
    }

    const getDeliveryMethodText = (method: "send-to-address" | "drop-off") => {
        const methods = {
            "send-to-address": "ส่งตามที่อยู่ (ผ่านขนส่ง)",
            "drop-off": "นำไปส่งถึงที่ (ด้วยตัวเอง)",
        }
        return methods[method]
    }

    const getItemDonationStatus = (status: ItemDonationRecord["status"]) => {
        const statusConfig = {
            pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-700", icon: Hourglass },
            received: { label: "ได้รับแล้ว", color: "bg-green-100 text-green-700", icon: CheckCircle },
            not_received: { label: "ไม่ได้รับ", color: "bg-red-100 text-red-700", icon: XCircle },
        }
        return statusConfig[status] || statusConfig.pending
    }

    const handleUpdateItemDonationStatus = async (itemId: string, newStatus: ItemDonationRecord["status"]) => {
        // Simulate API call
        console.log(`Updating item donation ${itemId} to status: ${newStatus}`)
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay

        setCurrentRequest((prevRequest) => {
            if (!prevRequest || !prevRequest.itemDonations) return prevRequest
            return {
                ...prevRequest,
                itemDonations: prevRequest.itemDonations.map((donation) =>
                    donation.id === itemId ? { ...donation, status: newStatus } : donation,
                ),
            }
        })
    }

    const progressPercentage = (currentRequest.currentAmount / currentRequest.goalAmount) * 100

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
                                <h1 className="text-2xl font-bold text-gray-800">รายละเอียดคำขอ #{currentRequest.id}</h1>
                                <p className="text-sm text-gray-600">ตรวจสอบข้อมูลคำขอบริจาค</p>
                            </div>
                        </div>
                        <Badge className={getStatusColor(currentRequest.status)}>{getStatusText(currentRequest.status)}</Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Request Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-pink-500" />
                            ภาพรวมคำขอ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">ชื่อคำขอ</label>
                            <h2 className="text-xl font-bold text-gray-800">{currentRequest.title}</h2>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">รายละเอียด</label>
                            <p className="text-gray-800">{currentRequest.description}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">หมวดหมู่</label>
                                <Badge variant="secondary" className="mt-1">
                                    <Tag className="w-3 h-3 inline mr-1" />
                                    {currentRequest.category}
                                </Badge>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">วันที่สร้าง</label>
                                <p className="text-gray-800">{new Date(currentRequest.createdDate).toLocaleDateString("th-TH")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Donation Type Specific Details */}
                {currentRequest.donationType === "money" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-500" />
                                รายละเอียดการระดมทุน (เงิน)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">ยอดเป้าหมาย</label>
                                    <p className="text-xl font-bold text-green-600">฿{formatAmount(currentRequest.goalAmount)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">ยอดระดมทุนปัจจุบัน</label>
                                    <p className="text-xl font-bold text-green-600">฿{formatAmount(currentRequest.currentAmount)}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">ความคืบหน้า</label>
                                <Progress value={progressPercentage} className="h-3 mt-1" />
                                <p className="text-sm text-gray-600 mt-1">
                                    {Math.round(progressPercentage)}% ของเป้าหมาย ({currentRequest.supporters} ผู้สนับสนุน)
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">เหลือเวลา</label>
                                <p className="text-gray-800">{currentRequest.daysLeft} วัน</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {currentRequest.donationType === "items" && currentRequest.itemDetails && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-purple-500" />
                                รายละเอียดการบริจาค (สิ่งของ)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">ประเภทสิ่งของที่ต้องการ</label>
                                <p className="text-gray-800">{currentRequest.itemDetails.type}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">สภาพ</label>
                                    <p className="text-gray-800">{currentRequest.itemDetails.condition}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">จำนวนที่ต้องการ</label>
                                    <p className="text-gray-800">{currentRequest.itemDetails.quantity} ชิ้น/หน่วย</p>
                                </div>
                            </div>
                            {currentRequest.itemDetails.deliveryAddress && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">ที่อยู่สำหรับส่งมอบ</label>
                                    <p className="text-gray-800">{currentRequest.itemDetails.deliveryAddress}</p>
                                </div>
                            )}
                            {currentRequest.itemDetails.deliveryContact && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">ผู้ติดต่อสำหรับการส่งมอบ</label>
                                    <p className="text-gray-800">{currentRequest.itemDetails.deliveryContact}</p>
                                </div>
                            )}
                            {currentRequest.itemDetails.images && currentRequest.itemDetails.images.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">รูปภาพตัวอย่างสิ่งของ</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {currentRequest.itemDetails.images.map((img, index) => (
                                            <img
                                                key={index}
                                                src={img || "/placeholder.svg"}
                                                alt={`Item image ${index + 1}`}
                                                className="w-24 h-24 object-cover rounded-md border"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section for individual item donations */}
                            {currentRequest.itemDonations && currentRequest.itemDonations.length > 0 && (
                                <div className="space-y-4 pt-4 border-t mt-4">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-purple-600" />
                                        สิ่งของที่ได้รับแล้ว ({currentRequest.itemDonations.length} รายการ)
                                    </h3>
                                    <div className="grid gap-4">
                                        {currentRequest.itemDonations.map((itemDonation) => {
                                            const statusConfig = getItemDonationStatus(itemDonation.status)
                                            const StatusIcon = statusConfig.icon
                                            return (
                                                <Card key={itemDonation.id} className="bg-purple-50 border-purple-200">
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-medium text-purple-800">
                                                                {itemDonation.isAnonymous ? "บริจาคแบบไม่ระบุชื่อ" : itemDonation.donorName}
                                                            </h4>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(itemDonation.donationDate).toLocaleDateString("th-TH")}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{itemDonation.itemDetails}</p>
                                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="w-4 h-4" />
                                                                <span>{itemDonation.isAnonymous ? "ไม่ระบุ" : itemDonation.donorPhone}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="w-4 h-4" />
                                                                <span>{getDeliveryMethodText(itemDonation.deliveryMethod)}</span>
                                                            </div>
                                                            {itemDonation.trackingNumber && (
                                                                <div className="flex items-center gap-1 col-span-2">
                                                                    <Truck className="w-4 h-4" />
                                                                    <span>เลขพัสดุ: {itemDonation.trackingNumber}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t mt-3">
                                                            <Badge className={statusConfig.color}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {statusConfig.label}
                                                            </Badge>
                                                            {(isOrganizer || isAdmin) && itemDonation.status === "pending" && (
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="bg-green-50 text-green-700 hover:bg-green-100"
                                                                        onClick={() => handleUpdateItemDonationStatus(itemDonation.id, "received")}
                                                                    >
                                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                                        ได้รับแล้ว
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="bg-red-50 text-red-700 hover:bg-red-100"
                                                                        onClick={() => handleUpdateItemDonationStatus(itemDonation.id, "not_received")}
                                                                    >
                                                                        <XCircle className="w-3 h-3 mr-1" />
                                                                        ไม่ได้รับ
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {currentRequest.donationType === "volunteer" && currentRequest.volunteerDetails && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                รายละเอียดการรับสมัคร (อาสาสมัคร)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">ทักษะที่ต้องการ</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {currentRequest.volunteerDetails.skillsNeeded.map((skill, index) => (
                                        <Badge key={index} variant="outline" className="border-blue-200 text-blue-700">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">สถานที่ปฏิบัติงาน</label>
                                <p className="text-gray-800">{currentRequest.volunteerDetails.location}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">ผู้ติดต่อ</label>
                                <p className="text-gray-800">{currentRequest.volunteerDetails.contact}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons (Example: Approve/Reject for pending requests) */}
                {currentRequest.status === "pending" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>การจัดการคำขอ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                อนุมัติคำขอ
                            </Button>
                            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent">
                                <XCircle className="w-4 h-4 mr-2" />
                                ปฏิเสธคำขอ
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
