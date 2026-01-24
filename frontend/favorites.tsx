"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, MapPin, Users, Trash2, ExternalLink, Share2, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import ShareModal from "./share-modal"
import axios from "axios"
import { useAuth } from "@/contexts/auth-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

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
    detailedAddress?: string
    contactPhone?: string
    bankAccount?: {
        bank: string
        accountNumber: string
        accountName: string
    }
}

export default function Favorites() {
    const router = useRouter()
    const { user } = useAuth()
    const [favoriteRequests, setFavoriteRequests] = useState<DonationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showDonationModal, setShowDonationModal] = useState<string | null>(null)
    const [showShareModal, setShowShareModal] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)

    // ฟังก์ชันแปลงข้อมูลจาก API
    const transformApiData = (apiData: any): DonationRequest => {
        const calculateDaysLeft = (expiresAt: string | null) => {
            if (!expiresAt) return 30
            const expiry = new Date(expiresAt)
            const now = new Date()
            const diffTime = expiry.getTime() - now.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays > 0 ? diffDays : 0
        }

        const getFirstImageUrl = (images: string | null) => {
            if (!images) return "https://via.placeholder.com/400x300?text=No+Image"
            try {
                const imageArray = JSON.parse(images)
                if (Array.isArray(imageArray) && imageArray.length > 0) {
                    const baseUrl = API_URL.replace('/api', '')
                    return `${baseUrl}/storage/${imageArray[0]}`
                }
            } catch (e) {
                console.error("Error parsing images:", e)
            }
            return "https://via.placeholder.com/400x300?text=No+Image"
        }

        const getOrganizerName = (organizer: any) => {
            if (!organizer) return "ไม่ระบุ"
            return organizer.organization_name ||
                `${organizer.first_name || ""} ${organizer.last_name || ""}`.trim() ||
                "ไม่ระบุ"
        }

        const getCategoryName = (category: any) => {
            return category?.name || "ไม่ระบุหมวดหมู่"
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
            supporters: apiData.supporters_count || apiData.supporters || 0,
            image: getFirstImageUrl(apiData.images),
            organizer: getOrganizerName(apiData.organizer),
            detailedAddress: apiData.detailed_address,
            contactPhone: apiData.contact_phone
        }
    }

    // ดึงรายการที่สนใจจาก API
    const fetchFavorites = async () => {
        try {
            setLoading(true)
            setError(null)

            // วิธีที่ 1: ดึงจาก endpoint ที่เฉพาะเจาะจง (แนะนำ)
            // สร้าง endpoint ที่ backend เช่น GET /api/users/{id}/interests
            const endpoint = user
                ? `${API_URL}/users/${user.id}/interests`
                : `${API_URL}/sessions/${getSessionId()}/interests`

            const response = await axios.get(endpoint)

            // วิธีที่ 2: ดึงจาก user_behaviors (ถ้ายังไม่มี endpoint เฉพาะ)
            // const response = await axios.get(`${API_URL}/user-behaviors`, {
            //     params: {
            //         action_type: 'swipe_like',
            //         user_id: user?.id || null,
            //         session_id: getSessionId()
            //     }
            // })

            const apiRequests = response.data.data || response.data || []
            const transformedRequests = apiRequests.map((item: any) => {
                // ถ้า endpoint ส่งข้อมูล donation_request มาเต็ม
                if (item.donation_request) {
                    return transformApiData(item.donation_request)
                }
                // ถ้า endpoint ส่งแค่ ID
                return transformApiData(item)
            })

            setFavoriteRequests(transformedRequests)

        } catch (error) {
            console.error("Failed to fetch favorites:", error)
            setError("ไม่สามารถโหลดรายการที่สนใจได้")

            // Fallback: ดึงจาก localStorage (สำหรับ guest)
            const stored = localStorage.getItem("likedDonations")
            if (stored && !user) {
                const likedIds = JSON.parse(stored)
                fetchDonationsByIds(likedIds)
            }
        } finally {
            setLoading(false)
        }
    }

    // ดึงข้อมูล donation requests จาก array of IDs
    const fetchDonationsByIds = async (ids: string[]) => {
        try {
            const requests = await Promise.all(
                ids.map(id =>
                    axios.get(`${API_URL}/donation-requests/${id}`)
                        .then(res => transformApiData(res.data.data || res.data))
                        .catch(() => null)
                )
            )
            const validRequests = requests.filter(Boolean) as DonationRequest[]
            setFavoriteRequests(validRequests)
        } catch (error) {
            console.error("Failed to fetch donations by IDs:", error)
        }
    }

    // ดึง session ID
    const getSessionId = () => {
        let sessionId = localStorage.getItem("session_id")
        if (!sessionId) {
            sessionId = crypto.randomUUID()
            localStorage.setItem("session_id", sessionId)
        }
        return sessionId
    }

    // ลบออกจากรายการที่สนใจ
    const removeFromFavorites = async (id: string) => {
        try {
            setRemovingId(id)

            if (user) {
                // สำหรับ user ที่ login: ลบจาก database
                await axios.delete(`${API_URL}/users/${user.id}/interests/${id}`)
            } else {
                // สำหรับ guest: ลบจาก localStorage
                const stored = localStorage.getItem("likedDonations")
                if (stored) {
                    const likedIds = JSON.parse(stored)
                    const updated = likedIds.filter((likedId: string) => likedId !== id)
                    localStorage.setItem("likedDonations", JSON.stringify(updated))
                }
            }

            // อัปเดต UI
            setFavoriteRequests(prev => prev.filter(request => request.id !== id))

            // ส่ง event tracking
            await axios.post(`${API_URL}/user-behaviors`, {
                action_type: 'unlike',
                donation_request_id: id,
                user_id: user?.id || null,
                session_id: getSessionId(),
                meta_data: {
                    timestamp: new Date().toISOString(),
                    source: 'favorites_page'
                }
            })

        } catch (error) {
            console.error("Failed to remove from favorites:", error)
            alert("ไม่สามารถลบรายการนี้ได้")
        } finally {
            setRemovingId(null)
        }
    }

    // ดึงข้อมูลเมื่อ component mount
    useEffect(() => {
        fetchFavorites()
    }, [user])

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            ภัยพิบัติ: "bg-red-100 text-red-700",
            การแพทย์: "bg-blue-100 text-blue-700",
            การศึกษา: "bg-green-100 text-green-700",
            สัตว์: "bg-orange-100 text-orange-700",
            สิ่งแวดล้อม: "bg-teal-100 text-teal-700",
            ศิลปวัฒนธรรม: "bg-purple-100 text-purple-700",
            อื่นๆ: "bg-gray-100 text-gray-700"
        }
        return colors[category] || "bg-gray-100 text-gray-700"
    }

    const getUrgencyBadge = (daysLeft: number) => {
        if (daysLeft <= 3) return { text: "ด่วนมาก!", class: "bg-red-500 text-white" }
        if (daysLeft <= 7) return { text: "เร่งด่วน", class: "bg-orange-500 text-white" }
        if (daysLeft <= 15) return { text: "ใกล้หมดเขต", class: "bg-yellow-500 text-white" }
        return { text: `${daysLeft} วัน`, class: "bg-gray-500 text-white" }
    }

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement
        target.src = "https://via.placeholder.com/400x300?text=No+Image"
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-3" />
                    <h2 className="text-lg font-medium text-gray-700">กำลังโหลดรายการที่สนใจ...</h2>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/")}
                                className="hover:bg-pink-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับ
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">❤️ คำขอที่สนใจ</h1>
                                <p className="text-sm text-gray-600">
                                    {favoriteRequests.length} รายการที่คุณเลือกไว้
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/swipe")}
                                className="border-pink-200 text-pink-600 hover:bg-pink-50"
                            >
                                ดูเพิ่มเติม
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-6">
                {error && favoriteRequests.length === 0 ? (
                    <div className="text-center py-16">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-500 mb-4">{error}</p>
                        <Button
                            onClick={fetchFavorites}
                            variant="outline"
                            className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                            โหลดใหม่
                        </Button>
                    </div>
                ) : favoriteRequests.length === 0 ? (
                    <div className="text-center py-16">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีคำขอที่สนใจ</h2>
                        <p className="text-gray-500 mb-6">กลับไปเลือกคำขอบริจาคที่คุณต้องการสนับสนุน</p>
                        <Button
                            onClick={() => router.push("/swipe")}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                        >
                            <Heart className="w-4 h-4 mr-2" />
                            เริ่มเลือกคำขอบริจาค
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {favoriteRequests.map((request) => {
                            const progressPercentage = (request.currentAmount / request.goalAmount) * 100
                            const urgency = getUrgencyBadge(request.daysLeft)

                            return (
                                <Card
                                    key={request.id}
                                    className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-gray-100"
                                >
                                    <div className="relative">
                                        <img
                                            src={request.image}
                                            alt={request.title}
                                            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                                            onError={handleImageError}
                                        />
                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            <Badge className={getCategoryColor(request.category)}>
                                                {request.category}
                                            </Badge>
                                            <Badge className={urgency.class}>
                                                {urgency.text}
                                            </Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeFromFavorites(request.id)}
                                            disabled={removingId === request.id}
                                            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-red-500 hover:text-red-600"
                                        >
                                            {removingId === request.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>

                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <div>
                                                <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">
                                                    {request.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {request.description}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="truncate max-w-[100px]">
                                                            {request.location}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        <span>{request.supporters}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{request.daysLeft}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">ระดมทุนได้</span>
                                                    <span className="font-semibold text-gray-800">
                                                        ฿{formatAmount(request.currentAmount)} / ฿{formatAmount(request.goalAmount)}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={progressPercentage}
                                                    className="h-2"
                                                    indicatorClassName={
                                                        progressPercentage >= 100 ? "bg-green-500" :
                                                            progressPercentage >= 70 ? "bg-yellow-500" :
                                                                progressPercentage >= 40 ? "bg-blue-500" :
                                                                    "bg-pink-500"
                                                    }
                                                />
                                                <div className="text-right text-xs text-gray-500">
                                                    {Math.round(progressPercentage)}% ของเป้าหมาย
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-600">
                                                <span className="font-medium">ผู้จัดการ:</span> {request.organizer}
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => setShowDonationModal(request.id)}
                                                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                                >
                                                    <Heart className="w-4 h-4 mr-1" />
                                                    บริจาค
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                                                    onClick={() => router.push(`/donation/${request.id}`)}
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    ดู
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                                                    onClick={() => setShowShareModal(request.id)}
                                                >
                                                    <Share2 className="w-4 h-4 mr-1" />
                                                    แชร์
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

            {/* Donation Modal */}
            {showDonationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">เลือกจำนวนเงินบริจาค</h3>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
                                <Button
                                    key={amount}
                                    variant="outline"
                                    className="hover:bg-pink-50 hover:border-pink-300"
                                >
                                    ฿{formatAmount(amount)}
                                </Button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowDonationModal(null)}
                                className="flex-1"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowDonationModal(null)
                                    router.push(`/donation/${showDonationModal}?donate=true`)
                                }}
                                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                            >
                                บริจาคเลย
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (() => {
                const request = favoriteRequests.find((req) => req.id === showShareModal)
                if (!request) return null
                return (
                    <ShareModal
                        isOpen={true}
                        onClose={() => setShowShareModal(null)}
                        donationRequest={{
                            id: request.id,
                            title: request.title,
                            description: request.description,
                            category: request.category,
                            goalAmount: request.goalAmount,
                            currentAmount: request.currentAmount,
                            organizer: request.organizer,
                            image: request.image,
                        }}
                    />
                )
            })()}
        </div>
    )
}