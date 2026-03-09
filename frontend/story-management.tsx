"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// นำเข้าไอคอน Video, Image และ SearchX เพิ่มเติม
import { Plus, Eye, Edit, Trash2, Calendar, Users, BarChart3, ArrowLeft, Video, ImageIcon, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

interface Story {
    id: string
    title: string
    content: string
    media_path: string | null
    media_type: string
    is_published: boolean
    organizer_id: string
    status: string
    author_id: string
    donation_request_id: string
    published_at: string | null
    views: number
    created_at: string
    type: string
    duration: number
    donationRequest?: {
        id: string
        title: string
        current_amount?: number
        goal_amount?: number
        supporters?: number
    }
}

interface StoryStats {
    overview?: {
        totalStories: number
        totalViews: number
        publishedStories: number
        draftStories: number
        archivedStories: number
        averageViews: number
        maxViews: number
    }
    engagement?: {
        totalPublished: number
        totalViews: number
        averageViewsPerStory: number
        bestPerformingViews: number
        engagementRate: number
    }
    totalStories?: number
    totalViews?: number
    totalLikes?: number
    engagementRate?: number
}

// API Service
class StoryApiService {
    private API_URL = process.env.NEXT_PUBLIC_API_URL

    private async request(endpoint: string, options: RequestInit = {}) {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token')

        const config: RequestInit = {
            headers: {
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        }

        const response = await fetch(`${this.API_URL}${endpoint}`, config)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `API error: ${response.status}`)
        }

        return response.json()
    }

    async getOrganizerStories() {
        return this.request('/organizer/stories')
    }

    async getStoryStats() {
        return this.request('/organizer/stats')
    }

    async deleteStory(id: string) {
        return this.request(`/organizer/stories/${id}`, {
            method: 'DELETE',
        })
    }

    async recordView(id: string) {
        return this.request(`/stories/${id}/view`, {
            method: 'POST',
        })
    }

    async toggleLike(id: string) {
        return this.request(`/stories/${id}/like`, {
            method: 'POST',
        })
    }
}

export const storyApiService = new StoryApiService()

