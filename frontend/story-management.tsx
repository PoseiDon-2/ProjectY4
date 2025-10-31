"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Eye, Edit, Trash2, Calendar, Users, BarChart3, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "./src/app/auth-context"

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
    type: string // เพิ่ม field type ตามโครงสร้างใหม่
    duration: number // เพิ่ม field duration
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
    private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

    private async request(endpoint: string, options: RequestInit = {}) {
        const token = localStorage.getItem('auth_token')

        const config: RequestInit = {
            headers: {
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
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
    const [stories, setStories] = useState<Story[]>([]) // เปลี่ยนโครงสร้างข้อมูล
    const [stats, setStats] = useState<StoryStats>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Redirect if not organizer - ใช้ useEffect แทน
    useEffect(() => {
        if (!user || user.role !== "organizer") {
            router.push("/")
        }
    }, [user, router])

    // Fetch data on component mount
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
                // ปรับโครงสร้างข้อมูลให้ตรงกับ API response
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
            // Refresh the stories list after deletion
            fetchStories()
            fetchStats() // Refresh stats as well
        } catch (err: any) {
            console.error('Error deleting story:', err)
            alert(err.message || 'ไม่สามารถลบ Story ได้')
        }
    }

    const handleViewStory = async (storyId: string) => {
        try {
            // Record view first
            await storyApiService.recordView(storyId)
            // Then navigate to story view page
            router.push(`/stories/${storyId}`)
        } catch (err) {
            console.error('Error recording view:', err)
            // Still navigate even if recording view fails
            router.push(`/stories/${storyId}`)
        }
    }

    const handleEditStory = (storyId: string) => {
        router.push(`/edit-story/${storyId}`)
    }

    const handleLikeStory = async (storyId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent triggering parent click events
        try {
            await storyApiService.toggleLike(storyId)
            // Refresh stories to get updated like count
            fetchStories()
        } catch (err) {
            console.error('Error toggling like:', err)
        }
    }

    // ฟังก์ชันสำหรับดึงรูปภาพแรกจาก array
    const getFirstImage = (images: string[] | null): string => {
        if (!images || images.length === 0) {
            return "/placeholder.svg?height=200&width=300"
        }

        // ถ้า images เป็น array ของ string URLs
        if (Array.isArray(images)) {
            return images[0]
        }

        // ถ้า images เป็น JSON string
        try {
            if (typeof images === 'string') {
                const parsedImages = JSON.parse(images)
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                    return parsedImages[0]
                }
            }
        } catch (e) {
            console.error('Error parsing images:', e)
        }

        return "/placeholder.svg?height=200&width=300"
    }

    // ใช้ type จาก field โดยตรง (มีแล้วในโครงสร้างใหม่)
    const getStoryType = (story: Story): string => {
        return story.type || 'progress'
    }

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

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return "เมื่อสักครู่"
        if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`
        return `${Math.floor(diffInHours / 24)} วันที่แล้ว`
    }

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // คำนวณค่าสถิติจากข้อมูล stories
    const calculatedStats = {
        totalStories: stories.length,
        totalViews: stories.reduce((sum, story) => sum + story.views, 0),
        publishedStories: stories.filter(story => story.status === 'PUBLISHED').length,
        draftStories: stories.filter(story => story.status === 'DRAFT').length,
        archivedStories: stories.filter(story => story.status === 'ARCHIVED').length,
    }

    // ใช้ค่าจาก API หรือคำนวณเอง
    const displayStats = {
        totalStories: stats.overview?.totalStories || stats.totalStories || calculatedStats.totalStories,
        totalViews: stats.overview?.totalViews || stats.totalViews || calculatedStats.totalViews,
        engagementRate: stats.engagement?.engagementRate || stats.engagementRate || 0,
        totalLikes: stats.totalLikes || 0, // ยังไม่มีระบบ like
    }

    // Group stories by donation request
    const storiesByRequest = stories.reduce((acc, story) => {
        const requestId = story.donation_request_id
        if (!acc[requestId]) {
            acc[requestId] = {
                id: requestId,
                title: story.donationRequest?.title || 'ไม่ระบุคำขอ',
                stories: []
            }
        }
        acc[requestId].stories.push(story)
        return acc
    }, {} as Record<string, { id: string; title: string; stories: Story[] }>)

    const donationRequests = Object.values(storiesByRequest)

    const filteredStories = selectedRequest
        ? donationRequests.filter((req) => req.id === selectedRequest)
        : donationRequests

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

    // Redirect if not organizer
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
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={selectedRequest === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedRequest(null)}
                                className={selectedRequest === null ? "bg-pink-500 hover:bg-pink-600 text-white" : ""}
                            >
                                ทั้งหมด
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
                                                <div className="relative">
                                                    <img
                                                        src={getFirstImage(story.images)}
                                                        alt={story.title}
                                                        className="w-full h-32 object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.src = "/placeholder.svg?height=200&width=300"
                                                        }}
                                                    />
                                                    <div className="absolute top-2 left-2 flex gap-1">
                                                        <Badge className={`text-xs ${getTypeColor(story.type)}`}>
                                                            {getTypeText(story.type)}
                                                        </Badge>
                                                        <Badge className={`text-xs ${getStatusColor(story.status)}`}>
                                                            {getStatusText(story.status)}
                                                        </Badge>
                                                    </div>
                                                    {story.status === 'DRAFT' && (
                                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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