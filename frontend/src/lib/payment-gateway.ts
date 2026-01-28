/**
 * Payment Gateway Integration
 * สำหรับระบบ Real-time Payment (จ่ายปุ้บรู้เลย ไม่ต้องตรวจสอบสลิป)
 * 
 * รองรับ: GBPrimepay, Omise, 2C2P
 */

export type PaymentGateway = "gbprimepay" | "omise" | "2c2p"

export interface PaymentGatewayConfig {
    gateway: PaymentGateway
    apiKey: string
    apiSecret?: string
    baseUrl?: string
}

export interface CreatePaymentQRRequest {
    donationRequestId: string
    amount: number
    paymentMethod: "promptpay" | "credit_card"
    customerInfo: {
        name: string
        email?: string
        phone?: string
    }
    metadata?: {
        promptpayId?: string
        [key: string]: any
    }
}

export interface PaymentResponse {
    success: boolean
    qrCodeUrl?: string
    referenceNo?: string
    paymentId?: string
    error?: string
    rawResponse?: any
}

export type PaymentStatusType = "pending" | "completed" | "failed" | "cancelled"

export interface PaymentStatus {
    referenceNo: string
    status: PaymentStatusType
    amount: number
    paidAt?: string
    transactionId?: string
    error?: string
    rawResponse?: any
}

/**
 * สร้าง QR Code ผ่าน Payment Gateway
 */
export async function createPaymentQR(
    request: CreatePaymentQRRequest,
    config: PaymentGatewayConfig
): Promise<PaymentResponse> {
    const { gateway, apiKey, baseUrl } = config

    try {
        // สำหรับทดสอบ - จำลองการสร้าง QR Code
        // ในระบบจริงจะเรียก Payment Gateway API
        console.log("🔍 Creating payment QR via", gateway, request)

        // จำลอง API call
        const apiUrl = baseUrl || getGatewayBaseUrl(gateway)
        const endpoint = getCreateQREndpoint(gateway)

        // สำหรับทดสอบ: สร้าง QR Code เองก่อน (จะเปลี่ยนเป็นเรียก Gateway API จริงทีหลัง)
        if (request.metadata?.promptpayId) {
            // สร้าง QR Code เอง (สำหรับทดสอบ)
            const { generatePromptPayPayload } = await import("./promptpay-qr")
            const mod: any = await import("qrcode")
            const QRCode = mod?.default ?? mod

            // Sanitize PromptPay
            let target = request.metadata.promptpayId
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

            const payload = generatePromptPayPayload({
                phoneOrId: target,
                amount: request.amount,
            })

            const qrCodeUrl = await QRCode.toDataURL(payload, {
                width: 300,
                margin: 2,
                color: { dark: "#000000", light: "#FFFFFF" },
            })

            // สร้าง Reference Number (จำลอง)
            const referenceNo = `INV${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

            // เก็บ payment ใน localStorage สำหรับทดสอบ
            const paymentData = {
                referenceNo,
                donationRequestId: request.donationRequestId,
                amount: request.amount,
                status: "pending" as PaymentStatusType,
                createdAt: new Date().toISOString(),
                gateway,
            }
            const payments = JSON.parse(localStorage.getItem("test_payments") || "[]")
            payments.push(paymentData)
            localStorage.setItem("test_payments", JSON.stringify(payments))

            return {
                success: true,
                qrCodeUrl,
                referenceNo,
                paymentId: referenceNo,
            }
        }

        // ถ้าไม่มี promptpayId ให้เรียก Gateway API จริง (สำหรับ Credit Card)
        // TODO: Implement real Gateway API call
        throw new Error("ต้องมี promptpayId สำหรับทดสอบ")
    } catch (error: any) {
        console.error("Payment Gateway Error:", error)
        return {
            success: false,
            error: error.message || "ไม่สามารถสร้าง QR Code ได้",
        }
    }
}

/**
 * ตรวจสอบสถานะการชำระเงิน
 */
export async function checkPaymentStatus(
    referenceNo: string,
    config: PaymentGatewayConfig
): Promise<PaymentStatus> {
    try {
        // สำหรับทดสอบ: อ่านจาก localStorage
        const payments = JSON.parse(localStorage.getItem("test_payments") || "[]")
        const payment = payments.find((p: any) => p.referenceNo === referenceNo)

        if (!payment) {
            return {
                referenceNo,
                status: "pending",
                amount: 0,
            }
        }

        return {
            referenceNo: payment.referenceNo,
            status: payment.status || "pending",
            amount: payment.amount,
            paidAt: payment.paidAt,
            transactionId: payment.transactionId,
        }
    } catch (error: any) {
        console.error("Check payment status error:", error)
        return {
            referenceNo,
            status: "failed",
            amount: 0,
            error: error.message,
        }
    }
}

/**
 * จำลอง Webhook จาก Payment Gateway (สำหรับทดสอบ)
 */
export async function simulateWebhook(
    referenceNo: string,
    status: PaymentStatusType,
    amount: number
): Promise<void> {
    try {
        // อัปเดต payment ใน localStorage
        const payments = JSON.parse(localStorage.getItem("test_payments") || "[]")
        const paymentIndex = payments.findIndex((p: any) => p.referenceNo === referenceNo)

        if (paymentIndex !== -1) {
            payments[paymentIndex].status = status
            payments[paymentIndex].paidAt = new Date().toISOString()
            payments[paymentIndex].transactionId = `TXN_${Date.now()}`
            localStorage.setItem("test_payments", JSON.stringify(payments))

            // ส่ง event เพื่อให้ component อัปเดต
            const paymentStatus: PaymentStatus = {
                referenceNo,
                status,
                amount,
                paidAt: payments[paymentIndex].paidAt,
                transactionId: payments[paymentIndex].transactionId,
            }

            window.dispatchEvent(
                new CustomEvent("payment-updated", {
                    detail: paymentStatus,
                })
            )
        }
    } catch (error) {
        console.error("Simulate webhook error:", error)
    }
}

/**
 * Helper functions
 */
function getGatewayBaseUrl(gateway: PaymentGateway): string {
    switch (gateway) {
        case "gbprimepay":
            return "https://api.gbprimepay.com"
        case "omise":
            return "https://api.omise.co"
        case "2c2p":
            return "https://api.2c2p.com"
        default:
            return ""
    }
}

function getCreateQREndpoint(gateway: PaymentGateway): string {
    switch (gateway) {
        case "gbprimepay":
            return "/v3/qrcode"
        case "omise":
            return "/charges"
        case "2c2p":
            return "/payment/4.3/qrcode"
        default:
            return ""
    }
}
