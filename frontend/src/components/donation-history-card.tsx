"use client"

import type { DonationHistory } from "@/types/receipt"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, Users, Package, CreditCard } from "lucide-react"

interface DonationHistoryCardProps {
    history: DonationHistory
    onViewDetails: (history: DonationHistory) => void
}

export default function DonationHistoryCard({ history, onViewDetails }: DonationHistoryCardProps) {
    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
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

    // Calculate completion percentage (assuming target of 100,000 THB for demo)
    const targetAmount = 100000
    const completionPercentage = Math.min((history.totalAmount / targetAmount) * 100, 100)

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-2">{history.requestTitle}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>โดย {history.organizerName || "ไม่ระบุ"}</span>
                            <span>•</span>
                            <span>อัปเดต {formatDate(history.updatedAt)}</span>
                        </div>
                    </div>
                    <Badge className={`${getStatusColor(history.status)} border`}>{getStatusText(history.status)}</Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">ความคืบหน้า</span>
                        <span className="font-medium">{completionPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>฿{new Intl.NumberFormat("th-TH").format(history.totalAmount)}</span>
                        <span>เป้าหมาย ฿{new Intl.NumberFormat("th-TH").format(targetAmount)}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <span className="text-lg font-bold text-green-600">{history.totalDonations}</span>
                        </div>
                        <p className="text-xs text-gray-600">การบริจาค</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-lg font-bold text-blue-600">{history.totalItems}</span>
                        </div>
                        <p className="text-xs text-gray-600">สิ่งของ</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span className="text-lg font-bold text-purple-600">{history.totalVolunteers}</span>
                        </div>
                        <p className="text-xs text-gray-600">อาสาสมัคร</p>
                    </div>
                </div>

                {/* Recent Donations Preview */}
                {history.recentDonations.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">การบริจาคล่าสุด</h4>
                        <div className="space-y-1">
                            {history.recentDonations.slice(0, 3).map((donation, index) => (
                                <div key={donation.id} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        {donation.type === "money" && <CreditCard className="w-3 h-3 text-green-600" />}
                                        {donation.type === "items" && <Package className="w-3 h-3 text-blue-600" />}
                                        {donation.type === "volunteer" && <Users className="w-3 h-3 text-purple-600" />}
                                        <span className="text-gray-600">
                                            {donation.isAnonymous ? "ผู้บริจาคไม่ประสงค์ออกนาม" : donation.donorName || "ไม่ระบุชื่อ"}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        {donation.type === "money" && (
                                            <span className="font-medium text-green-600">
                                                ฿{new Intl.NumberFormat("th-TH").format(donation.amount || 0)}
                                            </span>
                                        )}
                                        {donation.type === "items" && (
                                            <span className="font-medium text-blue-600">{donation.items?.length || 1} รายการ</span>
                                        )}
                                        {donation.type === "volunteer" && (
                                            <span className="font-medium text-purple-600">{donation.volunteerHours || 0} ชม.</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {history.recentDonations.length > 3 && (
                                <p className="text-xs text-gray-500 text-center">และอีก {history.recentDonations.length - 3} รายการ</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <Button variant="outline" className="w-full bg-transparent" onClick={() => onViewDetails(history)}>
                    <Eye className="w-4 h-4 mr-2" />
                    ดูรายละเอียดทั้งหมด
                </Button>
            </CardContent>
        </Card>
    )
}
