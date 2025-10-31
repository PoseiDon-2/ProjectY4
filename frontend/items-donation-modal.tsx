"use client"

import { useState } from "react"
import { X, MapPin, Check, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { pointsSystem } from "@/lib/points-system"
import { receiptSystem } from "@/lib/receipt-system"
import { useAuth } from "@/app/auth-context"
import { toast } from "@/hooks/use-toast"

interface ItemsDonationModalProps {
    isOpen: boolean
    onClose: () => void
    donation: {
        id: number
        title: string
        itemsNeeded: string
        contactPhone: string
        location: string
    }
}

type DeliveryMethod = "send-to-address" | "drop-off"

export default function ItemsDonationModal({ isOpen, onClose, donation }: ItemsDonationModalProps) {
    const [step, setStep] = useState<"delivery" | "success">("delivery")
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("send-to-address")
    const [deliveryDate, setDeliveryDate] = useState("")
    const [deliveryTime, setDeliveryTime] = useState("")
    const [donorName, setDonorName] = useState("")
    const [donorPhone, setDonorPhone] = useState("")
    const [donorEmail, setDonorEmail] = useState("")
    const [message, setMessage] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [trackingNumber, setTrackingNumber] = useState("")
    const [pointsEarned, setPointsEarned] = useState(0)

    const { user } = useAuth()

    const handleSubmit = async () => {
        setIsSubmitting(true)

        await new Promise((resolve) => setTimeout(resolve, 2000))

        if (user) {
            const earnedPoints = pointsSystem.calculateDonationPoints(0, "item")
            pointsSystem.addPoints(user.id, earnedPoints, "donation", `Item donation: ${donation.itemsNeeded}`, `donation_${Date.now()}`)
            setPointsEarned(earnedPoints)

            const receipt = receiptSystem.createReceipt({
                donationId: `donation_${Date.now()}`,
                requestId: donation.id.toString(),
                requestTitle: donation.title,
                donorId: user.id,
                donorName: isAnonymous ? undefined : `${user.firstName} ${user.lastName}`,
                type: "items",
                items: [{ name: donation.itemsNeeded, quantity: 1 }],
                deliveryMethod,
                trackingNumber: trackingNumber || undefined,
                message,
                isAnonymous,
                pointsEarned: earnedPoints,
            })

            // Keep existing localStorage logic for backward compatibility
            const donationRecord = {
                id: receipt.donationId,
                userId: user.id,
                requestId: donation.id.toString(),
                requestTitle: donation.title,
                type: "items" as const,
                date: new Date().toISOString(),
                status: "pending" as const,
                deliveryMethod,
                deliveryDate,
                deliveryTime,
                trackingNumber: trackingNumber || undefined,
                items: [{ name: donation.itemsNeeded, quantity: 1, status: "pending" }],
                pointsEarned: earnedPoints,
            }

            const existingDonations = JSON.parse(localStorage.getItem(`user_donations_${user.id}`) || "[]")
            existingDonations.push(donationRecord)
            localStorage.setItem(`user_donations_${user.id}`, JSON.stringify(existingDonations))

            const userData = JSON.parse(localStorage.getItem("users") || "[]")
            const userIndex = userData.findIndex((u: any) => u.id === user.id)
            if (userIndex !== -1) {
                userData[userIndex].donationCount = (userData[userIndex].donationCount || 0) + 1
                localStorage.setItem("users", JSON.stringify(userData))
            }

            toast({
                title: `ได้รับ ${earnedPoints} คะแนน!`,
                description: "คุณได้รับคะแนนจากการบริจาคสิ่งของ",
            })
        }

        setIsSubmitting(false)
        setStep("success")
    }

    const resetModal = () => {
        setStep("delivery")
        setDeliveryMethod("send-to-address")
        setDeliveryDate("")
        setDeliveryTime("")
        setDonorName("")
        setDonorPhone("")
        setDonorEmail("")
        setMessage("")
        setIsAnonymous(false)
        setIsSubmitting(false)
        setTrackingNumber("")
        setPointsEarned(0)
    }

    const handleClose = () => {
        resetModal()
        onClose()
    }

    const getDeliveryMethodText = (method: DeliveryMethod) => {
        const methods = {
            "send-to-address": "ส่งตามที่อยู่",
            "drop-off": "นำไปส่งถึงที่",
        }
        return methods[method]
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                            {step === "delivery" && "ยืนยันการบริจาคสิ่งของ"}
                            {step === "success" && "บริจาคสำเร็จ"}
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-gray-800 mb-2">บริจาคสิ่งของให้</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{donation.title}</p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">สิ่งของที่ต้องการ</h4>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">{donation.itemsNeeded}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    💡 คุณสามารถนำสิ่งของที่ต้องการมาบริจาคได้เลย ไม่จำเป็นต้องระบุรายละเอียดในเว็บ
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">วิธีการส่งมอบ</h4>

                            <div className="space-y-2">
                                <button
                                    className={`w-full p-4 border rounded-lg text-left transition-all ${deliveryMethod === "send-to-address"
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    onClick={() => setDeliveryMethod("send-to-address")}
                                >
                                    <div className="flex items-center gap-3">
                                        <Truck className="w-6 h-6 text-blue-600" />
                                        <div>
                                            <div className="font-medium">ส่งตามที่อยู่</div>
                                            <div className="text-sm text-gray-600">คุณส่งสิ่งของผ่านบริษัทขนส่งไปยังที่อยู่ผู้รับ</div>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    className={`w-full p-4 border rounded-lg text-left transition-all ${deliveryMethod === "drop-off"
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    onClick={() => setDeliveryMethod("drop-off")}
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-6 h-6 text-green-600" />
                                        <div>
                                            <div className="font-medium">นำไปส่งถึงที่</div>
                                            <div className="text-sm text-gray-600">คุณนำสิ่งของไปส่งมอบด้วยตัวเองที่จุดรับบริจาค</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">กำหนดการส่งมอบ</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="deliveryDate">วันที่ *</Label>
                                    <Input
                                        id="deliveryDate"
                                        type="date"
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        min={new Date().toISOString().split("T")[0]}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deliveryTime">เวลา *</Label>
                                    <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกเวลา" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="morning">เช้า (09:00-12:00)</SelectItem>
                                            <SelectItem value="afternoon">บ่าย (13:00-17:00)</SelectItem>
                                            <SelectItem value="evening">เย็น (17:00-20:00)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <h5 className="font-medium text-green-800 mb-2">ที่อยู่สำหรับส่งของ</h5>
                                    <div className="text-sm text-green-700">
                                        <p className="font-medium">{donation.location}</p>
                                        <p>โทร: {donation.contactPhone}</p>
                                    </div>
                                </div>

                                {deliveryMethod === "send-to-address" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="trackingNumber">เลขพัสดุ/รหัสอ้างอิง (หลังจากส่งแล้ว)</Label>
                                        <Input
                                            id="trackingNumber"
                                            placeholder="เช่น TH1234567890 หรือรหัสอ้างอิงจากบริษัทขนส่ง"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">กรุณาระบุเลขพัสดุหลังจากส่งของแล้ว เพื่อให้ผู้รับสามารถติดตามได้</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">ข้อความเพิ่มเติม</Label>
                            <Textarea
                                id="message"
                                placeholder="ข้อความให้กำลังใจหรือรายละเอียดเพิ่มเติม..."
                                rows={3}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">ข้อมูลผู้บริจาค</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(checked) => setIsAnonymous(checked === true)} />
                                    <Label htmlFor="anonymous" className="text-sm">
                                        บริจาคแบบไม่ระบุชื่อ
                                    </Label>
                                </div>

                                {!isAnonymous && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="donorName">ชื่อ-นามสกุล *</Label>
                                            <Input
                                                id="donorName"
                                                placeholder="ระบุชื่อ-นามสกุล"
                                                value={donorName}
                                                onChange={(e) => setDonorName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="donorPhone">เบอร์โทร *</Label>
                                                <Input
                                                    id="donorPhone"
                                                    type="tel"
                                                    placeholder="081-234-5678"
                                                    value={donorPhone}
                                                    onChange={(e) => setDonorPhone(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="donorEmail">อีเมล</Label>
                                                <Input
                                                    id="donorEmail"
                                                    type="email"
                                                    placeholder="example@email.com"
                                                    value={donorEmail}
                                                    onChange={(e) => setDonorEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-800 mb-2">สรุปการบริจาค</h5>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">วิธีส่งมอบ:</span>
                                    <span>{getDeliveryMethodText(deliveryMethod)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">วันที่:</span>
                                    <span>{deliveryDate || "ไม่ระบุ"}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !deliveryDate || !deliveryTime || (!isAnonymous && (!donorName || !donorPhone))}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    กำลังส่งข้อมูล...
                                </>
                            ) : (
                                "ยืนยันการบริจาค"
                            )}
                        </Button>
                    </div>

                    {step === "success" && (
                        <div className="space-y-4 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">บริจาคสำเร็จ!</h3>
                                <p className="text-gray-600">ขอบคุณสำหรับความใจดีของคุณ</p>
                            </div>

                            {pointsEarned > 0 && (
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className="text-2xl">🪙</span>
                                        <span className="text-xl font-bold text-yellow-700">+{pointsEarned} คะแนน!</span>
                                    </div>
                                    <p className="text-sm text-yellow-600">คุณได้รับคะแนนจากการบริจาคสิ่งของ สามารถนำไปแลกรางวัลได้</p>
                                </div>
                            )}

                            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-left">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">วิธีส่งมอบ:</span>
                                    <span className="text-sm">{getDeliveryMethodText(deliveryMethod)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">วันที่นัดหมาย:</span>
                                    <span className="text-sm">{deliveryDate}</span>
                                </div>
                                {pointsEarned > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">คะแนนที่ได้รับ:</span>
                                        <span className="text-sm font-medium text-yellow-600">+{pointsEarned} คะแนน</span>
                                    </div>
                                )}
                                {!isAnonymous && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">ผู้บริจาค:</span>
                                        <span className="text-sm">{donorName}</span>
                                    </div>
                                )}
                                {deliveryMethod === "send-to-address" && trackingNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">เลขพัสดุ:</span>
                                        <span className="text-sm font-mono">{trackingNumber}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Button
                                    className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                                    onClick={handleClose}
                                >
                                    เสร็จสิ้น
                                </Button>
                                {pointsEarned > 0 && (
                                    <Button
                                        variant="outline"
                                        className="w-full bg-transparent"
                                        onClick={() => {
                                            handleClose()
                                            window.location.href = "/rewards"
                                        }}
                                    >
                                        🎁 ไปดูรางวัลที่แลกได้
                                    </Button>
                                )}
                                <Button variant="outline" className="w-full bg-transparent">
                                    แชร์การบริจาค
                                </Button>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    📞 ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
                                    <br />📧 คุณจะได้รับอีเมลยืนยันการบริจาคในอีกสักครู่
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
