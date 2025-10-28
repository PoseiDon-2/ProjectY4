"use client"

import { useState, useEffect } from "react"
import type { DonationHistory } from "@/types/receipt"
import { receiptSystem } from "@/lib/receipt-system"
import { useAuth } from "../auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DonationHistoryCard from "@/components/donation-history-card"
import DonationHistoryDetailModal from "@/components/donation-history-detail-modal"
import { ArrowLeft, Search, Filter, TrendingUp, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DonationHistoryPage() {
    const [histories, setHistories] = useState<DonationHistory[]>([])
    const [filteredHistories, setFilteredHistories] = useState<DonationHistory[]>([])
    const [selectedHistory, setSelectedHistory] = useState<DonationHistory | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sortBy, setSortBy] = useState<string>("updated")
    const [isLoading, setIsLoading] = useState(true)

    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        loadHistories()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [histories, searchTerm, statusFilter, sortBy])

    const loadHistories = () => {
        setIsLoading(true)
        try {
            const allHistories = receiptSystem.getAllDonationHistories()
            setHistories(allHistories)
        } catch (error) {
            console.error("Error loading donation histories:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = histories

        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(
                (history) =>
                    history.requestTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    history.organizerName.toLowerCase().includes(searchTerm.toLowerCase()),
            )
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((history) => history.status === statusFilter)
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "updated":
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                case "created":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case "amount":
                    return b.totalAmount - a.totalAmount
                case "donations":
                    return b.totalDonations - a.totalDonations
                default:
                    return 0
            }
        })

        setFilteredHistories(filtered)
    }

    const handleViewDetails = (history: DonationHistory) => {
        setSelectedHistory(history)
        setIsDetailModalOpen(true)
    }

    const getOverallStats = () => {
        const totalAmount = histories.reduce((sum, h) => sum + h.totalAmount, 0)
        const totalDonations = histories.reduce((sum, h) => sum + h.totalDonations, 0)
        const totalItems = histories.reduce((sum, h) => sum + h.totalItems, 0)
        const totalVolunteers = histories.reduce((sum, h) => sum + h.totalVolunteers, 0)
        const activeProjects = histories.filter((h) => h.status === "active").length
        const completedProjects = histories.filter((h) => h.status === "completed").length

        return {
            totalAmount,
            totalDonations,
            totalItems,
            totalVolunteers,
            activeProjects,
            completedProjects,
            totalProjects: histories.length,
        }
    }

    const stats = getOverallStats()

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับ
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">ประวัติการรับบริจาค</h1>
                        <p className="text-gray-600">ติดตามความคืบหน้าและสถิติการรับบริจาคของโครงการต่างๆ</p>
                    </div>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-xl font-bold text-blue-600">{stats.totalProjects}</p>
                            <p className="text-xs text-gray-600">โครงการทั้งหมด</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-xl font-bold text-green-600">{stats.activeProjects}</p>
                            <p className="text-xs text-gray-600">กำลังดำเนินการ</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <span className="text-2xl block mb-2">💰</span>
                            <p className="text-lg font-bold text-yellow-600">
                                ฿{new Intl.NumberFormat("th-TH").format(stats.totalAmount)}
                            </p>
                            <p className="text-xs text-gray-600">ยอดรวมทั้งหมด</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <span className="text-2xl block mb-2">🎁</span>
                            <p className="text-xl font-bold text-blue-600">{stats.totalDonations}</p>
                            <p className="text-xs text-gray-600">การบริจาคทั้งหมด</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <span className="text-2xl block mb-2">📦</span>
                            <p className="text-xl font-bold text-purple-600">{stats.totalItems}</p>
                            <p className="text-xs text-gray-600">สิ่งของ</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <span className="text-2xl block mb-2">👥</span>
                            <p className="text-xl font-bold text-orange-600">{stats.totalVolunteers}</p>
                            <p className="text-xs text-gray-600">อาสาสมัคร</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            ค้นหาและกรองข้อมูล
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="ค้นหาโครงการหรือผู้จัด..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="สถานะโครงการ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    <SelectItem value="active">กำลังรับบริจาค</SelectItem>
                                    <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger>
                                    <SelectValue placeholder="เรียงตาม" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="updated">อัปเดตล่าสุด</SelectItem>
                                    <SelectItem value="created">วันที่สร้าง</SelectItem>
                                    <SelectItem value="amount">ยอดเงิน</SelectItem>
                                    <SelectItem value="donations">จำนวนการบริจาค</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="outline" onClick={loadHistories}>
                                รีเฟรช
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Histories List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">กำลังโหลดประวัติการรับบริจาค...</p>
                    </div>
                ) : filteredHistories.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบประวัติการรับบริจาค</h3>
                            <p className="text-gray-600">
                                {histories.length === 0 ? "ยังไม่มีโครงการที่ได้รับการบริจาค" : "ไม่พบโครงการที่ตรงกับเงื่อนไขการค้นหา"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredHistories.map((history) => (
                            <DonationHistoryCard key={history.id} history={history} onViewDetails={handleViewDetails} />
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                <DonationHistoryDetailModal
                    history={selectedHistory}
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false)
                        setSelectedHistory(null)
                    }}
                />
            </div>
        </div>
    )
}
