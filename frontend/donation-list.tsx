"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, SortAsc, MapPin, Users, Calendar, Heart, ExternalLink, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ShareModal from "./share-modal"
import StoryPreview from "./story-preview"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL

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
        qrCodeUrl: "https://via.placeholder.com/200x200?text=No+Image",
        coordinates: apiData.latitude && apiData.longitude
            ? { lat: apiData.latitude, lng: apiData.longitude }
            : undefined
    }
}

// Removed hardcoded donation requests data - will fetch from API


const storyGroups = [
    {
        donationRequestId: 1,
        organizer: "สมชาย ใจดี",
        avatar: "https://via.placeholder.com/60x60?text=No+Image",
        hasUnviewed: true,
        storyCount: 3,
    },
    {
        donationRequestId: 2,
        organizer: "มูลนิธิเด็กไทย",
        avatar: "https://via.placeholder.com/60x60?text=No+Image",
        hasUnviewed: true,
        storyCount: 2,
    },
    {
        donationRequestId: 3,
        organizer: "โรงเรียนบ้านดอนตาล",
        avatar: "https://via.placeholder.com/60x60?text=No+Image",
        hasUnviewed: false,
        storyCount: 1,
    },
    {
        donationRequestId: 4,
        organizer: "มูลนิธิรักษ์สัตว์",
        avatar: "https://via.placeholder.com/60x60?text=No+Image",
        hasUnviewed: true,
        storyCount: 1,
    },
]

// เพิ่มข้อมูล Stories
const requestStories: { [key: string]: any } = {
    "1": { hasStories: true, storyCount: 3, hasUnviewed: true },
    "2": { hasStories: true, storyCount: 2, hasUnviewed: true },
    "3": { hasStories: true, storyCount: 1, hasUnviewed: false },
    "4": { hasStories: true, storyCount: 1, hasUnviewed: true },
    "5": { hasStories: false, storyCount: 0, hasUnviewed: false },
    "6": { hasStories: false, storyCount: 0, hasUnviewed: false },
    "7": { hasStories: false, storyCount: 0, hasUnviewed: false },
    "8": { hasStories: false, storyCount: 0, hasUnviewed: false },
}

