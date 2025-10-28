"use client"

import type { Receipt } from "@/types/receipt"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { receiptSystem } from "@/lib/receipt-system"
import { Download, Eye, Package, CreditCard, Users } from "lucide-react"

interface ReceiptCardProps {
    receipt: Receipt
    onViewDetails: (receipt: Receipt) => void
}

export default function ReceiptCard({ receipt, onViewDetails }: ReceiptCardProps) {
    const summary = receiptSystem.generateReceiptSummary(receipt)

    const getTypeIcon = (type: Receipt["type"]) => {
        switch (type) {
            case "money":
                return <CreditCard className="w-5 h-5 text-green-600" />
            case "items":
                return <Package className="w-5 h-5 text-blue-600" />
            case "volunteer":
                return <Users className="w-5 h-5 text-purple-600" />
        }
    }

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const handleDownloadReceipt = () => {
        // Generate and download receipt PDF
        const receiptData = {
            receiptNumber: receipt.receiptNumber,
            date: formatDate(receipt.issuedAt),
            requestTitle: receipt.requestTitle,
            donorName: receipt.isAnonymous ? "ผู้บริจาคไม่ประสงค์ออกนาม" : receipt.donorName,
            ...summary,
        }

        // In a real app, this would generate a PDF
        console.log("Downloading receipt:", receiptData)
        alert("ฟีเจอร์ดาวน์โหลดใบเสร็จจะเปิดใช้งานเร็วๆ นี้")
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {getTypeIcon(receipt.type)}
                        <div>
                            <h3 className="font-medium text-gray-900">{summary.title}</h3>
                            <p className="text-sm text-gray-600">{summary.subtitle}</p>
                        </div>
                    </div>
                    <Badge className={`${summary.statusColor} border-0`}>{summary.status}</Badge>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">เลขที่ใบเสร็จ:</span>
                        <span className="font-mono">{receipt.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">วันที่:</span>
                        <span>{formatDate(receipt.issuedAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">โครงการ:</span>
                        <span className="text-right max-w-[200px] truncate">{receipt.requestTitle}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-gray-600">จำนวน/รายละเอียด:</span>
                        <span>{summary.amount}</span>
                    </div>
                    {receipt.pointsEarned > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">คะแนนที่ได้รับ:</span>
                            <span className="text-yellow-600 font-medium">+{receipt.pointsEarned} คะแนน</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onViewDetails(receipt)}>
                        <Eye className="w-4 h-4 mr-2" />
                        ดูรายละเอียด
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
