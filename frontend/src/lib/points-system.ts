import { type UserPoints, type PointsTransaction, POINTS_CONFIG, USER_LEVELS } from "@/types/rewards"

class PointsSystem {
    private static instance: PointsSystem
    private userPoints: Map<string, UserPoints> = new Map()

    static getInstance(): PointsSystem {
        if (!PointsSystem.instance) {
            PointsSystem.instance = new PointsSystem()
        }
        return PointsSystem.instance
    }

    // Calculate points from donation amount
    calculateDonationPoints(amount: number, type: "money" | "item" | "volunteer"): number {
        switch (type) {
            case "money":
                return Math.floor(amount / 100) * POINTS_CONFIG.MONEY_DONATION
            case "item":
                return POINTS_CONFIG.ITEM_DONATION
            case "volunteer":
                return amount * POINTS_CONFIG.VOLUNTEER_HOURS // amount = hours
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
                const entries = JSON.parse(stored)
                this.userPoints = new Map(entries)
            }
        }
    }
}

export const pointsSystem = PointsSystem.getInstance()
