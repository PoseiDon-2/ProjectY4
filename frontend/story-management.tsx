"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Eye, Edit, Trash2, Calendar, Users, BarChart3, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "./src/app/auth-context"

interface Story {
    id: number
    donationRequestId: number
    title: string
    content: string
    type: "progress" | "milestone" | "thank_you" | "completion"
    image: string
    timestamp: string
    views: number
    likes: number
    duration: number
}

interface DonationRequest {
    id: number
    title: string
    organizer: string
    stories: Story[]
}

// Mock data for organizer's stories
const organizerStories: DonationRequest[] = [
    {
        id: 1,
        title: "ช่วยเหลือครอบครัวที่ประสบอุทกภัย",
        organizer: "สมชาย ใจดี",
        stories: [
            {
                id: 1,
                donationRequestId: 1,
                title: "เริ่มซ่อมแซมบ้าน",
                content: "วันนี้ได้เริ่มซ่อมแซมหลังคาและผนังที่เสียหายจากน้ำท่วมแล้วครับ ขอบคุณทุกท่านที่ให้ความช่วยเหลือ",
                type: "progress",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-15T10:00:00Z",
                views: 234,
                likes: 45,
                duration: 5,
            },
            {
                id: 2,
                donationRequestId: 1,
                title: "ความคืบหน้า 50%",
                content: "ระดมทุนได้ครึ่งหนึ่งแล้ว! ขอบคุณผู้บริจาคทุกท่าน เรากำลังใกล้เป้าหมายแล้ว",
                type: "milestone",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-14T15:30:00Z",
                views: 189,
                likes: 38,
                duration: 4,
            },
            {
                id: 3,
                donationRequestId: 1,
                title: "ขอบคุณผู้บริจาค",
                content: "ขอบพระคุณทุกท่านที่ให้ความช่วยเหลือครอบครัวเรา ความช่วยเหลือของทุกท่านมีความหมายมากสำหรับเรา",
                type: "thank_you",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-13T09:15:00Z",
                views: 156,
                likes: 52,
                duration: 6,
            },
        ],
    },
    {
        id: 2,
        title: "สร้างห้องสมุดให้โรงเรียนชนบท",
        organizer: "โรงเรียนบ้านดอนตาล",
        stories: [
            {
                id: 4,
                donationRequestId: 2,
                title: "เริ่มก่อสร้าง",
                content: "เริ่มก่อสร้างห้องสมุดแล้ว! เด็กๆ ตื่นเต้นมาก รอไม่ไหวที่จะได้อ่านหนังสือใหม่ๆ",
                type: "progress",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-12T08:00:00Z",
                views: 98,
                likes: 23,
                duration: 5,
            },
        ],
    },
]

export default function StoryManagement() {
    const router = useRouter()
    const { user } = useAuth()
    const [selectedRequest, setSelectedRequest] = useState<number | null>(null)

    // Redirect if not organizer
    if (!user || user.role !== "organizer") {
        router.push("/")
        return null
    }

    const getTypeColor = (type: string) => {
        const colors = {
            progress: "bg-blue-100 text-blue-700",
            milestone: "bg-purple-100 text-purple-700",
            thank_you: "bg-green-100 text-green-700",
            completion: "bg-orange-100 text-orange-700",
        }
        return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700"
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

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return "เมื่อสักครู่"
        if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`
        return `${Math.floor(diffInHours / 24)} วันที่แล้ว`
    }

    const totalStories = organizerStories.reduce((sum, req) => sum + req.stories.length, 0)
    const totalViews = organizerStories.reduce(
        (sum, req) => sum + req.stories.reduce((storySum, story) => storySum + story.views, 0),
        0,
    )
    const totalLikes = organizerStories.reduce(
        (sum, req) => sum + req.stories.reduce((storySum, story) => storySum + story.likes, 0),
        0,
    )

    const filteredStories = selectedRequest
        ? organizerStories.filter((req) => req.id === selectedRequest)
        : organizerStories

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
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
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
                                    <p className="text-2xl font-bold text-purple-600">{totalStories}</p>
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
                                    <p className="text-2xl font-bold text-blue-600">{totalViews.toLocaleString()}</p>
                                </div>
                                <Eye className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">ถูกใจรวม</p>
                                    <p className="text-2xl font-bold text-pink-600">{totalLikes}</p>
                                </div>
                                <Users className="w-8 h-8 text-pink-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">อัตราการมีส่วนร่วม</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {totalViews > 0 ? Math.round((totalLikes / totalViews) * 100) : 0}%
                                    </p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        <Button
                            variant={selectedRequest === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedRequest(null)}
                            className={selectedRequest === null ? "bg-pink-500 hover:bg-pink-600" : "bg-transparent"}
                        >
                            ทั้งหมด
                        </Button>
                        {organizerStories.map((request) => (
                            <Button
                                key={request.id}
                                variant={selectedRequest === request.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedRequest(request.id)}
                                className={selectedRequest === request.id ? "bg-pink-500 hover:bg-pink-600" : "bg-transparent"}
                            >
                                {request.title.length > 20 ? `${request.title.substring(0, 20)}...` : request.title}
                                <Badge variant="secondary" className="ml-2">
                                    {request.stories.length}
                                </Badge>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Stories List */}
                <div className="space-y-6">
                    {filteredStories.map((request) => (
                        <Card key={request.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{request.title}</span>
                                    <Badge variant="outline">{request.stories.length} Stories</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {request.stories.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {request.stories.map((story) => (
                                            <Card key={story.id} className="overflow-hidden">
                                                <div className="relative">
                                                    <img
                                                        src={story.image || "/placeholder.svg"}
                                                        alt={story.title}
                                                        className="w-full h-32 object-cover"
                                                    />
                                                    <div className="absolute top-2 left-2">
                                                        <Badge className={getTypeColor(story.type)}>{getTypeText(story.type)}</Badge>
                                                    </div>
                                                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                        {story.duration}s
                                                    </div>
                                                </div>

                                                <CardContent className="p-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-medium text-gray-800 line-clamp-1">{story.title}</h4>
                                                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{story.content}</p>
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                                            <span>{formatTimeAgo(story.timestamp)}</span>
                                                            <div className="flex gap-3">
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="w-3 h-3" />
                                                                    {story.views}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3" />
                                                                    {story.likes}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 pt-2">
                                                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                ดู
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                แก้ไข
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
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
                                        <Button onClick={() => router.push("/create-story")} className="mt-4 bg-pink-500 hover:bg-pink-600">
                                            สร้าง Story แรก
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredStories.length === 0 && (
                    <div className="text-center py-16">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มี Stories</h2>
                        <p className="text-gray-500 mb-6">เริ่มสร้าง Story แรกเพื่อแชร์ความคืบหน้าให้ผู้บริจาคทราบ</p>
                        <Button onClick={() => router.push("/create-story")} className="bg-pink-500 hover:bg-pink-600">
                            <Plus className="w-4 h-4 mr-2" />
                            สร้าง Story ใหม่
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
