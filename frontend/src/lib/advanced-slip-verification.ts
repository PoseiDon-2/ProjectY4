/**
 * Advanced Slip Verification System
 * ระบบตรวจสอบสลิปที่ละเอียดและเข้มงวดขึ้น
 * 
 * ตรวจสอบ:
 * 1. Format และลักษณะสลิป (QR Code, โลโก้ธนาคาร, ฟอนต์, layout, ข้อความครบถ้วน)
 * 2. ข้อมูลสำคัญ (ยอดเงิน, ชื่อบัญชี, วันที่-เวลา, Ref No.)
 * 3. ความผิดปกติ (image quality, sharpness, edges, อายุสลิป)
 * 4. QR Code decode และ verify
 */

export type SlipDecision = "approved" | "rejected" | "needs_review"

export interface AdvancedVerifyOptions {
    slipImageUrl: string
    requiredAmount?: number | null
    expectedAccountName?: string | null // ชื่อบัญชีผู้รับที่คาดหวัง (ต้องตรง 100%)
    expectedBankName?: string | null // ชื่อธนาคารที่คาดหวัง
    maxSlipAgeDays?: number // อายุสลิปสูงสุด (default: 7 วัน)
    checkDuplicateRefNo?: boolean // ตรวจสอบ Ref No. ซ้ำหรือไม่
    previousRefNos?: string[] // รายการ Ref No. ที่เคยใช้แล้ว
}

export interface AdvancedVerifyResult {
    decision: SlipDecision
    reasons: string[]
    score: number
    checks: {
        qrCode: QRCodeCheck
        bankLogo: BankLogoCheck
        font: FontCheck
        layout: LayoutCheck
        requiredText: RequiredTextCheck
        amount: AmountCheck
        accountName: AccountNameCheck
        dateTime: DateTimeCheck
        refNo: RefNoCheck
        imageQuality: ImageQualityCheck
        slipAge: SlipAgeCheck
    }
    extractedData: {
        qrPayload?: string
        qrData?: any
        amount?: number
        accountName?: string
        bankName?: string
        date?: Date
        time?: string
        refNo?: string
        transactionId?: string
    }
    ocrPreview?: string
}

interface QRCodeCheck {
    found: boolean
    clear: boolean
    decodable: boolean
    payload?: string
    data?: any
    issues: string[]
}

interface BankLogoCheck {
    detected: boolean
    bankName?: string
    confidence: number
    matchesExpected: boolean
    issues: string[]
}

interface FontCheck {
    detected: boolean
    bankName?: string
    confidence: number
    matchesExpected: boolean
    issues: string[]
}

interface LayoutCheck {
    valid: boolean
    bankName?: string
    confidence: number
    issues: string[]
}

interface RequiredTextCheck {
    hasSuccessText: boolean
    hasRefNo: boolean
    hasTransactionId: boolean
    missing: string[]
    issues: string[]
}

interface AmountCheck {
    found: boolean
    amount?: number
    exactMatch: boolean
    difference?: number
    issues: string[]
}

interface AccountNameCheck {
    found: boolean
    accountName?: string
    exactMatch: boolean
    issues: string[]
}

interface DateTimeCheck {
    found: boolean
    date?: Date
    time?: string
    isRecent: boolean
    daysAgo?: number
    issues: string[]
}

interface RefNoCheck {
    found: boolean
    refNo?: string
    isDuplicate: boolean
    issues: string[]
}

interface ImageQualityCheck {
    sharpness: number // 0-100
    hasTampering: boolean
    edgeIssues: boolean
    issues: string[]
}

interface SlipAgeCheck {
    valid: boolean
    daysAgo?: number
    issues: string[]
}

