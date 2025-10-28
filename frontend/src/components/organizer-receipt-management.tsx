"use client"

import { useState, useEffect } from "react"
import type { ReceiptData } from "@/types/receipt"
import { receiptSystem } from "@/lib/receipt-system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ReceiptUploadModal from "./receipt-upload-modal"
import ReceiptDetailModal from "./receipt-detail-modal"
import { Upload, Eye, Download, Search, Filter, Plus, FileText, TrendingUp } from "lucide-react"

interface OrganizerReceiptManagementProps {
    requestId: string
    requestTitle: string
}

export default function OrganizerReceiptManagement({ requestId, requestTitle }: OrganizerReceiptManagementProps) {
    const [receipts, setReceipts] = useState<ReceiptData[]>([])
    const [filteredReceipts, setFilteredReceipts] = useState<ReceiptData[]>([])
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadReceipts()
    }, [requestId])

    useEffect(() => {
        applyFilters()
    }, [receipts, searchTerm, typeFilter, statusFilter])

    const loadReceipts = () => {
        setIsLoading(true)
        try {
            const requestReceipts = receiptSystem.getReceiptsForRequest(requestId)
            setReceipts(requestReceipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
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
                    receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    receipt.donorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    receipt.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
        }

        // Apply type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter((receipt) => receipt.type === typeFilter)
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((receipt) => receipt.status === statusFilter)
        }

        setFilteredReceipts(filtered)
    }

    const handleViewDetails = (receipt: ReceiptData) => {
        setSelectedReceipt(receipt)
        setIsDetailModalOpen(true)
    }

    const handleUploadComplete = () => {
        loadReceipts()
    }

    const getStats = () => {
        const totalAmount = receipts
            .filter((r) => r.type === "money" && r.status === "completed")
            .reduce((sum, r) => sum + (r.amount || 0), 0)

        const totalReceipts = receipts.length
        const pendingReceipts = receipts.filter((r) => r.status === "pending").length
        const completedReceipts = receipts.filter((r) => r.status === "completed").length

        return { totalAmount, totalReceipts, pendingReceipts, completedReceipts }
    }

    const stats = getStats()

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getTypeIcon = (type: ReceiptData["type"]) => {
        switch (type) {
            case "money":
                return "💰"
            case "items":
                return "📦"
            case "volunteer":
                return "👥"
        }
    }

    const getStatusColor = (status: ReceiptData["status"]) => {
        switch (status) {
            case "pending":
                return "bg-yellow-50 text-yellow-700 border-yellow-200"
            case "completed":
                return "bg-green-50 text-green-700 border-green-200"
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200"
            case "refunded":
                return "bg-gray-50 text-gray-700 border-gray-200"
        }
    }

    const getStatusText = (status: ReceiptData["status"]) => {
        switch (status) {
            case "pending":
                return "รอดำเนินการ"
            case "completed":
                return "สำเร็จ"
            case "cancelled":
                return "ยกเลิก"
            case "refunded":
                return "คืนเงิน"
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">จัดการสลิปการรับเงิน</h2>
                    <p className="text-gray-600">สำหรับ: {requestTitle}</p>
                </div>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    อัปโหลดสลิป
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-xl font-bold text-green-600">
                            ฿{new Intl.NumberFormat("th-TH").format(stats.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-600">ยอดรวมที่ได้รับ</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-xl font-bold text-blue-600">{stats.totalReceipts}</p>
                        <p className="text-xs text-gray-600">สลิปทั้งหมด</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <span className="text-2xl block mb-2">⏳</span>
                        <p className="text-xl font-bold text-yellow-600">{stats.pendingReceipts}</p>
                        <p className="text-xs text-gray-600">รอดำเนินการ</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <span className="text-2xl block mb-2">✅</span>
                        <p className="text-xl font-bold text-green-600">{stats.completedReceipts}</p>
                        <p className="text-xs text-gray-600">เสร็จสิ้น</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
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
                                placeholder="ค้นหาเลขใบเสร็จ, ชื่อผู้บริจาค..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="ประเภท" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทั้งหมด</SelectItem>
                                <SelectItem value="money">เงิน</SelectItem>
                                <SelectItem value="items">สิ่งของ</SelectItem>
                                <SelectItem value="volunteer">อาสาสมัคร</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
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

                        <Button variant="outline" onClick={loadReceipts}>
                            รีเฟรช
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Receipts List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">กำลังโหลดสลิป...</p>
                </div>
            ) : filteredReceipts.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบสลิปการรับเงิน</h3>
                        <p className="text-gray-600 mb-4">
                            {receipts.length === 0 ? "ยังไม่มีสลิปการรับเงิน เริ่มอัปโหลดสลิปเพื่อติดตามการรับบริจาค" : "ไม่พบสลิปที่ตรงกับเงื่อนไขการค้นหา"}
                        </p>
                        {receipts.length === 0 && (
                            <Button onClick={() => setIsUploadModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                อัปโหลดสลิปแรก
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredReceipts.map((receipt) => {
                        const summary = receiptSystem.generateReceiptSummary(receipt)
                        return (
                            <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="text-2xl">{getTypeIcon(receipt.type)}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium text-gray-900">{receipt.receiptNumber}</h3>
                                                    <Badge className={`${getStatusColor(receipt.status)} border text-xs`}>
                                                        {getStatusText(receipt.status)}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p>{receipt.isAnonymous ? "ผู้บริจาคไม่ประสงค์ออกนาม" : receipt.donorName || "ไม่ระบุชื่อ"}</p>
                                                    <p>{formatDate(receipt.createdAt)}</p>
                                                </div>

                                                {receipt.attachments && receipt.attachments.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-xs text-gray-500 mb-2">สลิปที่แนบมา ({receipt.attachments.length} ไฟล์)</p>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {receipt.attachments.slice(0, 3).map((attachment, index) => (
                                                                <div key={index} className="relative group">
                                                                    <img
                                                                        src={attachment.url || "/placeholder.svg"}
                                                                        alt={`สลิป ${receipt.receiptNumber} - ${index + 1}`}
                                                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                                        onClick={() => window.open(attachment.url, "_blank")}
                                                                    />
                                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                                                        <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {receipt.attachments.length > 3 && (
                                                                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                                                                    +{receipt.attachments.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{summary.amount}</p>
                                                <p className="text-xs text-gray-500">{summary.subtitle}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(receipt)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => alert("ฟีเจอร์ดาวน์โหลดจะเปิดใช้งานเร็วๆ นี้")}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modals */}
            <ReceiptUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                requestId={requestId}
                requestTitle={requestTitle}
                onUploadComplete={handleUploadComplete}
            />

            <ReceiptDetailModal
                receipt={selectedReceipt}
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false)
                    setSelectedReceipt(null)
                }}
            />
        </div>
    )
}
