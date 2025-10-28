export interface MockUser {
    id: string
    email: string
    password: string
    firstName: string
    lastName: string
    phone: string
    avatar?: string
    joinDate: string
    totalDonated: number
    donationCount: number
    favoriteCategories: string[]
    interests: string[]
    role: "user" | "organizer" | "admin"
    organizationName?: string
    organizationType?: string
    isVerified: boolean
    isEmailVerified: boolean
    documentsVerified?: boolean
}

export interface MockDonationRequest {
    id: number
    title: string
    description: string
    category: string
    goalAmount: number
    currentAmount: number
    organizerId: string
    organizerName: string
    organizationType: string
    location: string
    deadline: string
    imageUrl: string
    status: "active" | "completed" | "cancelled"
    createdAt: string
    updatedAt: string
    tags: string[]
    urgency: "low" | "medium" | "high"
    verified: boolean
}

export interface MockDonation {
    id: string
    requestId: number
    requestTitle: string
    donorId: string
    donorName?: string
    type: "money" | "item" | "volunteer"
    date: string
    status: "completed" | "pending" | "shipped" | "received" | "cancelled"
    amount?: number
    items?: { name: string; quantity: number; status?: "shipped" | "received" | "pending" }[]
    paymentMethod?: string
    trackingNumber?: string
    volunteerHours?: number
    volunteerSkills?: string[]
    message?: string
    isAnonymous: boolean
    pointsEarned: number
}

// Mock Users
export const mockUsers: MockUser[] = [
    {
        id: "user_1",
        email: "user@example.com",
        password: "password123",
        firstName: "สมชาย",
        lastName: "ใจดี",
        phone: "081-234-5678",
        avatar: "/placeholder.svg?height=100&width=100",
        joinDate: "2024-01-01",
        totalDonated: 15000,
        donationCount: 8,
        favoriteCategories: ["การแพทย์", "การศึกษา"],
        interests: ["medical-health", "education-learning", "disaster-relief"],
        role: "user",
        isVerified: true,
        isEmailVerified: true,
    },
    {
        id: "user_2",
        email: "organizer@example.com",
        password: "organizer123",
        firstName: "สมหญิง",
        lastName: "จัดการ",
        phone: "082-345-6789",
        joinDate: "2024-01-10",
        totalDonated: 0,
        donationCount: 0,
        favoriteCategories: [],
        interests: [],
        role: "organizer",
        organizationName: "โรงเรียนบ้านดอนตาล",
        organizationType: "school",
        isVerified: true,
        isEmailVerified: true,
        documentsVerified: true,
    },
    {
        id: "user_3",
        email: "admin@example.com",
        password: "admin123",
        firstName: "ผู้ดูแล",
        lastName: "ระบบ",
        phone: "083-456-7890",
        joinDate: "2024-01-01",
        totalDonated: 0,
        donationCount: 0,
        favoriteCategories: [],
        interests: [],
        role: "admin",
        isVerified: true,
        isEmailVerified: true,
    },
    {
        id: "user_4",
        email: "demo@test.com",
        password: "demo123",
        firstName: "ทดสอบ",
        lastName: "ระบบ",
        phone: "084-567-8901",
        joinDate: "2024-01-15",
        totalDonated: 8500,
        donationCount: 5,
        favoriteCategories: ["สัตว์", "ภัยพิบัติ"],
        interests: ["animal-welfare", "disaster-relief", "environment", "community-development"],
        role: "user",
        isVerified: true,
        isEmailVerified: true,
    },
]

// Mock Donation Requests
export const mockDonationRequests: MockDonationRequest[] = [
    {
        id: 1,
        title: "ช่วยเหลือเด็กกำพร้าในพื้นที่ห่างไกล",
        description: "ต้องการความช่วยเหลือสำหรับเด็กกำพร้า 50 คน ในพื้นที่ห่างไกล",
        category: "การศึกษา",
        goalAmount: 100000,
        currentAmount: 45000,
        organizerId: "user_2",
        organizerName: "มูลนิธิเด็กและเยาวชน",
        organizationType: "foundation",
        location: "จังหวัดเชียงราย",
        deadline: "2025-12-31",
        imageUrl: "/children-education.jpg",
        status: "active",
        createdAt: "2024-01-10",
        updatedAt: "2024-01-15",
        tags: ["การศึกษา", "เด็ก", "ชนบท"],
        urgency: "high",
        verified: true,
    },
    {
        id: 2,
        title: "ระดมทุนผ่าตัดหัวใจเด็ก",
        description: "เด็กชายอายุ 8 ขวบ ต้องการเงินทุนสำหรับการผ่าตัดหัวใจ",
        category: "การแพทย์",
        goalAmount: 500000,
        currentAmount: 320000,
        organizerId: "user_2",
        organizerName: "โรงพยาบาลเด็ก",
        organizationType: "hospital",
        location: "กรุงเทพมหานคร",
        deadline: "2025-08-31",
        imageUrl: "/medical-surgery.jpg",
        status: "active",
        createdAt: "2024-01-05",
        updatedAt: "2024-01-14",
        tags: ["การแพทย์", "เด็ก", "ฉุกเฉิน"],
        urgency: "high",
        verified: true,
    },
    {
        id: 3,
        title: "สร้างห้องสมุดให้โรงเรียนชนบท",
        description: "โรงเรียนในชนบทต้องการหนังสือและอุปกรณ์การเรียน",
        category: "การศึกษา",
        goalAmount: 80000,
        currentAmount: 52000,
        organizerId: "user_2",
        organizerName: "โรงเรียนบ้านดอนตาล",
        organizationType: "school",
        location: "จังหวัดอุบลราชธานี",
        deadline: "2025-10-31",
        imageUrl: "/library-books.jpg",
        status: "active",
        createdAt: "2024-01-08",
        updatedAt: "2024-01-13",
        tags: ["การศึกษา", "หนังสือ", "โรงเรียน"],
        urgency: "medium",
        verified: true,
    },
]

