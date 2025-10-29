"use client"

import { useState, useEffect } from "react"
import { Heart, X, MapPin, Users, Calendar, Share2, ExternalLink, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import ShareModal from "../../share-modal"
import { useAuth } from "./auth-context"
import StoryPreview from "../../story-preview"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface DonationRequest {
    id: string
    title: string
    description: string
    category: string
    location: string
    goalAmount: number
    currentAmount: number
    daysLeft: number
    supporters: number
    image: string
    organizer: string
    detailedAddress: string
    contactPhone: string
    bankAccount: {
        bank: string
        accountNumber: string
        accountName: string
    }
    qrCodeUrl: string
    coordinates?: {
        lat: number
        lng: number
    }
}

// Helper function to transform API data to component format
const transformApiData = (apiData: any): DonationRequest => {
    const calculateDaysLeft = (expiresAt: string | null) => {
        if (!expiresAt) return 30 // default
        const expiry = new Date(expiresAt)
        const now = new Date()
        const diffTime = expiry.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 0 ? diffDays : 0
    }

    const getFirstImage = (images: string | null) => {
        if (!images) return "/placeholder.svg?height=400&width=300"
        try {
            const imageArray = JSON.parse(images)
            return imageArray.length > 0 ? imageArray[0] : "/placeholder.svg?height=400&width=300"
        } catch {
            return "/placeholder.svg?height=400&width=300"
        }
    }

    const getOrganizerName = (organizer: any) => {
        if (!organizer) return "ไม่ระบุ"
        return `${organizer.first_name || ""} ${organizer.last_name || ""}`.trim() || "ไม่ระบุ"
    }

    const getCategoryName = (category: any) => {
        return category?.name || "ไม่ระบุหมวดหมู่"
    }

    const parsePaymentMethods = (paymentMethods: string | null) => {
        if (!paymentMethods) return { bank: "", accountNumber: "", accountName: "" }
        try {
            const methods = JSON.parse(paymentMethods)
            return {
                bank: methods.bank || "",
                accountNumber: methods.account_number || "",
                accountName: methods.account_name || ""
            }
        } catch {
            return { bank: "", accountNumber: "", accountName: "" }
        }
    }

    return {
        id: apiData.id,
        title: apiData.title,
        description: apiData.description,
        category: getCategoryName(apiData.category),
        location: apiData.location || "ไม่ระบุสถานที่",
        goalAmount: apiData.goal_amount || apiData.target_amount || 0,
        currentAmount: apiData.current_amount || 0,
        daysLeft: calculateDaysLeft(apiData.expires_at),
        supporters: apiData.supporters || 0,
        image: getFirstImage(apiData.images),
        organizer: getOrganizerName(apiData.organizer),
        detailedAddress: apiData.location || "ไม่ระบุที่อยู่",
        contactPhone: "",
        bankAccount: parsePaymentMethods(apiData.payment_methods),
        qrCodeUrl: "/placeholder.svg?height=200&width=200",
        coordinates: apiData.latitude && apiData.longitude
            ? { lat: apiData.latitude, lng: apiData.longitude }
            : undefined
    }
}

const storyGroups = [
    {
        donationRequestId: 1,
        organizer: "สมชาย ใจดี",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: true,
        storyCount: 3,
    },
    {
        donationRequestId: 2,
        organizer: "มูลนิธิเด็กไทย",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: true,
        storyCount: 2,
    },
    {
        donationRequestId: 3,
        organizer: "โรงเรียนบ้านดอนตาล",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: false,
        storyCount: 1,
    },
    {
        donationRequestId: 4,
        organizer: "มูลนิธิรักษ์สัตว์",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: true,
        storyCount: 1,
    },
]

export default function DonationSwipe() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [likedRequests, setLikedRequests] = useState<string[]>([])
    const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    // Fetch donation requests from API
    useEffect(() => {
        const fetchDonationRequests = async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${API_URL}/donation-requests`)
                const apiRequests = response.data.data || response.data
                const transformedRequests = apiRequests.map(transformApiData)
                setDonationRequests(transformedRequests)
            } catch (error) {
                console.error("Failed to fetch donation requests:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDonationRequests()
    }, [])

    useEffect(() => {
        const stored = localStorage.getItem("likedDonations")
        if (stored) {
            setLikedRequests(JSON.parse(stored))
        }
    }, [])

    const [showShareModal, setShowShareModal] = useState(false)
    const router = useRouter()

    const currentRequest = donationRequests[currentIndex]
    const progressPercentage = currentRequest ? (currentRequest.currentAmount / currentRequest.goalAmount) * 100 : 0

    const handleSwipe = (liked: boolean) => {
        if (liked && currentRequest) {
            setLikedRequests([...likedRequests, currentRequest.id])
        }

        if (currentIndex < donationRequests.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            // Reset to beginning or show completion message
            setCurrentIndex(0)
        }
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pt-4">
                    <h1 className="text-2xl font-bold text-gray-800">💝 DonateSwipe</h1>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/list")}
                            className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                        >
                            <List className="w-4 h-4 mr-1" />
                            รายการ
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/favorites")}
                            className="bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200"
                        >
                            ❤️ {likedRequests.length} รายการ
                        </Button>
                        {user ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/profile")}
                                className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                            >
                                👤 {user.firstName}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/login")}
                                className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                            >
                                เข้าสู่ระบบ
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stories Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-800">📖 Stories</h2>
                        <span className="text-sm text-gray-500">ความคืบหน้าล่าสุด</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {storyGroups.map((group, index) => (
                            <StoryPreview
                                key={group.donationRequestId}
                                donationRequestId={group.donationRequestId}
                                organizer={group.organizer}
                                avatar={group.avatar}
                                hasUnviewed={group.hasUnviewed}
                                storyCount={group.storyCount}
                                onClick={() => router.push(`/stories?group=${index}&story=0`)}
                            />
                        ))}
                    </div>
                </div>

                {/* Main Card */}
                {!currentRequest || donationRequests.length === 0 ? (
                    <Card className="shadow-lg border-0 bg-white p-8">
                        <div className="text-center">
                            <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">ไม่มีคำขอบริจาคในขณะนี้</h3>
                            <p className="text-sm text-gray-600 mb-4">ใช้เมนูด้านบนเพื่อดูรายการหรือสร้างคำขอใหม่</p>
                        </div>
                    </Card>
                ) : (
                <div className="relative">
                    <Card className="overflow-hidden shadow-2xl border-0 bg-white">
                        <div className="relative">
                            <img
                                src={currentRequest.image || "/placeholder.svg"}
                                alt={currentRequest.title}
                                className="w-full h-64 object-cover"
                            />
                            <Badge className="absolute top-4 left-4 bg-white/90 text-gray-800 hover:bg-white/90">
                                {currentRequest.category}
                            </Badge>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-4 right-4 bg-white/90 hover:bg-white"
                                onClick={() => setShowShareModal(true)}
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">{currentRequest.title}</h2>
                                    <p className="text-gray-600 text-sm leading-relaxed">{currentRequest.description}</p>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{currentRequest.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{currentRequest.supporters} คน</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{currentRequest.daysLeft} วัน</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">ระดมทุนได้</span>
                                        <span className="font-semibold text-gray-800">
                                            ฿{formatAmount(currentRequest.currentAmount)} / ฿{formatAmount(currentRequest.goalAmount)}
                                        </span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-2" />
                                    <div className="text-right text-xs text-gray-500">{Math.round(progressPercentage)}% ของเป้าหมาย</div>
                                </div>

                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">ผู้จัดการ:</span> {currentRequest.organizer}
                                </div>

                                <Separator />

                                <Button
                                    variant="outline"
                                    className="w-full mt-2 border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent"
                                    onClick={() => router.push(`/donation/${currentRequest.id}`)}
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    ดูรายละเอียดเพิ่มเติม
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-6 mt-8">
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-16 h-16 rounded-full border-2 border-gray-300 hover:border-red-300 hover:bg-red-50 bg-transparent"
                            onClick={() => handleSwipe(false)}
                        >
                            <X className="w-8 h-8 text-gray-400 hover:text-red-500" />
                        </Button>

                        <Button
                            size="lg"
                            className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg"
                            onClick={() => handleSwipe(true)}
                        >
                            <Heart className="w-8 h-8 text-white" />
                        </Button>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex justify-center mt-6 gap-2">
                        {donationRequests.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-pink-500" : index < currentIndex ? "bg-pink-300" : "bg-gray-300"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
                )}

                {/* Instructions */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>กดปุ่ม ❤️ เพื่อสนับสนุน หรือ ✕ เพื่อข้าม</p>
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} donationRequest={currentRequest} />
        </div>
    )
}
