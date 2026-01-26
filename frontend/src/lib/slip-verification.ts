/**
 * ระบบตรวจสอบสลิปการโอนเงิน (สำเนาจาก donation-modal.tsx)
 * 
 * ระบบตรวจสอบ 3 ระดับ:
 * - สีแดง (rejected): สลิปปลอมหรือรูปที่ไม่ใช่สลิป - ป้องกันการอัปโหลด
 * - สีเหลือง (needs_review): สลิปจริงแต่มีบางอย่างคลาดเคลื่อน - อนุญาตให้อัปโหลดได้
 * - สีเขียว (approved): ผ่าน ตรง 90% - อนุมัติอัตโนมัติ
 */

export type SlipDecision = "approved" | "rejected" | "needs_review" // approved=เขียว, needs_review=เหลือง, rejected=แดง

export interface VerifyResult {
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

export interface VerifySlipOptions {
    /** URL ของรูปภาพสลิป (เช่น จาก URL.createObjectURL) */
    slipImageUrl: string
    /** จำนวนเงินที่ต้องการตรวจสอบ (ถ้ามี) */
    requiredAmount?: number | null
}

/**
 * ตรวจสอบสลิปด้วยระบบ 3 ระดับ
 * 
 * @param options - ตัวเลือกสำหรับการตรวจสอบ
 * @returns ผลการตรวจสอบพร้อม decision และ reasons
 */
export async function verifySlip(options: VerifySlipOptions): Promise<VerifyResult> {
    const { slipImageUrl, requiredAmount = null } = options

    if (!slipImageUrl) {
        return { decision: "rejected", reasons: ["ยังไม่มีสลิปให้ตรวจ"] }
    }

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.crossOrigin = "anonymous"
        i.onload = () => resolve(i)
        i.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"))
        i.src = slipImageUrl
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

    const required = requiredAmount

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