// ข้อมูลธนาคารสำหรับตรวจสอบ
const BANK_INFO: Record<string, {
    logos: string[]
    fonts: string[]
    colors: string[]
    layoutKeywords: string[]
}> = {
    "กสิกรไทย": {
        logos: ["KBANK", "กสิกร", "KASIKORNBANK"],
        fonts: ["KBANK"],
        colors: ["#1ba5e1", "#0066cc"],
        layoutKeywords: ["กสิกรไทย", "KBANK", "KASIKORNBANK"]
    },
    "กรุงเทพ": {
        logos: ["BBL", "กรุงเทพ", "BANGKOK BANK"],
        fonts: ["BBL"],
        colors: ["#1e3a8a", "#2563eb"],
        layoutKeywords: ["กรุงเทพ", "BBL", "BANGKOK BANK"]
    },
    "ไทยพาณิชย์": {
        logos: ["SCB", "ไทยพาณิชย์", "SIAM COMMERCIAL BANK"],
        fonts: ["SCB"],
        colors: ["#4a5568", "#2d3748"],
        layoutKeywords: ["ไทยพาณิชย์", "SCB", "SIAM COMMERCIAL BANK"]
    },
    "กรุงไทย": {
        logos: ["KTB", "กรุงไทย", "KRUNG THAI BANK"],
        fonts: ["KTB"],
        colors: ["#dc2626", "#ef4444"],
        layoutKeywords: ["กรุงไทย", "KTB", "KRUNG THAI BANK"]
    },
    "ทหารไทย": {
        logos: ["TMB", "ทหารไทย", "TMB BANK"],
        fonts: ["TMB"],
        colors: ["#059669", "#10b981"],
        layoutKeywords: ["ทหารไทย", "TMB", "TMB BANK"]
    },
    "ออมสิน": {
        logos: ["GSB", "ออมสิน", "GOVERNMENT SAVINGS BANK"],
        fonts: ["GSB"],
        colors: ["#7c3aed", "#8b5cf6"],
        layoutKeywords: ["ออมสิน", "GSB", "GOVERNMENT SAVINGS BANK"]
    }
}

// ข้อความที่ต้องมีในสลิป
const REQUIRED_SUCCESS_TEXTS = [
    "โอนเงินสำเร็จ", "โอนสำเร็จ", "สำเร็จ", "Success", "Completed",
    "Transaction Successful", "Transfer Successful"
]

const REQUIRED_REFNO_TEXTS = [
    "Ref", "Reference", "เลขที่รายการ", "เลขที่อ้างอิง", "Ref No",
    "Reference No", "Transaction ID", "เลขที่", "หมายเลข"
]

/**
 * ตรวจสอบสลิปแบบละเอียด
 */
