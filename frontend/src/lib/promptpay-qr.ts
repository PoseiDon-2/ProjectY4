/**
 * PromptPay QR Code Generator
 * Uses battle-tested promptpay-qr library
 */

import generatePayload from "promptpay-qr"

interface PromptPayQRConfig {
    phoneOrId: string
    amount?: number
}

/**
 * Generate PromptPay QR Code payload
 * Uses official promptpay-qr library for Thai banking standard
 */
export function generatePromptPayPayload(config: PromptPayQRConfig): string {
    const { phoneOrId, amount } = config

    // Sanitize input
    const sanitized = phoneOrId.replace(/\D/g, "")

    if (!sanitized) {
        throw new Error("ต้องมีเลขพร้อมเพย์")
    }

    if (sanitized.length !== 10 && sanitized.length !== 13) {
        throw new Error("เลขพร้อมเพย์ต้องเป็น 10 หรือ 13 หลัก")
    }

    // Use official library
    const payload = generatePayload(sanitized, { amount })

    return payload
}

/**
 * Validate input
 */
export function validatePromptPayInput(phoneOrId: string, amount?: number): {
    valid: boolean
    error?: string
} {
    const sanitized = phoneOrId.replace(/\D/g, "")

    if (!sanitized) {
        return { valid: false, error: "ต้องมีเลขพร้อมเพย์" }
    }

    if (sanitized.length !== 10 && sanitized.length !== 13) {
        return { valid: false, error: "เลขพร้อมเพย์ต้องเป็น 10 หรือ 13 หลัก" }
    }

    if (amount !== undefined) {
        if (amount < 0 || amount > 999999.99) {
            return { valid: false, error: "จำนวนเงินต้องอยู่ระหว่าง 0-999999.99" }
        }
    }

    return { valid: true }
}
