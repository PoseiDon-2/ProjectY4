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
    theme: "default" | "gold" | "platinum" | "diamond"
    badge: "" | "heart" | "crown" | "star" | "diamond"
    frame: "none" | "rainbow" | "fire" | "ice"
    title: "none" | "helper" | "guardian" | "legend"
    background: string
    effects: string[]
}
export const POINTS_CONFIG = {
    MONEY_DONATION: 10, // 10 points per 100 THB
    ITEM_DONATION: 50, // 50 points per item
    VOLUNTEER_HOURS: 20, // 20 points per hour
    STORY_SHARE: 25, // 25 points for sharing story
    REFERRAL: 100, // 100 points for successful referral
    DAILY_LOGIN: 5, // 5 points for daily login
    PROFILE_COMPLETE: 50, // 50 points for completing profile
}

export const USER_LEVELS = [
    { level: 1, name: "ผู้เริ่มต้น", minPoints: 0, color: "#94a3b8" },
    { level: 2, name: "ผู้ช่วยเหลือ", minPoints: 100, color: "#10b981" },
    { level: 3, name: "ผู้มีจิตใจดี", minPoints: 500, color: "#3b82f6" },
    { level: 4, name: "นักบุญแห่งการให้", minPoints: 1000, color: "#8b5cf6" },
    { level: 5, name: "ทูตแห่งความดี", minPoints: 2500, color: "#f59e0b" },
    { level: 6, name: "ตำนานแห่งการบริจาค", minPoints: 5000, color: "#ef4444" },
]
