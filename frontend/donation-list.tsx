"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, SortAsc, MapPin, Users, Calendar, Heart, ExternalLink, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ShareModal from "./share-modal"
import StoryPreview from "./story-preview"

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
    detailedAddress: string
    contactPhone: string
    bankAccount: {
        bank: string
        accountNumber: string
        accountName: string
    }
    qrCodeUrl: string
    coordinates?: {
        lat: number
        lng: number
    }
}

const donationRequests: DonationRequest[] = [
    {
        id: 1,
        title: "ช่วยเหลือครอบครัวที่ประสบอุทกภัย",
        description: "ครอบครัวของเราประสบอุทกภัยใหญ่ ทำให้บ้านและข้าวของเสียหายหมด ต้องการความช่วยเหลือเพื่อซื้อของใช้จำเป็นและซ่อมแซมบ้าน",
        category: "ภัยพิบัติ",
        location: "จังหวัดอุบลราชธานี",
        detailedAddress: "123/45 หมู่ 7 ตำบลแสนสุข อำเภอเมือง จังหวัดอุบลราชธานี 34000",
        contactPhone: "081-234-5678",
        goalAmount: 50000,
        currentAmount: 23500,
        daysLeft: 15,
        supporters: 47,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "สมชาย ใจดี",
        bankAccount: {
            bank: "ธนาคารกสิกรไทย",
            accountNumber: "123-4-56789-0",
            accountName: "นายสมชาย ใจดี",
        },
        qrCodeUrl: "/placeholder.svg?height=200&width=200",
        coordinates: { lat: 15.2441, lng: 104.8475 },
    },
    {
        id: 2,
        title: "ระดมทุนผ่าตัดหัวใจเด็ก",
        description: "น้องมายด์ อายุ 8 ขวบ เป็นโรคหัวใจพิการแต่กำเนิด ต้องการเงินค่าผ่าตัดเร่งด่วน เพื่อช่วยชีวิตน้องให้กลับมาแข็งแรง",
        category: "การแพทย์",
        location: "โรงพยาบาลศิริราช",
        detailedAddress: "อาคารเฉลิมพระเกียรติ 80 พรรษา",
        contactPhone: "02-123-4567",
        goalAmount: 800000,
        currentAmount: 456000,
        daysLeft: 7,
        supporters: 234,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "มูลนิธิเด็กไทย",
        bankAccount: {
            bank: "ธนาคารไทยพาณิชย์",
            accountNumber: "456-7-89012-3",
            accountName: "มูลนิธิเด็กไทยเพื่อการผ่าตัดหัวใจ",
        },
        qrCodeUrl: "/placeholder.svg?height=200&width=200",
        coordinates: { lat: 13.765083, lng: 100.4929 },
    },
    {
        id: 3,
        title: "สร้างห้องสมุดให้โรงเรียนชนบท",
        description: "โรงเรียนบ้านดอนตาลต้องการสร้างห้องสมุดใหม่ เพื่อให้เด็กๆ ได้มีแหล่งเรียนรู้ที่ดี และพัฒนาทักษะการอ่าน",
        category: "การศึกษา",
        location: "จังหวัดสุรินทร์",
        detailedAddress: "โรงเรียนบ้านดอนตาล ตำบลดอนแรด อำเภอรัตนบุรี จังหวัดสุรินทร์ 32130",
        contactPhone: "044-987-6543",
        goalAmount: 120000,
        currentAmount: 67000,
        daysLeft: 30,
        supporters: 89,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "โรงเรียนบ้านดอนตาล",
        bankAccount: {
            bank: "ธนาคารกรุงไทย",
            accountNumber: "789-0-12345-6",
            accountName: "โรงเรียนบ้านดอนตาล",
        },
        qrCodeUrl: "/placeholder.svg?height=200&width=200",
        coordinates: { lat: 14.8833, lng: 103.8333 },
    },
    {
        id: 4,
        title: "อาหารสำหรับสุนัขจรจัด",
        description: "มูลนิธิรักษ์สัตว์ต้องการความช่วยเหลือซื้ออาหารสำหรับสุนัขจรจัดกว่า 200 ตัว ท��่อยู่ในความดูแล",
        category: "สัตว์",
        location: "กรุงเทพมหานคร",
        detailedAddress: "12/345 ซอยลาดพร้าว 101 แขวงคลองจั่น เขตบางกะปิ กรุงเทพมหานคร 10240",
        contactPhone: "02-555-1212",
        goalAmount: 30000,
        currentAmount: 18500,
        daysLeft: 10,
        supporters: 156,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "มูลนิธิรักษ์สัตว์",
        bankAccount: {
            bank: "ธนาคารกรุงเทพ",
            accountNumber: "012-3-45678-9",
            accountName: "มูลนิธิรักษ์สัตว์",
        },
        qrCodeUrl: "/placeholder.svg?height=200&width=200",
        coordinates: { lat: 13.7563, lng: 100.5018 },
    },
    {
        id: 5,
        title: "ซ่อมแซมบ้านผู้สูงอายุ",
        description: "คุณยายสมหวัง อายุ 78 ปี อาศัยอยู่คนเดียว บ้านชำรุดทรุดโทรม หลังคารั่ว ต้องการความช่วยเหลือซ่อมแซม",
        category: "ภัยพิบัติ",
        location: "จังหวัดเชียงใหม่",
        detailedAddress: "89/12 หมู่ 3 ตำบลแม่แตง อำเภอแม่แตง จังหวัดเชียงใหม่ 50150",
        contactPhone: "053-123-456",
        goalAmount: 35000,
        currentAmount: 12000,
        daysLeft: 25,
        supporters: 23,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "มูลนิธิผู้สูงอายุ",
        bankAccount: {
            bank: "ธนาคารกรุงไทย",
            accountNumber: "234-5-67890-1",
            accountName: "มูลนิธิผู้สูงอายุ",
        },
        qrCodeUrl: "/placeholder.svg?height=200&width=200",
        coordinates: { lat: 18.8861, lng: 98.8475 },
    },
    {
        id: 6,
        title: "ทุนการศึกษาเด็กด้อยโอกาส",
        description: "โครงการให้ทุนการศึกษาแก่เด็กนักเรียนที่มีฐานะยากจน เพื่อให้ได้รับการศึกษาที่ดีและมีอนาคตที่สดใส",
        category: "การศึกษา",
        location: "จังหวัดนครราชสีมา",
        detailedAddress: "โรงเรียนบ้านหนองไผ่ ตำบลหนองไผ่ อำเภอเมือง จังหวัดนครราชสีมา 30000",
        contactPhone: "044-456-789",
        goalAmount: 200000,
        currentAmount: 85000,
        daysLeft: 45,
        supporters: 67,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "มูลนิธิการศึกษา",
        bankAccount: {
            bank: "ธนาคารไทยพาณิชย์",
            accountNumber: "345-6-78901-2",
            accountName: "มูลนิธิการศึกษาเพื่อเด็ก",
        },
        qrCodeUrl: "/placeholder.svg?height=200&width=200",
        coordinates: { lat: 14.9799, lng: 102.0977 },
    },
    {
        id: 7,
        title: "รักษาแมวจรจัดที่บาดเจ็บ",
        description: "แมวจรจัดตัวนี้ถูกรถชน ขาหัก ต้องการเงินค่ารักษาพยาบาล และหาบ้านใหม่ให้",
        category: "สัตว์",
        location: "จังหวัดภูเก็ต",
        detailedAddress: "คลินิกสัตวแพทย์ภูเก็ต ถนนราษฎร์อุทิศ ตำบลตลาดใหญ่ อำเภอเมือง จังหวัดภูเก็ต 83000",
        contactPhone: "076-789-012",
        goalAmount: 15000,
        currentAmount: 8500,
        daysLeft: 5,
        supporters: 34,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "คลินิกสัตวแพทย์ภูเก็ต",
        bankAccount: {
            bank: "ธนาคารกสิกรไทย",
            accountNumber: "456-7-89012-3",
            accountName: "คลินิกสัตวแพทย์ภูเก็ต",
        },
        qrCodeUrl: "/placeholder.svg?height=200&width=200",
        coordinates: { lat: 7.8804, lng: 98.3923 },
    },
    {
        id: 8,
        title: "ผ่าตัดต้อกระจกผู้สูงอายุ",
        description: "คุณปู่สมศักดิ์ อายุ 82 ปี เป็นต้อกระจกทั้งสองข้าง มองไม่เห็น ต้องการเงินค่าผ่าตัด",
        category: "การแพทย์",
        location: "โรงพยาบาลจุฬาลงกรณ์",
        detailedAddress: "โรงพยาบาลจุฬาลงกรณ์ สภากาชาดไทย ถนนพญาไท เขตปทุมวัน กรุงเทพมหานคร 10330",
        contactPhone: "02-256-4000",
        goalAmount: 120000,
        currentAmount: 45000,
        daysLeft: 20,
        supporters: 78,
        image: "/placeholder.svg?height=400&width=300",
        organizer: "มูลนิธิการแพทย์",
        bankAccount: {
            bank: "ธนาคารกรุงเทพ",
            accountNumber: "567-8-90123-4",
            accountName: "มูลนิธิการแพทย์เพื่อผู้สูงอายุ",
        },
        qrCodeUrl: "/placeholder.svg?height=200&width=200",
        coordinates: { lat: 13.7307, lng: 100.5418 },
    },
]

