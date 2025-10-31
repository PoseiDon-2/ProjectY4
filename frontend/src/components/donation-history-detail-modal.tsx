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

    const getStatusColor = (status: DonationHistory["status"]) => {
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

    const getStatusText = (status: DonationHistory["status"]) => {
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

    // Calculate completion percentage (assuming target of 100,000 THB for demo)
    const targetAmount = 100000
    const completionPercentage = Math.min((history.totalAmount / targetAmount) * 100, 100)

    // Group donations by type
    const moneyDonations = history.recentDonations.filter((d) => d.type === "money")
    const itemDonations = history.recentDonations.filter((d) => d.type === "items")
    const volunteerDonations = history.recentDonations.filter((d) => d.type === "volunteer")

    const handleDownloadReport = () => {
        // Generate and download donation report
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
                        <Badge className={`${getStatusColor(history.status)} border`}>{getStatusText(history.status)}</Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Progress Overview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-gray-900">ความคืบหน้าโครงการ</h3>
                            <span className="text-lg font-bold text-blue-600">{completionPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-3 mb-2" />
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>ได้รับแล้ว ฿{new Intl.NumberFormat("th-TH").format(history.totalAmount)}</span>
                            <span>เป้าหมาย ฿{new Intl.NumberFormat("th-TH").format(targetAmount)}</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-600">{history.totalDonations}</p>
                            <p className="text-sm text-green-700">การบริจาคเงิน</p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-600">{history.totalItems}</p>
                            <p className="text-sm text-blue-700">สิ่งของ</p>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-purple-600">{history.totalVolunteers}</p>
                            <p className="text-sm text-purple-700">อาสาสมัคร</p>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <span className="text-3xl block mb-2">💰</span>
                            <p className="text-2xl font-bold text-yellow-600">
                                ฿{new Intl.NumberFormat("th-TH").format(history.totalAmount)}
                            </p>
                            <p className="text-sm text-yellow-700">ยอดรวม</p>
                        </div>
                    </div>

                    {/* Donations Detail Tabs */}
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">ทั้งหมด ({history.recentDonations.length})</TabsTrigger>
                            <TabsTrigger value="money">เงิน ({moneyDonations.length})</TabsTrigger>
                            <TabsTrigger value="items">สิ่งของ ({itemDonations.length})</TabsTrigger>
                            <TabsTrigger value="volunteer">อาสาสมัคร ({volunteerDonations.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-3">
                            {history.recentDonations.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">ยังไม่มีการบริจาค</div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
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
                                                            {donation.isAnonymous ? "ผู้บริจาคไม่ประสงค์ออกนาม" : donation.donorName || "ไม่ระบุชื่อ"}
                                                        </p>
                                                        <p className="text-xs text-gray-600">{formatDate(donation.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-sm">{summary.amount}</p>
                                                    <Badge className={`${summary.statusColor} border-0 text-xs`}>{summary.status}</Badge>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="money" className="space-y-3">
                            {moneyDonations.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">ยังไม่มีการบริจาคเงิน</div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {moneyDonations.map((donation) => (
                                        <div
                                            key={donation.id}
                                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <CreditCard className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {donation.isAnonymous ? "ผู้บริจาคไม่ประสงค์ออกนาม" : donation.donorName || "ไม่ระบุชื่อ"}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {donation.paymentMethod} • {formatDate(donation.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">
                                                    ฿{new Intl.NumberFormat("th-TH").format(donation.amount || 0)}
                                                </p>
                                                <p className="text-xs text-green-600">+{donation.pointsEarned} คะแนน</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="items" className="space-y-3">
                            {itemDonations.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">ยังไม่มีการบริจาคสิ่งของ</div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {itemDonations.map((donation) => (
                                        <div
                                            key={donation.id}
                                            className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Package className="w-4 h-4 text-blue-600" />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {donation.isAnonymous ? "ผู้บริจาคไม่ประสงค์ออกนาม" : donation.donorName || "ไม่ระบุชื่อ"}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {donation.deliveryMethod === "send-to-address" ? "ส่งตามที่อยู่" : "นำไปส่งถึงที่"} •{" "}
                                                        {formatDate(donation.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-blue-600">{donation.items?.length || 1} รายการ</p>
                                                <p className="text-xs text-blue-600">+{donation.pointsEarned} คะแนน</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="volunteer" className="space-y-3">
                            {volunteerDonations.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">ยังไม่มีการสมัครอาสาสมัคร</div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {volunteerDonations.map((donation) => (
                                        <div
                                            key={donation.id}
                                            className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Users className="w-4 h-4 text-purple-600" />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {donation.isAnonymous ? "ผู้บริจาคไม่ประสงค์ออกนาม" : donation.donorName || "ไม่ระบุชื่อ"}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {donation.volunteerSkills?.join(", ") || "ไม่ระบุทักษะ"} • {formatDate(donation.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-purple-600">{donation.volunteerHours || 0} ชั่วโมง</p>
                                                <p className="text-xs text-purple-600">+{donation.pointsEarned} คะแนน</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* Actions */}
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
