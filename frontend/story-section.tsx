"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play, ChevronRight, Eye, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Story {
    id: string
    title: string
    type: "progress" | "milestone" | "thank_you" | "completion"
    content: string
    images: string[] | null // ต้องเป็น array ของ URL
    published_at: string | null
    views: number
    status: string
    duration?: number
    isViewed?: boolean
    likes?: number
}

interface StorySectionProps {
    donationRequestId: string
    stories: Story[]
    organizer: string
    avatar: string
}

export default function StorySection({ donationRequestId, stories, organizer, avatar }: StorySectionProps) {
    const router = useRouter()
    const [showAll, setShowAll] = useState(false)

    const getTypeColor = (type: string) => {
        const colors = {
            progress: "bg-blue-500",
            milestone: "bg-purple-500",
            thank_you: "bg-green-500",
            completion: "bg-orange-500",
        }
        return colors[type as keyof typeof colors] || "bg-gray-500"
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

    // ดึงรูปแรก (ไม่ต้อง parse)
    const getFirstImage = (images: string[] | null): string => {
        return images?.[0] || "/placeholder.svg?height=200&width=300"
    }

    const formatTimeAgo = (timestamp: string | null) => {
        if (!timestamp) return "ไม่ระบุเวลา"
        
        const now = new Date()
        const time = new Date(timestamp)
        const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return "เมื่อสักครู่"
        if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`
        return `${Math.floor(diffInHours / 24)} วันที่แล้ว`
    }

    const formatDate = (timestamp: string | null) => {
        if (!timestamp) return "ไม่ระบุวันที่"
        
        return new Date(timestamp).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const publishedStories = stories.filter(story => story.status === 'PUBLISHED')
    const displayedStories = showAll ? publishedStories : publishedStories.slice(0, 3)
    const hasUnviewed = publishedStories.some((story) => story.views === 0)
    const unviewedCount = publishedStories.filter((story) => story.views === 0).length

    if (publishedStories.length === 0) {
        return null
    }

    const handleViewStory = (storyId: string) => {
        router.push(`/stories/${storyId}`)
    }

    const handleViewAllStories = () => {
        router.push(`/stories?donation_request=${donationRequestId}`)
    }

    return (
        <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="relative">
                            <span className="text-xl">Stories ความคืบหน้า</span>
                            {hasUnviewed && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-white" />
                            )}
                        </div>
                        <Badge variant="outline" className="ml-2 bg-blue-50">
                            {publishedStories.length} รายการ
                        </Badge>
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleViewAllStories}
                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                    >
                        ดูทั้งหมด
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    ติดตามความคืบหน้าและอัปเดตล่าสุดจาก {organizer}
                </p>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-0">
                {/* Story Preview Carousel */}
                <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
                    {/* Organizer Avatar */}
                    <div 
                        className="flex-shrink-0 cursor-pointer group" 
                        onClick={handleViewAllStories}
                    >
                        <div className="relative">
                            <div
                                className={`w-16 h-16 rounded-full p-0.5 transition-all ${
                                    hasUnviewed 
                                        ? "bg-gradient-to-tr from-pink-500 to-purple-500" 
                                        : "bg-gray-300"
                                }`}
                            >
                                <img
                                    src={avatar || "/placeholder.svg"}
                                    alt={organizer}
                                    className="w-full h-full rounded-full border-2 border-white object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg?height=64&width=64"
                                    }}
                                />
                            </div>
                            {hasUnviewed && unviewedCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                        {unviewedCount > 9 ? '9+' : unviewedCount}
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-6 h-6 text-white" fill="white" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-700 text-center mt-2 max-w-[70px] truncate font-medium">
                            {organizer}
                        </p>
                    </div>

                    {/* Recent Stories Thumbnails */}
                    <div className="flex gap-3">
                        {displayedStories.map((story) => (
                            <div
                                key={story.id}
                                className="flex-shrink-0 cursor-pointer group"
                                onClick={() => handleViewStory(story.id)}
                            >
                                <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                    <img
                                        src={getFirstImage(story.images)}
                                        alt={story.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = "/placeholder.svg?height=200&width=300"
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                                    {/* Type Badge */}
                                    <div className="absolute top-1 left-1">
                                        <div className={`w-2 h-2 rounded-full ${getTypeColor(story.type)}`} />
                                    </div>

                                    {/* Unviewed Indicator */}
                                    {story.views === 0 && (
                                        <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full" />
                                    )}

                                    {/* Play Icon */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-4 h-4 text-white" fill="white" />
                                    </div>

                                    {/* Duration */}
                                    {story.duration && (
                                        <div className="absolute bottom-1 right-1">
                                            <Badge variant="secondary" className="bg-black/70 text-white text-xs px-1 py-0 h-4">
                                                {story.duration}s
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Story List */}
                <div className="space-y-3">
                    {displayedStories.map((story) => (
                        <div
                            key={story.id}
                            className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                            onClick={() => handleViewStory(story.id)}
                        >
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border">
                                <img 
                                    src={getFirstImage(story.images)} 
                                    alt={story.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg?height=200&width=300"
                                    }}
                                />
                                {story.views === 0 && (
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge className={`${getTypeColor(story.type)} text-white text-xs border-0`}>
                                        {getTypeText(story.type)}
                                    </Badge>
                                    {story.status !== 'PUBLISHED' && (
                                        <Badge variant="outline" className={`text-xs ${getStatusColor(story.status)}`}>
                                            {getStatusText(story.status)}
                                        </Badge>
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {formatTimeAgo(story.published_at)}
                                    </span>
                                </div>

                                <h4 className="font-medium text-gray-800 text-sm line-clamp-1 mb-1">
                                    {story.title}
                                </h4>

                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                    {story.content}
                                </p>

                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {story.views}
                                    </span>
                                    {story.duration && (
                                        <span className="text-gray-500">
                                            {story.duration} วินาที
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show More Button */}
                {publishedStories.length > 3 && (
                    <div className="text-center pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAll(!showAll)}
                            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                        >
                            {showAll ? "แสดงน้อยลง" : `ดู Stories อื่นๆ (${publishedStories.length - 3} รายการ)`}
                            <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showAll ? "rotate-90" : ""}`} />
                        </Button>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Stories ทั้งหมด: <span className="font-medium text-gray-800">{publishedStories.length}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                        <span>
                            การดูรวม: <span className="font-medium text-gray-800">
                                {publishedStories.reduce((sum, s) => sum + s.views, 0).toLocaleString()}
                            </span>
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}