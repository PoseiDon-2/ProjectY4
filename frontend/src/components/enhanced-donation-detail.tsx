"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Heart,
    Share2,
    MapPin,
    Phone,
    Calendar,
    Users,
    Target,
    Clock,
    CheckCircle,
    AlertCircle,
    Play,
    Eye,
    ThumbsUp,
    Package,
    HandHeart,
    DollarSign,
    QrCode,
    CreditCard,
    Smartphone,
    Receipt,
    TrendingUp,
    FileText,
    Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { receiptSystem } from "@/lib/receipt-system"
import { useAuth } from "@/contexts/auth-context"
import ShareModal from "../../share-modal"
import DonationModal from "../../donation-modal"
import ItemsDonationModal from "../../items-donation-modal"
import VolunteerModal from "../../volunteer-modal"
import ReceiptUploadModal from "./receipt-upload-modal"
import ReceiptDetailModal from "./receipt-detail-modal"
import type { ReceiptData } from "@/types/receipt"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface EnhancedDonationDetailProps {
    id: string
}

interface Story {
    id: number
    title: string
    content: string
    type: "progress" | "milestone" | "thanks" | "completed"
    imageUrl?: string
    createdAt: string
    views: number
    likes: number
    isViewed: boolean
}

// Helper function to transform API data
const transformApiData = (apiData: any) => {
    const calculateDaysLeft = (expiresAt: string | null) => {
        if (!expiresAt) return 30
        const expiry = new Date(expiresAt)
        const now = new Date()
        const diffTime = expiry.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 0 ? diffDays : 0
    }

    const getFirstImage = (images: string | null) => {
        if (!images) return "https://via.placeholder.com/400x300?text=No+Image"
        try {
            const imageArray = JSON.parse(images)
            return imageArray.length > 0 ? imageArray[0] : "https://via.placeholder.com/400x300?text=No+Image"
        } catch {
            return "https://via.placeholder.com/400x300?text=No+Image"
        }
    }

    const parsePaymentMethods = (paymentMethods: string | null) => {
        if (!paymentMethods) {
            console.log('⚠️ No payment_methods in API response')
            return { bankAccount: null, promptpay: null }
        }
        try {
            const parsed = JSON.parse(paymentMethods)
            console.log('💰 Parsed payment methods:', parsed)
            return parsed
        } catch {
            console.log('❌ Failed to parse payment_methods')
            return { bankAccount: null, promptpay: null }
        }
    }

    const donationTypes = []
    if (apiData.accepts_money) donationTypes.push('money')
    if (apiData.accepts_items) donationTypes.push('items')
    if (apiData.accepts_volunteer) donationTypes.push('volunteer')

    return {
        id: apiData.id,
        title: apiData.title,
        description: apiData.description,
        imageUrl: getFirstImage(apiData.images),
        category: apiData.category?.name || "ไม่ระบุหมวดหมู่",
        organizationType: apiData.organization?.type || "องค์กร",
        donationTypes,
        goals: {
            money: apiData.accepts_money ? {
                target: apiData.target_amount || apiData.goal_amount || 0,
                current: apiData.current_amount || 0,
                supporters: apiData.supporters || 0,
            } : null,
            items: apiData.accepts_items ? {
                description: apiData.items_needed || "",
                received: [],
                supporters: 0,
            } : null,
            volunteer: apiData.accepts_volunteer ? {
                target: apiData.volunteers_needed || 0,
                current: apiData.volunteers_received || 0,
                description: apiData.volunteer_details || "",
                supporters: apiData.volunteers_received || 0,
            } : null,
        },
        daysLeft: calculateDaysLeft(apiData.expires_at),
        location: apiData.location || "ไม่ระบุสถานที่",
        contactPhone: "",
        organizer: {
            name: `${apiData.organizer?.first_name || ""} ${apiData.organizer?.last_name || ""}`.trim() || "ไม่ระบุ",
            organization: apiData.organization?.name || "",
            avatar: "https://via.placeholder.com/100x100?text=No+Image",
            verified: true,
        },
        createdDate: apiData.created_at ? new Date(apiData.created_at).toISOString().split('T')[0] : "",
        tags: [],
        paymentMethods: parsePaymentMethods(apiData.payment_methods),
        updates: [],
        donationHistory: [],
    }
}