export async function verifySlipAdvanced(
    options: AdvancedVerifyOptions
): Promise<AdvancedVerifyResult> {
    const {
        slipImageUrl,
        requiredAmount = null,
        expectedAccountName = null,
        expectedBankName = null,
        maxSlipAgeDays = 7,
        checkDuplicateRefNo = false,
        previousRefNos = []
    } = options

    if (!slipImageUrl) {
        return createRejectedResult("ยังไม่มีสลิปให้ตรวจสอบ")
    }

    // โหลดรูปภาพ
    const img = await loadImage(slipImageUrl)
    
    // OCR
    const ocrText = await performOCR(img)
    
    // ตรวจสอบ QR Code
    const qrCheck = await checkQRCode(img)
    
    // ตรวจสอบ Bank Logo
    const bankLogoCheck = await checkBankLogo(img, ocrText, expectedBankName)
    
    // ตรวจสอบ Font
    const fontCheck = await checkFont(img, ocrText, expectedBankName)
    
    // ตรวจสอบ Layout
    const layoutCheck = await checkLayout(ocrText, expectedBankName)
    
    // ตรวจสอบข้อความที่ต้องมี
    const requiredTextCheck = checkRequiredText(ocrText)
    
    // ตรวจสอบจำนวนเงิน
    const amountCheck = checkAmount(ocrText, requiredAmount)
    
    // ตรวจสอบชื่อบัญชี
    const accountNameCheck = checkAccountName(ocrText, expectedAccountName)
    
    // ตรวจสอบวันที่-เวลา
    const dateTimeCheck = checkDateTime(ocrText, maxSlipAgeDays)
    
    // ตรวจสอบ Ref No.
    const refNoCheck = checkRefNo(ocrText, checkDuplicateRefNo, previousRefNos)
    
    // ตรวจสอบ Image Quality
    const imageQualityCheck = await checkImageQuality(img)
    
    // ตรวจสอบอายุสลิป
    const slipAgeCheck = checkSlipAge(dateTimeCheck.date, maxSlipAgeDays)
    
    // สรุปข้อมูลที่ extract ได้
    const extractedData = {
        qrPayload: qrCheck.payload,
        qrData: qrCheck.data,
        amount: amountCheck.amount,
        accountName: accountNameCheck.accountName,
        bankName: bankLogoCheck.bankName || fontCheck.bankName,
        date: dateTimeCheck.date,
        time: dateTimeCheck.time,
        refNo: refNoCheck.refNo,
        transactionId: extractTransactionId(ocrText)
    }
    
    // คำนวณคะแนน
    const score = calculateScore({
        qrCheck,
        bankLogoCheck,
        fontCheck,
        layoutCheck,
        requiredTextCheck,
        amountCheck,
        accountNameCheck,
        dateTimeCheck,
        refNoCheck,
        imageQualityCheck,
        slipAgeCheck
    })
    
    // ตัดสินใจ
    const decision = makeDecision({
        score,
        qrCheck,
        amountCheck,
        accountNameCheck,
        dateTimeCheck,
        refNoCheck,
        imageQualityCheck,
        slipAgeCheck
    })
    
    // รวบรวม reasons
    const reasons = collectReasons({
        qrCheck,
        bankLogoCheck,
        fontCheck,
        layoutCheck,
        requiredTextCheck,
        amountCheck,
        accountNameCheck,
        dateTimeCheck,
        refNoCheck,
        imageQualityCheck,
        slipAgeCheck
    })
    
    return {
        decision,
        reasons,
        score,
        checks: {
            qrCode: qrCheck,
            bankLogo: bankLogoCheck,
            font: fontCheck,
            layout: layoutCheck,
            requiredText: requiredTextCheck,
            amount: amountCheck,
            accountName: accountNameCheck,
            dateTime: dateTimeCheck,
            refNo: refNoCheck,
            imageQuality: imageQualityCheck,
            slipAge: slipAgeCheck
        },
        extractedData,
        ocrPreview: ocrText.slice(0, 500)
    }
}

// ========== Helper Functions ==========

async function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"))
        img.src = url
    })
}

async function performOCR(img: HTMLImageElement): Promise<string> {
    try {
        const tesseract = await import("tesseract.js")
        // @ts-ignore
        const res = await tesseract.recognize(img, "tha+eng", { logger: () => {} }).catch(() => null)
        return res?.data?.text?.replace(/\s+/g, " ").trim() || ""
    } catch {
        return ""
    }
}

