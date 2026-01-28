"use client"

import { useState } from "react"
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
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ShareModal from "./share-modal"
import DonationModal from "./donation-modal"
import ItemsDonationModal from "./items-donation-modal"
import VolunteerModal from "./volunteer-modal"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

interface DonationDetailProps {
    id: string | number
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
    {
        id: 3,
        title: "ขอบคุณผู้บริจาค",
        content: "ขอบคุณทุกท่านที่ให้การสนับสนุน ครอบครัวที่ได้รับความช่วยเหลือรู้สึกซาบซึ้งมาก",
        type: "thanks",
        createdAt: "2024-01-10T09:15:00Z",
        views: 156,
        likes: 45,
        isViewed: true,
    },
    {
        id: 4,
        title: "อัปเดตสถานการณ์",
        content: "สถานการณ์น้ำท่วมเริ่มคลี่คลาย แต่ยังต้องการความช่วยเหลือในการซ่อมแซมบ้าน",
        type: "progress",
        createdAt: "2024-01-08T16:45:00Z",
        views: 134,
        likes: 19,
        isViewed: true,
    },
]

const mockDonation = {
    id: 1,
    title: "ช่วยเหลือครอบครัวที่ประสบอุทกภัย",
    description:
        "ครอบครัวของเราประสบอุทกภัยใหญ่ที่จังหวัดอุบลราชธานี ทำให้บ้านและข้าวของเสียหายหมด ต้องการความช่วยเหลือเพื่อซ่อมแซมบ้านและซื้อข้าวของใช้จำเป็น",
    images: [
        "https://via.placeholder.com/800x600?text=Image+1",
        "https://via.placeholder.com/800x600?text=Image+2",
        "https://via.placeholder.com/800x600?text=Image+3",
        "https://via.placeholder.com/800x600?text=Image+4",
    ],
    category: "ภัยพิบัติ",
    organizationType: "ชุมชน",
    donationTypes: ["money", "items", "volunteer"],
    goals: {
        money: {
            target: 50000,
            current: 23500,
            supporters: 47,
        },
        items: {
            description: "เสื้อผ้า อาหารแห้ง น้ำดื่ม อุปกรณ์ทำความสะอาด",
            received: ["เสื้อผ้า 50 ชุด", "น้ำดื่ม 100 ขวด", "อาหารแห้ง 20 กิโลกรัม"],
            supporters: 23,
        },
        volunteer: {
            target: 15,
            current: 8,
            description: "ช่วยงานซ่อมแซมบ้าน ทำความสะอาด จัดของ",
            supporters: 8,
        },
    },
    daysLeft: 15,
    location: "อุบลราชธานี",
    contactPhone: "081-234-5678",
    organizer: {
        name: "สมหญิง จัดการ",
        organization: "ชุมชนบ้านดอนตาล",
        avatar: "https://via.placeholder.com/100x100?text=No+Image",
        verified: true,
    },
    createdDate: "2024-01-10",
    tags: ["น้ำท่วม", "ครอบครัว", "บ้าน"],
    paymentMethods: {
        promptpay: "081-234-5678",
        bankAccount: {
            bank: "ธนาคารกสิกรไทย",
            accountNumber: "123-4-56789-0",
            accountName: "นายสมชาย ใจดี",
        },
        truewallet: "081-234-5678",
    },
    updates: [
        {
            id: 1,
            title: "ได้รับการสนับสนุนแล้ว 50%",
            content: "ขอบคุณทุกท่านที่ให้การสนับสนุน ตอนนี้เราได้รับเงินบริจาคไปแล้ว 50% ของเป้าหมาย",
            date: "2024-01-12",
            images: ["https://via.placeholder.com/600x400?text=Update+1", "https://via.placeholder.com/600x400?text=Update+2"],
        },
        {
            id: 2,
            title: "เริ่มซ่อมแซมบ้าน",
            content: "เราได้เริ่มซ่อมแซมบ้านแล้ว คาดว่าจะเสร็จสิ้นภายใน 2 สัปดาห์",
            date: "2024-01-08",
            images: ["https://via.placeholder.com/600x400?text=Update+3", "https://via.placeholder.com/600x400?text=Update+4", "https://via.placeholder.com/600x400?text=Update+5"],
        },
    ],
    donationHistory: [
        { id: 1, donor: "คุณสมชาย", amount: 1000, date: "2024-01-15", message: "ขอให้ผ่านพ้นวิกฤตไปด้วยดี", type: "money" },
        { id: 2, donor: "คุณสมหญิง", amount: 2000, date: "2024-01-14", message: "กำลังใจให้ครับ", type: "money" },
        { id: 3, donor: "ผู้บริจาคไม่ประสงค์ออกนาม", amount: 5000, date: "2024-01-13", message: "", type: "money" },
        { id: 4, donor: "คุณวิชัย", items: "เสื้อผ้า 10 ชุด", date: "2024-01-12", message: "ช่วยเหลือเท่าที่ทำได้", type: "items" },
        {
            id: 5,
            donor: "คุณมาลี",
            volunteer: "ช่วยงานทำความสะอาด",
            date: "2024-01-11",
            message: "หวังว่าจะช่วยได้",
            type: "volunteer",
        },
    ],
}

