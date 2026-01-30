/**
 * Thai Bank Slip QR Code Parser
 * รองรับทุกธนาคารไทย: KBank, SCB, BBL, TTB, KTB, TMB, CIMB, etc.
 */

export type ThaiBankCode =
    | "004" // KBank (กสิกรไทย)
    | "014" // SCB (ไทยพาณิชย์)
    | "002" // BBL (กรุงเทพ)
    | "006" // KTB (กรุงไทย)
    | "011" // TMB (ทหารไทยธนชาต)
    | "022" // TTB (ทหารไทย)
    | "024" // UOB (ยูโอบี)
    | "025" // CIMB (ซิติแบงก์)
    | "030" // GSB (ออมสิน)
    | "031" // GHB (อาคารสงเคราะห์)
    | "033" // BAAC (ธกส.)
    | "034" // ISBT (อิสลาม)
    | "066" // TISCO (ทิสโก้)
    | "069" // Kiatnakin (เกียรตินาคิน)
    | "070" // ICBC (ไอซีบีซี)
    | "071" // HSBC (เอชเอสบีซี)
    | "073" // DBS (ดีบีเอส)
    | "098" // PromptPay (พร้อมเพย์)

export interface ThaiBankInfo {
    code: ThaiBankCode
    name: string
    nameEn: string
    shortName: string
}

