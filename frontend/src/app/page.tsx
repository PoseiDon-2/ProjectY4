    "use client"

    import { useState, useEffect, useRef } from "react"
    import { Heart, X, MapPin, Users, Calendar, Share2, ExternalLink, List, RefreshCw } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    import { Progress } from "@/components/ui/progress"
    import { useRouter } from "next/navigation"
    import { Separator } from "@/components/ui/separator"
    import ShareModal from "../../share-modal"
    import { useAuth } from "@/contexts/auth-context"
    import StoryPreview from "../../story-preview"
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
        avatar: string
        hasUnviewed: boolean
        storyCount: number
        stories: Story[]
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
            return organizer.organization_name || 
                `${organizer.first_name || ""} ${organizer.last_name || ""}`.trim() || 
                "ไม่ระบุ"
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
            supporters: apiData.supporters_count || apiData.supporters || 0,
            image: getFirstImage(apiData.images),
            organizer: getOrganizerName(apiData.organizer),
            detailedAddress: apiData.detailed_address || apiData.location || "ไม่ระบุที่อยู่",
            contactPhone: apiData.contact_phone || "",
            bankAccount: parsePaymentMethods(apiData.payment_methods),
            qrCodeUrl: "https://via.placeholder.com/400x300?text=No+Image",
            coordinates: apiData.latitude && apiData.longitude
                ? { lat: apiData.latitude, lng: apiData.longitude }
                : undefined
        }
    }

    // Function to handle image loading errors
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement
        target.src = "https://via.placeholder.com/400x300?text=No+Image"
    }

    export default function DonationSwipe() {
        const [currentIndex, setCurrentIndex] = useState(0)
        const [likedRequests, setLikedRequests] = useState<string[]>([])
        const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([])
        const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
        const [loading, setLoading] = useState(true)
        const [storiesLoading, setStoriesLoading] = useState(true)
        const [error, setError] = useState<string | null>(null)
        const [isSwiping, setIsSwiping] = useState(false)
        const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
        const [startX, setStartX] = useState(0)
        const [currentX, setCurrentX] = useState(0)
        
        const cardRef = useRef<HTMLDivElement>(null)
        const { user } = useAuth()

        // Fetch donation requests and stories from API
        useEffect(() => {
            fetchData()
        }, [])

        useEffect(() => {
            const stored = localStorage.getItem("likedDonations")
            if (stored) {
                setLikedRequests(JSON.parse(stored))
            }
        }, [])

        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                
                // ดึงข้อมูลทั้ง donation requests และ stories พร้อมกัน
                const [donationResponse, storiesResponse] = await Promise.all([
                    axios.get(`${API_URL}/donation-requests`),
                    axios.get(`${API_URL}/stories`)
                ])

                // Process donation requests
                const apiRequests = donationResponse.data.data || donationResponse.data || []
                if (apiRequests.length === 0) {
                    setError("ไม่มีคำขอบริจาคในขณะนี้")
                    return
                }

                const transformedRequests = apiRequests.map(transformApiData)
                setDonationRequests(transformedRequests)

                // Process stories
                const apiStories = storiesResponse.data.data || storiesResponse.data || []
                const storyGroups = groupStoriesByDonationRequest(apiStories, transformedRequests)
                setStoryGroups(storyGroups)

            } catch (error) {
                console.error("Failed to fetch data:", error)
                setError("ไม่สามารถโหลดข้อมูลได้")
                
                // ใช้ข้อมูลตัวอย่างถ้า API ล้มเหลว
                setStoryGroups(getFallbackStoryGroups())
            } finally {
                setLoading(false)
                setStoriesLoading(false)
            }
        }

        const groupStoriesByDonationRequest = (stories: any[], donationRequests: DonationRequest[]): StoryGroup[] => {
            const groups: { [key: string]: StoryGroup } = {}

            // สร้าง groups จาก donation requests ที่มี stories
            stories.forEach(story => {
                // กรองเฉพาะ stories ที่เผยแพร่แล้ว
                if (story.status !== 'PUBLISHED') return

                const donationRequestId = story.donation_request_id

                if (!groups[donationRequestId]) {
                    // หาข้อมูล donation request ที่ตรงกัน
                    const donationRequest = donationRequests.find(req => req.id === donationRequestId)
                    
                    if (!donationRequest) return // ข้ามถ้าไม่พบ donation request

                    groups[donationRequestId] = {
                        donationRequestId,
                        organizer: donationRequest.organizer,
                        avatar: donationRequest.image,
                        hasUnviewed: story.views === 0, // ถ้า views = 0 ถือว่ายังไม่ได้ดู
                        storyCount: 0,
                        stories: []
                    }
                }

                // เพิ่ม story เข้า group
                const transformedStory: Story = {
                    id: story.id,
                    title: story.title,
                    content: story.content,
                    images: story.images,
                    status: story.status,
                    author_id: story.author_id,
                    donation_request_id: story.donation_request_id,
                    published_at: story.published_at,
                    views: story.views,
                    created_at: story.created_at,
                    type: story.type,
                    duration: story.duration
                }

                groups[donationRequestId].stories.push(transformedStory)
                groups[donationRequestId].storyCount = groups[donationRequestId].stories.length
                
                // อัพเดท hasUnviewed ถ้ามี story ใดๆ ที่ยังไม่ได้ดู
                if (story.views === 0) {
                    groups[donationRequestId].hasUnviewed = true
                }
            })

            return Object.values(groups)
        }

        const getFallbackStoryGroups = (): StoryGroup[] => {
            return [
                {
                    donationRequestId: "1",
                    organizer: "สมชาย ใจดี",
                    avatar: "https://via.placeholder.com/400x300?text=No+Image",
                    hasUnviewed: true,
                    storyCount: 3,
                    stories: []
                },
                {
                    donationRequestId: "2",
                    organizer: "มูลนิธิเด็กไทย",
                    avatar: "https://via.placeholder.com/400x300?text=No+Image",
                    hasUnviewed: true,
                    storyCount: 2,
                    stories: []
                },
                {
                    donationRequestId: "3",
                    organizer: "โรงเรียนบ้านดอนตาล",
                    avatar: "https://via.placeholder.com/400x300?text=No+Image",
                    hasUnviewed: false,
                    storyCount: 1,
                    stories: []
                }
            ]
        }

        const [showShareModal, setShowShareModal] = useState(false)
        const router = useRouter()

        const currentRequest = donationRequests[currentIndex]
        const progressPercentage = currentRequest ? (currentRequest.currentAmount / currentRequest.goalAmount) * 100 : 0

        const handleSwipe = (liked: boolean) => {
            if (liked && currentRequest) {
                const newLikedRequests = [...likedRequests, currentRequest.id]
                setLikedRequests(newLikedRequests)
                localStorage.setItem("likedDonations", JSON.stringify(newLikedRequests))
            }

            if (currentIndex < donationRequests.length - 1) {
                setCurrentIndex(currentIndex + 1)
            } else {
                setCurrentIndex(0)
            }
        }

        // Swipe handlers
        const handleTouchStart = (e: React.TouchEvent) => {
            setIsSwiping(true)
            setStartX(e.touches[0].clientX)
            setCurrentX(e.touches[0].clientX)
            setSwipeDirection(null)
        }

        const handleTouchMove = (e: React.TouchEvent) => {
            if (!isSwiping) return
            setCurrentX(e.touches[0].clientX)
            
            const diff = e.touches[0].clientX - startX
            if (Math.abs(diff) > 10) {
                setSwipeDirection(diff > 0 ? 'right' : 'left')
            }
        }

        const handleTouchEnd = () => {
            if (!isSwiping) return
            
            const diff = currentX - startX
            const swipeThreshold = 50
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe right - Like
                    handleSwipe(true)
                } else {
                    // Swipe left - Dislike
                    handleSwipe(false)
                }
            }
            
            setIsSwiping(false)
            setSwipeDirection(null)
        }

        // Mouse handlers for desktop
        const handleMouseDown = (e: React.MouseEvent) => {
            setIsSwiping(true)
            setStartX(e.clientX)
            setCurrentX(e.clientX)
            setSwipeDirection(null)
        }

        const handleMouseMove = (e: React.MouseEvent) => {
            if (!isSwiping) return
            setCurrentX(e.clientX)
            
            const diff = e.clientX - startX
            if (Math.abs(diff) > 10) {
                setSwipeDirection(diff > 0 ? 'right' : 'left')
            }
        }

        const handleMouseUp = () => {
            if (!isSwiping) return
            
            const diff = currentX - startX
            const swipeThreshold = 50
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe right - Like
                    handleSwipe(true)
                } else {
                    // Swipe left - Dislike
                    handleSwipe(false)
                }
            }
            
            setIsSwiping(false)
            setSwipeDirection(null)
        }

        const handleStoryClick = (storyGroup: StoryGroup) => {
            router.push(`/stories/donation-request/${storyGroup.donationRequestId}`)
        }

        const formatAmount = (amount: number) => {
            return new Intl.NumberFormat("th-TH").format(amount)
        }

        const handleRetry = () => {
            fetchData()
        }

        // Calculate transform for swipe animation
        const getCardTransform = () => {
            if (!isSwiping || !swipeDirection) return 'translateX(0)'
            
            const diff = currentX - startX
            return `translateX(${diff}px) rotate(${diff * 0.1}deg)`
        }

        // Get background color based on swipe direction
        const getSwipeBackground = () => {
            if (!isSwiping || !swipeDirection) return ''
            return swipeDirection === 'right' ? 'bg-green-50' : 'bg-red-50'
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

        if (error && donationRequests.length === 0) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                    <div className="text-center max-w-md">
                        <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Button 
                            onClick={handleRetry}
                            className="bg-pink-500 hover:bg-pink-600 text-white"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            โหลดใหม่
                        </Button>
                    </div>
                </div>
            )
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pt-4">
                        <h1 className="text-2xl font-bold text-gray-800">DonateSwipe</h1>
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
                    {storyGroups.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold text-gray-800">📖 Stories</h2>
                                <span className="text-sm text-gray-500">ความคืบหน้าล่าสุด</span>
                            </div>
                            
                            {storiesLoading ? (
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="flex-shrink-0 w-20 animate-pulse">
                                            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2"></div>
                                            <div className="h-3 bg-gray-300 rounded mb-1"></div>
                                            <div className="h-2 bg-gray-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {storyGroups.map((group) => (
                                        <StoryPreview
                                            key={group.donationRequestId}
                                            donationRequestId={group.donationRequestId}
                                            organizer={group.organizer}
                                            storyImage={group.avatar}
                                            hasUnviewed={group.hasUnviewed}
                                            storyCount={group.storyCount}
                                            onClick={() => handleStoryClick(group)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Card with Side Buttons and Swipe */}
                    {!currentRequest || donationRequests.length === 0 ? (
                        <Card className="shadow-lg border-0 bg-white p-8 max-w-md mx-auto">
                            <div className="text-center">
                                <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">ไม่มีคำขอบริจาคในขณะนี้</h3>
                                <p className="text-sm text-gray-600 mb-4">ใช้เมนูด้านบนเพื่อดูรายการหรือสร้างคำขอใหม่</p>
                                <Button 
                                    onClick={handleRetry}
                                    variant="outline"
                                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    โหลดใหม่
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className={`flex items-center justify-center gap-6 transition-colors duration-200 ${getSwipeBackground()}`}>
                            {/* ปุ่มกากบาทด้านซ้าย */}
                            <div className="flex-shrink-0">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-20 h-20 rounded-full border-4 border-red-300 hover:border-red-500 hover:bg-red-50 bg-white shadow-xl transition-all duration-200 hover:scale-110"
                                    onClick={() => handleSwipe(false)}
                                >
                                    <X className="w-10 h-10 text-red-500" />
                                </Button>
                            </div>

                            {/* การ์ดหลักที่สามารถปัดได้ */}
                            <div className="flex-1 max-w-md">
                                <div
                                    ref={cardRef}
                                    className="cursor-grab active:cursor-grabbing transition-transform duration-200"
                                    style={{ transform: getCardTransform() }}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    <Card className="overflow-hidden shadow-2xl border-0 bg-white">
                                        <div className="relative">
                                            <img
                                                src={currentRequest.image}
                                                alt={currentRequest.title}
                                                className="w-full h-64 object-cover"
                                                onError={handleImageError}
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
                                </div>

                                {/* Swipe Instructions */}
                                <div className="flex justify-between items-center mt-4 px-2">
                                    <div className="text-center flex-1">
                                        <X className="w-5 h-5 text-red-500 mx-auto mb-1" />
                                        <span className="text-xs text-gray-600">ปัดซ้ายเพื่อข้าม</span>
                                    </div>
                                    <div className="text-center flex-1">
                                        <Heart className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                        <span className="text-xs text-gray-600">ปัดขวาเพื่อสนับสนุน</span>
                                    </div>
                                </div>

                                {/* Progress Indicator */}
                                {donationRequests.length > 1 && (
                                    <div className="flex justify-center mt-4 gap-2">
                                        {donationRequests.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`w-2 h-2 rounded-full transition-colors ${
                                                    index === currentIndex ? "bg-pink-500" : 
                                                    index < currentIndex ? "bg-pink-300" : "bg-gray-300"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ปุ่มถูกใจด้านขวา */}
                            <div className="flex-shrink-0">
                                <Button
                                    size="lg"
                                    className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl transition-all duration-200 hover:scale-110"
                                    onClick={() => handleSwipe(true)}
                                >
                                    <Heart className="w-10 h-10 text-white" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    {donationRequests.length > 0 && (
                        <div className="text-center mt-6 text-sm text-gray-500">
                            <p>ปัดการ์ดหรือกดปุ่มเพื่อเลือก ❤️ หรือ ✕</p>
                        </div>
                    )}
                </div>

                {/* Share Modal */}
                {currentRequest && (
                    <ShareModal 
                        isOpen={showShareModal} 
                        onClose={() => setShowShareModal(false)} 
                        donationRequest={currentRequest} 
                    />
                )}
            </div>
        )
    }