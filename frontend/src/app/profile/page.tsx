"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { ProfileCustomization } from "@/components/profile-customization"
import { PointsDisplay } from "@/components/points-display"
import { pointsSystem } from "@/lib/points-system"
import { trustAPI, donationHistoryAPI, favoritesAPI, type DonationHistoryEntry, type FavoriteRequestItem } from "@/lib/api"
import type { UserPoints, ProfileCustomization as ProfileCustomizationType } from "@/types/rewards"
import {
    User,
    Mail,
    Phone,
    Calendar,
    Heart,
    Gift,
    LogOut,
    Edit3,
    ArrowLeft,
    Trophy,
    BarChart3,
    Shield,
    DollarSign,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    Palette,
    HandHelping,
    Search,
    BookOpen,
    Plus,
    Globe,
    Lock,
    Trash2,
    ThumbsUp,
    Share2,
    Facebook,
    Link2,
    ExternalLink,
    Tag,
    Save,
    Leaf,
    Stethoscope,
    Accessibility,
    Home,
    Megaphone,
} from "lucide-react"

const getCategoryIcon = (id: string) => {
    switch (id.toLowerCase()) {
        case "disaster-relief": return "🌊";
        case "medical-health": return "🏥";
        case "education-learning": return "📚";
        case "animal-welfare": return "🐕";
        case "environment": return "🌱";
        case "elderly-care": return "👴";
        case "children-youth": return "👶";
        case "disability-support": return "♿";
        case "community-development": return "🏘️";
        case "religious-spiritual": return "🙏";
        case "arts-culture": return "🎨";
        case "sports-recreation": return "⚽";
        default: return "❤️";
    }
};

// --- รายการหมวดหมู่สิ่งที่สนใจ (ต้องมี ID ตรงกับค่าภาษาอังกฤษใน DB) ---
const INTEREST_CATEGORIES = [
    { id: "disaster-relief", label: "ช่วยเหลือภัยพิบัติ", icon: "🌊" },
    { id: "medical-health", label: "การแพทย์และสุขภาพ", icon: "🏥" },
    { id: "education-learning", label: "การศึกษาและการเรียนรู้", icon: "📚" },
    { id: "animal-welfare", label: "สวัสดิภาพสัตว์", icon: "🐕" },
    { id: "environment", label: "สิ่งแวดล้อม", icon: "🌱" },
    { id: "elderly-care", label: "ดูแลผู้สูงอายุ", icon: "👴" },
    { id: "children-youth", label: "เด็กและเยาวชน", icon: "👶" },
    { id: "disability-support", label: "ผู้พิการ", icon: "♿" },
    { id: "community-development", label: "พัฒนาชุมชน", icon: "🏘️" },
    { id: "religious-spiritual", label: "ศาสนาและจิตวิญญาณ", icon: "🙏" },
    { id: "arts-culture", label: "ศิลปะและวัฒนธรรม", icon: "🎨" },
    { id: "sports-recreation", label: "กีฬาและนันทนาการ", icon: "⚽" },
]

// --- Types ---
interface SocialLinks {
    facebook: string
    instagram: string
    line: string
    youtube: string
    tiktok: string
}

interface MyStory {
    id: string
    title: string
    content: string
    projectName: string
    projectId: string
    images: string[]
    isPublic: boolean
    createdAt: string
    likes: number
    taggedDonations: { id: string; title: string }[]
}

// --- Mock Data ---
const MOCK_MY_STORIES: MyStory[] = [
    {
        id: "story_1",
        title: "ความภูมิใจในการช่วยเหลือ",
        content: "ได้มีโอกาสบริจาคอุปกรณ์การเรียนให้น้องๆ ที่โรงเรียนชนบท รู้สึกดีใจมากที่ได้เห็นรอยยิ้มของพวกเขา...",
        projectName: "สร้างห้องสมุดให้โรงเรียนชนบท",
        projectId: "2",
        images: ["/placeholder.svg?height=200&width=300"],
        isPublic: true,
        createdAt: "2024-01-15T10:30:00Z",
        likes: 24,
        taggedDonations: [{ id: "d2", title: "สร้างห้องสมุดให้โรงเรียนชนบท" }],
    },
]

