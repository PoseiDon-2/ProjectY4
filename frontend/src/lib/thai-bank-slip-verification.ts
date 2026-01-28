/**
 * Thai Bank Slip Verification
 * ตรวจสอบสลิปธนาคารไทยโดยไม่ใช้ third-party API
 * ใช้การตรวจสอบแบบ client-side: QR code, OCR, pattern matching
 */

import { extractQRPayloadFromImage } from "./qr-extractor"
import { parseThaiBankSlipQR, ThaiBankSlipQRData, ThaiBankInfo } from "./thai-bank-slip-parser"
import { verifySlip, type VerifyResult } from "./slip-verification"
import { verifySlipAdvanced, type AdvancedVerifyResult } from "./advanced-slip-verification"

export interface ThaiBankSlipVerificationOptions {
    /** ไฟล์รูปภาพสลิป */
    slipFile: File
    /** จำนวนเงินที่คาดหวัง (ไม่บังคับ) */
    expectedAmount?: number
    /** ชื่อบัญชีที่คาดหวัง (ไม่บังคับ) */
    expectedAccountName?: string
    /** ชื่อธนาคารที่คาดหวัง (ไม่บังคับ) */
    expectedBankName?: string
    /** PromptPay ID ที่คาดหวัง (ไม่บังคับ) */
    expectedPromptpayId?: string
}

export interface ThaiBankSlipVerificationResult {
    /** สแกน QR code สำเร็จหรือไม่ */
    qrScanned: boolean
    /** ข้อมูลที่ parse จาก QR code */
    qrData?: ThaiBankSlipQRData
    /** Transaction Reference ID */
    transactionRefId?: string
    /** Bank Info */
    bankInfo?: ThaiBankInfo
    /** ผลการ verify แบบพื้นฐาน */
    basicVerification?: VerifyResult
    /** ผลการ verify แบบละเอียด */
    advancedVerification?: AdvancedVerifyResult
    /** สรุปผลการตรวจสอบ */
    verified: boolean
    /** ข้อความ error (ถ้ามี) */
    error?: string
    /** ข้อความแจ้งเตือน (ถ้ามี) */
    warnings?: string[]
}

/**
 * ตรวจสอบสลิปธนาคารไทยแบบครบวงจร
 * 
 * ขั้นตอน:
 * 1. สแกน QR code จากรูปภาพสลิป
 * 2. Parse payload เพื่อ extract ข้อมูล transaction
 * 3. ตรวจสอบด้วย client-side verification (OCR, pattern matching)
 */
