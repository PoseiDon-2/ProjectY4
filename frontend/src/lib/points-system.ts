import { type UserPoints, type PointsTransaction, POINTS_CONFIG, USER_LEVELS } from "@/types/rewards"
import { pointsAPI } from "./api"

class PointsSystem {
    private static instance: PointsSystem
    private userPoints: Map<string, UserPoints> = new Map()

    static getInstance(): PointsSystem {
        if (!PointsSystem.instance) {
            PointsSystem.instance = new PointsSystem()
        }
        return PointsSystem.instance
    }

    /**
     * คำนวณคะแนนจากการบริจาค
     * @param amount - จำนวนเงิน (บาท) หรือ ชั่วโมง (แรงงาน) หรือ จำนวนชิ้น (สิ่งของ)
     * @param type - ประเภท: money | item | volunteer
     * @param options - item: { category, quantity? } | volunteer: { skillType? }
     */
    calculateDonationPoints(
        amount: number,
        type: "money" | "item" | "volunteer",
        options?: { category?: string; quantity?: number; skillType?: string; estimatedValue?: number; deliveryMethod?: string }
    ): number {
        switch (type) {
            case "money": {
                if (amount <= 0) return 0
                // น้อยกว่า 100 บาทได้ 5 คะแนน, 100 ขึ้นไปได้ 1 บาทละ 1 แต้ม
                if (amount < 100) return 5
                return Math.floor(amount)
            }
            case "item": {
                // amount = มูลค่าประเมินโดยรวม (บาท), น้อยกว่า 100 ได้ 5 คะแนน, 100 ขึ้นไปได้ 1 บาทละ 1 แต้ม
                const value = options?.estimatedValue ?? amount
                let points = value < 100 ? 5 : Math.floor(value)
                // นำไปส่งถึงที่ (drop-off): คะแนนคูณ 1.5
                if (options?.deliveryMethod === "drop-off") {
                    points = Math.round(points * 1.5)
                }
                return points
            }
            case "volunteer": {
                const hours = amount
                const skillType = options?.skillType || "general"
                const rate = POINTS_CONFIG.VOLUNTEER_RATES[skillType] ?? POINTS_CONFIG.VOLUNTEER_RATES.general
                const points = Math.ceil(hours * rate)
                return Math.max(points, POINTS_CONFIG.VOLUNTEER_MIN_POINTS)
            }
            default:
                return 0
        }
    }

    // Get user level based on total points
    getUserLevel(totalPoints: number) {
        const level =
            USER_LEVELS.slice()
                .reverse()
                .find((l) => totalPoints >= l.minPoints) || USER_LEVELS[0]
        const nextLevel = USER_LEVELS.find((l) => l.minPoints > totalPoints)

        return {
            ...level,
            nextLevelPoints: nextLevel ? nextLevel.minPoints - totalPoints : 0,
            progress: nextLevel ? ((totalPoints - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100 : 100,
        }
    }

    // Add points to user
    addPoints(userId: string, amount: number, source: string, description: string, relatedId?: string): UserPoints {
        const currentPoints = this.getUserPoints(userId)

        const transaction: PointsTransaction = {
            id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "earned",
            amount,
            source,
            description,
            date: new Date().toISOString(),
            relatedId,
        }

        const newTotalPoints = currentPoints.totalPoints + amount
        const newAvailablePoints = currentPoints.availablePoints + amount
        const level = this.getUserLevel(newTotalPoints)

        const updatedPoints: UserPoints = {
            ...currentPoints,
            totalPoints: newTotalPoints,
            availablePoints: newAvailablePoints,
            level: level.level,
            levelName: level.name,
            nextLevelPoints: level.nextLevelPoints,
            pointsHistory: [transaction, ...currentPoints.pointsHistory],
        }

        this.userPoints.set(userId, updatedPoints)
        this.saveToStorage()

        return updatedPoints
    }

    // Spend points
    spendPoints(userId: string, amount: number, source: string, description: string, relatedId?: string): boolean {
        const currentPoints = this.getUserPoints(userId)

        if (currentPoints.availablePoints < amount) {
            return false
        }

        const transaction: PointsTransaction = {
            id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "spent",
            amount,
            source,
            description,
            date: new Date().toISOString(),
            relatedId,
        }

        const updatedPoints: UserPoints = {
            ...currentPoints,
            availablePoints: currentPoints.availablePoints - amount,
            pointsHistory: [transaction, ...currentPoints.pointsHistory],
        }

        this.userPoints.set(userId, updatedPoints)
        this.saveToStorage()

        return true
    }

    // Get user points
    getUserPoints(userId: string): UserPoints {
        if (!this.userPoints.has(userId)) {
            const level = this.getUserLevel(0)
            const initialPoints: UserPoints = {
                userId,
                totalPoints: 0,
                availablePoints: 0,
                pointsHistory: [],
                level: level.level,
                levelName: level.name,
                nextLevelPoints: level.nextLevelPoints,
            }
            this.userPoints.set(userId, initialPoints)
        }

        return this.userPoints.get(userId)!
    }

    // Get leaderboard
    getLeaderboard(limit = 10): UserPoints[] {
        return Array.from(this.userPoints.values())
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit)
    }

    // Save to localStorage
    private saveToStorage() {
        if (typeof window !== "undefined") {
            localStorage.setItem("userPoints", JSON.stringify(Array.from(this.userPoints.entries())))
        }
    }

    // Load from localStorage
    loadFromStorage() {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("userPoints")
            if (stored) {
                try {
                    const entries = JSON.parse(stored)
                    this.userPoints = new Map(entries)
                } catch {
                    this.userPoints = new Map()
                }
            }
        }
    }

    /**
     * Sync จาก Backend API - ใช้เป็น primary เมื่อ login แล้ว
     * คืนค่า UserPoints ที่ได้จาก API หรือ null ถ้า fetch ล้มเหลว
     */
    async syncFromApi(userId: string): Promise<UserPoints | null> {
        if (typeof window === "undefined") return null
        if (!localStorage.getItem("auth_token")) return null
        try {
            const res = await pointsAPI.getMyPoints()
            const d = res.data as any
            if (!d || d.userId !== userId) return null

            const history: PointsTransaction[] = (d.pointsHistory || []).map((t: any) => ({
                id: t.id,
                type: t.type as "earned" | "spent",
                amount: t.amount,
                source: t.source,
                description: t.description,
                date: t.date,
                relatedId: t.relatedId,
            }))

            const up: UserPoints = {
                userId: d.userId,
                totalPoints: d.totalPoints ?? 0,
                availablePoints: Math.max(0, d.availablePoints ?? 0),
                pointsHistory: history,
                level: d.level ?? 1,
                levelName: d.levelName ?? "ผู้เริ่มต้น",
                nextLevelPoints: d.nextLevelPoints ?? 0,
            }

            this.userPoints.set(userId, up)
            this.saveToStorage()
            return up
        } catch (e) {
            console.warn("Points sync from API failed:", e)
            return null
        }
    }

    /**
     * ดึงคะแนน - ลอง sync จาก API ก่อน ถ้าได้ใช้ค่านั้น ไม่งั้นใช้ localStorage
     */
    async getUserPointsWithSync(userId: string): Promise<UserPoints> {
        const fromApi = await this.syncFromApi(userId)
        if (fromApi) return fromApi
        return this.getUserPoints(userId)
    }
}

export const pointsSystem = PointsSystem.getInstance()