export default function DonationList() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [sortBy, setSortBy] = useState("newest")
    const [showShareModal, setShowShareModal] = useState<string | null>(null)
    const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([])
    const [loading, setLoading] = useState(true)

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

    const filteredAndSortedRequests = useMemo(() => {
        const filtered = donationRequests.filter((request) => {
            const matchesSearch =
                request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.organizer.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesCategory = categoryFilter === "all" || request.category === categoryFilter

            return matchesSearch && matchesCategory
        })

        // Sort the filtered results
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    // Compare string IDs by converting to numbers if possible, or use string comparison
                    const aId = Number.parseInt(a.id) || 0
                    const bId = Number.parseInt(b.id) || 0
                    return bId - aId
                case "urgent":
                    return a.daysLeft - b.daysLeft
                case "progress":
                    return (b.currentAmount / (b.goalAmount || 1)) - (a.currentAmount / (a.goalAmount || 1))
                case "amount_low":
                    return a.goalAmount - b.goalAmount
                case "amount_high":
                    return b.goalAmount - a.goalAmount
                case "supporters":
                    return b.supporters - a.supporters
                default:
                    return 0
            }
        })

        return filtered
    }, [searchTerm, categoryFilter, sortBy])

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

    const getCategoryColor = (category: string) => {
        const colors = {
            ภัยพิบัติ: "bg-red-100 text-red-700",
            การแพทย์: "bg-blue-100 text-blue-700",
            การศึกษา: "bg-green-100 text-green-700",
            สัตว์: "bg-orange-100 text-orange-700",
        }
        return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-700"
    }

    const getUrgencyBadge = (daysLeft: number) => {
        if (daysLeft <= 7) return { text: "เร่งด่วน", class: "bg-red-500 text-white" }
        if (daysLeft <= 15) return { text: "ใกล้หมดเขต", class: "bg-orange-500 text-white" }
        return { text: `${daysLeft} วัน`, class: "bg-gray-500 text-white" }
    }

    const categories = ["ทั้งหมด", "ภัยพิบัติ", "การแพทย์", "การศึกษา", "สัตว์"]

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">📋 รายการคำขอบริจาค</h1>
                            <p className="text-sm text-gray-600">ค้นหาและเลือกคำขอบริจาคที่คุณต้องการสนับสนุน</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.push("/")} className="bg-transparent">
                                💝 Swipe Mode
                            </Button>
                            <Button variant="outline" onClick={() => router.push("/favorites")} className="bg-transparent">
                                ❤️ รายการที่สนใจ
                            </Button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="ค้นหาคำขอบริจาค..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-40">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="หมวดหมู่" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    <SelectItem value="ภัยพิบัติ">ภัยพิบัติ</SelectItem>
                                    <SelectItem value="การแพทย์">การแพทย์</SelectItem>
                                    <SelectItem value="การศึกษา">การศึกษา</SelectItem>
                                    <SelectItem value="สัตว์">สัตว์</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40">
                                    <SortAsc className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="เรียงตาม" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">ล่าสุด</SelectItem>
                                    <SelectItem value="urgent">เร่งด่วน</SelectItem>
                                    <SelectItem value="progress">ความคืบหน้า</SelectItem>
                                    <SelectItem value="amount_low">เป้าหมายต่ำ-สูง</SelectItem>
                                    <SelectItem value="amount_high">เป้าหมายสูง-ต่ำ</SelectItem>
                                    <SelectItem value="supporters">ผู้สนับสนุนมากสุด</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                        พบ <span className="font-semibold text-gray-800">{filteredAndSortedRequests.length}</span> คำขอบริจาค
                        {searchTerm && (
                            <span>
                                {" "}
                                สำหรับ "<span className="font-semibold">{searchTerm}</span>"
                            </span>
                        )}
                        {categoryFilter !== "all" && (
                            <span>
                                {" "}
                                ในหมวด "<span className="font-semibold">{categoryFilter}</span>"
                            </span>
                        )}
                    </p>
                </div>

                {/* Stories Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">📖 Stories ความคืบหน้า</h2>
                        <span className="text-sm text-gray-500">อัปเดตล่าสุดจากผู้รับบริจาค</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {storyGroups.map((group, index) => (
                            <StoryPreview
                                key={group.donationRequestId}
                                donationRequestId={group.donationRequestId.toString()}
                                organizer={group.organizer}
                                storyImage={group.avatar}
                                hasUnviewed={group.hasUnviewed}
                                storyCount={group.storyCount}
                                onClick={() => router.push(`/stories?group=${index}&story=0`)}
                            />
                        ))}
                    </div>
                </div>

                {/* Donation Requests Grid */}
                {filteredAndSortedRequests.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAndSortedRequests.map((request) => {
                            const progressPercentage = (request.currentAmount / request.goalAmount) * 100
                            const urgency = getUrgencyBadge(request.daysLeft)

                            return (
                                <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="relative">
                                        <img
                                            src={request.image || "https://via.placeholder.com/400x300?text=No+Image"}
                                            alt={request.title}
                                            className="w-full h-48 object-cover cursor-pointer"
                                            onClick={() => router.push(`/donation/${request.id}`)}
                                        />
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <Badge className={getCategoryColor(request.category)}>{request.category}</Badge>
                                            <Badge className={urgency.class}>{urgency.text}</Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowShareModal(request.id)}
                                            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-800"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <div>
                                                <h3
                                                    className="font-bold text-gray-800 mb-1 line-clamp-2 cursor-pointer hover:text-pink-600 transition-colors"
                                                    onClick={() => router.push(`/donation/${request.id}`)}
                                                >
                                                    {request.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{request.location}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    <span>{request.supporters}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{request.daysLeft} วัน</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">ระดมทุนได้</span>
                                                    <span className="font-semibold text-gray-800">
                                                        ฿{formatAmount(request.currentAmount)} / ฿{formatAmount(request.goalAmount)}
                                                    </span>
                                                </div>
                                                <Progress value={progressPercentage} className="h-2" />
                                                <div className="text-right text-xs text-gray-500">
                                                    {Math.round(progressPercentage)}% ของเป้าหมาย
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-600">
                                                <span className="font-medium">ผู้จัดการ:</span> {request.organizer}
                                            </div>

                                            {requestStories[request.id]?.hasStories && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <div
                                                            className={`w-2 h-2 rounded-full ${requestStories[request.id]?.hasUnviewed ? "bg-pink-500" : "bg-gray-300"}`}
                                                        />
                                                        <span className="text-gray-600">
                                                            📖 {requestStories[request.id]?.storyCount || 0} Stories
                                                            {requestStories[request.id]?.hasUnviewed && (
                                                                <span className="text-pink-600 ml-1">• ใหม่</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => router.push(`/donation/${request.id}`)}
                                                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                                >
                                                    <Heart className="w-4 h-4 mr-1" />
                                                    บริจาค
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent"
                                                    onClick={() => router.push(`/donation/${request.id}`)}
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    ดูรายละเอียด
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบคำขอบริจาค</h2>
                        <p className="text-gray-500 mb-6">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</p>
                        <Button
                            onClick={() => {
                                setSearchTerm("")
                                setCategoryFilter("all")
                                setSortBy("newest")
                            }}
                            className="bg-pink-500 hover:bg-pink-600"
                        >
                            รีเซ็ตการค้นหา
                        </Button>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    isOpen={true}
                    onClose={() => setShowShareModal(null)}
                    donationRequest={filteredAndSortedRequests.find((req) => req.id === showShareModal)!}
                />
            )}
        </div>
    )
}
