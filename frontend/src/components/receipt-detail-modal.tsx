"use client"

import type { Receipt } from "@/types/receipt"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { receiptSystem } from "@/lib/receipt-system"
import { Download, Package, CreditCard, Users, Eye } from "lucide-react"

interface ReceiptDetailModalProps {
    receipt: Receipt | null
    isOpen: boolean
    onClose: () => void
}

export default function ReceiptDetailModal({ receipt, isOpen, onClose }: ReceiptDetailModalProps) {
    if (!receipt) return null

    const summary = receiptSystem.generateReceiptSummary(receipt)

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getTypeIcon = (type: Receipt["type"]) => {
        switch (type) {
            case "money":
                return <CreditCard className="w-6 h-6 text-green-600" />
            case "items":
                return <Package className="w-6 h-6 text-blue-600" />
            case "volunteer":
                return <Users className="w-6 h-6 text-purple-600" />
        }
    }

    const handleDownloadReceipt = () => {
        // Generate and download receipt PDF
        alert("ฟีเจอร์ดาวน์โหลดใบเสร็จจะเปิดใช้งานเร็วๆ นี้")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {getTypeIcon(receipt.type)}
                        <span>รายละเอียดใบเสร็จ</span>
                        <Badge className={`${summary.statusColor} border-0 ml-auto`}>{summary.status}</Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Receipt Header */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">ใบเสร็จรับเงิน/การบริจาค</h2>
                            <p className="text-sm text-gray-600">Receipt / Donation Confirmation</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">เลขที่ใบเสร็จ:</span>
                                <p className="font-mono font-medium">{receipt.receiptNumber}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">วันที่ออกใบเสร็จ:</span>
                                <p className="font-medium">{formatDate(receipt.issuedAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Donation Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">รายละเอียดการบริจาค</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-gray-600">ประเภทการบริจาค:</span>
                                    <p className="font-medium">{summary.title}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">โครงการ:</span>
                                    <p className="font-medium">{receipt.requestTitle}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">ผู้บริจาค:</span>
                                    <p className="font-medium">
                                        {receipt.isAnonymous ? "ผู้บริจาคไม่ประสงค์ออกนาม" : receipt.donorName || "ไม่ระบุ"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {receipt.type === "money" && (
                                    <>
                                        <div>
                                            <span className="text-sm text-gray-600">จำนวนเงิน:</span>
                                            <p className="text-xl font-bold text-green-600">
                                                ฿{new Intl.NumberFormat("th-TH").format(receipt.amount || 0)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">วิธีการชำระ:</span>
                                            <p className="font-medium">{receipt.paymentMethod || "ไม่ระบุ"}</p>
                                        </div>
                                        {receipt.transactionId && (
                                            <div>
                                                <span className="text-sm text-gray-600">รหัสธุรกรรม:</span>
                                                <p className="font-mono text-sm">{receipt.transactionId}</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {receipt.type === "items" && (
                                    <>
                                        <div>
                                            <span className="text-sm text-gray-600">รายการสิ่งของ:</span>
                                            <div className="space-y-1">
                                                {receipt.items?.map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <span className="text-sm">
                                                            {item.name} x{item.quantity}
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {item.status === "pending" && "รอส่งมอบ"}
                                                            {item.status === "delivered" && "ส่งแล้ว"}
                                                            {item.status === "received" && "ได้รับแล้ว"}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">วิธีส่งมอบ:</span>
                                            <p className="font-medium">
                                                {receipt.deliveryMethod === "send-to-address" ? "ส่งตามที่อยู่" : "นำไปส่งถึงที่"}
                                            </p>
                                        </div>
                                        {receipt.trackingNumber && (
                                            <div>
                                                <span className="text-sm text-gray-600">เลขพัสดุ:</span>
                                                <p className="font-mono text-sm">{receipt.trackingNumber}</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {receipt.type === "volunteer" && (
                                    <>
                                        <div>
                                            <span className="text-sm text-gray-600">จำนวนชั่วโมง:</span>
                                            <p className="text-xl font-bold text-purple-600">{receipt.volunteerHours || 0} ชั่วโมง</p>
                                        </div>
                                        {receipt.volunteerSkills && receipt.volunteerSkills.length > 0 && (
                                            <div>
                                                <span className="text-sm text-gray-600">ทักษะ:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {receipt.volunteerSkills.map((skill, index) => (
                                                        <Badge key={index} variant="secondary" className="text-xs">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {receipt.pointsEarned > 0 && (
                                    <div>
                                        <span className="text-sm text-gray-600">คะแนนที่ได้รับ:</span>
                                        <p className="text-lg font-bold text-yellow-600">+{receipt.pointsEarned} คะแนน</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {receipt.message && (
                            <div>
                                <span className="text-sm text-gray-600">ข้อความ:</span>
                                <p className="italic bg-blue-50 p-3 rounded-lg mt-1">"{receipt.message}"</p>
                            </div>
                        )}

                        {receipt.attachments && receipt.attachments.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">สลิปที่แนบมา</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {receipt.attachments.map((attachment, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={attachment.url || "/placeholder.svg"}
                                                alt={`สลิป ${receipt.receiptNumber} - ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(attachment.url, "_blank")}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                                                    <Eye className="w-6 h-6 mx-auto mb-1" />
                                                    <p className="text-xs">คลิกเพื่อดูขนาดเต็ม</p>
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                {index + 1}/{receipt.attachments.length}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 text-center">คลิกที่รูปภาพเพื่อดูในขนาดเต็ม</p>
                            </div>
                        )}
                    </div>

                    {/* Timestamps */}
                    <div className="space-y-2 pt-4 border-t">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>วันที่สร้าง:</span>
                            <span>{formatDate(receipt.createdAt)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>อัปเดตล่าสุด:</span>
                            <span>{formatDate(receipt.updatedAt)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button onClick={handleDownloadReceipt} className="flex-1">
                            <Download className="w-4 h-4 mr-2" />
                            ดาวน์โหลดใบเสร็จ
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
