"use client"

import { useState, useEffect } from "react"
import { Package, UserCheck, CheckCircle, XCircle, ImageIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { pointsSystem } from "@/lib/points-system"
import { organizerApprovalAPI } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace("/api", "")

interface PendingItemDonation {
    id: string
    requestId?: string
    donation_request_id?: string
    requestTitle?: string
    donation_request?: { title: string }
    donorId?: string
    donor_id?: string
    donorName?: string
    donor?: { first_name: string; last_name: string }
    itemsNeeded?: string
    items_needed?: string
    estimatedValue?: number
    estimated_value?: number
    evidenceImages?: string[]
    evidence_images?: string[]
    deliveryMethod?: string
    delivery_method?: string
    deliveryDate?: string
    deliveryTime?: string
    trackingNumber?: string
    message?: string
    createdAt?: string
    _fromApi?: boolean
}

interface PendingVolunteerApplication {
    id: string
    userId?: string
    volunteer_id?: string
    volunteerId?: string
    requestId?: string
    request_id?: string
    requestTitle?: string
    request?: { title: string }
    volunteerName?: string
    volunteer?: { first_name: string; last_name: string }
    volunteerPhone?: string
    volunteerEmail?: string
    skills: string[]
    skillDetails?: string
    availableDates?: string[]
    available_dates?: string[]
    preferredTime?: string
    duration?: string
    estimatedHours?: number
    estimated_hours?: number
    createdAt?: string
    _fromApi?: boolean
}

interface OrganizerApprovalPanelProps {
    organizerRequestIds: string[]
    onRefresh?: () => void
}

const skillCategoryNames: Record<string, string> = {
    physical: "งานใช้แรงงาน",
    professional: "งานเฉพาะทาง",
    creative: "งานสร้างสรรค์",
    coordination: "งานประสานงาน",
    cooking: "งานครัว",
    transport: "งานขนส่ง",
}

export default function OrganizerApprovalPanel({ organizerRequestIds, onRefresh }: OrganizerApprovalPanelProps) {
    const [pendingItems, setPendingItems] = useState<PendingItemDonation[]>([])
    const [pendingVolunteers, setPendingVolunteers] = useState<PendingVolunteerApplication[]>([])
    const [itemModal, setItemModal] = useState<{ open: boolean; item: PendingItemDonation | null }>({
        open: false,
        item: null,
    })
    const [volunteerModal, setVolunteerModal] = useState<{
        open: boolean
        app: PendingVolunteerApplication | null
        actualHours: number
    }>({ open: false, app: null, actualHours: 4 })
    const [processing, setProcessing] = useState(false)

    const normalizeItem = (i: any, fromApi: boolean): PendingItemDonation => {
        const reqId = i.donation_request_id || i.requestId
        const title = i.donation_request?.title ?? i.requestTitle ?? ""
        const donorId = i.donor_id || i.donorId
        const donorName = i.donor ? `${i.donor.first_name || ""} ${i.donor.last_name || ""}`.trim() : i.donorName
        const itemsNeeded = i.items_needed ?? i.itemsNeeded ?? ""
        const estimatedValue = Number(i.estimated_value ?? i.estimatedValue ?? 0)
        const deliveryMethod = i.delivery_method ?? i.deliveryMethod ?? "send-to-address"
        const evidenceImages = (i.evidence_images ?? i.evidenceImages ?? []).map((p: string) =>
            p.startsWith("data:") ? p : `${API_BASE}/storage/${p}`
        )
        return {
            id: i.id,
            requestId: reqId,
            requestTitle: title,
            donorId,
            donorName,
            itemsNeeded,
            estimatedValue,
            deliveryMethod,
            evidenceImages,
            createdAt: i.created_at ?? i.createdAt,
            _fromApi: fromApi,
        }
    }

    const calcItemPoints = (item: PendingItemDonation): number => {
        const value = item.estimatedValue ?? item.estimated_value ?? 0
        return pointsSystem.calculateDonationPoints(value, "item", {
            estimatedValue: value,
            deliveryMethod: item.deliveryMethod ?? item.delivery_method ?? "send-to-address",
        })
    }

    const normalizeVolunteer = (v: any, fromApi: boolean): PendingVolunteerApplication => {
        const reqId = v.request_id || v.requestId
        const title = v.request?.title ?? v.requestTitle ?? ""
        const userId = v.volunteer_id || v.userId || v.volunteerId
        const volunteerName = v.volunteer ? `${v.volunteer.first_name || ""} ${v.volunteer.last_name || ""}`.trim() : v.volunteerName
        const skills = Array.isArray(v.skills) ? v.skills : (typeof v.skills === "string" ? JSON.parse(v.skills || "[]") : [])
        return {
            id: v.id,
            userId,
            requestId: reqId,
            requestTitle: title,
            volunteerName,
            skills,
            availableDates: v.available_dates ?? v.availableDates ?? [],
            estimatedHours: v.estimated_hours ?? v.estimatedHours,
            createdAt: v.created_at ?? v.createdAt,
            _fromApi: fromApi,
        }
    }

    const loadFromStorage = async () => {
        if (typeof window === "undefined") return
        const ids = new Set(organizerRequestIds)
        let items: PendingItemDonation[] = []
        let volunteers: PendingVolunteerApplication[] = []

        const useLocalStorage = () => {
            const localItems: any[] = JSON.parse(localStorage.getItem("pending_item_donations") || "[]")
            const localVols: any[] = JSON.parse(localStorage.getItem("pending_volunteer_applications") || "[]")
            items = localItems.filter((i) => ids.has(String(i.requestId))).map((i) => normalizeItem(i, false))
            volunteers = localVols.filter((v) => ids.has(String(v.requestId))).map((v) => normalizeVolunteer(v, false))
        }

        if (localStorage.getItem("auth_token")) {
            try {
                const [itemsRes, volsRes] = await Promise.all([
                    organizerApprovalAPI.getPendingItemDonations(),
                    organizerApprovalAPI.getPendingVolunteerApplications(),
                ])
                const apiItems = (itemsRes.data?.data ?? itemsRes.data ?? []) as any[]
                const apiVols = (volsRes.data?.data ?? volsRes.data ?? []) as any[]
                items = apiItems.filter((i: any) => ids.has(String(i.donation_request_id))).map((i: any) => normalizeItem(i, true))
                volunteers = apiVols.filter((v: any) => ids.has(String(v.request_id))).map((v: any) => normalizeVolunteer(v, true))
            } catch (e) {
                console.warn("API fetch failed, using localStorage:", e)
                useLocalStorage()
            }
        } else {
            useLocalStorage()
        }

        setPendingItems(items)
        setPendingVolunteers(volunteers)
    }

    useEffect(() => {
        loadFromStorage()
    }, [organizerRequestIds.join(",")])

    const handleApproveItem = async () => {
        if (!itemModal.item) return
        const item = itemModal.item
        const points = calcItemPoints(item)

        setProcessing(true)
        try {
            if (item._fromApi) {
                await organizerApprovalAPI.approveItemDonation(item.id)
                toast({ title: "อนุมัติสำเร็จ", description: `ให้ ${points} คะแนน` })
            } else {
                pointsSystem.addPoints(
                    item.donorId!,
                    points,
                    "donation",
                    `Item donation: ${item.itemsNeeded || item.items_needed} (มูลค่า ฿${item.estimatedValue ?? 0})`,
                    item.id
                )
                const userDonations = JSON.parse(localStorage.getItem(`user_donations_${item.donorId}`) || "[]")
                const updated = userDonations.map((d: any) =>
                    d.id === item.id ? { ...d, status: "completed", pointsEarned: points } : d
                )
                localStorage.setItem(`user_donations_${item.donorId}`, JSON.stringify(updated))
                const pending = JSON.parse(localStorage.getItem("pending_item_donations") || "[]").filter((p: any) => p.id !== item.id)
                localStorage.setItem("pending_item_donations", JSON.stringify(pending))
                toast({ title: "อนุมัติสำเร็จ", description: `ให้ ${points} คะแนน` })
            }
            setItemModal({ open: false, item: null })
            loadFromStorage()
            onRefresh?.()
        } catch (e) {
            toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" })
        } finally {
            setProcessing(false)
        }
    }

    const handleRejectItem = async () => {
        if (!itemModal.item) return
        const item = itemModal.item
        setProcessing(true)
        try {
            if (item._fromApi) {
                await organizerApprovalAPI.rejectItemDonation(item.id)
            } else {
                const userDonations = JSON.parse(localStorage.getItem(`user_donations_${item.donorId}`) || "[]").map(
                    (d: any) => (d.id === item.id ? { ...d, status: "rejected" } : d)
                )
                localStorage.setItem(`user_donations_${item.donorId}`, JSON.stringify(userDonations))
                const pending = JSON.parse(localStorage.getItem("pending_item_donations") || "[]").filter((p: any) => p.id !== item.id)
                localStorage.setItem("pending_item_donations", JSON.stringify(pending))
            }
            toast({ title: "ปฏิเสธเรียบร้อย", variant: "default" })
            setItemModal({ open: false, item: null })
            loadFromStorage()
            onRefresh?.()
        } catch (e) {
            toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" })
        } finally {
            setProcessing(false)
        }
    }

    const handleApproveVolunteer = async () => {
        if (!volunteerModal.app) return
        const app = volunteerModal.app
        const hours = volunteerModal.actualHours
        if (hours < 0.5) {
            toast({ title: "กรุณาระบุชั่วโมงอย่างน้อย 0.5", variant: "destructive" })
            return
        }

        setProcessing(true)
        try {
            if (app._fromApi) {
                await organizerApprovalAPI.approveVolunteerApplication(app.id, hours)
                const skillType = app.skills.includes("professional") ? "professional" : ["creative", "coordination", "cooking"].some((s) => app.skills.includes(s)) ? "skilled" : "general"
                const points = pointsSystem.calculateDonationPoints(hours, "volunteer", { skillType })
                toast({ title: "อนุมัติสำเร็จ", description: `ให้ ${points} คะแนน (${hours} ชม.)` })
            } else {
                const skillType = app.skills.includes("professional") ? "professional" : ["creative", "coordination", "cooking"].some((s) => app.skills.includes(s)) ? "skilled" : "general"
                const points = pointsSystem.calculateDonationPoints(hours, "volunteer", { skillType })
                pointsSystem.addPoints(app.userId!, points, "donation", `Volunteer: ${app.requestTitle} (${hours} ชม.)`, app.id)
                const userVolunteers = JSON.parse(localStorage.getItem(`user_volunteers_${app.userId}`) || "[]")
                const updated = userVolunteers.map((v: any) => (v.id === app.id ? { ...v, status: "approved", pointsEarned: points, approvedHours: hours } : v))
                localStorage.setItem(`user_volunteers_${app.userId}`, JSON.stringify(updated))
                const pending = JSON.parse(localStorage.getItem("pending_volunteer_applications") || "[]").filter((p: any) => p.id !== app.id)
                localStorage.setItem("pending_volunteer_applications", JSON.stringify(pending))
                toast({ title: "อนุมัติสำเร็จ", description: `ให้ ${points} คะแนน (${hours} ชม.)` })
            }
            setVolunteerModal({ open: false, app: null, actualHours: 4 })
            loadFromStorage()
            onRefresh?.()
        } catch (e) {
            toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" })
        } finally {
            setProcessing(false)
        }
    }

    const handleRejectVolunteer = async () => {
        if (!volunteerModal.app) return
        const app = volunteerModal.app
        setProcessing(true)
        try {
            if (app._fromApi) {
                await organizerApprovalAPI.rejectVolunteerApplication(app.id)
            } else {
                const userVolunteers = JSON.parse(localStorage.getItem(`user_volunteers_${app.userId}`) || "[]").map(
                    (v: any) => (v.id === app.id ? { ...v, status: "rejected" } : v)
                )
                localStorage.setItem(`user_volunteers_${app.userId}`, JSON.stringify(userVolunteers))
                const pending = JSON.parse(localStorage.getItem("pending_volunteer_applications") || "[]").filter((p: any) => p.id !== app.id)
                localStorage.setItem("pending_volunteer_applications", JSON.stringify(pending))
            }
            toast({ title: "ปฏิเสธเรียบร้อย", variant: "default" })
            setVolunteerModal({ open: false, app: null, actualHours: 4 })
            loadFromStorage()
            onRefresh?.()
        } catch (e) {
            toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" })
        } finally {
            setProcessing(false)
        }
    }

    const totalPending = pendingItems.length + pendingVolunteers.length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">รอการอนุมัติ</h2>
                <Button variant="outline" size="sm" onClick={loadFromStorage}>
                    รีเฟรช
                </Button>
            </div>

            {totalPending === 0 ? (
                <Card className="p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">ไม่มีรายการรออนุมัติ</h3>
                    <p className="text-gray-500">เมื่อมีผู้บริจาคสิ่งของหรือสมัครอาสา จะแสดงที่นี่</p>
                </Card>
            ) : (
                <>
                    {pendingItems.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    บริจาคสิ่งของ ({pendingItems.length})
                                </CardTitle>
                                <p className="text-sm text-gray-600">ตรวจหลักฐานและอนุมัติ คะแนนคำนวณจากมูลค่าที่ผู้บริจาคระบุ</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {pendingItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 truncate">{item.requestTitle}</p>
                                                <p className="text-sm text-gray-600">{item.itemsNeeded}</p>
                                                <p className="text-xs text-gray-500">
                                                    {item.donorName || "ไม่ระบุชื่อ"} •{" "}
                                                    {item.createdAt
                                                        ? new Date(item.createdAt).toLocaleDateString("th-TH")
                                                        : "-"}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setItemModal({ open: true, item })
                                                    }
                                                >
                                                    <ImageIcon className="w-4 h-4 mr-1" />
                                                    ตรวจสอบ
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {pendingVolunteers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserCheck className="w-5 h-5" />
                                    สมัครอาสาสมัคร ({pendingVolunteers.length})
                                </CardTitle>
                                <p className="text-sm text-gray-600">ระบุชั่วโมงจริงแล้วอนุมัติ เพื่อให้คะแนน</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {pendingVolunteers.map((app) => (
                                        <div
                                            key={app.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800">{app.volunteerName}</p>
                                                <p className="text-sm text-gray-600 truncate">{app.requestTitle}</p>
                                                <p className="text-xs text-gray-500">
                                                    {app.skills
                                                        .map((s) => skillCategoryNames[s] || s)
                                                        .join(", ")}
                                                    {" • "}
                                                    {app.estimatedHours ? `${app.estimatedHours} ชม. (โดยประมาณ)` : ""}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setVolunteerModal({
                                                        open: true,
                                                        app,
                                                        actualHours: app.estimatedHours || 4,
                                                    })
                                                }
                                            >
                                                <Clock className="w-4 h-4 mr-1" />
                                                อนุมัติ
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            <Dialog open={itemModal.open} onOpenChange={(o) => !o && setItemModal({ open: false, item: null })}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>อนุมัติบริจาคสิ่งของ</DialogTitle>
                    </DialogHeader>
                    {itemModal.item && (
                        <div className="space-y-4">
                            <div>
                                <p className="font-medium text-gray-800">{itemModal.item.requestTitle}</p>
                                <p className="text-sm text-gray-600">{itemModal.item.itemsNeeded}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    ผู้บริจาค: {itemModal.item.donorName || "ไม่ระบุชื่อ"}
                                </p>
                            </div>

                            <div>
                                <Label className="mb-2 block">รูปหลักฐาน</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(itemModal.item.evidenceImages ?? []).map((src, i) => (
                                        <img
                                            key={i}
                                            src={src}
                                            alt={`หลักฐาน ${i + 1}`}
                                            className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:ring-2 hover:ring-pink-400"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-lg">
                                <p className="text-sm font-medium text-amber-800">
                                    มูลค่าสิ่งของ: ฿{itemModal.item.estimatedValue ?? itemModal.item.estimated_value ?? 0}
                                    {(itemModal.item.deliveryMethod ?? itemModal.item.delivery_method) === "drop-off" && (
                                        <span className="ml-2 text-amber-600">(นำไปส่งถึงที่ → คะแนน x1.5)</span>
                                    )}
                                </p>
                                <p className="text-sm text-amber-700 mt-1">
                                    คะแนนที่จะให้: {calcItemPoints(itemModal.item)} คะแนน
                                </p>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-200"
                                    onClick={handleRejectItem}
                                    disabled={processing}
                                >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    ปฏิเสธ
                                </Button>
                                <Button onClick={handleApproveItem} disabled={processing}>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    อนุมัติ
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={volunteerModal.open}
                onOpenChange={(o) => !o && setVolunteerModal({ open: false, app: null, actualHours: 4 })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>อนุมัติอาสาสมัคร</DialogTitle>
                    </DialogHeader>
                    {volunteerModal.app && (
                        <div className="space-y-4">
                            <div>
                                <p className="font-medium text-gray-800">{volunteerModal.app.volunteerName}</p>
                                <p className="text-sm text-gray-600">{volunteerModal.app.requestTitle}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    ทักษะ:{" "}
                                    {volunteerModal.app.skills
                                        .map((s) => skillCategoryNames[s] || s)
                                        .join(", ")}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="actualHours">ชั่วโมงที่ทำงานจริง *</Label>
                                <Input
                                    id="actualHours"
                                    type="number"
                                    min={0.5}
                                    step={0.5}
                                    value={volunteerModal.actualHours}
                                    onChange={(e) =>
                                        setVolunteerModal((prev) => ({
                                            ...prev,
                                            actualHours: Math.max(0.5, parseFloat(e.target.value) || 0.5),
                                        }))
                                    }
                                />
                                <p className="text-xs text-amber-600 mt-1">
                                    คะแนนโดยประมาณ:{" "}
                                    {pointsSystem.calculateDonationPoints(
                                        volunteerModal.actualHours,
                                        "volunteer",
                                        {
                                            skillType: volunteerModal.app.skills.includes("professional")
                                                ? "professional"
                                                : ["creative", "coordination", "cooking"].some((s) =>
                                                      volunteerModal.app!.skills.includes(s)
                                                  )
                                                ? "skilled"
                                                : "general",
                                        }
                                    )}{" "}
                                    คะแนน
                                </p>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-200"
                                    onClick={handleRejectVolunteer}
                                    disabled={processing}
                                >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    ปฏิเสธ
                                </Button>
                                <Button onClick={handleApproveVolunteer} disabled={processing}>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    อนุมัติ
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