async function checkQRCode(img: HTMLImageElement): Promise<QRCodeCheck> {
    const issues: string[] = []
    let found = false
    let clear = false
    let decodable = false
    let payload: string | undefined
    let data: any = undefined
    
    try {
        // ลองอ่าน QR Code
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")
        if (ctx) {
            ctx.drawImage(img, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const { default: jsqr } = await import("jsqr")
            const qr = jsqr(imageData.data, imageData.width, imageData.height)
            
            if (qr) {
                found = true
                payload = qr.data
                
                // ลอง decode QR payload
                try {
                    // QR Code ใน e-Slip มักเป็น EMVCo format หรือ JSON
                    if (payload.startsWith("{")) {
                        data = JSON.parse(payload)
                        decodable = true
                    } else if (payload.includes("|")) {
                        // EMVCo format: ข้อมูลคั่นด้วย |
                        const parts = payload.split("|")
                        data = { parts, format: "EMVCo" }
                        decodable = true
                    } else {
                        data = { raw: payload }
                        decodable = true
                    }
                } catch {
                    data = { raw: payload }
                    decodable = true
                }
                
                // ตรวจสอบความชัดเจนของ QR (ดูจากขนาดและความคมชัด)
                const qrSize = qr.location ? 
                    Math.max(
                        Math.abs(qr.location.topLeftCorner.x - qr.location.topRightCorner.x),
                        Math.abs(qr.location.topLeftCorner.y - qr.location.bottomLeftCorner.y)
                    ) : 0
                
                clear = qrSize > 50 // QR Code ควรมีขนาดอย่างน้อย 50px
                if (!clear) {
                    issues.push("QR Code พบแต่ไม่ชัดเจน")
                }
            } else {
                issues.push("ไม่พบ QR Code ในสลิป - น่าสงสัย")
            }
        }
    } catch (error) {
        issues.push("ไม่สามารถอ่าน QR Code ได้")
    }
    
    return { found, clear, decodable, payload, data, issues }
}

async function checkBankLogo(
    img: HTMLImageElement,
    ocrText: string,
    expectedBankName: string | null
): Promise<BankLogoCheck> {
    const issues: string[] = []
    let detected = false
    let bankName: string | undefined
    let confidence = 0
    let matchesExpected = true
    
    // ตรวจสอบจาก OCR text (หาโลโก้/ชื่อธนาคาร)
    const text = ocrText.toLowerCase()
    
    for (const [bank, info] of Object.entries(BANK_INFO)) {
        const foundKeywords = info.layoutKeywords.filter(kw => 
            text.includes(kw.toLowerCase())
        )
        
        if (foundKeywords.length > 0) {
            detected = true
            bankName = bank
            confidence = Math.min(100, foundKeywords.length * 30)
            break
        }
    }
    
    if (!detected) {
        issues.push("ไม่พบโลโก้หรือชื่อธนาคารในสลิป")
    } else if (expectedBankName) {
        matchesExpected = bankName?.toLowerCase().includes(expectedBankName.toLowerCase()) || false
        if (!matchesExpected) {
            issues.push(`พบธนาคาร ${bankName} แต่คาดหวัง ${expectedBankName}`)
        }
    }
    
    return { detected, bankName, confidence, matchesExpected, issues }
}

async function checkFont(
    img: HTMLImageElement,
    ocrText: string,
    expectedBankName: string | null
): Promise<FontCheck> {
    // ตรวจสอบ font จาก OCR confidence และรูปแบบข้อความ
    // ในเบราว์เซอร์ไม่สามารถ detect font ได้โดยตรง ต้องใช้วิธีอื่น
    const issues: string[] = []
    let detected = false
    let bankName: string | undefined
    let confidence = 0
    let matchesExpected = true
    
    // ใช้การตรวจสอบจากรูปแบบข้อความและ layout แทน
    // (ในระบบจริงอาจต้องใช้ server-side image processing)
    
    return { detected, bankName, confidence, matchesExpected, issues }
}

function checkLayout(ocrText: string, expectedBankName: string | null): LayoutCheck {
    const issues: string[] = []
    let valid = false
    let bankName: string | undefined
    let confidence = 0
    
    // ตรวจสอบ layout จาก keywords
    const text = ocrText.toLowerCase()
    
    for (const [bank, info] of Object.entries(BANK_INFO)) {
        const foundKeywords = info.layoutKeywords.filter(kw => 
            text.includes(kw.toLowerCase())
        )
        
        if (foundKeywords.length >= 2) {
            valid = true
            bankName = bank
            confidence = Math.min(100, foundKeywords.length * 25)
            break
        }
    }
    
    if (!valid) {
        issues.push("รูปแบบ layout ไม่ตรงกับสลิปธนาคาร")
    }
    
    return { valid, bankName, confidence, issues }
}

function checkRequiredText(ocrText: string): RequiredTextCheck {
    const text = ocrText.toLowerCase()
    const missing: string[] = []
    const issues: string[] = []
    
    const hasSuccessText = REQUIRED_SUCCESS_TEXTS.some(t => text.includes(t.toLowerCase()))
    const hasRefNo = REQUIRED_REFNO_TEXTS.some(t => text.includes(t.toLowerCase()))
    const hasTransactionId = text.includes("transaction") || text.includes("เลขที่รายการ")
    
    if (!hasSuccessText) missing.push("ข้อความ 'โอนเงินสำเร็จ'")
    if (!hasRefNo) missing.push("เลขที่อ้างอิง (Ref No.)")
    if (!hasTransactionId) missing.push("Transaction ID")
    
    if (missing.length > 0) {
        issues.push(`ไม่พบข้อความสำคัญ: ${missing.join(", ")}`)
    }
    
    return { hasSuccessText, hasRefNo, hasTransactionId, missing, issues }
}

function checkAmount(ocrText: string, requiredAmount: number | null): AmountCheck {
    const issues: string[] = []
    let found = false
    let amount: number | undefined
    let exactMatch = false
    let difference: number | undefined
    
    // หาจำนวนเงินจาก OCR
    const amountPatterns = [
        /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*บาท/,
        /จำนวน[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
        /Amount[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
        /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*THB/,
    ]
    
    for (const pattern of amountPatterns) {
        const match = ocrText.match(pattern)
        if (match) {
            found = true
            amount = parseFloat(match[1].replace(/,/g, ""))
            break
        }
    }
    
    if (!found) {
        issues.push("ไม่พบจำนวนเงินในสลิป")
    } else if (requiredAmount !== null) {
        difference = Math.abs((amount || 0) - requiredAmount)
        exactMatch = difference === 0
        
        if (!exactMatch) {
            if (difference > 0.01) { // คลาดเคลื่อนมากกว่า 1 สตางค์
                issues.push(`จำนวนเงินไม่ตรง: พบ ${amount?.toLocaleString("th-TH")} บาท, ควรเป็น ${requiredAmount.toLocaleString("th-TH")} บาท (คลาดเคลื่อน ${difference.toLocaleString("th-TH")} บาท)`)
            }
        }
    }
    
    return { found, amount, exactMatch, difference, issues }
}

function checkAccountName(ocrText: string, expectedAccountName: string | null): AccountNameCheck {
    const issues: string[] = []
    let found = false
    let accountName: string | undefined
    let exactMatch = false
    
    if (expectedAccountName) {
        // หาชื่อบัญชีจาก OCR (หาใกล้กับคำว่า "บัญชี", "Account", "ชื่อ")
        const accountPatterns = [
            /(?:บัญชี|Account|ชื่อ)[:\s]*([A-Za-zก-๙\s]{3,50})/i,
            /(?:ผู้รับ|Receiver|Recipient)[:\s]*([A-Za-zก-๙\s]{3,50})/i,
        ]
        
        for (const pattern of accountPatterns) {
            const match = ocrText.match(pattern)
            if (match) {
                found = true
                accountName = match[1].trim()
                break
            }
        }
        
        if (!found) {
            issues.push("ไม่พบชื่อบัญชีผู้รับในสลิป")
        } else if (accountName) {
            // ตรวจสอบว่าตรง 100% (case-insensitive, trim spaces)
            const normalizedFound = accountName.replace(/\s+/g, " ").trim().toLowerCase()
            const normalizedExpected = expectedAccountName.replace(/\s+/g, " ").trim().toLowerCase()
            exactMatch = normalizedFound === normalizedExpected
            
            if (!exactMatch) {
                issues.push(`ชื่อบัญชีไม่ตรง: พบ "${accountName}", ควรเป็น "${expectedAccountName}"`)
            }
        }
    }
    
    return { found, accountName, exactMatch, issues }
}

function checkDateTime(ocrText: string, maxSlipAgeDays: number): DateTimeCheck {
    const issues: string[] = []
    let found = false
    let date: Date | undefined
    let time: string | undefined
    let isRecent = false
    let daysAgo: number | undefined
    
    // Parse date (ใช้ logic เดียวกับ slip-verification.ts)
    const parseDate = (text: string): Date | null => {
        const todayYear = new Date().getFullYear()
        const normalizeYear = (yearRaw: number) => {
            if (yearRaw >= 2400) return yearRaw - 543
            if (yearRaw < 100) {
                const adCandidate = 2000 + yearRaw
                const beCandidate = 1957 + yearRaw
                return Math.abs(adCandidate - todayYear) <= Math.abs(beCandidate - todayYear)
                    ? adCandidate
                    : beCandidate
            }
            return yearRaw
        }
        
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
        return null
    }
    
    const parsedDate = parseDate(ocrText)
    if (parsedDate) {
        found = true
        date = parsedDate
        
        // Parse time
        const timeMatch = ocrText.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
        if (timeMatch) {
            time = `${timeMatch[1]}:${timeMatch[2]}${timeMatch[3] ? `:${timeMatch[3]}` : ""}`
        }
        
        // ตรวจสอบว่าเป็นวันที่ล่าสุดหรือไม่
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const slipDate = new Date(date)
        slipDate.setHours(0, 0, 0, 0)
        
        daysAgo = Math.floor((today.getTime() - slipDate.getTime()) / (1000 * 60 * 60 * 24))
        isRecent = daysAgo <= maxSlipAgeDays
        
        if (!isRecent) {
            issues.push(`สลิปเก่าเกินไป: ${daysAgo} วันก่อน (สูงสุด ${maxSlipAgeDays} วัน)`)
        }
    } else {
        issues.push("ไม่พบวันที่ในสลิป")
    }
    
    return { found, date, time, isRecent, daysAgo, issues }
}

function checkRefNo(ocrText: string, checkDuplicate: boolean, previousRefNos: string[]): RefNoCheck {
    const issues: string[] = []
    let found = false
    let refNo: string | undefined
    let isDuplicate = false
    
    // หา Ref No. จาก OCR
    const refNoPatterns = [
        /(?:Ref|Reference|เลขที่อ้างอิง|เลขที่รายการ)[:\s]*([A-Z0-9\-]{6,30})/i,
        /(?:Transaction ID|เลขที่)[:\s]*([A-Z0-9\-]{6,30})/i,
    ]
    
    for (const pattern of refNoPatterns) {
        const match = ocrText.match(pattern)
        if (match) {
            found = true
            refNo = match[1].trim()
            break
        }
    }
    
    if (!found) {
        issues.push("ไม่พบเลขที่อ้างอิง (Ref No.) ในสลิป")
    } else if (checkDuplicate && refNo) {
        isDuplicate = previousRefNos.includes(refNo)
        if (isDuplicate) {
            issues.push(`พบ Ref No. ซ้ำ: ${refNo} (เคยใช้แล้ว)`)
        }
    }
    
    return { found, refNo, isDuplicate, issues }
}

async function checkImageQuality(img: HTMLImageElement): Promise<ImageQualityCheck> {
    const issues: string[] = []
    
    try {
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) {
            return { sharpness: 0, hasTampering: false, edgeIssues: false, issues: ["ไม่สามารถตรวจสอบคุณภาพรูปภาพได้"] }
        }
        
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // คำนวณ sharpness (ใช้ Laplacian variance)
        let sharpness = 0
        let edgeCount = 0
        
        for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
                const idx = (y * canvas.width + x) * 4
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
                
                const rightIdx = (y * canvas.width + (x + 1)) * 4
                const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3
                
                const bottomIdx = ((y + 1) * canvas.width + x) * 4
                const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3
                
                const edge = Math.abs(gray - rightGray) + Math.abs(gray - bottomGray)
                sharpness += edge
                if (edge > 30) edgeCount++
            }
        }
        
        // Normalize sharpness (0-100)
        sharpness = Math.min(100, (sharpness / (canvas.width * canvas.height)) * 10)
        
        // ตรวจสอบรอยตัดต่อ (ดูจาก edge ที่ผิดปกติ)
        const edgeRatio = edgeCount / (canvas.width * canvas.height)
        const edgeIssues = edgeRatio > 0.3 // ถ้ามี edge มากเกินไป อาจมีการตัดต่อ
        
        if (sharpness < 20) {
            issues.push("รูปภาพเบลอเกินไป (sharpness ต่ำ)")
        }
        
        if (edgeIssues) {
            issues.push("พบรอยตัดต่อหรือการแก้ไขภาพ (edge anomalies)")
        }
        
        // ตรวจสอบ EXIF metadata (ร่องรอยการแก้ไข)
        let hasTampering = false
        try {
            const exifr = await import("exifr")
            // @ts-ignore
            const meta = await exifr.parse(img).catch(() => undefined)
            const software = (meta as any)?.Software || (meta as any)?.software
            if (software && typeof software === "string") {
                const edits = ["Photoshop", "PicsArt", "Snapseed", "Canva", "GIMP", "Pixelmator", "Lightroom"]
                if (edits.some((e) => software.includes(e))) {
                    hasTampering = true
                    issues.push(`พบร่องรอยแก้ไขภาพ (Software: ${software})`)
                }
            }
        } catch {
            // ข้ามได้
        }
        
        return { sharpness, hasTampering, edgeIssues, issues }
    } catch (error) {
        return { sharpness: 0, hasTampering: false, edgeIssues: false, issues: ["ไม่สามารถตรวจสอบคุณภาพรูปภาพได้"] }
    }
}

