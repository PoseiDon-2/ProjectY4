"use client"

import type { DonationHistory, ReceiptData } from "@/types/receipt"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { receiptSystem } from "@/lib/receipt-system"
import { Download, TrendingUp, Users, Package, CreditCard, Calendar } from "lucide-react"

interface DonationHistoryDetailModalProps {
    history: DonationHistory | null
    isOpen: boolean
    onClose: () => void
}

export default function DonationHistoryDetailModal({ history, isOpen, onClose }: DonationHistoryDetailModalProps) {
    if (!history) return null

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getHistoryStatusColor = (status: DonationHistory["status"]) => {
        switch (status) {
            case "active":
                return "bg-green-50 text-green-700 border-green-200"
            case "completed":
                return "bg-blue-50 text-blue-700 border-blue-200"
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200"
            default:
                return "bg-gray-50 text-gray-700 border-gray-200"
        }
    }

    const getHistoryStatusText = (status: DonationHistory["status"]) => {
        switch (status) {
            case "active":
                return "กำลังรับบริจาค"
            case "completed":
                return "เสร็จสิ้น"
            case "cancelled":
                return "ยกเลิก"
            default:
                return "ไม่ทราบสถานะ"
        }
    }

    const getReceiptStatusColor = (
        status: "completed" | "pending" | "cancelled" | "refunded"
    ) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-700"
            case "pending":
                return "bg-yellow-100 text-yellow-700"
            case "cancelled":
                return "bg-red-100 text-red-700"
            case "refunded":
                return "bg-gray-200 text-gray-700"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    const getTypeIcon = (type: ReceiptData["type"]) => {
        switch (type) {
            case "money":
                return <CreditCard className="w-4 h-4 text-green-600" />
            case "items":
                return <Package className="w-4 h-4 text-blue-600" />
            case "volunteer":
                return <Users className="w-4 h-4 text-purple-600" />
        }
    }

    const getReceiptSummary = (receipt: ReceiptData) => {
        return receiptSystem.generateReceiptSummary(receipt)
    }

    const targetAmount = 100000
    const completionPercentage = Math.min((history.totalAmount / targetAmount) * 100, 100)

    const moneyDonations = history.recentDonations.filter((d) => d.type === "money")
    const itemDonations = history.recentDonations.filter((d) => d.type === "items")
    const volunteerDonations = history.recentDonations.filter((d) => d.type === "volunteer")

    const handleDownloadReport = () => {
        alert("ฟีเจอร์ดาวน์โหลดรายงานจะเปิดใช้งานเร็วๆ นี้")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl mb-2">{history.requestTitle}</DialogTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>สร้างเมื่อ {formatDate(history.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>อัปเดตล่าสุด {formatDate(history.updatedAt)}</span>
                                </div>
                            </div>
                        </div>
                        <Badge className={`${getHistoryStatusColor(history.status)} border`}>
                            {getHistoryStatusText(history.status)}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold">ความคืบหน้าโครงการ</h3>
                            <span className="text-lg font-bold text-blue-600">
                                {completionPercentage.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={completionPercentage} className="h-3 mb-2" />
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>ได้รับแล้ว ฿{new Intl.NumberFormat("th-TH").format(history.totalAmount)}</span>
                            <span>เป้าหมาย ฿{new Intl.NumberFormat("th-TH").format(targetAmount)}</span>
                        </div>
                    </div>

                    <Tabs defaultValue="all">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                            <TabsTrigger value="money">เงิน</TabsTrigger>
                            <TabsTrigger value="items">สิ่งของ</TabsTrigger>
                            <TabsTrigger value="volunteer">อาสาสมัคร</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-2 max-h-60 overflow-y-auto">
                            {history.recentDonations.map((donation) => {
                                const summary = getReceiptSummary(donation)
                                return (
                                    <div
                                        key={donation.id}
                                        className="flex items-center justify-between p-3 bg-white border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getTypeIcon(donation.type)}
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {donation.isAnonymous
                                                        ? "ผู้บริจาคไม่ประสงค์ออกนาม"
                                                        : donation.donorName || "ไม่ระบุชื่อ"}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {formatDate(donation.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm">{summary.amount}</p>
                                            <Badge
                                                className={`${getReceiptStatusColor(summary.status)} border-0 text-xs`}
                                            >
                                                {summary.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )
                            })}
                        </TabsContent>
                    </Tabs>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button onClick={handleDownloadReport} className="flex-1">
                            <Download className="w-4 h-4 mr-2" />
                            ดาวน์โหลดรายงาน
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            ปิด
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
