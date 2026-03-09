"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Heart, X, MapPin, Users, Calendar, Share2, ExternalLink, List, RefreshCw, MessageCircle, Repeat2, MoreHorizontal, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import ShareModal from "../../share-modal"
import { useAuth } from "@/contexts/auth-context"
import { favoritesAPI } from "@/lib/api"
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
    organizerTrustLevelName?: string
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

// --- MOCK DATA สำหรับฟีดสไตล์ X.com ---
const MOCK_POSTS = [
    {
        id: "p1",
        author: {
            name: "มูลนิธิรักษ์ป่า",
            handle: "@rakpa_foundation",
            avatar: "https://i.pravatar.cc/150?u=rakpa",
            isVerified: true
        },
        content: "ขอบคุณทุกยอดบริจาคจากแคมเปญ #ปลูกป่าหน้าฝน ตอนนี้เราได้กล้าไม้ครบ 10,000 ต้นแล้วครับ เตรียมลงพื้นที่เสาร์นี้! 🌳💚",
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
        timestamp: "2 ชั่วโมงที่แล้ว",
        likes: 342,
        comments: 28,
        shares: 56,
        isLiked: false,
        feedType: "following"
    },
    {
        id: "p2",
        author: {
            name: "ใจดี มีสุข",
            handle: "@jaidee_ms",
            avatar: "https://i.pravatar.cc/150?u=jaidee",
            isVerified: false
        },
        content: "วันนี้เพิ่งปัดขวาสนับสนุนโครงการอาหารกลางวันน้องๆ ไป ใครสนใจมาร่วมทำบุญด้วยกันได้นะครับ 🙏✨",
        timestamp: "5 ชั่วโมงที่แล้ว",
        likes: 12,
        comments: 1,
        shares: 0,
        isLiked: true,
        feedType: "foryou"
    },
    {
        id: "p3",
        author: {
            name: "โรงพยาบาลสัตว์รักษ์เพื่อน",
            handle: "@petcare_hospital",
            avatar: "https://i.pravatar.cc/150?u=pet",
            isVerified: true
        },
        content: "อัปเดตอาการน้องส้มฉุน: ตอนนี้น้องทานอาหารได้เองแล้ว แผลผ่าตัดสมานดี ขอบคุณ 500+ ท่านที่ช่วยระดมทุนค่ารักษาให้น้องนะครับ 🐱❤️",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80",
        timestamp: "1 วันที่แล้ว",
        likes: 890,
        comments: 45,
        shares: 120,
        isLiked: false,
        feedType: "foryou"
    }
];

