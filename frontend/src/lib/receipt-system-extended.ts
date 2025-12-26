// /lib/receipt-system-extended.ts
import { receiptSystem } from "@/lib/receipt-system"

export interface ExtendedReceiptData {
    id: string
    receiptNumber: string
    donationId: string
    requestId: string
    requestTitle: string
    donorId: string
    donorName?: string
    amount?: number
    type: "money" | "items" | "volunteer"
    paymentMethod?: string
    transactionId?: string
    message?: string
    isAnonymous: boolean
    pointsEarned: number
    status: "pending" | "completed" | "cancelled" | "refunded"
    issuedAt: Date
    createdAt: Date
    updatedAt: Date
    bankAccount?: {
        bank?: string
        accountNumber?: string
        accountName?: string
    }
    promptpayNumber?: string
    metadata?: Record<string, any>
}

export const extendedReceiptSystem = {
    createReceiptWithBankInfo(data: {
        donationId: string
        requestId: string
        requestTitle: string
        donorId: string
        donorName?: string
        amount?: number
        type: "money" | "items" | "volunteer"
        paymentMethod?: string
        transactionId?: string
        message?: string
        isAnonymous: boolean
        pointsEarned: number
        bankAccount?: {
            bank?: string
            accountNumber?: string
            accountName?: string
        }
        promptpayNumber?: string
        metadata?: Record<string, any>
    }): ExtendedReceiptData {
        // ใช้ receipt system เดิม
        const receipt = receiptSystem.createReceipt({
            donationId: data.donationId,
            requestId: data.requestId,
            requestTitle: data.requestTitle,
            donorId: data.donorId,
            donorName: data.donorName,
            amount: data.amount,
            type: data.type,
            paymentMethod: data.paymentMethod,
            transactionId: data.transactionId,
            message: data.message,
            isAnonymous: data.isAnonymous,
            pointsEarned: data.pointsEarned
        })

        // บันทึกข้อมูลเพิ่มเติมใน extended receipts storage
        const extendedReceipt: ExtendedReceiptData = {
            ...receipt,
            bankAccount: data.bankAccount,
            promptpayNumber: data.promptpayNumber,
            metadata: data.metadata
        }

        // Save to extended storage
        const extendedReceipts = JSON.parse(localStorage.getItem("extended_receipts") || "[]")
        extendedReceipts.push(extendedReceipt)
        localStorage.setItem("extended_receipts", JSON.stringify(extendedReceipts))

        return extendedReceipt
    },

    getExtendedReceipts(): ExtendedReceiptData[] {
        return JSON.parse(localStorage.getItem("extended_receipts") || "[]")
    },

    getExtendedReceiptById(id: string): ExtendedReceiptData | null {
        const receipts = this.getExtendedReceipts()
        return receipts.find(r => r.id === id) || null
    }
}