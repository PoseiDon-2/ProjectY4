"use client"

import { useState, useEffect } from "react"
import { X, QrCode, CreditCard, Smartphone, Copy, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { pointsSystem } from "@/lib/points-system"
import { receiptSystem } from "@/lib/receipt-system"
import { generatePromptPayPayload } from "@/lib/promptpay-qr"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface DonationModalProps {
    isOpen: boolean
    onClose: () => void
    donation: {
        id: number
        title: string
        paymentMethods: {
            promptpay: string
            bankAccount: {
                bank: string
                accountNumber: string
                accountName: string
            }
            truewallet: string
        }
    }
}

type PaymentMethod = "qr" | "credit" | "bank"

export default function DonationModal({ isOpen, onClose, donation }: DonationModalProps) {
    const [step, setStep] = useState<"method" | "amount" | "payment" | "success">("method")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qr")
    const [amount, setAmount] = useState("")
    const [customAmount, setCustomAmount] = useState("")
    const [message, setMessage] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [pointsEarned, setPointsEarned] = useState(0)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [qrError, setQrError] = useState<string>("")

    const { user } = useAuth()

    // Safe extraction + fallback
    const paymentMethods = donation.paymentMethods || {}
    const promptpayId = paymentMethods.promptpay?.trim() || ""
    const bankAccount = paymentMethods.bankAccount || {
        bank: "-",
        accountNumber: "-",
        accountName: "-",
    }

    const [cardNumber, setCardNumber] = useState("")
    const [expiryDate, setExpiryDate] = useState("")
    const [cvv, setCvv] = useState("")
    const [cardName, setCardName] = useState("")

    const quickAmounts = ["100", "500", "1000", "2000", "5000"]

    const formatAmount = (amt: string | number) => {
        return new Intl.NumberFormat("th-TH").format(Number(amt))
    }

    // Generate QR Code
    useEffect(() => {
        const shouldGenerate =
            step === "payment" && paymentMethod === "qr" && !!amount && Number(amount) > 0

        if (!shouldGenerate) {
            setQrCodeUrl("")
            setQrError("")
            return
        }

        let isCurrent = true

        const generateQRCode = async () => {
            try {
                setQrError("")
                setQrCodeUrl("")

                if (!promptpayId) {
                    throw new Error("ไม่มีเลขพร้อมเพย์สำหรับคำขอบริจาคนี้")
                }

                // Sanitize PromptPay (รองรับทั้งเบอร์และอีเมล)
                let target = promptpayId
                const isEmail = target.includes("@")

                if (!isEmail) {
                    target = target.replace(/\D/g, "") // ลบทุกอย่างที่ไม่ใช่ตัวเลข
                }

                if (!target || (!isEmail && target.length !== 10 && target.length !== 13)) {
                    throw new Error("รูปแบบพร้อมเพย์ไม่ถูกต้อง (ต้องเป็นเบอร์ 10 หลัก, บัตร 13 หลัก หรืออีเมล)")
                }

                // Dynamic import qrcode
                const { default: QRCode } = await import("qrcode")

                const payload = generatePromptPayPayload({
                    phoneOrId: target,
                    amount: Number(amount),
                })

                // Timeout + high quality
                const qrDataUrl = await Promise.race([
                    QRCode.toDataURL(payload, {
                        width: 320,
                        margin: 1,
                        errorCorrectionLevel: "H", // High = สแกนง่ายที่สุด
                        color: { dark: "#000000", light: "#ffffff" },
                    }),
                    new Promise<string>((_, reject) =>
                        setTimeout(() => reject(new Error("Timeout generating QR")), 10000)
                    ),
                ])

                if (isCurrent) {
                    setQrCodeUrl(qrDataUrl)
                }
            } catch (error: any) {
                console.error("QR generation error:", error)
                if (isCurrent) {
                    setQrError(
                        error.message?.includes("Timeout")
                            ? "สร้าง QR ช้าเกินไป กรุณาลองใหม่"
                            : error.message || "ไม่สามารถสร้าง QR Code ได้ กรุณาติดต่อแอดมิน"
                    )
                }
            }
        }

        generateQRCode()

        return () => {
            isCurrent = false
        }
    }, [step, paymentMethod, amount, promptpayId])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleAmountSelect = (selectedAmount: string) => {
        setAmount(selectedAmount)
        setCustomAmount("")
    }

    const handleCustomAmountChange = (value: string) => {
        setCustomAmount(value)
        setAmount(value)
    }

    const handlePayment = async () => {
        setIsProcessing(true)

        // จำลองการตรวจสอบการชำระเงิน (ใน production ควรเรียก API จริง)
        await new Promise((resolve) => setTimeout(resolve, 3000))

        if (user && amount) {
            const donationAmount = Number(amount)
            const earnedPoints = pointsSystem.calculateDonationPoints(donationAmount, "money")
            pointsSystem.addPoints(
                user.id,
                earnedPoints,
                "donation",
                `Money donation ฿${donationAmount}`,
                `donation_${Date.now()}`
            )
            setPointsEarned(earnedPoints)

            const receipt = receiptSystem.createReceipt({
                donationId: `donation_${Date.now()}`,
                requestId: donation.id.toString(),
                requestTitle: donation.title,
                donorId: user.id,
                donorName: `${user.firstName} ${user.lastName}`,
                amount: donationAmount,
                type: "money",
                paymentMethod:
                    paymentMethod === "qr"
                        ? "PromptPay"
                        : paymentMethod === "credit"
                            ? "Credit Card"
                            : "Bank Transfer",
                transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                message,
                isAnonymous,
                pointsEarned: earnedPoints,
            })

            // LocalStorage logic (backward compatibility)
            const donationRecord = {
                id: receipt.donationId,
                userId: user.id,
                amount: donationAmount,
                requestId: donation.id.toString(),
                requestTitle: donation.title,
                type: "money" as const,
                date: new Date().toISOString(),
                status: "completed" as const,
                paymentMethod:
                    paymentMethod === "qr"
                        ? "PromptPay"
                        : paymentMethod === "credit"
                            ? "Credit Card"
                            : "Bank Transfer",
                pointsEarned: earnedPoints,
            }

            const existingDonations = JSON.parse(
                localStorage.getItem(`user_donations_${user.id}`) || "[]"
            )
            existingDonations.push(donationRecord)
            localStorage.setItem(`user_donations_${user.id}`, JSON.stringify(existingDonations))

            const userData = JSON.parse(localStorage.getItem("users") || "[]")
            const userIndex = userData.findIndex((u: any) => u.id === user.id)
            if (userIndex !== -1) {
                userData[userIndex].totalDonated = (userData[userIndex].totalDonated || 0) + donationAmount
                userData[userIndex].donationCount = (userData[userIndex].donationCount || 0) + 1
                localStorage.setItem("users", JSON.stringify(userData))
            }

            toast({
                title: `ได้รับ ${earnedPoints} คะแนน!`,
                description: `คุณได้รับคะแนนจากการบริจาค ฿${formatAmount(amount)}`,
            })
        }

        setIsProcessing(false)
        setStep("success")
    }

    const resetModal = () => {
        setStep("method")
        setPaymentMethod("qr")
        setAmount("")
        setCustomAmount("")
        setMessage("")
        setIsAnonymous(false)
        setCardNumber("")
        setExpiryDate("")
        setCvv("")
        setCardName("")
        setIsProcessing(false)
        setPointsEarned(0)
        setQrCodeUrl("")
        setQrError("")
    }

    const handleClose = () => {
        resetModal()
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-2">
                        {step !== "method" && step !== "success" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (step === "amount") setStep("method")
                                    else if (step === "payment") setStep("amount")
                                }}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        )}
                        <CardTitle className="text-lg">
                            {step === "method" && "เลือกวิธีการบริจาค"}
                            {step === "amount" && "ระบุจำนวนเงิน"}
                            {step === "payment" && "ชำระเงิน"}
                            {step === "success" && "บริจาคสำเร็จ"}
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                    {step === "method" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-800 mb-2">บริจาคให้</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{donation.title}</p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">เลือกวิธีการชำระเงิน</h4>

                                <div className="space-y-2">
                                    <button
                                        className={`w-full p-4 border rounded-lg text-left transition-all ${paymentMethod === "qr"
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        onClick={() => setPaymentMethod("qr")}
                                    >
                                        <div className="flex items-center gap-3">
                                            <QrCode className="w-8 h-8 text-blue-600" />
                                            <div>
                                                <div className="font-medium">QR Code PromptPay</div>
                                                <div className="text-sm text-gray-600">สแกน QR Code เพื่อบริจาค</div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        className={`w-full p-4 border rounded-lg text-left transition-all ${paymentMethod === "credit"
                                                ? "border-purple-500 bg-purple-50"
                                                : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        onClick={() => setPaymentMethod("credit")}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-8 h-8 text-purple-600" />
                                            <div>
                                                <div className="font-medium">บัตรเครดิต/เดบิต</div>
                                                <div className="text-sm text-gray-600">ชำระผ่านบัตรเครดิตหรือเดบิต</div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        className={`w-full p-4 border rounded-lg text-left transition-all ${paymentMethod === "bank"
                                                ? "border-green-500 bg-green-50"
                                                : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        onClick={() => setPaymentMethod("bank")}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="w-8 h-8 text-green-600" />
                                            <div>
                                                <div className="font-medium">โอนเงินผ่านธนาคาร</div>
                                                <div className="text-sm text-gray-600">โอนเงินผ่านแอปธนาคาร</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                onClick={() => setStep("amount")}
                            >
                                ถัดไป
                            </Button>
                        </div>
                    )}

                    {step === "amount" && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">เลือกจำนวนเงิน</h4>

                                <div className="grid grid-cols-3 gap-2">
                                    {quickAmounts.map((quickAmount) => (
                                        <Button
                                            key={quickAmount}
                                            variant={amount === quickAmount ? "default" : "outline"}
                                            className={amount === quickAmount ? "bg-pink-500 hover:bg-pink-600" : ""}
                                            onClick={() => handleAmountSelect(quickAmount)}
                                        >
                                            ฿{formatAmount(quickAmount)}
                                        </Button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customAmount">หรือระบุจำนวนเงินเอง</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">฿</span>
                                        <Input
                                            id="customAmount"
                                            type="number"
                                            placeholder="0"
                                            className="pl-8"
                                            value={customAmount}
                                            onChange={(e) => handleCustomAmountChange(e.target.value)}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">ข้อความให้กำลังใจ (ไม่บังคับ)</Label>
                                <Textarea
                                    id="message"
                                    placeholder="เขียนข้อความให้กำลังใจ..."
                                    rows={3}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="anonymous"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="anonymous" className="text-sm">
                                    บริจาคแบบไม่ระบุชื่อ
                                </Label>
                            </div>

                            {amount && Number(amount) > 0 && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">จำนวนที่บริจาค</span>
                                        <span className="font-bold text-lg">฿{formatAmount(amount)}</span>
                                    </div>
                                </div>
                            )}

                            <Button
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                onClick={() => setStep("payment")}
                                disabled={!amount || Number(amount) <= 0}
                            >
                                ชำระเงิน ฿{amount ? formatAmount(amount) : "0"}
                            </Button>
                        </div>
                    )}

                    {step === "payment" && (
                        <div className="space-y-4">
                            {paymentMethod === "qr" && (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h4 className="font-medium text-gray-800 mb-3">หน้าชำระเงิน QR Code</h4>
                                        <div className="bg-white p-4 rounded-lg border inline-block">
                                            {qrCodeUrl ? (
                                                <img
                                                    src={qrCodeUrl}
                                                    alt="QR Code PromptPay"
                                                    className="w-48 h-48 mx-auto"
                                                />
                                            ) : (
                                                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 animate-pulse">
                                                    <QrCode className="w-12 h-12 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2 font-medium">
                                            สแกน QR Code ด้วยแอปธนาคารของคุณ
                                        </p>
                                        {qrError && <p className="text-xs text-red-600 mt-1">{qrError}</p>}
                                    </div>

                                    {/* Bank Account Information */}
                                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h5 className="font-medium text-blue-900 flex items-center gap-2">
                                            <Smartphone className="w-4 h-4" />
                                            ข้อมูลบัญชีธนาคารสำหรับรับเงินบริจาค
                                        </h5>
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between">
                                                <span className="text-sm text-gray-600 font-medium">ธนาคาร *</span>
                                                <span className="font-medium text-gray-800 text-right">{bankAccount.bank}</span>
                                            </div>
                                            <div className="flex items-start justify-between">
                                                <span className="text-sm text-gray-600 font-medium">เลขที่บัญชี *</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-medium text-gray-800">
                                                        {bankAccount.accountNumber}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => copyToClipboard(bankAccount.accountNumber)}
                                                    >
                                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-start justify-between">
                                                <span className="text-sm text-gray-600 font-medium">ชื่อบัญชี *</span>
                                                <span className="font-medium text-gray-800 text-right">
                                                    {bankAccount.accountName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-gray-600">PromptPay ID</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">
                                                    {promptpayId
                                                        ? promptpayId.includes("@")
                                                            ? promptpayId
                                                            : promptpayId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
                                                        : "-"}
                                                </span>
                                                {promptpayId && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => copyToClipboard(promptpayId)}
                                                    >
                                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-gray-600">จำนวนเงิน</span>
                                            <span className="font-bold">฿{formatAmount(amount)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <strong>วิธีการชำระเงิน:</strong>
                                        </p>
                                        <ol className="text-sm text-blue-700 mt-1 space-y-1">
                                            <li>1. เปิดแอปธนาคารของคุณ</li>
                                            <li>2. เลือกสแกน QR Code</li>
                                            <li>3. สแกน QR Code ด้านบน</li>
                                            <li>4. ยืนยันการชำระเงิน (ยอดเงินควรตรงกับ ฿{formatAmount(amount)})</li>
                                        </ol>
                                    </div>

                                    <Button
                                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                        onClick={handlePayment}
                                        disabled={isProcessing || !!qrError}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                กำลังตรวจสอบการชำระเงิน...
                                            </>
                                        ) : (
                                            "ฉันชำระเงินแล้ว"
                                        )}
                                    </Button>
                                </div>
                            )}

                            {paymentMethod === "credit" && (
                                <div className="space-y-4">
                                    {/* ส่วน credit เดิมเหมือนเดิม */}
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="cardNumber">หมายเลขบัตร</Label>
                                            <Input
                                                id="cardNumber"
                                                placeholder="1234 5678 9012 3456"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                                maxLength={19}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="expiryDate">วันหมดอายุ</Label>
                                                <Input
                                                    id="expiryDate"
                                                    placeholder="MM/YY"
                                                    value={expiryDate}
                                                    onChange={(e) => setExpiryDate(e.target.value)}
                                                    maxLength={5}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cvv">CVV</Label>
                                                <Input
                                                    id="cvv"
                                                    placeholder="123"
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value)}
                                                    maxLength={4}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cardName">ชื่อบนบัตร</Label>
                                            <Input
                                                id="cardName"
                                                placeholder="JOHN DOE"
                                                value={cardName}
                                                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">จำนวนที่ชำระ</span>
                                            <span className="font-bold text-lg">฿{formatAmount(amount)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                        onClick={handlePayment}
                                        disabled={isProcessing || !cardNumber || !expiryDate || !cvv || !cardName}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                กำลังประมวลผล...
                                            </>
                                        ) : (
                                            `ชำระเงิน ฿${formatAmount(amount)}`
                                        )}
                                    </Button>
                                </div>
                            )}

                            {paymentMethod === "bank" && (
                                <div className="space-y-4">
                                    {/* ส่วน bank เดิมเหมือนเดิม */}
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-800">ข้อมูลการโอนเงิน</h4>

                                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">ธนาคาร</span>
                                                <span className="font-medium">{bankAccount.bank}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">เลขที่บัญชี</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono">{bankAccount.accountNumber}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => copyToClipboard(bankAccount.accountNumber)}
                                                    >
                                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">ชื่อบัญชี</span>
                                                <span className="font-medium">{bankAccount.accountName}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="text-sm text-gray-600">จำนวนเงิน</span>
                                                <span className="font-bold text-lg">฿{formatAmount(amount)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <p className="text-sm text-green-800">
                                            <strong>วิธีการโอนเงิน:</strong>
                                        </p>
                                        <ol className="text-sm text-green-700 mt-1 space-y-1">
                                            <li>1. เปิดแอปธนาคารของคุณ</li>
                                            <li>2. เลือกโอนเงิน</li>
                                            <li>3. กรอกข้อมูลบัญชีปลายทาง</li>
                                            <li>4. ระบุจำนวนเงินที่ต้องการโอน ฿{formatAmount(amount)}</li>
                                            <li>5. ยืนยันการโอนเงิน</li>
                                        </ol>
                                    </div>

                                    <Button
                                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                กำลังตรวจสอบการโอนเงิน...
                                            </>
                                        ) : (
                                            "ฉันโอนเงินแล้ว"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

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
                                    <p className="text-sm text-yellow-600">
                                        คุณได้รับคะแนนจากการบริจาค สามารถนำไปแลกรางวัลได้
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">จำนวนที่บริจาค</span>
                                    <span className="font-bold">฿{formatAmount(amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">วิธีการชำระ</span>
                                    <span className="text-sm">
                                        {paymentMethod === "qr" && "QR Code PromptPay"}
                                        {paymentMethod === "credit" && "บัตรเครดิต/เดบิต"}
                                        {paymentMethod === "bank" && "โอนเงินผ่านธนาคาร"}
                                    </span>
                                </div>
                                {pointsEarned > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">คะแนนที่ได้รับ</span>
                                        <span className="text-sm font-medium text-yellow-600">+{pointsEarned} คะแนน</span>
                                    </div>
                                )}
                                {message && (
                                    <div className="pt-2 border-t">
                                        <span className="text-sm text-gray-600">ข้อความ:</span>
                                        <p className="text-sm italic">"{message}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Button
                                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
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
                                    🎉 การบริจาคของคุณจะช่วยให้โครงการนี้ประสบความสำเร็จ
                                    <br />
                                    คุณจะได้รับอีเมลยืนยันการบริจาคในอีกสักครู่
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}