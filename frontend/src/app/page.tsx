"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

// --- CONFIGURATION ---
const CONFIG = {
    INITIAL_SCORE: 100,
    SWIPE_LEFT_PENALTY: 10,   // ลดคะแนนเมื่อปัดซ้าย
    COOLDOWN_MS: 30 * 1000,   // 30 วินาที ห้ามโชว์ซ้ำ (ปรับได้ตามต้องการ)
    TAG_PENALTY: 2,           // (Optional) ถ้ามี Logic Tag
};

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

// Interface สำหรับการ์ดที่มีคะแนน
interface ScoredDonationRequest extends DonationRequest {
    internalScore: number;
    lastViewedAt: number;
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
        image: getFirstImageUrl(apiData.images),
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

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement
    target.src = "https://via.placeholder.com/400x300?text=No+Image"
}

// --- Session ID Management ---
const getOrCreateSessionId = () => {
    if (typeof window === 'undefined') return ''

    const STORAGE_KEY = 'donation_swipe_session_id'
    let sessionId = localStorage.getItem(STORAGE_KEY)

    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem(STORAGE_KEY, sessionId)
    }

    return sessionId
}

// --- User Behavior Tracking Functions ---
const trackUserBehavior = async (
    sessionId: string,
    donationRequestId: string,
    actionType: 'swipe_like' | 'swipe_pass' | 'click_detail' | 'view_story',
    durationMs?: number,
    metaData?: any
) => {
    try {
        // แปลง action_type จาก string เป็น integer ตาม Enum
        const actionTypeMap = {
            'swipe_like': 1,
            'swipe_pass': 2,
            'click_detail': 3,
            'view_story': 4
        };

        const actionTypeValue = actionTypeMap[actionType];

        const token = localStorage.getItem('auth_token');
        const headers: any = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const payload = {
            session_id: sessionId,
            donation_request_id: donationRequestId,
            action_type: actionTypeValue, // ส่งเป็น integer
            duration_ms: durationMs || 0,
            meta_data: metaData || null
        }

        await axios.post(`${API_URL}/user-behaviors`, payload, { headers })

    } catch (error) {
        console.error('Failed to track user behavior:', error)
    }
}

