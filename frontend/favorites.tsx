"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, MapPin, Users, Trash2, ExternalLink, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import ShareModal from "./share-modal"

interface DonationRequest {
    id: number
    title: string
    description: string
    category: string
    location: string
    goalAmount: number
    currentAmount: number
    daysLeft: number
    supporters: number
    image: string
    organizer: string
}

const donationRequests: DonationRequest[] = [
    {
        id: 1,
        title: "ช่วยเหลือครอบครัวที่ประสบอุทกภัย",
        description: "ครอบครัวของเราประสบอุทกภัยใหญ่ ทำให้บ้านและข้าวของเสียหายหมด ต้องการความช่วยเหลือเพื่อซื้อของใช้จำเป็นและซ่อมแซมบ้าน",
        category: "ภัยพิบัติ",
        location: "จังหวัดอุบลราชธานี",
        goalAmount: 50000,
        currentAmount: 23500,
        daysLeft: 15,
        supporters: 47,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "สมชาย ใจดี",
    },
    {
        id: 2,
        title: "ระดมทุนผ่าตัดหัวใจเด็ก",
        description: "น้องมายด์ อายุ 8 ขวบ เป็นโรคหัวใจพิการแต่กำเนิด ต้องการเงินค่าผ่าตัดเร่งด่วน เพื่อช่วยชีวิตน้องให้กลับมาแข็งแรง",
        category: "การแพทย์",
        location: "โรงพยาบาลศิริราช",
        goalAmount: 800000,
        currentAmount: 456000,
        daysLeft: 7,
        supporters: 234,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "มูลนิธิเด็กไทย",
    },
    {
        id: 3,
        title: "สร้างห้องสมุดให้โรงเรียนชนบท",
        description: "โรงเรียนบ้านดอนตาลต้องการสร้างห้องสมุดใหม่ เพื่อให้เด็กๆ ได้มีแหล่งเรียนรู้ที่ดี และพัฒนาทักษะการอ่าน",
        category: "การศึกษา",
        location: "จังหวัดสุรินทร์",
        goalAmount: 120000,
        currentAmount: 67000,
        daysLeft: 30,
        supporters: 89,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "โรงเรียนบ้านดอนตาล",
    },
    {
        id: 4,
        title: "อาหารสำหรับสุนัขจรจัด",
        description: "มูลนิธิรักษ์สัตว์ต้องการความช่วยเหลือซื้ออาหารสำหรับสุนัขจรจัดกว่า 200 ตัว ที่อยู่ในความดูแล",
        category: "สัตว์",
        location: "กรุงเทพมหานคร",
        goalAmount: 30000,
        currentAmount: 18500,
        daysLeft: 10,
        supporters: 156,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "มูลนิธิรักษ์สัตว์",
    },
]

export default function Favorites() {
    const router = useRouter()
    const [likedRequests, setLikedRequests] = useState<number[]>([])
    const [showDonationModal, setShowDonationModal] = useState<number | null>(null)
    const [showShareModal, setShowShareModal] = useState<number | null>(null)

    // In a real app, this would come from a global state or API
    useEffect(() => {
        const stored = localStorage.getItem("likedDonations")
        if (stored) {
            setLikedRequests(JSON.parse(stored))
        } else {
            // Add sample data for demonstration
            const sampleLikedRequests = [1, 2, 3]
            setLikedRequests(sampleLikedRequests)
            localStorage.setItem("likedDonations", JSON.stringify(sampleLikedRequests))
        }
    }, [])

    const favoriteRequests = donationRequests.filter((request) => likedRequests.includes(request.id))

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

    const removeFromFavorites = (id: number) => {
        const updated = likedRequests.filter((requestId) => requestId !== id)
        setLikedRequests(updated)
        localStorage.setItem("likedDonations", JSON.stringify(updated))
    }

    const handleDonate = (id: number) => {
        setShowDonationModal(id)
    }

    const getCategoryColor = (category: string) => {
        const colors = {
            ภัยพิบัติ: "bg-red-100 text-red-700",
            การแพทย์: "bg-blue-100 text-blue-700",
            การศึกษา: "bg-green-100 text-green-700",
            สัตว์: "bg-orange-100 text-orange-700",
        }
        return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-700"
    }

    const getUrgencyBadge = (daysLeft: number) => {
        if (daysLeft <= 7) return { text: "เร่งด่วน", class: "bg-red-500 text-white" }
        if (daysLeft <= 15) return { text: "ใกล้หมดเขต", class: "bg-orange-500 text-white" }
        return { text: `${daysLeft} วัน`, class: "bg-gray-500 text-white" }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="hover:bg-pink-50">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับ
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">❤️ คำขอที่สนใจ</h1>
                            <p className="text-sm text-gray-600">{favoriteRequests.length} รายการที่คุณเลือกไว้</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4">
                {favoriteRequests.length === 0 ? (
                    <div className="text-center py-16">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีคำขอที่สนใจ</h2>
                        <p className="text-gray-500 mb-6">กลับไปเลือกคำขอบริจาคที่คุณต้องการสนับสนุน</p>
                        <Button onClick={() => router.push("/")} className="bg-pink-500 hover:bg-pink-600">
                            เริ่มเลือกคำขอบริจาค
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {favoriteRequests.map((request) => {
                            const progressPercentage = (request.currentAmount / request.goalAmount) * 100
                            const urgency = getUrgencyBadge(request.daysLeft)

                            return (
                                <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="relative">
                                        <img
                                            src={request.image || "/placeholder.svg"}
                                            alt={request.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <Badge className={getCategoryColor(request.category)}>{request.category}</Badge>
                                            <Badge className={urgency.class}>{urgency.text}</Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeFromFavorites(request.id)}
                                            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <div>
                                                <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{request.title}</h3>
                                                <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{request.location}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    <span>{request.supporters}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">ระดมทุนได้</span>
                                                    <span className="font-semibold text-gray-800">
                                                        ฿{formatAmount(request.currentAmount)} / ฿{formatAmount(request.goalAmount)}
                                                    </span>
                                                </div>
                                                <Progress value={progressPercentage} className="h-2" />
                                                <div className="text-right text-xs text-gray-500">
                                                    {Math.round(progressPercentage)}% ของเป้าหมาย
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-600">
                                                <span className="font-medium">ผู้จัดการ:</span> {request.organizer}
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleDonate(request.id)}
                                                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                                >
                                                    <Heart className="w-4 h-4 mr-1" />
                                                    บริจาค
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent"
                                                    onClick={() => router.push(`/donation/${request.id}`)}
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    ดูรายละเอียด
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent"
                                                    onClick={() => setShowShareModal(request.id)}
                                                >
                                                    <Share2 className="w-4 h-4 mr-1" />
                                                    แชร์
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Simple Donation Modal */}
            {showDonationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">เลือกจำนวนเงินบริจาค</h3>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
                                <Button
                                    key={amount}
                                    variant="outline"
                                    className="hover:bg-pink-50 hover:border-pink-300 bg-transparent"
                                >
                                    ฿{formatAmount(amount)}
                                </Button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowDonationModal(null)} className="flex-1">
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowDonationModal(null)
                                    // Here you would integrate with payment gateway
                                    alert("ขอบคุณสำหรับการบริจาค!")
                                }}
                                className="flex-1 bg-pink-500 hover:bg-pink-600"
                            >
                                บริจาคเลย
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    isOpen={true}
                    onClose={() => setShowShareModal(null)}
                    donationRequest={favoriteRequests.find((req) => req.id === showShareModal)!}
                />
            )}
        </div>
    )
}
