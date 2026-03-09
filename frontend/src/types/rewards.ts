export interface UserPoints {
    userId: string
    totalPoints: number
    availablePoints: number
    pointsHistory: PointsTransaction[]
    level: number
    levelName: string
    nextLevelPoints: number
}

export interface PointsTransaction {
    id: string
    type: "earned" | "spent"
    amount: number
    source: string
    description: string
    date: string
    relatedId?: string
}

export interface Reward {
    id: string
    name: string
    description: string
    category: "profile" | "badge" | "feature" | "physical"
    pointsCost: number
    image: string
    isActive: boolean
    isLimited: boolean
    limitQuantity?: number
    remainingQuantity?: number
    createdBy: string
    createdAt: string
    requirements?: {
        minLevel?: number
        minDonations?: number
        categories?: string[]
    }
}

export interface UserReward {
    id: string
    userId: string
    rewardId: string
    reward: Reward
    purchasedAt: string
    isActive: boolean
    expiresAt?: string
}

export interface ProfileCustomization {
    userId: string
    /** "default" = ธีมปกติ, "theme_xxx" = id จาก catalog */
    theme: string
    /** "" = ไม่มีตรา, "badge_xxx" = id จาก catalog */
    badge: string
    /** "none" = ไม่มีกรอบ, "frame_xxx" = id จาก catalog */
    frame: string
    /** "none" = ไม่มีตำแหน่ง, "title_xxx" = id จาก catalog */
    title: string
    background: string
    effects: string[]
}
export const POINTS_CONFIG = {
    // เงิน: น้อยกว่า 100 บาทได้ 5 คะแนน, 100 ขึ้นไปได้ 1 บาทละ 1 แต้ม
    MONEY_UNDER_100_POINTS: 5,

    // สิ่งของ: ยูสเซอร์กรอกมูลค่าโดยรวม น้อยกว่า 100 ได้ 5 คะแนน, 100 ขึ้นไปได้ 1 บาทละ 1 แต้ม, นำไปส่งถึงที่ x1.5
    ITEM_UNDER_100_POINTS: 5,

    // แรงงาน: คะแนนต่อชั่วโมงตามประเภท
    VOLUNTEER_RATES: {
        general: 10,     // งานทั่วไป
        skilled: 15,     // งานใช้ทักษะ (แปล, ช่าง)
        professional: 20, // งานเฉพาะทาง (แพทย์, วิศวกร)
    } as Record<string, number>,
    VOLUNTEER_MIN_POINTS: 30, // คะแนนขั้นต่ำต่อครั้ง (แม้ทำ < 1 ชม.)

    // อื่นๆ
    STORY_SHARE: 25,
    REFERRAL: 100,
    DAILY_LOGIN: 5,
    PROFILE_COMPLETE: 50,
}

export const USER_LEVELS = [
    { level: 1, name: "ผู้เริ่มต้น", minPoints: 0, color: "#94a3b8" },
    { level: 2, name: "ผู้ช่วยเหลือ", minPoints: 100, color: "#10b981" },
    { level: 3, name: "ผู้มีจิตใจดี", minPoints: 500, color: "#3b82f6" },
    { level: 4, name: "นักบุญแห่งการให้", minPoints: 1000, color: "#8b5cf6" },
    { level: 5, name: "ทูตแห่งความดี", minPoints: 2500, color: "#f59e0b" },
    { level: 6, name: "ตำนานแห่งการบริจาค", minPoints: 5000, color: "#ef4444" },
]
