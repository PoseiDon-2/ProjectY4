"use client"

import { useState, useEffect } from "react"
import type { ReceiptData, ReceiptFilter } from "@/types/receipt"
import { receiptSystem } from "@/lib/receipt-system"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ReceiptCard from "@/components/receipt-card"
import ReceiptDetailModal from "@/components/receipt-detail-modal"
import { ArrowLeft, Search, Filter, Download, FileText, Package, CreditCard, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ReceiptsPage() {
    const [receipts, setReceipts] = useState<ReceiptData[]>([])
    const [filteredReceipts, setFilteredReceipts] = useState<ReceiptData[]>([])
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [filter, setFilter] = useState<ReceiptFilter>({})
    const [isLoading, setIsLoading] = useState(true)

    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (user) {
            loadReceipts()
        }
    }, [user])

    useEffect(() => {
        applyFilters()
    }, [receipts, searchTerm, filter])

    const loadReceipts = () => {
        setIsLoading(true)
        try {
            const userReceipts = receiptSystem.getReceiptsForDonor(user?.id || "")
            setReceipts(userReceipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
        } catch (error) {
            console.error("Error loading receipts:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = receipts

        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(
                (receipt) =>
                    receipt.requestTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()),
            )
        }

        // Apply filters
        if (filter.type) {
            filtered = filtered.filter((receipt) => receipt.type === filter.type)
        }
        if (filter.status) {
            filtered = filtered.filter((receipt) => receipt.status === filter.status)
        }
        if (filter.dateFrom) {
            filtered = filtered.filter((receipt) => new Date(receipt.createdAt) >= filter.dateFrom!)
        }
        if (filter.dateTo) {
            filtered = filtered.filter((receipt) => new Date(receipt.createdAt) <= filter.dateTo!)
        }

        setFilteredReceipts(filtered)
    }

    const handleViewDetails = (receipt: ReceiptData) => {
        setSelectedReceipt(receipt)
        setIsDetailModalOpen(true)
    }

    const handleDownloadAll = () => {
        // Generate and download all receipts
        alert("ฟีเจอร์ดาวน์โหลดใบเสร็จทั้งหมดจะเปิดใช้งานเร็วๆ นี้")
    }

    const getStats = () => {
        const totalMoney = receipts
            .filter((r) => r.type === "money" && r.status === "completed")
            .reduce((sum, r) => sum + (r.amount || 0), 0)

        const totalItems = receipts.filter((r) => r.type === "items").length
        const totalVolunteer = receipts.filter((r) => r.type === "volunteer").length
        const totalPoints = receipts.reduce((sum, r) => sum + r.pointsEarned, 0)

        return { totalMoney, totalItems, totalVolunteer, totalPoints }
    }

    const stats = getStats()

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <h2 className="text-xl font-bold mb-2">เข้าสู่ระบบเพื่อดูใบเสร็จ</h2>
                        <p className="text-gray-600 mb-4">กรุณาเข้าสู่ระบบเพื่อดูประวัติการบริจาคและใบเสร็จของคุณ</p>
                        <Button onClick={() => router.push("/login")}>เข้าสู่ระบบ</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

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
                        <h1 className="text-2xl font-bold text-gray-900">ใบเสร็จและประวัติการบริจาค</h1>
                        <p className="text-gray-600">จัดการและดาวน์โหลดใบเสร็จการบริจาคของคุณ</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-600">เงินบริจาค</p>
                                    <p className="text-xl font-bold text-green-600">
                                        ฿{new Intl.NumberFormat("th-TH").format(stats.totalMoney)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Package className="w-8 h-8 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">สิ่งของ</p>
                                    <p className="text-xl font-bold text-blue-600">{stats.totalItems} ครั้ง</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-purple-600" />
                                <div>
                                    <p className="text-sm text-gray-600">อาสาสมัคร</p>
                                    <p className="text-xl font-bold text-purple-600">{stats.totalVolunteer} ครั้ง</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🪙</span>
                                <div>
                                    <p className="text-sm text-gray-600">คะแนนรวม</p>
                                    <p className="text-xl font-bold text-yellow-600">{stats.totalPoints} คะแนน</p>
                                </div>
                            </div>
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
                                    placeholder="ค้นหาโครงการหรือเลขใบเสร็จ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select
                                value={filter.type || "all"}
                                onValueChange={(value) => setFilter({ ...filter, type: value === "all" ? undefined : value as ReceiptFilter["type"] })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="ประเภทการบริจาค" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    <SelectItem value="money">เงิน</SelectItem>
                                    <SelectItem value="items">สิ่งของ</SelectItem>
                                    <SelectItem value="volunteer">อาสาสมัคร</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filter.status || "all"}
                                onValueChange={(value) => setFilter({ ...filter, status: value === "all" ? undefined : value as ReceiptFilter["status"] })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="สถานะ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด</SelectItem>
                                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                                    <SelectItem value="completed">สำเร็จ</SelectItem>
                                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                                    <SelectItem value="refunded">คืนเงิน</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={handleDownloadAll} variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                ดาวน์โหลดทั้งหมด
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Receipts List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">กำลังโหลดใบเสร็จ...</p>
                    </div>
                ) : filteredReceipts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบใบเสร็จ</h3>
                            <p className="text-gray-600">
                                {receipts.length === 0
                                    ? "คุณยังไม่มีประวัติการบริจาค เริ่มบริจาคเพื่อช่วยเหลือผู้อื่นกันเถอะ"
                                    : "ไม่พบใบเสร็จที่ตรงกับเงื่อนไขการค้นหา"}
                            </p>
                            {receipts.length === 0 && (
                                <Button className="mt-4" onClick={() => router.push("/")}>
                                    เริ่มบริจาค
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredReceipts.map((receipt) => (
                            <ReceiptCard key={receipt.id} receipt={receipt} onViewDetails={handleViewDetails} />
                        ))}
                    </div>
                )}

                {/* Receipt Detail Modal */}
                <ReceiptDetailModal
                    receipt={selectedReceipt}
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false)
                        setSelectedReceipt(null)
                    }}
                />
            </div>
        </div>
    )
}
