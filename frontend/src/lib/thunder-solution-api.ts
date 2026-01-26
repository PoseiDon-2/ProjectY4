/**
 * Thunder Solution API Integration
 * บริการตรวจสอบสลิปโอนเงินด้วย AI/ML
 * 
 * API Key: d93e398f-cf03-4a1f-94d1-b7fe3e8d19a5
 */

export interface ThunderSolutionConfig {
    apiKey: string
    baseUrl?: string
}

export interface BankAccountInfo {
    /** ชื่อธนาคาร (เช่น "กสิกรไทย", "กรุงเทพ", "SCB") */
    bank?: string
    /** เลขที่บัญชี */
    accountNumber?: string
    /** ชื่อบัญชี */
    accountName?: string
}

export interface ThunderSolutionVerifyOptions {
    /** File object ของรูปภาพสลิป */
    slipFile: File
    /** จำนวนเงินที่ต้องการตรวจสอบ (ไม่บังคับ) */
    expectedAmount?: number | null
    /** ข้อมูลบัญชีธนาคารปลายทาง (ไม่บังคับ - ใช้เพื่อตรวจสอบความถูกต้อง) */
    bankAccount?: BankAccountInfo | null
    /** เลขพร้อมเพย์ (PromptPay) - ใช้เพื่อตรวจสอบความถูกต้อง */
    promptpayId?: string | null
}

export interface ThunderSolutionResponse {
    success: boolean
    verified?: boolean // อาจเป็น undefined ถ้า Thunder ไม่ส่งมา
    isDuplicate?: boolean
    isFake?: boolean
    amount?: number
    date?: string
    bank?: string
    accountNumber?: string
    accountName?: string
    message?: string
    error?: string
    rawResponse?: any
    // ข้อมูลเพิ่มเติม
    isIncoming?: boolean // true = โอนเงินเข้า, false = โอนเงินออก, undefined = ไม่ทราบ
    senderBank?: string
    senderAccount?: string
    receiverBank?: string
    receiverAccount?: string
}

// Thunder Solution API Base URLs
// Documentation: https://document.thunder.in.th/
const VERIFY_API_BASE_URL = "https://api.thunder.in.th/v1" // สำหรับตรวจสอบสลิป
const BILL_PAYMENT_API_BASE_URL = "https://bill-payment-api.thunder.in.th" // สำหรับสร้าง QR Code

/**
 * ตรวจสอบสลิปผ่าน Thunder Solution API
 */
/**
 * Validate และแปลงรูปภาพให้เหมาะสม
 */
