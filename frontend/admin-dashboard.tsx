"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Users, FileText, BarChart3, Settings, Shield, Eye, Check, X, Edit, Trash2,
    ArrowLeft, AlertTriangle, UserPlus, Gift, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/app/auth-context"
import axios from "axios"

interface AdminStats {
    totalUsers: number
    totalOrganizers: number
    totalRequests: number
    pendingRequests: number
    totalRaised: number
    activeRequests: number
}

interface PendingRequest {
    id: number
    title: string
    organizer: string
    category: string
    goal_amount: number
    submitted_date: string
    status: "pending"
}

interface UserManagement {
    id: number
    name: string
    email: string
    role: "user" | "organizer" | "admin"
    join_date: string
    is_verified: boolean
    total_donated?: number
    requests_created?: number
}

export default function AdminDashboard() {
    const router = useRouter()
    const { user, token } = useAuth()
    const [activeTab, setActiveTab] = useState<"overview" | "requests" | "users" | "settings">("overview")

    const [stats, setStats] = useState<AdminStats | null>(null)
    const [requests, setRequests] = useState<PendingRequest[]>([])
    const [users, setUsers] = useState<UserManagement[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ตรวจสอบสิทธิ์
    useEffect(() => {
        if (!user || user.role !== "admin") {
            router.push("/")
        }
    }, [user, router])

    // ดึงข้อมูลทั้งหมด
    useEffect(() => {
        if (!token) return

        const fetchData = async () => {
            try {
                setLoading(true)
                const [statsRes, reqRes, usersRes] = await Promise.all([
                    axios.get("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/admin/requests/pending", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
                ])

                setStats(statsRes.data)
                setRequests(reqRes.data)
                setUsers(usersRes.data)
            } catch (err: any) {
                setError(err.response?.data?.message || "เกิดข้อผิดพลาด")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [token])

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

    const getRoleColor = (role: string) => {
        const colors = {
            user: "bg-blue-100 text-blue-700",
            organizer: "bg-green-100 text-green-700",
            admin: "bg-purple-100 text-purple-700",
        }
        return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-700"
    }

    const getRoleText = (role: string) => {
        const texts = { user: "ผู้ใช้", organizer: "ผู้จัดการ", admin: "ผู้ดูแลระบบ" }
        return texts[role as keyof typeof texts] || role
    }

    const handleApprove = async (id: number) => {
        try {
            await axios.post(`/api/admin/requests/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setRequests(prev => prev.filter(r => r.id !== id))
        } catch (err) {
            alert("อนุมัติไม่สำเร็จ")
        }
    }

    const handleReject = async (id: number) => {
        try {
            await axios.post(`/api/admin/requests/${id}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setRequests(prev => prev.filter(r => r.id !== id))
        } catch (err) {
            alert("ปฏิเสธไม่สำเร็จ")
        }
    }

    const handleDeleteUser = async (id: number) => {
        if (!confirm("ยืนยันการลบผู้ใช้?")) return
        try {
            await axios.delete(`/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setUsers(prev => prev.filter(u => u.id !== id))
        } catch (err) {
            alert("ลบไม่สำเร็จ")
        }
    }

    if (!user || user.role !== "admin") return null
    if (loading) return <DashboardSkeleton />
    if (error) return <div className="p-6 text-red-600">ข้อผิดพลาด: {error}</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-purple-500" />
                                    แดชบอร์ดผู้ดูแลระบบ
                                </h1>
                                <p className="text-sm text-gray-600">จัดการระบบและตรวจสอบคำขอบริจาค</p>
                            </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700">
                            <Shield className="w-3 h-3 mr-1" /> ผู้ดูแลระบบ
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                {/* Tabs */}
                <Card className="mb-6">
                    <CardContent className="p-0">
                        <div className="flex border-b overflow-x-auto">
                            {[
                                { key: "overview", icon: BarChart3, label: "ภาพรวม" },
                                { key: "requests", icon: FileText, label: "คำขอรออนุมัติ", badge: requests.length },
                                { key: "users", icon: Users, label: "จัดการผู้ใช้" },
                                { key: "settings", icon: Settings, label: "ตั้งค่าระบบ" },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === tab.key
                                            ? "border-b-2 border-purple-500 text-purple-600 bg-purple-50"
                                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                    {tab.badge ? (
                                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 min-w-[20px] h-5">
                                            {tab.badge}
                                        </Badge>
                                    ) : null}
                                </button>
                            ))}
                            <button
                                onClick={() => router.push("/admin/rewards")}
                                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 whitespace-nowrap"
                            >
                                <Gift className="w-4 h-4" /> จัดการรางวัล
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* เนื้อหาแท็บ */}
                {activeTab === "overview" && <OverviewTab stats={stats!} />}
                {activeTab === "requests" && <RequestsTab requests={requests} onApprove={handleApprove} onReject={handleReject} />}
                {activeTab === "users" && <UsersTab users={users} onDelete={handleDeleteUser} />}
                {activeTab === "settings" && <SettingsTab />}
            </div>
        </div>
    )
}

// แยก Components
function OverviewTab({ stats }: { stats: AdminStats }) {
    const items = [
        { label: "ผู้ใช้ทั้งหมด", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
        { label: "ผู้จัดการ", value: stats.totalOrganizers, icon: Shield, color: "text-green-600" },
        { label: "คำขอทั้งหมด", value: stats.totalRequests, icon: FileText, color: "text-purple-600" },
        { label: "รออนุมัติ", value: stats.pendingRequests, icon: AlertTriangle, color: "text-orange-600" },
        { label: "ยอดระดมทุนรวม", value: `฿${new Intl.NumberFormat("th-TH").format(stats.totalRaised)}`, icon: BarChart3, color: "text-pink-600" },
        { label: "กำลังระดมทุน", value: stats.activeRequests, icon: Eye, color: "text-indigo-600" },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
                <Card key={i}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{item.label}</p>
                                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                            </div>
                            <item.icon className={`w-8 h-8 ${item.color.replace("600", "500")}`} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function RequestsTab({ requests, onApprove, onReject }: any) {
    const router = useRouter()
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">คำขอรออนุมัติ ({requests.length})</h2>
            {requests.map((r: PendingRequest) => (
                <Card key={r.id}>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold">{r.title}</h3>
                                    <Badge className="bg-yellow-100 text-yellow-700">รออนุมัติ</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                                    <div><strong>ผู้จัดการ:</strong> {r.organizer}</div>
                                    <div><strong>เป้าหมาย:</strong> ฿{new Intl.NumberFormat("th-TH").format(r.goal_amount)}</div>
                                    <div><strong>วันที่ส่ง:</strong> {new Date(r.submitted_date).toLocaleDateString("th-TH")}</div>
                                    <div><strong>หมวดหมู่:</strong> {r.category}</div>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button size="sm" variant="outline" onClick={() => router.push(`/requests/${r.id}`)}>
                                    <Eye className="w-4 h-4 mr-1" /> ดู
                                </Button>
                                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => onApprove(r.id)}>
                                    <Check className="w-4 h-4 mr-1" /> อนุมัติ
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onReject(r.id)}>
                                    <X className="w-4 h-4 mr-1" /> ปฏิเสธ
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function UsersTab({ users, onDelete }: any) {
    const router = useRouter()
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">จัดการผู้ใช้</h2>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500" onClick={() => router.push("/admin/add-user")}>
                    <UserPlus className="w-4 h-4 mr-2" /> เพิ่มผู้ใช้
                </Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left p-4 font-medium text-gray-700">ผู้ใช้</th>
                                    <th className="text-left p-4 font-medium text-gray-700">บทบาท</th>
                                    <th className="text-left p-4 font-medium text-gray-700">สถานะ</th>
                                    <th className="text-left p-4 font-medium text-gray-700">วันที่สมัคร</th>
                                    <th className="text-left p-4 font-medium text-gray-700">สถิติ</th>
                                    <th className="text-left p-4 font-medium text-gray-700">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u: UserManagement) => (
                                    <tr key={u.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-medium">{u.name}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <Badge className={getRoleColor(u.role)}>{getRoleText(u.role)}</Badge>
                                        </td>
                                        <td className="p-4">
                                            <Badge className={u.is_verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                {u.is_verified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(u.join_date).toLocaleDateString("th-TH")}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {u.role === "user" && u.total_donated && `บริจาค: ฿${new Intl.NumberFormat("th-TH").format(u.total_donated)}`}
                                            {u.role === "organizer" && u.requests_created && `คำขอ: ${u.requests_created}`}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/users/${u.id}`)}><Eye className="w-4 h-4" /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/users/edit/${u.id}`)}><Edit className="w-4 h-4" /></Button>
                                                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(u.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function SettingsTab() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">ตั้งค่าระบบ</h2>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>การตั้งค่าทั่วไป</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {["อนุมัติคำขออัตโนมัติ", "การแจ้งเตือนอีเมล", "การตรวจสอบเนื้อหา"].map((label) => (
                            <div key={label} className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium">{label}</h4>
                                    <p className="text-sm text-gray-600">ตั้งค่าการทำงานของระบบ</p>
                                </div>
                                <Button variant="outline" size="sm">เปิด</Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>ข้อมูลระบบ</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { label: "เวอร์ชันระบบ", value: "v1.0.0" },
                            { label: "อัปเดตล่าสุด", value: "15 ม.ค. 2567" },
                            { label: "ฐานข้อมูล", value: "ปกติ", color: "text-green-600" },
                            { label: "เซิร์ฟเวอร์", value: "ออนไลน์", color: "text-green-600" },
                        ].map((item) => (
                            <div key={item.label} className="flex justify-between">
                                <span className="text-sm text-gray-600">{item.label}</span>
                                <span className={`text-sm font-medium ${item.color || ""}`}>{item.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function DashboardSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="h-8 w-32 mb-2" />
                            <Skeleton className="h-6 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

// ฟังก์ชันช่วย
function getRoleColor(role: string) {
    const colors = { user: "bg-blue-100 text-blue-700", organizer: "bg-green-100 text-green-700", admin: "bg-purple-100 text-purple-700" }
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-700"
}
function getRoleText(role: string) {
    const texts = { user: "ผู้ใช้", organizer: "ผู้จัดการ", admin: "ผู้ดูแลระบบ" }
    return texts[role as keyof typeof texts] || role
}