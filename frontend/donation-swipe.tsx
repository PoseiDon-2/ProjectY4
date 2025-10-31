"use client"

import { useState, useEffect, useRef } from "react"
import { Heart, X, MapPin, Users, Calendar, Share2, ExternalLink, List, User, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import ShareModal from "./share-modal"
import { useAuth } from "@/app/auth-context"
import StoryPreview from "./story-preview"

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

interface Story {
    id: string
    title: string
    content: string
    images: string[] | null
    status: string
    author_id: string
    donation_request_id: string
    published_at: string | null
    views: number
    created_at: string
    type?: string
    duration?: number
    donationRequest?: {
        id: string
        title: string
        organizer?: {
            name: string
            organization_name?: string
        }
    }
}

interface StoryGroup {
    donationRequestId: string
    organizer: string
    storyImage: string | null
    hasUnviewed: boolean
    storyCount: number
    stories: Story[]
}

// API Service
class StoryApiService {
    private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

    private async request(endpoint: string, options: RequestInit = {}) {
        const config: RequestInit = {
            headers: {
                'Accept': 'application/json',
                ...options.headers,
            },
            ...options,
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `API error: ${response.status}`)
        }

        return response.json()
    }

    async getPublicStories(): Promise<Story[]> {
        try {
            const response = await this.request('/stories')
            return response.data?.data || response.data || []
        } catch (error) {
            console.error('Error fetching public stories:', error)
            throw error
        }
    }
}

export const storyApiService = new StoryApiService()

// ข้อมูลตัวอย่าง
const donationRequests: DonationRequest[] = [
    {
        id: "1",
        title: "ช่วยเหลือผู้ประสบภัยน้ำท่วมจังหวัดเชียงใหม่",
        description: "ระดมทุนเพื่อช่วยเหลือผู้ประสบภัยน้ำท่วมในพื้นที่จังหวัดเชียงใหม่ ด้วยการจัดหาอาหาร น้ำดื่ม และสิ่งของจำเป็นเร่งด่วน",
        category: "ภัยพิบัติ",
        location: "เชียงใหม่",
        goalAmount: 500000,
        currentAmount: 325000,
        daysLeft: 15,
        supporters: 234,
        image: "/placeholder.svg",
        organizer: "มูลนิธิช่วยเหลือภัยพิบัติ",
        detailedAddress: "ตำบลศรีภูมิ อำเภอเมือง จังหวัดเชียงใหม่ 50200",
        contactPhone: "081-234-5678",
        bankAccount: {
            bank: "KBANK",
            accountNumber: "123-4-56789-0",
            accountName: "มูลนิธิช่วยเหลือภัยพิบัติ"
        },
        qrCodeUrl: "/placeholder.svg"
    },
    {
        id: "2",
        title: "สนับสนุนการศึกษาเด็กด้อยโอกาส",
        description: "โครงการระดมทุนเพื่อสนับสนุนค่าใช้จ่ายด้านการศึกษาให้กับเด็กจากครอบครัวยากไร้ในพื้นที่ชนบท",
        category: "การศึกษา",
        location: "แม่ฮ่องสอน",
        goalAmount: 300000,
        currentAmount: 185000,
        daysLeft: 30,
        supporters: 156,
        image: "/placeholder.svg",
        organizer: "สมาคมพัฒนาการศึกษา",
        detailedAddress: "อำเภอเมือง จังหวัดแม่ฮ่องสอน 58000",
        contactPhone: "082-345-6789",
        bankAccount: {
            bank: "SCB",
            accountNumber: "987-6-54321-0",
            accountName: "สมาคมพัฒนาการศึกษา"
        },
        qrCodeUrl: "/placeholder.svg"
    },
    {
        id: "3",
        title: "รักษาสัตว์สงวนใกล้สูญพันธุ์",
        description: "โครงการอนุรักษ์และรักษาสัตว์สงวนที่ใกล้จะสูญพันธุ์ในป่าธรรมชาติ",
        category: "สิ่งแวดล้อม",
        location: "กาญจนบุรี",
        goalAmount: 750000,
        currentAmount: 420000,
        daysLeft: 45,
        supporters: 321,
        image: "/placeholder.svg",
        organizer: "มูลนิธิอนุรักษ์สัตว์ป่า",
        detailedAddress: "เขตรักษาพันธุ์สัตว์ป่าทุ่งใหญ่นเรศวร จังหวัดกาญจนบุรี",
        contactPhone: "083-456-7890",
        bankAccount: {
            bank: "KTB",
            accountNumber: "456-7-89101-2",
            accountName: "มูลนิธิอนุรักษ์สัตว์ป่า"
        },
        qrCodeUrl: "/placeholder.svg"
    }
]

