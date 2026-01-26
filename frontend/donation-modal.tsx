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
    const [step, setStep] = useState<"method" | "amount" | "payment" | "success">("method")
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
    const slipInputRef = useRef<HTMLInputElement>(null)

    const { user } = useAuth()

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

    const [cardNumber, setCardNumber] = useState("")
    const [expiryDate, setExpiryDate] = useState("")
    const [cvv, setCvv] = useState("")
    const [cardName, setCardName] = useState("")

    const quickAmounts = ["100", "500", "1000", "2000", "5000"]

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
    }

    // Generate QR Code from PromptPay number (client-only dynamic import)
    useEffect(() => {
        const shouldGenerate = step === "payment" && paymentMethod === "qr" && !!amount && Number(amount) > 0
        if (!shouldGenerate) {
            setQrCodeUrl("")
            setQrError("")
            return
        }

        const generateQRCode = async () => {
            try {
                setQrError("")
                setQrCodeUrl("")

                if (!promptpayId) {
                    throw new Error("ไม่มีเลขพร้อมเพย์สำหรับคำขอบริจาคนี้")
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
                }

                // Robust dynamic import (handles CJS/ESM)
                const mod: any = await import("qrcode")
                const QRCode = mod?.default ?? mod

                // Generate EMVCo PromptPay payload
                const payload = generatePromptPayPayload({
                    phoneOrId: target,
                    amount: Number(amount),
                })

                const qrUrl = await QRCode.toDataURL(payload, {
                    width: 300,
                    margin: 2,
                    color: { dark: "#000000", light: "#FFFFFF" },
                })
                setQrCodeUrl(qrUrl)
            } catch (error) {
                console.error("Error generating QR code:", error)
                setQrError("ไม่สามารถสร้าง QR Code ได้")
            }
        }

        generateQRCode()
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
     * ตรวจสอบสลิปด้วยระบบ 3 ระดับ:
     * - สีแดง (rejected): สลิปปลอมหรือรูปที่ไม่ใช่สลิป - ป้องกันการอัปโหลด
     * - สีเหลือง (needs_review): สลิปจริงแต่มีบางอย่างคลาดเคลื่อน - อนุญาตให้อัปโหลดได้
     * - สีเขียว (approved): ผ่าน ตรง 90% - อนุมัติอัตโนมัติ
     */
    const verifySlipClient = async (): Promise<VerifyResult> => {
        if (!slipPreview) {
            return { decision: "rejected", reasons: ["ยังไม่มีสลิปให้ตรวจ"] }
        }

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image()
            i.crossOrigin = "anonymous"
            i.onload = () => resolve(i)
            i.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"))
            i.src = slipPreview
        })

        const reasons: string[] = []
        const suspiciousEdits: string[] = []
        let hasQR = false
        let ocrText = ""

        // ========== 1. ตรวจสอบ EXIF Metadata (ร่องรอยการแก้ไข) ==========
        try {
            const exifr = await import("exifr")
            // @ts-ignore
            const meta = await exifr.parse(img).catch(() => undefined)
            const software = (meta as any)?.Software || (meta as any)?.software
            if (software && typeof software === "string") {
                const edits = ["Photoshop", "PicsArt", "Snapseed", "Canva", "GIMP", "Pixelmator", "Lightroom"]
                if (edits.some((e) => software.includes(e))) {
                    suspiciousEdits.push(`พบร่องรอยแก้ไขภาพ (Software: ${software})`)
                }
            }
        } catch (_) {
            // ข้ามได้ถ้าไม่มีไลบรารี
        }

        // ========== 2. ตรวจสอบ QR Code ==========
        try {
            const canvas = document.createElement("canvas")
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext("2d")
            if (ctx) {
                ctx.drawImage(img, 0, 0)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const { default: jsqr } = await import("jsqr")
                const qr = jsqr(imageData.data, imageData.width, imageData.height)
                hasQR = Boolean(qr)
            }
        } catch (_) {
            // ข้ามได้
        }

        // ลองตรวจ QR อีกครั้งด้วยขนาดที่เล็กลง (ถ้ายังไม่เจอ)
        if (!hasQR) {
            try {
                const targetWidth = Math.min(800, img.naturalWidth)
                const scale = targetWidth / img.naturalWidth
                const canvas = document.createElement("canvas")
                canvas.width = targetWidth
                canvas.height = Math.floor(img.naturalHeight * scale)
                const ctx = canvas.getContext("2d")
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                    const { default: jsqr } = await import("jsqr")
                    const qr = jsqr(imageData.data, imageData.width, imageData.height)
                    hasQR = Boolean(qr)
                }
            } catch (_) {
                // ข้ามได้
            }
        }

        // ========== 3. OCR - อ่านข้อความจากสลิป ==========
        try {
            const tesseract = await import("tesseract.js")
            // @ts-ignore
            const res = await tesseract.recognize(img, "tha+eng", { logger: () => {} }).catch(() => null)
            ocrText = res?.data?.text?.replace(/\s+/g, " ").trim() || ""
        } catch (_) {
            // ข้ามได้
        }

        // ========== 4. ตรวจสอบคำสำคัญที่บ่งบอกว่าเป็นสลิป ==========
        // คำสำคัญที่บ่งบอกว่าเป็นสลิปโอนเงิน (ต้องมีอย่างน้อย 2-3 คำ)
        const essentialTokens = [
            // ภาษาไทย
            "โอน", "โอนเงิน", "โอนสำเร็จ", "โอนเงินสำเร็จ",
            "บัญชี", "เลขที่บัญชี", "บัญชีผู้รับ",
            "บาท", "จำนวน", "จำนวนเงิน",
            "เวลา", "วันที่", "วันเวลา",
            "พร้อมเพย์", "PromptPay", "พร้อมเพย์",
            "ธนาคาร", "ธ.", "ธนาคารไทย",
            "กสิกร", "กรุงเทพ", "กรุงไทย", "ไทยพาณิชย์", "SCB", "KBANK", "BBL", "KTB",
            "Transaction", "Reference", "เลขที่รายการ",
            "Transfer", "Amount", "Fee", "ค่าธรรมเนียม",
            "สำเร็จ", "Success", "Completed"
        ]
        
        const foundTokens = ocrText ? essentialTokens.filter((t) => 
            ocrText.toLowerCase().includes(t.toLowerCase())
        ) : []

        // ========== 5. หาจำนวนเงินจาก OCR ==========
        let ocrAmount: number | null = null
        if (ocrText) {
            // รูปแบบ: "100.00 บาท", "1,000 บาท", "100 บาท"
            const amountPatterns = [
                /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*บาท/,
                /จำนวน[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
                /Amount[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
            ]
            
            for (const pattern of amountPatterns) {
                const match = ocrText.match(pattern)
                if (match) {
                    ocrAmount = parseFloat(match[1].replace(/,/g, ""))
                    break
                }
            }
        }

        // ========== 6. หาวันที่จาก OCR ==========
        const parseDateFromText = (text: string) => {
            const todayYear = new Date().getFullYear()
            const normalizeYear = (yearRaw: number) => {
                if (yearRaw >= 2400) return yearRaw - 543 // พ.ศ. เป็น ค.ศ.
                if (yearRaw < 100) {
                    const adCandidate = 2000 + yearRaw
                    const beCandidate = 1957 + yearRaw
                    return Math.abs(adCandidate - todayYear) <= Math.abs(beCandidate - todayYear)
                        ? adCandidate
                        : beCandidate
                }
                return yearRaw
            }

            // รูปแบบ: DD/MM/YYYY, DD-MM-YYYY
            const numericMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
            if (numericMatch) {
                const day = Number(numericMatch[1])
                const month = Number(numericMatch[2])
                const yearRaw = Number(numericMatch[3])
                const year = normalizeYear(yearRaw)
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                    return new Date(year, month - 1, day)
                }
            }
            
            // รูปแบบ: YYYY/MM/DD, YYYY-MM-DD
            const isoMatch = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
            if (isoMatch) {
                const year = normalizeYear(Number(isoMatch[1]))
                const month = Number(isoMatch[2])
                const day = Number(isoMatch[3])
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                    return new Date(year, month - 1, day)
                }
            }

            // รูปแบบ: DD ม.ค. YYYY, DD มกราคม YYYY
            const thaiMonths: Record<string, number> = {
                "ม.ค": 1, "มค": 1, "มกราคม": 1,
                "ก.พ": 2, "กพ": 2, "กุมภาพันธ์": 2,
                "มี.ค": 3, "มีค": 3, "มีนาคม": 3,
                "เม.ย": 4, "เมย": 4, "เมษายน": 4,
                "พ.ค": 5, "พค": 5, "พฤษภาคม": 5,
                "มิ.ย": 6, "มิย": 6, "มิถุนายน": 6,
                "ก.ค": 7, "กค": 7, "กรกฎาคม": 7,
                "ส.ค": 8, "สค": 8, "สิงหาคม": 8,
                "ก.ย": 9, "กย": 9, "กันยายน": 9,
                "ต.ค": 10, "ตค": 10, "ตุลาคม": 10,
                "พ.ย": 11, "พย": 11, "พฤศจิกายน": 11,
                "ธ.ค": 12, "ธค": 12, "ธันวาคม": 12,
            }
            const thaiMatch = text.match(
                /(\d{1,2})\s*(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(\d{2,4})/,
            )
            if (thaiMatch) {
                const day = Number(thaiMatch[1])
                const monthKey = thaiMatch[2].replace(/\./g, "")
                const month = thaiMonths[thaiMatch[2]] ?? thaiMonths[monthKey]
                const yearRaw = Number(thaiMatch[3])
                const year = normalizeYear(yearRaw)
                if (month && day >= 1 && day <= 31) {
                    return new Date(year, month - 1, day)
                }
            }
            return null
        }

        const ocrDate = ocrText ? parseDateFromText(ocrText) : null
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const ocrDateOnly = ocrDate ? new Date(ocrDate.getFullYear(), ocrDate.getMonth(), ocrDate.getDate()) : null
        const isSameDay = ocrDateOnly && ocrDateOnly.getTime() === today.getTime()
        
        // อนุญาตให้คลาดเคลื่อนได้ 1-2 วัน (สำหรับสลิปที่อัปโหลดช้า)
        const isWithin2Days = ocrDateOnly ? Math.abs((ocrDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) <= 2 : false

        const required = amount ? Number(amount) : null

        // ========== 7. คำนวณคะแนนการตรวจสอบ ==========
        let score = 0
        const maxScore = 100

        // QR Code (30 คะแนน)
        if (hasQR) score += 30

        // คำสำคัญ (25 คะแนน) - ต้องมีอย่างน้อย 3 คำ
        if (foundTokens.length >= 3) score += 25
        else if (foundTokens.length >= 2) score += 15
        else if (foundTokens.length >= 1) score += 5

        // จำนวนเงิน (25 คะแนน)
        if (ocrAmount !== null) {
            if (required !== null) {
                // ตรวจสอบความคลาดเคลื่อน (อนุญาต ±1 บาท)
                const diff = Math.abs(ocrAmount - required)
                if (diff === 0) score += 25
                else if (diff <= 1) score += 20 // คลาดเคลื่อนเล็กน้อย
                else if (diff <= 10) score += 10 // คลาดเคลื่อนปานกลาง
                // ถ้าคลาดเคลื่อนมากกว่า 10 บาท ไม่ให้คะแนน
            } else {
                score += 15 // มีจำนวนเงินแต่ไม่มีค่าที่ต้องตรวจสอบ
            }
        }

        // วันที่ (20 คะแนน)
        if (ocrDate !== null) {
            if (isSameDay) score += 20
            else if (isWithin2Days) score += 15 // คลาดเคลื่อน 1-2 วัน
            else score += 5 // มีวันที่แต่ไม่ตรง
        }

        // ========== 8. ตรวจสอบว่าเป็นสลิปจริงหรือไม่ ==========
        const errors: string[] = []
        const warnings: string[] = []

        // ตรวจสอบร่องรอยการแก้ไข (Critical - สีแดง)
        if (suspiciousEdits.length > 0) {
            errors.push(...suspiciousEdits)
        }

        // ตรวจสอบว่าเป็นสลิปจริงหรือไม่ (Critical - สีแดง)
        // ต้องมีอย่างน้อย 1 ใน 3: QR Code, คำสำคัญ 2+ คำ, หรือจำนวนเงิน
        const hasSlipEvidence = hasQR || foundTokens.length >= 2 || ocrAmount !== null
        
        if (!hasSlipEvidence) {
            // ถ้าไม่มีหลักฐานเลยว่าเป็นสลิป = สีแดง
            errors.push("ไม่พบหลักฐานว่าเป็นสลิปโอนเงิน - กรุณาอัปโหลดสลิปที่ถูกต้อง")
        } else if (foundTokens.length === 0 && !hasQR && ocrAmount === null) {
            // มีหลักฐานน้อยมาก = สีแดง
            errors.push("ไม่พบข้อมูลสำคัญจากสลิป - กรุณาตรวจสอบความชัดเจนของรูปภาพ")
        }

        // ตรวจสอบจำนวนเงิน (Warning หรือ Error ขึ้นอยู่กับความคลาดเคลื่อน)
        // หมายเหตุ: การตัดสินใจสีแดง/เหลือง/เขียวจะทำในส่วนที่ 9 ตามเกณฑ์ที่เข้มงวด
        if (required !== null) {
            if (ocrAmount === null) {
                warnings.push("อ่านจำนวนเงินจากสลิปไม่ชัดเจน - กรุณาตรวจสอบว่าจำนวนเงินถูกต้อง")
            } else {
                const diff = Math.abs(ocrAmount - required)
                if (diff > 10) {
                    // คลาดเคลื่อนมากกว่า 10 บาท = จะเป็น Error ในส่วนตัดสินใจ
                    warnings.push(`จำนวนเงินไม่ตรงกัน: สลิปแสดง ${ocrAmount.toLocaleString("th-TH")} บาท, ควรเป็น ${required.toLocaleString("th-TH")} บาท (คลาดเคลื่อน ${diff} บาท)`)
                } else if (diff > 1) {
                    warnings.push(`จำนวนเงินคลาดเคลื่อนเล็กน้อย: สลิปแสดง ${ocrAmount.toLocaleString("th-TH")} บาท, ควรเป็น ${required.toLocaleString("th-TH")} บาท (คลาดเคลื่อน ${diff} บาท)`)
                }
            }
        }

        // ตรวจสอบวันที่ (Warning เท่านั้น - ไม่เป็น Error เพราะอาจอัปโหลดช้า)
        if (ocrDate === null) {
            warnings.push("อ่านวันที่จากสลิปไม่ชัดเจน")
        } else if (!isSameDay && !isWithin2Days) {
            warnings.push(`วันที่ทำรายการ: ${ocrDate.toLocaleDateString("th-TH")} (อาจเป็นสลิปเก่า)`)
        }

        // Warning เพิ่มเติม
        if (!hasQR && foundTokens.length < 2) {
            warnings.push("ไม่พบ QR Code และคำสำคัญน้อย - กรุณาตรวจสอบความชัดเจนของสลิป")
        } else if (!hasQR) {
            warnings.push("ไม่พบ QR Code ในสลิป")
        }

        // ========== 9. ตัดสินใจตามคะแนนและเงื่อนไข ==========
        let decision: SlipDecision = "rejected"

        // ตรวจสอบจำนวนเงินสำหรับสีเหลือง/เขียว (ต้องตรงหรือคลาดเคลื่อน ≤ 10 บาท)
        const amountDiff = required !== null && ocrAmount !== null ? Math.abs(ocrAmount - required) : null
        const amountOkForYellow = amountDiff === null || amountDiff <= 10 // อนุญาตคลาดเคลื่อน ≤ 10 บาท

        // สีแดง (rejected): มี Error หรือคะแนน < 80 หรือจำนวนเงินคลาดเคลื่อน > 10 บาท
        if (errors.length > 0) {
            decision = "rejected"
        } else if (score < 80) {
            // คะแนนต่ำกว่า 80 = ไม่ผ่าน
            decision = "rejected"
            errors.push("คะแนนการตรวจสอบต่ำเกินไป - กรุณาตรวจสอบความชัดเจนของสลิป")
        } else if (required !== null && !amountOkForYellow) {
            // จำนวนเงินคลาดเคลื่อนมากกว่า 10 บาท = สีแดง
            decision = "rejected"
            errors.push(`จำนวนเงินไม่ตรงกันมากเกินไป: สลิปแสดง ${ocrAmount?.toLocaleString("th-TH") || "ไม่พบ"} บาท, ควรเป็น ${required.toLocaleString("th-TH")} บาท (คลาดเคลื่อน ${amountDiff} บาท)`)
        }
        // สีเขียว (approved): คะแนนสูง (≥90) และผ่านเงื่อนไขสำคัญ
        else if (score >= 90 && hasQR && foundTokens.length >= 2 && ocrAmount !== null && required !== null && amountDiff !== null && amountDiff <= 1) {
            decision = "approved"
        }
        // สีเหลือง (needs_review): คะแนน ≥ 80 และจำนวนเงินคลาดเคลื่อน ≤ 10 บาท
        else if (score >= 80 && amountOkForYellow) {
            decision = "needs_review"
        }
        // ถ้าไม่เข้าเงื่อนไขใดๆ = สีแดง
        else {
            decision = "rejected"
            if (!errors.some(e => e.includes("คะแนน") || e.includes("จำนวนเงิน"))) {
                errors.push("ไม่ผ่านเกณฑ์การตรวจสอบ - กรุณาตรวจสอบสลิปและอัปโหลดใหม่อีกครั้ง")
            }
        }

        // รวม reasons
        const allReasons = [...errors, ...warnings]
        if (allReasons.length === 0 && decision === "approved") {
            allReasons.push("✅ ตรวจสอบผ่าน - สลิปถูกต้องและครบถ้วน")
        }

        return { 
            decision, 
            reasons: allReasons, 
            hasQR, 
            ocrPreview: ocrText.slice(0, 300),
            // เพิ่มข้อมูลเพิ่มเติมสำหรับ debug
            _debug: {
                score,
                foundTokens: foundTokens.slice(0, 5),
                ocrAmount,
                ocrDate: ocrDate ? ocrDate.toLocaleDateString("th-TH") : null,
                hasSlipEvidence
            }
        }
    }

    const handlePayment = async () => {
        setIsProcessing(true)

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

        if (user && amount) {
            const donationAmount = Number(amount)
            const earnedPoints = pointsSystem.calculateDonationPoints(donationAmount, "money")
            pointsSystem.addPoints(user.id, earnedPoints, "donation", `Money donation ฿${donationAmount}`, `donation_${Date.now()}`)
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
                    paymentMethod === "qr" ? "PromptPay" : paymentMethod === "credit" ? "Credit Card" : "Bank Transfer",
                transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                message,
                isAnonymous,
                pointsEarned: earnedPoints,
            })

            // Keep existing localStorage logic for backward compatibility
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
                    paymentMethod === "qr" ? "PromptPay" : paymentMethod === "credit" ? "Credit Card" : "Bank Transfer",
                pointsEarned: earnedPoints,
            }

            const existingDonations = JSON.parse(localStorage.getItem(`user_donations_${user.id}`) || "[]")
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
        setSlipFile(null)
        setSlipPreview(null)
        setSlipResult(null)
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
                                        className={`w-full p-4 border rounded-lg text-left transition-all ${paymentMethod === "qr" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
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
                                onClick={() => setStep("payment")}
                                disabled={!amount || Number(amount) <= 0 || (remainingAmount !== null && Number(amount) > remainingAmount)}
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
                                        <p className="text-sm text-gray-600 mt-2 font-medium">สแกน QR Code ด้วยแอปธนาคารของคุณ</p>
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
                                                    <span className="font-mono font-medium text-gray-800">{bankAccount.accountNumber}</span>
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
                                                <span className="font-medium text-gray-800 text-right">{bankAccount.accountName}</span>
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
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => promptpayId && copyToClipboard(promptpayId)}
                                                >
                                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </Button>
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
                                            <li>4. ยืนยันการชำระเงิน</li>
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
                                                    <p className="text-xs text-red-700 mb-2 font-medium">
                                                        กรุณาอัปโหลดสลิปโอนเงินที่ถูกต้องและชัดเจน
                                                    </p>
                                                )}
                                                {slipResult.decision === "needs_review" && (
                                                    <p className="text-xs text-yellow-700 mb-2">
                                                        สลิปดูเหมือนจริง แต่มีบางอย่างคลาดเคลื่อนเล็กน้อย ผู้สร้างคำขอจะตรวจสอบอีกครั้ง
                                                    </p>
                                                )}
                                                {slipResult.reasons?.length > 0 && (
                                                    <div className="mt-2">
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
                                            </div>
                                        )}

                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-xs text-blue-800 font-medium mb-2">
                                                📋 มาตรฐานการตรวจสอบสลิป:
                                            </p>
                                            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
                                                <li><span className="font-semibold text-green-600">สีเขียว:</span> ผ่าน 90%+ (มี QR, จำนวนเงินตรง, วันที่ตรง)</li>
                                                <li><span className="font-semibold text-yellow-600">สีเหลือง:</span> สลิปจริงแต่คลาดเคลื่อนเล็กน้อย (ให้ผู้สร้างคำขอตรวจสอบ)</li>
                                                <li><span className="font-semibold text-red-600">สีแดง:</span> สลิปปลอมหรือรูปที่ไม่ใช่สลิป (ไม่สามารถอัปโหลดได้)</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                        onClick={handlePayment}
                                        disabled={
                                            isProcessing ||
                                            verifying ||
                                            !!qrError ||
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
                                            <li>4. ระบุจำนวนเงินที่ต้องการโอน</li>
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
                                                    <p className="text-xs text-red-700 mb-2 font-medium">
                                                        กรุณาอัปโหลดสลิปโอนเงินที่ถูกต้องและชัดเจน
                                                    </p>
                                                )}
                                                {slipResult.decision === "needs_review" && (
                                                    <p className="text-xs text-yellow-700 mb-2">
                                                        สลิปดูเหมือนจริง แต่มีบางอย่างคลาดเคลื่อนเล็กน้อย ผู้สร้างคำขอจะตรวจสอบอีกครั้ง
                                                    </p>
                                                )}
                                                {slipResult.reasons?.length > 0 && (
                                                    <div className="mt-2">
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
                                            </div>
                                        )}

                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-xs text-blue-800 font-medium mb-2">
                                                📋 มาตรฐานการตรวจสอบสลิป:
                                            </p>
                                            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
                                                <li><span className="font-semibold text-green-600">สีเขียว:</span> ผ่าน 90%+ (มี QR, จำนวนเงินตรง, วันที่ตรง)</li>
                                                <li><span className="font-semibold text-yellow-600">สีเหลือง:</span> สลิปจริงแต่คลาดเคลื่อนเล็กน้อย (ให้ผู้สร้างคำขอตรวจสอบ)</li>
                                                <li><span className="font-semibold text-red-600">สีแดง:</span> สลิปปลอมหรือรูปที่ไม่ใช่สลิป (ไม่สามารถอัปโหลดได้)</li>
                                            </ul>
                                        </div>
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
                                    <p className="text-sm text-yellow-600">คุณได้รับคะแนนจากการบริจาค สามารถนำไปแลกรางวัลได้</p>
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