export default function StoryManagement() {
    const router = useRouter()
    const { user } = useAuth()
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<string | null>(null)
    
    // 🌟 เพิ่ม State สำหรับเรียงลำดับเวลา (เริ่มต้นที่ ใหม่สุดไปเก่าสุด)
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

    const [stories, setStories] = useState<Story[]>([])
    const [stats, setStats] = useState<StoryStats>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!user || user.role !== "organizer") {
            router.push("/")
        }
    }, [user, router])

    useEffect(() => {
        fetchStories()
        fetchStats()
    }, [])

    const fetchStories = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await storyApiService.getOrganizerStories()
            if (response.success) {
                setStories(response.data || [])
            }
        } catch (err: any) {
            console.error('Error fetching stories:', err)
            setError(err.message || 'ไม่สามารถโหลดข้อมูล Stories ได้')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await storyApiService.getStoryStats()
            if (response.success) {
                setStats(response.data || {})
            }
        } catch (err) {
            console.error('Error fetching stats:', err)
        }
    }

    const handleDeleteStory = async (storyId: string) => {
        if (!confirm('คุณแน่ใจว่าต้องการลบ Story นี้?')) {
            return
        }

        try {
            await storyApiService.deleteStory(storyId)
            fetchStories()
            fetchStats()
        } catch (err: any) {
            console.error('Error deleting story:', err)
            alert(err.message || 'ไม่สามารถลบ Story ได้')
        }
    }

    const handleViewStory = async (storyId: string) => {
        try {
            await storyApiService.recordView(storyId)
            router.push(`/stories/${storyId}`)
        } catch (err) {
            console.error('Error recording view:', err)
            router.push(`/stories/${storyId}`)
        }
    }

    const handleEditStory = (storyId: string) => {
        router.push(`/edit-story/${storyId}`)
    }

    const getFirstImage = (story: Story) => {
        if (story.media_path) {
            return `http://localhost:8000/storage/${story.media_path}`;
        }
        return "https://placehold.co/400x300?text=No+Image";
    };

    const getTypeColor = (type: string) => {
        const colors = {
            progress: "bg-blue-100 text-blue-700 border-blue-200",
            milestone: "bg-purple-100 text-purple-700 border-purple-200",
            thank_you: "bg-green-100 text-green-700 border-green-200",
            completion: "bg-orange-100 text-orange-700 border-orange-200",
        }
        return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200"
    }

    const getTypeText = (type: string) => {
        const texts = {
            progress: "ความคืบหน้า",
            milestone: "เหตุการณ์สำคัญ",
            thank_you: "ขอบคุณ",
            completion: "เสร็จสิ้น",
        }
        return texts[type as keyof typeof texts] || type
    }

    const getStatusColor = (status: string) => {
        const colors = {
            PUBLISHED: "bg-green-100 text-green-700 border-green-200",
            DRAFT: "bg-yellow-100 text-yellow-700 border-yellow-200",
            ARCHIVED: "bg-gray-100 text-gray-700 border-gray-200",
        }
        return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200"
    }

    const getStatusText = (status: string) => {
        const texts = {
            PUBLISHED: "เผยแพร่แล้ว",
            DRAFT: "ฉบับร่าง",
            ARCHIVED: "เก็บถาวร",
        }
        return texts[status as keyof typeof texts] || status
    }

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const calculatedStats = {
        totalStories: stories.length,
        totalViews: stories.reduce((sum, story) => sum + story.views, 0),
        publishedStories: stories.filter(story => story.status === 'PUBLISHED').length,
        draftStories: stories.filter(story => story.status === 'DRAFT').length,
        archivedStories: stories.filter(story => story.status === 'ARCHIVED').length,
    }

    const displayStats = {
        totalStories: stats.overview?.totalStories || stats.totalStories || calculatedStats.totalStories,
        totalViews: stats.overview?.totalViews || stats.totalViews || calculatedStats.totalViews,
        engagementRate: stats.engagement?.engagementRate || stats.engagementRate || 0,
        totalLikes: stats.totalLikes || 0,
    }

    // จัดกลุ่มโปรเจกต์สำหรับปุ่มกดด้านบน (แค่เพื่อนับจำนวนเอาไปโชว์ที่ปุ่ม)
    const storiesByRequest = stories.reduce((acc, story) => {
        const requestId = story.donation_request_id
        if (!acc[requestId]) {
            const requestTitle = story.donationRequest?.title || (story as any).donation_request?.title || 'ไม่ระบุคำขอ';
            acc[requestId] = {
                id: requestId,
                title: requestTitle,
                stories: []
            }
        }
        acc[requestId].stories.push(story)
        return acc
    }, {} as Record<string, { id: string; title: string; stories: Story[] }>)

    // 🌟 ฟังก์ชันจัดการฟิลเตอร์และจัดเรียงแบบใหม่
    const getFilteredStories = () => {
        let filtered = stories
        
        // 1. กรองสถานะและประเภท
        if (statusFilter) {
            filtered = filtered.filter(story => story.status === statusFilter)
        }
        if (typeFilter) {
            filtered = filtered.filter(story => story.type === typeFilter)
        }
        
        // 2. จัดกลุ่มตามโครงการ
        const grouped = filtered.reduce((acc, story) => {
            const requestId = story.donation_request_id
            if (!acc[requestId]) {
                const requestTitle = story.donationRequest?.title || (story as any).donation_request?.title || 'ไม่ระบุคำขอ'
                acc[requestId] = { id: requestId, title: requestTitle, stories: [] }
            }
            acc[requestId].stories.push(story)
            return acc
        }, {} as Record<string, { id: string; title: string; stories: Story[] }>)
        
        let result = Object.values(grouped)

        // 🌟 3. เข้าไปจัดเรียงเวลา "เฉพาะในแต่ละโครงการ" 
        result.forEach(requestGroup => {
            requestGroup.stories.sort((a, b) => {
                const timeA = new Date(a.created_at).getTime()
                const timeB = new Date(b.created_at).getTime()
                // ถ้าย้อนหลัง (desc) เอาเวลามาก(ใหม่) ลบ เวลาน้อย(เก่า)
                return sortOrder === "desc" ? timeB - timeA : timeA - timeB
            })
        })

        // 4. กรองด้วยปุ่มโปรเจกต์ที่เลือก
        if (selectedRequest) {
            result = result.filter((req) => req.id === selectedRequest)
        }

        return result
    }

    const filteredStories = getFilteredStories()
    const donationRequests = Object.values(storiesByRequest)

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลด...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-600 mb-2">เกิดข้อผิดพลาด</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <Button onClick={fetchStories} className="bg-pink-500 hover:bg-pink-600">
                        ลองอีกครั้ง
                    </Button>
                </div>
            </div>
        )
    }

    if (!user || user.role !== "organizer") {
        return null
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
                                onClick={() => router.push("/organizer-dashboard")}
                                className="hover:bg-pink-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับ
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">จัดการ Stories</h1>
                                <p className="text-sm text-gray-600">สร้างและจัดการ Stories สำหรับคำขอบริจาคของคุณ</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.push("/create-story")}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            สร้าง Story ใหม่
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4">
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-4 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Stories ทั้งหมด</p>
                                    <p className="text-2xl font-bold text-purple-600">{displayStats.totalStories}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        เผยแพร่แล้ว: {calculatedStats.publishedStories}
                                    </p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">การดูรวม</p>
                                    <p className="text-2xl font-bold text-blue-600">{displayStats.totalViews.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        เฉลี่ย: {Math.round(displayStats.totalViews / (displayStats.totalStories || 1))} ต่อเรื่อง
                                    </p>
                                </div>
                                <Eye className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">แบบร่าง</p>
                                    <p className="text-2xl font-bold text-yellow-600">{calculatedStats.draftStories}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        เก็บถาวร: {calculatedStats.archivedStories}
                                    </p>
                                </div>
                                <Users className="w-8 h-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">อัตราการมีส่วนร่วม</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {displayStats.engagementRate}%
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        จากการดู Stories
                                    </p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                {donationRequests.length > 0 && (
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={selectedRequest === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedRequest(null)}
                                className={selectedRequest === null ? "bg-pink-500 hover:bg-pink-600 text-white" : ""}
                            >
                                ทุกโครงการ
                            </Button>
                            {donationRequests.map((request) => (
                                <Button
                                    key={request.id}
                                    variant={selectedRequest === request.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedRequest(request.id)}
                                    className={selectedRequest === request.id ? "bg-pink-500 hover:bg-pink-600 text-white" : ""}
                                >
                                    {request.title.length > 20 ? `${request.title.substring(0, 20)}...` : request.title}
                                    <Badge variant="secondary" className="ml-2">
                                        {request.stories.length}
                                    </Badge>
                                </Button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            {/* 🌟 เพิ่ม Dropdown เลือกการเรียงลำดับเวลา */}
                            <select
                                className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-pink-500/20 font-medium"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
                            >
                                <option value="desc">ใหม่สุด ไป เก่าสุด</option>
                                <option value="asc">เก่าสุด ไป ใหม่สุด</option>
                            </select>

                            <select
                                className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-pink-500/20"
                                value={statusFilter || ""}
                                onChange={(e) => setStatusFilter(e.target.value || null)}
                            >
                                <option value="">ทุกสถานะ</option>
                                <option value="PUBLISHED">เผยแพร่แล้ว</option>
                                <option value="DRAFT">ฉบับร่าง</option>
                                <option value="ARCHIVED">เก็บถาวร</option>
                            </select>

                            <select
                                className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-pink-500/20"
                                value={typeFilter || ""}
                                onChange={(e) => setTypeFilter(e.target.value || null)}
                            >
                                <option value="">ทุกประเภท</option>
                                <option value="progress">ความคืบหน้า</option>
                                <option value="milestone">เหตุการณ์สำคัญ</option>
                                <option value="thank_you">ขอบคุณ</option>
                                <option value="completion">เสร็จสิ้น</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Stories List */}
                <div className="space-y-6">
                    {filteredStories.map((request) => (
                        <Card key={request.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span>{request.title}</span>
                                        <Badge variant="outline" className="bg-blue-50">
                                            {request.stories.length} Stories
                                        </Badge>
                                    </div>
                                    <Badge variant={request.stories.some(s => s.status === 'DRAFT') ? "default" : "outline"}
                                        className={request.stories.some(s => s.status === 'DRAFT') ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}>
                                        {request.stories.some(s => s.status === 'DRAFT') ? 'มีแบบร่าง' : 'เผยแพร่ทั้งหมด'}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {request.stories.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {request.stories.map((story) => (
                                            <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow border">
                                                <div className="relative group">
                                                    {/* เช็คประเภทสื่อ */}
                                                    {story.media_type === 'video' ? (
                                                        <video
                                                            src={story.media_path ? `http://localhost:8000/storage/${story.media_path}` : ''}
                                                            className="w-full h-32 object-cover"
                                                            preload="metadata"
                                                            muted
                                                            playsInline
                                                        />
                                                    ) : (
                                                        <img
                                                            src={getFirstImage(story)}
                                                            alt={story.title}
                                                            className="w-full h-32 object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.src = "https://placehold.co/400x300?text=No+Image"
                                                            }}
                                                        />
                                                    )}

                                                    {/* ไอคอนบอกสถานะ รูปภาพ / วิดีโอ */}
                                                    <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-md backdrop-blur-sm shadow-sm flex items-center justify-center">
                                                        {story.media_type === 'video' ? (
                                                            <Video className="w-4 h-4" />
                                                        ) : (
                                                            <ImageIcon className="w-4 h-4" />
                                                        )}
                                                    </div>

                                                    {/* Badge ด้านซ้ายบน เรียงลงมา */}
                                                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                                                        <Badge className={`text-[10px] px-2 py-0.5 ${getTypeColor(story.type)}`}>
                                                            {getTypeText(story.type)}
                                                        </Badge>
                                                        <Badge className={`text-[10px] px-2 py-0.5 ${getStatusColor(story.status)}`}>
                                                            {getStatusText(story.status)}
                                                        </Badge>
                                                    </div>

                                                    {/* กล่องแสดงสถานะ Draft */}
                                                    {story.status === 'DRAFT' && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <Badge variant="secondary" className="bg-yellow-500 text-white">
                                                                ฉบับร่าง
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                <CardContent className="p-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-medium text-gray-800 line-clamp-1">{story.title}</h4>
                                                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{story.content}</p>
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                                            <span>{formatDate(story.created_at)}</span>
                                                            <div className="flex gap-3">
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="w-3 h-3" />
                                                                    {story.views}
                                                                </span>
                                                                <span>{story.duration} วิ</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 pt-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1"
                                                                onClick={() => handleViewStory(story.id)}
                                                                disabled={story.status === 'DRAFT'}
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                ดู
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1"
                                                                onClick={() => handleEditStory(story.id)}
                                                            >
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                แก้ไข
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => handleDeleteStory(story.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>ยังไม่มี Stories สำหรับคำขอนี้</p>
                                        <Button
                                            onClick={() => router.push("/create-story")}
                                            className="mt-4 bg-pink-500 hover:bg-pink-600 text-white"
                                        >
                                            สร้าง Story แรก
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* แสดงข้อความเมื่อมี Story แต่กรองแล้วไม่พบ */}
                {stories.length > 0 && filteredStories.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed mt-6">
                        <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">ไม่พบ Story ที่ตรงกับตัวกรองของคุณ</p>
                        <Button 
                            variant="link" 
                            onClick={() => {
                                setStatusFilter(null)
                                setTypeFilter(null)
                                setSelectedRequest(null)
                            }}
                            className="text-pink-500 mt-2"
                        >
                            ล้างตัวกรองทั้งหมด
                        </Button>
                    </div>
                )}

                {/* กรณีที่ยังไม่เคยสร้าง Story เลย */}
                {stories.length === 0 && (
                    <div className="text-center py-16">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มี Stories</h2>
                        <p className="text-gray-500 mb-6">เริ่มสร้าง Story แรกเพื่อแชร์ความคืบหน้าให้ผู้บริจาคทราบ</p>
                        <Button
                            onClick={() => router.push("/create-story")}
                            className="bg-pink-500 hover:bg-pink-600 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            สร้าง Story ใหม่
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}