export default function DonationSwipe() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [likedRequests, setLikedRequests] = useState<string[]>([])
    const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
    const [isLoadingStories, setIsLoadingStories] = useState(true)
    const [storiesError, setStoriesError] = useState<string | null>(null)
    const { user } = useAuth()
    const router = useRouter()

    // State สำหรับจัดการ responsive และ swipe
    const [isMobile, setIsMobile] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
    const [isSwiping, setIsSwiping] = useState(false)
    
    // Refs สำหรับจัดการ touch events
    const cardRef = useRef<HTMLDivElement>(null)
    const touchStartX = useRef(0)
    const touchStartY = useRef(0)
    const currentX = useRef(0)

    useEffect(() => {
        setHasMounted(true)
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        
        checkMobile()
        window.addEventListener('resize', checkMobile)
        
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        const stored = localStorage.getItem("likedDonations")
        if (stored) {
            setLikedRequests(JSON.parse(stored))
        } else {
            const sample = ["1", "2"]
            setLikedRequests(sample)
            localStorage.setItem("likedDonations", JSON.stringify(sample))
        }
    }, [])

    useEffect(() => {
        fetchStories()
    }, [])

    const fetchStories = async () => {
        try {
            setIsLoadingStories(true)
            setStoriesError(null)
            const stories = await storyApiService.getPublicStories()

            const grouped = groupStoriesByDonationRequest(stories)
            setStoryGroups(grouped)
        } catch (error: any) {
            console.error('Error:', error)
            setStoriesError(error.message || 'ไม่สามารถโหลด Stories ได้')
            setStoryGroups(getFallbackStoryGroups())
        } finally {
            setIsLoadingStories(false)
        }
    }

    const groupStoriesByDonationRequest = (stories: Story[]): StoryGroup[] => {
        const groups: { [key: string]: StoryGroup } = {}

        stories.forEach(story => {
            if (story.status !== 'PUBLISHED') return
            const id = story.donation_request_id

            if (!groups[id]) {
                const organizer = story.donationRequest?.organizer?.organization_name ||
                    story.donationRequest?.organizer?.name ||
                    'ผู้จัดโครงการ'

                groups[id] = {
                    donationRequestId: id,
                    organizer,
                    storyImage: story.images?.[0] || null,
                    hasUnviewed: story.views === 0,
                    storyCount: 0,
                    stories: []
                }
            }

            groups[id].stories.push(story)
            groups[id].storyCount = groups[id].stories.length
            if (story.views === 0) groups[id].hasUnviewed = true
            if (story.images?.[0] && !groups[id].storyImage) {
                groups[id].storyImage = story.images[0]
            }
        })

        return Object.values(groups)
    }

    const getFallbackStoryGroups = (): StoryGroup[] => {
        return [
            {
                donationRequestId: "1",
                organizer: "มูลนิธิช่วยเหลือภัยพิบัติ",
                storyImage: "/placeholder.svg",
                hasUnviewed: true,
                storyCount: 1,
                stories: [{
                    id: "1",
                    title: "เริ่มแจกจ่ายความช่วยเหลือ",
                    content: "วันนี้ทีมงานได้เริ่มแจกจ่ายอาหารและน้ำดื่มให้ผู้ประสบภัยแล้ว",
                    images: ["/placeholder.svg"],
                    status: "PUBLISHED",
                    author_id: "1",
                    donation_request_id: "1",
                    published_at: new Date().toISOString(),
                    views: 0,
                    created_at: new Date().toISOString(),
                    type: "progress"
                }]
            }
        ]
    }

    const [showShareModal, setShowShareModal] = useState(false)
    const currentRequest = donationRequests[currentIndex]
    const progressPercentage = currentRequest ? (currentRequest.currentAmount / currentRequest.goalAmount) * 100 : 0

    const handleSwipe = (liked: boolean) => {
        if (liked && currentRequest) {
            const newLiked = [...likedRequests, currentRequest.id]
            setLikedRequests(newLiked)
            localStorage.setItem("likedDonations", JSON.stringify(newLiked))
        }
        
        // เพิ่ม animation สำหรับ swipe
        setSwipeDirection(liked ? 'right' : 'left')
        setTimeout(() => {
            setCurrentIndex(prev => prev < donationRequests.length - 1 ? prev + 1 : 0)
            setSwipeDirection(null)
        }, 300)
    }

    // Touch event handlers สำหรับ swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        currentX.current = 0
        setIsSwiping(true)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return
        
        const touchX = e.touches[0].clientX
        const touchY = e.touches[0].clientY
        const deltaX = touchX - touchStartX.current
        const deltaY = touchY - touchStartY.current

        // ตรวจสอบว่าเป็นการ swipe แนวนอนจริง (ไม่ใช่แนวตั้ง)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault()
            currentX.current = deltaX
            
            // อัพเดทตำแหน่งการ swipe
            if (cardRef.current) {
                const rotate = deltaX * 0.1
                cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`
                cardRef.current.style.transition = 'none'
            }
        }
    }

    const handleTouchEnd = () => {
        if (!isSwiping) return
        
        setIsSwiping(false)
        
        // กำหนด threshold สำหรับ swipe
        const swipeThreshold = 50
        
        if (Math.abs(currentX.current) > swipeThreshold) {
            if (currentX.current > 0) {
                // Swipe ไปทางขวา = Like
                handleSwipe(true)
            } else {
                // Swipe ไปทางซ้าย = Dislike
                handleSwipe(false)
            }
        }
        
        // รีเซ็ตตำแหน่งการ์ด
        if (cardRef.current) {
            cardRef.current.style.transform = 'translateX(0) rotate(0deg)'
            cardRef.current.style.transition = 'transform 0.3s ease'
        }
    }

    const formatAmount = (amount: number) => new Intl.NumberFormat("th-TH").format(amount)

    const handleStoryClick = (group: StoryGroup) => {
        router.push(`/stories/donation-request/${group.donationRequestId}`)
    }

    // ป้องกัน hydration mismatch
    if (!hasMounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">กำลังโหลด...</p>
                </div>
            </div>
        )
    }

    if (!currentRequest) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">ไม่มีคำขอบริจาคเพิ่มเติม</h2>
                    <p className="text-gray-600 text-sm sm:text-base">กลับมาดูใหม่ในภายหลัง</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-3 sm:p-4 safe-area-bottom">
            <div className="max-w-md mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6 pt-2 sm:pt-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">DonateSwipe</h1>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button 
                            variant="outline" 
                            size={isMobile ? "icon" : "sm"}
                            onClick={() => router.push("/list")} 
                            className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 h-9 sm:h-10"
                        >
                            <List className="w-4 h-4" />
                            {!isMobile && <span className="ml-1">รายการ</span>}
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            size={isMobile ? "icon" : "sm"}
                            onClick={() => router.push("/favorites")} 
                            className="bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200 h-9 sm:h-10 relative"
                        >
                            <span className="flex items-center">
                                ❤️ 
                                {!isMobile ? (
                                    <span className="ml-1">{likedRequests.length} รายการ</span>
                                ) : (
                                    likedRequests.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {likedRequests.length}
                                        </span>
                                    )
                                )}
                            </span>
                        </Button>
                        
                        {user ? (
                            <Button 
                                variant="outline" 
                                size={isMobile ? "icon" : "sm"}
                                onClick={() => router.push("/profile")} 
                                className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 h-9 sm:h-10"
                            >
                                <span className="flex items-center">
                                    <User className="w-4 h-4" />
                                    {!isMobile && (
                                        <span className="ml-1 truncate max-w-20">{user.firstName}</span>
                                    )}
                                </span>
                            </Button>
                        ) : (
                            <Button 
                                variant="outline" 
                                size={isMobile ? "icon" : "sm"}
                                onClick={() => router.push("/login")} 
                                className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 h-9 sm:h-10"
                            >
                                <span className="flex items-center">
                                    <LogIn className="w-4 h-4" />
                                    {!isMobile && <span className="ml-1">เข้าสู่ระบบ</span>}
                                </span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stories Section */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-800">Stories</h2>
                        <span className="text-xs sm:text-sm text-gray-500">ความคืบหน้าล่าสุด</span>
                    </div>

                    {storiesError && (
                        <div className="text-center py-2">
                            <p className="text-red-500 text-xs sm:text-sm mb-2">{storiesError}</p>
                            <Button variant="outline" size="sm" onClick={fetchStories} className="text-red-600 border-red-200 hover:bg-red-50 text-xs">
                                ลองอีกครั้ง
                            </Button>
                        </div>
                    )}

                    {isLoadingStories ? (
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 hide-scrollbar">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex-shrink-0 w-16 sm:w-20 animate-pulse">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-300 rounded-full mx-auto mb-2"></div>
                                    <div className="h-2 sm:h-3 bg-gray-300 rounded mb-1"></div>
                                    <div className="h-1.5 sm:h-2 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : storyGroups.length > 0 ? (
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 hide-scrollbar">
                            {storyGroups.map((group) => (
                                <div 
                                    key={group.donationRequestId}
                                    className="flex-shrink-0 w-16 sm:w-20 text-center cursor-pointer"
                                    onClick={() => handleStoryClick(group)}
                                >
                                    <div className="relative mx-auto mb-2">
                                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center overflow-hidden ${
                                            group.hasUnviewed ? 'ring-2 ring-pink-500 ring-offset-2' : ''
                                        }`}>
                                            {group.storyImage ? (
                                                <img 
                                                    src={group.storyImage} 
                                                    alt={group.organizer}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = "/placeholder.svg"
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-white text-xs font-bold">
                                                    {group.organizer.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        {group.storyCount > 1 && (
                                            <div className="absolute -top-1 -right-1 bg-white text-pink-600 text-xs rounded-full w-4 h-4 flex items-center justify-center border border-pink-200">
                                                {group.storyCount}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-700 truncate px-1">{group.organizer}</p>
                                    <p className="text-xs text-gray-500">{group.storyCount} เรื่อง</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-3 sm:py-4 text-gray-500">
                            <p className="text-sm">ยังไม่มี Stories ในขณะนี้</p>
                            <Button variant="outline" size="sm" onClick={fetchStories} className="mt-2 text-xs">
                                โหลดใหม่
                            </Button>
                        </div>
                    )}
                </div>

                {/* Main Card with Swipe Functionality */}
                <div className="relative">
                    <div
                        ref={cardRef}
                        className={`transform transition-transform duration-300 ${
                            swipeDirection === 'right' ? 'translate-x-full rotate-12 opacity-0' :
                            swipeDirection === 'left' ? '-translate-x-full rotate-12 opacity-0' : ''
                        }`}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <Card className="overflow-hidden shadow-xl sm:shadow-2xl border-0 bg-white cursor-grab active:cursor-grabbing">
                            <div className="relative">
                                <img
                                    src={currentRequest.image || "/placeholder.svg"}
                                    alt={currentRequest.title}
                                    className="w-full h-48 sm:h-64 object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg"
                                    }}
                                />
                                <Badge className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 text-gray-800 hover:bg-white/90 text-xs">
                                    {currentRequest.category}
                                </Badge>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 hover:bg-white w-8 h-8 sm:w-10 sm:h-10"
                                    onClick={() => setShowShareModal(true)}
                                >
                                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                            </div>

                            <CardContent className="p-4 sm:p-6">
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 leading-tight">{currentRequest.title}</h2>
                                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">{currentRequest.description}</p>
                                    </div>

                                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="truncate max-w-20 sm:max-w-none">{currentRequest.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>{currentRequest.supporters} คน</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>{currentRequest.daysLeft} วัน</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600">ระดมทุนได้</span>
                                            <span className="font-semibold text-gray-800">
                                                ฿{formatAmount(currentRequest.currentAmount)} / ฿{formatAmount(currentRequest.goalAmount)}
                                            </span>
                                        </div>
                                        <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
                                        <div className="text-right text-xs text-gray-500">{Math.round(progressPercentage)}% ของเป้าหมาย</div>
                                    </div>

                                    <div className="text-xs sm:text-sm text-gray-600">
                                        <span className="font-medium">ผู้จัดการ:</span> {currentRequest.organizer}
                                    </div>

                                    <Separator />

                                    <Button
                                        variant="outline"
                                        className="w-full mt-2 border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent text-xs sm:text-sm h-9 sm:h-10"
                                        onClick={() => router.push(`/donation/${currentRequest.id}`)}
                                    >
                                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                        ดูรายละเอียดเพิ่มเติม
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Swipe Instructions - แสดงเฉพาะในมือถือ */}
                    {isMobile && (
                        <div className="flex justify-center items-center gap-6 mt-6 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                    <X className="w-4 h-4 text-gray-400" />
                                </div>
                                <span>ปัดซ้ายเพื่อข้าม</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                                    <Heart className="w-4 h-4 text-white" />
                                </div>
                                <span>ปัดขวาเพื่อสนับสนุน</span>
                            </div>
                        </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="flex justify-center mt-4 sm:mt-6 gap-1.5 sm:gap-2">
                        {donationRequests.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                                    i === currentIndex ? "bg-pink-500" : i < currentIndex ? "bg-pink-300" : "bg-gray-300"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500">
                    {isMobile ? (
                        <p>ปัดการ์ดไปทางซ้ายหรือขวาเพื่อเลือก</p>
                    ) : (
                        <p>กดปุ่ม <span className="font-semibold">❤️</span> เพื่อสนับสนุน หรือ <span className="font-semibold">✕</span> เพื่อข้าม</p>
                    )}
                </div>
            </div>

            <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} donationRequest={currentRequest} />

            <style jsx>{`
                .safe-area-bottom {
                    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    )
}