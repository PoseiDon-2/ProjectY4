import type { Receipt, DonationHistory, ReceiptFilter } from "@/types/receipt"

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
    }): Receipt {
        const receipt: Receipt = {
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
    private saveReceipt(receipt: Receipt): void {
        const receipts = this.getAllReceipts()
        receipts.push(receipt)
        localStorage.setItem("donation_receipts", JSON.stringify(receipts))
    }

    // Get all receipts
    getAllReceipts(): Receipt[] {
        const receipts = localStorage.getItem("donation_receipts")
        return receipts ? JSON.parse(receipts) : []
    }

    // Get receipts by filter
    getReceiptsByFilter(filter: ReceiptFilter): Receipt[] {
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
    getReceiptById(receiptId: string): Receipt | null {
        const receipts = this.getAllReceipts()
        return receipts.find((receipt) => receipt.id === receiptId) || null
    }

    // Get receipts for a specific request
    getReceiptsForRequest(requestId: string): Receipt[] {
        return this.getReceiptsByFilter({ requestId })
    }

    // Get receipts for a specific donor
    getReceiptsForDonor(donorId: string): Receipt[] {
        return this.getReceiptsByFilter({ donorId })
    }

    // Update donation history
    private updateDonationHistory(receipt: Receipt): void {
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
    updateReceiptStatus(receiptId: string, status: Receipt["status"]): boolean {
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
    generateReceiptSummary(receipt: Receipt): {
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

        const statusColors = {
            pending: "text-yellow-600 bg-yellow-50",
            completed: "text-green-600 bg-green-50",
            cancelled: "text-red-600 bg-red-50",
            refunded: "text-gray-600 bg-gray-50",
        }

        const statusTexts = {
            pending: "รอดำเนินการ",
            completed: "สำเร็จ",
            cancelled: "ยกเลิก",
            refunded: "คืนเงิน",
        }

        return {
            title,
            subtitle,
            amount,
            status: statusTexts[receipt.status],
            statusColor: statusColors[receipt.status],
        }
    }
}

export const receiptSystem = new ReceiptSystem()

export const initializeMockReceipts = () => {
    // Check if mock data already exists
    const existingReceipts = receiptSystem.getAllReceipts()
    if (existingReceipts.length > 0) return

    const mockReceipts: Receipt[] = [
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
        {
            id: "receipt_1703123456790_def456",
            receiptNumber: "RCP-123457-DEF456",
            donationId: "donation_002",
            requestId: "req_002",
            requestTitle: "ขอรับบริจาคอุปกรณ์การแพทย์สำหรับโรงพยาบาลชุมชน",
            donorId: "donor_002",
            donorName: "คุณสมหญิง มีใจ",
            type: "items",
            items: [
                { name: "เครื่องวัดความดัน", quantity: 2, status: "delivered" },
                { name: "เครื่องวัดไข้", quantity: 5, status: "delivered" },
                { name: "หน้ากากอนามัย", quantity: 100, status: "received" },
            ],
            deliveryMethod: "send-to-address",
            trackingNumber: "TH1234567890",
            message: "หวังว่าจะช่วยให้การรักษาพยาบาลดีขึ้น",
            isAnonymous: false,
            pointsEarned: 50,
            attachments: [
                {
                    id: "att_003",
                    url: "/medical-equipment-donation-receipt.jpg",
                    filename: "medical_equipment_receipt.jpg",
                    fileType: "image/jpeg",
                    fileSize: 312580,
                    uploadedAt: new Date("2024-01-14T14:22:00"),
                },
                {
                    id: "att_004",
                    url: "/delivery-confirmation-slip.jpg",
                    filename: "delivery_confirmation.jpg",
                    fileType: "image/jpeg",
                    fileSize: 198720,
                    uploadedAt: new Date("2024-01-16T09:10:00"),
                },
            ],
            status: "completed",
            issuedAt: new Date("2024-01-14T14:20:00"),
            createdAt: new Date("2024-01-14T14:20:00"),
            updatedAt: new Date("2024-01-16T09:15:00"),
        },
        {
            id: "receipt_1703123456791_ghi789",
            receiptNumber: "RCP-123458-GHI789",
            donationId: "donation_003",
            requestId: "req_003",
            requestTitle: "ต้องการอาสาสมัครช่วยสอนเด็กในชุมชน",
            donorId: "donor_003",
            donorName: "คุณวิชัย รักการสอน",
            type: "volunteer",
            volunteerHours: 20,
            volunteerSkills: ["สอนคณิตศาสตร์", "สอนภาษาอังกฤษ", "กิจกรรมเด็ก"],
            message: "ยินดีที่จะมาช่วยสอนเด็กๆ ทุกวันเสาร์-อาทิตย์",
            isAnonymous: false,
            pointsEarned: 100,
            attachments: [
                {
                    id: "att_005",
                    url: "/volunteer-registration-form.jpg",
                    filename: "volunteer_registration.pdf",
                    fileType: "application/pdf",
                    fileSize: 156890,
                    uploadedAt: new Date("2024-01-13T16:47:00"),
                },
            ],
            status: "completed",
            issuedAt: new Date("2024-01-13T16:45:00"),
            createdAt: new Date("2024-01-13T16:45:00"),
            updatedAt: new Date("2024-01-13T16:45:00"),
        },
        {
            id: "receipt_1703123456792_jkl012",
            receiptNumber: "RCP-123459-JKL012",
            donationId: "donation_004",
            requestId: "req_001",
            requestTitle: "ช่วยเหลือเด็กกำพร้าในพื้นที่ห่างไกล",
            donorId: "donor_004",
            amount: 2000,
            type: "money",
            paymentMethod: "บัตรเครดิต",
            transactionId: "CC987654321",
            message: "ขอให้เด็กๆ มีอนาคตที่ดี",
            isAnonymous: true,
            pointsEarned: 200,
            attachments: [
                {
                    id: "att_006",
                    url: "/credit-card-payment-receipt.jpg",
                    filename: "credit_card_receipt.jpg",
                    fileType: "image/jpeg",
                    fileSize: 167890,
                    uploadedAt: new Date("2024-01-12T11:17:00"),
                },
            ],
            status: "completed",
            issuedAt: new Date("2024-01-12T11:15:00"),
            createdAt: new Date("2024-01-12T11:15:00"),
            updatedAt: new Date("2024-01-12T11:15:00"),
        },
        {
            id: "receipt_1703123456793_mno345",
            receiptNumber: "RCP-123460-MNO345",
            donationId: "donation_005",
            requestId: "req_004",
            requestTitle: "ขอรับบริจาคเสื้อผ้าสำหรับผู้ประสบภัย",
            donorId: "donor_005",
            donorName: "คุณมาลี ใจบุญ",
            type: "items",
            items: [
                { name: "เสื้อยืดผู้ใหญ่", quantity: 20, status: "pending" },
                { name: "กางเกงยีนส์", quantity: 15, status: "pending" },
                { name: "เสื้อเด็ก", quantity: 30, status: "pending" },
            ],
            deliveryMethod: "drop-off",
            message: "เสื้อผ้าสะอาดและสภาพดี พร้อมใช้งาน",
            isAnonymous: false,
            pointsEarned: 50,
            attachments: [
                {
                    id: "att_007",
                    url: "/clothing-donation-receipt.jpg",
                    filename: "clothing_donation_receipt.jpg",
                    fileType: "image/jpeg",
                    fileSize: 234560,
                    uploadedAt: new Date("2024-01-16T09:32:00"),
                },
                {
                    id: "att_008",
                    url: "/clothing-items-photo.jpg",
                    filename: "donated_clothes_photo.jpg",
                    fileType: "image/jpeg",
                    fileSize: 445670,
                    uploadedAt: new Date("2024-01-16T09:35:00"),
                },
                {
                    id: "att_009",
                    url: "/drop-off-location-receipt.jpg",
                    filename: "drop_off_receipt.jpg",
                    fileType: "image/jpeg",
                    fileSize: 178920,
                    uploadedAt: new Date("2024-01-16T09:40:00"),
                },
            ],
            status: "pending",
            issuedAt: new Date("2024-01-16T09:30:00"),
            createdAt: new Date("2024-01-16T09:30:00"),
            updatedAt: new Date("2024-01-16T09:30:00"),
        },
        {
            id: "receipt_1703123456794_pqr678",
            receiptNumber: "RCP-123461-PQR678",
            donationId: "donation_006",
            requestId: "req_002",
            requestTitle: "ขอรับบริจาคอุปกรณ์การแพทย์สำหรับโรงพยาบาลชุมชน",
            donorId: "donor_006",
            donorName: "คุณประยุทธ์ ช่วยเหลือ",
            amount: 10000,
            type: "money",
            paymentMethod: "โอนผ่านแอปธนาคาร",
            transactionId: "APP555666777",
            message: "สนับสนุนการแพทย์ชุมชน",
            isAnonymous: false,
            pointsEarned: 1000,
            attachments: [
                {
                    id: "att_010",
                    url: "/mobile-app-transfer-receipt.jpg",
                    filename: "mobile_app_transfer.jpg",
                    fileType: "image/jpeg",
                    fileSize: 289340,
                    uploadedAt: new Date("2024-01-11T13:22:00"),
                },
                {
                    id: "att_011",
                    url: "/bank-statement-confirmation.jpg",
                    filename: "bank_statement.jpg",
                    fileType: "image/jpeg",
                    fileSize: 356780,
                    uploadedAt: new Date("2024-01-11T13:25:00"),
                },
            ],
            status: "completed",
            issuedAt: new Date("2024-01-11T13:20:00"),
            createdAt: new Date("2024-01-11T13:20:00"),
            updatedAt: new Date("2024-01-11T13:20:00"),
        },
    ]

    // Save mock receipts
    localStorage.setItem("donation_receipts", JSON.stringify(mockReceipts))

    // Create corresponding donation histories
    const mockHistories: DonationHistory[] = [
        {
            id: "history_req_001",
            requestId: "req_001",
            requestTitle: "ช่วยเหลือเด็กกำพร้าในพื้นที่ห่างไกล",
            organizerId: "org_001",
            organizerName: "มูลนิธิเด็กและเยาวชน",
            totalAmount: 7000,
            totalDonations: 2,
            totalVolunteers: 0,
            totalItems: 0,
            recentDonations: [mockReceipts[0], mockReceipts[3]],
            status: "active",
            createdAt: new Date("2024-01-10T00:00:00"),
            updatedAt: new Date("2024-01-15T10:30:00"),
        },
        {
            id: "history_req_002",
            requestId: "req_002",
            requestTitle: "ขอรับบริจาคอุปกรณ์การแพทย์สำหรับโรงพยาบาลชุมชน",
            organizerId: "org_002",
            organizerName: "โรงพยาบาลชุมชนบ้านสวน",
            totalAmount: 10000,
            totalDonations: 2,
            totalVolunteers: 0,
            totalItems: 3,
            recentDonations: [mockReceipts[5], mockReceipts[1]],
            status: "active",
            createdAt: new Date("2024-01-09T00:00:00"),
            updatedAt: new Date("2024-01-16T09:15:00"),
        },
        {
            id: "history_req_003",
            requestId: "req_003",
            requestTitle: "ต้องการอาสาสมัครช่วยสอนเด็กในชุมชน",
            organizerId: "org_003",
            organizerName: "ศูนย์การเรียนรู้ชุมชน",
            totalAmount: 0,
            totalDonations: 0,
            totalVolunteers: 1,
            totalItems: 0,
            recentDonations: [mockReceipts[2]],
            status: "active",
            createdAt: new Date("2024-01-08T00:00:00"),
            updatedAt: new Date("2024-01-13T16:45:00"),
        },
        {
            id: "history_req_004",
            requestId: "req_004",
            requestTitle: "ขอรับบริจาคเสื้อผ้าสำหรับผู้ประสบภัย",
            organizerId: "org_004",
            organizerName: "ศูนย์ช่วยเหลือผู้ประสบภัย",
            totalAmount: 0,
            totalDonations: 1,
            totalVolunteers: 0,
            totalItems: 3,
            recentDonations: [mockReceipts[4]],
            status: "active",
            createdAt: new Date("2024-01-15T00:00:00"),
            updatedAt: new Date("2024-01-16T09:30:00"),
        },
    ]

    localStorage.setItem("donation_histories", JSON.stringify(mockHistories))
}

if (typeof window !== "undefined") {
    initializeMockReceipts()
}
