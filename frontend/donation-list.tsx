"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, SortAsc, MapPin, Users, Calendar, Heart, ExternalLink, Share2, AlertCircle, RefreshCw, ImageOff, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ShareModal from "./share-modal"
import StoryPreview from "./story-preview"
import axios from "axios"

// --- Constants Configuration ---
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
const API_URL = `${BACKEND_URL}/api`
const STORAGE_URL = `${BACKEND_URL}/storage`
const ITEMS_PER_PAGE = 15 // กำหนดจำนวนรายการต่อหน้า

// --- Interfaces ---
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
    organizerAvatar: string
    detailedAddress: string
    contactPhone: string
    bankAccount: {
        bank: string
        accountNumber: string
        accountName: string
    }
    qrCodeUrl: string
    createdAt: string
}

// --- Helper Functions ---
const safeParse = (data: any, fallback: any) => {
    if (!data) return fallback
    if (typeof data === 'object') return data
    try {
        return JSON.parse(data)
    } catch {
        return fallback
    }
}

const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("th-TH").format(amount)
}

const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
        "ภัยพิบัติ": "bg-red-100 text-red-700",
        "การแพทย์": "bg-blue-100 text-blue-700",
        "การศึกษา": "bg-green-100 text-green-700",
        "สัตว์": "bg-orange-100 text-orange-700",
        "สิ่งแวดล้อม": "bg-emerald-100 text-emerald-700",
    }
    return colors[category] || "bg-gray-100 text-gray-700"
}

const getUrgencyBadge = (daysLeft: number) => {
    if (daysLeft <= 0) return { text: "ปิดรับบริจาค", class: "bg-gray-800 text-white" }
    if (daysLeft <= 7) return { text: "เร่งด่วน", class: "bg-red-500 text-white" }
    if (daysLeft <= 15) return { text: "ใกล้หมดเขต", class: "bg-orange-500 text-white" }
    return { text: `${daysLeft} วัน`, class: "bg-gray-500 text-white" }
}

// --- Data Transformation ---
const transformApiData = (apiData: any): DonationRequest => {
    const calculateDaysLeft = (expiresAt: string | null) => {
        if (!expiresAt) return 30
        const expiry = new Date(expiresAt)
        const now = new Date()
        const diffTime = expiry.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 0 ? diffDays : 0
    }

    const getImageUrl = (path: string | null) => {
        if (!path) return null
        if (path.startsWith('http') || path.startsWith('https')) return path
        if (path.includes('placeholder')) return path
        const cleanPath = path.startsWith('/') ? path.slice(1) : path
        return `${STORAGE_URL}/${cleanPath}`
    }

    const images = safeParse(apiData.images, [])
    let firstImage = ""
    
    if (images.length > 0) {
        const processedUrl = getImageUrl(images[0])
        if (processedUrl) firstImage = processedUrl
    }

    const organizer = apiData.organizer || {}
    const organizerName = `${organizer.first_name || ""} ${organizer.last_name || ""}`.trim() || apiData.organizer_name || "ไม่ระบุ"
    let organizerAvatar = getImageUrl(organizer.avatar_url) || ""

    const paymentMethods = safeParse(apiData.payment_methods, {})

    return {
        id: apiData.id?.toString(),
        title: apiData.title || "ไม่มีชื่อโครงการ",
        description: apiData.description || "",
        category: apiData.category?.name || "ทั่วไป",
        location: apiData.location || "ไม่ระบุสถานที่",
        goalAmount: Number(apiData.goal_amount || apiData.target_amount || 0),
        currentAmount: Number(apiData.current_amount || 0),
        daysLeft: calculateDaysLeft(apiData.expires_at),
        supporters: Number(apiData.supporters || apiData.donor_count || 0),
        image: firstImage,
        organizer: organizerName,
        organizerAvatar: organizerAvatar,
        detailedAddress: apiData.detailed_address || apiData.location || "",
        contactPhone: apiData.contact_phone || "",
        bankAccount: {
            bank: paymentMethods.bank || "",
            accountNumber: paymentMethods.account_number || "",
            accountName: paymentMethods.account_name || ""
        },
        qrCodeUrl: "",
        createdAt: apiData.created_at || new Date().toISOString()
    }
}

