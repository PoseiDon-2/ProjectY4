"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play, ChevronRight, Eye, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Story {
    id: number
    title: string
    type: "progress" | "milestone" | "thank_you" | "completion"
    content: string
    image: string
    timestamp: string
    views: number
    likes: number
    isViewed: boolean
}

interface StorySectionProps {
    donationRequestId: number
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

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return "เมื่อสักครู่"
        if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`
        return `${Math.floor(diffInHours / 24)} วันที่แล้ว`
    }

    const displayedStories = showAll ? stories : stories.slice(0, 3)
    const hasUnviewed = stories.some((story) => !story.isViewed)

    if (stories.length === 0) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <div className="relative">
                            <span className="text-lg">📖</span>
                            {hasUnviewed && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-white" />
                            )}
                        </div>
                        Stories ความคืบหน้า
                        <Badge variant="outline" className="ml-2">
                            {stories.length} รายการ
                        </Badge>
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/stories?group=0&story=0`)}
                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                    >
                        ดูทั้งหมด
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
                <p className="text-sm text-gray-600">ติดตามความคืบหน้าและอัปเดตล่าสุดจาก {organizer}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Story Preview Carousel */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                    <div className="flex-shrink-0 cursor-pointer group" onClick={() => router.push(`/stories?group=0&story=0`)}>
                        <div className="relative">
                            <div
                                className={`w-16 h-16 rounded-full p-0.5 ${hasUnviewed ? "bg-gradient-to-tr from-pink-500 to-purple-500" : "bg-gray-300"}`}
                            >
                                <img
                                    src={avatar || "/placeholder.svg"}
                                    alt={organizer}
                                    className="w-full h-full rounded-full border-2 border-white object-cover"
                                />
                            </div>
                            {hasUnviewed && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">{stories.filter((s) => !s.isViewed).length}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-700 text-center mt-2 max-w-[70px] truncate">{organizer}</p>
                    </div>

                    {/* Recent Stories Thumbnails */}
                    <div className="flex gap-2">
                        {displayedStories.map((story, index) => (
                            <div
                                key={story.id}
                                className="flex-shrink-0 cursor-pointer group"
                                onClick={() => router.push(`/stories?group=0&story=${index}`)}
                            >
                                <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={story.image || "/placeholder.svg"}
                                        alt={story.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                                    {/* Type Badge */}
                                    <div className="absolute top-1 left-1">
                                        <div className={`w-2 h-2 rounded-full ${getTypeColor(story.type)}`} />
                                    </div>

                                    {/* Unviewed Indicator */}
                                    {!story.isViewed && <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full" />}

                                    {/* Play Icon */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-4 h-4 text-white" />
                                    </div>
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
                            className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => router.push(`/stories?group=0&story=0`)}
                        >
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                <img src={story.image || "/placeholder.svg"} alt={story.title} className="w-full h-full object-cover" />
                                {!story.isViewed && <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge className={`${getTypeColor(story.type)} text-white text-xs`}>{getTypeText(story.type)}</Badge>
                                    <span className="text-xs text-gray-500">{formatTimeAgo(story.timestamp)}</span>
                                </div>

                                <h4 className="font-medium text-gray-800 text-sm line-clamp-1 mb-1">{story.title}</h4>

                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{story.content}</p>

                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {story.views}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        {story.likes}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show More Button */}
                {stories.length > 3 && (
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAll(!showAll)}
                            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                        >
                            {showAll ? "แสดงน้อยลง" : `ดู Stories อื่นๆ (${stories.length - 3} รายการ)`}
                            <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showAll ? "rotate-90" : ""}`} />
                        </Button>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Stories ทั้งหมด: <span className="font-medium">{stories.length}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                        <span>
                            การดู: <span className="font-medium">{stories.reduce((sum, s) => sum + s.views, 0)}</span>
                        </span>
                        <span>
                            ถูกใจ: <span className="font-medium">{stories.reduce((sum, s) => sum + s.likes, 0)}</span>
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