export default function DonationSwipe() {
    // State สำหรับ Infinite Loop Logic
    const [cardPool, setCardPool] = useState<ScoredDonationRequest[]>([])
    const [activeCardIndex, setActiveCardIndex] = useState(0)

    const [likedRequests, setLikedRequests] = useState<string[]>([])
    const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [storiesLoading, setStoriesLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSwiping, setIsSwiping] = useState(false)
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
    const [startX, setStartX] = useState(0)
    const [currentX, setCurrentX] = useState(0)
    const [showShareModal, setShowShareModal] = useState(false)

    // ตัวแปรสำหรับ tracking
    const [sessionId, setSessionId] = useState<string>('')
    const viewStartTimeRef = useRef<number>(0)
    const cardRef = useRef<HTMLDivElement>(null)
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // กำหนด Session ID เมื่อ component โหลด
        setSessionId(getOrCreateSessionId())
        fetchData()
    }, [])

    useEffect(() => {
        const stored = localStorage.getItem("likedDonations")
        if (stored) {
            setLikedRequests(JSON.parse(stored))
        }
    }, [])

    // Track view time เมื่อเปลี่ยนการ์ด
    useEffect(() => {
        if (cardPool.length > 0 && activeCardIndex >= 0) {
            // เริ่มจับเวลาดูการ์ดใบปัจจุบัน
            viewStartTimeRef.current = Date.now()

            return () => {
                // เมื่อเปลี่ยนการ์ด ให้บันทึกเวลาดูของใบก่อนหน้า
                const viewDuration = Date.now() - viewStartTimeRef.current
                const previousCard = cardPool[activeCardIndex]

                if (previousCard && viewDuration > 500) { // บันทึกเฉพาะถ้าดูเกิน 500ms
                    trackUserBehavior(
                        sessionId,
                        previousCard.id,
                        'view_story',
                        viewDuration,
                        {
                            view_type: 'card_preview',
                            duration_seconds: Math.round(viewDuration / 1000)
                        }
                    )
                }
            }
        }
    }, [activeCardIndex, cardPool, sessionId])

    // --- ALGORITHM: THE BRAIN ---
    const getNextCardIndex = useCallback((pool: ScoredDonationRequest[]) => {
        if (pool.length === 0) return -1;
        if (pool.length === 1) return 0;

        const now = Date.now();

        const candidates = pool.map((item, index) => {
            let score = item.internalScore;

            if (item.lastViewedAt > 0) {
                const timePassed = now - item.lastViewedAt;
                if (timePassed < CONFIG.COOLDOWN_MS) {
                    score -= (1000 - (timePassed / 10));
                }
            }
            return { index, score };
        });

        candidates.sort((a, b) => b.score - a.score);
        return candidates[0].index;
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            const token = localStorage.getItem('auth_token') || localStorage.getItem('auth_token');
            const sessionId = getOrCreateSessionId(); // รับ sessionId ตรงนี้

            console.log("🔑 Token:", token ? "มี Token" : "ไม่มี Token");
            console.log("📝 Session ID:", sessionId);

            // --- สร้าง query parameters ---
            const params = new URLSearchParams();
            if (sessionId) {
                params.append('session_id', sessionId);
            }

            const queryString = params.toString();
            const url = `${API_URL}/donation-requests${queryString ? `?${queryString}` : ''}`;

            // --- 2. สร้าง Config สำหรับ Axios ---
            const axiosConfig = {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Accept': 'application/json'
                }
            };

            // --- 3. ยิง Request พร้อม Header ---
            const [donationResponse, storiesResponse] = await Promise.all([
                axios.get(url, axiosConfig), // ใช้ URL ที่มี query parameter
                axios.get(`${API_URL}/stories`)
            ])

            const apiRequests = donationResponse.data.data || donationResponse.data || []
            const transformedRequests = apiRequests.length > 0 ? apiRequests.map(transformApiData) : []

            // --- 4. Logic การเรียงลำดับใน Frontend ---
            // ใช้ index มากำหนดคะแนน เพื่อให้ตัวแรกสุดที่ Backend ส่งมา (ซึ่งควรจะเป็นตัวแนะนำ) อยู่บนสุดเสมอ
            const scoredRequests: ScoredDonationRequest[] = transformedRequests.map((req: DonationRequest, index: number) => ({
                ...req,
                internalScore: 1000 - index,
                lastViewedAt: 0
            }));

            // กรองสิ่งที่ Like ไปแล้วออก
            const storedLikes = localStorage.getItem("likedDonations");
            let initialPool = scoredRequests;
            if (storedLikes) {
                const likedIds = JSON.parse(storedLikes);
                initialPool = scoredRequests.filter(r => !likedIds.includes(r.id));
            }

            setCardPool(initialPool);
            if (initialPool.length > 0) {
                setActiveCardIndex(0);
            }

            const apiStories = storiesResponse.data.data || storiesResponse.data || []
            const storyGroups = groupStoriesByDonationRequest(apiStories, transformedRequests)
            setStoryGroups(storyGroups)

        } catch (error) {
            console.error("Failed to fetch data:", error)
            setError("ไม่สามารถโหลดข้อมูลได้")
            setStoryGroups(getFallbackStoryGroups())
        } finally {
            setLoading(false)
            setStoriesLoading(false)
        }
    }

    const groupStoriesByDonationRequest = (stories: any[], donationRequests: DonationRequest[]): StoryGroup[] => {
        const groups: { [key: string]: StoryGroup } = {}

        stories.forEach(story => {
            if (story.status !== 'PUBLISHED') return

            const donationRequestId = story.donation_request_id

            if (!groups[donationRequestId]) {
                const donationRequest = donationRequests.find(req => req.id === donationRequestId)
                if (!donationRequest) return

                groups[donationRequestId] = {
                    donationRequestId,
                    organizer: donationRequest.organizer,
                    avatar: donationRequest.image,
                    hasUnviewed: story.views === 0,
                    storyCount: 0,
                    stories: []
                }
            }

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
            if (story.views === 0) {
                groups[donationRequestId].hasUnviewed = true
            }
        })

        return Object.values(groups)
    }

    const getFallbackStoryGroups = (): StoryGroup[] => {
        return []
    }

    // --- SWIPE LOGIC with BEHAVIOR TRACKING ---
    const handleSwipe = async (liked: boolean) => {
        const currentCard = cardPool[activeCardIndex];
        if (!currentCard) return;

        let newPool = [...cardPool];

        // Track swipe action
        const actionType = liked ? 'swipe_like' : 'swipe_pass';
        await trackUserBehavior(
            sessionId,
            currentCard.id,
            actionType,
            Date.now() - viewStartTimeRef.current,
            {
                swipe_type: liked ? 'right' : 'left',
                card_score: currentCard.internalScore
            }
        );

        if (liked) {
            const newLikedRequests = [...likedRequests, currentCard.id]
            setLikedRequests(newLikedRequests)
            localStorage.setItem("likedDonations", JSON.stringify(newLikedRequests))

            // เรียก API Like (ถ้ามี)
            // await axios.post(`${API_URL}/like`, { id: currentCard.id });

            newPool = newPool.filter(item => item.id !== currentCard.id);

        } else {
            const updatedCard = {
                ...currentCard,
                internalScore: currentCard.internalScore - CONFIG.SWIPE_LEFT_PENALTY,
                lastViewedAt: Date.now()
            };

            newPool = newPool.map(item => item.id === currentCard.id ? updatedCard : item);
        }

        setCardPool(newPool);

        if (newPool.length === 0) {
            setActiveCardIndex(-1);
        } else {
            const nextIndex = getNextCardIndex(newPool);
            setActiveCardIndex(nextIndex);
        }
    }

    // --- CLICK DETAIL TRACKING ---
    const handleDetailClick = async (donationRequestId: string) => {
        await trackUserBehavior(
            sessionId,
            donationRequestId,
            'click_detail',
            Date.now() - viewStartTimeRef.current,
            { click_source: 'card_button' }
        );

        router.push(`/donation/${donationRequestId}`);
    }

    // --- SHARE MODAL TRACKING ---
    const handleShareClick = async (donationRequestId: string) => {
        await trackUserBehavior(
            sessionId,
            donationRequestId,
            'click_detail', // หรืออาจสร้าง 'click_share' action_type แยก
            Date.now() - viewStartTimeRef.current,
            { click_source: 'share_button' }
        );

        setShowShareModal(true);
    }

    // --- STORY CLICK TRACKING ---
    const handleStoryClick = async (storyGroup: StoryGroup) => {
        await trackUserBehavior(
            sessionId,
            storyGroup.donationRequestId,
            'view_story',
            0,
            {
                view_type: 'story_preview_click',
                story_count: storyGroup.storyCount
            }
        );

        router.push(`/stories/donation-request/${storyGroup.donationRequestId}`);
    }

    const currentRequest = cardPool[activeCardIndex];
    const progressPercentage = currentRequest ? (currentRequest.currentAmount / currentRequest.goalAmount) * 100 : 0

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
            handleSwipe(diff > 0)
        }

        setIsSwiping(false)
        setSwipeDirection(null)
    }

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
            handleSwipe(diff > 0)
        }

        setIsSwiping(false)
        setSwipeDirection(null)
    }

    const handleRetry = () => {
        fetchData()
    }

    const getCardTransform = () => {
        if (!isSwiping || !swipeDirection) return 'translateX(0)'
        const diff = currentX - startX
        return `translateX(${diff}px) rotate(${diff * 0.1}deg)`
    }

    const getSwipeBackground = () => {
        if (!isSwiping || !swipeDirection) return ''
        return swipeDirection === 'right' ? 'bg-green-50' : 'bg-red-50'
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

    if (error && cardPool.length === 0) {
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
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pt-4 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">DonateSwipe</h1>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
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
                            ❤️ {likedRequests.length}
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

                {!currentRequest || cardPool.length === 0 ? (
                    <Card className="shadow-lg border-0 bg-white p-8 max-w-md mx-auto">
                        <div className="text-center">
                            <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">ไม่มีคำขอบริจาคในขณะนี้</h3>
                            <p className="text-sm text-gray-600 mb-4">คุณได้ดูรายการทั้งหมดแล้ว หรือไม่มีรายการใหม่</p>
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
                    <div className={`flex items-center justify-center gap-2 md:gap-6 transition-colors duration-200 ${getSwipeBackground()}`}>
                        <div className="hidden md:flex flex-shrink-0">
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-20 h-20 rounded-full border-4 border-red-300 hover:border-red-500 hover:bg-red-50 bg-white shadow-xl transition-all duration-200 hover:scale-110"
                                onClick={() => handleSwipe(false)}
                            >
                                <X className="w-10 h-10 text-red-500" />
                            </Button>
                        </div>

                        <div className="w-full sm:max-w-md">
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
                                <Card className="overflow-hidden shadow-2xl border-0 bg-white min-h-[480px] flex flex-col select-none">
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={currentRequest.image}
                                            alt={currentRequest.title}
                                            className="w-full h-56 sm:h-64 object-cover select-none pointer-events-none"
                                            onError={handleImageError}
                                            draggable="false"
                                            onDragStart={(e) => e.preventDefault()}
                                        />
                                        <Badge className="absolute top-4 left-4 bg-white/90 text-gray-800 hover:bg-white/90">
                                            {currentRequest.category}
                                        </Badge>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute top-4 right-4 bg-white/90 hover:bg-white"
                                            onClick={() => handleShareClick(currentRequest.id)}
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex-shrink-0">
                                                <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 leading-tight">{currentRequest.title}</h2>
                                                <p className="text-gray-600 text-sm line-clamp-1">{currentRequest.description}</p>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">{currentRequest.location}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4 flex-shrink-0" />
                                                    <span>{currentRequest.supporters} คน</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                                    <span>{currentRequest.daysLeft} วัน</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 flex-shrink-0">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">ระดมทุนได้</span>
                                                    <span className="font-semibold text-gray-800">
                                                        ฿{formatAmount(currentRequest.currentAmount)} / ฿{formatAmount(currentRequest.goalAmount)}
                                                    </span>
                                                </div>
                                                <Progress value={progressPercentage} className="h-2" />
                                                <div className="text-right text-xs text-gray-500">{Math.round(progressPercentage)}% ของเป้าหมาย</div>
                                            </div>

                                            <div className="text-sm text-gray-600 flex-shrink-0">
                                                <span className="font-medium">ผู้จัดการ:</span> {currentRequest.organizer}
                                            </div>
                                        </div>

                                        <Separator className="my-4 flex-shrink-0" />

                                        <Button
                                            variant="outline"
                                            className="w-full border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent flex-shrink-0"
                                            onClick={() => handleDetailClick(currentRequest.id)}
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            ดูรายละเอียดเพิ่มเติม
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex justify-between items-center mt-4 px-2 md:hidden">
                                <div className="text-center flex-1">
                                    <X className="w-5 h-5 text-red-500 mx-auto mb-1" />
                                    <span className="text-xs text-gray-600">ปัดซ้ายเพื่อข้าม</span>
                                </div>
                                <div className="text-center flex-1">
                                    <Heart className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                    <span className="text-xs text-gray-600">ปัดขวาเพื่อสนับสนุน</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex flex-shrink-0">
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

                {cardPool.length > 0 && (
                    <div className="text-center mt-6 text-sm text-gray-500">
                        <p>ปัดการ์ดหรือกดปุ่มเพื่อเลือก ❤️ หรือ ✕</p>
                    </div>
                )}
            </div>

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