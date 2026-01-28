"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ShieldCheck, ShieldAlert, Upload, Loader2, Zap, Brain, QrCode, CheckCircle2, Clock, XCircle } from "lucide-react"
import { verifySlip, type VerifyResult, type SlipDecision } from "@/lib/slip-verification"
import { verifySlipAdvanced, type AdvancedVerifyResult } from "@/lib/advanced-slip-verification"
import { verifyThaiBankSlip } from "@/lib/thai-bank-slip-verification"
import { generatePromptPayPayload } from "@/lib/promptpay-qr"
import { createPaymentQR, checkPaymentStatus, simulateWebhook, type PaymentResponse, type PaymentStatus } from "@/lib/payment-gateway"

type VerificationMethod = "client" | "thai-bank" | "realtime"

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
    const [advancedResult, setAdvancedResult] = useState<AdvancedVerifyResult | null>(null)
    const [error, setError] = useState<string>("")
    const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>("client")
    const [thunderResult, setThunderResult] = useState<any>(null)
    const [useAdvancedVerification, setUseAdvancedVerification] = useState(false)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [qrError, setQrError] = useState<string>("")
    const [paymentReferenceNo, setPaymentReferenceNo] = useState<string>("")
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
    const [isPolling, setIsPolling] = useState(false)
    const [paymentGateway, setPaymentGateway] = useState<"gbprimepay" | "omise" | "2c2p">("gbprimepay")
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
            setAdvancedResult(null)
            setThunderResult(null)

            if (verificationMethod === "thai-bank") {
                // ใช้ Thai Bank Slip Verification (รองรับทุกธนาคาร)
                console.log("🔍 กำลังตรวจสอบด้วย Thai Bank Slip Verification...")
                const thaiBankResult = await verifyThaiBankSlip({
                    slipFile,
                    expectedAmount: requiredAmount ? Number(requiredAmount) : undefined,
                    expectedAccountName: accountName || undefined,
                    expectedBankName: bankName || undefined,
                    expectedPromptpayId: promptpayId || undefined
                })

                setThunderResult(thaiBankResult)
                console.log("📊 Thai Bank Verification Response:", thaiBankResult)

                // แปลงเป็น VerifyResult
                if (thaiBankResult.basicVerification) {
                    setResult(thaiBankResult.basicVerification)
                } else {
                    setResult({
                        decision: thaiBankResult.verified ? "approved" : "rejected",
                        reasons: thaiBankResult.error ? [thaiBankResult.error] : []
                    })
                }

                if (thaiBankResult.advancedVerification) {
                    setAdvancedResult(thaiBankResult.advancedVerification)
                }
            } else {
                // ใช้ Client-side verification
                if (useAdvancedVerification) {
                    // ใช้ Advanced Verification
                    console.log("🔍 กำลังตรวจสอบด้วย Advanced Verification...")
                    const advancedVerifyResult = await verifySlipAdvanced({
                        slipImageUrl: slipPreview,
                        requiredAmount: requiredAmount ? Number(requiredAmount) : null,
                        expectedAccountName: accountName || null,
                        expectedBankName: bankName || null,
                        maxSlipAgeDays: 7,
                        checkDuplicateRefNo: false, // TODO: เพิ่มการเก็บ Ref No. ที่เคยใช้
                        previousRefNos: []
                    })
                    
                    setAdvancedResult(advancedVerifyResult)
                    
                    // แปลงเป็น VerifyResult สำหรับแสดงผล
                    const verifyResult: VerifyResult = {
                        decision: advancedVerifyResult.decision,
                        reasons: advancedVerifyResult.reasons,
                        hasQR: advancedVerifyResult.checks.qrCode.found,
                        ocrPreview: advancedVerifyResult.ocrPreview,
                        _debug: {
                            score: advancedVerifyResult.score,
                            foundTokens: [],
                            ocrAmount: advancedVerifyResult.extractedData.amount || null,
                            ocrDate: advancedVerifyResult.extractedData.date?.toLocaleDateString("th-TH") || null,
                            hasSlipEvidence: advancedVerifyResult.checks.qrCode.found || advancedVerifyResult.checks.bankLogo.detected
                        }
                    }
                    
                    setResult(verifyResult)
                } else {
                    // ใช้ Basic Verification
                    console.log("🔍 กำลังตรวจสอบด้วย Client-side (Basic)...")
                    const verifyResult = await verifySlip({
                        slipImageUrl: slipPreview,
                        requiredAmount: requiredAmount ? Number(requiredAmount) : null,
                    })

                    setResult(verifyResult)
                }
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

    // Generate QR Code - ขึ้นอยู่กับ verification method
    useEffect(() => {
        if (verificationMethod === "realtime") {
            // Real-time Payment: ใช้ Payment Gateway
            const shouldGenerate = !!promptpayId && !!requiredAmount && Number(requiredAmount) > 0
            if (!shouldGenerate) {
                setQrCodeUrl("")
                setQrError("")
                setPaymentReferenceNo("")
                return
            }

            const generatePaymentQR = async () => {
                try {
                    setQrError("")
                    setQrCodeUrl("")
                    setPaymentReferenceNo("")
                    setPaymentStatus(null)

                    const paymentResponse = await createPaymentQR(
                        {
                            donationRequestId: "TEST_001",
                            amount: Number(requiredAmount),
                            paymentMethod: "promptpay",
                            customerInfo: {
                                name: "ผู้ทดสอบ",
                                email: "test@example.com",
                            },
                            metadata: {
                                promptpayId,
                            },
                        },
                        {
                            gateway: paymentGateway,
                            apiKey: "test_api_key", // สำหรับทดสอบ
                        }
                    )

                    if (paymentResponse.success && paymentResponse.qrCodeUrl) {
                        setQrCodeUrl(paymentResponse.qrCodeUrl)
                        if (paymentResponse.referenceNo) {
                            setPaymentReferenceNo(paymentResponse.referenceNo)
                            // เริ่ม polling เพื่อตรวจสอบสถานะ
                            startPollingStatus(paymentResponse.referenceNo)
                        }
                    } else {
                        setQrError(paymentResponse.error || "ไม่สามารถสร้าง QR Code ได้")
                    }
                } catch (error: any) {
                    console.error("Error generating payment QR:", error)
                    setQrError(error.message || "ไม่สามารถสร้าง QR Code ได้")
                }
            }

            generatePaymentQR()
        } else {
            // Client-side หรือ Thunder: สร้าง QR Code เอง
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

                    // Sanitize PromptPay
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

                    const mod: any = await import("qrcode")
                    const QRCode = mod?.default ?? mod

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
        }
    }, [promptpayId, requiredAmount, verificationMethod, paymentGateway])

    // Polling เพื่อตรวจสอบสถานะการชำระเงิน (Real-time)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    
    const startPollingStatus = async (referenceNo: string) => {
        // หยุด polling เดิมถ้ามี
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
        }
        
        setIsPolling(true)
        
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const status = await checkPaymentStatus(referenceNo, {
                    gateway: paymentGateway,
                    apiKey: "test",
                })

                setPaymentStatus(status)

                if (status.status === "completed" || status.status === "failed") {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current)
                        pollingIntervalRef.current = null
                    }
                    setIsPolling(false)
                    
                    if (status.status === "completed") {
                        // แสดง notification
                        console.log("✅ Payment completed!", status)
                    }
                }
            } catch (error) {
                console.error("Polling error:", error)
            }
        }, 3000) // ตรวจสอบทุก 3 วินาที

        // หยุด polling หลังจาก 5 นาที
        setTimeout(() => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
            }
            setIsPolling(false)
        }, 5 * 60 * 1000)
    }

    // Cleanup polling เมื่อ component unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
            }
        }
    }, [])

    // จำลองการชำระเงินสำเร็จ (สำหรับทดสอบ)
    const handleSimulatePayment = () => {
        if (paymentReferenceNo) {
            simulateWebhook(paymentReferenceNo, "completed", Number(requiredAmount))
            setPaymentStatus({
                referenceNo: paymentReferenceNo,
                status: "completed",
                amount: Number(requiredAmount),
                paidAt: new Date().toISOString(),
                transactionId: `TXN_${Date.now()}`,
            })
        }
    }

    // Listen to payment-updated event
    useEffect(() => {
        const handlePaymentUpdate = (event: CustomEvent<PaymentStatus>) => {
            const status = event.detail
            if (status.referenceNo === paymentReferenceNo) {
                setPaymentStatus(status)
                setIsPolling(false)
            }
        }

        window.addEventListener("payment-updated", handlePaymentUpdate as EventListener)
        return () => {
            window.removeEventListener("payment-updated", handlePaymentUpdate as EventListener)
        }
    }, [paymentReferenceNo])

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
                            <Label className="font-medium">เลือกวิธีการชำระเงิน</Label>
                            
                            {/* Advanced Verification Toggle (สำหรับ Client-side) */}
                            {verificationMethod === "client" && (
                                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                                    <input
                                        type="checkbox"
                                        id="useAdvanced"
                                        checked={useAdvancedVerification}
                                        onChange={(e) => setUseAdvancedVerification(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="useAdvanced" className="text-sm cursor-pointer">
                                        ใช้ Advanced Verification (ตรวจสอบละเอียด: QR, โลโก้, ฟอนต์, layout, ชื่อบัญชีตรง 100%, ยอดเงินตรงเป๊ะ)
                                    </Label>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVerificationMethod("client")
                                        setBankName("")
                                        setAccountNumber("")
                                        setAccountName("")
                                        setPaymentStatus(null)
                                        setPaymentReferenceNo("")
                                    }}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                                        verificationMethod === "client"
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Brain className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium">Slip-based</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        อัปโหลดสลิป (ฟรี)
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVerificationMethod("thai-bank")
                                        setPaymentStatus(null)
                                        setPaymentReferenceNo("")
                                    }}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                                        verificationMethod === "thai-bank"
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="w-5 h-5 text-purple-600" />
                                        <span className="font-medium">Thai Bank (ทุกธนาคาร)</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        ตรวจสอบสลิป (AI)
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVerificationMethod("realtime")
                                        setPaymentStatus(null)
                                        setPaymentReferenceNo("")
                                    }}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                                        verificationMethod === "realtime"
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <span className="font-medium">Real-time</span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        จ่ายปุ้บรู้เลย ⚡
                                    </p>
                                </button>
                            </div>
                            {verificationMethod === "thunder" && (
                                <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                                    🇹🇭 ใช้ Thai Bank Slip Verification - รองรับทุกธนาคารไทย
                                </p>
                            )}
                            {verificationMethod === "realtime" && (
                                <div className="space-y-2">
                                    <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                        ⚡ Real-time Payment - ไม่ต้องอัปโหลดสลิป รู้ผลทันที!
                                    </p>
                                    <div className="space-y-2">
                                        <Label className="text-xs">เลือก Payment Gateway:</Label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentGateway("gbprimepay")}
                                                className={`px-3 py-1 text-xs rounded ${
                                                    paymentGateway === "gbprimepay"
                                                        ? "bg-green-600 text-white"
                                                        : "bg-gray-200 text-gray-700"
                                                }`}
                                            >
                                                GBPrimepay
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentGateway("omise")}
                                                className={`px-3 py-1 text-xs rounded ${
                                                    paymentGateway === "omise"
                                                        ? "bg-green-600 text-white"
                                                        : "bg-gray-200 text-gray-700"
                                                }`}
                                            >
                                                Omise
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentGateway("2c2p")}
                                                className={`px-3 py-1 text-xs rounded ${
                                                    paymentGateway === "2c2p"
                                                        ? "bg-green-600 text-white"
                                                        : "bg-gray-200 text-gray-700"
                                                }`}
                                            >
                                                2C2P
                                            </button>
                                        </div>
                                    </div>
                                </div>
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
                            <div className="space-y-3 p-4 bg-white rounded-lg border-2 border-blue-200">
                                <div className="flex items-center justify-between">
                                    <Label className="font-medium text-blue-900">
                                        {verificationMethod === "realtime" ? "⚡ Real-time Payment QR Code" : "QR Code สำหรับชำระเงิน"}
                                    </Label>
                                    {verificationMethod === "realtime" && paymentReferenceNo && (
                                        <span className="text-xs text-gray-500 font-mono">
                                            Ref: {paymentReferenceNo}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                    <div className="bg-white p-4 rounded-lg border inline-block">
                                        <img
                                            src={qrCodeUrl}
                                            alt="Payment QR Code"
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

                                    {/* Payment Status (Real-time) */}
                                    {verificationMethod === "realtime" && (
                                        <div className="w-full space-y-2">
                                            {paymentStatus ? (
                                                <div className={`p-3 rounded-lg border-2 ${
                                                    paymentStatus.status === "completed"
                                                        ? "bg-green-50 border-green-300"
                                                        : paymentStatus.status === "failed"
                                                        ? "bg-red-50 border-red-300"
                                                        : "bg-yellow-50 border-yellow-300"
                                                }`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {paymentStatus.status === "completed" && (
                                                            <>
                                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                                <span className="font-bold text-green-700">✅ ชำระเงินสำเร็จ!</span>
                                                            </>
                                                        )}
                                                        {paymentStatus.status === "pending" && (
                                                            <>
                                                                <Clock className="w-5 h-5 text-yellow-600" />
                                                                <span className="font-bold text-yellow-700">⏳ กำลังรอการชำระเงิน...</span>
                                                            </>
                                                        )}
                                                        {paymentStatus.status === "failed" && (
                                                            <>
                                                                <XCircle className="w-5 h-5 text-red-600" />
                                                                <span className="font-bold text-red-700">❌ ชำระเงินไม่สำเร็จ</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {paymentStatus.status === "completed" && (
                                                        <div className="text-xs text-green-700 space-y-1">
                                                            <p>จำนวนเงิน: ฿{paymentStatus.amount.toLocaleString("th-TH")}</p>
                                                            {paymentStatus.paidAt && (
                                                                <p>เวลาชำระ: {new Date(paymentStatus.paidAt).toLocaleString("th-TH")}</p>
                                                            )}
                                                            {paymentStatus.transactionId && (
                                                                <p className="font-mono">Transaction ID: {paymentStatus.transactionId}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-gray-500" />
                                                        <span className="text-xs text-gray-600">
                                                            {isPolling ? "กำลังตรวจสอบสถานะ..." : "รอการชำระเงิน"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ปุ่มจำลองการชำระเงิน (สำหรับทดสอบ) */}
                                            {!paymentStatus || paymentStatus.status === "pending" ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleSimulatePayment}
                                                    className="w-full text-xs"
                                                >
                                                    🧪 จำลองการชำระเงินสำเร็จ (สำหรับทดสอบ)
                                                </Button>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {qrError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-xs text-red-700">⚠️ {qrError}</p>
                            </div>
                        )}

                        {/* Bank Account Info (Optional - สำหรับ Thai Bank Verification) */}
                        {verificationMethod === "thai-bank" && (
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

                        {/* File Upload - แสดงเฉพาะเมื่อไม่ใช่ Real-time */}
                        {verificationMethod !== "realtime" && (
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
                        )}

                        {/* Preview - แสดงเฉพาะเมื่อไม่ใช่ Real-time */}
                        {verificationMethod !== "realtime" && slipPreview && (
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

                        {/* Verify Button - แสดงเฉพาะเมื่อไม่ใช่ Real-time */}
                        {verificationMethod !== "realtime" && (
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
                                        {verificationMethod === "thai-bank"
                                            ? "กำลังตรวจสอบด้วย Thai Bank Verification..."
                                            : "กำลังตรวจสอบสลิป..."}
                                    </>
                                ) : (
                                    verificationMethod === "thai-bank" ? (
                                        <>
                                            <Zap className="w-4 h-4 mr-2" />
                                            ตรวจสอบด้วย Thai Bank Verification
                                        </>
                                    ) : (
                                        "🔍 ตรวจสอบสลิป"
                                    )
                                )}
                            </Button>
                        )}

                        {/* Real-time Payment Info */}
                        {verificationMethod === "realtime" && (
                            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="font-bold text-green-800">⚡ Real-time Payment</span>
                                </div>
                                <p className="text-sm text-green-700 mb-3">
                                    <strong>ไม่ต้องอัปโหลดสลิป!</strong> ระบบจะตรวจสอบการชำระเงินอัตโนมัติ
                                    <br />
                                    เมื่อชำระเงินสำเร็จ ระบบจะแจ้งผลทันที
                                </p>
                                {paymentReferenceNo && (
                                    <div className="mt-3 p-2 bg-white rounded border border-green-200">
                                        <p className="text-xs text-green-800">
                                            <strong>Reference No:</strong> <span className="font-mono">{paymentReferenceNo}</span>
                                        </p>
                                        <p className="text-xs text-green-700 mt-1">
                                            ใช้ Reference No นี้สำหรับตรวจสอบสถานะการชำระเงิน
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

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

                        {/* Advanced Verification Result Display */}
                        {advancedResult && useAdvancedVerification && (
                            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Brain className="w-5 h-5 text-blue-600" />
                                    <span className="font-bold text-blue-800">🔬 Advanced Verification Results</span>
                                    <span className="ml-auto text-sm font-mono bg-white px-2 py-1 rounded">
                                        Score: {advancedResult.score}/100
                                    </span>
                                </div>
                                
                                {/* Detailed Checks */}
                                <div className="space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className={`p-2 rounded ${advancedResult.checks.qrCode.found ? "bg-green-100" : "bg-red-100"}`}>
                                            <span className="font-semibold">QR Code:</span> {advancedResult.checks.qrCode.found ? "✅ พบ" : "❌ ไม่พบ"}
                                            {advancedResult.checks.qrCode.clear && " (ชัดเจน)"}
                                            {advancedResult.checks.qrCode.decodable && " (อ่านได้)"}
                                        </div>
                                        <div className={`p-2 rounded ${advancedResult.checks.bankLogo.detected ? "bg-green-100" : "bg-red-100"}`}>
                                            <span className="font-semibold">Bank Logo:</span> {advancedResult.checks.bankLogo.detected ? `✅ ${advancedResult.checks.bankLogo.bankName || "พบ"}` : "❌ ไม่พบ"}
                                        </div>
                                        <div className={`p-2 rounded ${advancedResult.checks.amount.exactMatch ? "bg-green-100" : advancedResult.checks.amount.found ? "bg-yellow-100" : "bg-red-100"}`}>
                                            <span className="font-semibold">Amount:</span> {advancedResult.checks.amount.found ? `✅ ${advancedResult.checks.amount.amount?.toLocaleString("th-TH")} บาท` : "❌ ไม่พบ"}
                                            {advancedResult.checks.amount.exactMatch && " (ตรงเป๊ะ)"}
                                        </div>
                                        <div className={`p-2 rounded ${advancedResult.checks.accountName.exactMatch ? "bg-green-100" : advancedResult.checks.accountName.found ? "bg-red-100" : "bg-yellow-100"}`}>
                                            <span className="font-semibold">Account Name:</span> {advancedResult.checks.accountName.found ? (advancedResult.checks.accountName.exactMatch ? "✅ ตรง 100%" : "❌ ไม่ตรง") : "⚠️ ไม่พบ"}
                                        </div>
                                        <div className={`p-2 rounded ${advancedResult.checks.dateTime.isRecent ? "bg-green-100" : advancedResult.checks.dateTime.found ? "bg-yellow-100" : "bg-red-100"}`}>
                                            <span className="font-semibold">Date/Time:</span> {advancedResult.checks.dateTime.found ? `✅ ${advancedResult.checks.dateTime.date?.toLocaleDateString("th-TH")}` : "❌ ไม่พบ"}
                                            {advancedResult.checks.dateTime.daysAgo !== undefined && ` (${advancedResult.checks.dateTime.daysAgo} วันก่อน)`}
                                        </div>
                                        <div className={`p-2 rounded ${advancedResult.checks.refNo.found && !advancedResult.checks.refNo.isDuplicate ? "bg-green-100" : advancedResult.checks.refNo.isDuplicate ? "bg-red-100" : "bg-yellow-100"}`}>
                                            <span className="font-semibold">Ref No:</span> {advancedResult.checks.refNo.found ? (advancedResult.checks.refNo.isDuplicate ? "❌ ซ้ำ" : "✅ ไม่ซ้ำ") : "⚠️ ไม่พบ"}
                                        </div>
                                        <div className={`p-2 rounded ${advancedResult.checks.imageQuality.sharpness >= 30 && !advancedResult.checks.imageQuality.hasTampering ? "bg-green-100" : "bg-red-100"}`}>
                                            <span className="font-semibold">Image Quality:</span> Sharpness: {advancedResult.checks.imageQuality.sharpness.toFixed(1)}
                                            {advancedResult.checks.imageQuality.hasTampering && " ⚠️ แก้ไข"}
                                        </div>
                                        <div className={`p-2 rounded ${advancedResult.checks.slipAge.valid ? "bg-green-100" : "bg-red-100"}`}>
                                            <span className="font-semibold">Slip Age:</span> {advancedResult.checks.slipAge.valid ? "✅ ใช้ได้" : "❌ เก่าเกินไป"}
                                        </div>
                                    </div>
                                    
                                    {/* Extracted Data */}
                                    {Object.keys(advancedResult.extractedData).length > 0 && (
                                        <details className="mt-3">
                                            <summary className="text-xs font-medium cursor-pointer text-gray-600 hover:text-gray-800">
                                                📋 ดูข้อมูลที่ Extract ได้
                                            </summary>
                                            <div className="mt-2 p-2 bg-white rounded text-xs space-y-1">
                                                {advancedResult.extractedData.qrPayload && (
                                                    <div><span className="font-semibold">QR Payload:</span> <span className="font-mono">{advancedResult.extractedData.qrPayload.substring(0, 50)}...</span></div>
                                                )}
                                                {advancedResult.extractedData.refNo && (
                                                    <div><span className="font-semibold">Ref No:</span> {advancedResult.extractedData.refNo}</div>
                                                )}
                                                {advancedResult.extractedData.transactionId && (
                                                    <div><span className="font-semibold">Transaction ID:</span> {advancedResult.extractedData.transactionId}</div>
                                                )}
                                            </div>
                                        </details>
                                    )}
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
                                    {useAdvancedVerification && advancedResult && (
                                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            Advanced Mode
                                        </span>
                                    )}
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
                                {verificationMethod === "thai-bank" && thunderResult && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <p className="text-xs font-medium mb-2">🇹🇭 Thai Bank Verification Response:</p>
                                        <div className="text-xs space-y-1 font-mono bg-white/50 p-2 rounded">
                                            <div>
                                                <span className="font-semibold">Verified:</span>{" "}
                                                {thunderResult.verified ? "✅ ใช่" : "❌ ไม่"}
                                            </div>
                                            {thunderResult.qrScanned !== undefined && (
                                                <div>
                                                    <span className="font-semibold">สแกน QR Code:</span>{" "}
                                                    {thunderResult.qrScanned ? "✅ สำเร็จ" : "❌ ไม่พบ"}
                                                </div>
                                            )}
                                            {thunderResult.bankInfo && (
                                                <div>
                                                    <span className="font-semibold">ธนาคาร:</span> {thunderResult.bankInfo.name} ({thunderResult.bankInfo.shortName})
                                                </div>
                                            )}
                                            {thunderResult.transactionRefId && (
                                                <div>
                                                    <span className="font-semibold">Transaction Ref ID:</span> {thunderResult.transactionRefId}
                                                </div>
                                            )}
                                            {thunderResult.qrData?.amount && (
                                                <div>
                                                    <span className="font-semibold">จำนวนเงิน (จาก QR):</span>{" "}
                                                    ฿{thunderResult.qrData.amount.toLocaleString("th-TH")}
                                                </div>
                                            )}
                                            {thunderResult.qrData?.promptpayId && (
                                                <div>
                                                    <span className="font-semibold">PromptPay ID:</span> {thunderResult.qrData.promptpayId}
                                                </div>
                                            )}
                                            {thunderResult.warnings && thunderResult.warnings.length > 0 && (
                                                <div className="mt-2">
                                                    <span className="font-semibold text-yellow-600">⚠️ คำเตือน:</span>
                                                    <ul className="list-disc list-inside ml-2 mt-1">
                                                        {thunderResult.warnings.map((warning, idx) => (
                                                            <li key={idx}>{warning}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {thunderResult.error && (
                                                <div className="mt-2 text-red-600">
                                                    <span className="font-semibold">❌ ข้อผิดพลาด:</span> {thunderResult.error}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* QR Data Details */}
                                        {thunderResult.qrData && (
                                            <details className="mt-2">
                                                <summary className="text-xs font-medium cursor-pointer text-gray-600 hover:text-gray-800">
                                                    📋 ดูข้อมูล QR Code (Debug)
                                                </summary>
                                                <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded mt-1 overflow-auto max-h-40">
                                                    {JSON.stringify(thunderResult.qrData, null, 2)}
                                                </pre>
                                            </details>
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
                        <p>1. เลือกวิธีการชำระเงิน (Slip-based, Thunder API, หรือ Real-time)</p>
                        <p>2. (ไม่บังคับ) กรอกเลขพร้อมเพย์ - จะสร้าง QR Code อัตโนมัติ</p>
                        <p>3. (ไม่บังคับ) กรอกจำนวนเงินที่ต้องการชำระ/ตรวจสอบ</p>
                        <p>4. (ไม่บังคับ) กรอกข้อมูลธนาคาร - สำหรับ Thunder API</p>
                        <p>5. {verificationMethod === "realtime" ? "สแกน QR Code และชำระเงิน - ระบบจะตรวจสอบอัตโนมัติ" : "อัปโหลดสลิปและตรวจสอบ"}</p>
                        <p>6. ดูผลการตรวจสอบและรายละเอียด</p>
                        <div className="pt-2 space-y-2">
                            <div className="p-2 bg-blue-50 rounded">
                                <p className="text-blue-700 font-medium text-xs">
                                    💡 <strong>Slip-based:</strong> อัปโหลดสลิป ตรวจสอบด้วย OCR (ฟรี)
                                </p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded">
                                <p className="text-purple-700 font-medium text-xs">
                                    ⚡ <strong>Thunder API:</strong> ตรวจสอบสลิปด้วย AI (99.98% accuracy)
                                    <br />
                                    - ตรวจสอบได้ทั้งโอนเงินเข้าและโอนเงินออก
                                    <br />
                                    - ต้องมี QR Code ในสลิป
                                </p>
                            </div>
                            <div className="p-2 bg-green-50 rounded">
                                <p className="text-green-700 font-medium text-xs">
                                    ⚡ <strong>Real-time:</strong> จ่ายปุ้บรู้เลย ไม่ต้องอัปโหลดสลิป!
                                    <br />
                                    - ใช้ Payment Gateway (GBPrimepay/Omise/2C2P)
                                    <br />
                                    - ระบบตรวจสอบอัตโนมัติผ่าน Webhook
                                    <br />
                                    - รู้ผลทันทีเมื่อชำระเงินสำเร็จ
                                    <br />
                                    - มีค่าธรรมเนียม 2-3%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
