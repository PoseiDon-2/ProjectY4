"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Check } from "lucide-react"
import { generatePromptPayPayload, validatePromptPayInput } from "@/lib/promptpay-qr"

export default function TestQRPage() {
    const [promptpay, setPromptpay] = useState("")
    const [amount, setAmount] = useState("1000")
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const generateQR = async () => {
        try {
            setLoading(true)
            setError("")
            setQrCodeUrl("")
            setSuccess(false)

            // Validate input
            const validation = validatePromptPayInput(promptpay, Number(amount))
            if (!validation.valid) {
                setError(validation.error || "ข้อมูลไม่ถูกต้อง")
                setLoading(false)
                return
            }

            console.log("🔍 Generating PromptPay QR with:", { promptpay, amount })

            // Dynamic import qrcode
            const mod: any = await import("qrcode")
            const QRCode = mod?.default ?? mod

            if (!QRCode) {
                setError("ไลบรารี QR Code ไม่พร้อม")
                setLoading(false)
                return
            }

            // Generate EMVCo/QRCS PromptPay payload
            const payload = generatePromptPayPayload({
                phoneOrId: promptpay,
                amount: Number(amount),
            })
            console.log("📝 EMVCo Payload:", payload)

            // Generate QR Code
            const qrUrl = await QRCode.toDataURL(payload, {
                width: 300,
                margin: 2,
                color: { dark: "#000000", light: "#FFFFFF" },
            })

            setQrCodeUrl(qrUrl)
            setSuccess(true)
            console.log("✅ QR Code generated successfully")
        } catch (err: any) {
            console.error("❌ Error generating QR:", err)
            setError(`เกิดข้อผิดพลาด: ${err?.message || "ไม่สามารถสร้าง QR Code ได้"}`)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            generateQR()
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="max-w-md mx-auto mt-8">
                <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                        <CardTitle>🧪 ทดสอบสร้าง QR Code</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6 p-6">
                        {/* PromptPay Input */}
                        <div className="space-y-2">
                            <Label htmlFor="promptpay" className="font-medium">
                                เลขพร้อมเพย์
                            </Label>
                            <Input
                                id="promptpay"
                                placeholder="เบอร์โทรศัพท์ หรือ เลขประชาชน (13 หลัก)"
                                value={promptpay}
                                onChange={(e) => setPromptpay(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="text-lg"
                            />
                            <p className="text-xs text-gray-500">
                                ตัวอย่าง: 0828768146 หรือ 1234567890123
                            </p>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="font-medium">
                                จำนวนเงิน (บาท)
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    ฿
                                </span>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="1000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="pl-8 text-lg"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={generateQR}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-2"
                        >
                            {loading ? "⏳ กำลังสร้าง..." : "🎯 เจน QR Code"}
                        </Button>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800">เกิดข้อผิดพลาด</p>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-800">สร้างสำเร็จ!</p>
                                    <p className="text-sm text-green-700">
                                        พร้อมเพย์: {promptpay} | จำนวนเงิน: ฿{Number(amount).toLocaleString("th-TH")}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* QR Code Display */}
                        {qrCodeUrl && (
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg text-center">
                                <p className="text-sm font-medium text-gray-700">📱 QR Code ที่สร้างขึ้น:</p>
                                <img
                                    src={qrCodeUrl}
                                    alt="Generated QR Code"
                                    className="w-48 h-48 mx-auto border-2 border-gray-300 rounded"
                                />
                                <p className="text-xs text-gray-600">
                                    สแกนด้วยแอปธนาคารเพื่อยืนยัน
                                </p>

                                {/* Download Button */}
                                <Button
                                    onClick={() => {
                                        const link = document.createElement("a")
                                        link.href = qrCodeUrl
                                        link.download = `promptpay-qr-${promptpay}-${Date.now()}.png`
                                        link.click()
                                    }}
                                    variant="outline"
                                    className="w-full"
                                >
                                    💾 ดาวน์โหลด QR
                                </Button>
                            </div>
                        )}

                        {/* Debug Info */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-medium text-blue-900 mb-2">📋 ข้อมูลปัจจุบัน:</p>
                            <code className="text-xs text-blue-800 block break-words break-all font-mono">
                                ID: {promptpay.replace(/\D/g, "")} | Amount: ฿{Number(amount).toFixed(2)}
                                <br />
                                Format: EMVCo/QRCS PromptPay
                            </code>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Section */}
                <Card className="mt-6 border-blue-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">ℹ️ วิธีใช้</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-700 space-y-2">
                        <p>1. กรอกเลขพร้อมเพย์ของคุณ (เบอร์โทร หรือ เลขบัตร)</p>
                        <p>2. กรอกจำนวนเงินที่ต้องการ</p>
                        <p>3. คลิกปุ่ม "เจน QR Code"</p>
                        <p>4. ใช้แอปธนาคารสแกน QR ที่แสดงขึ้น</p>
                        <p className="text-blue-700 font-medium pt-2">
                            💡 ถ้าเจนสำเร็จ แสดงว่าเลขพร้อมเพย์ถูกต้อง
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
