"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface Slip {
    id: number
    amount: number
    status: string
    slip_path: string
    slip_url: string
    donation_request_id: number
    donor_id: string
    client_verdict?: string
    client_reasons?: string[]
    created_at: string
    donationRequest?: {
        id: number
        title: string
        goal_amount: number
        current_amount: number
    }
    donor?: {
        id: string
        first_name: string
        last_name: string
    }
}

export default function OrganizerSlips() {
    const [slips, setSlips] = useState<Slip[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSlip, setSelectedSlip] = useState<Slip | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const [processingId, setProcessingId] = useState<number | null>(null)

    useEffect(() => {
        loadSlips()
    }, [])

    const loadSlips = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("auth_token") || ""
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

            const res = await fetch(`${apiUrl}/organizer/slips/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) throw new Error("Failed to load slips")

            const data = await res.json()
            setSlips(data.data || data)
        } catch (err: any) {
            console.error(err)
            toast({
                title: "เกิดข้อผิดพลาด",
                description: err.message || "ไม่สามารถโหลดรายการสลิปได้",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id)
            const token = localStorage.getItem("auth_token") || ""
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

            const res = await fetch(`${apiUrl}/organizer/slips/${id}/approve`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!res.ok) throw new Error("Failed to approve slip")

            toast({ title: "อนุมัติแล้ว" })
            setSlips((prev) => prev.filter((s) => s.id !== id))
            setSelectedSlip(null)
        } catch (err: any) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: err.message,
                variant: "destructive",
            })
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (id: number) => {
        if (!rejectReason.trim()) {
            toast({
                title: "ข้อมูลไม่ครบ",
                description: "กรุณาระบุเหตุผลการปฏิเสธ",
                variant: "destructive",
            })
            return
        }

        try {
            setProcessingId(id)
            const token = localStorage.getItem("auth_token") || ""
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

            const res = await fetch(`${apiUrl}/organizer/slips/${id}/reject`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason: rejectReason }),
            })

            if (!res.ok) throw new Error("Failed to reject slip")

            toast({ title: "ปฏิเสธแล้ว" })
            setSlips((prev) => prev.filter((s) => s.id !== id))
            setSelectedSlip(null)
            setRejectReason("")
        } catch (err: any) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: err.message,
                variant: "destructive",
            })
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return <div className="p-6">กำลังโหลด...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">สลิปรอตรวจ ({slips.length})</h1>
                <p className="text-sm text-gray-500">รายการที่ยังรอการตรวจสอบและอนุมัติ</p>
            </div>

            {slips.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-500">ไม่มีสลิปรอตรวจ</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slips.map((slip) => (
                        <Card
                            key={slip.id}
                            className="cursor-pointer hover:shadow-md transition"
                            onClick={() => setSelectedSlip(slip)}
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    {slip.donationRequest?.title || "ไม่ระบุ"}
                                </CardTitle>
                                <p className="text-sm text-gray-600">
                                    ผู้บริจาค:{" "}
                                    {slip.donor
                                        ? `${slip.donor.first_name} ${slip.donor.last_name}`
                                        : "ไม่ระบุ"}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <img
                                        src={slip.slip_url || `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/storage/${slip.slip_path}`}
                                        alt="slip"
                                        className="w-full h-40 object-contain bg-gray-100 rounded"
                                    />
                                </div>
                                <div className="text-lg font-semibold text-green-600">
                                    ฿{Number(slip.amount).toLocaleString("th-TH")}
                                </div>
                                <p className="text-xs text-gray-500">
                                    {new Date(slip.created_at).toLocaleDateString("th-TH", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedSlip && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>ตรวจสลิป</CardTitle>
                            <button
                                onClick={() => setSelectedSlip(null)}
                                className="text-xl"
                            >
                                ✕
                            </button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Request Info */}
                            <div className="p-4 bg-blue-50 rounded">
                                <h3 className="font-semibold mb-2">ข้อมูลคำขอ</h3>
                                <p>
                                    <strong>ชื่อ:</strong>{" "}
                                    {selectedSlip.donationRequest?.title}
                                </p>
                                <p>
                                    <strong>เป้าหมาย:</strong>{" "}
                                    ฿{selectedSlip.donationRequest?.goal_amount?.toLocaleString("th-TH")}
                                </p>
                                <p>
                                    <strong>สะสมแล้ว:</strong>{" "}
                                    ฿{selectedSlip.donationRequest?.current_amount?.toLocaleString("th-TH")}
                                </p>
                            </div>

                            {/* Donor Info */}
                            <div className="p-4 bg-green-50 rounded">
                                <h3 className="font-semibold mb-2">ข้อมูลผู้บริจาค</h3>
                                <p>
                                    <strong>ชื่อ:</strong>{" "}
                                    {selectedSlip.donor
                                        ? `${selectedSlip.donor.first_name} ${selectedSlip.donor.last_name}`
                                        : "ไม่ระบุ"}
                                </p>
                                <p>
                                    <strong>จำนวนเงิน:</strong>{" "}
                                    <span className="text-lg font-bold text-green-600">
                                        ฿{Number(selectedSlip.amount).toLocaleString("th-TH")}
                                    </span>
                                </p>
                            </div>

                            {/* Client Verdict */}
                            {selectedSlip.client_verdict && (
                                <div className="p-4 bg-purple-50 rounded">
                                    <h3 className="font-semibold mb-2">
                                        ผลการตรวจจากไคลเอนต์
                                    </h3>
                                    <p>
                                        <strong>ผลวินิจฉัย:</strong>{" "}
                                        {selectedSlip.client_verdict}
                                    </p>
                                    {selectedSlip.client_reasons && selectedSlip.client_reasons.length > 0 && (
                                        <div>
                                            <strong>เหตุผล:</strong>
                                            <ul className="list-disc ml-5">
                                                {selectedSlip.client_reasons.map((r, i) => (
                                                    <li key={i} className="text-sm">
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Slip Image */}
                            <div className="space-y-2">
                                <h3 className="font-semibold">สลิป</h3>
                                <img
                                    src={
                                        selectedSlip.slip_url ||
                                        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/storage/${selectedSlip.slip_path}`
                                    }
                                    alt="slip"
                                    className="w-full border rounded"
                                />
                            </div>

                            {/* Rejection Reason */}
                            <div className="space-y-2">
                                <label className="font-semibold">
                                    เหตุผลการปฏิเสธ (ถ้าปฏิเสธ)
                                </label>
                                <Textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="อธิบายเหตุผลการปฏิเสธ เช่น สลิปไม่ชัดเจน, จำนวนไม่ตรงกัน ฯลฯ"
                                    rows={3}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={() => handleApprove(selectedSlip.id)}
                                    disabled={processingId !== null}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {processingId === selectedSlip.id ? "กำลังอนุมัติ..." : "อนุมัติ"}
                                </Button>
                                <Button
                                    onClick={() => handleReject(selectedSlip.id)}
                                    disabled={processingId !== null || !rejectReason.trim()}
                                    variant="destructive"
                                    className="flex-1"
                                >
                                    {processingId === selectedSlip.id ? "กำลังปฏิเสธ..." : "ปฏิเสธ"}
                                </Button>
                                <Button
                                    onClick={() => setSelectedSlip(null)}
                                    variant="outline"
                                >
                                    ปิด
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