export default function ProfilePage() {
    const router = useRouter()
    const { user, token, logout, fetchUser } = useAuth()

    // State หลัก
    const [activeTab, setActiveTab] = useState<"stories" | "profile" | "donations" | "favorites">("stories")
    const [showCustomization, setShowCustomization] = useState(false)
    const [showCreateStory, setShowCreateStory] = useState(false)
    const [availableInterests, setAvailableInterests] = useState<{ id: string, label: string }[]>([])
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)

    // State สำหรับแก้ไขโปรไฟล์
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        avatar: ""
    })
    const [selectedImage, setSelectedImage] = useState<File | null>(null)

    // State สำหรับสิ่งที่สนใจ (Interests)
    const [myInterests, setMyInterests] = useState<string[]>([])
    const [isEditingInterests, setIsEditingInterests] = useState(false)

    // Customization & Points
    const [userPoints, setUserPoints] = useState<UserPoints | null>(null)
    const [profileCustomization, setProfileCustomization] = useState<ProfileCustomizationType | null>(null)
    const [trust, setTrust] = useState<{
        donorTrustLevel: number
        donorTrustLevelName: string
        donorTrustScore: number
        donorNextLevelPoints: number
        donorNextLevelName: string | null
        donorProgress: number
        donorIsMaxLevel: boolean
        organizerTrustLevel: number
        organizerTrustLevelName: string
        organizerTrustScore: number
        organizerNextLevelPoints: number
        organizerNextLevelName: string | null
        organizerProgress: number
        organizerIsMaxLevel: boolean
    } | null>(null)

    // ประวัติบริจาค (แท็บ donations)
    const [donationHistory, setDonationHistory] = useState<DonationHistoryEntry[]>([])
    const [donationHistoryLoading, setDonationHistoryLoading] = useState(false)
    const [historyFilterType, setHistoryFilterType] = useState<"" | "money" | "item" | "volunteer">("")
    const [historyDateFrom, setHistoryDateFrom] = useState("")
    const [historyDateTo, setHistoryDateTo] = useState("")
    const [historyPage, setHistoryPage] = useState(1)
    const [historyLastPage, setHistoryLastPage] = useState(1)
    const [historyTotal, setHistoryTotal] = useState(0)

    // รายการที่สนใจ (แท็บ favorites)
    const [favoriteList, setFavoriteList] = useState<FavoriteRequestItem[]>([])
    const [favoriteLoading, setFavoriteLoading] = useState(false)

    // Stories Logic
    const [myStories, setMyStories] = useState<MyStory[]>([])
    const [newStory, setNewStory] = useState({
        title: "",
        content: "",
        projectName: "",
        projectId: "",
        isPublic: true,
        taggedDonationIds: [] as string[],
    })

    // Profile Extra Info Logic
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({
        facebook: "",
        instagram: "",
        line: "",
        youtube: "",
        tiktok: "",
    })
    const [aboutMe, setAboutMe] = useState("")
    const [isEditingSocial, setIsEditingSocial] = useState(false)
    const [editSocialLinks, setEditSocialLinks] = useState<SocialLinks>({ ...socialLinks })
    const [editAboutMe, setEditAboutMe] = useState(aboutMe)

    // Load Data
    useEffect(() => {
        if (!user) return

        const loadUserData = async () => {
            pointsSystem.loadFromStorage()
            setUserPoints(pointsSystem.getUserPoints(user.id))

            const saved = localStorage.getItem(`profile_customization_${user.id}`)
            if (saved) {
                setProfileCustomization(JSON.parse(saved))
            }

            const points = await pointsSystem.getUserPointsWithSync(user.id)
            if (points) setUserPoints(points)

            if (localStorage.getItem("auth_token")) {
                try {
                    const res = await trustAPI.getMyTrust()
                    const d = res.data as any
                    if (d) setTrust({
                        donorTrustLevel: d.donorTrustLevel ?? 1,
                        donorTrustLevelName: d.donorTrustLevelName ?? "เริ่มต้น",
                        donorTrustScore: d.donorTrustScore ?? 0,
                        donorNextLevelPoints: d.donorNextLevelPoints ?? 0,
                        donorNextLevelName: d.donorNextLevelName ?? null,
                        donorProgress: d.donorProgress ?? 100,
                        donorIsMaxLevel: d.donorIsMaxLevel ?? false,
                        organizerTrustLevel: d.organizerTrustLevel ?? 1,
                        organizerTrustLevelName: d.organizerTrustLevelName ?? "เริ่มต้น",
                        organizerTrustScore: d.organizerTrustScore ?? 0,
                        organizerNextLevelPoints: d.organizerNextLevelPoints ?? 0,
                        organizerNextLevelName: d.organizerNextLevelName ?? null,
                        organizerProgress: d.organizerProgress ?? 100,
                        organizerIsMaxLevel: d.organizerIsMaxLevel ?? false,
                    })
                } catch (error) {
                    console.error("Failed to fetch trust data:", error)
                }
            }

            // Stories
            const savedStories = localStorage.getItem(`my_stories_${user.id}`)
            if (savedStories) {
                setMyStories(JSON.parse(savedStories))
            } else {
                setMyStories(MOCK_MY_STORIES)
            }

            // Socials & About Me
            const savedSocials = localStorage.getItem(`user_socials_${user.id}`)
            if (savedSocials) setSocialLinks(JSON.parse(savedSocials))

            const savedAboutMe = localStorage.getItem(`user_aboutme_${user.id}`)
            if (savedAboutMe) setAboutMe(savedAboutMe)

            // Interests
            if (user.interests && Array.isArray(user.interests) && user.interests.length > 0) {
                const normalizedInterests = user.interests.map((i: string) => i.toLowerCase())
                setMyInterests(normalizedInterests)
            } else {
                setMyInterests([])
            }
        }

        loadUserData()
    }, [user])

    // โหลดประวัติบริจาคเมื่อเปิดแท็บ donations หรือเปลี่ยนฟีเตอร์/หน้า
    // แก้ไขตรงส่วน useEffect ที่โหลดประวัติบริจาค
    useEffect(() => {
        if (activeTab !== "donations" || !user) return

        let cancelled = false
        setDonationHistoryLoading(true)

        const params: {
            type?: "money" | "item" | "volunteer";
            date_from?: string;
            date_to?: string;
            page: number;
            per_page: number;
        } = {
            page: historyPage,
            per_page: 15,
        }

        // แก้ไขตรงนี้: ตรวจสอบและ cast type ให้ถูกต้อง
        if (historyFilterType) {
            params.type = historyFilterType as "money" | "item" | "volunteer";
        }

        if (historyDateFrom) params.date_from = historyDateFrom
        if (historyDateTo) params.date_to = historyDateTo

        donationHistoryAPI.getHistory(params)
            .then((res) => {
                if (cancelled) return
                const d = res.data
                setDonationHistory(Array.isArray(d.data) ? d.data : [])
                setHistoryLastPage(d.last_page ?? 1)
                setHistoryTotal(d.total ?? 0)
            })
            .catch(() => {
                if (!cancelled) setDonationHistory([])
            })
            .finally(() => {
                if (!cancelled) setDonationHistoryLoading(false)
            })

        return () => { cancelled = true }
    }, [activeTab, user, historyPage, historyFilterType, historyDateFrom, historyDateTo])

    // โหลดรายการที่สนใจเมื่อเปิดแท็บ favorites
    useEffect(() => {
        if (activeTab !== "favorites" || !user) return

        let cancelled = false
        setFavoriteLoading(true)

        favoritesAPI.getList()
            .then((res) => {
                if (cancelled) return
                const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
                setFavoriteList(list)
            })
            .catch(() => {
                if (!cancelled) setFavoriteList([])
            })
            .finally(() => {
                if (!cancelled) setFavoriteLoading(false)
            })

        return () => { cancelled = true }
    }, [activeTab, user])

    // --- Fetch Categories จาก API ---
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donation-requests/categories`);
                if (res.ok) {
                    const data = await res.json();
                    const formattedCategories = data.map((cat: any) => ({
                        id: cat.id,
                        label: cat.name
                    }));
                    setAvailableInterests(formattedCategories);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };

        fetchCategories();
    }, []);

    // Effect สำหรับเตรียมข้อมูลลงฟอร์มแก้ไขโปรไฟล์
    useEffect(() => {
        if (showEditProfile && user) {
            setEditForm({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phone: user.phone || "",
                avatar: user.avatar || ""
            })
        }
    }, [showEditProfile, user])

    // Save Stories
    useEffect(() => {
        if (user) {
            localStorage.setItem(`my_stories_${user.id}`, JSON.stringify(myStories))
        }
    }, [myStories, user])

    const saveSocials = () => {
        if (user) {
            setSocialLinks(editSocialLinks)
            setAboutMe(editAboutMe)
            localStorage.setItem(`user_socials_${user.id}`, JSON.stringify(editSocialLinks))
            localStorage.setItem(`user_aboutme_${user.id}`, editAboutMe)
            setIsEditingSocial(false)
            toast({ title: "บันทึกข้อมูลสำเร็จ", description: "ข้อมูลส่วนตัวของคุณได้รับการอัปเดตแล้ว" })
        }
    }

    // --- ฟังก์ชันจัดการสิ่งที่สนใจ (Interests) ---
    const handleToggleInterest = (id: string) => {
        if (myInterests.includes(id)) {
            setMyInterests(myInterests.filter(item => item !== id))
        } else {
            setMyInterests([...myInterests, id])
        }
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || !user || !token) return;
        setIsCreatingCategory(true);

        const newId = `cat_${Date.now()}`;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donation-requests/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: newId,
                    name: newCategoryName.trim()
                })
            });

            if (res.ok) {
                const createdCategory = await res.json();
                const finalId = createdCategory.id || newId;
                const finalName = createdCategory.name || newCategoryName.trim();

                setAvailableInterests(prev => [...prev, { id: finalId, label: finalName }]);
                setMyInterests(prev => [...prev, finalId]);
                setNewCategoryName("");
                setShowNewCategoryInput(false);
                toast({ title: "เพิ่มหมวดหมู่ใหม่สำเร็จ ✅" });
            } else {
                throw new Error("Failed to create category");
            }
        } catch (error) {
            console.error("Create category error:", error);
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถเพิ่มหมวดหมู่ได้ โปรดตรวจสอบ Backend",
                variant: "destructive",
            });
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleSaveInterests = async () => {
        if (!user || !token) return;
        setIsSaving(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    preferred_categories: myInterests
                })
            });

            if (res.ok) {
                if (fetchUser) await fetchUser();
                setIsEditingInterests(false);
                toast({
                    title: "บันทึกความสนใจเรียบร้อย ✅",
                    description: "ข้อมูลถูกอัปเดตลงฐานข้อมูลแล้ว"
                });
            } else {
                throw new Error("Failed to update interests");
            }
        } catch (error) {
            console.error("Update interests failed:", error);
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }

    // --- ฟังก์ชันบันทึกการแก้ไขโปรไฟล์ (รวมอัปโหลดรูป) ---
    const handleSaveProfile = async () => {
        if (!user || !token) return

        setIsSaving(true)
        try {
            let finalAvatarUrl = editForm.avatar;

            if (selectedImage) {
                const formData = new FormData();
                formData.append("file", selectedImage);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Image upload failed");

                const data = await uploadRes.json();
                finalAvatarUrl = data.url;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    phone: editForm.phone,
                    avatar: finalAvatarUrl
                })
            })

            if (res.ok) {
                await fetchUser()
                toast({
                    title: "บันทึกสำเร็จ ✅",
                    description: "ข้อมูลส่วนตัวของคุณได้รับการอัปเดตแล้ว",
                    duration: 3000,
                })
                setShowEditProfile(false)
                setSelectedImage(null)
            } else {
                throw new Error("Failed to update")
            }
        } catch (error) {
            console.error("Update failed:", error)
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถบันทึกข้อมูลได้",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    // --- Helper Functions ---
    const handleCopyLink = () => {
        if (!user) return

        const origin = window.location.origin
        const publicProfileUrl = `${origin}/profile/${user.id}`

        navigator.clipboard.writeText(publicProfileUrl)
            .then(() => {
                toast({
                    title: "คัดลอกลิงก์สาธารณะสำเร็จ ✅",
                    description: `ลิงก์: ${publicProfileUrl}`,
                    duration: 3000,
                })
            })
            .catch((err) => {
                console.error("Copy failed", err)
                toast({
                    title: "เกิดข้อผิดพลาด",
                    description: "ไม่สามารถคัดลอกลิงก์ได้",
                    variant: "destructive",
                })
            })
    }

    const renderExternalLink = (url: string) => {
        if (!url) return "-"
        const href = url.startsWith('http') ? url : `https://${url}`
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline hover:text-blue-800 truncate block max-w-[200px]"
            >
                {url}
            </a>
        )
    }

    if (!user) {
        router.push("/login")
        return null
    }

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`
    }

    const getUserLevel = (totalDonated: number) => {
        if (totalDonated >= 50000) return { level: "ทอง", color: "bg-yellow-500", icon: "🏆" }
        if (totalDonated >= 20000) return { level: "เงิน", color: "bg-gray-400", icon: "🥈" }
        if (totalDonated >= 5000) return { level: "ทองแดง", color: "bg-orange-500", icon: "🥉" }
        return { level: "เริ่มต้น", color: "bg-blue-500", icon: "⭐" }
    }

    const userLevel = getUserLevel(user.totalDonated)

    const renderCustomizedAvatar = () => {
        const theme = profileCustomization?.theme || "default"
        const frame = profileCustomization?.frame || "none"
        const badge = profileCustomization?.badge || ""

        const isGold = theme === "gold" || theme === "theme_gold"
        const isPlatinum = theme === "platinum" || theme === "theme_platinum"
        const isDiamond = theme === "diamond" || theme === "theme_diamond"
        const themeGradient =
            isGold ? "from-yellow-400 to-orange-500"
                : isPlatinum ? "from-gray-300 to-gray-500"
                    : isDiamond ? "from-blue-400 to-cyan-300"
                        : "from-pink-500 to-purple-500"

        const isRainbow = frame === "rainbow" || frame === "frame_rainbow"
        const isFire = frame === "fire" || frame === "frame_fire"
        const isIce = frame === "ice" || frame === "frame_ice"
        const frameClass =
            isRainbow ? "border-4 border-gradient-to-r from-red-500 via-yellow-500 to-blue-500"
                : isFire ? "border-4 border-orange-500 shadow-lg shadow-orange-200"
                    : isIce ? "border-4 border-cyan-400 shadow-lg shadow-cyan-200"
                        : "border-2 border-gray-200"

        const isHeart = badge === "heart" || badge === "badge_heart"
        const isCrown = badge === "crown" || badge === "badge_crown"
        const isStar = badge === "star" || badge === "badge_star"
        const isDiamondBadge = badge === "diamond" || badge === "badge_diamond"
        const badgeEmoji = isHeart ? "💛" : isCrown ? "👑" : isStar ? "⭐" : isDiamondBadge ? "💎" : ""

        return (
            <div className="relative inline-block">
                <div className={`p-1 rounded-full ${frameClass}`}>
                    <Avatar className="w-24 h-24 mx-auto">
                        <AvatarImage src={user.avatar || "https://via.placeholder.com/400x300?text=No+Image"} alt={`${user.firstName} ${user.lastName}`} />
                        <AvatarFallback className={`text-2xl bg-gradient-to-r ${themeGradient} text-white`}>
                            {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                    </Avatar>
                </div>
                {badge && badgeEmoji && (
                    <div className="absolute -top-2 -right-2 text-2xl">
                        {badgeEmoji}
                    </div>
                )}
                <Badge className={`absolute -bottom-2 -right-2 ${userLevel.color} text-white`}>
                    {userLevel.icon} {userLevel.level}
                </Badge>
            </div>
        )
    }

    const getDonationStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return { text: "สำเร็จ", class: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3 mr-1" /> }
            case "pending":
                return { text: "รอดำเนินการ", class: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3 mr-1" /> }
            case "shipped":
                return { text: "จัดส่งแล้ว", class: "bg-blue-100 text-blue-700", icon: <Truck className="w-3 h-3 mr-1" /> }
            case "received":
                return { text: "ได้รับแล้ว", class: "bg-purple-100 text-purple-700", icon: <CheckCircle className="w-3 h-3 mr-1" /> }
            case "cancelled":
                return { text: "ยกเลิก", class: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3 mr-1" /> }
            default:
                return { text: status, class: "bg-gray-100 text-gray-700", icon: null }
        }
    }

    const getSlipStatusBadge = (status: string) => {
        switch (status) {
            case "verified":
                return { text: "อนุมัติแล้ว", class: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3 mr-1" /> }
            case "rejected":
                return { text: "ถูกปฏิเสธ", class: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3 mr-1" /> }
            default:
                return { text: "รอตรวจสอบ", class: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3 mr-1" /> }
        }
    }

    const getItemStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return { text: "อนุมัติแล้ว", class: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3 mr-1" /> }
            case "REJECTED":
                return { text: "ปฏิเสธ", class: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3 mr-1" /> }
            default:
                return { text: "รอตรวจสอบ", class: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3 mr-1" /> }
        }
    }

    const getVolunteerStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return { text: "เสร็จสิ้น", class: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3 mr-1" /> }
            case "APPROVED":
                return { text: "อนุมัติแล้ว", class: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-3 h-3 mr-1" /> }
            case "REJECTED":
                return { text: "ปฏิเสธ", class: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3 mr-1" /> }
            default:
                return { text: "สมัครแล้ว", class: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3 mr-1" /> }
        }
    }

    const applyHistoryFilters = () => {
        setHistoryPage(1)
    }

    const handleCreateStory = () => {
        if (!user || !newStory.title || !newStory.content) return

        const tagged = newStory.taggedDonationIds
            .map((id) => {
                const d = user.donations?.find((don) => don.id === id)
                return d ? { id: d.id, title: d.requestTitle || "โครงการ" } : null
            })
            .filter(Boolean) as { id: string; title: string }[]

        const story: MyStory = {
            id: `story_${Date.now()}`,
            title: newStory.title,
            content: newStory.content,
            projectName: tagged.length > 0 ? tagged[0].title : "เรื่องราวทั่วไป",
            projectId: "",
            images: [],
            isPublic: newStory.isPublic,
            createdAt: new Date().toISOString(),
            likes: 0,
            taggedDonations: tagged,
        }

        setMyStories([story, ...myStories])
        setNewStory({ title: "", content: "", projectName: "", projectId: "", isPublic: true, taggedDonationIds: [] })
        setShowCreateStory(false)
        toast({ title: "สร้างเรื่องราวสำเร็จ" })
    }

    const handleDeleteStory = (id: string) => {
        setMyStories(myStories.filter((s) => s.id !== id))
        toast({ title: "ลบเรื่องราวแล้ว" })
    }

    const getJoinDate = () => {
        if (!user) return "-"
        const rawDate = user.joinDate || (user as any).createdAt || (user as any).created_at;
        if (!rawDate) return "-";

        try {
            return new Date(rawDate).toLocaleDateString("th-TH", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return "-";
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="hover:bg-pink-50">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับหน้าหลัก
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">โปรไฟล์ของฉัน</h1>
                                <p className="text-sm text-gray-600">จัดการข้อมูลส่วนตัวและดูประวัติการบริจาค</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => router.push("/rewards")} className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 bg-transparent">
                                <Gift className="w-4 h-4 mr-2" />
                                ร้านรางวัล
                            </Button>
                            {user.role === "organizer" && (
                                <Button variant="outline" onClick={() => router.push("/organizer-dashboard")} className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    แดชบอร์ดผู้จัดการ
                                </Button>
                            )}
                            {user.role === "admin" && (
                                <Button variant="outline" onClick={() => router.push("/admin-dashboard")} className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent">
                                    <Shield className="w-4 h-4 mr-2" />
                                    แผงควบคุมแอดมิน
                                </Button>
                            )}
                            <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent">
                                <LogOut className="w-4 h-4 mr-2" />
                                ออกจากระบบ
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="text-center">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {renderCustomizedAvatar()}

                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">{user.firstName} {user.lastName}</h2>
                                        <p className="text-gray-600">{user.email}</p>
                                        {profileCustomization?.title && profileCustomization.title !== "none" && (() => {
                                            const t = profileCustomization.title
                                            const isHelper = t === "helper" || t === "title_helper"
                                            const isGuardian = t === "guardian" || t === "title_guardian"
                                            const isLegend = t === "legend" || t === "title_legend"
                                            const label = isHelper ? "ผู้ช่วยเหลือ" : isGuardian ? "ผู้พิทักษ์" : isLegend ? "ตำนาน" : ""
                                            return label ? <Badge variant="outline" className="mt-1">{label}</Badge> : null
                                        })()}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-pink-600">฿{formatAmount(user.totalDonated)}</div>
                                            <div className="text-xs text-gray-500">ยอดบริจาครวม</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">{user.donationCount}</div>
                                            <div className="text-xs text-gray-500">ครั้งที่บริจาค</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowEditProfile(true)}>
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            แก้ไขโปรไฟล์
                                        </Button>
                                        <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowCustomization(true)}>
                                            <Palette className="w-4 h-4 mr-2" />
                                            ตกแต่งโปรไฟล์
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                                            onClick={handleCopyLink}
                                        >
                                            <Link2 className="w-4 h-4 mr-2" />
                                            คัดลอกลิงก์โปรไฟล์
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Points Display */}
                        {userPoints && (
                            <div className="mt-6">
                                <PointsDisplay userPoints={userPoints} />
                            </div>
                        )}

                        {/* Trust Level */}
                        {trust && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Shield className="w-5 h-5 text-amber-500" />
                                        ความน่าเชื่อถือ
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-lg bg-blue-50 p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">ผู้บริจาค</span>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                {trust.donorTrustLevelName}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">คะแนน {trust.donorTrustScore}</p>
                                        {trust.donorIsMaxLevel ? (
                                            <p className="text-sm text-blue-700">คุณอยู่ระดับสูงสุดแล้ว</p>
                                        ) : (
                                            <>
                                                <Progress value={trust.donorProgress} className="h-2" />
                                                <p className="text-sm text-blue-700">
                                                    อีก {trust.donorNextLevelPoints} คะแนนถึงระดับ {trust.donorNextLevelName}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <div className="rounded-lg bg-green-50 p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">ผู้รับบริจาค</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                {trust.organizerTrustLevelName}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">คะแนน {trust.organizerTrustScore}</p>
                                        {trust.organizerIsMaxLevel ? (
                                            <p className="text-sm text-green-700">คุณอยู่ระดับสูงสุดแล้ว</p>
                                        ) : (
                                            <>
                                                <Progress value={trust.organizerProgress} className="h-2" />
                                                <p className="text-sm text-green-700">
                                                    อีก {trust.organizerNextLevelPoints} คะแนนถึงระดับ {trust.organizerNextLevelName}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <Button variant="link" className="w-full text-amber-600 p-0 h-auto" asChild>
                                        <Link href="/trust-levels">ดูรายละเอียดระดับความน่าเชื่อถือ</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* About Me & Social Links */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Globe className="w-5 h-5 text-pink-500" />
                                        เกี่ยวกับฉัน
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        if (isEditingSocial) saveSocials()
                                        else {
                                            setEditSocialLinks({ ...socialLinks })
                                            setEditAboutMe(aboutMe)
                                            setIsEditingSocial(true)
                                        }
                                    }}>
                                        {isEditingSocial ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isEditingSocial ? (
                                    <Textarea value={editAboutMe} onChange={(e) => setEditAboutMe(e.target.value)} placeholder="เขียนแนะนำตัวเอง..." rows={2} className="text-sm" />
                                ) : (
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{aboutMe || "ยังไม่ได้เพิ่มคำแนะนำตัว"}</p>
                                )}

                                <div className="space-y-2">
                                    {/* Facebook */}
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Facebook className="w-4 h-4 text-blue-600" />
                                        </div>
                                        {isEditingSocial ? (
                                            <Input value={editSocialLinks.facebook} onChange={(e) => setEditSocialLinks({ ...editSocialLinks, facebook: e.target.value })} placeholder="Facebook URL" className="text-sm h-8" />
                                        ) : (
                                            <div className="text-sm text-gray-600 truncate">
                                                {renderExternalLink(socialLinks.facebook)}
                                            </div>
                                        )}
                                    </div>
                                    {/* Line */}
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <div className="w-4 h-4 text-green-600 font-bold text-xs flex items-center justify-center">L</div>
                                        </div>
                                        {isEditingSocial ? (
                                            <Input value={editSocialLinks.line} onChange={(e) => setEditSocialLinks({ ...editSocialLinks, line: e.target.value })} placeholder="Line ID / URL" className="text-sm h-8" />
                                        ) : (
                                            <div className="text-sm text-gray-600 truncate">
                                                {renderExternalLink(socialLinks.line)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Tabs */}
                    <div className="lg:col-span-2">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 p-1 bg-white border rounded-xl mb-6">
                                <TabsTrigger value="stories" className="rounded-lg">เรื่องราว</TabsTrigger>
                                <TabsTrigger value="profile" className="rounded-lg">ข้อมูลส่วนตัว</TabsTrigger>
                                <TabsTrigger value="donations" className="rounded-lg">ประวัติการบริจาค</TabsTrigger>
                                <TabsTrigger value="favorites" className="rounded-lg">รายการโปรด</TabsTrigger>
                            </TabsList>

                            {/* Tab: Stories */}
                            <TabsContent value="stories" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800">เรื่องราวของฉัน</h3>
                                    <Button onClick={() => setShowCreateStory(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none">
                                        <Plus className="w-4 h-4 mr-2" /> เขียนเรื่องราว
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {myStories.length > 0 ? (
                                        myStories.map((story) => (
                                            <Card key={story.id}>
                                                <CardContent className="p-6">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="w-10 h-10">
                                                                <AvatarImage src={user.avatar} />
                                                                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                                                                <p className="text-xs text-gray-500">{new Date(story.createdAt).toLocaleDateString("th-TH")}</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => handleDeleteStory(story.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <h4 className="text-lg font-bold mb-2">{story.title}</h4>
                                                    <p className="text-gray-600 mb-4 whitespace-pre-wrap">{story.content}</p>
                                                    {story.taggedDonations.length > 0 && (
                                                        <div className="flex gap-2">
                                                            {story.taggedDonations.map((tag, idx) => (
                                                                <Badge key={idx} variant="secondary" className="bg-pink-50 text-pink-700">
                                                                    ❤️ {tag.title}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-white rounded-xl border border-dashed">
                                            <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                            <p className="text-gray-500">ยังไม่มีเรื่องราว แบ่งปันประสบการณ์ของคุณเลย!</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Tab: Profile Info */}
                            <TabsContent value="profile" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>ข้อมูลส่วนตัว</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-gray-500">อีเมล</Label>
                                                <div className="p-3 bg-gray-50 rounded-lg flex items-center">
                                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                    {user.email}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-gray-500">เบอร์โทรศัพท์</Label>
                                                <div className="p-3 bg-gray-50 rounded-lg flex items-center">
                                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                    {user.phone || "-"}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-gray-500">วันที่เข้าร่วม</Label>
                                                <div className="p-3 bg-gray-50 rounded-lg flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    {getJoinDate()}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Interests Section */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-pink-500" />
                                            สิ่งที่ฉันสนใจ
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (isEditingInterests) handleSaveInterests()
                                                else setIsEditingInterests(true)
                                            }}
                                            className={isEditingInterests ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-gray-500 hover:text-gray-900"}
                                        >
                                            {isEditingInterests ? (
                                                <><Save className="w-4 h-4 mr-2" /> บันทึก</>
                                            ) : (
                                                <><Edit3 className="w-4 h-4 mr-2" /> แก้ไข</>
                                            )}
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        {isEditingInterests ? (
                                            /* Edit Mode */
                                            <div className="flex flex-wrap gap-2">
                                                {INTEREST_CATEGORIES.map((cat) => {
                                                    const isSelected = myInterests.includes(cat.id)
                                                    return (
                                                        <div
                                                            key={cat.id}
                                                            onClick={() => handleToggleInterest(cat.id)}
                                                            className={`cursor-pointer px-3 py-2 rounded-xl border text-sm flex items-center gap-2 transition-all select-none ${isSelected
                                                                    ? "bg-pink-100 border-pink-500 text-pink-700 shadow-sm font-medium"
                                                                    : "bg-white border-gray-200 text-gray-600 hover:border-pink-300 hover:bg-pink-50"
                                                                }`}
                                                        >
                                                            <span className="text-lg">{cat.icon}</span>
                                                            {cat.label}
                                                            {isSelected && <CheckCircle className="w-4 h-4 ml-1 text-pink-600" />}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            /* View Mode */
                                            <div className="flex flex-wrap gap-2">
                                                {myInterests.length > 0 ? (
                                                    myInterests.map((id) => {
                                                        const localCat = INTEREST_CATEGORIES.find((c) => c.id === id);
                                                        const apiCat = availableInterests.find((c) => c.id === id);
                                                        const displayLabel = localCat ? localCat.label : (apiCat ? apiCat.label : id);
                                                        const icon = localCat ? localCat.icon : getCategoryIcon(id);

                                                        return (
                                                            <Badge
                                                                key={id}
                                                                variant="secondary"
                                                                className="px-3 py-1.5 text-sm bg-pink-50 text-pink-700 hover:bg-pink-100 gap-2 border border-pink-100"
                                                            >
                                                                <span>{icon}</span>
                                                                {displayLabel}
                                                            </Badge>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center w-full py-6 text-gray-400 border-2 border-dashed rounded-xl bg-gray-50">
                                                        <Heart className="w-8 h-8 mb-2 opacity-20" />
                                                        <p className="text-sm">ยังไม่ได้ระบุสิ่งที่สนใจ</p>
                                                        <Button
                                                            variant="link"
                                                            onClick={() => setIsEditingInterests(true)}
                                                            className="text-pink-600 h-auto p-0 mt-1"
                                                        >
                                                            เลือกสิ่งที่คุณสนใจตอนนี้
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Donations */}
                            <TabsContent value="donations" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Gift className="w-5 h-5 text-pink-500" />
                                            ประวัติการบริจาค
                                        </CardTitle>
                                        <p className="text-sm text-gray-600">รายการบริจาคเงิน บริจาคของ และบริจาคแรงทั้งหมดของคุณ</p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Filters */}
                                        <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-gray-600">ประเภท</label>
                                                <select
                                                    value={historyFilterType}
                                                    onChange={(e) => setHistoryFilterType((e.target.value || "") as "" | "money" | "item" | "volunteer")}
                                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm min-w-[120px]"
                                                >
                                                    <option value="">ทั้งหมด</option>
                                                    <option value="money">บริจาคเงิน</option>
                                                    <option value="item">บริจาคของ</option>
                                                    <option value="volunteer">บริจาคแรง</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-gray-600">จากวันที่</label>
                                                <input
                                                    type="date"
                                                    value={historyDateFrom}
                                                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-gray-600">ถึงวันที่</label>
                                                <input
                                                    type="date"
                                                    value={historyDateTo}
                                                    onChange={(e) => setHistoryDateTo(e.target.value)}
                                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <Button size="sm" onClick={applyHistoryFilters} className="bg-pink-500 hover:bg-pink-600">
                                                <Search className="w-4 h-4 mr-1" />
                                                ค้นหา
                                            </Button>
                                        </div>

                                        {donationHistoryLoading ? (
                                            <div className="py-8 text-center text-gray-500">กำลังโหลด...</div>
                                        ) : donationHistory.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p>{historyFilterType || historyDateFrom || historyDateTo ? "ไม่พบรายการตามเงื่อนไข" : "ยังไม่มีประวัติการบริจาค"}</p>
                                                <p className="text-sm mt-1">เริ่มบริจาคเพื่อช่วยเหลือผู้อื่น</p>
                                                <Button onClick={() => router.push("/")} className="mt-4 bg-pink-500 hover:bg-pink-600">
                                                    เริ่มบริจาค
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-4">
                                                    {donationHistory.map((entry) => {
                                                        const projectId = entry.project?.id
                                                        const projectTitle = entry.project?.title || "ไม่ระบุโครงการ"
                                                        const dateStr = new Date(entry.date).toLocaleDateString("th-TH", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })

                                                        if (entry.history_type === "money") {
                                                            const slipStatus = getSlipStatusBadge(entry.status)
                                                            return (
                                                                <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow">
                                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <Link
                                                                            href={projectId ? `/donation/${projectId}` : "#"}
                                                                            className="text-lg font-semibold text-gray-800 hover:text-pink-600 transition-colors"
                                                                        >
                                                                            {projectTitle}
                                                                        </Link>
                                                                        <Badge className={`${slipStatus.class} text-xs px-2 py-1 shrink-0`}>
                                                                            {slipStatus.icon}
                                                                            {slipStatus.text}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 mb-2">{dateStr}</p>
                                                                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                                        <span>บริจาคเงิน <span className="font-bold text-green-700">฿{formatAmount(entry.amount)}</span></span>
                                                                        {entry.payment_method && <span className="text-gray-500">({entry.payment_method})</span>}
                                                                    </div>
                                                                    {entry.slip_url && (
                                                                        <a href={entry.slip_url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                                                                            <img src={entry.slip_url} alt="สลิป" className="w-full max-w-xs h-32 object-contain bg-gray-100 rounded border" />
                                                                        </a>
                                                                    )}
                                                                </Card>
                                                            )
                                                        }

                                                        if (entry.history_type === "item") {
                                                            const itemStatus = getItemStatusBadge(entry.status)
                                                            return (
                                                                <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow">
                                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <Link
                                                                            href={projectId ? `/donation/${projectId}` : "#"}
                                                                            className="text-lg font-semibold text-gray-800 hover:text-pink-600 transition-colors"
                                                                        >
                                                                            {projectTitle}
                                                                        </Link>
                                                                        <Badge className={`${itemStatus.class} text-xs px-2 py-1 shrink-0`}>
                                                                            {itemStatus.icon}
                                                                            {itemStatus.text}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 mb-2">{dateStr}</p>
                                                                    <div className="flex items-center gap-2 text-gray-700 text-sm mb-2">
                                                                        <Package className="w-4 h-4" />
                                                                        <span>บริจาคสิ่งของ</span>
                                                                        {entry.estimated_value != null && (
                                                                            <span className="text-gray-500">(มูลค่าโดยประมาณ ฿{formatAmount(entry.estimated_value)})</span>
                                                                        )}
                                                                    </div>
                                                                    {entry.items_needed && <p className="text-sm text-gray-600 mb-2">{entry.items_needed}</p>}
                                                                    {entry.evidence_images && entry.evidence_images.length > 0 && (
                                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                                            {entry.evidence_images.slice(0, 4).map((url, i) => (
                                                                                <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded border" />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </Card>
                                                            )
                                                        }

                                                        if (entry.history_type === "volunteer") {
                                                            const volStatus = getVolunteerStatusBadge(entry.status)
                                                            return (
                                                                <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow">
                                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <Link
                                                                            href={projectId ? `/donation/${projectId}` : "#"}
                                                                            className="text-lg font-semibold text-gray-800 hover:text-pink-600 transition-colors"
                                                                        >
                                                                            {projectTitle}
                                                                        </Link>
                                                                        <Badge className={`${volStatus.class} text-xs px-2 py-1 shrink-0`}>
                                                                            {volStatus.icon}
                                                                            {volStatus.text}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 mb-2">{dateStr}</p>
                                                                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                                                                        <HandHelping className="w-4 h-4 text-blue-600" />
                                                                        <span>บริจาคแรง</span>
                                                                        {entry.estimated_hours != null && (
                                                                            <span className="text-gray-600">ประมาณ {entry.estimated_hours} ชม.</span>
                                                                        )}
                                                                    </div>
                                                                    {entry.approved_at && (
                                                                        <p className="text-xs text-gray-500 mt-1">อนุมัติเมื่อ {new Date(entry.approved_at).toLocaleDateString("th-TH")}</p>
                                                                    )}
                                                                    {entry.completed_at && (
                                                                        <p className="text-xs text-gray-500">เสร็จสิ้นเมื่อ {new Date(entry.completed_at).toLocaleDateString("th-TH")}</p>
                                                                    )}
                                                                </Card>
                                                            )
                                                        }
                                                        return null
                                                    })}
                                                </div>

                                                {historyLastPage > 1 && (
                                                    <div className="flex items-center justify-between pt-4 border-t">
                                                        <p className="text-sm text-gray-500">
                                                            แสดง {donationHistory.length} จาก {historyTotal} รายการ
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={historyPage <= 1}
                                                                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                                                            >
                                                                ก่อนหน้า
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={historyPage >= historyLastPage}
                                                                onClick={() => setHistoryPage((p) => p + 1)}
                                                            >
                                                                ถัดไป
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Favorites */}
                            <TabsContent value="favorites">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-pink-500" />
                                            รายการที่สนใจ
                                        </CardTitle>
                                        <p className="text-sm text-gray-600">คำขอบริจาคที่คุณสนใจ</p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {favoriteLoading ? (
                                            <p className="text-gray-500 text-sm">กำลังโหลด...</p>
                                        ) : favoriteList.length === 0 ? (
                                            <div className="text-center py-6 text-gray-500">
                                                <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                <p>ยังไม่มีรายการที่สนใจ</p>
                                                <p className="text-sm mt-1">กดปุ่มถูกใจที่หน้ารายละเอียดโครงการเพื่อเก็บไว้ดูภายหลัง</p>
                                                <Button onClick={() => router.push("/")} variant="outline" className="mt-3">
                                                    ดูคำขอบริจาค
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-gray-600">คุณมีรายการที่สนใจ {favoriteList.length} รายการ</p>
                                                    <Button variant="outline" onClick={() => router.push("/favorites")} className="bg-transparent">
                                                        ดูทั้งหมด
                                                    </Button>
                                                </div>
                                                <ul className="space-y-2">
                                                    {favoriteList.slice(0, 5).map((req) => (
                                                        <li key={req.id}>
                                                            <Link
                                                                href={`/enhanced-donation/${req.id}`}
                                                                className="block p-3 rounded-lg border border-gray-200 hover:bg-pink-50 hover:border-pink-200 transition-colors"
                                                            >
                                                                <span className="font-medium text-gray-800">{req.title}</span>
                                                                {req.category && (
                                                                    <Badge variant="secondary" className="ml-2 text-xs">{req.category}</Badge>
                                                                )}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {favoriteList.length > 5 && (
                                                    <Button variant="outline" className="w-full" onClick={() => router.push("/favorites")}>
                                                        ดูทั้งหมด {favoriteList.length} รายการ
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Dialog: Create Story */}
            <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>เขียนเรื่องราวความประทับใจ</DialogTitle>
                        <DialogDescription>แบ่งปันความรู้สึกดีๆ จากการให้</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>หัวข้อ</Label>
                            <Input value={newStory.title} onChange={(e) => setNewStory({ ...newStory, title: e.target.value })} placeholder="เช่น ความสุขจากการให้..." />
                        </div>
                        <div className="space-y-2">
                            <Label>เนื้อหา</Label>
                            <Textarea value={newStory.content} onChange={(e) => setNewStory({ ...newStory, content: e.target.value })} placeholder="เล่าเรื่องราวของคุณ..." className="min-h-[150px]" />
                        </div>
                        {/* Tag Donations */}
                        <div className="space-y-2">
                            <Label>อ้างอิงการบริจาค (ถ้ามี)</Label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded">
                                {user.donations?.map((don) => (
                                    <div key={don.id} className="flex items-center gap-2">
                                        <Switch
                                            checked={newStory.taggedDonationIds.includes(don.id)}
                                            onCheckedChange={(c) => {
                                                if (c) setNewStory(p => ({ ...p, taggedDonationIds: [...p.taggedDonationIds, don.id] }))
                                                else setNewStory(p => ({ ...p, taggedDonationIds: p.taggedDonationIds.filter(id => id !== don.id) }))
                                            }}
                                        />
                                        <span className="text-sm">{don.requestTitle}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateStory(false)}>ยกเลิก</Button>
                        <Button onClick={handleCreateStory} className="bg-pink-600 hover:bg-pink-700">โพสต์</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Edit Profile */}
            <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูลส่วนตัว</DialogTitle>
                        <DialogDescription>เปลี่ยนแปลงข้อมูลพื้นฐานของคุณ</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">ชื่อจริง</Label>
                                <Input
                                    id="firstName"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">นามสกุล</Label>
                                <Input
                                    id="lastName"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                            <Input
                                id="phone"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                placeholder="08x-xxx-xxxx"
                            />
                        </div>

                        {/* Avatar Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="avatar">รูปโปรไฟล์</Label>
                            <div className="flex gap-4 items-center">
                                <Avatar className="w-16 h-16 border">
                                    <AvatarImage
                                        src={selectedImage ? URL.createObjectURL(selectedImage) : (editForm.avatar || "/placeholder.svg")}
                                        className="object-cover"
                                    />
                                    <AvatarFallback>รูป</AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                    <Input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setSelectedImage(e.target.files[0]);
                                            }
                                        }}
                                        className="cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">รองรับไฟล์ JPG, PNG (ขนาดแนะนำไม่เกิน 2MB)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditProfile(false)} disabled={isSaving}>ยกเลิก</Button>
                        <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Customization */}
            <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ตกแต่งโปรไฟล์</DialogTitle>
                        <DialogDescription>แลกคะแนนเพื่อปลดล็อคกรอบรูปและธีม</DialogDescription>
                    </DialogHeader>
                    <ProfileCustomization
                        onClose={() => setShowCustomization(false)}
                        onSave={(data) => {
                            setProfileCustomization(data)
                            setShowCustomization(false)
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}