const storyGroups = [
    {
        donationRequestId: 1,
        organizer: "สมชาย ใจดี",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: true,
        storyCount: 3,
    },
    {
        donationRequestId: 2,
        organizer: "มูลนิธิเด็กไทย",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: true,
        storyCount: 2,
    },
    {
        donationRequestId: 3,
        organizer: "โรงเรียนบ้านดอนตาล",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: false,
        storyCount: 1,
    },
    {
        donationRequestId: 4,
        organizer: "มูลนิธิรักษ์สัตว์",
        avatar: "/placeholder.svg?height=60&width=60",
        hasUnviewed: true,
        storyCount: 1,
    },
]

// เพิ่มข้อมูล Stories
const requestStories: { [key: number]: any } = {
    1: { hasStories: true, storyCount: 3, hasUnviewed: true },
    2: { hasStories: true, storyCount: 2, hasUnviewed: true },
    3: { hasStories: true, storyCount: 1, hasUnviewed: false },
    4: { hasStories: true, storyCount: 1, hasUnviewed: true },
    5: { hasStories: false, storyCount: 0, hasUnviewed: false },
    6: { hasStories: false, storyCount: 0, hasUnviewed: false },
    7: { hasStories: false, storyCount: 0, hasUnviewed: false },
    8: { hasStories: false, storyCount: 0, hasUnviewed: false },
}