// --- MOCK DATA สำหรับ SHORTS (คลิปสั้นแนวตั้ง) ---
const MOCK_SHORTS = [
    {
        id: "s1",
        title: "บรรยากาศส่งมอบอุปกรณ์การแพทย์",
        thumbnail: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=400&q=80",
        views: "1.2K",
        authorName: "รพ.บ้านดอย",
    },
    {
        id: "s2",
        title: "อัปเดตน้องหมาแมวที่ได้รับอาหาร",
        thumbnail: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80",
        views: "5.4K",
        authorName: "Pet Rescue",
    },
    {
        id: "s3",
        title: "ขอบคุณผู้บริจาค! สร้างอาคารเรียนสำเร็จ",
        thumbnail: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80",
        views: "890",
        authorName: "มูลนิธิเพื่อการศึกษา",
    },
    {
        id: "s4",
        title: "ลุยน้ำท่วมแจกถุงยังชีพ อ.แม่สาย",
        thumbnail: "https://images.unsplash.com/photo-1544983053-91187d903f6f?w=400&q=80",
        views: "12K",
        authorName: "อาสาใจดี",
    }
];

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
        organizerTrustLevelName: apiData.organizer?.organizer_trust_level_name ?? undefined,
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
    // State สำหรับการควบคุม Tab และ ฟีดโพสต์
    const [activeTab, setActiveTab] = useState<'swipe' | 'foryou' | 'following'>('swipe')
    const [feedPosts, setFeedPosts] = useState(MOCK_POSTS)

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
    const [favoriteCount, setFavoriteCount] = useState(0)

    // ตัวแปรสำหรับ tracking
    const [sessionId, setSessionId] = useState<string>('')
    const viewStartTimeRef = useRef<number>(0)
    const cardRef = useRef<HTMLDivElement>(null)
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {

        // Log API URL for debugging
        console.log("🔗 API URL:", API_URL)
        console.log("📡 Fetching from endpoints:", {
            donations: `${API_URL}/donation-requests`,
            stories: `${API_URL}/stories`
        })
        // กำหนด Session ID เมื่อ component โหลด
        setSessionId(getOrCreateSessionId())

        // กำหนด Session ID เมื่อ component โหลด
        setSessionId(getOrCreateSessionId())

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


    // โหลดจำนวนรายการที่สนใจจาก API (เมื่อล็อกอิน) เพื่อให้ตรงกับหน้ารายการที่สนใจ
    useEffect(() => {
        if (!user) {
            setFavoriteCount(0)
            return
        }
        favoritesAPI.getList()
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
                setFavoriteCount(list.length)
            })
            .catch(() => setFavoriteCount(0))
    }, [user])

    // Track view time เมื่อเปลี่ยนการ์ด
    useEffect(() => {
        if (cardPool.length > 0 && activeCardIndex >= 0 && activeTab === 'swipe') {
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
    }, [activeCardIndex, cardPool, sessionId, activeTab])

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


            console.log("🔄 Starting data fetch...")

            // Fetch both endpoints with better error handling
            const [donationResponse, storiesResponse] = await Promise.all([
                axios.get(`${API_URL}/donation-requests`).catch(err => {
                    console.error("❌ Donation requests fetch failed:", {
                        url: `${API_URL}/donation-requests`,
                        status: err.response?.status,
                        statusText: err.response?.statusText,
                        data: err.response?.data,
                        message: err.message
                    })
                    throw err
                }),
                axios.get(`${API_URL}/stories`).catch(err => {
                    console.error("❌ Stories fetch failed:", {
                        url: `${API_URL}/stories`,
                        status: err.response?.status,
                        statusText: err.response?.statusText,
                        data: err.response?.data,
                        message: err.message
                    })
                    throw err
                })
            const token = localStorage.getItem('auth_token') || localStorage.getItem('auth_token');
            const sessionId = getOrCreateSessionId(); // รับ sessionId ตรงนี้

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
                axios.get(`${API_URL}/stories`, axiosConfig)

            const token = localStorage.getItem('auth_token') || localStorage.getItem('auth_token');
            const sessionId = getOrCreateSessionId(); // รับ sessionId ตรงนี้

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
                axios.get(`${API_URL}/stories`, axiosConfig)

            const token = localStorage.getItem('auth_token') || localStorage.getItem('auth_token');
            const sessionId = getOrCreateSessionId(); // รับ sessionId ตรงนี้

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
                axios.get(`${API_URL}/stories`, axiosConfig)
            ])

            console.log("✅ Both requests succeeded")
            console.log("📦 Donation response:", {
                hasData: !!donationResponse.data,
                dataType: Array.isArray(donationResponse.data) ? 'array' : typeof donationResponse.data,
                dataKeys: donationResponse.data ? Object.keys(donationResponse.data) : []
            })
            console.log("📦 Stories response:", {
                hasData: !!storiesResponse.data,
                dataType: Array.isArray(storiesResponse.data) ? 'array' : typeof storiesResponse.data,
                dataKeys: storiesResponse.data ? Object.keys(storiesResponse.data) : []
            })

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

            console.log("✅ Data processing complete:", {
                donationRequestsCount: transformedRequests.length,
                storyGroupsCount: storyGroups.length
            })

        } catch (error) {
            console.error("❌ Data fetching failed:", error)

            // Detailed error logging
            if (axios.isAxiosError(error)) {
                const status = error.response?.status
                const statusText = error.response?.statusText
                const errorData = error.response?.data
                const failedUrl = error.config?.url

                console.error("📊 Error Details:", {
                    status,
                    statusText,
                    failedUrl,
                    errorData,
                    message: error.message
                })

                // Show more specific error message
                if (status === 500) {
                    const errorMessage = errorData?.message || errorData?.error || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์"
                    setError(`เซิร์ฟเวอร์เกิดข้อผิดพลาด (500): ${errorMessage}`)
                } else if (status === 404) {
                    setError("ไม่พบ API endpoint ที่ต้องการ")
                } else if (status === 403) {
                    setError("ไม่มีสิทธิ์เข้าถึงข้อมูล")
                } else if (status) {
                    setError(`เกิดข้อผิดพลาด (${status}): ${statusText || "Unknown error"}`)
                } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
                    setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า backend server ทำงานอยู่")
                } else {
                    setError(`ไม่สามารถโหลดข้อมูลได้: ${error.message}`)
                }
            } else {
                setError(`ไม่สามารถโหลดข้อมูลได้: ${error instanceof Error ? error.message : "Unknown error"}`)
            }

            setStoryGroups(getFallbackStoryGroups())

            console.error("Failed to fetch data:", error)
            setError("ไม่สามารถโหลดข้อมูลได้")
            setStoryGroups([])

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

            if (user) {
                favoritesAPI.add(currentRequest.id).then(() => setFavoriteCount((c) => c + 1)).catch(() => {})
            }


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
            'click_detail', 
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

    // --- Post Interaction Mock ---
    const toggleLikePost = (postId: string) => {
        setFeedPosts(posts => posts.map(post => {
            if (post.id === postId) {
                return { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
            }
            return post
        }))
    }

    // Filter Posts based on active tab
    const displayPosts = feedPosts.filter(post => activeTab === 'foryou' || post.feedType === activeTab);

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
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800 text-sm font-medium mb-2">รายละเอียดข้อผิดพลาด:</p>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                    <div className="space-y-2">
                        <Button
                            onClick={handleRetry}
                            className="bg-pink-500 hover:bg-pink-600 text-white w-full"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            โหลดใหม่
                        </Button>
                        <p className="text-xs text-gray-500 mt-4">
                            💡 ตรวจสอบ Console (F12) เพื่อดูรายละเอียดเพิ่มเติม
                        </p>
                    </div>
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

                            ❤️ {user ? favoriteCount : likedRequests.length} รายการ
                            ❤️ รายการที่สนใจ {likedRequests.length}

                            ❤️ รายการที่สนใจ {likedRequests.length}

                            ❤️ รายการที่สนใจ {likedRequests.length}
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

                {/* --- NAVIGATION TABS --- */}
                <div className="flex border-b border-gray-200 mb-6 sticky top-0 bg-gradient-to-br from-pink-50 to-purple-50 z-10 pt-2">
                    <button 
                        onClick={() => setActiveTab('swipe')}
                        className={`flex-1 pb-3 text-center font-medium transition-colors relative ${activeTab === 'swipe' ? 'text-pink-600' : 'text-gray-500 hover:bg-gray-100/50'}`}
                    >
                        ปัดเลือกบริจาค
                        {activeTab === 'swipe' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-pink-500 rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('foryou')}
                        className={`flex-1 pb-3 text-center font-medium transition-colors relative ${activeTab === 'foryou' ? 'text-pink-600' : 'text-gray-500 hover:bg-gray-100/50'}`}
                    >
                        สำหรับคุณ
                        {activeTab === 'foryou' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-pink-500 rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 pb-3 text-center font-medium transition-colors relative ${activeTab === 'following' ? 'text-pink-600' : 'text-gray-500 hover:bg-gray-100/50'}`}
                    >
                        กำลังติดตาม
                        {activeTab === 'following' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-pink-500 rounded-t-full"></div>}
                    </button>
                </div>

                {/* --- TAB CONTENT: SWIPE MODE (FULL ORIGINAL LOGIC) --- */}
                {activeTab === 'swipe' && (
                    <div className="max-w-6xl mx-auto">
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
                )}

                {/* --- TAB CONTENT: FEED & STORIES (For You / Following) --- */}
                {(activeTab === 'foryou' || activeTab === 'following') && (
                    <div className="max-w-2xl mx-auto">
                        
                        {/* --- SHORTS SHELF (คลิปวิดีโอแนวตั้ง เลื่อนแนวนอน) --- */}
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Play className="w-5 h-5 text-pink-500 fill-pink-500" />
                                อัปเดตล่าสุด (Shorts)
                            </h2>
                            
                            {/* Horizontal scrollable container */}
                            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x touch-pan-x w-full">
                                {MOCK_SHORTS.map((short) => (
                                    <div 
                                        key={short.id} 
                                        className="relative flex-shrink-0 w-36 h-60 sm:w-40 sm:h-64 rounded-2xl overflow-hidden snap-start cursor-pointer group shadow-sm bg-black"
                                    >
                                        {/* Thumbnail Video Image */}
                                        <img 
                                            src={short.thumbnail} 
                                            alt={short.title}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
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

                                    <CardContent className="p-6 flex-1 flex flex-col">
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

                                            <div className="text-sm text-gray-600 flex-shrink-0 flex items-center gap-2 flex-wrap">
                                                <span><span className="font-medium">ผู้จัดการ:</span> {currentRequest.organizer}</span>
                                                {currentRequest.organizerTrustLevelName && (
                                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                                        {currentRequest.organizerTrustLevelName}
                                                    </Badge>
                                                )}

                                        
                                        {/* Gradient overlay for text readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                        
                                        {/* Play icon centered on hover */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white/30 backdrop-blur-sm p-3 rounded-full">
                                                <Play className="w-8 h-8 text-white fill-white" />

                                            </div>
                                        </div>

                                        {/* Content Information */}
                                        <div className="absolute bottom-3 left-3 right-3 text-white">
                                            <p className="text-xs font-medium line-clamp-2 leading-tight mb-2 drop-shadow-md">
                                                {short.title}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] text-gray-200">
                                                <span className="truncate max-w-[80px]">{short.authorName}</span>
                                                <span className="font-semibold">{short.views} วิว</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Write Post Prompt */}
                        <Card className="border-0 shadow-sm mb-6 bg-white">
                            <CardContent className="p-4 flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                    <img src={user?.avatar || "https://i.pravatar.cc/150?u=current"} alt="profile" className="w-full h-full object-cover" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="แบ่งปันเรื่องราวดีๆ หรือโครงการที่คุณสนใจ..." 
                                    className="bg-gray-100 border-transparent focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-100 rounded-full w-full py-2 px-4 outline-none transition-all"
                                />
                            </CardContent>
                        </Card>

                        {/* Feed Posts */}
                        <div className="space-y-4">
                            {displayPosts.map(post => (
                                <Card key={post.id} className="border-0 shadow-sm hover:bg-gray-50/50 transition-colors cursor-pointer bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                                <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 truncate">
                                                        <span className="font-semibold text-gray-900 truncate">{post.author.name}</span>
                                                        {post.author.isVerified && <Badge variant="secondary" className="px-1 h-4 bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]">✔</Badge>}
                                                        <span className="text-gray-500 text-sm truncate">{post.author.handle}</span>
                                                        <span className="text-gray-400 text-sm">· {post.timestamp}</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></Button>
                                                </div>
                                                
                                                <p className="text-gray-800 mt-1 whitespace-pre-wrap">{post.content}</p>
                                                
                                                {post.image && (
                                                    <div className="mt-3 rounded-2xl overflow-hidden border border-gray-100">
                                                        <img src={post.image} alt="Post attachment" className="w-full max-h-[400px] object-cover" />
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
                                                    <button className="flex items-center gap-2 hover:text-blue-500 group transition-colors text-sm">
                                                        <div className="p-2 rounded-full group-hover:bg-blue-50"><MessageCircle className="w-4 h-4" /></div>
                                                        <span>{post.comments}</span>
                                                    </button>
                                                    <button className="flex items-center gap-2 hover:text-green-500 group transition-colors text-sm">
                                                        <div className="p-2 rounded-full group-hover:bg-green-50"><Repeat2 className="w-4 h-4" /></div>
                                                        <span>{post.shares}</span>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleLikePost(post.id); }}
                                                        className={`flex items-center gap-2 group transition-colors text-sm ${post.isLiked ? 'text-pink-600' : 'hover:text-pink-600'}`}
                                                    >
                                                        <div className={`p-2 rounded-full group-hover:bg-pink-50 ${post.isLiked ? 'bg-pink-50' : ''}`}>
                                                            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                                                        </div>
                                                        <span>{post.likes}</span>
                                                    </button>
                                                    <button className="flex items-center gap-2 hover:text-blue-500 group transition-colors text-sm">
                                                        <div className="p-2 rounded-full group-hover:bg-blue-50"><Share2 className="w-4 h-4" /></div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {displayPosts.length === 0 && (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                                    <p className="font-medium text-lg mb-2">ยังไม่มีโพสต์ใหม่</p>
                                    <p className="text-sm">ติดตามมูลนิธิเพิ่มเติมเพื่อเห็นอัปเดตที่นี่</p>
                                </div>
                            )}
                        </div>
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