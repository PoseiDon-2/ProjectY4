"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertCircle, XCircle, Package, Truck, MapPin } from "lucide-react"
import type { Receipt } from "@/types/receipt"

interface StatusEvent {
    id: string
    status: string
    title: string
    description: string
    timestamp: Date
    type: "success" | "pending" | "warning" | "error"
    icon: React.ReactNode
}

interface StatusTrackingTimelineProps {
    receipt: Receipt
    onStatusUpdate?: (receiptId: string, newStatus: Receipt["status"]) => void
}

export function StatusTrackingTimeline({ receipt, onStatusUpdate }: StatusTrackingTimelineProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    // Generate status events based on receipt type and current status
    const generateStatusEvents = (receipt: Receipt): StatusEvent[] => {
        const events: StatusEvent[] = []
        const baseTimestamp = new Date(receipt.createdAt)

        if (receipt.type === "money") {
            events.push({
                id: "created",
                status: "created",
                title: "สร้างการบริจาค",
                description: `บริจาคเงินจำนวน ฿${new Intl.NumberFormat("th-TH").format(receipt.amount || 0)}`,
                timestamp: baseTimestamp,
                type: "success",
                icon: <CheckCircle className="h-4 w-4" />,
            })

            if (receipt.status === "completed" || receipt.status === "pending") {
                events.push({
                    id: "payment_confirmed",
                    status: "payment_confirmed",
                    title: "ยืนยันการชำระเงิน",
                    description: `ชำระผ่าน${receipt.paymentMethod} - ${receipt.transactionId}`,
                    timestamp: new Date(baseTimestamp.getTime() + 5 * 60 * 1000), // 5 minutes later
                    type: receipt.status === "completed" ? "success" : "pending",
                    icon: receipt.status === "completed" ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />,
                })
            }

            if (receipt.status === "completed") {
                events.push({
                    id: "funds_transferred",
                    status: "funds_transferred",
                    title: "โอนเงินให้ผู้รับ",
                    description: "เงินบริจาคถูกโอนให้องค์กรผู้รับแล้ว",
                    timestamp: new Date(baseTimestamp.getTime() + 24 * 60 * 60 * 1000), // 1 day later
                    type: "success",
                    icon: <CheckCircle className="h-4 w-4" />,
                })
            }
        } else if (receipt.type === "items") {
            events.push({
                id: "created",
                status: "created",
                title: "สร้างการบริจาค",
                description: `บริจาคสิ่งของ ${receipt.items?.length || 0} รายการ`,
                timestamp: baseTimestamp,
                type: "success",
                icon: <CheckCircle className="h-4 w-4" />,
            })

            if (receipt.deliveryMethod === "send-to-address") {
                events.push({
                    id: "preparing_shipment",
                    status: "preparing_shipment",
                    title: "เตรียมจัดส่ง",
                    description: "กำลังเตรียมสิ่งของสำหรับจัดส่ง",
                    timestamp: new Date(baseTimestamp.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
                    type: receipt.status === "completed" ? "success" : "pending",
                    icon: <Package className="h-4 w-4" />,
                })

                if (receipt.trackingNumber) {
                    events.push({
                        id: "shipped",
                        status: "shipped",
                        title: "จัดส่งแล้ว",
                        description: `หมายเลขติดตาม: ${receipt.trackingNumber}`,
                        timestamp: new Date(baseTimestamp.getTime() + 24 * 60 * 60 * 1000), // 1 day later
                        type: "success",
                        icon: <Truck className="h-4 w-4" />,
                    })
                }

                if (receipt.status === "completed") {
                    events.push({
                        id: "delivered",
                        status: "delivered",
                        title: "จัดส่งสำเร็จ",
                        description: "สิ่งของถึงผู้รับแล้ว",
                        timestamp: new Date(baseTimestamp.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days later
                        type: "success",
                        icon: <MapPin className="h-4 w-4" />,
                    })
                }
            } else {
                events.push({
                    id: "ready_for_pickup",
                    status: "ready_for_pickup",
                    title: "พร้อมรับสิ่งของ",
                    description: "สิ่งของพร้อมให้ผู้รับมารับ",
                    timestamp: new Date(baseTimestamp.getTime() + 30 * 60 * 1000), // 30 minutes later
                    type: receipt.status === "completed" ? "success" : "pending",
                    icon: <Package className="h-4 w-4" />,
                })

                if (receipt.status === "completed") {
                    events.push({
                        id: "picked_up",
                        status: "picked_up",
                        title: "รับสิ่งของแล้ว",
                        description: "ผู้รับมารับสิ่งของแล้ว",
                        timestamp: new Date(baseTimestamp.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
                        type: "success",
                        icon: <CheckCircle className="h-4 w-4" />,
                    })
                }
            }
        } else if (receipt.type === "volunteer") {
            events.push({
                id: "created",
                status: "created",
                title: "สมัครเป็นอาสาสมัคร",
                description: `สมัครเป็นอาสาสมัคร ${receipt.volunteerHours} ชั่วโมง`,
                timestamp: baseTimestamp,
                type: "success",
                icon: <CheckCircle className="h-4 w-4" />,
            })

            events.push({
                id: "application_review",
                status: "application_review",
                title: "ตรวจสอบใบสมัคร",
                description: "กำลังตรวจสอบคุณสมบัติและทักษะ",
                timestamp: new Date(baseTimestamp.getTime() + 60 * 60 * 1000), // 1 hour later
                type: receipt.status === "completed" ? "success" : "pending",
                icon: receipt.status === "completed" ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />,
            })

            if (receipt.status === "completed") {
                events.push({
                    id: "approved",
                    status: "approved",
                    title: "อนุมัติแล้ว",
                    description: "ใบสมัครได้รับการอนุมัติ รอการติดต่อกลับ",
                    timestamp: new Date(baseTimestamp.getTime() + 24 * 60 * 60 * 1000), // 1 day later
                    type: "success",
                    icon: <CheckCircle className="h-4 w-4" />,
                })
            }
        }

        // Add cancelled/refunded events if applicable
        if (receipt.status === "cancelled") {
            events.push({
                id: "cancelled",
                status: "cancelled",
                title: "ยกเลิกการบริจาค",
                description: "การบริจาคถูกยกเลิก",
                timestamp: new Date(receipt.updatedAt),
                type: "error",
                icon: <XCircle className="h-4 w-4" />,
            })
        } else if (receipt.status === "refunded") {
            events.push({
                id: "refunded",
                status: "refunded",
                title: "คืนเงิน",
                description: "เงินบริจาคถูกคืนแล้ว",
                timestamp: new Date(receipt.updatedAt),
                type: "warning",
                icon: <AlertCircle className="h-4 w-4" />,
            })
        }

        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }

    const statusEvents = generateStatusEvents(receipt)

    const handleStatusUpdate = async (newStatus: Receipt["status"]) => {
        if (!onStatusUpdate) return

        setIsUpdating(true)
        try {
            await onStatusUpdate(receipt.id, newStatus)
        } catch (error) {
            console.error("Failed to update status:", error)
        } finally {
            setIsUpdating(false)
        }
    }

    const getStatusColor = (type: StatusEvent["type"]) => {
        switch (type) {
            case "success":
                return "text-green-600 bg-green-50 border-green-200"
            case "pending":
                return "text-yellow-600 bg-yellow-50 border-yellow-200"
            case "warning":
                return "text-orange-600 bg-orange-50 border-orange-200"
            case "error":
                return "text-red-600 bg-red-50 border-red-200"
            default:
                return "text-gray-600 bg-gray-50 border-gray-200"
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>ติดตามสถานะ</span>
                    <Badge variant={receipt.status === "completed" ? "default" : "secondary"}>
                        {receipt.status === "completed" && "สำเร็จ"}
                        {receipt.status === "pending" && "รอดำเนินการ"}
                        {receipt.status === "cancelled" && "ยกเลิก"}
                        {receipt.status === "refunded" && "คืนเงิน"}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {statusEvents.map((event, index) => (
                        <div key={event.id} className="flex items-start space-x-3">
                            <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStatusColor(event.type)}`}
                            >
                                {event.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                                    <time className="text-xs text-gray-500">
                                        {event.timestamp.toLocaleDateString("th-TH", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </time>
                                </div>
                                <p className="text-sm text-gray-600">{event.description}</p>
                            </div>
                            {index < statusEvents.length - 1 && (
                                <div className="absolute left-4 mt-8 w-0.5 h-6 bg-gray-200" style={{ marginLeft: "15px" }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Status Update Actions (for organizers) */}
                {receipt.status === "pending" && onStatusUpdate && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-gray-900 mb-3">อัปเดตสถานะ</h5>
                        <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleStatusUpdate("completed")} disabled={isUpdating}>
                                {isUpdating ? "กำลังอัปเดต..." : "ทำเสร็จแล้ว"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("cancelled")} disabled={isUpdating}>
                                ยกเลิก
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