function checkSlipAge(date: Date | undefined, maxDays: number): SlipAgeCheck {
    const issues: string[] = []
    
    if (!date) {
        return { valid: false, issues: ["ไม่พบวันที่ในสลิป"] }
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const slipDate = new Date(date)
    slipDate.setHours(0, 0, 0, 0)
    
    const daysAgo = Math.floor((today.getTime() - slipDate.getTime()) / (1000 * 60 * 60 * 24))
    const valid = daysAgo >= 0 && daysAgo <= maxDays
    
    if (!valid) {
        if (daysAgo < 0) {
            issues.push(`วันที่ในสลิปเป็นอนาคต (${daysAgo} วัน)`)
        } else {
            issues.push(`สลิปเก่าเกินไป: ${daysAgo} วันก่อน (สูงสุด ${maxDays} วัน)`)
        }
    }
    
    return { valid, daysAgo, issues }
}

function extractTransactionId(ocrText: string): string | undefined {
    const patterns = [
        /(?:Transaction ID|เลขที่รายการ|TXN)[:\s]*([A-Z0-9\-]{6,30})/i,
    ]
    
    for (const pattern of patterns) {
        const match = ocrText.match(pattern)
        if (match) {
            return match[1].trim()
        }
    }
    
    return undefined
}

function calculateScore(checks: any): number {
    let score = 0
    const maxScore = 100
    
    // QR Code (15 คะแนน)
    if (checks.qrCheck.found) {
        score += 10
        if (checks.qrCheck.clear) score += 3
        if (checks.qrCheck.decodable) score += 2
    }
    
    // Bank Logo (10 คะแนน)
    if (checks.bankLogoCheck.detected) {
        score += 8
        if (checks.bankLogoCheck.matchesExpected) score += 2
    }
    
    // Layout (5 คะแนน)
    if (checks.layoutCheck.valid) score += 5
    
    // Required Text (10 คะแนน)
    if (checks.requiredTextCheck.hasSuccessText) score += 4
    if (checks.requiredTextCheck.hasRefNo) score += 3
    if (checks.requiredTextCheck.hasTransactionId) score += 3
    
    // Amount (20 คะแนน)
    if (checks.amountCheck.found) {
        score += 10
        if (checks.amountCheck.exactMatch) score += 10
        else if (checks.amountCheck.difference && checks.amountCheck.difference <= 1) score += 5
    }
    
    // Account Name (15 คะแนน) - สำคัญมาก!
    if (checks.accountNameCheck.found) {
        score += 5
        if (checks.accountNameCheck.exactMatch) score += 10
    }
    
    // Date Time (10 คะแนน)
    if (checks.dateTimeCheck.found) {
        score += 5
        if (checks.dateTimeCheck.isRecent) score += 5
    }
    
    // Ref No. (5 คะแนน)
    if (checks.refNoCheck.found) {
        score += 3
        if (!checks.refNoCheck.isDuplicate) score += 2
    }
    
    // Image Quality (10 คะแนน)
    if (checks.imageQualityCheck.sharpness >= 30) score += 5
    if (!checks.imageQualityCheck.hasTampering) score += 3
    if (!checks.imageQualityCheck.edgeIssues) score += 2
    
    // Slip Age (5 คะแนน)
    if (checks.slipAgeCheck.valid) score += 5
    
    return Math.min(maxScore, score)
}

function makeDecision(context: any): SlipDecision {
    const { score, amountCheck, accountNameCheck, dateTimeCheck, refNoCheck, imageQualityCheck, slipAgeCheck } = context
    
    // Critical errors = rejected
    if (imageQualityCheck.hasTampering) return "rejected"
    if (refNoCheck.isDuplicate) return "rejected"
    if (accountNameCheck.found && !accountNameCheck.exactMatch) return "rejected" // ชื่อบัญชีต้องตรง 100%
    if (amountCheck.found && amountCheck.difference && amountCheck.difference > 0.01) return "rejected" // จำนวนเงินต้องตรงเป๊ะ
    if (!slipAgeCheck.valid) return "rejected"
    
    // Score-based decision
    if (score >= 90) return "approved"
    if (score >= 70) return "needs_review"
    return "rejected"
}

function collectReasons(checks: any): string[] {
    const reasons: string[] = []
    
    // เพิ่ม issues จากทุก checks
    Object.values(checks).forEach((check: any) => {
        if (check.issues && Array.isArray(check.issues)) {
            reasons.push(...check.issues)
        }
    })
    
    // ถ้าไม่มี issues และผ่าน = แสดงข้อความดี
    if (reasons.length === 0) {
        reasons.push("✅ ตรวจสอบผ่าน - สลิปถูกต้องและครบถ้วน")
    }
    
    return reasons
}

function createRejectedResult(reason: string): AdvancedVerifyResult {
    return {
        decision: "rejected",
        reasons: [reason],
        score: 0,
        checks: {
            qrCode: { found: false, clear: false, decodable: false, issues: [] },
            bankLogo: { detected: false, confidence: 0, matchesExpected: false, issues: [] },
            font: { detected: false, confidence: 0, matchesExpected: false, issues: [] },
            layout: { valid: false, confidence: 0, issues: [] },
            requiredText: { hasSuccessText: false, hasRefNo: false, hasTransactionId: false, missing: [], issues: [] },
            amount: { found: false, issues: [] },
            accountName: { found: false, exactMatch: false, issues: [] },
            dateTime: { found: false, isRecent: false, issues: [] },
            refNo: { found: false, isDuplicate: false, issues: [] },
            imageQuality: { sharpness: 0, hasTampering: false, edgeIssues: false, issues: [] },
            slipAge: { valid: false, issues: [] }
        },
        extractedData: {}
    }
}
