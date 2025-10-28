import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Coins, Award } from "lucide-react"
import type { UserPoints } from "@/types/rewards"

interface PointsDisplayProps {
    userPoints: UserPoints
    showProgress?: boolean
    compact?: boolean
}

export function PointsDisplay({ userPoints, showProgress = true, compact = false }: PointsDisplayProps) {
    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{userPoints.availablePoints.toLocaleString()}</span>
                <Badge variant="secondary" className="text-xs">
                    {userPoints.levelName}
                </Badge>
            </div>
        )
    }

    return (
        <Card className="p-6">
            <div className="space-y-4">
                {/* Points Summary */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Coins className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">คะแนนที่ใช้ได้</p>
                            <p className="text-2xl font-bold">{userPoints.availablePoints.toLocaleString()}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="px-3 py-1">
                        <Award className="h-4 w-4 mr-1" />
                        {userPoints.levelName}
                    </Badge>
                </div>

                {/* Level Progress */}
                {showProgress && userPoints.nextLevelPoints > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">ความคืบหน้าระดับ</span>
                            <span className="font-medium">อีก {userPoints.nextLevelPoints.toLocaleString()} คะแนน</span>
                        </div>
                        <Progress
                            value={
                                ((userPoints.totalPoints - (userPoints.totalPoints - userPoints.nextLevelPoints)) /
                                    userPoints.nextLevelPoints) *
                                100
                            }
                            className="h-2"
                        />
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                        <p className="text-lg font-semibold">{userPoints.totalPoints.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">คะแนนรวม</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-semibold">#{userPoints.level}</p>
                        <p className="text-xs text-muted-foreground">ระดับ</p>
                    </div>
                </div>
            </div>
        </Card>
    )
}
