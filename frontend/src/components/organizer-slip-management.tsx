"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Download, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Slip {
    id: number
    amount: number
    status: "pending" | "verified" | "rejected"
    slip_path: string
    slip_url?: string
    donation_request_id: string
    donor_id?: string | null
    client_verdict?: string | null
    client_reasons?: string[] | null
    rejection_reason?: string | null
    verified_by?: string | null
    verified_at?: string | null
    created_at: string
    donationRequest?: {
        id: string
        title: string
        goal_amount?: number | null
        current_amount?: number | null
    }
    donor?: {
        id: string
        first_name: string
        last_name: string
        email?: string
    }
    verifiedBy?: {
        id: string
        first_name: string
        last_name: string
    }
}

interface OrganizerSlipManagementProps {
    requestId: string
    requestTitle: string
}

const resolveSlipUrl = (slip: Slip) => {
    // ถ้ามี slip_url ให้ใช้เลย (backend ส่งมาแล้ว)
    if (slip.slip_url) {
        // ถ้าเป็น full URL (มี http:// หรือ https://) ให้ใช้เลย
        if (slip.slip_url.startsWith('http://') || slip.slip_url.startsWith('https://')) {
            return slip.slip_url
        }
        // ถ้าเป็น relative path (เริ่มด้วย /storage) ให้เพิ่ม base URL
        if (slip.slip_url.startsWith('/storage')) {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace("/api", "")
            return `${baseUrl}${slip.slip_url}`
        }
        return slip.slip_url
    }
    // Fallback: สร้าง URL จาก slip_path
    if (slip.slip_path) {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace("/api", "")
        // ลบ 'slips/' prefix ถ้ามี (เพราะ path อาจเป็น 'slips/filename.jpg')
        const cleanPath = slip.slip_path.replace(/^slips\//, '')
        return `${baseUrl}/storage/slips/${cleanPath}`
    }
    // ถ้าไม่มีทั้ง slip_url และ slip_path ให้แสดง placeholder
    return "https://via.placeholder.com/400x300?text=No+Slip+Image"
}

export default function OrganizerSlipManagement({ requestId, requestTitle }: OrganizerSlipManagementProps) {
    const [pendingSlips, setPendingSlips] = useState<Slip[]>([])
    const [allSlips, setAllSlips] = useState<Slip[]>([])
    const [loading, setLoading] = useState(true)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [selectedSlip, setSelectedSlip] = useState<Slip | null>(null)
    const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({})
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState("pending")
    const [summary, setSummary] = useState({
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        total_amount: 0,
    })

    useEffect(() => {
        loadPendingSlips()
        loadAllSlips()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId])

    const loadPendingSlips = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("auth_token") || ""
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
            const res = await fetch(`${apiUrl}/organizer/slips/pending?donation_request_id=${requestId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error("โหลดรายการสลิปรอตรวจไม่สำเร็จ")
            const response = await res.json()
            
            let list: Slip[] = []
            if (Array.isArray(response.data)) {
                list = response.data
            } else if (Array.isArray(response)) {
                list = response
            } else if (response.data && Array.isArray(response.data)) {
                list = response.data
            }
            
            const filtered = list.filter((s) => String(s.donation_request_id) === String(requestId))
            setPendingSlips(filtered)
        } catch (err: any) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: err.message || "ไม่สามารถโหลดรายการสลิปรอตรวจได้",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const loadAllSlips = async () => {
        try {
            setHistoryLoading(true)
            const token = localStorage.getItem("auth_token") || ""
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
            const res = await fetch(`${apiUrl}/organizer/slips/request/${requestId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error("โหลดประวัติสลิปไม่สำเร็จ")
            const response = await res.json()
            
            if (response.success && response.data) {
                setAllSlips(response.data)
                if (response.summary) {
                    setSummary(response.summary)
                }
            }
        } catch (err: any) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: err.message || "ไม่สามารถโหลดประวัติสลิปได้",
                variant: "destructive",
            })
        } finally {
            setHistoryLoading(false)
        }
    }

    const handleDownloadSlip = async (slip: Slip) => {
        try {
            const token = localStorage.getItem("auth_token") || ""
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
            const res = await fetch(`${apiUrl}/organizer/slips/${slip.id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            
            if (!res.ok) {
                // ถ้า download ไม่ได้ ให้ใช้วิธีเปิดในแท็บใหม่
                const slipUrl = resolveSlipUrl(slip)
                window.open(slipUrl, '_blank')
                toast({
                    title: "เปิดรูปสลิป",
                    description: "กรุณาคลิกขวาที่รูปแล้วเลือก 'บันทึกรูปภาพเป็น...' เพื่อบันทึก",
                })
                return
            }

            // ดาวน์โหลดไฟล์
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `slip_${slip.id}_${slip.donor?.first_name || 'donor'}_${new Date(slip.created_at).toISOString().split('T')[0]}.jpg`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast({
                title: "ดาวน์โหลดสำเร็จ",
                description: "บันทึกรูปสลิปเรียบร้อยแล้ว",
            })
        } catch (err: any) {
            // Fallback: เปิดในแท็บใหม่
            const slipUrl = resolveSlipUrl(slip)
            window.open(slipUrl, '_blank')
            toast({
                title: "เปิดรูปสลิป",
                description: "กรุณาคลิกขวาที่รูปแล้วเลือก 'บันทึกรูปภาพเป็น...' เพื่อบันทึก",
            })
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
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || errorData.error || "อนุมัติสลิปไม่สำเร็จ")
            }
            toast({ 
                title: "อนุมัติแล้ว",
                description: "สลิปได้รับการอนุมัติแล้ว และยอดเงินได้ถูกอัปเดตแล้ว"
            })
            // Reload slips to get updated list
            await loadPendingSlips()
            await loadAllSlips()
            setSelectedSlip(null)
        } catch (err: any) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: err.message || "ไม่สามารถอนุมัติได้",
                variant: "destructive",
            })
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (id: number) => {
        const reason = rejectReasons[id]?.trim() || ""
        if (!reason) {
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
                body: JSON.stringify({ reason }),
            })
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || errorData.error || "ปฏิเสธสลิปไม่สำเร็จ")
            }
            toast({ 
                title: "ปฏิเสธแล้ว",
                description: "สลิปถูกปฏิเสธแล้ว และผู้บริจาคจะได้รับการแจ้งเตือน"
            })
            // Reload slips to get updated list
            await loadPendingSlips()
            await loadAllSlips()
            setSelectedSlip(null)
        } catch (err: any) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: err.message || "ไม่สามารถปฏิเสธได้",
                variant: "destructive",
            })
        } finally {
            setProcessingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="w-fit bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />รอตรวจสอบ</Badge>
            case 'verified':
                return <Badge className="w-fit bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />อนุมัติแล้ว</Badge>
            case 'rejected':
                return <Badge className="w-fit bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />ปฏิเสธ</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    const renderSlipCard = (slip: Slip, showActions: boolean = false) => (
        <Card key={slip.id} className="hover:shadow-md transition">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                        {slip.donor ? `${slip.donor.first_name} ${slip.donor.last_name}` : "ผู้บริจาคไม่ระบุชื่อ"}
                    </CardTitle>
                    {getStatusBadge(slip.status)}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="relative group">
                    <img
                        src={resolveSlipUrl(slip)}
                        alt="slip"
                        className="w-full h-44 object-contain bg-gray-100 rounded cursor-pointer"
                        onClick={() => setSelectedSlip(slip)}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "https://via.placeholder.com/400x300?text=No+Slip+Image"
                        }}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white/90 hover:bg-white"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadSlip(slip)
                            }}
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="text-lg font-semibold text-green-600">
                    ฿{Number(slip.amount).toLocaleString("th-TH")}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                    <div>ส่งเมื่อ: {new Date(slip.created_at).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}</div>
                    {slip.verified_at && (
                        <div className="text-green-600">
                            {slip.status === 'verified' ? 'อนุมัติ' : 'ปฏิเสธ'} เมื่อ: {new Date(slip.verified_at).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                    )}
                    {slip.verifiedBy && (
                        <div className="text-gray-400">
                            โดย: {slip.verifiedBy.first_name} {slip.verifiedBy.last_name}
                        </div>
                    )}
                </div>

                {slip.client_verdict && (
                    <div className="text-xs text-gray-600">
                        ผลตรวจเบื้องต้น: <span className="font-medium">{slip.client_verdict}</span>
                    </div>
                )}

                {slip.rejection_reason && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        <strong>เหตุผลการปฏิเสธ:</strong> {slip.rejection_reason}
                    </div>
                )}

                {showActions && slip.status === 'pending' && (
                    <>
                        <Textarea
                            value={rejectReasons[slip.id] || ""}
                            onChange={(e) =>
                                setRejectReasons((prev) => ({ ...prev, [slip.id]: e.target.value }))
                            }
                            placeholder="เหตุผลการปฏิเสธ (ถ้าปฏิเสธ)"
                            rows={2}
                        />

                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedSlip(slip)}>
                                ดูรายละเอียด
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(slip.id)}
                                disabled={processingId !== null}
                            >
                                {processingId === slip.id ? "กำลังอนุมัติ..." : "อนุมัติ"}
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleReject(slip.id)}
                                disabled={processingId !== null}
                            >
                                {processingId === slip.id ? "กำลังปฏิเสธ..." : "ปฏิเสธ"}
                            </Button>
                        </div>
                    </>
                )}

                {!showActions && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setSelectedSlip(slip)}>
                            ดูรายละเอียด
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleDownloadSlip(slip)}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            บันทึกรูป
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">จัดการสลิปการรับเงิน</h2>
                    <p className="text-sm text-gray-600">สำหรับ: {requestTitle}</p>
                </div>
                <Button variant="outline" onClick={() => {
                    loadPendingSlips()
                    loadAllSlips()
                }}>
                    รีเฟรช
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">
                        รอตรวจสอบ ({summary.pending})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        ประวัติทั้งหมด ({summary.total})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-gray-600">กำลังโหลดสลิป...</div>
                    ) : pendingSlips.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center text-gray-600">
                                ยังไม่มีสลิปรอตรวจสำหรับคำขอนี้
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingSlips.map((slip) => renderSlipCard(slip, true))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {historyLoading ? (
                        <div className="text-center py-10 text-gray-600">กำลังโหลดประวัติสลิป...</div>
                    ) : allSlips.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center text-gray-600">
                                ยังไม่มีสลิปสำหรับคำขอนี้
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* สรุปข้อมูล */}
                            <Card className="bg-blue-50">
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-800">{summary.total}</div>
                                            <div className="text-sm text-gray-600">สลิปทั้งหมด</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
                                            <div className="text-sm text-gray-600">รอตรวจสอบ</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">{summary.verified}</div>
                                            <div className="text-sm text-gray-600">อนุมัติแล้ว</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">฿{Number(summary.total_amount).toLocaleString("th-TH")}</div>
                                            <div className="text-sm text-gray-600">ยอดรวมที่อนุมัติ</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* รายการสลิปทั้งหมด */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allSlips.map((slip) => renderSlipCard(slip, false))}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {selectedSlip && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>รายละเอียดสลิป</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSlip(null)}>
                                ปิด
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded">
                                <div className="flex items-center justify-between mb-2">
                                    <p>
                                        <strong>คำขอ:</strong> {requestTitle}
                                    </p>
                                    {getStatusBadge(selectedSlip.status)}
                                </div>
                                <p>
                                    <strong>ผู้บริจาค:</strong>{" "}
                                    {selectedSlip.donor
                                        ? `${selectedSlip.donor.first_name} ${selectedSlip.donor.last_name}${selectedSlip.donor.email ? ` (${selectedSlip.donor.email})` : ''}`
                                        : "ไม่ระบุ"}
                                </p>
                                <p>
                                    <strong>จำนวนเงิน:</strong>{" "}
                                    <span className="text-green-600 font-semibold">
                                        ฿{Number(selectedSlip.amount).toLocaleString("th-TH")}
                                    </span>
                                </p>
                                <p>
                                    <strong>ส่งเมื่อ:</strong> {new Date(selectedSlip.created_at).toLocaleString("th-TH", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                                {selectedSlip.verified_at && (
                                    <p>
                                        <strong>{selectedSlip.status === 'verified' ? 'อนุมัติ' : 'ปฏิเสธ'} เมื่อ:</strong> {new Date(selectedSlip.verified_at).toLocaleString("th-TH", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                )}
                                {selectedSlip.verifiedBy && (
                                    <p>
                                        <strong>ตรวจโดย:</strong> {selectedSlip.verifiedBy.first_name} {selectedSlip.verifiedBy.last_name}
                                    </p>
                                )}
                                {selectedSlip.rejection_reason && (
                                    <p className="mt-2">
                                        <strong className="text-red-600">เหตุผลการปฏิเสธ:</strong>{" "}
                                        <span className="text-red-700">{selectedSlip.rejection_reason}</span>
                                    </p>
                                )}
                            </div>

                            {selectedSlip.client_reasons && selectedSlip.client_reasons.length > 0 && (
                                <div className="p-4 bg-yellow-50 rounded">
                                    <p className="font-semibold mb-2">เหตุผลจากการตรวจเบื้องต้น</p>
                                    <ul className="list-disc ml-5 text-sm">
                                        {selectedSlip.client_reasons.map((r, i) => (
                                            <li key={i}>{r}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="relative w-full border rounded overflow-hidden bg-gray-50">
                                <img
                                    src={resolveSlipUrl(selectedSlip)}
                                    alt="slip"
                                    className="w-full h-auto object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "https://via.placeholder.com/800x600?text=ไม่พบรูปสลิป"
                                        console.error("Failed to load slip image in modal:", {
                                            slip_id: selectedSlip.id,
                                            slip_url: selectedSlip.slip_url,
                                            slip_path: selectedSlip.slip_path,
                                            resolved_url: resolveSlipUrl(selectedSlip)
                                        })
                                    }}
                                />
                                <div className="absolute bottom-4 right-4">
                                    <Button
                                        onClick={() => handleDownloadSlip(selectedSlip)}
                                        className="bg-white/90 hover:bg-white shadow-lg"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        บันทึกรูป
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