// Mock stories data
const mockStories: Story[] = [
    {
        id: 1,
        title: "เริ่มต้นโครงการ",
        content: "เราได้เริ่มต้นโครงการช่วยเหลือครอบครัวที่ประสบอุทกภัยแล้ว ขอบคุณทุกท่านที่ให้การสนับสนุน",
        type: "progress",
        imageUrl: "https://via.placeholder.com/400x300?text=No+Image",
        createdAt: "2024-01-15T10:00:00Z",
        views: 245,
        likes: 32,
        isViewed: false,
    },
    {
        id: 2,
        title: "ความคืบหน้า 50%",
        content: "ขณะนี้เราได้รับการสนับสนุนไปแล้ว 50% ของเป้าหมาย ขอบคุณทุกท่านมากครับ",
        type: "milestone",
        imageUrl: "https://via.placeholder.com/400x300?text=No+Image",
        createdAt: "2024-01-12T14:30:00Z",
        views: 189,
        likes: 28,
        isViewed: true,
    },
]

// Mock donation data removed - now fetching from API

export default function EnhancedDonationDetail({ id }: EnhancedDonationDetailProps) {
    const router = useRouter()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState("details")
    const [isFavorited, setIsFavorited] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showDonationModal, setShowDonationModal] = useState(false)
    const [showAllStories, setShowAllStories] = useState(false)
    const [showItemsDonationModal, setShowItemsDonationModal] = useState(false)
    const [showVolunteerModal, setShowVolunteerModal] = useState(false)
    const [showReceiptUploadModal, setShowReceiptUploadModal] = useState(false)
    const [showReceiptDetailModal, setShowReceiptDetailModal] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
    const [receipts, setReceipts] = useState<ReceiptData[]>([])

    // API data states
    const [donation, setDonation] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const isOrganizer = user?.role === "organizer"

    // Fetch donation data from API
    useEffect(() => {
        const fetchDonation = async () => {
            try {
                setLoading(true)
                setError(null)
                const url = `${API_URL}/donation-requests/${id}`
                console.log('🔍 Fetching donation from:', url)
                console.log('API_URL:', API_URL)
                console.log('ID:', id)
                const response = await axios.get(url)
                console.log('✅ Response received:', response.data)
                const transformedData = transformApiData(response.data)
                setDonation(transformedData)
            } catch (err: any) {
                console.error("Failed to fetch donation:", err)
                setError(err.response?.data?.message || "ไม่สามารถโหลดข้อมูลได้")
            } finally {
                setLoading(false)
            }
        }

        fetchDonation()
    }, [id])

    useEffect(() => {
        // Load receipts for this donation request
        if (donation) {
            loadReceipts()
        }
    }, [id, donation])

    const loadReceipts = () => {
        try {
            const requestReceipts = receiptSystem.getReceiptsForRequest(id.toString())
            setReceipts(requestReceipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
        } catch (error) {
            console.error("Error loading receipts:", error)
        }
    }

    const moneyProgressPercentage = donation?.goals?.money
        ? (donation.goals.money.current / donation.goals.money.target) * 100
        : 0
    const volunteerProgressPercentage = donation?.goals?.volunteer
        ? (donation.goals.volunteer.current / donation.goals.volunteer.target) * 100
        : 0

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

    const getRelativeTime = (dateString: string) => {
        const now = new Date()
        const date = new Date(dateString)
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return "เมื่อสักครู่"
        if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`
        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`
        return formatDate(dateString)
    }

    const getStoryTypeColor = (type: string) => {
        const colors = {
            progress: "bg-blue-100 text-blue-700",
            milestone: "bg-green-100 text-green-700",
            thanks: "bg-pink-100 text-pink-700",
            completed: "bg-purple-100 text-purple-700",
        }
        return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700"
    }

    const getStoryTypeText = (type: string) => {
        const texts = {
            progress: "ความคืบหน้า",
            milestone: "เหตุการณ์สำคัญ",
            thanks: "ขอบคุณ",
            completed: "เสร็จสิ้น",
        }
        return texts[type as keyof typeof texts] || type
    }

    const getDonationTypeIcon = (type: string) => {
        const icons = {
            money: DollarSign,
            items: Package,
            volunteer: HandHeart,
        }
        return icons[type as keyof typeof icons] || DollarSign
    }

    const getDonationTypeLabel = (type: string) => {
        const labels = {
            money: "เงิน",
            items: "สิ่งของ",
            volunteer: "อาสาสมัคร",
        }
        return labels[type as keyof typeof labels] || type
    }

    const getDonationTypeColor = (type: string) => {
        const colors = {
            money: "bg-green-100 text-green-700 border-green-200",
            items: "bg-blue-100 text-blue-700 border-blue-200",
            volunteer: "bg-purple-100 text-purple-700 border-purple-200",
        }
        return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200"
    }

    const handleViewReceiptDetails = (receipt: ReceiptData) => {
        setSelectedReceipt(receipt)
        setShowReceiptDetailModal(true)
    }

    const handleReceiptUploadComplete = () => {
        loadReceipts()
    }

    const getReceiptStats = () => {
        const totalAmount = receipts
            .filter((r) => r.type === "money" && r.status === "completed")
            .reduce((sum, r) => sum + (r.amount || 0), 0)

        const totalReceipts = receipts.length
        const pendingReceipts = receipts.filter((r) => r.status === "pending").length
        const completedReceipts = receipts.filter((r) => r.status === "completed").length

        return { totalAmount, totalReceipts, pendingReceipts, completedReceipts }
    }

    const receiptStats = getReceiptStats()
    const unviewedStories = mockStories.filter((story) => !story.isViewed)
    const displayedStories = showAllStories ? mockStories : mockStories.slice(0, 3)

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">กำลังโหลดข้อมูล...</h2>
                    <p className="text-gray-600">โปรดรอสักครู่</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="flex gap-2 justify-center">
                            <Button onClick={() => router.back()} variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับ
                            </Button>
                            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                                ลองอีกครั้ง
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Not found state
    if (!donation) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบข้อมูล</h2>
                        <p className="text-gray-600 mb-4">ไม่พบคำขอบริจาคที่คุณกำลังค้นหา</p>
                        <Button onClick={() => router.back()} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับ
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-pink-50">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับ
                        </Button>
                        <div className="flex gap-2">
                            {isOrganizer && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowReceiptUploadModal(true)}
                                    className="hover:bg-green-50 text-green-700 border-green-200"
                                >
                                    <Receipt className="w-4 h-4 mr-2" />
                                    อัปโหลดสลิป
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsFavorited(!isFavorited)}
                                className={`hover:bg-pink-50 ${isFavorited ? "text-pink-600" : "text-gray-600"}`}
                            >
                                <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowShareModal(true)} className="hover:bg-pink-50">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4">
                {/* Hero Card */}
                <Card className="mb-6 overflow-hidden">
                    <div className="aspect-video relative">
                        <img
                            src={donation.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                            alt={donation.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                            <Badge className="bg-white/90 text-gray-800 hover:bg-white">{donation.category}</Badge>
                            <Badge variant="outline" className="bg-white/90 text-gray-800 hover:bg-white">
                                {donation.organizationType}
                            </Badge>
                        </div>
                    </div>

                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">{donation.title}</h1>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>สร้างเมื่อ {formatDate(donation.createdDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>เหลือ {donation.daysLeft} วัน</span>
                                    </div>
                                </div>
                            </div>

                            {/* Donation Types */}
                            <div className="space-y-3">
                                <h3 className="font-medium text-gray-800">ประเภทการบริจาค</h3>
                                <div className="flex flex-wrap gap-2">
                                    {donation.donationTypes.map((type: string) => {
                                        const Icon = getDonationTypeIcon(type)
                                        return (
                                            <Badge key={type} className={`${getDonationTypeColor(type)} border`}>
                                                <Icon className="w-3 h-3 mr-1" />
                                                {getDonationTypeLabel(type)}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Progress for each donation type */}
                            <div className="space-y-4">
                                {/* Money Progress */}
                                {donation.goals.money && (
                                    <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-green-600" />
                                            <h4 className="font-medium text-green-800">เป้าหมายเงิน</h4>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-bold text-green-600">
                                                ฿{formatAmount(donation.goals.money.current)}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                เป้าหมาย ฿{formatAmount(donation.goals.money.target)}
                                            </span>
                                        </div>
                                        <Progress value={moneyProgressPercentage} className="h-3" />
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>{Math.round(moneyProgressPercentage)}% ของเป้าหมาย</span>
                                            <span>{donation.goals.money.supporters} ผู้สนับสนุน</span>
                                        </div>
                                    </div>
                                )}

                                {/* Items Progress */}
                                {donation.goals.items && (
                                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-5 h-5 text-blue-600" />
                                            <h4 className="font-medium text-blue-800">สิ่งของที่ต้องการ</h4>
                                        </div>
                                        <p className="text-sm text-gray-700">{donation.goals.items.description}</p>
                                        <div className="space-y-2">
                                            <h5 className="text-sm font-medium text-blue-800">ได้รับแล้ว:</h5>
                                            <ul className="text-sm text-gray-700 space-y-1">
                                                {donation.goals.items.received.map((item: string, index: number) => (
                                                    <li key={index} className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="text-sm text-gray-600">{donation.goals.items.supporters} ผู้บริจาคสิ่งของ</div>
                                    </div>
                                )}

                                {/* Volunteer Progress */}
                                {donation.goals.volunteer && (
                                    <div className="space-y-3 p-4 bg-purple-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <HandHeart className="w-5 h-5 text-purple-600" />
                                            <h4 className="font-medium text-purple-800">อาสาสมัคร</h4>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-bold text-purple-600">{donation.goals.volunteer.current} คน</span>
                                            <span className="text-sm text-gray-600">เป้าหมาย {donation.goals.volunteer.target} คน</span>
                                        </div>
                                        <Progress value={volunteerProgressPercentage} className="h-3" />
                                        <p className="text-sm text-gray-700">{donation.goals.volunteer.description}</p>
                                        <div className="text-sm text-gray-600">{Math.round(volunteerProgressPercentage)}% ของเป้าหมาย</div>
                                    </div>
                                )}
                            </div>

                            {/* Organizer */}
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={donation.organizer.avatar || "https://via.placeholder.com/100x100?text=No+Image"} />
                                    <AvatarFallback>{donation.organizer.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800">{donation.organizer.name}</span>
                                        {donation.organizer.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    </div>
                                    <p className="text-sm text-gray-600">{donation.organizer.organization}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                {donation.donationTypes.includes("money") && (
                                    <Button
                                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                        onClick={() => setShowDonationModal(true)}
                                    >
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        บริจาคเงิน
                                    </Button>
                                )}
                                {donation.donationTypes.includes("items") && (
                                    <Button
                                        className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                                        onClick={() => setShowItemsDonationModal(true)}
                                    >
                                        <Package className="w-4 h-4 mr-2" />
                                        บริจาคสิ่งของ
                                    </Button>
                                )}
                                {donation.donationTypes.includes("volunteer") && (
                                    <Button variant="outline" className="bg-transparent" onClick={() => setShowVolunteerModal(true)}>
                                        <HandHeart className="w-4 h-4 mr-2" />
                                        สมัครอาสาสมัคร
                                    </Button>
                                )}
                                {!donation.donationTypes.includes("money") &&
                                    !donation.donationTypes.includes("items") &&
                                    !donation.donationTypes.includes("volunteer") && (
                                        <Button variant="outline" className="bg-transparent col-span-2">
                                            <Phone className="w-4 h-4 mr-2" />
                                            ติดต่อผู้จัดการ
                                        </Button>
                                    )}
                            </div>

                            {/* Quick Payment Options */}
                            {donation.donationTypes.includes("money") && (
                                <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex flex-col gap-1 h-auto py-3 bg-transparent"
                                        onClick={() => setShowDonationModal(true)}
                                    >
                                        <QrCode className="w-6 h-6 text-blue-600" />
                                        <span className="text-xs">QR Code</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex flex-col gap-1 h-auto py-3 bg-transparent"
                                        onClick={() => setShowDonationModal(true)}
                                    >
                                        <Smartphone className="w-6 h-6 text-green-600" />
                                        <span className="text-xs">PromptPay</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex flex-col gap-1 h-auto py-3 bg-transparent"
                                        onClick={() => setShowDonationModal(true)}
                                    >
                                        <CreditCard className="w-6 h-6 text-purple-600" />
                                        <span className="text-xs">บัตรเครดิต</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className={`grid w-full ${isOrganizer ? "grid-cols-4" : "grid-cols-3"} bg-white`}>
                        <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                        <TabsTrigger value="history">ประวัติการบริจาค</TabsTrigger>
                        <TabsTrigger value="updates">อัปเดตจากผู้รับบริจาค</TabsTrigger>
                        {isOrganizer && (
                            <TabsTrigger value="receipts" className="relative">
                                สลิปการรับเงิน
                                {receiptStats.pendingReceipts > 0 && (
                                    <Badge className="ml-2 bg-red-500 text-white text-xs px-1 min-w-[20px] h-5">
                                        {receiptStats.pendingReceipts}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="details" className="space-y-6">
                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle>รายละเอียด</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed">{donation.description}</p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {donation.tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="bg-pink-100 text-pink-700">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Location */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-pink-500" />
                                    ที่ตั้งและการติดต่อ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">{donation.location}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">{donation.contactPhone}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stories Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    📖 Stories ความคืบหน้า
                                    {unviewedStories.length > 0 && (
                                        <Badge className="bg-pink-500 text-white text-xs">{unviewedStories.length} ใหม่</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Story Preview Carousel */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                                    <div className="relative">
                                        <Avatar className="w-16 h-16 ring-2 ring-pink-300">
                                            <AvatarImage src={donation.organizer.avatar || "https://via.placeholder.com/100x100?text=No+Image"} />
                                            <AvatarFallback>{donation.organizer.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {unviewedStories.length > 0 && (
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                                <span className="text-xs text-white font-bold">{unviewedStories.length}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-800">{donation.organizer.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            {unviewedStories.length > 0 ? `มี Stories ใหม่ ${unviewedStories.length} เรื่อง` : "ดู Stories ทั้งหมด"}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                        onClick={() => router.push(`/stories?donation=${donation.id}`)}
                                    >
                                        <Play className="w-4 h-4 mr-1" />
                                        ดู Stories
                                    </Button>
                                </div>

                                {/* Story Thumbnails */}
                                <div className="grid grid-cols-3 gap-3">
                                    {mockStories.slice(0, 3).map((story) => (
                                        <div
                                            key={story.id}
                                            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => router.push(`/stories?donation=${donation.id}&story=${story.id}`)}
                                        >
                                            {story.imageUrl ? (
                                                <img
                                                    src={story.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                                                    alt={story.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
                                                    <span className="text-2xl">📖</span>
                                                </div>
                                            )}
                                            {!story.isViewed && (
                                                <div className="absolute top-2 right-2 w-3 h-3 bg-pink-500 rounded-full"></div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                <Badge className={`${getStoryTypeColor(story.type)} text-xs`}>
                                                    {getStoryTypeText(story.type)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Story List */}
                                <div className="space-y-3">
                                    <h5 className="font-medium text-gray-800">Stories ล่าสุด</h5>
                                    {displayedStories.map((story) => (
                                        <div
                                            key={story.id}
                                            className="flex gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
                                            onClick={() => router.push(`/stories?donation=${donation.id}&story=${story.id}`)}
                                        >
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                                {story.imageUrl ? (
                                                    <img
                                                        src={story.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                                                        alt={story.title}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <span className="text-lg">📖</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h6 className="font-medium text-gray-800 truncate">{story.title}</h6>
                                                    <Badge className={`${getStoryTypeColor(story.type)} text-xs flex-shrink-0`}>
                                                        {getStoryTypeText(story.type)}
                                                    </Badge>
                                                    {!story.isViewed && <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0"></div>}
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{story.content}</p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>{getRelativeTime(story.createdAt)}</span>
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        <span>{story.views}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <ThumbsUp className="w-3 h-3" />
                                                        <span>{story.likes}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Show More/Less Button */}
                                {mockStories.length > 3 && (
                                    <Button
                                        variant="outline"
                                        className="w-full bg-transparent"
                                        onClick={() => setShowAllStories(!showAllStories)}
                                    >
                                        {showAllStories ? "แสดงน้อยลง" : `ดู Stories ทั้งหมด (${mockStories.length})`}
                                    </Button>
                                )}

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-gray-800">{mockStories.length}</div>
                                        <div className="text-xs text-gray-600">Stories ทั้งหมด</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-gray-800">
                                            {mockStories.reduce((sum, story) => sum + story.views, 0)}
                                        </div>
                                        <div className="text-xs text-gray-600">การดูรวม</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-gray-800">
                                            {mockStories.reduce((sum, story) => sum + story.likes, 0)}
                                        </div>
                                        <div className="text-xs text-gray-600">ถูกใจรวม</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Methods - Only show if money donation is accepted */}
                        {donation.donationTypes.includes("money") && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-green-500" />
                                        วิธีการบริจาค
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Online Payment Options */}
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-800">การบริจาคออนไลน์</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <Button
                                                variant="outline"
                                                className="justify-start h-auto p-4 bg-transparent"
                                                onClick={() => setShowDonationModal(true)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <QrCode className="w-8 h-8 text-blue-600" />
                                                    <div className="text-left">
                                                        <div className="font-medium">QR Code PromptPay</div>
                                                        <div className="text-sm text-gray-600">สแกน QR Code เพื่อบริจาค</div>
                                                    </div>
                                                </div>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="justify-start h-auto p-4 bg-transparent"
                                                onClick={() => setShowDonationModal(true)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CreditCard className="w-8 h-8 text-purple-600" />
                                                    <div className="text-left">
                                                        <div className="font-medium">บัตรเครดิต/เดบิต</div>
                                                        <div className="text-sm text-gray-600">ชำระผ่านบัตรเครดิตหรือเดบิต</div>
                                                    </div>
                                                </div>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Bank Transfer */}
                                    {donation?.paymentMethods?.bankAccount && (
                                        <div className="space-y-3 pt-4 border-t">
                                            <h4 className="font-medium text-gray-800">โอนเงินผ่านธนาคาร</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm text-gray-600">ธนาคาร</label>
                                                    <p className="font-medium text-gray-800">{donation.paymentMethods.bankAccount.bank}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm text-gray-600">เลขที่บัญชี</label>
                                                    <p className="font-medium text-gray-800">{donation.paymentMethods.bankAccount.accountNumber}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">ชื่อบัญชี</label>
                                                <p className="font-medium text-gray-800">{donation.paymentMethods.bankAccount.accountName}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-yellow-50 p-3 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                            <div className="text-sm text-yellow-800">
                                                <p className="font-medium mb-1">คำแนะนำการบริจาค</p>
                                                <ul className="space-y-1 text-xs">
                                                    <li>• เลือกวิธีการบริจาคที่สะดวกสำหรับคุณ</li>
                                                    <li>• การบริจาคออนไลน์จะได้รับการยืนยันทันที</li>
                                                    <li>• เก็บหลักฐานการบริจาคไว้เป็นหลักฐาน</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    ประวัติการบริจาค ({donation.donationHistory.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {donation.donationHistory.map((donationItem: any) => (
                                        <div key={donationItem.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback>{donationItem.donor.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-gray-800">{donationItem.donor}</span>
                                                    <div className="flex items-center gap-2">
                                                        {donationItem.type === "money" && donationItem.amount && (
                                                            <span className="font-bold text-green-600">฿{formatAmount(donationItem.amount)}</span>
                                                        )}
                                                        {donationItem.type === "items" && donationItem.items && (
                                                            <span className="font-bold text-blue-600">{donationItem.items}</span>
                                                        )}
                                                        {donationItem.type === "volunteer" && donationItem.volunteer && (
                                                            <span className="font-bold text-purple-600">{donationItem.volunteer}</span>
                                                        )}
                                                        <Badge className={getDonationTypeColor(donationItem.type)}>
                                                            {getDonationTypeLabel(donationItem.type)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{formatDate(donationItem.date)}</p>
                                                {donationItem.message && <p className="text-sm text-gray-700 italic">"{donationItem.message}"</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="updates" className="space-y-6">
                        {donation.updates.map((update: any) => (
                            <Card key={update.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{update.title}</CardTitle>
                                        <span className="text-sm text-gray-500">{formatDate(update.date)}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-700">{update.content}</p>
                                    {update.images && update.images.length > 0 && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {update.images.map((image: string, index: number) => (
                                                <img
                                                    key={index}
                                                    src={image || "https://via.placeholder.com/400x300?text=No+Image"}
                                                    alt={`Update ${update.id} - ${index + 1}`}
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    {isOrganizer && (
                        <TabsContent value="receipts" className="space-y-6">
                            {/* Receipt Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                        <p className="text-xl font-bold text-green-600">
                                            ฿{new Intl.NumberFormat("th-TH").format(receiptStats.totalAmount)}
                                        </p>
                                        <p className="text-xs text-gray-600">ยอดรวมที่ได้รับ</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                        <p className="text-xl font-bold text-blue-600">{receiptStats.totalReceipts}</p>
                                        <p className="text-xs text-gray-600">สลิปทั้งหมด</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <span className="text-2xl block mb-2">⏳</span>
                                        <p className="text-xl font-bold text-yellow-600">{receiptStats.pendingReceipts}</p>
                                        <p className="text-xs text-gray-600">รอดำเนินการ</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <span className="text-2xl block mb-2">✅</span>
                                        <p className="text-xl font-bold text-green-600">{receiptStats.completedReceipts}</p>
                                        <p className="text-xs text-gray-600">เสร็จสิ้น</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Upload Button */}
                            <Card>
                                <CardContent className="p-6 text-center">
                                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">จัดการสลิปการรับเงิน</h3>
                                    <p className="text-gray-600 mb-4">อัปโหลดและจัดการสลิปการรับเงินบริจาคเพื่อความโปร่งใสและการติดตาม</p>
                                    <Button
                                        onClick={() => setShowReceiptUploadModal(true)}
                                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        อัปโหลดสลิปใหม่
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Recent Receipts */}
                            {receipts.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Receipt className="w-5 h-5 text-green-500" />
                                            สลิปล่าสุด ({receipts.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {receipts.slice(0, 5).map((receipt) => {
                                                const summary = receiptSystem.generateReceiptSummary(receipt)
                                                return (
                                                    <div
                                                        key={receipt.id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                                                        onClick={() => handleViewReceiptDetails(receipt)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-2xl">
                                                                {receipt.type === "money" ? "💰" : receipt.type === "items" ? "📦" : "👥"}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{receipt.receiptNumber}</h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {receipt.isAnonymous ? "ผู้บริจาคไม่ประสงค์ออกนาม" : receipt.donorName || "ไม่ระบุชื่อ"}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {new Date(receipt.createdAt).toLocaleDateString("th-TH")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg">{summary.amount}</p>
                                                            <Badge className={`${summary.statusColor} border text-xs`}>{summary.status}</Badge>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {receipts.length > 5 && (
                                            <div className="text-center mt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => router.push(`/organizer-dashboard?tab=receipts&request=${id}`)}
                                                >
                                                    ดูสลิปทั้งหมด ({receipts.length})
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            {/* Modals */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                donationRequest={{
                    id: donation.id,
                    title: donation.title,
                    description: donation.description,
                    category: donation.category,
                    goalAmount: donation.goals.money?.target || 0,
                    currentAmount: donation.goals.money?.current || 0,
                    organizer: donation.organizer,
                    image: donation.imageUrl || "https://via.placeholder.com/400x300?text=No+Image",
                }}
            />

            <DonationModal
                isOpen={showDonationModal}
                onClose={() => setShowDonationModal(false)}
                donation={{
                    id: donation.id,
                    title: donation.title,
                    paymentMethods: donation.paymentMethods,
                }}
            />

            <ItemsDonationModal
                isOpen={showItemsDonationModal}
                onClose={() => setShowItemsDonationModal(false)}
                donation={{
                    id: donation.id,
                    title: donation.title,
                    itemsNeeded: donation.goals.items?.description || "",
                    contactPhone: donation.contactPhone,
                    location: donation.location,
                }}
            />

            <VolunteerModal
                isOpen={showVolunteerModal}
                onClose={() => setShowVolunteerModal(false)}
                donation={{
                    id: donation.id,
                    title: donation.title,
                    volunteerDescription: donation.goals.volunteer?.description || "",
                    contactPhone: donation.contactPhone,
                    location: donation.location,
                }}
            />

            <ReceiptUploadModal
                isOpen={showReceiptUploadModal}
                onClose={() => setShowReceiptUploadModal(false)}
                requestId={donation.id.toString()}
                requestTitle={donation.title}
                onUploadComplete={handleReceiptUploadComplete}
            />

            <ReceiptDetailModal
                receipt={selectedReceipt}
                isOpen={showReceiptDetailModal}
                onClose={() => {
                    setShowReceiptDetailModal(false)
                    setSelectedReceipt(null)
                }}
            />
        </div>
    )
}
