"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, X, Heart, Share2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Story {
    id: number
    donationRequestId: number
    title: string
    type: "progress" | "milestone" | "thank_you" | "completion"
    content: string
    image: string
    timestamp: string
    author: string
    isViewed: boolean
    duration: number // seconds
}

interface StoryGroup {
    donationRequestId: number
    donationTitle: string
    organizer: string
    avatar: string
    stories: Story[]
    hasUnviewed: boolean
}

const storyGroups: StoryGroup[] = [
    {
        donationRequestId: 1,
        donationTitle: "ช่วยเหลือครอบครัวที่ประสบอุทกภัย",
        organizer: "สมชาย ใจดี",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: true,
        stories: [
            {
                id: 1,
                donationRequestId: 1,
                title: "เริ่มซ่อมแซมบ้าน",
                type: "progress",
                content: "วันนี้ได้เริ่มซ่อมแซมหลังคาและผนังที่เสียหายจากน้ำท่วมแล้วครับ ขอบคุณทุกท่านที่ให้ความช่วยเหลือ",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-15T10:00:00Z",
                author: "สมชาย ใจดี",
                isViewed: false,
                duration: 5,
            },
            {
                id: 2,
                donationRequestId: 1,
                title: "ความคืบหน้า 50%",
                type: "milestone",
                content: "ระดมทุนได้ครึ่งหนึ่งแล้ว! ขอบคุณผู้บริจาคทุกท่าน เรากำลังใกล้เป้าหมายแล้ว",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-14T15:30:00Z",
                author: "สมชาย ใจดี",
                isViewed: false,
                duration: 4,
            },
            {
                id: 3,
                donationRequestId: 1,
                title: "ขอบคุณผู้บริจาค",
                type: "thank_you",
                content: "ขอบพระคุณทุกท่านที่ให้ความช่วยเหลือครอบครัวเรา ความช่วยเหลือของทุกท่านมีความหมายมากสำหรับเรา",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-13T09:15:00Z",
                author: "สมชาย ใจดี",
                isViewed: true,
                duration: 6,
            },
        ],
    },
    {
        donationRequestId: 2,
        donationTitle: "ระดมทุนผ่าตัดหัวใจเด็ก",
        organizer: "มูลนิธิเด็กไทย",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: true,
        stories: [
            {
                id: 4,
                donationRequestId: 2,
                title: "น้องเข้าโรงพยาบาล",
                type: "milestone",
                content: "น้องมายด์เข้าโรงพยาบาลเพื่อเตรียมผ่าตัดแล้ว แพทย์บอกว่าการผ่าตัดจะดำเนินการในสัปดาห์หน้า",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-15T14:00:00Z",
                author: "มูลนิธิเด็กไทย",
                isViewed: false,
                duration: 5,
            },
            {
                id: 5,
                donationRequestId: 2,
                title: "เป้าหมายใกล้สำเร็จ",
                type: "progress",
                content: "ระดมทุนได้ 80% แล้ว! อีกเพียงเล็กน้อยน้องจะได้รับการรักษา",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-14T11:20:00Z",
                author: "มูลนิธิเด็กไทย",
                isViewed: false,
                duration: 4,
            },
        ],
    },
    {
        donationRequestId: 3,
        donationTitle: "สร้างห้องสมุดให้โรงเรียนชนบท",
        organizer: "โรงเรียนบ้านดอนตาล",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: false,
        stories: [
            {
                id: 6,
                donationRequestId: 3,
                title: "เริ่มก่อสร้าง",
                type: "progress",
                content: "เริ่มก่อสร้างห้องสมุดแล้ว! เด็กๆ ตื่นเต้นมาก รอไม่ไหวที่จะได้อ่านหนังสือใหม่ๆ",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-12T08:00:00Z",
                author: "โรงเรียนบ้านดอนตาล",
                isViewed: true,
                duration: 5,
            },
        ],
    },
    {
        donationRequestId: 4,
        donationTitle: "อาหารสำหรับสุนัขจรจัด",
        organizer: "มูลนิธิรักษ์สัตว์",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: true,
        stories: [
            {
                id: 7,
                donationRequestId: 4,
                title: "สุนัขได้อาหารแล้ว",
                type: "thank_you",
                content: "ขอบคุณผู้บริจาคทุกท่าน สุนัขน้อยๆ ได้กินอาหารอร่อยแล้ว หางส่ายไม่หยุด!",
                image: "/placeholder.svg?height=600&width=400",
                timestamp: "2024-01-15T16:45:00Z",
                author: "มูลนิธิรักษ์สัตว์",
                isViewed: false,
                duration: 4,
            },
        ],
    },
]

