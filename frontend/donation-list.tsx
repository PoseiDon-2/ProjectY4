"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, SortAsc, MapPin, Users, Calendar, Heart, ExternalLink, Share2, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ShareModal from "./share-modal"
// ลบ mockUsers ออก
// import { mockUsers } from "@/lib/mock-data"
import axios from "axios"

// --- Configuration ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
const STORAGE_URL = API_URL.replace('/api', '/storage')

// --- Interface ---
interface DonationRequest {
  id: string
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
  coordinates?: { lat: number; lng: number }
  createdAt: string
}

// เพิ่ม Interface สำหรับ User
interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string | null
  role: string
}

// --- Helper Functions ---
const formatAmount = (amount: number) => new Intl.NumberFormat("th-TH").format(amount)

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "ภัยพิบัติ": "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
    "การแพทย์": "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
    "การศึกษา": "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
    "สัตว์": "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
    "สิ่งแวดล้อม": "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200",
    "เด็กและเยาวชน": "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200",
    "ทั่วไป": "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200",
  }
  return colors[category] || "bg-gray-100 text-gray-700 border-gray-200"
}

const getUrgencyBadge = (daysLeft: number) => {
  if (daysLeft <= 0) return { text: "ปิดรับ", class: "bg-gray-100 text-gray-600 border-gray-200" }
  if (daysLeft <= 7) return { text: "เร่งด่วน", class: "bg-red-100 text-red-600 border-red-200 animate-pulse" }
  if (daysLeft <= 15) return { text: "ใกล้หมดเขต", class: "bg-orange-100 text-orange-600 border-orange-200" }
  return { text: `${daysLeft} วัน`, class: "bg-blue-50 text-blue-600 border-blue-200" }
}

