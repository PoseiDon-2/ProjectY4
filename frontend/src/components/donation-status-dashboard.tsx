"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"
import { receiptSystem } from "@/lib/receipt-system"
import { StatusTrackingTimeline } from "./status-tracking-timeline"
import type { ReceiptData } from "@/types/receipt"

export function DonationStatusDashboard() {
    const [receipts, setReceipts] = useState<ReceiptData[]>([])
    const [filteredReceipts, setFilteredReceipts] = useState<ReceiptData[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)

    useEffect(() => {
        loadReceipts()
    }, [])

    useEffect(() => {
        filterReceipts()
    }, [receipts, searchTerm, statusFilter, typeFilter])

    const loadReceipts = () => {
        const allReceipts = receiptSystem.getAllReceipts()
        setReceipts(allReceipts)
    }

    const filterReceipts = () => {
        let filtered = receipts

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (receipt) =>
                    receipt.requestTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    receipt.donorName?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((receipt) => receipt.status === statusFilter)
        }

        // Type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter((receipt) => receipt.type === typeFilter)
        }

        setFilteredReceipts(filtered)
    }

    const handleStatusUpdate = (receiptId: string, newStatus: ReceiptData["status"]) => {
        receiptSystem.updateReceiptStatus(receiptId, newStatus)
        loadReceipts()
    }

    const getStatusStats = () => {
        const stats = {
            total: receipts.length,
            completed: receipts.filter((r) => r.status === "completed").length,
            pending: receipts.filter((r) => r.status === "pending").length,
            cancelled: receipts.filter((r) => r.status === "cancelled").length,
            refunded: receipts.filter((r) => r.status === "refunded").length,
        }
        return stats
    }

    const stats = getStatusStats()

    const getStatusBadgeVariant = (status: ReceiptData["status"]) => {
        switch (status) {
            case "completed":
                return "default"
            case "pending":
                return "secondary"
            case "cancelled":
                return "destructive"
            case "refunded":
                return "outline"
            default:
                return "secondary"
        }
    }

    const getStatusText = (status: ReceiptData["status"]) => {
        switch (status) {
            case "completed":
                return "สำเร็จ"
            case "pending":
                return "รอดำเนินการ"
            case "cancelled":
                return "ยกเลิก"
            case "refunded":
                return "คืนเงิน"
            default:
                return status
        }
    }

    const getTypeText = (type: ReceiptData["type"]) => {
        switch (type) {
            case "money":
                return "เงิน"
            case "items":
                return "สิ่งของ"
            case "volunteer":
                return "อาสาสมัคร"
            default:
                return type
        }
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">ทั้งหมด</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">สำเร็จ</p>
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <div>
                                <p className="text-sm text-gray-600">รอดำเนินการ</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <div>
                                <p className="text-sm text-gray-600">ยกเลิก</p>
                                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-600" />
                            <div>
                                <p className="text-sm text-gray-600">คืนเงิน</p>
                                <p className="text-2xl font-bold text-gray-600">{stats.refunded}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>ค้นหาและกรองข้อมูล</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="ค้นหาด้วยชื่อคำขอ, เลขที่สลิป, หรือชื่อผู้บริจาค..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="สถานะ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกสถานะ</SelectItem>
                                <SelectItem value="completed">สำเร็จ</SelectItem>
                                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                                <SelectItem value="cancelled">ยกเลิก</SelectItem>
                                <SelectItem value="refunded">คืนเงิน</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="ประเภท" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกประเภท</SelectItem>
                                <SelectItem value="money">เงิน</SelectItem>
                                <SelectItem value="items">สิ่งของ</SelectItem>
                                <SelectItem value="volunteer">อาสาสมัคร</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            <Tabs defaultValue="list" className="w-full">
                <TabsList>
                    <TabsTrigger value="list">รายการ</TabsTrigger>
                    <TabsTrigger value="timeline">ไทม์ไลน์</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    {filteredReceipts.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-gray-500">ไม่พบข้อมูลที่ตรงกับการค้นหา</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredReceipts.map((receipt) => (
                            <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="font-medium">{receipt.requestTitle}</h3>
                                                <Badge variant={getStatusBadgeVariant(receipt.status)}>{getStatusText(receipt.status)}</Badge>
                                                <Badge variant="outline">{getTypeText(receipt.type)}</Badge>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-600">
                                                <p>เลขที่สลิป: {receipt.receiptNumber}</p>
                                                <p>ผู้บริจาค: {receipt.isAnonymous ? "ไม่ระบุชื่อ" : receipt.donorName || "ไม่ระบุ"}</p>
                                                <p>วันที่: {new Date(receipt.createdAt).toLocaleDateString("th-TH")}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(receipt)}>
                                            ดูรายละเอียด
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                    {selectedReceipt ? (
                        <StatusTrackingTimeline receipt={selectedReceipt} onStatusUpdate={handleStatusUpdate} />
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-gray-500">เลือกรายการจากแท็บ "รายการ" เพื่อดูไทม์ไลน์</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