export default function DonationList() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [sortBy, setSortBy] = useState("newest")
    const [showShareModal, setShowShareModal] = useState<number | null>(null)

    const filteredAndSortedRequests = useMemo(() => {
        const filtered = donationRequests.filter((request) => {
            const matchesSearch =
                request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.organizer.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesCategory = categoryFilter === "all" || request.category === categoryFilter

            return matchesSearch && matchesCategory
        })

        // Sort the filtered results
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return b.id - a.id
                case "urgent":
                    return a.daysLeft - b.daysLeft
                case "progress":
                    return b.currentAmount / b.goalAmount - a.currentAmount / a.goalAmount
                case "amount_low":
                    return a.goalAmount - b.goalAmount
                case "amount_high":
                    return b.goalAmount - a.goalAmount
                case "supporters":
                    return b.supporters - a.supporters
                default:
                    return 0
            }
        })

        return filtered
    }, [searchTerm, categoryFilter, sortBy])

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
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

    const categories = ["ทั้งหมด", "ภัยพิบัติ", "การแพทย์", "การศึกษา", "สัตว์"]

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">📋 รายการคำขอบริจาค</h1>
                            <p className="text-sm text-gray-600">ค้นหาและเลือกคำขอบริจาคที่คุณต้องการสนับสนุน</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.push("/")} className="bg-transparent">
                                💝 Swipe Mode
                            </Button>
                            <Button variant="outline" onClick={() => router.push("/favorites")} className="bg-transparent">
                                ❤️ รายการที่สนใจ
                            </Button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="ค้นหาคำขอบริจาค..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-40">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="หมวดหมู่" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    <SelectItem value="ภัยพิบัติ">ภัยพิบัติ</SelectItem>
                                    <SelectItem value="การแพทย์">การแพทย์</SelectItem>
                                    <SelectItem value="การศึกษา">การศึกษา</SelectItem>
                                    <SelectItem value="สัตว์">สัตว์</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40">
                                    <SortAsc className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="เรียงตาม" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">ล่าสุด</SelectItem>
                                    <SelectItem value="urgent">เร่งด่วน</SelectItem>
                                    <SelectItem value="progress">ความคืบหน้า</SelectItem>
                                    <SelectItem value="amount_low">เป้าหมายต่ำ-สูง</SelectItem>
                                    <SelectItem value="amount_high">เป้าหมายสูง-ต่ำ</SelectItem>
                                    <SelectItem value="supporters">ผู้สนับสนุนมากสุด</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                        พบ <span className="font-semibold text-gray-800">{filteredAndSortedRequests.length}</span> คำขอบริจาค
                        {searchTerm && (
                            <span>
                                {" "}
                                สำหรับ "<span className="font-semibold">{searchTerm}</span>"
                            </span>
                        )}
                        {categoryFilter !== "all" && (
                            <span>
                                {" "}
                                ในหมวด "<span className="font-semibold">{categoryFilter}</span>"
                            </span>
                        )}
                    </p>
                </div>

                {/* Stories Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">📖 Stories ความคืบหน้า</h2>
                        <span className="text-sm text-gray-500">อัปเดตล่าสุดจากผู้รับบริจาค</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {storyGroups.map((group, index) => (
                            <StoryPreview
                                key={group.donationRequestId}
                                donationRequestId={group.donationRequestId}
                                organizer={group.organizer}
                                avatar={group.avatar}
                                hasUnviewed={group.hasUnviewed}
                                storyCount={group.storyCount}
                                onClick={() => router.push(`/stories?group=${index}&story=0`)}
                            />
                        ))}
                    </div>
                </div>

                {/* Donation Requests Grid */}
                {filteredAndSortedRequests.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAndSortedRequests.map((request) => {
                            const progressPercentage = (request.currentAmount / request.goalAmount) * 100
                            const urgency = getUrgencyBadge(request.daysLeft)

                            return (
                                <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="relative">
                                        <img
                                            src={request.image || "/placeholder.svg"}
                                            alt={request.title}
                                            className="w-full h-48 object-cover cursor-pointer"
                                            onClick={() => router.push(`/donation/${request.id}`)}
                                        />
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <Badge className={getCategoryColor(request.category)}>{request.category}</Badge>
                                            <Badge className={urgency.class}>{urgency.text}</Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowShareModal(request.id)}
                                            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-800"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            <div>
                                                <h3
                                                    className="font-bold text-gray-800 mb-1 line-clamp-2 cursor-pointer hover:text-pink-600 transition-colors"
                                                    onClick={() => router.push(`/donation/${request.id}`)}
                                                >
                                                    {request.title}
                                                </h3>
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
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{request.daysLeft} วัน</span>
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

                                            {requestStories[request.id]?.hasStories && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <div
                                                            className={`w-2 h-2 rounded-full ${requestStories[request.id].hasUnviewed ? "bg-pink-500" : "bg-gray-300"}`}
                                                        />
                                                        <span className="text-gray-600">
                                                            📖 {requestStories[request.id].storyCount} Stories
                                                            {requestStories[request.id].hasUnviewed && (
                                                                <span className="text-pink-600 ml-1">• ใหม่</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => router.push(`/donation/${request.id}`)}
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
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบคำขอบริจาค</h2>
                        <p className="text-gray-500 mb-6">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</p>
                        <Button
                            onClick={() => {
                                setSearchTerm("")
                                setCategoryFilter("all")
                                setSortBy("newest")
                            }}
                            className="bg-pink-500 hover:bg-pink-600"
                        >
                            รีเซ็ตการค้นหา
                        </Button>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    isOpen={true}
                    onClose={() => setShowShareModal(null)}
                    donationRequest={filteredAndSortedRequests.find((req) => req.id === showShareModal)!}
                />
            )}
        </div>
    )
}