// --- Sub-Component: Donation Card ---
const DonationCard = ({ 
    request, 
    onShare, 
    onClick 
}: { 
    request: DonationRequest, 
    onShare: (id: string) => void, 
    onClick: (id: string) => void 
}) => {
    const progressPercentage = Math.min((request.currentAmount / request.goalAmount) * 100, 100)
    const urgency = getUrgencyBadge(request.daysLeft)
    
    const [imageError, setImageError] = useState(false)
    const [avatarError, setAvatarError] = useState(false)

    return (
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-pink-100/50 h-full flex flex-col">
            <div className="relative overflow-hidden h-48 shrink-0 bg-gray-100">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10 pointer-events-none" />
                
                {request.image && !imageError ? (
                    <img
                        src={request.image}
                        alt={request.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                        onClick={() => onClick(request.id)}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div 
                        className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-500 cursor-pointer hover:bg-gray-300 transition-colors"
                        onClick={() => onClick(request.id)}
                    >
                        <ImageOff className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm font-medium">ไม่พบรูปภาพ</span>
                    </div>
                )}

                <div className="absolute top-3 left-3 flex gap-2 z-20">
                    <Badge className={getCategoryColor(request.category)}>{request.category}</Badge>
                    <Badge className={urgency.class}>{urgency.text}</Badge>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation()
                        onShare(request.id)
                    }}
                    className="absolute top-3 right-3 z-20 bg-white/90 hover:bg-white text-gray-600 hover:text-pink-600 rounded-full h-8 w-8 p-0"
                >
                    <Share2 className="w-4 h-4" />
                </Button>
            </div>

            <CardContent className="p-4 flex flex-col flex-1">
                <div className="space-y-3 flex-1">
                    <div>
                        <h3
                            className="font-bold text-gray-800 mb-1 line-clamp-1 cursor-pointer hover:text-pink-600 transition-colors"
                            onClick={() => onClick(request.id)}
                        >
                            {request.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">{request.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1 max-w-[30%]">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{request.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{request.supporters}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                            <Calendar className="w-3 h-3" />
                            <span>เหลือ {request.daysLeft} วัน</span>
                        </div>
                    </div>

                    <div className="space-y-2 bg-gray-50 p-2 rounded-lg">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 text-xs">ระดมทุนได้</span>
                            <span className="font-bold text-pink-600 text-xs">
                                {formatAmount(request.currentAmount)} <span className="text-gray-400 font-normal">/ {formatAmount(request.goalAmount)}</span>
                            </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-gradient-to-r from-pink-500 to-purple-500" />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        {request.organizerAvatar && !avatarError ? (
                             <img 
                                src={request.organizerAvatar} 
                                alt={request.organizer} 
                                className="w-5 h-5 rounded-full object-cover border border-gray-100 bg-gray-200" 
                                onError={() => setAvatarError(true)}
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px] text-gray-600 border border-gray-100">
                                {request.organizer.charAt(0)}
                            </div>
                        )}
                        <span className="text-xs text-gray-600 truncate">{request.organizer}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-4 mt-auto">
                    <Button
                        size="sm"
                        onClick={() => onClick(request.id)}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-sm text-white"
                    >
                        <Heart className="w-4 h-4 mr-1" />
                        บริจาคเลย
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent"
                        onClick={() => onClick(request.id)}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// --- Main Component ---
