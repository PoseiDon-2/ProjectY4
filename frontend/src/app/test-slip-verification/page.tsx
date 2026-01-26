"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ShieldCheck, ShieldAlert, Upload, Loader2, Zap, Brain, QrCode } from "lucide-react"
import { verifySlip, type VerifyResult, type SlipDecision } from "@/lib/slip-verification"
import { verifySlipWithThunder, convertThunderToVerifyResult } from "@/lib/thunder-solution-api"
import { generatePromptPayPayload } from "@/lib/promptpay-qr"

type VerificationMethod = "client" | "thunder"

const THUNDER_API_KEY = "d93e398f-cf03-4a1f-94d1-b7fe3e8d19a5"

export default function TestSlipVerificationPage() {
    const [slipFile, setSlipFile] = useState<File | null>(null)
    const [slipPreview, setSlipPreview] = useState<string | null>(null)
    const [requiredAmount, setRequiredAmount] = useState("")
    const [promptpayId, setPromptpayId] = useState("")
    const [bankName, setBankName] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [accountName, setAccountName] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [result, setResult] = useState<VerifyResult | null>(null)
    const [error, setError] = useState<string>("")
    const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>("client")
    const [thunderResult, setThunderResult] = useState<any>(null)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [qrError, setQrError] = useState<string>("")
    const slipInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSlipFile(file)
            setSlipPreview(URL.createObjectURL(file))
            setResult(null)
            setError("")
        }
    }

    const handlePickFile = () => {
        if (slipInputRef.current) {
            slipInputRef.current.value = ""
            slipInputRef.current.click()
        }
    }

    const handleVerify = async () => {
        if (!slipPreview || !slipFile) {
            setError("กรุณาเลือกไฟล์สลิปก่อน")
            return
        }

        try {
            setVerifying(true)
            setError("")
            setResult(null)
            setThunderResult(null)

            if (verificationMethod === "thunder") {
                // ใช้ Thunder Solution API
                console.log("🔍 กำลังตรวจสอบด้วย Thunder Solution API...")
                const thunderResponse = await verifySlipWithThunder(
                    {
                        slipFile,
                        expectedAmount: requiredAmount ? Number(requiredAmount) : null,
                        bankAccount: bankName || accountNumber || accountName
                            ? {
                                  bank: bankName || undefined,
                                  accountNumber: accountNumber || undefined,
                                  accountName: accountName || undefined,
                              }
                            : null,
                        promptpayId: promptpayId || null,
                    },
                    {
                        apiKey: THUNDER_API_KEY,
                    }
                )

                setThunderResult(thunderResponse)
                console.log("📊 Thunder Solution Response:", thunderResponse)

                // แปลงเป็น VerifyResult
                const verifyResult = convertThunderToVerifyResult(
                    thunderResponse,
                    requiredAmount ? Number(requiredAmount) : null
                )

                setResult(verifyResult)
            } else {
                // ใช้ Client-side verification
                console.log("🔍 กำลังตรวจสอบด้วย Client-side...")
                const verifyResult = await verifySlip({
                    slipImageUrl: slipPreview,
                    requiredAmount: requiredAmount ? Number(requiredAmount) : null,
                })

                setResult(verifyResult)
            }
        } catch (err: any) {
            console.error("Error verifying slip:", err)
            setError(`เกิดข้อผิดพลาด: ${err?.message || "ไม่สามารถตรวจสอบสลิปได้"}`)
        } finally {
            setVerifying(false)
        }
    }

    const getDecisionColor = (decision: SlipDecision) => {
        switch (decision) {
            case "approved":
                return "green"
            case "needs_review":
                return "yellow"
            case "rejected":
                return "red"
            default:
                return "gray"
        }
    }

    const getDecisionIcon = (decision: SlipDecision) => {
        switch (decision) {
            case "approved":
                return <ShieldCheck className="w-5 h-5 text-green-600" />
            case "needs_review":
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />
            case "rejected":
                return <ShieldAlert className="w-5 h-5 text-red-600" />
        }
    }

    const getDecisionText = (decision: SlipDecision) => {
        switch (decision) {
            case "approved":
                return "✅ ผ่านการตรวจสอบ (90%+)"
            case "needs_review":
                return "⚠️ ผ่านเบื้องต้น - ต้องให้ผู้สร้างคำขอตรวจสอบ"
            case "rejected":
                return "❌ สลิปไม่ผ่าน - ไม่สามารถอัปโหลดได้"
        }
    }

    const formatAmount = (amount: string) => {
        return new Intl.NumberFormat("th-TH").format(Number(amount))
    }

    // Generate QR Code from PromptPay when amount is set
    useEffect(() => {
        const shouldGenerate = !!promptpayId && !!requiredAmount && Number(requiredAmount) > 0
        if (!shouldGenerate) {
            setQrCodeUrl("")
            setQrError("")
            return
        }

        const generateQRCode = async () => {
            try {
                setQrError("")
                setQrCodeUrl("")

                // Sanitize PromptPay (รองรับทั้งเบอร์และอีเมล + รองรับเลขขึ้นต้นด้วยรหัสประเทศ)
                let target = promptpayId
                const isEmail = target.includes("@")

                if (!isEmail) {
                    let digits = target.replace(/\D/g, "")
                    if (digits.startsWith("66") && digits.length === 11) {
                        digits = `0${digits.slice(2)}`
                    } else if (digits.startsWith("0066") && digits.length === 13) {
                        digits = `0${digits.slice(4)}`
                    } else if (digits.length === 9) {
                        digits = `0${digits}`
                    }
                    target = digits
                }

                if (!target || (!isEmail && target.length !== 10 && target.length !== 13)) {
                    throw new Error("รูปแบบพร้อมเพย์ไม่ถูกต้อง (ต้องเป็นเบอร์ 10 หลัก, บัตร 13 หลัก หรืออีเมล)")
                }

                // Robust dynamic import (handles CJS/ESM)
                const mod: any = await import("qrcode")
                const QRCode = mod?.default ?? mod

                // Generate EMVCo PromptPay payload
                const payload = generatePromptPayPayload({
                    phoneOrId: target,
                    amount: Number(requiredAmount),
                })

                const qrUrl = await QRCode.toDataURL(payload, {
                    width: 300,
                    margin: 2,
                    color: { dark: "#000000", light: "#FFFFFF" },
                })
                setQrCodeUrl(qrUrl)
            } catch (error: any) {
                console.error("Error generating QR code:", error)
                setQrError(error.message || "ไม่สามารถสร้าง QR Code ได้")
            }
        }

        generateQRCode()
    }, [promptpayId, requiredAmount])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="max-w-2xl mx-auto mt-8 space-y-6">
                <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                        <CardTitle>🧪 ทดสอบระบบตรวจสอบสลิป</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6 p-6">
                        {/* Verification Method Selection */}
                        <div className="space-y-2">
                            <Label className="font-medium">เลือกวิธีการตรวจสอบ</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVerificationMethod("client")
                                        // Reset bank info เมื่อเปลี่ยนเป็น client-side
                                        setBankName("")
                                        setAccountNumber("")
                                        setAccountName("")
                                    }}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                                        verificationMethod === "client"
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Brain className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium">Client-side</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        ตรวจสอบในเบราว์เซอร์ (ฟรี, ใช้ OCR)
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVerificationMethod("thunder")}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                                        verificationMethod === "thunder"
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="w-5 h-5 text-purple-600" />
                                        <span className="font-medium">Thunder Solution</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        AI/ML API (99.98% accuracy)
                                    </p>
                                </button>
                            </div>
                            {verificationMethod === "thunder" && (
                                <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                                    ⚡ ใช้ Thunder Solution API - ตรวจสอบสลิปปลอม/ซ้ำได้
                                </p>
                            )}
                        </div>

                        {/* PromptPay Input */}
                        <div className="space-y-2">
                            <Label htmlFor="promptpayId" className="font-medium">
                                เลขพร้อมเพย์ (PromptPay)
                            </Label>
                            <Input
                                id="promptpayId"
                                placeholder="เช่น 0828768146 หรือ 1234567890123"
                                value={promptpayId}
                                onChange={(e) => setPromptpayId(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">
                                ระบุเลขพร้อมเพย์เพื่อสร้าง QR Code สำหรับชำระเงิน
                            </p>
                        </div>

                        {/* Required Amount Input (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="requiredAmount" className="font-medium">
                                จำนวนเงินที่ต้องการตรวจสอบ (ไม่บังคับ)
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    ฿
                                </span>
                                <Input
                                    id="requiredAmount"
                                    type="number"
                                    placeholder="1000"
                                    value={requiredAmount}
                                    onChange={(e) => setRequiredAmount(e.target.value)}
                                    className="pl-8"
                                    min="1"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                ระบุจำนวนเงินเพื่อตรวจสอบว่าสลิปตรงกับจำนวนที่ต้องการหรือไม่
                            </p>
                        </div>

                        {/* QR Code Display */}
                        {qrCodeUrl && (
                            <div className="space-y-2 p-4 bg-white rounded-lg border-2 border-blue-200">
                                <Label className="font-medium text-blue-900">QR Code สำหรับชำระเงิน</Label>
                                <div className="flex flex-col items-center gap-3">
                                    <div className="bg-white p-4 rounded-lg border inline-block">
                                        <img
                                            src={qrCodeUrl}
                                            alt="PromptPay QR Code"
                                            className="w-48 h-48 mx-auto"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 text-center">
                                        สแกน QR Code ด้วยแอปธนาคารเพื่อชำระเงิน
                                        <br />
                                        <span className="font-medium">
                                            จำนวนเงิน: ฿{formatAmount(requiredAmount)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {qrError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-xs text-red-700">⚠️ {qrError}</p>
                            </div>
                        )}

                        {/* Bank Account Info (Optional - สำหรับ Thunder Solution) */}
                        {verificationMethod === "thunder" && (
                            <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 text-purple-600" />
                                    <Label className="font-medium text-purple-900">
                                        ข้อมูลบัญชีของคุณ (ไม่บังคับ - เพิ่มความแม่นยำ)
                                    </Label>
                                </div>
                                <p className="text-xs text-purple-700 mb-3">
                                    <strong>แนะนำให้กรอก</strong> - เพื่อตรวจสอบว่าเป็น:
                                    <br />
                                    • <strong>โอนเงินเข้า</strong> = คนอื่นโอนเงินเข้าให้คุณ
                                    <br />
                                    • <strong>โอนเงินออก</strong> = คุณโอนเงินออกให้คนอื่น
                                    <br />
                                    และเพิ่มความแม่นยำในการตรวจสอบ (99.98%)
                                </p>
                                
                                <div className="space-y-2">
                                    <div>
                                        <Label htmlFor="bankName" className="text-sm">
                                            ชื่อธนาคาร
                                        </Label>
                                        <Input
                                            id="bankName"
                                            placeholder="เช่น กสิกรไทย, กรุงเทพ, SCB"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="accountNumber" className="text-sm">
                                            เลขที่บัญชี
                                        </Label>
                                        <Input
                                            id="accountNumber"
                                            placeholder="เช่น 123-456-7890"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="accountName" className="text-sm">
                                            ชื่อบัญชี
                                        </Label>
                                        <Input
                                            id="accountName"
                                            placeholder="เช่น นายทดสอบ ระบบ"
                                            value={accountName}
                                            onChange={(e) => setAccountName(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* File Upload */}
                        <div className="space-y-2">
                            <Label className="font-medium">อัปโหลดรูปภาพสลิป</Label>
                            <Input
                                ref={slipInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handlePickFile}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                เลือกไฟล์สลิป
                            </Button>
                            {slipFile && (
                                <p className="text-sm text-gray-600">
                                    ไฟล์: {slipFile.name} ({(slipFile.size / 1024).toFixed(2)} KB)
                                </p>
                            )}
                        </div>

                        {/* Preview */}
                        {slipPreview && (
                            <div className="space-y-2">
                                <Label>ตัวอย่างสลิป</Label>
                                <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                                    <img
                                        src={slipPreview}
                                        alt="Slip Preview"
                                        className="w-full max-h-96 object-contain rounded"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Verify Button */}
                        <Button
                            onClick={handleVerify}
                            disabled={verifying || !slipPreview}
                            className={`w-full text-white font-medium py-2 ${
                                verificationMethod === "thunder"
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                    : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                            }`}
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {verificationMethod === "thunder"
                                        ? "กำลังตรวจสอบด้วย Thunder Solution..."
                                        : "กำลังตรวจสอบสลิป..."}
                                </>
                            ) : (
                                verificationMethod === "thunder" ? (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        ตรวจสอบด้วย Thunder Solution
                                    </>
                                ) : (
                                    "🔍 ตรวจสอบสลิป"
                                )
                            )}
                        </Button>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800">เกิดข้อผิดพลาด</p>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Result Display */}
                        {result && (
                            <div
                                className={`p-4 rounded-lg border-2 ${
                                    result.decision === "rejected"
                                        ? "bg-red-50 border-red-300"
                                        : result.decision === "approved"
                                        ? "bg-green-50 border-green-300"
                                        : "bg-yellow-50 border-yellow-300"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    {getDecisionIcon(result.decision)}
                                    <span
                                        className={`text-sm font-bold ${
                                            result.decision === "rejected"
                                                ? "text-red-700"
                                                : result.decision === "approved"
                                                ? "text-green-700"
                                                : "text-yellow-700"
                                        }`}
                                    >
                                        {getDecisionText(result.decision)}
                                    </span>
                                </div>

                                {/* Reasons */}
                                {result.reasons && result.reasons.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs font-medium mb-2">รายละเอียด:</p>
                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                            {result.reasons.map((reason, i) => (
                                                <li
                                                    key={i}
                                                    className={
                                                        result.decision === "rejected"
                                                            ? "text-red-700"
                                                            : result.decision === "approved"
                                                            ? "text-green-700"
                                                            : "text-yellow-700"
                                                    }
                                                >
                                                    {reason}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Thunder Solution Raw Response */}
                                {verificationMethod === "thunder" && thunderResult && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <p className="text-xs font-medium mb-2">⚡ Thunder Solution Response:</p>
                                        <div className="text-xs space-y-1 font-mono bg-white/50 p-2 rounded">
                                            <div>
                                                <span className="font-semibold">Verified:</span>{" "}
                                                {thunderResult.verified === undefined 
                                                    ? "❓ ไม่ระบุ (ไม่มีข้อมูลธนาคาร/พร้อมเพย์ให้ตรวจสอบ)"
                                                    : thunderResult.verified 
                                                    ? "✅ ใช่" 
                                                    : "❌ ไม่"}
                                            </div>
                                            {thunderResult.isDuplicate !== undefined && (
                                                <div>
                                                    <span className="font-semibold">สลิปซ้ำ:</span>{" "}
                                                    {thunderResult.isDuplicate ? "⚠️ ใช่" : "✅ ไม่"}
                                                </div>
                                            )}
                                            {thunderResult.isFake !== undefined && (
                                                <div>
                                                    <span className="font-semibold">สลิปปลอม:</span>{" "}
                                                    {thunderResult.isFake ? "❌ ใช่" : "✅ ไม่"}
                                                </div>
                                            )}
                                            {thunderResult.amount && (
                                                <div>
                                                    <span className="font-semibold">จำนวนเงิน:</span>{" "}
                                                    ฿{thunderResult.amount.toLocaleString("th-TH")}
                                                </div>
                                            )}
                                            {thunderResult.date && (
                                                <div>
                                                    <span className="font-semibold">วันที่:</span> {thunderResult.date}
                                                </div>
                                            )}
                                            {thunderResult.bank && (
                                                <div>
                                                    <span className="font-semibold">ธนาคาร:</span> {thunderResult.bank}
                                                </div>
                                            )}
                                            {thunderResult.isIncoming !== undefined && (
                                                <div>
                                                    <span className="font-semibold">ทิศทางการโอน:</span>{" "}
                                                    {thunderResult.isIncoming === true ? (
                                                        <span className="text-green-600">✅ โอนเงินเข้า - คนอื่นโอนเงินเข้าให้บัญชีที่ระบุ</span>
                                                    ) : thunderResult.isIncoming === false ? (
                                                        <span className="text-orange-600">⚠️ โอนเงินออก - บัญชีที่ระบุโอนเงินออกให้คนอื่น</span>
                                                    ) : (
                                                        <span className="text-yellow-600">❓ ไม่สามารถระบุได้ - บัญชีไม่ตรง</span>
                                                    )}
                                                </div>
                                            )}
                                            {thunderResult.senderBank && (
                                                <div>
                                                    <span className="font-semibold">ธนาคารผู้ส่ง:</span> {thunderResult.senderBank}
                                                    {thunderResult.senderAccount && ` (${thunderResult.senderAccount})`}
                                                </div>
                                            )}
                                            {thunderResult.receiverBank && (
                                                <div>
                                                    <span className="font-semibold">ธนาคารผู้รับ:</span> {thunderResult.receiverBank}
                                                    {thunderResult.receiverAccount && ` (${thunderResult.receiverAccount})`}
                                                </div>
                                            )}
                                            {thunderResult.message && (
                                                <div>
                                                    <span className="font-semibold">ข้อความ:</span> {thunderResult.message}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Raw Response JSON for Debug */}
                                        {thunderResult.rawResponse && (
                                            <details className="mt-2">
                                                <summary className="text-xs font-medium cursor-pointer text-gray-600 hover:text-gray-800">
                                                    📋 ดู Raw Response (Debug)
                                                </summary>
                                                <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded mt-1 overflow-auto max-h-40">
                                                    {JSON.stringify(thunderResult.rawResponse, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                        
                                        {/* Explanation */}
                                        {thunderResult.verified === false && !thunderResult.isFake && !thunderResult.isDuplicate && (
                                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                                💡 <strong>หมายเหตุ:</strong> Thunder Solution ไม่สามารถยืนยันได้ 100% 
                                                อาจเป็นเพราะไม่มีข้อมูลธนาคาร/พร้อมเพย์ให้ตรวจสอบ 
                                                แต่สลิปดูเหมือนจริง (ไม่ใช่สลิปปลอม/ซ้ำ) 
                                                ควรให้ผู้สร้างคำขอตรวจสอบอีกครั้ง
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Debug Info */}
                                {result._debug && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <p className="text-xs font-medium mb-2">📊 ข้อมูลการตรวจสอบ:</p>
                                        <div className="text-xs space-y-1 font-mono bg-white/50 p-2 rounded">
                                            <div>
                                                <span className="font-semibold">คะแนน:</span>{" "}
                                                {result._debug.score}/100
                                            </div>
                                            <div>
                                                <span className="font-semibold">พบ QR Code:</span>{" "}
                                                {result.hasQR ? "✅ ใช่" : "❌ ไม่พบ"}
                                            </div>
                                            {verificationMethod === "client" && (
                                                <div>
                                                    <span className="font-semibold">คำสำคัญที่พบ:</span>{" "}
                                                    {result._debug.foundTokens.length > 0
                                                        ? result._debug.foundTokens.join(", ")
                                                        : "ไม่พบ"}
                                                </div>
                                            )}
                                            {result._debug.ocrAmount !== null && (
                                                <div>
                                                    <span className="font-semibold">จำนวนเงินจาก {verificationMethod === "thunder" ? "API" : "OCR"}:</span>{" "}
                                                    ฿{result._debug.ocrAmount.toLocaleString("th-TH")}
                                                </div>
                                            )}
                                            {result._debug.ocrDate && (
                                                <div>
                                                    <span className="font-semibold">วันที่จาก {verificationMethod === "thunder" ? "API" : "OCR"}:</span>{" "}
                                                    {result._debug.ocrDate}
                                                </div>
                                            )}
                                            {verificationMethod === "client" && (
                                                <div>
                                                    <span className="font-semibold">มีหลักฐานว่าเป็นสลิป:</span>{" "}
                                                    {result._debug.hasSlipEvidence ? "✅ ใช่" : "❌ ไม่มี"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* OCR Preview */}
                                {result.ocrPreview && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <p className="text-xs font-medium mb-2">📝 ข้อความที่อ่านได้ (OCR):</p>
                                        <div className="text-xs bg-white/50 p-2 rounded font-mono max-h-32 overflow-y-auto">
                                            {result.ocrPreview || "ไม่พบข้อความ"}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info Section */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-medium text-blue-900 mb-2">📋 มาตรฐานการตรวจสอบ:</p>
                            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
                                <li>
                                    <span className="font-semibold text-green-600">สีเขียว:</span> ผ่าน 90%+ (มี QR,
                                    จำนวนเงินตรง, วันที่ตรง)
                                </li>
                                <li>
                                    <span className="font-semibold text-yellow-600">สีเหลือง:</span> สลิปจริงแต่คลาดเคลื่อนเล็กน้อย
                                    (ให้ผู้สร้างคำขอตรวจสอบ)
                                </li>
                                <li>
                                    <span className="font-semibold text-red-600">สีแดง:</span> สลิปปลอมหรือรูปที่ไม่ใช่สลิป
                                    (ไม่สามารถอัปโหลดได้)
                                </li>
                            </ul>
                        </div>

                        {/* Thunder Solution Explanation */}
                        {verificationMethod === "thunder" && (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    ⚡ Thunder Solution ทำงานอย่างไร?
                                </p>
                                <div className="text-xs text-purple-800 space-y-2">
                                    <div>
                                        <p className="font-semibold mb-1">1. ตรวจสอบจาก QR Code ในสลิป:</p>
                                        <ul className="list-disc pl-5 space-y-1 ml-2">
                                            <li>อ่าน QR Code payload จากสลิป</li>
                                            <li>ส่ง payload ไปที่ Thunder API เพื่อตรวจสอบ</li>
                                            <li>API จะตรวจสอบว่ามีการโอนเงินจริงหรือไม่</li>
                                            <li>อ่านข้อมูล: จำนวนเงิน, วันที่, ธนาคาร, บัญชีผู้ส่ง/รับ</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">2. ตรวจสอบโอนเงินเข้าหรือออก (ตรวจได้ทั้งสองแบบ):</p>
                                        <ul className="list-disc pl-5 space-y-1 ml-2">
                                            <li><strong>ต้องกรอกข้อมูลบัญชีของคุณ</strong> เพื่อเปรียบเทียบ</li>
                                            <li><strong>โอนเงินเข้า:</strong> ถ้าบัญชีผู้รับ (receiver) ในสลิปตรงกับบัญชีที่ระบุ = คนอื่นโอนเงินเข้าให้คุณ ✅</li>
                                            <li><strong>โอนเงินออก:</strong> ถ้าบัญชีผู้ส่ง (sender) ในสลิปตรงกับบัญชีที่ระบุ = คุณโอนเงินออกให้คนอื่น ⚠️</li>
                                            <li>Thunder Solution ตรวจสอบได้ทั้งสองแบบอัตโนมัติ</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">3. ถ้ามีข้อมูลธนาคาร/พร้อมเพย์ (เพิ่มความแม่นยำ):</p>
                                        <ul className="list-disc pl-5 space-y-1 ml-2">
                                            <li>เปรียบเทียบว่าสลิปตรงกับบัญชีที่ระบุหรือไม่</li>
                                            <li>ตรวจสอบว่าจำนวนเงินตรงกับที่คาดหวังหรือไม่</li>
                                            <li>ตรวจสอบว่าเป็นโอนเงินเข้าหรือออก</li>
                                            <li>เพิ่มความแม่นยำในการยืนยัน (99.98%)</li>
                                        </ul>
                                    </div>
                                    <div className="mt-2 p-2 bg-purple-100 rounded">
                                        <p className="font-semibold">💡 สรุป:</p>
                                        <p>
                                            <strong>ต้องมี QR Code ในสลิป</strong> - Thunder Solution อ่านข้อมูลจาก QR Code
                                        </p>
                                        <p className="mt-1">
                                            <strong>กรอกข้อมูลบัญชีของคุณ</strong> เพื่อตรวจสอบว่าเป็น:
                                            <br />
                                            • <strong>โอนเงินเข้า</strong> = คนอื่นโอนเงินเข้าให้คุณ
                                            <br />
                                            • <strong>โอนเงินออก</strong> = คุณโอนเงินออกให้คนอื่น
                                        </p>
                                        <p className="mt-1">
                                            <strong>ตรวจสอบได้ทั้งสองแบบ</strong> - Thunder Solution จะเปรียบเทียบอัตโนมัติ
                                        </p>
                                        <p className="mt-1">
                                            <strong>ไม่ต้องกรอกข้อมูลในเว็บของ Thunder</strong> - ส่งข้อมูลผ่าน API ได้เลย
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">ℹ️ วิธีใช้</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-700 space-y-2">
                        <p>1. เลือกวิธีการตรวจสอบ (Client-side หรือ Thunder Solution)</p>
                        <p>2. (ไม่บังคับ) กรอกเลขพร้อมเพย์ - จะสร้าง QR Code อัตโนมัติ</p>
                        <p>3. (ไม่บังคับ) กรอกจำนวนเงินที่ต้องการตรวจสอบ</p>
                        <p>4. (ไม่บังคับ) กรอกข้อมูลธนาคาร/พร้อมเพย์ - เพิ่มความแม่นยำสำหรับ Thunder Solution</p>
                        <p>5. คลิกปุ่ม "เลือกไฟล์สลิป" และเลือกรูปภาพสลิปการโอนเงิน</p>
                        <p>6. ตรวจสอบตัวอย่างสลิปที่แสดง</p>
                        <p>7. คลิกปุ่ม "ตรวจสอบสลิป"</p>
                        <p>8. ดูผลการตรวจสอบและรายละเอียด</p>
                        <div className="pt-2 space-y-1">
                            <p className="text-blue-700 font-medium">
                                💡 Client-side: ตรวจสอบ QR Code, OCR, จำนวนเงิน, วันที่ และร่องรอยการแก้ไข
                            </p>
                            <p className="text-purple-700 font-medium">
                                ⚡ Thunder Solution: ใช้ AI/ML ตรวจสอบสลิปปลอม/ซ้ำ 
                                <br />
                                <span className="text-xs">
                                    - ตรวจสอบได้ทั้งโอนเงินเข้าและโอนเงินออก
                                    <br />
                                    - ต้องมี QR Code ในสลิป (อ่านข้อมูลจาก QR Code)
                                    <br />
                                    - ถ้ากรอกข้อมูลบัญชีจะตรวจสอบทิศทางการโอนได้ (99.98%)
                                    <br />
                                    - ไม่ต้องกรอกข้อมูลในเว็บของ Thunder - ส่งผ่าน API ได้เลย
                                </span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