// --- Data Transformation ---
const transformApiData = (apiData: any): DonationRequest => {
  const calculateDaysLeft = (expiresAt: string | null) => {
    if (!expiresAt) return 30
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return "/placeholder.svg"
    if (path.startsWith('http') || path.startsWith('https')) return path
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${STORAGE_URL}/${cleanPath}`
  }

  let imageUrl = "/placeholder.svg"
  try {
    const images = typeof apiData.images === 'string' ? JSON.parse(apiData.images) : apiData.images
    if (images && images.length > 0) imageUrl = getImageUrl(images[0])
  } catch (e) { console.error("Error parsing images", e) }

  return {
    id: apiData.id?.toString() || "",
    title: apiData.title || "ไม่มีชื่อโครงการ",
    description: apiData.description || "",
    category: apiData.category?.name || "ทั่วไป",
    location: apiData.location || "ไม่ระบุสถานที่",
    goalAmount: Number(apiData.goal_amount || apiData.target_amount || 0),
    currentAmount: Number(apiData.current_amount || 0),
    daysLeft: calculateDaysLeft(apiData.expires_at),
    supporters: Number(apiData.supporter_count || apiData.supporters || 0),
    image: imageUrl,
    organizer: apiData.organizer_name || "ผู้จัดทำ",
    detailedAddress: apiData.detailed_address || "",
    contactPhone: apiData.contact_phone || "",
    bankAccount: {
      bank: apiData.bank_name || "",
      accountNumber: apiData.account_number || "",
      accountName: apiData.account_name || ""
    },
    qrCodeUrl: getImageUrl(apiData.qr_code_path),
    createdAt: apiData.created_at || new Date().toISOString()
  }
}

// Helper แปลงข้อมูลผู้ใช้
const transformUserData = (apiData: any): UserProfile => {
    return {
        id: apiData.id?.toString() || "",
        firstName: apiData.first_name || apiData.name || "User",
        lastName: apiData.last_name || "",
        email: apiData.email || "",
        avatar: apiData.avatar_path ? `${STORAGE_URL}/${apiData.avatar_path.startsWith('/') ? apiData.avatar_path.slice(1) : apiData.avatar_path}` : null,
        role: apiData.role || "user"
    }
}

export default function DonationList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [showShareModal, setShowShareModal] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<"donations" | "users">("donations")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([])
  const [users, setUsers] = useState<UserProfile[]>([]) // State สำหรับผู้ใช้
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // ดึงข้อมูลทั้งสองอย่างพร้อมกัน
        const [donationsResponse, usersResponse] = await Promise.all([
            axios.get(`${API_URL}/donation-requests`),
            axios.get(`${API_URL}/users`) // สมมติว่ามี endpoint นี้
        ])

        const rawDonations = donationsResponse.data.data || donationsResponse.data
        setDonationRequests(rawDonations.map(transformApiData))

        const rawUsers = usersResponse.data.data || usersResponse.data
        setUsers(rawUsers.map(transformUserData))

      } catch (err) {
        console.error("Error fetching data:", err)
        setError("ไม่สามารถโหลดข้อมูลได้")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredUsers = useMemo(() => {
    // กรองจาก state users จริง
    const nonAdminUsers = users.filter((u) => u.role !== "admin")
    if (!userSearchTerm.trim()) return nonAdminUsers
    const term = userSearchTerm.toLowerCase()
    return nonAdminUsers.filter(
      (u) =>
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(term)
    )
  }, [userSearchTerm, users])

  const filteredAndSortedRequests = useMemo(() => {
    let result = [...donationRequests]
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      result = result.filter((req) =>
        req.title.toLowerCase().includes(lowerTerm) ||
        req.description.toLowerCase().includes(lowerTerm) ||
        req.location.toLowerCase().includes(lowerTerm) ||
        req.organizer.toLowerCase().includes(lowerTerm)
      )
    }
    if (categoryFilter !== "all") {
      result = result.filter((req) => req.category === categoryFilter)
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "urgent": return a.daysLeft - b.daysLeft
        case "progress": return (b.currentAmount / b.goalAmount) - (a.currentAmount / a.goalAmount)
        default: return 0
      }
    })
    return result
  }, [donationRequests, searchTerm, categoryFilter, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header + Search */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📋 รายการคำขอบริจาค</h1>
              <p className="text-xs sm:text-sm text-gray-600">ค้นหาและเลือกคำขอบริจาคที่คุณต้องการสนับสนุน</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => router.push("/")} className="bg-transparent hover:bg-pink-50 text-pink-600 border-pink-200 text-xs sm:text-sm">
                💝 Swipe Mode
              </Button>
              <Button variant="outline" onClick={() => router.push("/favorites")} className="bg-transparent hover:bg-pink-50 text-pink-600 border-pink-200 text-xs sm:text-sm">
                ❤️ รายการที่สนใจ
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              variant={searchMode === "donations" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("donations")}
              className={searchMode === "donations" ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0" : "bg-transparent"}
            >
              <Heart className="w-4 h-4 mr-1" /> ค้นหาคำขอบริจาค
            </Button>
            <Button
              variant={searchMode === "users" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("users")}
              className={searchMode === "users" ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0" : "bg-transparent"}
            >
              <User className="w-4 h-4 mr-1" /> ค้นหาผู้ใช้งาน
            </Button>
          </div>

          {searchMode === "donations" ? (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="ค้นหาคำขอบริจาค..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="หมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="ภัยพิบัติ">ภัยพิบัติ</SelectItem>
                    <SelectItem value="การแพทย์">การแพทย์</SelectItem>
                    <SelectItem value="การศึกษา">การศึกษา</SelectItem>
                    <SelectItem value="สัตว์">สัตว์</SelectItem>
                    <SelectItem value="สิ่งแวดล้อม">สิ่งแวดล้อม</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="เรียงตาม" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">ล่าสุด</SelectItem>
                    <SelectItem value="urgent">เร่งด่วน</SelectItem>
                    <SelectItem value="progress">ความคืบหน้า</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="ค้นหาผู้ใช้งาน ชื่อ หรืออีเมล..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} className="pl-10" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : searchMode === "users" ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">พบ <span className="font-semibold text-gray-800">{filteredUsers.length}</span> ผู้ใช้งาน</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((u) => (
                <Card key={u.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/profile/${u.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={u.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{u.firstName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-800">{u.firstName} {u.lastName}</h3>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">พบ <span className="font-semibold text-gray-800">{filteredAndSortedRequests.length}</span> คำขอบริจาค</p>
            </div>

            {filteredAndSortedRequests.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedRequests.map((request) => {
                  const progressPercentage = request.goalAmount > 0 ? (request.currentAmount / request.goalAmount) * 100 : 0
                  const urgency = getUrgencyBadge(request.daysLeft)

                  return (
                    <Card key={request.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 bg-white">
                      
                      {/* Image & Badges */}
                      <div className="relative h-48 w-full shrink-0 overflow-hidden">
                        <img
                          src={request.image}
                          alt={request.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                          onClick={() => router.push(`/donation/${request.id}`)}
                        />
                        {/* 1. Badge หมวดหมู่ ซ้ายบน */}
                        <div className="absolute top-3 left-3 flex gap-2 z-10">
                          <Badge className={`${getCategoryColor(request.category)} shadow-sm border`}>
                            {request.category}
                          </Badge>
                          <Badge className={`${urgency.class} shadow-sm border`}>
                            {urgency.text}
                          </Badge>
                        </div>
                        {/* 2. ปุ่มแชร์ ขวาบน */}
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowShareModal(request.id);
                          }}
                          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 shadow-sm z-10"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Content */}
                      <CardContent className="p-4 flex flex-col flex-grow">
                        {/* Title & Description */}
                        <div className="mb-4">
                          <h3
                            className="font-bold text-lg text-gray-800 line-clamp-1 mb-1 cursor-pointer hover:text-pink-600 transition-colors"
                            onClick={() => router.push(`/donation/${request.id}`)}
                          >
                            {request.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                            {request.description}
                          </p>
                        </div>

                        {/* Meta Data */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[120px]">{request.location}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Users className="w-3.5 h-3.5" />
                            <span>{request.supporters}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-auto">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{request.daysLeft} วัน</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-auto space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 text-xs font-medium">ระดมทุนได้</span>
                            <span className="font-semibold text-gray-900 text-sm">
                              ฿{formatAmount(request.currentAmount)} <span className="text-gray-400 font-normal">/ {formatAmount(request.goalAmount)}</span>
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" indicatorClassName="bg-gradient-to-r from-pink-500 to-purple-500" />
                          <div className="text-right text-xs text-gray-400">
                             {Math.round(progressPercentage)}% ของเป้าหมาย
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 pt-4 mt-2 border-t border-gray-50">
                          <Button
                            onClick={() => router.push(`/donation/${request.id}`)}
                            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-sm border-0"
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            บริจาค
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/donation/${request.id}`)}
                            className="border-pink-200 text-pink-600 hover:bg-pink-50 bg-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
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
          </>
        )}
      </div>

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