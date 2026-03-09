"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { X, User, Heart, Play, Pause, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface StoryDetail {
    id: string
    title: string
    content: string
    media_path?: string | null
    media_type?: string
    type: string
    views: number
    likes?: number
    created_at: string
    duration?: number | string
    next_id?: string | number | null

    donationRequest?: { title: string }
    donation_request?: { title: string }

    author?: { name: string; avatar?: string }
    organizer?: { first_name?: string; last_name?: string; avatar?: string }
    user?: { first_name?: string; last_name?: string; avatar?: string }
}

export default function StoryDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [story, setStory] = useState<StoryDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)

    const [isPaused, setIsPaused] = useState(false)
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)

    // ตัวแปรอ้างอิงถึงวิดีโอ
    const videoRef = useRef<HTMLVideoElement>(null)

    // เก็บสถานะ pause ใน Ref เพื่อให้ setInterval เรียกใช้ค่าล่าสุดเสมอ
    const isPausedRef = useRef(isPaused)
    useEffect(() => {
        isPausedRef.current = isPaused
    }, [isPaused])

    useEffect(() => {
        const fetchStoryDetail = async () => {
            setLoading(true)
            try {
                const token = localStorage.getItem("token") || localStorage.getItem("access_token")
                const headers: HeadersInit = {}
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`
                }

                const response = await fetch(`http://localhost:8000/api/stories/${params.id}`, {
                    method: 'GET',
                    headers
                })

                if (response.ok) {
                    const data = await response.json()
                    setStory(data)
                    setLikeCount(data.likes || 0)
                    setIsLiked(data.is_liked || false) // ถ้า API ส่งมาว่าเคย like แล้ว
                    
                    // บันทึกยอดวิว (ไม่บังคับว่าต้องสำเร็จ)
                    fetch(`http://localhost:8000/api/stories/${params.id}/view`, {
                        method: 'POST',
                        headers
                    }).catch(console.error)
                }
            } catch (error) {
                console.error("Error fetching story:", error)
            } finally {
                setLoading(false)
            }
        }
        
        if (params.id) {
            fetchStoryDetail()
        }
    }, [params.id])

    // ตรวจสอบว่าเป็นวิดีโอหรือไม่
    const isVideo = story?.media_type === "video" || !!story?.media_path?.match(/\.(mp4|webm|mov)$/i)

    // 🌟 จัดการความคืบหน้าของหลอดเวลา
    useEffect(() => {
        if (isPaused || !story || loading) return

        // 🌟 ถ้ารูปภาพ ให้ใช้ Timer ปกติ
        if (!isVideo) {
            const duration = Number(story.duration) || 5
            const interval = 50 
            const step = 100 / (duration * (1000 / interval))

            const timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(timer)
                        handleNext()
                        return 100
                    }
                    return prev + step
                })
            }, interval)
            return () => clearInterval(timer)
        }
        // 🌟 ถ้าเป็นวิดีโอ ปล่อยให้ event onTimeUpdate ของ <video> จัดการหลอดเวลาเอง
    }, [story, isPaused, loading, isVideo])

    const handleNext = () => {
        if (story?.next_id) {
            router.push(`/stories/${story.next_id}`)
        } else {
            router.push('/story-management') // กลับหน้าหลักถ้าหมด
        }
    }

    const togglePlayPause = () => {
        const nextState = !isPaused
        setIsPaused(nextState)

        // สั่งวิดีโอให้หยุดหรือเล่นทันที
        if (videoRef.current) {
            if (nextState) {
                videoRef.current.pause()
            } else {
                videoRef.current.play().catch(e => console.error("Play error:", e))
            }
        }
    }

    const handleLike = async () => {
        setIsLiked(!isLiked)
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
        
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("access_token")
            const headers: HeadersInit = {}
            if (token) {
                headers["Authorization"] = `Bearer ${token}`
            }

            await fetch(`http://localhost:8000/api/stories/${story?.id}/like`, {
                method: 'POST',
                headers
            })
        } catch (error) {
            console.error("Error liking story:", error)
            // Rollback UI if failed
            setIsLiked(!isLiked)
            setLikeCount(prev => isLiked ? prev + 1 : prev - 1)
        }
    }

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">กำลังโหลด...</div>
    if (!story) return <div className="min-h-screen bg-black flex items-center justify-center text-white">ไม่พบสตอรี่</div>

    // สร้าง media URL (แก้ไขตาม path จริง)
    const mediaUrl = story.media_path?.startsWith('http') 
        ? story.media_path 
        : `http://localhost:8000/storage/${story.media_path}`

    const getOrganizationTitle = () => {
        if (story.donationRequest?.title) return story.donationRequest.title
        if (story.donation_request?.title) return story.donation_request.title
        return "อัปเดตโครงการ"
    }

    const getProfileName = () => {
        const org = story.organizer || story.user
        if (org) return `${org.first_name || ''} ${org.last_name || ''}`.trim()
        if (story.author?.name) return story.author.name
        return "ผู้จัดการโครงการ"
    }

    const getProfileAvatar = () => {
        const org = story.organizer || story.user
        if (org?.avatar) return org.avatar
        if (story.author?.avatar) return story.author.avatar
        return null
    }

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
                
                {/* แถบเวลา Progress Bar */}
                <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2 pt-4 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* ส่วนหัวแสดงโปรไฟล์คนโพสต์ */}
                <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-emerald-500 overflow-hidden">
                            {getProfileAvatar() ? (
                                <img src={getProfileAvatar()!} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 m-auto text-slate-400 mt-1.5" />
                            )}
                        </div>
                        <div className="text-white drop-shadow-md">
                            <p className="font-semibold text-sm">
                                {getProfileName()}
                            </p>
                            <p className="text-xs text-white/80">{getOrganizationTitle()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                        <Button variant="ghost" size="icon" className="hover:bg-white/20 rounded-full" onClick={togglePlayPause}>
                            {isPaused ? <Play className="w-5 h-5 drop-shadow-md" /> : <Pause className="w-5 h-5 drop-shadow-md" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-white/20 rounded-full" onClick={() => router.back()}>
                            <X className="w-6 h-6 drop-shadow-md" />
                        </Button>
                    </div>
                </div>

                {/* พื้นที่แตะเพื่อหยุด/เล่น */}
                <div 
                    className="absolute inset-0 z-10"
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                />

                {/* สื่อรูปภาพ / วิดีโอ */}
                <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                    {story.media_path ? (
                        isVideo ? (
                            <video
                                ref={videoRef}
                                src={mediaUrl}
                                autoPlay
                                playsInline
                                // 🌟 เอา muted ออก เพื่อให้เล่นวิดีโอแล้วมีเสียง
                                className="w-full h-full object-cover"
                                onTimeUpdate={(e) => {
                                    // 🌟 ให้หลอดเวลาวิ่งตามความยาววิดีโอจริง
                                    if (isVideo && !isPausedRef.current) {
                                        const video = e.currentTarget
                                        const currentProgress = (video.currentTime / video.duration) * 100
                                        setProgress(currentProgress)
                                    }
                                }}
                                onEnded={() => {
                                    setProgress(100)
                                    handleNext()
                                }}
                            />
                        ) : (
                            <img src={mediaUrl} alt={story.title} className="w-full h-full object-cover" />
                        )
                    ) : (
                        <div className="text-white/50 flex flex-col items-center gap-2">
                            <span className="text-sm">ไม่มีรูปภาพ/วิดีโอ</span>
                        </div>
                    )}
                </div>

                {/* เนื้อหาข้อความ */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-5 pt-24 pr-16 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent text-white pointer-events-none">
                    <Badge variant="secondary" className="mb-2 bg-emerald-500/20 text-emerald-300 border-none">
                        {story.type}
                    </Badge>
                    <h2 className="text-lg font-bold mb-1 drop-shadow-md">{story.title}</h2>
                    <p className="text-sm font-light leading-relaxed whitespace-pre-line text-white/90 drop-shadow-md">
                        {story.content}
                    </p>
                </div>

                {/* ปรบมือ / Like / ปุ่มข้าม */}
                <div className="absolute bottom-5 right-4 z-30 flex flex-col items-center gap-4">
                    <button 
                        className="flex flex-col items-center gap-1 group"
                        onClick={handleLike}
                    >
                        <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-transform group-active:scale-90">
                            <Heart className={isLiked ? "w-6 h-6 fill-red-500 text-red-500" : "w-6 h-6 text-white"} />
                        </div>
                        <span className="text-white text-xs font-medium drop-shadow-md">{likeCount}</span>
                    </button>
                    <button 
                        className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-transform active:scale-90"
                        onClick={handleNext}
                    >
                        <SkipForward className="w-5 h-5 text-white" />
                    </button>
                </div>

            </div>
        </div>
    )
}