// Mock Donations
export const mockDonations: MockDonation[] = [
    {
        id: "donation_1",
        requestId: 1,
        requestTitle: "ช่วยเหลือเด็กกำพร้าในพื้นที่ห่างไกล",
        donorId: "user_1",
        donorName: "สมชาย ใจดี",
        type: "money",
        date: "2025-07-20T10:00:00Z",
        status: "completed",
        amount: 5000,
        paymentMethod: "โอนผ่านธนาคาร",
        message: "ขอให้ใช้เงินนี้เพื่อซื้อหนังสือและอุปกรณ์การเรียนให้เด็กๆ",
        isAnonymous: false,
        pointsEarned: 500,
    },
    {
        id: "donation_2",
        requestId: 2,
        requestTitle: "ระดมทุนผ่าตัดหัวใจเด็ก",
        donorId: "user_4",
        donorName: "ทดสอบ ระบบ",
        type: "money",
        date: "2025-07-10T09:15:00Z",
        status: "completed",
        amount: 10000,
        paymentMethod: "บัตรเครดิต",
        message: "ขอให้หายเร็วๆ นะครับ",
        isAnonymous: false,
        pointsEarned: 1000,
    },
    {
        id: "donation_3",
        requestId: 3,
        requestTitle: "สร้างห้องสมุดให้โรงเรียนชนบท",
        donorId: "user_1",
        donorName: "สมชาย ใจดี",
        type: "item",
        date: "2025-07-15T14:30:00Z",
        status: "shipped",
        items: [
            { name: "หนังสือเรียนคณิตศาสตร์", quantity: 10, status: "shipped" },
            { name: "สมุดบันทึก", quantity: 50, status: "shipped" },
        ],
        trackingNumber: "TH123456789",
        message: "หวังว่าจะเป็นประโยชน์กับเด็กๆ",
        isAnonymous: false,
        pointsEarned: 50,
    },
]

// Mock Favorites
export const mockFavorites: { userId: string; requestId: number }[] = [
    { userId: "user_1", requestId: 1 },
    { userId: "user_1", requestId: 2 },
    { userId: "user_4", requestId: 3 },
]

// Helper functions
export function findUserByEmail(email: string): MockUser | undefined {
    return mockUsers.find((u) => u.email === email)
}

export function findUserById(id: string): MockUser | undefined {
    return mockUsers.find((u) => u.id === id)
}

export function getDonationRequestById(id: number): MockDonationRequest | undefined {
    return mockDonationRequests.find((r) => r.id === id)
}

export function getDonationsByUserId(userId: string): MockDonation[] {
    return mockDonations.filter((d) => d.donorId === userId)
}

export function getDonationsByRequestId(requestId: number): MockDonation[] {
    return mockDonations.filter((d) => d.requestId === requestId)
}

export function getFavoritesByUserId(userId: string): number[] {
    return mockFavorites.filter((f) => f.userId === userId).map((f) => f.requestId)
}

export function isFavorite(userId: string, requestId: number): boolean {
    return mockFavorites.some((f) => f.userId === userId && f.requestId === requestId)
}

export function toggleFavorite(userId: string, requestId: number): "added" | "removed" {
    const index = mockFavorites.findIndex((f) => f.userId === userId && f.requestId === requestId)

    if (index >= 0) {
        mockFavorites.splice(index, 1)
        return "removed"
    } else {
        mockFavorites.push({ userId, requestId })
        return "added"
    }
}

export function addDonation(donation: MockDonation): void {
    mockDonations.push(donation)

    // Update request current amount if it's a money donation
    if (donation.type === "money" && donation.amount) {
        const request = getDonationRequestById(donation.requestId)
        if (request) {
            request.currentAmount += donation.amount
        }
    }

    // Update user donation stats
    const user = findUserById(donation.donorId)
    if (user) {
        user.donationCount += 1
        if (donation.type === "money" && donation.amount) {
            user.totalDonated += donation.amount
        }
    }
}

export function addUser(user: MockUser): void {
    mockUsers.push(user)
}