export async function verifyThaiBankSlip(
    options: ThaiBankSlipVerificationOptions
): Promise<ThaiBankSlipVerificationResult> {
    const {
        slipFile,
        expectedAmount,
        expectedAccountName,
        expectedBankName,
        expectedPromptpayId
    } = options

    const warnings: string[] = []
    let qrData: ThaiBankSlipQRData | undefined
    let qrScanned = false

    try {
        // ========== 1. สแกน QR Code จากรูปภาพ ==========
        console.log("🔍 กำลังสแกน QR Code จากสลิป...")
        
        const imageUrl = URL.createObjectURL(slipFile)
        let qrPayload: string | null = null
        
        try {
            qrPayload = await extractQRPayloadFromImage(imageUrl)
        } finally {
            URL.revokeObjectURL(imageUrl)
        }

        if (qrPayload) {
            qrScanned = true
            console.log("✅ สแกน QR Code สำเร็จ:", qrPayload.substring(0, 50) + "...")

            // ========== 2. Parse QR Payload ==========
            console.log("📋 กำลัง parse ข้อมูลจาก QR Code...")
            qrData = parseThaiBankSlipQR(qrPayload)
            
            console.log("✅ Parse สำเร็จ:", {
                transactionRefId: qrData.transactionRefId,
                bankCode: qrData.bankCode,
                bankName: qrData.bankInfo?.name,
                amount: qrData.amount
            })
        } else {
            warnings.push("ไม่พบ QR Code ในสลิป - จะตรวจสอบด้วยวิธีอื่นแทน")
        }

        // ========== 3. Client-side Verification ==========
        console.log("🔐 กำลังตรวจสอบสลิปด้วย client-side verification...")
        
        // สร้าง image URL สำหรับ verification
        const verificationImageUrl = URL.createObjectURL(slipFile)
        
        try {
            // Basic verification
            const basicResult = await verifySlip({
                slipImageUrl: verificationImageUrl,
                requiredAmount: expectedAmount || undefined,
                expectedAccountName: expectedAccountName || undefined,
                expectedBankName: expectedBankName || qrData?.bankInfo?.name || undefined
            })

            // Advanced verification
            const advancedResult = await verifySlipAdvanced({
                slipImageUrl: verificationImageUrl,
                requiredAmount: expectedAmount || undefined,
                expectedAccountName: expectedAccountName || undefined,
                expectedBankName: expectedBankName || qrData?.bankInfo?.name || undefined,
                maxSlipAgeDays: 7
            })

            // ========== 4. ตรวจสอบความสอดคล้องของข้อมูล ==========
            const validationWarnings: string[] = []

            // ตรวจสอบจำนวนเงิน
            if (expectedAmount && qrData?.amount) {
                const diff = Math.abs(qrData.amount - expectedAmount)
                if (diff > 0.01) {
                    validationWarnings.push(`จำนวนเงินไม่ตรงกัน: QR Code แสดง ${qrData.amount} บาท แต่คาดหวัง ${expectedAmount} บาท`)
                }
            }

            // ตรวจสอบธนาคาร
            if (expectedBankName && qrData?.bankInfo) {
                const bankMatch = qrData.bankInfo.name.includes(expectedBankName) ||
                                expectedBankName.includes(qrData.bankInfo.name) ||
                                qrData.bankInfo.shortName.toLowerCase().includes(expectedBankName.toLowerCase())
                if (!bankMatch) {
                    validationWarnings.push(`ธนาคารไม่ตรงกัน: QR Code แสดง ${qrData.bankInfo.name} แต่คาดหวัง ${expectedBankName}`)
                }
            }

            // ตรวจสอบ PromptPay ID
            if (expectedPromptpayId && qrData?.promptpayId) {
                const cleanExpected = expectedPromptpayId.replace(/[-\s]/g, "")
                const cleanQR = qrData.promptpayId.replace(/[-\s]/g, "")
                if (cleanExpected !== cleanQR) {
                    validationWarnings.push(`PromptPay ID ไม่ตรงกัน: QR Code แสดง ${qrData.promptpayId} แต่คาดหวัง ${expectedPromptpayId}`)
                }
            }

            warnings.push(...validationWarnings)

            // ========== 5. สรุปผล ==========
            const verified = basicResult.decision === "approved" && 
                            advancedResult.decision !== "rejected" &&
                            validationWarnings.length === 0

            return {
                qrScanned,
                qrData,
                transactionRefId: qrData?.transactionRefId,
                bankInfo: qrData?.bankInfo,
                basicVerification: basicResult,
                advancedVerification: advancedResult,
                verified,
                warnings: warnings.length > 0 ? warnings : undefined
            }

        } finally {
            URL.revokeObjectURL(verificationImageUrl)
        }

    } catch (error: any) {
        console.error("❌ Error verifying Thai bank slip:", error)
        return {
            qrScanned,
            qrData,
            transactionRefId: qrData?.transactionRefId,
            bankInfo: qrData?.bankInfo,
            verified: false,
            error: error.message || "เกิดข้อผิดพลาดในการตรวจสอบสลิป"
        }
    }
}

/**
 * สแกน QR Code จากสลิป (ไม่ verify)
 * ใช้เมื่อต้องการแค่ extract ข้อมูลจาก QR code
 */
export async function scanThaiBankSlipQR(slipFile: File): Promise<{
    success: boolean
    qrData?: ThaiBankSlipQRData
    error?: string
}> {
    try {
        const imageUrl = URL.createObjectURL(slipFile)
        let qrPayload: string | null = null
        
        try {
            qrPayload = await extractQRPayloadFromImage(imageUrl)
        } finally {
            URL.revokeObjectURL(imageUrl)
        }

        if (!qrPayload) {
            return {
                success: false,
                error: "ไม่พบ QR Code ในสลิป"
            }
        }

        const qrData = parseThaiBankSlipQR(qrPayload)

        return {
            success: true,
            qrData
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || "เกิดข้อผิดพลาดในการสแกน QR Code"
        }
    }
}
