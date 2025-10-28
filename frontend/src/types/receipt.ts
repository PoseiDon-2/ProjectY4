export interface ReceiptData  {
    id: string
    donationId: string
    requestId: string
    requestTitle: string
    donorId: string
    donorName?: string
    amount?: number
    type: "money" | "items" | "volunteer"
    status: "pending" | "completed" | "cancelled" | "refunded"

    // Receipt details
    receiptNumber: string
    issuedAt: Date

    // Payment details (for money donations)
    paymentMethod?: string
    transactionId?: string

    // Item details (for item donations)
    items?: {
        name: string
        quantity: number
        status: "pending" | "delivered" | "received"
    }[]
    deliveryMethod?: "send-to-address" | "drop-off"
    trackingNumber?: string

    // Volunteer details
    volunteerHours?: number
    volunteerSkills?: string[]

    // Attachment support for receipt images
    attachments?: {
        id: string
        url: string
        filename: string
        fileType: string
        fileSize: number
        uploadedAt: Date
    }[]

    // Additional info
    message?: string
    isAnonymous: boolean
    pointsEarned: number

    // Timestamps
    createdAt: Date
    updatedAt: Date
}

export interface DonationHistory {
    id: string
    requestId: string
    requestTitle: string
    organizerId: string
    organizerName: string

    // Summary stats
    totalAmount: number
    totalDonations: number
    totalVolunteers: number
    totalItems: number

    // Recent donations
    recentDonations: ReceiptData []

    // Status tracking
    status: "active" | "completed" | "cancelled"

    // Timestamps
    createdAt: Date
    updatedAt: Date
}

export interface ReceiptFilter {
    type?: "money" | "items" | "volunteer"
    status?: "pending" | "completed" | "cancelled" | "refunded"
    dateFrom?: Date
    dateTo?: Date
    requestId?: string
    donorId?: string
}