export const THAI_BANKS: Record<ThaiBankCode, ThaiBankInfo> = {
    "004": { code: "004", name: "ธนาคารกสิกรไทย", nameEn: "Kasikorn Bank", shortName: "KBank" },
    "014": { code: "014", name: "ธนาคารไทยพาณิชย์", nameEn: "Siam Commercial Bank", shortName: "SCB" },
    "002": { code: "002", name: "ธนาคารกรุงเทพ", nameEn: "Bangkok Bank", shortName: "BBL" },
    "006": { code: "006", name: "ธนาคารกรุงไทย", nameEn: "Krung Thai Bank", shortName: "KTB" },
    "011": { code: "011", name: "ธนาคารทหารไทยธนชาต", nameEn: "TMB Thanachart Bank", shortName: "TMB" },
    "022": { code: "022", name: "ธนาคารทหารไทย", nameEn: "Tisco Bank", shortName: "TTB" },
    "024": { code: "024", name: "ธนาคารยูโอบี", nameEn: "UOB", shortName: "UOB" },
    "025": { code: "025", name: "ธนาคารซิติแบงก์", nameEn: "CIMB Thai Bank", shortName: "CIMB" },
    "030": { code: "030", name: "ธนาคารออมสิน", nameEn: "Government Savings Bank", shortName: "GSB" },
    "031": { code: "031", name: "ธนาคารอาคารสงเคราะห์", nameEn: "Government Housing Bank", shortName: "GHB" },
    "033": { code: "033", name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร", nameEn: "BAAC", shortName: "BAAC" },
    "034": { code: "034", name: "ธนาคารอิสลามแห่งประเทศไทย", nameEn: "Islamic Bank of Thailand", shortName: "ISBT" },
    "066": { code: "066", name: "ธนาคารทิสโก้", nameEn: "Tisco Bank", shortName: "TISCO" },
    "069": { code: "069", name: "ธนาคารเกียรตินาคิน", nameEn: "Kiatnakin Bank", shortName: "Kiatnakin" },
    "070": { code: "070", name: "ธนาคารไอซีบีซี", nameEn: "ICBC", shortName: "ICBC" },
    "071": { code: "071", name: "ธนาคารเอชเอสบีซี", nameEn: "HSBC", shortName: "HSBC" },
    "073": { code: "073", name: "ธนาคารดีบีเอส", nameEn: "DBS", shortName: "DBS" },
    "098": { code: "098", name: "พร้อมเพย์", nameEn: "PromptPay", shortName: "PromptPay" },
}

export interface ThaiBankSlipQRData {
    /** Transaction Reference ID (เลขที่รายการ) */
    transactionRefId?: string
    /** Bank Code (รหัสธนาคาร) */
    bankCode?: ThaiBankCode
    /** Bank Info */
    bankInfo?: ThaiBankInfo
    /** จำนวนเงิน */
    amount?: number
    /** วันที่-เวลา transaction */
    dateTime?: string
    /** Account number (ถ้ามี) */
    accountNumber?: string
    /** PromptPay ID (ถ้ามี) */
    promptpayId?: string
    /** Sender account (บัญชีผู้ส่ง) */
    senderAccount?: string
    /** Receiver account (บัญชีผู้รับ) */
    receiverAccount?: string
    /** Raw QR payload */
    rawPayload: string
}

/**
 * Parse QR Code payload จากสลิปธนาคารไทย
 *
 * รองรับหลาย format:
 * 1. EMVCo QR Code (PromptPay standard)
 * 2. Mini QR Code (ธนาคารเฉพาะ)
 * 3. JSON format
 * 4. Custom format ของแต่ละธนาคาร
 */
export function parseThaiBankSlipQR(payload: string): ThaiBankSlipQRData {
    const result: ThaiBankSlipQRData = {
        rawPayload: payload
    }

    try {
        // ========== 1. ลอง parse เป็น JSON ก่อน ==========
        if (payload.trim().startsWith("{")) {
            const jsonData = JSON.parse(payload)

            result.transactionRefId = jsonData.transRef || jsonData.transactionRef || jsonData.ref ||
                jsonData.transaction_id || jsonData.transactionId
            result.amount = jsonData.amount ? Number(jsonData.amount) : undefined
            result.bankCode = jsonData.bankCode || jsonData.bank_id || jsonData.bankId as ThaiBankCode
            result.dateTime = jsonData.dateTime || jsonData.date_time || jsonData.timestamp
            result.accountNumber = jsonData.accountNumber || jsonData.account_number
            result.promptpayId = jsonData.promptpayId || jsonData.promptpay_id || jsonData.promptPayId
            result.senderAccount = jsonData.senderAccount || jsonData.sender_account
            result.receiverAccount = jsonData.receiverAccount || jsonData.receiver_account

            if (result.bankCode && THAI_BANKS[result.bankCode]) {
                result.bankInfo = THAI_BANKS[result.bankCode]
            }

            return result
        }

        // ========== 2. Parse EMVCo Format ==========
        if (payload.startsWith("0002") || payload.includes("|")) {
            const parts = payload.split("|")

            for (const part of parts) {
                const trimmed = part.trim()
                if (/^[0-9]{3}$/.test(trimmed) && THAI_BANKS[trimmed as ThaiBankCode]) {
                    result.bankCode = trimmed as ThaiBankCode
                    result.bankInfo = THAI_BANKS[trimmed as ThaiBankCode]
                }
            }

            const transRefPatterns = [
                /([0-9]{12}(?:APP|REF|TXN|TRX)[0-9]{5,10})/i,
                /([0-9A-Z]{15,30})/i
            ]

            for (const pattern of transRefPatterns) {
                const match = payload.match(pattern)
                if (match && match[1] && match[1].length >= 15) {
                    result.transactionRefId = match[1]
                    break
                }
            }
        }

        // ========== 3. Parse จาก pattern ทั่วไป ==========
        for (const [code, bank] of Object.entries(THAI_BANKS)) {
            const patterns = [
                new RegExp(code, "i"),
                new RegExp(bank.shortName, "i"),
                new RegExp(bank.nameEn.replace(/\s+/g, ".*"), "i"),
                new RegExp(bank.name.replace(/ธนาคาร/g, "").trim(), "i")
            ]

            for (const pattern of patterns) {
                if (pattern.test(payload)) {
                    result.bankCode = code as ThaiBankCode
                    result.bankInfo = bank
                    break
                }
            }

            if (result.bankCode) break
        }

        const transRefPatterns = [
            /([0-9]{12}(?:APP|REF|TXN|TRX|BBL|SCB|KTB)[0-9]{5,10})/i,
            /(?:Ref|Reference|เลขที่รายการ|เลขที่อ้างอิง)[:\s]*([0-9A-Z]{15,30})/i,
            /([0-9]{12}[A-Z]{3,6}[0-9]{5,10})/i,
            /([0-9A-Z]{15,30})/i
        ]

        for (const pattern of transRefPatterns) {
            const match = payload.match(pattern)
            if (match && match[1] && match[1].length >= 15 && !result.transactionRefId) {
                result.transactionRefId = match[1]
                break
            }
        }

        const amountPatterns = [
            /(\d{1,3}(?:,\d{3})*\.\d{1,2})\s*(?:บาท|THB|baht|฿)/i,
            /amount[:\s]*(\d{1,3}(?:,\d{3})*\.\d{1,2})/i,
            /จำนวน[:\s]*(\d{1,3}(?:,\d{3})*\.\d{1,2})/i,
            /(\d{1,2})\s+(\d{2})\s*(?:บาท|THB|baht|฿)/i,
            /(\d{1,3}(?:,\d{3})*)\s*(?:บาท|THB|baht|฿)(?!\s*\.\d)/i,
            /amount[:\s]*(\d{1,3}(?:,\d{3})*)(?!\s*\.\d)/i,
            /จำนวน[:\s]*(\d{1,3}(?:,\d{3})*)(?!\s*\.\d)/i,
        ]

        for (let i = 0; i < amountPatterns.length; i++) {
            const pattern = amountPatterns[i]
            const match = payload.match(pattern)
            if (match && !result.amount) {
                if (i === 3 && match[1] && match[2]) {
                    const wholePart = match[1]
                    const decimalPart = match[2]
                    if (decimalPart.length === 2 && wholePart.length <= 2) {
                        result.amount = parseFloat(`${wholePart}.${decimalPart}`)
                    } else {
                        result.amount = Number(match[1].replace(/,/g, ""))
                    }
                } else {
                    result.amount = Number(match[1].replace(/,/g, ""))
                }
                break
            }
        }

        const promptpayPatterns = [
            /(?:promptpay|พร้อมเพย์)[:\s]*([0-9\-]{10,15})/i,
            /([0-9]{3}-[0-9]{3}-[0-9]{4})/,
            /([0-9]{10,13})/
        ]

        for (const pattern of promptpayPatterns) {
            const match = payload.match(pattern)
            if (match && match[1] && match[1].length >= 10) {
                result.promptpayId = match[1]
                break
            }
        }

        // ========== 4. ดึงเวลาและจำนวนเงินจาก payload แบบกสิกร/ธนาคาร (ตัวเลขล้วน) ==========
        if (!result.dateTime && /^\d+/.test(payload)) {
            const dateTimeMatch = payload.match(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:CPP|APP|REF|TXN)/)
            if (dateTimeMatch) {
                const [mm, yy, dd, hh, mi, ss] = dateTimeMatch.slice(1, 7).map(Number)
                if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 && hh <= 23 && mi <= 59 && ss <= 59) {
                    const yearBE = 2500 + yy
                    const yearCE = yearBE - 543
                    const d = new Date(yearCE, mm - 1, dd, hh, mi, ss)
                    if (!isNaN(d.getTime())) {
                        result.dateTime = d.toISOString().slice(0, 19).replace("T", " ")
                    }
                }
            }
        }

        if (result.amount == null && /^\d+/.test(payload)) {
            const bankCodes = Object.keys(THAI_BANKS) as ThaiBankCode[]
            for (const code of bankCodes) {
                if (!payload.startsWith(code)) continue
                const after = payload.slice(code.length)
                if (after.startsWith("100")) result.amount = 1
                else if (after.startsWith("500")) result.amount = 5
                else if (after.startsWith("1000")) result.amount = 10
                else if (after.startsWith("5000")) result.amount = 50
                else if (after.startsWith("10000")) result.amount = 100
                else {
                    const m = after.match(/^(\d{3,6})/)
                    if (m) {
                        const satang = parseInt(m[1], 10)
                        if (satang >= 100 && satang <= 999999) result.amount = satang / 100
                    }
                }
                break
            }
        }

    } catch (error) {
        console.error("Error parsing Thai bank QR payload:", error)
    }

    return result
}

/**
 * Extract transaction reference ID จาก QR payload
 */
export function extractTransactionRefId(payload: string): string | null {
    const parsed = parseThaiBankSlipQR(payload)
    return parsed.transactionRefId || null
}

/**
 * Detect bank จาก QR payload
 */
export function detectBankFromQR(payload: string): ThaiBankInfo | null {
    const parsed = parseThaiBankSlipQR(payload)
    return parsed.bankInfo || null
}