export default function DonationDetail({ id }: DonationDetailProps) {
    const router = useRouter()
    const [isFavorited, setIsFavorited] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showDonationModal, setShowDonationModal] = useState(false)
    const [showAllStories, setShowAllStories] = useState(false)
    const [showItemsDonationModal, setShowItemsDonationModal] = useState(false)
    const [showVolunteerModal, setShowVolunteerModal] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const donation = mockDonation
    const images = donation.images || []
    const totalImages = images.length

    const moneyProgressPercentage = donation.goals.money
        ? (donation.goals.money.current / donation.goals.money.target) * 100
        : 0
    const volunteerProgressPercentage = donation.goals.volunteer
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

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1))
    }

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1))
    }

    const unviewedStories = mockStories.filter((story) => !story.isViewed)
    const displayedStories = showAllStories ? mockStories : mockStories.slice(0, 3)

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-pink-50">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับ
                        </Button>
                        <div className="flex gap-2">
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
                <Card className="mb-6 overflow-hidden">
                    <div className="relative">
                        {totalImages > 0 ? (
                            <>
                                <img
                                    src={images[currentImageIndex]}
                                    alt={`${donation.title} - รูปที่ ${currentImageIndex + 1}`}
                                    className="w-full h-64 sm:h-96 object-cover"
                                />

                                {totalImages > 1 && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
                                            onClick={handlePrevImage}
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
                                            onClick={handleNextImage}
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </Button>
                                    </>
                                )}

                                {totalImages > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {images.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`w-2 h-2 rounded-full transition-all ${
                                                    index === currentImageIndex ? "bg-white w-8" : "bg-white/60"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1} / {totalImages}
                                </div>
                            </>
                        ) : (
                            <div className="h-64 sm:h-96 bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-lg">ไม่มีรูปภาพ</span>
                            </div>
                        )}

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

                            <div className="space-y-3">
                                <h3 className="font-medium text-gray-800">ประเภทการบริจาค</h3>
                                <div className="flex flex-wrap gap-2">
                                    {donation.donationTypes.map((type) => {
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

                            <div className="space-y-4">
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
                                                {donation.goals.items.received.map((item, index) => (
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

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={donation.organizer.avatar} />
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

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>รายละเอียด</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 leading-relaxed">{donation.description}</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {donation.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="bg-pink-100 text-pink-700">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

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
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                                <div className="relative">
                                    <Avatar className="w-16 h-16 ring-2 ring-pink-300">
                                        <AvatarImage src={donation.organizer.avatar} />
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

                            <div className="grid grid-cols-3 gap-3">
                                {mockStories.slice(0, 3).map((story) => (
                                    <div
                                        key={story.id}
                                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => router.push(`/stories?donation=${donation.id}&story=${story.id}`)}
                                    >
                                        {story.imageUrl ? (
                                            <img
                                                src={story.imageUrl}
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
                                                    src={story.imageUrl}
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

                            {mockStories.length > 3 && (
                                <Button
                                    variant="outline"
                                    className="w-full bg-transparent"
                                    onClick={() => setShowAllStories(!showAllStories)}
                                >
                                    {showAllStories ? "แสดงน้อยลง" : `ดู Stories ทั้งหมด (${mockStories.length})`}
                                </Button>
                            )}

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
                </div>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                donationRequest={{
                    id: donation.id.toString(),
                    title: donation.title,
                    description: donation.description,
                    category: donation.category,
                    goalAmount: donation.goals.money?.target || 0,
                    currentAmount: donation.goals.money?.current || 0,
                    organizer: donation.organizer.name,
                    image: donation.images?.[0] || "",
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
        </div>
    )
}