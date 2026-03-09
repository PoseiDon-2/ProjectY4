import type { ReceiptData, DonationHistory, ReceiptFilter } from "@/types/receipt"

/** =========================
 * Utils
 * ========================= */
const isBrowser = typeof window !== "undefined"

const safeGet = (key: string) => {
    if (!isBrowser) return null
    return localStorage.getItem(key)
}

const safeSet = (key: string, value: string) => {
    if (!isBrowser) return
    localStorage.setItem(key, value)
}

/** =========================
 * Receipt System
 * ========================= */
class ReceiptSystem {
    private generateReceiptNumber(): string {
        const timestamp = Date.now().toString()
        const random = Math.random().toString(36).substring(2, 8).toUpperCase()
        return `RCP-${timestamp.slice(-6)}-${random}`
    }

    /** ---------- Receipts ---------- */

    createReceipt(donationData: {
        donationId: string
        requestId: string
        requestTitle: string
        donorId: string
        donorName?: string
        amount?: number
        type: "money" | "items" | "volunteer"
        paymentMethod?: string
        transactionId?: string
        items?: { name: string; quantity: number }[]
        deliveryMethod?: "send-to-address" | "drop-off"
        trackingNumber?: string
        volunteerHours?: number
        volunteerSkills?: string[]
        message?: string
        isAnonymous: boolean
        pointsEarned: number
        attachments?: {
            id: string
            url: string
            filename: string
            fileType: string
            fileSize: number
            uploadedAt: Date
        }[]
    }): ReceiptData {
        const receipt: ReceiptData = {
            id: `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            receiptNumber: this.generateReceiptNumber(),
            issuedAt: new Date(),
            status: "completed",
            createdAt: new Date(),
            updatedAt: new Date(),
            ...donationData,
            items: donationData.items?.map((item) => ({
                ...item,
                status: "pending",
            })),
        }

        this.saveReceipt(receipt)
        this.updateDonationHistory(receipt)

        return receipt
    }

    private saveReceipt(receipt: ReceiptData): void {
        if (!isBrowser) return
        const receipts = this.getAllReceipts()
        receipts.push(receipt)
        safeSet("donation_receipts", JSON.stringify(receipts))
    }

    getAllReceipts(): ReceiptData[] {
        if (!isBrowser) return []
        const receipts = safeGet("donation_receipts")
        return receipts ? JSON.parse(receipts) : []
    }

    getReceiptsByFilter(filter: ReceiptFilter): ReceiptData[] {
        return this.getAllReceipts().filter((receipt) => {
            if (filter.type && receipt.type !== filter.type) return false
            if (filter.status && receipt.status !== filter.status) return false
            if (filter.requestId && receipt.requestId !== filter.requestId) return false
            if (filter.donorId && receipt.donorId !== filter.donorId) return false
            if (filter.dateFrom && new Date(receipt.createdAt) < filter.dateFrom) return false
            if (filter.dateTo && new Date(receipt.createdAt) > filter.dateTo) return false
            return true
        })
    }

    getReceiptById(receiptId: string): ReceiptData | null {
        return this.getAllReceipts().find((r) => r.id === receiptId) || null
    }

    getReceiptsForRequest(requestId: string): ReceiptData[] {
        return this.getReceiptsByFilter({ requestId })
    }

    getReceiptsForDonor(donorId: string): ReceiptData[] {
        return this.getReceiptsByFilter({ donorId })
    }

    updateReceiptStatus(receiptId: string, status: ReceiptData["status"]): boolean {
        if (!isBrowser) return false
        const receipts = this.getAllReceipts()
        const index = receipts.findIndex((r) => r.id === receiptId)
        if (index === -1) return false

        receipts[index].status = status
        receipts[index].updatedAt = new Date()
        safeSet("donation_receipts", JSON.stringify(receipts))
        return true
    }

    updateItemStatus(
        receiptId: string,
        itemIndex: number,
        status: "pending" | "delivered" | "received"
    ): boolean {
        if (!isBrowser) return false
        const receipts = this.getAllReceipts()
        const receipt = receipts.find((r) => r.id === receiptId)
        if (!receipt || !receipt.items?.[itemIndex]) return false

        receipt.items[itemIndex].status = status
        receipt.updatedAt = new Date()
        safeSet("donation_receipts", JSON.stringify(receipts))
        return true
    }

    /** ---------- Donation History ---------- */

    private updateDonationHistory(receipt: ReceiptData): void {
        if (!isBrowser) return
        const histories = this.getAllDonationHistories()
        let history = histories.find((h) => h.requestId === receipt.requestId)

        if (!history) {
            history = {
                id: `history_${receipt.requestId}`,
                requestId: receipt.requestId,
                requestTitle: receipt.requestTitle,
                organizerId: "",
                organizerName: "",
                totalAmount: 0,
                totalDonations: 0,
                totalVolunteers: 0,
                totalItems: 0,
                recentDonations: [],
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            histories.push(history)
        }

        if (receipt.type === "money" && receipt.amount) {
            history.totalAmount += receipt.amount
            history.totalDonations += 1
        } else if (receipt.type === "items") {
            history.totalItems += receipt.items?.length || 1
            history.totalDonations += 1
        } else if (receipt.type === "volunteer") {
            history.totalVolunteers += 1
        }

        history.recentDonations.unshift(receipt)
        history.recentDonations = history.recentDonations.slice(0, 10)
        history.updatedAt = new Date()

        safeSet("donation_histories", JSON.stringify(histories))
    }

    getAllDonationHistories(): DonationHistory[] {
        if (!isBrowser) return []
        const histories = safeGet("donation_histories")
        return histories ? JSON.parse(histories) : []
    }

    getDonationHistory(requestId: string): DonationHistory | null {
        return this.getAllDonationHistories().find((h) => h.requestId === requestId) || null
    }

    /** ---------- UI Summary ---------- */

    generateReceiptSummary(receipt: ReceiptData) {
        if (receipt.type === "money") {
            return {
                title: "การบริจาคเงิน",
                subtitle: receipt.paymentMethod || "ไม่ระบุวิธีการชำระ",
                amount: `฿${new Intl.NumberFormat("th-TH").format(receipt.amount || 0)}`,
                status: receipt.status,
            }
        }

        if (receipt.type === "items") {
            return {
                title: "การบริจาคสิ่งของ",
                subtitle: `${receipt.items?.length || 0} รายการ`,
                amount: receipt.deliveryMethod === "send-to-address" ? "จัดส่ง" : "นำไปส่ง",
                status: receipt.status,
            }
        }

        return {
            title: "การสมัครอาสาสมัคร",
            subtitle: receipt.volunteerSkills?.join(", ") || "ไม่ระบุทักษะ",
            amount: `${receipt.volunteerHours || 0} ชั่วโมง`,
            status: receipt.status,
        }
    }
}

/** =========================
 * Exports
 * ========================= */
export const receiptSystem = new ReceiptSystem()

export const initializeMockReceipts = () => {
    if (!isBrowser) return
    if (receiptSystem.getAllReceipts().length > 0) return

    const mockReceipts: ReceiptData[] = [
        {
            id: "receipt_mock_001",
            receiptNumber: "RCP-000001-MOCK",
            donationId: "donation_001",
            requestId: "req_001",
            requestTitle: "ช่วยเหลือเด็กกำพร้า",
            donorId: "donor_001",
            donorName: "คุณสมชาย",
            amount: 5000,
            type: "money",
            paymentMethod: "โอนธนาคาร",
            isAnonymous: false,
            pointsEarned: 500,
            status: "completed",
            issuedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]

    safeSet("donation_receipts", JSON.stringify(mockReceipts))
    safeSet("donation_histories", JSON.stringify([]))
}
