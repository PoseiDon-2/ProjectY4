"use client"
import { Play } from "lucide-react"

interface StoryPreviewProps {
    donationRequestId: number
    organizer: string
    avatar: string
    hasUnviewed: boolean
    storyCount: number
    onClick: () => void
}

export default function StoryPreview({
    donationRequestId,
    organizer,
    avatar,
    hasUnviewed,
    storyCount,
    onClick,
}: StoryPreviewProps) {
    return (
        <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="relative">
                <div
                    className={`w-16 h-16 rounded-full p-0.5 ${hasUnviewed ? "bg-gradient-to-tr from-pink-500 to-purple-500" : "bg-gray-300"
                        }`}
                >
                    <img
                        src={avatar || "/placeholder.svg"}
                        alt={organizer}
                        className="w-full h-full rounded-full border-2 border-white object-cover"
                    />
                </div>
                {hasUnviewed && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{storyCount}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                </div>
            </div>
            <span className="text-xs text-gray-700 text-center max-w-[70px] truncate">{organizer}</span>
        </div>
    )
}
