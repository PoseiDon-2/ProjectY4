import type { ReceiptData, DonationHistory, ReceiptFilter } from "@/types/receipt"

class ReceiptSystem {
    private generateReceiptNumber(): string {
        const timestamp = Date.now().toString()
        const random = Math.random().toString(36).substring(2, 8).toUpperCase()
        return `RCP-${timestamp.slice(-6)}-${random}`
    }

    // Create receipt for donation
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
        attachments?: { id: string; url: string; filename: string; fileType: string; fileSize: number; uploadedAt: Date }[]
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
                status: "pending" as const,
            })),
        }

        // Store receipt
        this.saveReceipt(receipt)

        // Update donation history
        this.updateDonationHistory(receipt)

        return receipt
    }

    // Save receipt to storage
    private saveReceipt(receipt: ReceiptData): void {
        const receipts = this.getAllReceipts()
        receipts.push(receipt)
        localStorage.setItem("donation_receipts", JSON.stringify(receipts))
    }

    // Get all receipts
    getAllReceipts(): ReceiptData[] {
        const receipts = localStorage.getItem("donation_receipts")
        return receipts ? JSON.parse(receipts) : []
    }

    // Get receipts by filter
    getReceiptsByFilter(filter: ReceiptFilter): ReceiptData[] {
        const receipts = this.getAllReceipts()

        return receipts.filter((receipt) => {
            if (filter.type && receipt.type !== filter.type) return false
            if (filter.status && receipt.status !== filter.status) return false
            if (filter.requestId && receipt.requestId !== filter.requestId) return false
            if (filter.donorId && receipt.donorId !== filter.donorId) return false
            if (filter.dateFrom && new Date(receipt.createdAt) < filter.dateFrom) return false
            if (filter.dateTo && new Date(receipt.createdAt) > filter.dateTo) return false

            return true
        })
    }

    // Get receipt by ID
    getReceiptById(receiptId: string): ReceiptData | null {
        const receipts = this.getAllReceipts()
        return receipts.find((receipt) => receipt.id === receiptId) || null
    }

    // Get receipts for a specific request
    getReceiptsForRequest(requestId: string): ReceiptData[] {
        return this.getReceiptsByFilter({ requestId })
    }

    // Get receipts for a specific donor
    getReceiptsForDonor(donorId: string): ReceiptData[] {
        return this.getReceiptsByFilter({ donorId })
    }

    // Update donation history
    private updateDonationHistory(receipt: ReceiptData): void {
        const histories = this.getAllDonationHistories()
        let history = histories.find((h) => h.requestId === receipt.requestId)

        if (!history) {
            history = {
                id: `history_${receipt.requestId}`,
                requestId: receipt.requestId,
                requestTitle: receipt.requestTitle,
                organizerId: "", // Will be filled from request data
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

        // Update stats
        if (receipt.type === "money" && receipt.amount) {
            history.totalAmount += receipt.amount
            history.totalDonations += 1
        } else if (receipt.type === "items") {
            history.totalItems += receipt.items?.length || 1
            history.totalDonations += 1
        } else if (receipt.type === "volunteer") {
            history.totalVolunteers += 1
        }

        // Add to recent donations (keep last 10)
        history.recentDonations.unshift(receipt)
        history.recentDonations = history.recentDonations.slice(0, 10)

        history.updatedAt = new Date()

        localStorage.setItem("donation_histories", JSON.stringify(histories))
    }

    // Get all donation histories
    getAllDonationHistories(): DonationHistory[] {
        const histories = localStorage.getItem("donation_histories")
        return histories ? JSON.parse(histories) : []
    }

    // Get donation history for request
    getDonationHistory(requestId: string): DonationHistory | null {
        const histories = this.getAllDonationHistories()
        return histories.find((h) => h.requestId === requestId) || null
    }

    // Update receipt status
    updateReceiptStatus(receiptId: string, status: ReceiptData["status"]): boolean {
        const receipts = this.getAllReceipts()
        const receiptIndex = receipts.findIndex((r) => r.id === receiptId)

        if (receiptIndex === -1) return false

        receipts[receiptIndex].status = status
        receipts[receiptIndex].updatedAt = new Date()

        localStorage.setItem("donation_receipts", JSON.stringify(receipts))
        return true
    }

    // Update item delivery status
    updateItemStatus(receiptId: string, itemIndex: number, status: "pending" | "delivered" | "received"): boolean {
        const receipts = this.getAllReceipts()
        const receiptIndex = receipts.findIndex((r) => r.id === receiptId)

        if (receiptIndex === -1 || !receipts[receiptIndex].items) return false

        if (receipts[receiptIndex].items![itemIndex]) {
            receipts[receiptIndex].items![itemIndex].status = status
            receipts[receiptIndex].updatedAt = new Date()

            localStorage.setItem("donation_receipts", JSON.stringify(receipts))
            return true
        }

        return false
    }

    // Generate receipt summary for display
    generateReceiptSummary(receipt: ReceiptData): {
        title: string
        subtitle: string
        amount: string
        status: string
        statusColor: string
    } {
        let title = ""
        let subtitle = ""
        let amount = ""

        if (receipt.type === "money") {
            title = "การบริจาคเงิน"
            subtitle = receipt.paymentMethod || "ไม่ระบุวิธีการชำระ"
            amount = `฿${new Intl.NumberFormat("th-TH").format(receipt.amount || 0)}`
        } else if (receipt.type === "items") {
            title = "การบริจาคสิ่งของ"
            subtitle = `${receipt.items?.length || 0} รายการ`
            amount = receipt.deliveryMethod === "send-to-address" ? "ส่งตามที่อยู่" : "นำไปส่งถึงที่"
        } else if (receipt.type === "volunteer") {
            title = "การสมัครอาสาสมัคร"
            subtitle = receipt.volunteerSkills?.join(", ") || "ไม่ระบุทักษะ"
            amount = `${receipt.volunteerHours || 0} ชั่วโมง`
        }

        // แก้ไขปัญหา type safety โดยใช้ type assertion
        const statusColors = {
            pending: "text-yellow-600 bg-yellow-50",
            completed: "text-green-600 bg-green-50",
            cancelled: "text-red-600 bg-red-50",
            refunded: "text-gray-600 bg-gray-50",
        } as const

        const statusTexts = {
            pending: "รอดำเนินการ",
            completed: "สำเร็จ",
            cancelled: "ยกเลิก",
            refunded: "คืนเงิน",
        } as const

        // ใช้ type guard เพื่อให้ TypeScript รู้ว่า status เป็น key ที่ถูกต้อง
        const status = receipt.status
        const isValidStatus = (s: string): s is keyof typeof statusTexts => {
            return s in statusTexts
        }

        return {
            title,
            subtitle,
            amount,
            status: isValidStatus(status) ? statusTexts[status] : "ไม่รู้จัก",
            statusColor: isValidStatus(status) ? statusColors[status] : "text-gray-600 bg-gray-50",
        }
    }
}

export const receiptSystem = new ReceiptSystem()

export const initializeMockReceipts = () => {
    // Check if mock data already exists
    const existingReceipts = receiptSystem.getAllReceipts()
    if (existingReceipts.length > 0) return

    const mockReceipts: ReceiptData[] = [
        // ... mock data เดิมทั้งหมด (เปลี่ยนจาก Receipt เป็น ReceiptData)
        {
            id: "receipt_1703123456789_abc123",
            receiptNumber: "RCP-123456-ABC123",
            donationId: "donation_001",
            requestId: "req_001",
            requestTitle: "ช่วยเหลือเด็กกำพร้าในพื้นที่ห่างไกล",
            donorId: "donor_001",
            donorName: "คุณสมชาย ใจดี",
            amount: 5000,
            type: "money",
            paymentMethod: "โอนผ่านธนาคาร",
            transactionId: "TXN001234567890",
            message: "ขอให้ใช้เงินนี้เพื่อซื้อหนังสือและอุปกรณ์การเรียนให้เด็กๆ",
            isAnonymous: false,
            pointsEarned: 500,
            attachments: [
                {
                    id: "att_001",
                    url: "/bank-transfer-receipt-slip.jpg",
                    filename: "bank_transfer_receipt.jpg",
                    fileType: "image/jpeg",
                    fileSize: 245760,
                    uploadedAt: new Date("2024-01-15T10:32:00"),
                },
                {
                    id: "att_002",
                    url: "/mobile-banking-confirmation-screen.jpg",
                    filename: "mobile_banking_confirmation.png",
                    fileType: "image/png",
                    fileSize: 189440,
                    uploadedAt: new Date("2024-01-15T10:33:00"),
                },
            ],
            status: "completed",
            issuedAt: new Date("2024-01-15T10:30:00"),
            createdAt: new Date("2024-01-15T10:30:00"),
            updatedAt: new Date("2024-01-15T10:30:00"),
        },
        // ... mock data อื่นๆ ทั้งหมด
    ]

    // Save mock receipts
    localStorage.setItem("donation_receipts", JSON.stringify(mockReceipts))

    // Create corresponding donation histories
    const mockHistories: DonationHistory[] = [
        // ... mock histories เดิม
    ]

    localStorage.setItem("donation_histories", JSON.stringify(mockHistories))
}

if (typeof window !== "undefined") {
    initializeMockReceipts()
}