export default function DonationList() {
    const router = useRouter()
    
    // UI State
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [sortBy, setSortBy] = useState("newest")
    const [showShareModal, setShowShareModal] = useState<string | null>(null)
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)

    // Data State
    const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchDonationRequests = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const response = await axios.get(`${API_URL}/donation-requests`)
            const rawData = response.data.data || response.data
            
            if (Array.isArray(rawData)) {
                const transformedRequests = rawData.map(transformApiData)
                setDonationRequests(transformedRequests)
            } else {
                throw new Error("รูปแบบข้อมูลจาก API ไม่ถูกต้อง")
            }
        } catch (err: any) {
            console.error("Error fetching requests:", err)
            setError(err.response?.data?.message || err.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDonationRequests()
    }, [])

    // รีเซ็ตหน้าเป็นหน้า 1 เมื่อมีการค้นหา หรือเปลี่ยนตัวกรอง
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearch, categoryFilter, sortBy])

    const dynamicStories = useMemo(() => {
        if (donationRequests.length === 0) return []
        
        return donationRequests.slice(0, 8).map((req, index) => ({
            donationRequestId: req.id,
            organizer: req.organizer,
            avatar: req.organizerAvatar || "https://via.placeholder.com/150",
            hasUnviewed: index % 2 === 0,
            storyCount: (req.title.length % 3) + 1,
        }));
    }, [donationRequests]);

    const filteredAndSortedRequests = useMemo(() => {
        let result = [...donationRequests]

        if (debouncedSearch) {
            const lowerTerm = debouncedSearch.toLowerCase()
            result = result.filter((request) =>
                request.title.toLowerCase().includes(lowerTerm) ||
                request.description.toLowerCase().includes(lowerTerm) ||
                request.location.toLowerCase().includes(lowerTerm) ||
                request.organizer.toLowerCase().includes(lowerTerm)
            )
        }

        if (categoryFilter !== "all") {
            result = result.filter((request) => request.category === categoryFilter)
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case "urgent": return a.daysLeft - b.daysLeft
                case "progress": 
                    const progA = a.currentAmount / (a.goalAmount || 1)
                    const progB = b.currentAmount / (b.goalAmount || 1)
                    return progB - progA
                case "amount_low": return a.goalAmount - b.goalAmount
                case "amount_high": return b.goalAmount - a.goalAmount
                case "supporters": return b.supporters - a.supporters
                default: return 0
            }
        })

        return result
    }, [donationRequests, debouncedSearch, categoryFilter, sortBy])

    // --- Pagination Logic ---
    const totalItems = filteredAndSortedRequests.length
    // คำนวณจำนวนหน้า ถ้าไม่มีข้อมูลให้ถือเป็น 1 หน้า เพื่อให้แสดงเลข 1
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1
    
    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        return filteredAndSortedRequests.slice(startIndex, endIndex)
    }, [filteredAndSortedRequests, currentPage])

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const LoadingGrid = () => (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden h-[450px]">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                        <Skeleton className="h-2 w-full mt-2" />
                        <div className="flex gap-2 pt-4 mt-auto">
                            <Skeleton className="h-9 w-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header: z-50 เพื่อให้อยู่หน้าสุด */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                📋 รายการคำขอบริจาค
                                {loading && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
                            </h1>
                            <p className="text-sm text-gray-600">ค้นหาและเลือกคำขอบริจาคที่คุณต้องการสนับสนุน</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.push("/")} className="bg-transparent hover:bg-gray-50">
                                💝 Swipe Mode
                            </Button>
                            <Button variant="outline" onClick={() => router.push("/favorites")} className="bg-transparent hover:bg-gray-50">
                                ❤️ รายการที่สนใจ
                            </Button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="ค้นหาคำขอบริจาค, สถานที่, ผู้จัด..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="หมวดหมู่" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    <SelectItem value="ภัยพิบัติ">ภัยพิบัติ</SelectItem>
                                    <SelectItem value="การแพทย์">การแพทย์</SelectItem>
                                    <SelectItem value="การศึกษา">การศึกษา</SelectItem>
                                    <SelectItem value="สัตว์">สัตว์</SelectItem>
                                    <SelectItem value="สิ่งแวดล้อม">สิ่งแวดล้อม</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[140px]">
                                    <SortAsc className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="เรียงตาม" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">ล่าสุด</SelectItem>
                                    <SelectItem value="urgent">เร่งด่วน</SelectItem>
                                    <SelectItem value="progress">ความคืบหน้า</SelectItem>
                                    <SelectItem value="supporters">ผู้สนับสนุน</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Container หลัก: ใช้ pb-32 เพื่อเว้นพื้นที่ด้านล่าง */}
            <div className="max-w-6xl mx-auto px-4 pt-6 pb-32">
                
                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
                        <AlertDescription className="flex items-center gap-2">
                            {error}
                            <Button variant="outline" size="sm" onClick={fetchDonationRequests} className="ml-auto h-8 bg-white/10 hover:bg-white/20 border-white/20 text-white">
                                ลองใหม่
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Stories Section */}
                {!loading && dynamicStories.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                📖 Stories ความคืบหน้า
                            </h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {dynamicStories.map((story) => (
                                <StoryPreview
                                    key={`story-${story.donationRequestId}`}
                                    donationRequestId={story.donationRequestId}
                                    organizer={story.organizer}
                                    storyImage={story.avatar}
                                    hasUnviewed={story.hasUnviewed}
                                    storyCount={story.storyCount}
                                    onClick={() => router.push(`/stories/${story.donationRequestId}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Results Summary */}
                <div className="mb-4 text-sm text-gray-500">
                    {!loading && (
                        <p>
                            พบ <span className="font-semibold text-gray-900">{totalItems}</span> รายการ
                            {totalPages > 1 && <span className="text-gray-400"> (หน้า {currentPage} จาก {totalPages})</span>}
                        </p>
                    )}
                </div>

                {/* Donation Requests Grid */}
                {loading ? (
                    <LoadingGrid />
                ) : paginatedRequests.length > 0 ? (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {paginatedRequests.map((request) => (
                                <DonationCard 
                                    key={request.id} 
                                    request={request} 
                                    onShare={setShowShareModal}
                                    onClick={(id) => router.push(`/donation/${id}`)}
                                />
                            ))}
                        </div>

                        {/* --- Pagination Controls (แก้ไขใหม่ตามที่ขอ) --- */}
                        <div className="flex flex-wrap justify-center items-center gap-2 mt-12 pt-8 border-t border-gray-200/60">
                            
                            {/* ปุ่มย้อนกลับ */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-10 w-10 bg-white hover:bg-pink-50 border-gray-200"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* วนลูปสร้างปุ่มตัวเลขหน้า */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                                <Button
                                    key={pageNumber}
                                    variant={currentPage === pageNumber ? "default" : "outline"}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`h-10 w-10 p-0 font-medium transition-all duration-200 ${
                                        currentPage === pageNumber 
                                        ? "bg-pink-600 hover:bg-pink-700 text-white shadow-md scale-110" 
                                        : "bg-white text-gray-600 hover:text-pink-600 hover:bg-pink-50 border-gray-200"
                                    }`}
                                >
                                    {pageNumber}
                                </Button>
                            ))}

                            {/* ปุ่มถัดไป */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="h-10 w-10 bg-white hover:bg-pink-50 border-gray-200"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">ไม่พบรายการที่ค้นหา</h2>
                        <p className="text-gray-500 mb-6">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ใหม่อีกครั้ง</p>
                        <Button
                            onClick={() => {
                                setSearchTerm("")
                                setCategoryFilter("all")
                                setSortBy("newest")
                            }}
                            variant="outline"
                            className="border-pink-500 text-pink-600 hover:bg-pink-50"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            ล้างตัวกรองทั้งหมด
                        </Button>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    isOpen={true}
                    onClose={() => setShowShareModal(null)}
                    donationRequest={donationRequests.find((req) => req.id === showShareModal)!}
                />
            )}
        </div>
    )
}