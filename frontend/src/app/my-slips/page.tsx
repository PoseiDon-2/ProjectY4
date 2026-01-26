"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, XCircle, CheckCircle, Clock } from "lucide-react"

interface Slip {
    id: number
    amount: number
    status: "pending" | "verified" | "rejected"
    slip_path: string
    slip_url?: string
    donation_request_id: string
    rejection_reason?: string | null
    created_at: string
    donationRequest?: {
        id: string
        title: string
        status?: string
    }
}

export default function MySlipsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [slips, setSlips] = useState<Slip[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const storageKey = useMemo(() => `seen_rejected_slips_${user?.id || "me"}`, [user?.id])

    useEffect(() => {
        if (!user) return
        const loadSlips = async () => {
            try {
                setLoading(true)
                setError(null)
                const token = localStorage.getItem("auth_token") || ""
                if (!token) {
                    setError("กรุณาเข้าสู่ระบบก่อน")
                    return
                }
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
                const res = await fetch(`${apiUrl}/donations/slips/my`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) throw new Error("โหลดรายการสลิปไม่สำเร็จ")
                const data = await res.json()
                const list = data?.data || data || []
                setSlips(Array.isArray(list) ? list : [])
            } catch (err: any) {
                setError(err.message || "ไม่สามารถโหลดรายการสลิปได้")
            } finally {
                setLoading(false)
            }
        }
        loadSlips()
    }, [user])

    useEffect(() => {
        if (!user || slips.length === 0) return
        const seenRaw = localStorage.getItem(storageKey)
        const seenIds = new Set<number>(seenRaw ? JSON.parse(seenRaw) : [])
        const newRejected = slips.filter((s) => s.status === "rejected" && !seenIds.has(s.id))
        if (newRejected.length > 0) {
            toast({
                title: "มีสลิปถูกปฏิเสธ",
                description: `มี ${newRejected.length} รายการที่บริจาคไม่สำเร็จ กรุณาตรวจสอบเหตุผล`,
                variant: "destructive",
            })
            newRejected.forEach((s) => seenIds.add(s.id))
            localStorage.setItem(storageKey, JSON.stringify(Array.from(seenIds)))
        }
    }, [slips, storageKey, user])

    if (!user) {
        router.push("/login")
        return null
    }

    const getStatusBadge = (status: Slip["status"]) => {
        switch (status) {
            case "verified":
                return { text: "อนุมัติแล้ว", className: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3 mr-1" /> }
            case "rejected":
                return { text: "ถูกปฏิเสธ", className: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3 mr-1" /> }
            default:
                return { text: "รอตรวจสอบ", className: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3 mr-1" /> }
        }
    }

    const resolveSlipUrl = (slip: Slip) => {
        if (slip.slip_url) return slip.slip_url
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace("/api", "")
        return `${baseUrl}/storage/${slip.slip_path}`
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto p-4 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับ
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">สลิปการบริจาคของฉัน</h1>
                        <p className="text-sm text-gray-600">ตรวจสอบสถานะสลิปและผลการอนุมัติ</p>
                    </div>
                </div>

                {loading && <div className="p-6">กำลังโหลด...</div>}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4 text-red-700">{error}</CardContent>
                    </Card>
                )}

                {!loading && !error && slips.length === 0 && (
                    <Card>
                        <CardContent className="p-6 text-center text-gray-600">
                            ยังไม่มีสลิปการบริจาค
                        </CardContent>
                    </Card>
                )}

                {!loading && !error && slips.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {slips.map((slip) => {
                            const badge = getStatusBadge(slip.status)
                            return (
                                <Card key={slip.id} className="overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">
                                            {slip.donationRequest?.title || "ไม่ระบุคำขอ"}
                                        </CardTitle>
                                        <Badge className={`${badge.className} w-fit`}>
                                            {badge.icon}
                                            {badge.text}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <img
                                            src={resolveSlipUrl(slip)}
                                            alt="slip"
                                            className="w-full h-48 object-contain bg-gray-100 rounded"
                                        />
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">จำนวนเงิน</span>
                                            <span className="font-semibold text-green-600">
                                                ฿{Number(slip.amount).toLocaleString("th-TH")}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            ส่งเมื่อ{" "}
                                            {new Date(slip.created_at).toLocaleDateString("th-TH", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                        {slip.status === "rejected" && slip.rejection_reason && (
                                            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                                                เหตุผลที่ถูกปฏิเสธ: {slip.rejection_reason}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