async function prepareImageFile(file: File): Promise<{ file: File; base64: string }> {
    // ตรวจสอบ format
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
        throw new Error(`รูปแบบรูปภาพไม่รองรับ (รองรับ: JPEG, PNG, WebP) - ได้รับ: ${file.type}`)
    }

    // ตรวจสอบขนาด (ไม่เกิน 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
        throw new Error(`ขนาดไฟล์ใหญ่เกินไป (สูงสุด 10MB) - ได้รับ: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    }

    // แปลงเป็น base64
    const base64 = await fileToBase64(file)
    
    return { file, base64 }
}

/**
 * อ่าน QR Code payload จากรูปภาพ
 */
async function extractQRPayloadFromImage(imageUrl: string): Promise<string | null> {
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image()
            i.crossOrigin = "anonymous"
            i.onload = () => resolve(i)
            i.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"))
            i.src = imageUrl
        })

        // ลองอ่าน QR Code
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return null

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        
        const { default: jsqr } = await import("jsqr")
        const qr = jsqr(imageData.data, imageData.width, imageData.height)
        
        if (qr && qr.data) {
            return qr.data
        }

        // ลองอีกครั้งด้วยขนาดที่เล็กลง
        const targetWidth = Math.min(800, img.naturalWidth)
        const scale = targetWidth / img.naturalWidth
        canvas.width = targetWidth
        canvas.height = Math.floor(img.naturalHeight * scale)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const resizedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const qr2 = jsqr(resizedImageData.data, resizedImageData.width, resizedImageData.height)
        
        if (qr2 && qr2.data) {
            return qr2.data
        }

        return null
    } catch (error) {
        console.error("Error extracting QR payload:", error)
        return null
    }
}

export async function verifySlipWithThunder(
    options: ThunderSolutionVerifyOptions,
    config: ThunderSolutionConfig
): Promise<ThunderSolutionResponse> {
    const { slipFile, expectedAmount, bankAccount, promptpayId } = options
    const { apiKey, baseUrl = VERIFY_API_BASE_URL } = config

    try {
        // Validate รูปภาพ
        await prepareImageFile(slipFile)

        // สร้าง image URL สำหรับอ่าน QR Code
        const imageUrl = URL.createObjectURL(slipFile)

        try {
            // อ่าน QR Code payload จากสลิป
            console.log("🔍 กำลังอ่าน QR Code จากสลิป...")
            const qrPayload = await extractQRPayloadFromImage(imageUrl)

            if (qrPayload) {
                console.log("✅ พบ QR Code payload:", qrPayload.substring(0, 50) + "...")
                
                // ใช้ GET request ตาม API documentation
                // API นี้ตรวจสอบว่ามีการโอนเงินจริงหรือไม่ (จากข้อมูลใน QR Code)
                const verifyUrl = `${baseUrl}/verify?payload=${encodeURIComponent(qrPayload)}`
                
                console.log(`🔍 Calling Thunder API: ${verifyUrl.substring(0, 100)}...`)
                const response = await fetch(verifyUrl, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log("✅ Thunder API Response:", data)
                    
                    // Parse response ตาม structure ที่ให้มา
                    return parseThunderResponse(data, expectedAmount, bankAccount, promptpayId)
                } else {
                    const errorText = await response.text()
                    let errorData: any = {}
                    try {
                        errorData = JSON.parse(errorText)
                    } catch {
                        errorData = { message: errorText }
                    }
                    
                    throw new Error(`API Error (${response.status}): ${errorData.message || errorText}`)
                }
            } else {
                // ถ้าไม่มี QR Code ในสลิป
                throw new Error("ไม่พบ QR Code ในสลิป - Thunder Solution ต้องการ QR Code payload จากสลิป")
            }
        } finally {
            // Cleanup
            URL.revokeObjectURL(imageUrl)
        }

        // ไม่ควรมาถึงตรงนี้ แต่ถ้ามาให้ throw error
        throw new Error("ไม่สามารถตรวจสอบสลิปได้ - กรุณาตรวจสอบว่าสลิปมี QR Code")
    } catch (error: any) {
        console.error("Thunder Solution API Error:", error)
        return {
            success: false,
            verified: false,
            error: error.message || "เกิดข้อผิดพลาดในการตรวจสอบสลิป",
            rawResponse: error,
        }
    }
}

/**
 * แปลงไฟล์เป็น Base64
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            // ลบ data:image/...;base64, prefix
            const base64 = result.split(",")[1] || result
            resolve(base64)
        }
        reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"))
        reader.readAsDataURL(file)
    })
}

/**
 * แปลง response จาก Thunder Solution เป็นรูปแบบมาตรฐาน
 */
function parseThunderResponse(
    data: any, 
    expectedAmount?: number | null,
    bankAccount?: BankAccountInfo | null,
    promptpayId?: string | null
): ThunderSolutionResponse {
    // Parse ตาม structure ที่ให้มา: { status: number, data: {...} }
    const responseData = data.data || data
    const status = data.status || 200

    const response: ThunderSolutionResponse = {
        success: status === 200,
        verified: status === 200, // ถ้า status 200 = verified
        rawResponse: data,
    }

    // ถ้า status ไม่ใช่ 200 = ไม่ผ่าน
    if (status !== 200) {
        response.verified = false
        response.message = data.message || "ไม่สามารถตรวจสอบสลิปได้"
        return response
    }

    // Parse ข้อมูลตาม structure ที่ให้มา
    // จำนวนเงิน
    if (responseData.amount) {
        response.amount = Number(responseData.amount.amount || responseData.amount)
    }

    // วันที่
    if (responseData.date) {
        response.date = String(responseData.date)
    }

    // ข้อมูลธนาคารผู้ส่ง (sender)
    if (responseData.sender) {
        if (responseData.sender.bank) {
            response.senderBank = responseData.sender.bank.name || responseData.sender.bank.short || responseData.sender.bank.id
        }
        if (responseData.sender.account?.bank) {
            response.senderAccount = responseData.sender.account.bank.account
        }
    }

    // ข้อมูลธนาคารผู้รับ (receiver)
    if (responseData.receiver) {
        if (responseData.receiver.bank) {
            response.receiverBank = responseData.receiver.bank.name || responseData.receiver.bank.short || responseData.receiver.bank.id
            response.bank = response.receiverBank // เก็บไว้สำหรับ backward compatibility
        }
        if (responseData.receiver.account) {
            if (responseData.receiver.account.bank) {
                response.receiverAccount = responseData.receiver.account.bank.account
                response.accountNumber = response.receiverAccount // เก็บไว้สำหรับ backward compatibility
            }
            if (responseData.receiver.account.name) {
                response.accountName = responseData.receiver.account.name.th || responseData.receiver.account.name.en
            }
        }
    }

    // ตรวจสอบว่าเป็นโอนเงินเข้าหรือออก
    // Thunder Solution ตรวจสอบได้ทั้งสองแบบ:
    // 1. โอนเงินเข้า (incoming): คนอื่นโอนเงินเข้าให้บัญชีที่ระบุ (receiver = บัญชีที่ระบุ)
    // 2. โอนเงินออก (outgoing): บัญชีที่ระบุโอนเงินออกให้คนอื่น (sender = บัญชีที่ระบุ)
    
    if (bankAccount?.accountNumber) {
        const expectedAccountClean = bankAccount.accountNumber.replace(/[-\s]/g, "")
        let isIncoming: boolean | undefined = undefined
        
        // ตรวจสอบ receiver (ผู้รับ) - ถ้าตรงกับบัญชีที่ระบุ = โอนเงินเข้า
        if (response.receiverAccount) {
            const receiverAccountClean = response.receiverAccount.replace(/[x*]/g, "").replace(/[-\s]/g, "")
            const receiverMatch = receiverAccountClean.includes(expectedAccountClean) || 
                                 expectedAccountClean.includes(receiverAccountClean) ||
                                 receiverAccountClean === expectedAccountClean
            
            if (receiverMatch) {
                isIncoming = true // โอนเงินเข้า - คนอื่นโอนให้บัญชีที่ระบุ
            }
        }
        
        // ตรวจสอบ sender (ผู้ส่ง) - ถ้าตรงกับบัญชีที่ระบุ = โอนเงินออก
        if (response.senderAccount && isIncoming === undefined) {
            const senderAccountClean = response.senderAccount.replace(/[x*]/g, "").replace(/[-\s]/g, "")
            const senderMatch = senderAccountClean.includes(expectedAccountClean) || 
                               expectedAccountClean.includes(senderAccountClean) ||
                               senderAccountClean === expectedAccountClean
            
            if (senderMatch) {
                isIncoming = false // โอนเงินออก - บัญชีที่ระบุโอนให้คนอื่น
            }
        }
        
        response.isIncoming = isIncoming
        
        if (isIncoming === true) {
            response.message = `${response.message || ""} ✅ โอนเงินเข้า - คนอื่นโอนเงินเข้าให้บัญชีที่ระบุ`.trim()
        } else if (isIncoming === false) {
            response.message = `${response.message || ""} ⚠️ โอนเงินออก - บัญชีที่ระบุโอนเงินออกให้คนอื่น`.trim()
        } else {
            response.message = `${response.message || ""} ⚠️ ไม่สามารถระบุได้ - บัญชีในสลิปไม่ตรงกับบัญชีที่ระบุ (อาจเป็นสลิปผิด)`.trim()
        }
    }

    // ตรวจสอบว่าตรงกับข้อมูลที่ให้มาหรือไม่
    if (bankAccount || promptpayId) {
        let matches = true
        const reasons: string[] = []

        // ตรวจสอบธนาคาร
        if (bankAccount?.bank && response.bank) {
            const bankMatch = response.bank.toLowerCase().includes(bankAccount.bank.toLowerCase()) ||
                            bankAccount.bank.toLowerCase().includes(response.bank.toLowerCase())
            if (!bankMatch) {
                matches = false
                reasons.push(`ธนาคารไม่ตรง: คาดหวัง ${bankAccount.bank} แต่สลิปแสดง ${response.bank}`)
            }
        }

        // ตรวจสอบเลขบัญชี
        if (bankAccount?.accountNumber && response.accountNumber) {
            const accountMatch = response.accountNumber.replace(/[x*]/g, "").includes(bankAccount.accountNumber.replace(/[-\s]/g, "")) ||
                               bankAccount.accountNumber.replace(/[-\s]/g, "").includes(response.accountNumber.replace(/[x*]/g, ""))
            if (!accountMatch) {
                matches = false
                reasons.push(`เลขบัญชีไม่ตรง: คาดหวัง ${bankAccount.accountNumber} แต่สลิปแสดง ${response.accountNumber}`)
            }
        }

        // ตรวจสอบจำนวนเงิน
        if (expectedAmount && response.amount) {
            const diff = Math.abs(response.amount - expectedAmount)
            if (diff > 10) {
                matches = false
                reasons.push(`จำนวนเงินไม่ตรงกัน: คาดหวัง ${expectedAmount} บาท แต่สลิปแสดง ${response.amount} บาท`)
            }
        }

        if (reasons.length > 0) {
            response.message = reasons.join("; ")
        }
    }

    // ข้อความเพิ่มเติม
    if (responseData.transRef) {
        response.message = `${response.message || ""} Transaction Ref: ${responseData.transRef}`.trim()
    }

    return response
}

/**
 * แปลงผลลัพธ์จาก Thunder Solution เป็น VerifyResult ของระบบเดิม
 */
export function convertThunderToVerifyResult(
    thunderResult: ThunderSolutionResponse,
    requiredAmount?: number | null
): import("./slip-verification").VerifyResult {
    const reasons: string[] = []
    let decision: "approved" | "rejected" | "needs_review" = "rejected"

    if (!thunderResult.success) {
        return {
            decision: "rejected",
            reasons: [thunderResult.error || "ไม่สามารถตรวจสอบสลิปได้"],
        }
    }

    // ตรวจสอบสลิปปลอม (Critical - reject ทันที)
    if (thunderResult.isFake === true) {
        decision = "rejected"
        reasons.push("❌ สลิปปลอม - ตรวจพบโดย Thunder Solution AI")
        return { decision, reasons }
    }

    // ตรวจสอบสลิปซ้ำ (Critical - reject ทันที)
    if (thunderResult.isDuplicate === true) {
        decision = "rejected"
        reasons.push("❌ สลิปซ้ำ - สลิปนี้เคยถูกใช้แล้ว")
        return { decision, reasons }
    }

    // ถ้าไม่มีข้อมูล verified, is_fake, is_duplicate ให้ดู raw response
    // บางครั้ง Thunder Solution อาจไม่ส่ง verified แต่สลิปก็จริง
    const hasExplicitRejection = thunderResult.isFake === true || thunderResult.isDuplicate === true
    const hasExplicitApproval = thunderResult.verified === true

    // ถ้า verified: false แต่ไม่มี is_fake หรือ is_duplicate
    // อาจเป็นเพราะไม่มีข้อมูลธนาคาร/พร้อมเพย์ให้ตรวจสอบ
    // ให้เป็น needs_review แทน reject
    if (thunderResult.verified === false && !hasExplicitRejection) {
        decision = "needs_review"
        reasons.push("⚠️ ไม่สามารถยืนยันได้ 100% - อาจเป็นเพราะไม่มีข้อมูลธนาคาร/พร้อมเพย์ให้ตรวจสอบ")
        reasons.push("💡 สลิปดูเหมือนจริง แต่ต้องให้ผู้สร้างคำขอตรวจสอบอีกครั้ง")
        
        // ถ้ามีข้อมูลจำนวนเงินหรือวันที่ แสดงว่า OCR ทำงานได้
        if (thunderResult.amount) {
            reasons.push(`✅ พบจำนวนเงิน: ${thunderResult.amount.toLocaleString("th-TH")} บาท`)
        }
        if (thunderResult.date) {
            reasons.push(`✅ พบวันที่: ${thunderResult.date}`)
        }
        if (thunderResult.bank) {
            reasons.push(`✅ พบธนาคาร: ${thunderResult.bank}`)
        }
        
        // ยังไม่ return ให้ตรวจสอบจำนวนเงินต่อ
    } else if (thunderResult.verified === undefined && !hasExplicitRejection) {
        // ถ้า Thunder ไม่ส่ง verified มาเลย แต่มีข้อมูลอื่นๆ
        // ให้เป็น needs_review (สลิปดูเหมือนจริงแต่ต้องตรวจสอบ)
        decision = "needs_review"
        reasons.push("⚠️ Thunder Solution อ่านสลิปได้ แต่ไม่สามารถยืนยันได้ 100%")
        reasons.push("💡 อาจเป็นเพราะไม่มีข้อมูลธนาคาร/พร้อมเพย์ให้ตรวจสอบ - ต้องให้ผู้สร้างคำขอตรวจสอบ")
        
        // แสดงข้อมูลที่อ่านได้
        if (thunderResult.amount) {
            reasons.push(`✅ พบจำนวนเงิน: ${thunderResult.amount.toLocaleString("th-TH")} บาท`)
        }
        if (thunderResult.date) {
            reasons.push(`✅ พบวันที่: ${thunderResult.date}`)
        }
        if (thunderResult.bank) {
            reasons.push(`✅ พบธนาคาร: ${thunderResult.bank}`)
        }
    }

    // ตรวจสอบจำนวนเงิน
    if (requiredAmount && thunderResult.amount) {
        const diff = Math.abs(thunderResult.amount - requiredAmount)
        if (diff === 0) {
            reasons.push("✅ จำนวนเงินตรงกัน")
            // ถ้าจำนวนเงินตรงและ verified = true ให้เป็น approved
            if (hasExplicitApproval && decision !== "rejected") {
                decision = "approved"
            }
        } else if (diff <= 1) {
            reasons.push(`⚠️ จำนวนเงินคลาดเคลื่อนเล็กน้อย: ${diff} บาท`)
            if (hasExplicitApproval && decision !== "rejected") {
                decision = "approved"
            } else if (decision === "rejected") {
                decision = "needs_review"
            }
        } else if (diff <= 10) {
            reasons.push(`⚠️ จำนวนเงินคลาดเคลื่อน: ${diff} บาท`)
            if (decision === "rejected") {
                decision = "needs_review"
            }
        } else {
            reasons.push(`❌ จำนวนเงินไม่ตรงกัน: คาดหวัง ${requiredAmount} บาท แต่สลิปแสดง ${thunderResult.amount} บาท`)
            decision = "rejected"
            return { decision, reasons }
        }
    } else if (thunderResult.amount) {
        reasons.push(`✅ พบจำนวนเงิน: ${thunderResult.amount.toLocaleString("th-TH")} บาท`)
    }

    // ถ้าผ่านทุกอย่างและ verified = true
    if (hasExplicitApproval && !hasExplicitRejection && decision !== "rejected") {
        const amountOk = !requiredAmount || !thunderResult.amount || Math.abs(thunderResult.amount - (requiredAmount || 0)) <= 1
        decision = amountOk ? "approved" : "needs_review"
        
        if (decision === "approved") {
            reasons.unshift("✅ ผ่านการตรวจสอบโดย Thunder Solution (99.98% accuracy)")
        } else {
            reasons.unshift("⚠️ ผ่านการตรวจสอบเบื้องต้นโดย Thunder Solution")
        }
    } else if (decision === "rejected" && !hasExplicitRejection) {
        // ถ้ายังเป็น rejected แต่ไม่มี explicit rejection ให้เปลี่ยนเป็น needs_review
        decision = "needs_review"
        if (!reasons.some(r => r.includes("ไม่สามารถยืนยันได้"))) {
            reasons.unshift("⚠️ ต้องให้ผู้สร้างคำขอตรวจสอบ - ไม่มีข้อมูลเพียงพอสำหรับการยืนยันอัตโนมัติ")
        }
    }

    if (thunderResult.message) {
        reasons.push(thunderResult.message)
    }

    return {
        decision,
        reasons: reasons.length > 0 ? reasons : ["✅ ผ่านการตรวจสอบ"],
        hasQR: true, // Thunder Solution ตรวจสอบ QR Code อยู่แล้ว
        _debug: {
            score: decision === "approved" ? 95 : decision === "needs_review" ? 75 : 0,
            foundTokens: [],
            ocrAmount: thunderResult.amount || null,
            ocrDate: thunderResult.date || null,
            hasSlipEvidence: thunderResult.amount !== undefined || thunderResult.date !== undefined || thunderResult.bank !== undefined,
        },
    }
}