interface StoriesProps {
    initialGroupIndex?: number
    initialStoryIndex?: number
}

export default function Stories({ initialGroupIndex = 0, initialStoryIndex = 0 }: StoriesProps) {
    const router = useRouter()
    const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex)
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex)
    const [progress, setProgress] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [startTime, setStartTime] = useState(Date.now())

    const currentGroup = storyGroups[currentGroupIndex]
    const currentStory = currentGroup?.stories[currentStoryIndex]

    useEffect(() => {
        if (!isPlaying || !currentStory) return

        const interval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000
            const newProgress = (elapsed / currentStory.duration) * 100

            if (newProgress >= 100) {
                nextStory()
            } else {
                setProgress(newProgress)
            }
        }, 50)

        return () => clearInterval(interval)
    }, [isPlaying, currentStory, startTime])

    const nextStory = () => {
        if (currentStoryIndex < currentGroup.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1)
            setProgress(0)
            setStartTime(Date.now())
        } else if (currentGroupIndex < storyGroups.length - 1) {
            setCurrentGroupIndex(currentGroupIndex + 1)
            setCurrentStoryIndex(0)
            setProgress(0)
            setStartTime(Date.now())
        } else {
            router.back()
        }
    }

    const previousStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1)
            setProgress(0)
            setStartTime(Date.now())
        } else if (currentGroupIndex > 0) {
            const prevGroup = storyGroups[currentGroupIndex - 1]
            setCurrentGroupIndex(currentGroupIndex - 1)
            setCurrentStoryIndex(prevGroup.stories.length - 1)
            setProgress(0)
            setStartTime(Date.now())
        }
    }

    const togglePlayPause = () => {
        if (isPlaying) {
            setIsPlaying(false)
        } else {
            setIsPlaying(true)
            setStartTime(Date.now() - (progress / 100) * currentStory.duration * 1000)
        }
    }

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

    if (!currentStory) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            {/* Story Progress Bars */}
            <div className="absolute top-4 left-4 right-4 z-20">
                <div className="flex gap-1">
                    {currentGroup.stories.map((_, index) => (
                        <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-100 ease-linear"
                                style={{
                                    width: index < currentStoryIndex ? "100%" : index === currentStoryIndex ? `${progress}%` : "0%",
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={currentGroup.avatar || "/placeholder.svg"}
                            alt={currentGroup.organizer}
                            className="w-10 h-10 rounded-full border-2 border-white"
                        />
                        {currentGroup.hasUnviewed && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-white font-medium text-sm">{currentGroup.organizer}</h3>
                        <p className="text-white/80 text-xs">{formatTimeAgo(currentStory.timestamp)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={togglePlayPause} className="text-white hover:bg-white/20">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/20">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Story Content */}
            <div className="relative w-full h-full max-w-md mx-auto">
                <img
                    src={currentStory.image || "/placeholder.svg"}
                    alt={currentStory.title}
                    className="w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                {/* Story Type Badge */}
                <div className="absolute top-20 left-4">
                    <Badge className={`${getTypeColor(currentStory.type)} text-white border-0`}>
                        {getTypeText(currentStory.type)}
                    </Badge>
                </div>

                {/* Story Content */}
                <div className="absolute bottom-20 left-4 right-4">
                    <h2 className="text-white text-xl font-bold mb-2">{currentStory.title}</h2>
                    <p className="text-white/90 text-sm leading-relaxed">{currentStory.content}</p>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => router.push(`/donation/${currentStory.donationRequestId}`)}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        ดูรายละเอียด
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                            <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Touch Areas for Navigation */}
                <div className="absolute inset-0 flex">
                    <div className="flex-1 cursor-pointer" onClick={previousStory} />
                    <div className="flex-1 cursor-pointer" onClick={nextStory} />
                </div>
            </div>

            {/* Story Group Navigation */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {storyGroups.map((group, index) => (
                    <button
                        key={group.donationRequestId}
                        onClick={() => {
                            setCurrentGroupIndex(index)
                            setCurrentStoryIndex(0)
                            setProgress(0)
                            setStartTime(Date.now())
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${index === currentGroupIndex ? "bg-white" : "bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    )
}
