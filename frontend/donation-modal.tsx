"use client"

import { useState, useEffect, useRef } from "react"
import { X, QrCode, CreditCard, Smartphone, Copy, Check, ArrowLeft, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react"
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
import { verifyThaiBankSlip } from "@/lib/thai-bank-slip-verification"

interface DonationModalProps {
    isOpen: boolean
    onClose: () => void
    donation: {
        id: string
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

type SlipDecision = "approved" | "rejected" | "needs_review" // approved=เขียว, needs_review=เหลือง, rejected=แดง

interface VerifyResult {
    decision: SlipDecision
    reasons: string[]
    ocrPreview?: string
    hasQR?: boolean
    _debug?: {
        score: number
        foundTokens: string[]
        ocrAmount: number | null
        ocrDate: string | null
        hasSlipEvidence: boolean
    }
}

export default function DonationModal({ isOpen, onClose, donation }: DonationModalProps) {
    const [step, setStep] = useState<"method" | "amount" | "warning" | "payment" | "success">("method")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qr")
    const [amount, setAmount] = useState("")
    const [customAmount, setCustomAmount] = useState("")
    const [remainingAmount, setRemainingAmount] = useState<number | null>(null)
    const [remainingLoading, setRemainingLoading] = useState(false)
    const [amountError, setAmountError] = useState("")
    const [message, setMessage] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [pointsEarned, setPointsEarned] = useState(0)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [qrError, setQrError] = useState<string>("")
    const [slipFile, setSlipFile] = useState<File | null>(null)
    const [slipPreview, setSlipPreview] = useState<string | null>(null)
    const [verifying, setVerifying] = useState(false)
    const [slipResult, setSlipResult] = useState<VerifyResult | null>(null)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [warningStepTimestamp, setWarningStepTimestamp] = useState<Date | null>(null) // เวลาที่กดปุ่ม "ยืนยันและดำเนินการต่อ"
    const slipInputRef = useRef<HTMLInputElement>(null)

    const { user } = useAuth()

<<<<<<< HEAD
<<<<<<< HEAD
    // Normalize payment methods (รองรับทั้ง camelCase/snake_case และ JSON string)
    const rawPaymentMethods = donation.paymentMethods || {}
    const parsedPaymentMethods =
        typeof rawPaymentMethods === "string"
            ? (() => {
                  try {
                      return JSON.parse(rawPaymentMethods)
                  } catch {
                      return {}
                  }
              })()
            : rawPaymentMethods
    const promptpayId =
        parsedPaymentMethods?.promptpay?.trim?.() ||
        parsedPaymentMethods?.promptpay_number?.trim?.() ||
        parsedPaymentMethods?.promptpayNumber?.trim?.() ||
        ""
    const bankAccountSource = parsedPaymentMethods?.bankAccount || parsedPaymentMethods?.bank_account || null
    const bankAccount = bankAccountSource
        ? {
              bank: bankAccountSource.bank || bankAccountSource.bank_name || "",
              accountNumber: bankAccountSource.accountNumber || bankAccountSource.account_number || "",
              accountName: bankAccountSource.accountName || bankAccountSource.account_name || "",
          }
        : {
              bank: "-",
              accountNumber: "-",
              accountName: "-",
          }
=======
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
    // Safe extraction + fallback
    const paymentMethods = donation.paymentMethods || {}
    const promptpayId = paymentMethods.promptpay?.trim() || ""
    const bankAccount = paymentMethods.bankAccount || {
        bank: "-",
        accountNumber: "-",
        accountName: "-",
    }
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5

    const [cardNumber, setCardNumber] = useState("")
    const [expiryDate, setExpiryDate] = useState("")
    const [cvv, setCvv] = useState("")
    const [cardName, setCardName] = useState("")

    const quickAmounts = ["100", "500", "1000", "2000", "5000"]

<<<<<<< HEAD
<<<<<<< HEAD
    useEffect(() => {
        if (!isOpen || !donation?.id) return
        const controller = new AbortController()
        const loadRemaining = async () => {
            try {
                setRemainingLoading(true)
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
                const res = await fetch(`${apiUrl}/donations/remaining/${donation.id}`, {
                    signal: controller.signal,
                })
                if (!res.ok) throw new Error("โหลดข้อมูลยอดคงเหลือไม่สำเร็จ")
                const data = await res.json()
                const remaining =
                    typeof data?.remaining === "number"
                        ? data.remaining
                        : data?.remaining
                        ? Number(data.remaining)
                        : null
                setRemainingAmount(Number.isFinite(remaining as number) ? (remaining as number) : null)
            } catch (err) {
                if ((err as any)?.name !== "AbortError") {
                    setRemainingAmount(null)
                }
            } finally {
                setRemainingLoading(false)
            }
        }
        loadRemaining()
        return () => controller.abort()
    }, [isOpen, donation?.id])

    const formatAmount = (amount: string) => {
        return new Intl.NumberFormat("th-TH").format(Number(amount))
=======
    const formatAmount = (amt: string | number) => {
        return new Intl.NumberFormat("th-TH").format(Number(amt))
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
    const formatAmount = (amt: string | number) => {
        return new Intl.NumberFormat("th-TH").format(Number(amt))
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
    }

    // Generate QR Code
    useEffect(() => {
<<<<<<< HEAD
<<<<<<< HEAD
        const shouldGenerate = step === "payment" && paymentMethod === "qr" && !!amount && Number(amount) > 0
=======
        const shouldGenerate =
            step === "payment" && paymentMethod === "qr" && !!amount && Number(amount) > 0

>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
        const shouldGenerate =
            step === "payment" && paymentMethod === "qr" && !!amount && Number(amount) > 0

>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
        if (!shouldGenerate) {
            setQrCodeUrl("")
            setQrError("")
            return
        }
<<<<<<< HEAD
<<<<<<< HEAD
=======

        let isCurrent = true
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======

        let isCurrent = true
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5

        const generateQRCode = async () => {
            try {
                setQrError("")
                setQrCodeUrl("")

                if (!promptpayId) {
                    throw new Error("ไม่มีเลขพร้อมเพย์สำหรับคำขอบริจาคนี้")
<<<<<<< HEAD
<<<<<<< HEAD
                }

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
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
                }

=======
                }

>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5

        return () => {
            isCurrent = false
        }
<<<<<<< HEAD
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
    }, [step, paymentMethod, amount, promptpayId])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const clampAmount = (value: string) => {
        if (!value) {
            setAmountError("")
            return ""
        }
        const numeric = Number(value)
        if (!Number.isFinite(numeric)) {
            setAmountError("")
            return ""
        }
        let nextAmount = numeric
        let error = ""
        if (remainingAmount !== null) {
            if (remainingAmount <= 0) {
                error = "คำขอนี้รับบริจาคครบแล้ว"
                nextAmount = 0
            } else if (numeric > remainingAmount) {
                error = `ยอดสูงสุดที่บริจาคได้คือ ฿${formatAmount(String(remainingAmount))}`
                nextAmount = remainingAmount
            }
        }
        setAmountError(error)
        return nextAmount > 0 ? String(nextAmount) : ""
    }

    const handleAmountSelect = (selectedAmount: string) => {
        const next = clampAmount(selectedAmount)
        setAmount(next)
        setCustomAmount(next)
    }

    const handleCustomAmountChange = (value: string) => {
        const next = clampAmount(value)
        setCustomAmount(next)
        setAmount(next)
    }

    const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSlipFile(file)
            setSlipPreview(URL.createObjectURL(file))
            setSlipResult(null)
        }
    }

    const handlePickSlip = () => {
        if (slipInputRef.current) {
            slipInputRef.current.value = ""
            slipInputRef.current.click()
        }
    }

    /**
     * ตรวจสอบสลิปด้วยระบบ Thai Bank Slip Verification
     * - สีแดง (rejected): สลิปปลอมหรือรูปที่ไม่ใช่สลิป - ป้องกันการอัปโหลด
     * - สีเหลือง (needs_review): สลิปจริงแต่มีบางอย่างคลาดเคลื่อน - อนุญาตให้อัปโหลดได้
     * - สีเขียว (approved): ผ่าน ตรง 90% - อนุมัติอัตโนมัติ
     * 
     * เงื่อนไขเพิ่มเติม:
     * - เวลาสลิปต้อง >= warningStepTimestamp (เวลาที่กดปุ่ม "ยืนยันและดำเนินการต่อ")
     * - จำนวนเงินต้องตรงเท่านั้น (ไม่คลาดเคลื่อน)
     */
    const verifySlipClient = async (): Promise<VerifyResult> => {
        if (!slipFile) {
            return { decision: "rejected", reasons: ["ยังไม่มีสลิปให้ตรวจ"] }
        }

        if (!warningStepTimestamp) {
            return { decision: "rejected", reasons: ["ยังไม่ได้กดปุ่มยืนยันและดำเนินการต่อ - กรุณากลับไปกดปุ่มยืนยันก่อน"] }
        }

        const errors: string[] = []
        const warnings: string[] = []

        try {
            // ใช้ Thai Bank Slip Verification
            const verificationResult = await verifyThaiBankSlip({
                slipFile,
                expectedAmount: amount ? Number(amount) : undefined,
                expectedAccountName: bankAccount.accountName !== "-" ? bankAccount.accountName : undefined,
                expectedBankName: bankAccount.bank !== "-" ? bankAccount.bank : undefined,
                expectedPromptpayId: promptpayId || undefined
            })

            // แสดงข้อมูลจาก QR ในคอนโซลสำหรับวิเคราะห์ (เปิด DevTools > Console ดู)
            if (verificationResult.qrScanned && verificationResult.qrData) {
                console.group("📦 [Donation Modal] ข้อมูลจาก QR Code ที่สแกนได้")
                console.log("qrScanned:", verificationResult.qrScanned)
                console.log("qrData:", verificationResult.qrData)
                console.log("transactionRefId:", verificationResult.qrData.transactionRefId)
                console.log("bankCode / bankInfo:", verificationResult.qrData.bankCode, verificationResult.qrData.bankInfo)
                console.log("amount:", verificationResult.qrData.amount)
                console.log("promptpayId:", verificationResult.qrData.promptpayId)
                console.log("rawPayload (ต้นฉบับ):", verificationResult.qrData.rawPayload)
                console.groupEnd()
            }

            // ตรวจสอบผลการ verify: ถ้าสแกน QR ได้แต่ verified เป็น false (สแกนไม่แน่นอน) ให้เป็น warning แทน error
            // เพื่อให้สลิปยังอัปโหลดได้เป็น needs_review และให้คนตรวจอีกครั้ง
            if (!verificationResult.verified) {
                const msg = verificationResult.error || "สลิปไม่ผ่านการตรวจสอบ"
                if (verificationResult.qrScanned) {
                    warnings.push(msg + " (สแกน QR ได้ แต่มีรายการที่ต้องตรวจเพิ่ม)")
                } else {
                    errors.push(msg)
                }
            }

            // OCR - อ่านข้อความจากสลิป (ต้องทำก่อนเพื่อใช้ในส่วนตรวจสอบจำนวนเงิน)
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const i = new Image()
                i.crossOrigin = "anonymous"
                i.onload = () => resolve(i)
                i.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"))
                i.src = slipPreview || ""
            })

            let ocrText = ""
            try {
                const tesseract = await import("tesseract.js")
                // @ts-ignore
                const res = await tesseract.recognize(img, "tha+eng", { logger: () => {} }).catch(() => null)
                ocrText = res?.data?.text?.replace(/\s+/g, " ").trim() || ""
            } catch (_) {
                // ข้ามได้
            }

            // แสดงข้อมูลจากการสแกนรูป (OCR) ในคอนโซล
            console.group("📷 ข้อมูลจากการสแกนรูป (OCR)")
            console.log("ข้อความที่อ่านได้จากรูป (ความยาว " + ocrText.length + " ตัวอักษร):", ocrText || "(ไม่มี)")
            console.log("ตัวอย่าง 500 ตัวแรก:", ocrText.slice(0, 500) || "(ไม่มี)")
            console.groupEnd()

            // ตรวจสอบจำนวนเงิน - ต้องตรงเท่านั้น (ไม่คลาดเคลื่อน)
            const requiredAmount = amount ? Number(amount) : null
            if (requiredAmount !== null) {
                const qrAmount = verificationResult.qrData?.amount
                const basicAmount = verificationResult.basicVerification?._debug?.ocrAmount
                
                // ถ้า qrAmount หรือ basicAmount เป็น 0 หรือ null ให้ข้ามไปหาใน OCR text เลย
                // เพราะอาจเป็นค่าธรรมเนียมที่อ่านผิด
                let slipAmount: number | null | undefined = null
                
                // ใช้ qrAmount หรือ basicAmount เฉพาะเมื่อไม่ใช่ 0 และตรงกับ requiredAmount
                if (qrAmount !== null && qrAmount !== undefined && qrAmount > 0 && Math.abs(qrAmount - requiredAmount) <= 0.01) {
                    slipAmount = qrAmount
                } else if (basicAmount !== null && basicAmount !== undefined && basicAmount > 0 && Math.abs(basicAmount - requiredAmount) <= 0.01) {
                    slipAmount = basicAmount
                }

                // ถ้ายังไม่มีจำนวนเงิน หรือจำนวนเงินไม่ตรงกับ requiredAmount ลองอ่านจาก OCR โดยตรง
                if (slipAmount === null || slipAmount === undefined || Math.abs(slipAmount - requiredAmount) > 0.01) {
                    // วิธีง่ายๆ: หาจำนวนเงินที่ตรงกับ requiredAmount โดยตรง
                    // ถ้าเจอ "1.00 บาท" หรือ "1 00 บาท" และตรงกับ requiredAmount ให้ใช้เลย
                    if (requiredAmount !== null) {
                        // หา pattern ที่ตรงกับ requiredAmount โดยตรง
                        const exactAmountPatterns = [
                            // รูปแบบ: "1.00 บาท" (ตรงกับ requiredAmount)
                            new RegExp(`(${requiredAmount.toFixed(2)})\\s*บาท`, 'i'),
                            // รูปแบบ: "1 00 บาท" (กรณี OCR อ่านผิด)
                            new RegExp(`(${Math.floor(requiredAmount)})\\s+(\\d{2})\\s*บาท`, 'i'),
                            // รูปแบบ: "1 บาท" (ไม่มีทศนิยม)
                            new RegExp(`(${Math.floor(requiredAmount)})\\s*บาท(?!\\s*\\.\\d)`, 'i'),
                        ]
                        
                        for (let i = 0; i < exactAmountPatterns.length; i++) {
                            const pattern = exactAmountPatterns[i]
                            const match = ocrText.match(pattern)
                            if (match) {
                                // ตรวจสอบว่าไม่ใช่ค่าธรรมเนียม (ดู 50 ตัวอักษรก่อนหน้า)
                                const matchIndex = ocrText.indexOf(match[0])
                                if (matchIndex !== -1) {
                                    const beforeText = ocrText.substring(Math.max(0, matchIndex - 50), matchIndex)
                                    const isFee = /(?:ค่าธรรมเนียม|Fee)/i.test(beforeText)
                                    
                                    if (!isFee) {
                                        // กรณี pattern ที่ 2: "1 00 บาท" -> แปลงเป็น "1.00"
                                        if (i === 1 && match[1] && match[2]) {
                                            const wholePart = match[1]
                                            const decimalPart = match[2]
                                            if (decimalPart.length === 2 && wholePart.length <= 2) {
                                                slipAmount = parseFloat(`${wholePart}.${decimalPart}`)
                                            } else {
                                                slipAmount = parseFloat(match[1].replace(/,/g, ""))
                                            }
                                        } else {
                                            slipAmount = parseFloat(match[1].replace(/,/g, ""))
                                        }
                                        
                                        // ตรวจสอบว่าตรงกับ requiredAmount หรือไม่
                                        if (Math.abs(slipAmount - requiredAmount) <= 0.01) {
                                            break // เจอแล้ว ใช้เลย
                                        } else {
                                            slipAmount = null // ไม่ตรง ต้องหาต่อ
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // ถ้ายังไม่เจอ ลองหาจาก "จำนวน:" หรือ "Amount:"
                    if (slipAmount === null || slipAmount === undefined) {
                        const amountKeywordIndex = ocrText.search(/(?:จำนวน|Amount)[:\s]/i)
                        if (amountKeywordIndex !== -1) {
                            const afterAmountText = ocrText.substring(amountKeywordIndex)
                            const amountPatterns = [
                                /[:\s]+(\d{1,3}(?:,\d{3})*\.\d{1,2})\s*บาท/i,
                                /[:\s]+(\d{1,2})\s+(\d{2})\s*บาท/i,
                                /[:\s]+(\d{1,3}(?:,\d{3})*)(?!\s*\.\d)\s*บาท/i,
                            ]
                            
                            for (let i = 0; i < amountPatterns.length; i++) {
                                const pattern = amountPatterns[i]
                                const match = afterAmountText.match(pattern)
                                if (match) {
                                    // ตรวจสอบว่าไม่ใช่ค่าธรรมเนียม
                                    const matchIndex = afterAmountText.indexOf(match[0])
                                    const beforeText = afterAmountText.substring(Math.max(0, matchIndex - 50), matchIndex)
                                    const isFee = /(?:ค่าธรรมเนียม|Fee)/i.test(beforeText)
                                    
                                    if (!isFee) {
                                        if (i === 1 && match[1] && match[2]) {
                                            const wholePart = match[1]
                                            const decimalPart = match[2]
                                            if (decimalPart.length === 2 && wholePart.length <= 2) {
                                                slipAmount = parseFloat(`${wholePart}.${decimalPart}`)
                                            } else {
                                                slipAmount = parseFloat(match[1].replace(/,/g, ""))
                                            }
                                        } else {
                                            slipAmount = parseFloat(match[1].replace(/,/g, ""))
                                        }
                                        break
                                    }
                                }
                            }
                        }
                    }
                    
                    // ถ้ายังไม่เจอ หาจำนวนเงินที่ไม่ใช่ค่าธรรมเนียม (ตัวแรกที่เจอ)
                    if (slipAmount === null || slipAmount === undefined) {
                        const amountRegex = /(\d{1,3}(?:,\d{3})*\.?\d{0,2})\s*บาท/gi
                        let match
                        
                        while ((match = amountRegex.exec(ocrText)) !== null) {
                            if (match.index !== undefined) {
                                const amountStr = match[1]
                                const amount = parseFloat(amountStr.replace(/,/g, ""))
                                
                                // ตรวจสอบว่าไม่ใช่ค่าธรรมเนียม
                                const beforeText = ocrText.substring(Math.max(0, match.index - 50), match.index)
                                const isFee = /(?:ค่าธรรมเนียม|Fee)/i.test(beforeText)
                                
                                // ถ้าไม่ใช่ค่าธรรมเนียม และจำนวนเงินมากกว่า 0 และตรงกับ requiredAmount (หรือใกล้เคียง)
                                if (!isFee && amount > 0) {
                                    // ถ้าตรงกับ requiredAmount ให้ใช้เลย
                                    if (Math.abs(amount - requiredAmount) <= 0.01) {
                                        slipAmount = amount
                                        break // เจอแล้ว ใช้เลย
                                    } else if (slipAmount === null || slipAmount === undefined) {
                                        // ถ้ายังไม่เจอตัวที่ตรง ให้เก็บไว้เป็นตัวสำรอง
                                        slipAmount = amount
                                    }
                                }
                            }
                        }
                    }
                }
                
                // ถ้ายังไม่เจอ หรือจำนวนเงินไม่ตรงกับ requiredAmount ให้ลองหาอีกครั้ง
                if (slipAmount === null || slipAmount === undefined || Math.abs(slipAmount - requiredAmount) > 0.01) {
                    // หา "จำนวน:" และหาจำนวนเงินที่อยู่หลังมัน (ไม่ใช่ค่าธรรมเนียม)
                    const amountKeywordIndex = ocrText.search(/(?:จำนวน|Amount)[:\s]/i)
                    const feeKeywordIndex = ocrText.search(/(?:ค่าธรรมเนียม|Fee)[:\s]/i)
                    
                    if (amountKeywordIndex !== -1) {
                        // หาจำนวนเงินทั้งหมดที่อยู่หลัง "จำนวน:" และก่อน "ค่าธรรมเนียม" (ถ้ามี)
                        const searchEnd = feeKeywordIndex !== -1 ? feeKeywordIndex : ocrText.length
                        const searchText = ocrText.substring(amountKeywordIndex, searchEnd)
                        
                        const amountPatterns = [
                            /[:\s]+(\d{1,3}(?:,\d{3})*\.\d{1,2})\s*บาท/i,
                            /[:\s]+(\d{1,2})\s+(\d{2})\s*บาท/i,
                            /[:\s]+(\d{1,3}(?:,\d{3})*)(?!\s*\.\d)\s*บาท/i,
                        ]
                        
                        for (let i = 0; i < amountPatterns.length; i++) {
                            const pattern = amountPatterns[i]
                            const match = searchText.match(pattern)
                            if (match) {
                                let parsedAmount: number
                                if (i === 1 && match[1] && match[2]) {
                                    const wholePart = match[1]
                                    const decimalPart = match[2]
                                    if (decimalPart.length === 2 && wholePart.length <= 2) {
                                        parsedAmount = parseFloat(`${wholePart}.${decimalPart}`)
                                    } else {
                                        parsedAmount = parseFloat(match[1].replace(/,/g, ""))
                                    }
                                } else {
                                    parsedAmount = parseFloat(match[1].replace(/,/g, ""))
                                }
                                
                                // ถ้าตรงกับ requiredAmount ให้ใช้เลย
                                if (Math.abs(parsedAmount - requiredAmount) <= 0.01) {
                                    slipAmount = parsedAmount
                                    break
                                }
                            }
                        }
                    }
                }

                // ตรวจสอบกรณีพิเศษ: ถ้าจำนวนเงินที่อ่านได้เป็น 100 แต่ requiredAmount เป็น 1
                // และจำนวนเงินที่อ่านได้มี 3 หลัก = อาจเป็น "1.00" ที่อ่านผิดเป็น "100"
                if (slipAmount !== null && slipAmount !== undefined && requiredAmount < 10 && slipAmount >= 100) {
                    // ลองหาว่ามี "1.00" หรือ "1 00" ใน OCR text หรือไม่
                    const decimalPattern = /1\s*[\.\s]\s*0{0,2}\s*บาท/i
                    if (decimalPattern.test(ocrText)) {
                        // พบ "1.00" หรือ "1 00" ใน text = ใช้ 1.00 แทน
                        slipAmount = 1.00
                    } else {
                        // ตรวจสอบว่ามี "1" ตามด้วย "บาท" ใกล้ๆ หรือไม่
                        const oneBahtPattern = /1\s*\.?\s*0{0,2}\s*บาท/i
                        if (oneBahtPattern.test(ocrText)) {
                            slipAmount = 1.00
                        } else {
                            // ตรวจสอบว่ามี "1" ตามด้วย "บาท" หรือ "จำนวน" ใกล้ๆ
                            const onePattern = /(?:จำนวน|Amount)[:\s]*1\s*\.?\s*0{0,2}/i
                            if (onePattern.test(ocrText)) {
                                slipAmount = 1.00
                            }
                        }
                    }
                }

                if (slipAmount === null || slipAmount === undefined) {
                    errors.push("ไม่สามารถอ่านจำนวนเงินจากสลิปได้ - กรุณาตรวจสอบความชัดเจนของสลิป")
                } else {
                    const diff = Math.abs(slipAmount - requiredAmount)
                    // อนุญาตคลาดเคลื่อน 0.01 บาท (1 สตางค์) สำหรับทศนิยม
                    if (diff > 0.01) {
                        // จำนวนเงินไม่ตรง = สีแดง
                        errors.push(`จำนวนเงินไม่ตรงกัน: สลิปแสดง ${slipAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท, ควรเป็น ${requiredAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท (คลาดเคลื่อน ${diff.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท) - จำนวนเงินต้องตรงเท่านั้น`)
                    }
                }
            }

            // ตรวจสอบเวลา - ต้อง >= warningStepTimestamp
            // (img และ ocrText ถูกสร้างไว้แล้วข้างบน - ใช้ตัวเดิม)

            // Parse เวลาจาก OCR
            // รูปแบบ: "19 ม.ค. 69 20:18 น." หรือ "19/01/2026 20:18"
            let ocrDateTime: Date | null = null
            if (ocrText) {
                // รูปแบบ: DD ม.ค. YY HH:MM น. (YY เป็น พ.ศ. 2 หลัก เช่น 69 = 2569 = 2026 ค.ศ.)
                const thaiDateTimeMatch = ocrText.match(/(\d{1,2})\s*(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s*(\d{2})\s+(\d{1,2}):(\d{2})\s*น\.?/i)
                if (thaiDateTimeMatch) {
                    const thaiMonths: Record<string, number> = {
                        "ม.ค": 1, "มค": 1, "ก.พ": 2, "กพ": 2, "มี.ค": 3, "มีค": 3,
                        "เม.ย": 4, "เมย": 4, "พ.ค": 5, "พค": 5, "มิ.ย": 6, "มิย": 6,
                        "ก.ค": 7, "กค": 7, "ส.ค": 8, "สค": 8, "ก.ย": 9, "กย": 9,
                        "ต.ค": 10, "ตค": 10, "พ.ย": 11, "พย": 11, "ธ.ค": 12, "ธค": 12,
                    }
                    const day = Number(thaiDateTimeMatch[1])
                    const monthKey = thaiDateTimeMatch[2].replace(/\./g, "")
                    const month = thaiMonths[monthKey] || thaiMonths[thaiDateTimeMatch[2]]
                    const yearRaw = Number(thaiDateTimeMatch[3])
                    const hour = Number(thaiDateTimeMatch[4])
                    const minute = Number(thaiDateTimeMatch[5])
                    // พ.ศ. 2 หลัก (69 = 2569) → ค.ศ. 2026 (2569 - 543)
                    const year = yearRaw < 100 ? 1957 + yearRaw : (yearRaw >= 2400 ? yearRaw - 543 : yearRaw)
                    if (month && day >= 1 && day <= 31 && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                        ocrDateTime = new Date(year, month - 1, day, hour, minute)
                    }
                }

                // รูปแบบ: DD/MM/YYYY HH:MM หรือ DD-MM-YYYY HH:MM
                if (!ocrDateTime) {
                    const numericDateTimeMatch = ocrText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+(\d{1,2}):(\d{2})/)
                    if (numericDateTimeMatch) {
                        const day = Number(numericDateTimeMatch[1])
                        const month = Number(numericDateTimeMatch[2])
                        const yearRaw = Number(numericDateTimeMatch[3])
                        const hour = Number(numericDateTimeMatch[4])
                        const minute = Number(numericDateTimeMatch[5])
                        const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw
                        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                            ocrDateTime = new Date(year, month - 1, day, hour, minute)
                        }
                    }
                }
            }

            // ตรวจสอบเวลา: ผ่านเมื่อเวลาสลิป >= เวลาที่กดยืนยัน (มากกว่าหรือเท่ากับได้)
            // ตัวอย่าง: กด 23:30 → บริจาค 23:30 หรือ 23:30:01 ได้; น้อยกว่า 23:30 ถึงไม่ผ่าน
            // ปัดเวลากดลงเป็นต้นนาที เพื่อให้สลิปที่แสดงแค่ HH:MM (ไม่มีวินาที) ไม่ถูกตัดเพราะวินาที
            if (ocrDateTime) {
                const clickAtStartOfMinute = new Date(warningStepTimestamp)
                clickAtStartOfMinute.setSeconds(0, 0)
                if (ocrDateTime < clickAtStartOfMinute) {
                    errors.push(`เวลาสลิป (${ocrDateTime.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}) น้อยกว่าเวลาที่กดปุ่มยืนยัน (${warningStepTimestamp.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}) - สลิปต้องทำรายการหลังหรือพร้อมกับกดปุ่มยืนยัน`)
                }
            } else {
                warnings.push("ไม่สามารถอ่านเวลาจากสลิปได้ - กรุณาตรวจสอบความชัดเจนของสลิป")
            }

            // ตรวจสอบผลจาก basicVerification และ advancedVerification
            if (verificationResult.basicVerification) {
                if (verificationResult.basicVerification.decision === "rejected") {
                    errors.push(...verificationResult.basicVerification.reasons)
                } else if (verificationResult.basicVerification.decision === "needs_review") {
                    warnings.push(...verificationResult.basicVerification.reasons)
                }
            }

            if (verificationResult.advancedVerification) {
                if (verificationResult.advancedVerification.decision === "rejected") {
                    errors.push(...verificationResult.advancedVerification.reasons)
                } else if (verificationResult.advancedVerification.decision === "needs_review") {
                    warnings.push(...verificationResult.advancedVerification.reasons)
                }
            }

            // ตัดสินใจ
            let decision: SlipDecision = "rejected"
            if (errors.length > 0) {
                decision = "rejected"
            } else if (warnings.length > 0 || !verificationResult.verified) {
                decision = "needs_review"
            } else {
                decision = "approved"
            }

            const allReasons = [...errors, ...warnings]
            if (allReasons.length === 0 && decision === "approved") {
                allReasons.push("✅ ตรวจสอบผ่าน - สลิปถูกต้องและครบถ้วน")
            }

            // สรุปข้อมูลจากการสแกนรูป (QR + OCR) ในคอนโซล
            console.group("📷 สรุปข้อมูลจากการสแกนรูป")
            console.log("QR:", {
                สแกนได้: verificationResult.qrScanned,
                จำนวนเงินจากQR: verificationResult.qrData?.amount,
                วันที่จากQR: verificationResult.qrData?.dateTime,
                เลขที่รายการ: verificationResult.qrData?.transactionRefId,
                ธนาคาร: verificationResult.qrData?.bankInfo?.name,
            })
            console.log("OCR:", {
                วันที่ที่อ่านได้: ocrDateTime ? ocrDateTime.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : null,
                ข้อความยาว: ocrText.length + " ตัวอักษร",
                ตัวอย่าง: ocrText.slice(0, 200) + (ocrText.length > 200 ? "…" : ""),
            })
            console.log("ผลการตรวจ:", { decision, จำนวนเหตุผล: allReasons.length })
            console.groupEnd()

            return {
                decision,
                reasons: allReasons,
                hasQR: verificationResult.qrScanned,
                ocrPreview: ocrText.slice(0, 300),
                _debug: {
                    score: verificationResult.verified ? 90 : 70,
                    foundTokens: [],
                    ocrAmount: verificationResult.qrData?.amount || null,
                    ocrDate: ocrDateTime ? ocrDateTime.toLocaleDateString("th-TH") : null,
                    hasSlipEvidence: verificationResult.qrScanned
                }
            }

        } catch (error: any) {
            console.error("Error verifying slip:", error)
            return {
                decision: "rejected",
                reasons: [error.message || "เกิดข้อผิดพลาดในการตรวจสอบสลิป"]
            }
        }
    }

    const handlePayment = async () => {
        setIsProcessing(true)

<<<<<<< HEAD
<<<<<<< HEAD
        if (remainingAmount !== null && Number(amount) > remainingAmount) {
            toast({
                title: "ยอดเงินเกินที่เหลืออยู่",
                description: `ยอดสูงสุดที่บริจาคได้คือ ฿${formatAmount(String(remainingAmount))}`,
                variant: "destructive",
            })
            setIsProcessing(false)
            return
        }

        if ((paymentMethod === "qr" || paymentMethod === "bank") && !slipFile) {
            toast({
                title: "ต้องแนบสลิปก่อน",
                description: "กรุณาอัปโหลดสลิปเพื่อให้ผู้จัดตรวจสอบ",
                variant: "destructive",
            })
            setIsProcessing(false)
            return
        }

        if (slipFile) {
            try {
                setVerifying(true)
                const result = await verifySlipClient()
                setSlipResult(result)
                setVerifying(false)

                if (result.decision === "rejected") {
                    toast({
                        title: "❌ สลิปไม่ผ่านการตรวจสอบ",
                        description: "กรุณาอัปโหลดสลิปโอนเงินที่ถูกต้องและชัดเจน",
                        variant: "destructive",
                    })
                    setIsProcessing(false)
                    return
                } else if (result.decision === "approved") {
                    toast({
                        title: "✅ สลิปผ่านการตรวจสอบ",
                        description: "สลิปถูกต้องและครบถ้วน กำลังส่งให้ผู้สร้างคำขอตรวจสอบ",
                    })
                } else if (result.decision === "needs_review") {
                    toast({
                        title: "⚠️ สลิปผ่านเบื้องต้น",
                        description: "สลิปดูเหมือนจริง แต่มีบางอย่างคลาดเคลื่อน ผู้สร้างคำขอจะตรวจสอบอีกครั้ง",
                    })
                }
            } catch (e) {
                setVerifying(false)
            }
        }

        try {
            const formData = new FormData()
            formData.append("donation_request_id", String(donation.id))
            formData.append("amount", String(Number(amount)))
            formData.append(
                "payment_method",
                paymentMethod === "qr" ? "promptpay" : paymentMethod === "bank" ? "bank" : "credit"
            )

            if (slipFile) {
                formData.append("slip", slipFile)
            }
            if (slipResult?.decision) {
                formData.append("client_verdict", slipResult.decision)
            }
            if (slipResult?.reasons?.length) {
                slipResult.reasons.forEach((r, idx) => {
                    formData.append(`client_reasons[${idx}]`, r)
                })
            }

            const token = localStorage.getItem("auth_token") || ""
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

            const res = await fetch(`${apiUrl}/donations/slips`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })
            const contentType = res.headers.get("content-type") || ""
            const data = contentType.includes("application/json") ? await res.json() : null
            if (!res.ok) {
                const fallback = data?.error || (await res.text().catch(() => "อัปโหลดสลิปไม่สำเร็จ"))
                throw new Error(fallback || "อัปโหลดสลิปไม่สำเร็จ")
            }

            toast({
                title: "ส่งสลิปสำเร็จ",
                description: "ระบบส่งให้ผู้จัดโครงการตรวจสอบแล้ว",
            })
        } catch (err: any) {
            console.error("Slip submission error:", err)
            toast({
                title: "เกิดข้อผิดพลาด",
                description: err.message || "ไม่สามารถส่งสลิปได้",
                variant: "destructive",
            })
            setIsProcessing(false)
            return
        }
=======
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
        // จำลองการตรวจสอบการชำระเงิน (ใน production ควรเรียก API จริง)
        await new Promise((resolve) => setTimeout(resolve, 3000))
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5

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
<<<<<<< HEAD
<<<<<<< HEAD
        setSlipFile(null)
        setSlipPreview(null)
        setSlipResult(null)
        setAgreedToTerms(false)
        setWarningStepTimestamp(null)
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
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
                                    else if (step === "warning") setStep("amount")
                                    else if (step === "payment") setStep("warning")
                                }}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        )}
                        <CardTitle className="text-lg">
                            {step === "method" && "เลือกวิธีการบริจาค"}
                            {step === "amount" && "ระบุจำนวนเงิน"}
                            {step === "warning" && "ข้อตกลงและคำเตือน"}
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
                                    {quickAmounts.map((quickAmount) => {
                                        const quickValue = Number(quickAmount)
                                        const isOverRemaining =
                                            remainingAmount !== null && Number.isFinite(remainingAmount) && quickValue > remainingAmount
                                        return (
                                            <Button
                                                key={quickAmount}
                                                variant={amount === quickAmount ? "default" : "outline"}
                                                className={`${amount === quickAmount ? "bg-pink-500 hover:bg-pink-600" : ""} ${isOverRemaining ? "opacity-50 cursor-not-allowed" : ""}`}
                                                onClick={() => handleAmountSelect(quickAmount)}
                                                disabled={isOverRemaining || remainingAmount === 0}
                                            >
                                                ฿{formatAmount(quickAmount)}
                                            </Button>
                                        )
                                    })}
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
                                            max={remainingAmount !== null && remainingAmount > 0 ? remainingAmount : undefined}
                                        />
                                    </div>
                                    {remainingLoading && (
                                        <p className="text-xs text-gray-500">กำลังโหลดยอดคงเหลือ...</p>
                                    )}
                                    {!remainingLoading && remainingAmount !== null && (
                                        <p className="text-xs text-gray-600">
                                            ยอดคงเหลือที่ยังรับได้: ฿{formatAmount(String(remainingAmount))}
                                        </p>
                                    )}
                                    {amountError && <p className="text-xs text-red-600">{amountError}</p>}
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
                                onClick={() => setStep("warning")}
                                disabled={!amount || Number(amount) <= 0 || (remainingAmount !== null && Number(amount) > remainingAmount)}
                            >
                                ชำระเงิน ฿{amount ? formatAmount(amount) : "0"}
                            </Button>
                        </div>
                    )}

                    {step === "warning" && (
                        <div className="space-y-4">
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        1. วิธีการบริจาค
                                    </h4>
                                    <div className="space-y-2 text-sm text-blue-800">
                                        {paymentMethod === "qr" && (
                                            <>
                                                <p className="font-medium">• QR Code PromptPay</p>
                                                <p className="pl-4">- สแกน QR Code ด้วยแอปธนาคารของคุณ</p>
                                                <p className="pl-4">- ยืนยันการชำระเงิน</p>
                                                <p className="pl-4">- อัปโหลดสลิปการชำระเงิน</p>
                                            </>
                                        )}
                                        {paymentMethod === "bank" && (
                                            <>
                                                <p className="font-medium">• โอนเงินผ่านธนาคาร</p>
                                                <p className="pl-4">- เปิดแอปธนาคารของคุณ</p>
                                                <p className="pl-4">- เลือกโอนเงินและกรอกข้อมูลบัญชีปลายทาง</p>
                                                <p className="pl-4">- ระบุจำนวนเงินและยืนยันการโอน</p>
                                                <p className="pl-4">- อัปโหลดสลิปการโอนเงิน</p>
                                            </>
                                        )}
                                        {paymentMethod === "credit" && (
                                            <>
                                                <p className="font-medium">• บัตรเครดิต/เดบิต</p>
                                                <p className="pl-4">- กรอกข้อมูลบัตรเครดิต/เดบิต</p>
                                                <p className="pl-4">- ยืนยันการชำระเงิน</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
                                    <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5" />
                                        2. คำเตือนสำคัญ
                                    </h4>
                                    <div className="space-y-2 text-sm text-red-800">
                                        <p className="font-semibold">⚠️ การอัปโหลดสลิปปลอมหรือสลิปที่แก้ไข:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>ระบบจะตรวจสอบสลิปด้วยเทคโนโลยี AI และ OCR</li>
                                            <li>หากพบว่าสลิปเป็นของปลอมหรือถูกแก้ไข จะถูกปฏิเสธทันที</li>
                                            <li>บัญชีผู้ใช้จะถูกระงับการใช้งานชั่วคราวหรือถาวร</li>
                                            <li>อาจถูกเพิ่มเข้าในรายชื่อผู้ใช้ที่ถูกจำกัดสิทธิ์ (Restricted List)</li>
                                            <li>การกระทำนี้อาจผิดกฎหมายและมีผลทางกฎหมาย</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                                        <span className="text-xl">🙏</span>
                                        3. คำสอนทางพุทธศาสนา
                                    </h4>
                                    <div className="space-y-2 text-sm text-yellow-800 italic">
                                        <p className="font-medium">"การบริจาคด้วยใจบริสุทธิ์ย่อมนำมาซึ่งบุญกุศล"</p>
                                        <p>"การโกหกและหลอกลวงย่อมนำมาซึ่งทุกข์และบาปกรรม"</p>
                                        <p className="pt-2">ตามหลักธรรมในพระพุทธศาสนา การพูดเท็จ (มุสาวาท) เป็นหนึ่งในศีล 5 ที่ควรละเว้น</p>
                                        <p>การบริจาคด้วยความจริงใจและซื่อสัตย์จะสร้างกุศลกรรมที่ดีให้กับตนเอง</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="agreeTerms"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="mt-1 w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                        />
                                        <Label htmlFor="agreeTerms" className="text-sm text-gray-700 cursor-pointer flex-1">
                                            <span className="font-semibold">ฉันยืนยันว่า:</span>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                <li>เข้าใจวิธีการบริจาคที่เลือกแล้ว</li>
                                                <li>ตระหนักถึงผลกระทบของการอัปโหลดสลิปปลอม</li>
                                                <li>จะอัปโหลดสลิปที่ถูกต้องและเป็นจริงเท่านั้น</li>
                                                <li>ยอมรับว่าหากอัปโหลดสลิปปลอมจะถูกระงับบัญชี</li>
                                                <li>ยินดีปฏิบัติตามหลักธรรมทางพุทธศาสนาในการบริจาคด้วยความซื่อสัตย์</li>
                                            </ul>
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">จำนวนที่บริจาค</span>
                                    <span className="font-bold text-lg">฿{formatAmount(amount)}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                onClick={() => {
                                    setWarningStepTimestamp(new Date()) // บันทึกเวลาที่กดปุ่ม
                                    setStep("payment")
                                }}
                                disabled={!agreedToTerms}
                            >
                                ยืนยันและดำเนินการต่อ
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
<<<<<<< HEAD
<<<<<<< HEAD
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => promptpayId && copyToClipboard(promptpayId)}
                                                >
                                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </Button>
=======
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
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
<<<<<<< HEAD
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
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

                                    {/* Slip Upload (Required) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="slipUpload">แนบรูปภาพสลิปการชำระเงิน (จำเป็น)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="slipUpload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleSlipUpload}
                                                ref={slipInputRef}
                                                className="hidden"
                                            />
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={handlePickSlip}
                                            >
                                                อัปโหลดสลิป
                                            </Button>
                                        </div>
                                        {slipPreview && (
                                            <div className="mt-2">
                                                <img
                                                    src={slipPreview}
                                                    alt="Slip Preview"
                                                    className="w-full h-48 object-contain rounded-lg border"
                                                />
                                            </div>
                                        )}

                                        {slipResult && (
                                            <div
                                                className={`mt-3 p-4 rounded-lg border-2 ${
                                                    slipResult.decision === "rejected"
                                                        ? "bg-red-50 border-red-300"
                                                        : slipResult.decision === "approved"
                                                        ? "bg-green-50 border-green-300"
                                                        : "bg-yellow-50 border-yellow-300"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    {slipResult.decision === "approved" && (
                                                        <>
                                                            <ShieldCheck className="w-5 h-5 text-green-600" />
                                                            <span className="text-sm font-bold text-green-700">
                                                                ✅ ผ่านการตรวจสอบ (90%+)
                                                            </span>
                                                        </>
                                                    )}
                                                    {slipResult.decision === "rejected" && (
                                                        <>
                                                            <ShieldAlert className="w-5 h-5 text-red-600" />
                                                            <span className="text-sm font-bold text-red-700">
                                                                ❌ สลิปไม่ผ่าน - ไม่สามารถอัปโหลดได้
                                                            </span>
                                                        </>
                                                    )}
                                                    {slipResult.decision === "needs_review" && (
                                                        <>
                                                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                                            <span className="text-sm font-bold text-yellow-700">
                                                                ⚠️ ผ่านเบื้องต้น - ต้องให้ผู้สร้างคำขอตรวจสอบ
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                {slipResult.decision === "approved" && (
                                                    <p className="text-xs text-green-700 mb-2">
                                                        สลิปถูกต้องและครบถ้วน ระบบจะส่งให้ผู้สร้างคำขอตรวจสอบขั้นสุดท้าย
                                                    </p>
                                                )}
                                                {slipResult.decision === "rejected" && (
                                                    <>
                                                        <p className="text-xs text-red-700 mb-2 font-medium">
                                                            กรุณาอัปโหลดสลิปโอนเงินที่ถูกต้องและชัดเจน
                                                        </p>
                                                        <p className="text-xs text-red-600 mb-1">
                                                            <strong>เหตุผลที่ไม่ผ่าน:</strong> ด้านล่างคือรายการที่ระบบตรวจพบ กรุณาแก้ไขตามนั้นแล้วอัปโหลดใหม่
                                                        </p>
                                                    </>
                                                )}
                                                {slipResult.decision === "needs_review" && (
                                                    <p className="text-xs text-yellow-700 mb-2">
                                                        สลิปดูเหมือนจริง แต่มีบางอย่างคลาดเคลื่อนเล็กน้อย ผู้สร้างคำขอจะตรวจสอบอีกครั้ง
                                                    </p>
                                                )}
                                                {slipResult.reasons?.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-medium text-gray-700 mb-1">รายละเอียด:</p>
                                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                                            {slipResult.reasons.map((r, i) => (
                                                                <li 
                                                                    key={i}
                                                                    className={
                                                                        slipResult.decision === "rejected" 
                                                                            ? "text-red-700" 
                                                                            : slipResult.decision === "approved"
                                                                            ? "text-green-700"
                                                                            : "text-yellow-700"
                                                                    }
                                                                >
                                                                    {r}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {slipResult.decision === "rejected" && (slipResult._debug || slipResult.ocrPreview) && (
                                                    <div className="mt-3 pt-3 border-t border-red-200">
                                                        <p className="text-xs font-medium text-gray-700 mb-1">ข้อมูลที่ระบบดึงจากสลิปได้:</p>
                                                        <ul className="text-xs text-gray-600 space-y-0.5">
                                                            {slipResult._debug?.ocrAmount != null && (
                                                                <li>• จำนวนเงินที่อ่านได้: ฿{Number(slipResult._debug.ocrAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</li>
                                                            )}
                                                            {slipResult._debug?.ocrDate && (
                                                                <li>• วันที่ที่อ่านได้: {slipResult._debug.ocrDate}</li>
                                                            )}
                                                            {slipResult._debug?.hasSlipEvidence != null && (
                                                                <li>• สแกน QR ในสลิปได้: {slipResult._debug.hasSlipEvidence ? "ใช่" : "ไม่"}</li>
                                                            )}
                                                            {slipResult.ocrPreview && (
                                                                <li className="mt-1 break-all">• ข้อความจาก OCR (ส่วนต้น): &quot;{slipResult.ocrPreview.slice(0, 120)}{slipResult.ocrPreview.length > 120 ? "…" : ""}&quot;</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                        onClick={handlePayment}
<<<<<<< HEAD
<<<<<<< HEAD
                                        disabled={
                                            isProcessing ||
                                            verifying ||
                                            !!qrError ||
                                            !slipFile ||
                                            slipResult?.decision === "rejected" ||
                                            (remainingAmount !== null && Number(amount) > remainingAmount)
                                        }
=======
                                        disabled={isProcessing || !!qrError}
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
                                        disabled={isProcessing || !!qrError}
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
                                    >
                                        {verifying ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                กำลังตรวจสอบสลิป...
                                            </>
                                        ) : isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                กำลังตรวจสอบการชำระเงิน...
                                            </>
                                        ) : (
                                            "ยืนยัน"
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

                                    {/* Slip Upload (Required) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="slipUploadBank">แนบรูปภาพสลิปการโอนเงิน (จำเป็น)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="slipUploadBank"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleSlipUpload}
                                                ref={slipInputRef}
                                                className="hidden"
                                            />
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={handlePickSlip}
                                            >
                                                อัปโหลดสลิป
                                            </Button>
                                        </div>
                                        {slipPreview && (
                                            <div className="mt-2">
                                                <img
                                                    src={slipPreview}
                                                    alt="Slip Preview"
                                                    className="w-full h-48 object-contain rounded-lg border"
                                                />
                                            </div>
                                        )}

                                        {slipResult && (
                                            <div
                                                className={`mt-3 p-4 rounded-lg border-2 ${
                                                    slipResult.decision === "rejected"
                                                        ? "bg-red-50 border-red-300"
                                                        : slipResult.decision === "approved"
                                                        ? "bg-green-50 border-green-300"
                                                        : "bg-yellow-50 border-yellow-300"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    {slipResult.decision === "approved" && (
                                                        <>
                                                            <ShieldCheck className="w-5 h-5 text-green-600" />
                                                            <span className="text-sm font-bold text-green-700">
                                                                ✅ ผ่านการตรวจสอบ (90%+)
                                                            </span>
                                                        </>
                                                    )}
                                                    {slipResult.decision === "rejected" && (
                                                        <>
                                                            <ShieldAlert className="w-5 h-5 text-red-600" />
                                                            <span className="text-sm font-bold text-red-700">
                                                                ❌ สลิปไม่ผ่าน - ไม่สามารถอัปโหลดได้
                                                            </span>
                                                        </>
                                                    )}
                                                    {slipResult.decision === "needs_review" && (
                                                        <>
                                                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                                            <span className="text-sm font-bold text-yellow-700">
                                                                ⚠️ ผ่านเบื้องต้น - ต้องให้ผู้สร้างคำขอตรวจสอบ
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                {slipResult.decision === "approved" && (
                                                    <p className="text-xs text-green-700 mb-2">
                                                        สลิปถูกต้องและครบถ้วน ระบบจะส่งให้ผู้สร้างคำขอตรวจสอบขั้นสุดท้าย
                                                    </p>
                                                )}
                                                {slipResult.decision === "rejected" && (
                                                    <>
                                                        <p className="text-xs text-red-700 mb-2 font-medium">
                                                            กรุณาอัปโหลดสลิปโอนเงินที่ถูกต้องและชัดเจน
                                                        </p>
                                                        <p className="text-xs text-red-600 mb-1">
                                                            <strong>เหตุผลที่ไม่ผ่าน:</strong> ด้านล่างคือรายการที่ระบบตรวจพบ กรุณาแก้ไขตามนั้นแล้วอัปโหลดใหม่
                                                        </p>
                                                    </>
                                                )}
                                                {slipResult.decision === "needs_review" && (
                                                    <p className="text-xs text-yellow-700 mb-2">
                                                        สลิปดูเหมือนจริง แต่มีบางอย่างคลาดเคลื่อนเล็กน้อย ผู้สร้างคำขอจะตรวจสอบอีกครั้ง
                                                    </p>
                                                )}
                                                {slipResult.reasons?.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-medium text-gray-700 mb-1">รายละเอียด:</p>
                                                        <ul className="list-disc pl-5 text-sm space-y-1">
                                                            {slipResult.reasons.map((r, i) => (
                                                                <li 
                                                                    key={i}
                                                                    className={
                                                                        slipResult.decision === "rejected" 
                                                                            ? "text-red-700" 
                                                                            : slipResult.decision === "approved"
                                                                            ? "text-green-700"
                                                                            : "text-yellow-700"
                                                                    }
                                                                >
                                                                    {r}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {slipResult.decision === "rejected" && (slipResult._debug || slipResult.ocrPreview) && (
                                                    <div className="mt-3 pt-3 border-t border-red-200">
                                                        <p className="text-xs font-medium text-gray-700 mb-1">ข้อมูลที่ระบบดึงจากสลิปได้:</p>
                                                        <ul className="text-xs text-gray-600 space-y-0.5">
                                                            {slipResult._debug?.ocrAmount != null && (
                                                                <li>• จำนวนเงินที่อ่านได้: ฿{Number(slipResult._debug.ocrAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</li>
                                                            )}
                                                            {slipResult._debug?.ocrDate && (
                                                                <li>• วันที่ที่อ่านได้: {slipResult._debug.ocrDate}</li>
                                                            )}
                                                            {slipResult._debug?.hasSlipEvidence != null && (
                                                                <li>• สแกน QR ในสลิปได้: {slipResult._debug.hasSlipEvidence ? "ใช่" : "ไม่"}</li>
                                                            )}
                                                            {slipResult.ocrPreview && (
                                                                <li className="mt-1 break-all">• ข้อความจาก OCR (ส่วนต้น): &quot;{slipResult.ocrPreview.slice(0, 120)}{slipResult.ocrPreview.length > 120 ? "…" : ""}&quot;</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                        onClick={handlePayment}
                                        disabled={
                                            isProcessing ||
                                            verifying ||
                                            !slipFile ||
                                            slipResult?.decision === "rejected" ||
                                            (remainingAmount !== null && Number(amount) > remainingAmount)
                                        }
                                    >
                                        {verifying ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                กำลังตรวจสอบสลิป...
                                            </>
                                        ) : isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                กำลังตรวจสอบการโอนเงิน...
                                            </>
                                        ) : (
                                            "ยืนยัน"
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