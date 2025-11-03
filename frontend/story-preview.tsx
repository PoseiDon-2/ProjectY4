"use client"
import { Play } from "lucide-react"

interface StoryPreviewProps {
    donationRequestId: string
    organizer: string
    storyImage: string | null // เปลี่ยนจาก avatar → storyImage
    hasUnviewed: boolean
    storyCount: number
    onClick: () => void
    isActive?: boolean
    showPlayIcon?: boolean
}

export default function StoryPreview({
    donationRequestId,
    organizer,
    storyImage, // ใช้ URL จาก story.images[0]
    hasUnviewed,
    storyCount,
    onClick,
    isActive = false,
    showPlayIcon = true,
}: StoryPreviewProps) {
    return (
        <div 
            onClick={onClick} 
            className="flex flex-col items-center gap-2 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick()
                }
            }}
            aria-label={`ดู Stories จาก ${organizer} (${storyCount} เรื่อง)`}
        >
            <div className="relative">
                <div
                    className={`w-16 h-16 rounded-full p-0.5 transition-all duration-200 ${
                        hasUnviewed 
                            ? "bg-gradient-to-tr from-pink-500 to-purple-500" 
                            : isActive
                            ? "bg-gradient-to-tr from-gray-400 to-gray-600"
                            : "bg-gray-300"
                    } ${isActive ? 'ring-2 ring-pink-500 ring-offset-2' : ''}`}
                >
                    <img
                        src={storyImage || "https://via.placeholder.com/400x300?text=No+Image"}
                        alt={`Story ของ ${organizer}`}
                        className="w-full h-full rounded-full border-2 border-white object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "https://via.placeholder.com/400x300?text=No+Image"
                        }}
                    />
                </div>
                
                {hasUnviewed && storyCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                            {storyCount > 9 ? '9+' : storyCount}
                        </span>
                    </div>
                )}

                {showPlayIcon && (
                    <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" fill="white" />
                    </div>
                )}

                {hasUnviewed && (
                    <div className="absolute inset-0 rounded-full border-2 border-pink-500 animate-ping opacity-75" />
                )}
            </div>
            
            <div className="text-center max-w-[70px]">
                <span className="text-xs text-gray-700 font-medium truncate block">
                    {organizer}
                </span>
                {storyCount > 0 && (
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                        {storyCount} เรื่อง
                    </span>
                )}
            </div>
        </div>
    )
}

// Variant ขนาดเล็ก
export function StoryPreviewSmall({
    donationRequestId,
    organizer,
    storyImage,
    hasUnviewed,
    storyCount,
    onClick,
}: StoryPreviewProps) {
    return (
        <div 
            onClick={onClick} 
            className="flex flex-col items-center gap-1 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick()
                }
            }}
        >
            <div className="relative">
                <div
                    className={`w-12 h-12 rounded-full p-0.5 ${
                        hasUnviewed 
                            ? "bg-gradient-to-tr from-pink-500 to-purple-500" 
                            : "bg-gray-300"
                    }`}
                >
                    <img
                        src={storyImage || "https://via.placeholder.com/400x300?text=No+Image"}
                        alt={organizer}
                        className="w-full h-full rounded-full border-2 border-white object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "https://via.placeholder.com/400x300?text=No+Image"
                        }}
                    />
                </div>
                {hasUnviewed && storyCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">
                            {storyCount > 9 ? '9+' : storyCount}
                        </span>
                    </div>
                )}
            </div>
            <span className="text-[10px] text-gray-700 text-center max-w-[60px] truncate">
                {organizer}
            </span>
        </div>
    )
}

// Variant ขนาดใหญ่
export function StoryPreviewLarge({
    donationRequestId,
    organizer,
    storyImage,
    hasUnviewed,
    storyCount,
    onClick,
}: StoryPreviewProps) {
    return (
        <div 
            onClick={onClick} 
            className="flex flex-col items-center gap-3 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick()
                }
            }}
        >
            <div className="relative">
                <div
                    className={`w-20 h-20 rounded-full p-1 ${
                        hasUnviewed 
                            ? "bg-gradient-to-tr from-pink-500 to-purple-500" 
                            : "bg-gray-300"
                    }`}
                >
                    <img
                        src={storyImage || "https://via.placeholder.com/400x300?text=No+Image"}
                        alt={organizer}
                        className="w-full h-full rounded-full border-2 border-white object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "https://via.placeholder.com/400x300?text=No+Image"
                        }}
                    />
                </div>
                {hasUnviewed && storyCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                            {storyCount > 9 ? '9+' : storyCount}
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" fill="white" />
                </div>
            </div>
            <div className="text-center max-w-[90px]">
                <span className="text-sm text-gray-700 font-medium truncate block">
                    {organizer}
                </span>
                {storyCount > 0 && (
                    <span className="text-xs text-gray-500 mt-0.5 block">
                        {storyCount} เรื่อง
                    </span>
                )}
            </div>
        </div>
    )
}