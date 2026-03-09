"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
    ArrowLeft, DollarSign, Users, Tag, CheckCircle, XCircle, AlertTriangle,
    Package, Phone, MapPin, Calendar, FileEdit, Clock, Send, X, ImageIcon,
    ShieldCheck, Eye, Save, RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch" // สำหรับ Admin กดดู Draft

// --- Helper Functions ---
const getImageUrl = (input: any) => {
    let path = "";
    if (Array.isArray(input) && input.length > 0) path = input[0];
    else if (typeof input === 'string') {
        if (input.startsWith('[') && input.endsWith(']')) {
             try { const parsed = JSON.parse(input); path = Array.isArray(parsed) ? parsed[0] : input; } catch { path = input; }
        } else { path = input; }
    }
    if (!path) return "/placeholder-image.jpg";
    if (path.startsWith("http")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    return `${baseUrl}/storage/${path.startsWith('/') ? path.substring(1) : path}`;
}

interface DonationRequest {
    id: string
    title: string
    description: string
    category: { id: string, name: string } | null
    accepts_money: boolean
    goal_amount: number | null
    current_amount: number
    accepts_items: boolean
    items_needed: string | null
    accepts_volunteer: boolean
    volunteers_needed: number | string | null
    volunteers_received: number
    volunteer_details: string | null
    location: string
    detailed_address: string | null
    contact_phone: string
    status: string 
    urgency: string
    images: string[] | null
    created_at: string
    expires_at: string | null
    organizer: { id: string, first_name: string, last_name: string }
    organization: { name: string } | null
    pending_updates?: any // ข้อมูลที่รอการแก้ไข
}

interface DonationRequestDetailProps {
    params: Promise<{ id: string }>
}

export default function DonationRequestDetail({ params }: DonationRequestDetailProps) {
    const router = useRouter()
    const { user } = useAuth()
    
    // Data States
    const [originalRequest, setOriginalRequest] = useState<DonationRequest | null>(null) // ข้อมูลจริงจาก DB
    const [displayRequest, setDisplayRequest] = useState<DonationRequest | null>(null)   // ข้อมูลที่กำลังแสดงผล (อาจเป็น Draft หรือ Edit Mode)
    
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Edit Mode States (สำหรับ Organizer)
    const [isEditing, setIsEditing] = useState(false) // กำลังอยู่ในโหมดแก้ไขหรือไม่
    const [formData, setFormData] = useState<Partial<DonationRequest>>({}) // เก็บค่าที่พิมพ์แก้
    const [isEditModalOpen, setIsEditModalOpen] = useState(false) // Modal ถามเหตุผล
    const [editReason, setEditReason] = useState("")

    // Admin Review States (สำหรับ Admin)
    const [viewingDraft, setViewingDraft] = useState(false) // กำลังดูข้อมูล Draft หรือไม่
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [rejectActionType, setRejectActionType] = useState<'reject' | 'reject-edit'>('reject')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // --- 1. Fetch Data ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resolvedParams = await params
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/donation-requests/${resolvedParams.id}`)
                let data = response.data.data || response.data;
                
                // จัดการรูปภาพ
                if (typeof data.images === 'string') {
                    try { data.images = JSON.parse(data.images); } catch { data.images = [data.images]; }
                }

                setOriginalRequest(data)
                setDisplayRequest(data) // เริ่มต้นแสดงข้อมูลจริง
                setLoading(false)
            } catch (err: any) {
                console.error("Fetch error:", err)
                setError("ไม่พบข้อมูล หรือเกิดข้อผิดพลาดในการโหลด")
                setLoading(false)
            }
        }
        fetchData()
    }, [params])

    // --- 2. Creator Logic: แก้ไขข้อมูล (Inline Edit) ---
    
    // เริ่มแก้ไข: ก็อปปี้ข้อมูลจริงมาใส่ state formData
    const startEditing = () => {
        setFormData(originalRequest || {}); 
        setIsEditing(true);
    }

    // ยกเลิกแก้ไข: คืนค่าเดิม
    const cancelEditing = () => {
        setIsEditing(false);
        setDisplayRequest(originalRequest); // กลับไปแสดงข้อมูลเดิม
    }

    // เมื่อพิมพ์ใน Input: อัปเดต formData และ displayRequest (เพื่อให้เห็นผลทันทีบนหน้าจอ)
    const handleInputChange = (field: keyof DonationRequest, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setDisplayRequest(prev => prev ? { ...prev, [field]: value } : null); 
    }

    // กดปุ่มบันทึก -> เปิด Modal ถามเหตุผล
    const handleSaveClick = () => {
        setIsEditModalOpen(true);
    }

    // ยืนยันส่งข้อมูลแก้ไข (ยิง API PUT)
    const confirmSubmitEdit = async () => {
        if (!editReason.trim()) { alert("กรุณาระบุเหตุผลการแก้ไข"); return; }
        setIsSubmitting(true);
        try {
            // ส่งข้อมูลที่แก้ทั้งหมดไปที่ API Update (Backend จะจัดการยัดลง pending_updates ให้เองตาม Logic ที่เราเขียนไว้)
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/donation-requests/${originalRequest?.id}`, {
                ...formData,
                // ต้องแน่ใจว่าส่ง field ครบตามที่ Validation หลังบ้านต้องการ
            });

            // ส่งเหตุผลการแก้ไขตามไป (ถ้า Backend ต้องการแยก Route ก็ยิงแยกได้ แต่ถ้ารวมใน PUT ก็จบ)
            // เพื่อความชัวร์ ผมยิง API request-edit ซ้ำอีกทีเพื่ออัปเดตเหตุผล
             await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/donation-requests/${originalRequest?.id}/request-edit`, {
                reason: editReason
            });

            alert("ส่งคำขอแก้ไขเรียบร้อยแล้ว กรุณารอแอดมินตรวจสอบ");
            window.location.reload(); // โหลดหน้าใหม่เพื่ออัปเดตสถานะ
        } catch (error) {
            console.error(error); alert("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsSubmitting(false); setIsEditModalOpen(false); setIsEditing(false);
        }
    }

    // --- 3. Admin Logic: ตรวจสอบและอนุมัติ ---

    // สวิตช์ดูระหว่าง ข้อมูลจริง vs ข้อมูล Draft
    const toggleViewDraft = (checked: boolean) => {
        setViewingDraft(checked);
        if (checked && originalRequest?.pending_updates) {
            // เอาข้อมูล Draft มาทับข้อมูลจริงเพื่อแสดงผล preview
            setDisplayRequest({ ...originalRequest, ...originalRequest.pending_updates });
        } else {
            // กลับไปแสดงข้อมูลจริง
            setDisplayRequest(originalRequest);
        }
    }

    // กดปุ่ม อนุมัติ/ปฏิเสธ
    const handleAdminAction = async (action: 'approve' | 'reject' | 'approve-edit' | 'reject-edit') => {
        if (action.includes('reject')) {
            setRejectActionType(action as any);
            setIsRejectModalOpen(true);
            return;
        }
        if(!confirm("ยืนยันการอนุมัติ?")) return;

        setIsSubmitting(true);
        try {
            const endpoint = action === 'approve' 
                ? `/admin/donation-requests/${originalRequest?.id}/approve`
                : `/admin/donation-requests/${originalRequest?.id}/approve-edit`;
            
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
            alert("อนุมัติสำเร็จ!");
            window.location.reload();
        } catch (error) {
            console.error(error); alert("เกิดข้อผิดพลาด");
        } finally { setIsSubmitting(false); }
    }

    // ยืนยันการปฏิเสธใน Modal
    const confirmReject = async () => {
        if (!rejectReason.trim()) return alert("กรุณาระบุเหตุผล");
        setIsSubmitting(true);
        try {
            const endpoint = rejectActionType === 'reject'
                ? `/admin/donation-requests/${originalRequest?.id}/reject`
                : `/admin/donation-requests/${originalRequest?.id}/reject-edit`;
            
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, { rejection_reason: rejectReason });
            alert("ดำเนินการปฏิเสธเรียบร้อย");
            window.location.reload();
        } catch (error) { console.error(error); alert("เกิดข้อผิดพลาด"); }
        finally { setIsSubmitting(false); setIsRejectModalOpen(false); }
    }

    if (loading) return <div className="p-10 text-center">กำลังโหลด...</div>
    if (error || !originalRequest || !displayRequest) return <div className="p-10 text-center text-red-500">{error}</div>

    // Permissions Variables
    const isOrganizer = String(user?.id) === String(originalRequest.organizer?.id);
    const isAdmin = user?.role === 'admin';
    const hasPendingUpdates = !!originalRequest.pending_updates;

    // Logic แสดง Card ย่อย
    const showItemsCard = displayRequest.accepts_items;
    const showVolunteerCard = displayRequest.accepts_volunteer;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            
            {/* --- Modals --- */}
            
            {/* 1. Modal ยืนยันแก้ไข (Organizer) */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-white">
                        <CardHeader><CardTitle>ยืนยันการส่งคำขอแก้ไข</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Label>กรุณาระบุเหตุผลการแก้ไขให้แอดมินทราบ:</Label>
                            <Textarea placeholder="เช่น แก้ไขคำผิด, เปลี่ยนเบอร์โทรศัพท์..." value={editReason} onChange={e => setEditReason(e.target.value)} />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>ยกเลิก</Button>
                                <Button onClick={confirmSubmitEdit} disabled={isSubmitting}>{isSubmitting ? "กำลังส่ง..." : "ยืนยันส่งคำขอ"}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 2. Modal ปฏิเสธ (Admin) */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-white border-t-4 border-red-500">
                        <CardHeader><CardTitle className="text-red-600">ปฏิเสธคำขอ</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Label>ระบุเหตุผล:</Label>
                            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>ยกเลิก</Button>
                                <Button onClick={confirmReject} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">ยืนยัน</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

             {/* 3. Lightbox รูปภาพ */}
             {selectedImage && (<div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}><img src={getImageUrl(selectedImage)} className="max-w-full max-h-[90vh] object-contain" /><Button variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/20"><X className="w-8 h-8" /></Button></div>)}


            {/* --- Header Image --- */}
            <div className="w-full h-[300px] md:h-[400px] relative bg-gray-200 group">
                <img src={getImageUrl(displayRequest.images)} className="w-full h-full object-cover cursor-pointer" onClick={() => displayRequest.images && displayRequest.images.length > 0 && setSelectedImage(displayRequest.images[0])}/>
                <div className="absolute top-4 left-4"><Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> ย้อนกลับ</Button></div>
                
                {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                        (การแก้ไขรูปภาพยังไม่รองรับในหน้านี้ กรุณาติดต่อแอดมินหากต้องการเปลี่ยนรูป)
                    </div>
                )}
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- Main Content (Left) --- */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className={isEditing ? "border-2 border-blue-400 shadow-xl" : ""}>
                        <CardHeader>
                            {/* Admin Banner: Viewing Draft */}
                            {isAdmin && viewingDraft && (
                                <div className="bg-orange-100 text-orange-800 p-2 rounded mb-4 text-center text-sm font-bold flex items-center justify-center">
                                    <Eye className="w-4 h-4 mr-2"/> คุณกำลังดูตัวอย่างข้อมูลที่ขอแก้ไข (Draft Mode)
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant={displayRequest.urgency === 'HIGH' ? 'destructive' : 'secondary'}>{displayRequest.urgency}</Badge>
                                    <Badge variant="outline" className={displayRequest.status === 'APPROVED' ? 'text-green-600 bg-green-50' : 'text-gray-600'}>{displayRequest.status}</Badge>
                                </div>
                                    
                                {/* --- EDITABLE TITLE --- */}
                                {isEditing ? (
                                    <div className="space-y-1">
                                        <Label className="text-blue-600">หัวข้อโครงการ (แก้ไขได้)</Label>
                                        <Input value={displayRequest.title} onChange={e => handleInputChange('title', e.target.value)} className="text-xl font-bold border-blue-300"/>
                                    </div>
                                ) : (
                                    <CardTitle className="text-3xl font-bold">{displayRequest.title}</CardTitle>
                                )}

                                <div className="flex flex-wrap gap-4 text-gray-500 text-sm items-center">
                                    {isEditing ? (
                                        <div className="flex gap-2 w-full">
                                            <Input value={displayRequest.location} onChange={e => handleInputChange('location', e.target.value)} placeholder="สถานที่" className="border-blue-300"/>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="flex items-center"><Tag className="w-4 h-4 mr-1" />{displayRequest.category?.name || 'ทั่วไป'}</span>
                                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{displayRequest.location}</span>
                                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />หมดเขต: {displayRequest.expires_at ? new Date(displayRequest.expires_at).toLocaleDateString('th-TH') : '-'}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* --- EDITABLE DESCRIPTION --- */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2">รายละเอียด</h3>
                                {isEditing ? (
                                    <Textarea value={displayRequest.description} onChange={e => handleInputChange('description', e.target.value)} rows={10} className="border-blue-300" />
                                ) : (
                                    <p className="whitespace-pre-line text-gray-700">{displayRequest.description}</p>
                                )}
                            </div>

                            {/* Images Gallery */}
                             {displayRequest.images && displayRequest.images.length > 1 && (
                                <div className="space-y-3 pt-4 border-t"><h3 className="font-semibold text-lg flex items-center"><ImageIcon className="w-5 h-5 mr-2 text-gray-600" />รูปภาพเพิ่มเติม ({displayRequest.images.length})</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{displayRequest.images.slice(1).map((img, index) => (<div key={index} className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border bg-gray-100" onClick={() => setSelectedImage(img)}><img src={getImageUrl(img)} className="w-full h-full object-cover" /></div>))}</div></div>
                            )}

                            {/* Organizer Info */}
                            <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-4 mt-6">
                                <div className="bg-blue-200 w-12 h-12 rounded-full flex items-center justify-center font-bold text-blue-700 text-xl">{displayRequest.organization?.name?.charAt(0) || "O"}</div>
                                <div>
                                    <p className="font-bold text-blue-900">{displayRequest.organization?.name || 'ไม่ระบุองค์กร'}</p>
                                    <p className="text-sm text-blue-600">ผู้รับผิดชอบ: {displayRequest.organizer?.first_name} {displayRequest.organizer?.last_name}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Items Card */}
                    {showItemsCard && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="text-orange-500"/> รับบริจาคสิ่งของ</CardTitle></CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <Input value={displayRequest.items_needed || ''} onChange={e => handleInputChange('items_needed', e.target.value)} className="border-blue-300"/>
                                ) : <p className="text-gray-700">{displayRequest.items_needed}</p>}
                            </CardContent>
                        </Card>
                    )}

                    {/* Volunteer Card */}
                     {showVolunteerCard && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="text-purple-500"/> รับสมัครอาสาสมัคร</CardTitle></CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <Label>รายละเอียดอาสา</Label>
                                        <Input value={displayRequest.volunteer_details || ''} onChange={e => handleInputChange('volunteer_details', e.target.value)} className="border-blue-300"/>
                                        <Label>จำนวนคน</Label>
                                        <Input type="number" value={displayRequest.volunteers_needed || 0} onChange={e => handleInputChange('volunteers_needed', e.target.value)} className="border-blue-300"/>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-gray-700">ต้องการ: {displayRequest.volunteers_needed} คน</p>
                                        {displayRequest.volunteer_details && <p className="text-gray-500 text-sm mt-2">{displayRequest.volunteer_details}</p>}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* --- Sidebar (Right) --- */}
                <div className="space-y-6">

                    {/* 🔥 1. ADMIN PANEL 🔥 */}
                    {isAdmin && (
                        <Card className="border-2 border-purple-500 shadow-lg relative overflow-hidden">
                            <div className="bg-purple-600 p-4 text-white flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" /> <h3 className="font-bold">ผู้ดูแลระบบ</h3>
                            </div>
                            <CardContent className="pt-6 space-y-4">
                                
                                {/* Case: Edit Requested */}
                                {originalRequest.status === 'EDIT_REQUESTED' && (
                                    <div className="bg-orange-50 p-3 rounded border border-orange-200 space-y-3">
                                        <div className="flex items-center text-orange-800 font-bold gap-2">
                                            <AlertTriangle className="w-5 h-5"/> มีคำขอแก้ไขข้อมูล
                                        </div>
                                        
                                        {/* Toggle View Changes */}
                                        {hasPendingUpdates && (
                                            <div className="flex items-center justify-between bg-white p-2 rounded border shadow-sm">
                                                <div className="text-sm">
                                                    <span className="font-semibold text-gray-700 block">กดเพื่อดูข้อมูลใหม่</span>
                                                    <span className="text-xs text-gray-500">(เปรียบเทียบก่อนอนุมัติ)</span>
                                                </div>
                                                <Switch checked={viewingDraft} onCheckedChange={toggleViewDraft} />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <Button onClick={() => handleAdminAction('approve-edit')} className="bg-blue-600 hover:bg-blue-700 text-white w-full">อนุมัติแก้ไข</Button>
                                            <Button onClick={() => handleAdminAction('reject-edit')} variant="outline" className="text-red-600 bg-white border-red-200 w-full hover:bg-red-50">ปฏิเสธ</Button>
                                        </div>
                                    </div>
                                )}

                                {/* Case: Pending New Request */}
                                {originalRequest.status === 'PENDING' && (
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-600">โครงการใหม่รอตรวจสอบ</p>
                                        <Button onClick={() => handleAdminAction('approve')} className="w-full bg-green-600 hover:bg-green-700">อนุมัติเผยแพร่</Button>
                                        <Button onClick={() => handleAdminAction('reject')} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">ปฏิเสธ</Button>
                                    </div>
                                )}

                                {originalRequest.status === 'APPROVED' && <div className="text-center text-green-600 font-bold py-2 bg-green-50 rounded border border-green-200">✅ อนุมัติแล้ว</div>}
                            </CardContent>
                        </Card>
                    )}

                    {/* 🔥 2. ORGANIZER PANEL 🔥 */}
                    {isOrganizer && !isAdmin && (
                        <Card className="border-2 border-blue-200 shadow-md">
                            <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-2">
                                <FileEdit className="w-5 h-5 text-blue-700" /><h3 className="font-bold text-blue-800">จัดการโครงการ</h3>
                            </div>
                            <CardContent className="pt-4 space-y-3">
                                
                                {/* Normal State: Show Edit Button */}
                                {!isEditing && originalRequest.status === 'APPROVED' && (
                                    <Button onClick={startEditing} className="w-full bg-blue-600 hover:bg-blue-700">
                                        <FileEdit className="w-4 h-4 mr-2" /> แก้ไขข้อมูล
                                    </Button>
                                )}

                                {/* Editing State: Show Save/Cancel */}
                                {isEditing && (
                                    <div className="space-y-2">
                                        <Button onClick={handleSaveClick} className="w-full bg-green-600 hover:bg-green-700">
                                            <Save className="w-4 h-4 mr-2" /> บันทึกการเปลี่ยนแปลง
                                        </Button>
                                        <Button onClick={cancelEditing} variant="outline" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600">
                                            <RotateCcw className="w-4 h-4 mr-2" /> ยกเลิก
                                        </Button>
                                    </div>
                                )}

                                {/* Waiting Approval */}
                                {originalRequest.status === 'EDIT_REQUESTED' && (
                                    <div className="bg-orange-50 p-4 text-center rounded border border-orange-200">
                                        <Clock className="w-8 h-8 mx-auto text-orange-500 mb-2"/>
                                        <h4 className="font-bold text-orange-800">รออนุมัติการแก้ไข</h4>
                                        <p className="text-xs text-orange-600">คุณส่งคำขอไปแล้ว กรุณารอแอดมิน</p>
                                    </div>
                                )}
                                
                                {originalRequest.status === 'PENDING' && <Alert className="bg-yellow-50"><Clock className="h-4 w-4"/><AlertTitle>รอตรวจสอบ</AlertTitle><AlertDescription>อยู่ระหว่างรอการอนุมัติครั้งแรก</AlertDescription></Alert>}

                            </CardContent>
                        </Card>
                    )}

                    {/* Donation Info */}
                    {displayRequest.accepts_money && (
                        <Card className="border-t-4 border-t-green-500 shadow-lg">
                            <CardHeader><CardTitle className="text-green-700 flex items-center gap-2"><DollarSign/> ระดมทุน</CardTitle></CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-2">฿{displayRequest.current_amount.toLocaleString()}</div>
                                <div className="text-sm text-gray-500 mb-2">จากเป้าหมาย ฿{displayRequest.goal_amount ? displayRequest.goal_amount.toLocaleString() : 'ไม่จำกัด'}</div>
                                <Progress value={(displayRequest.current_amount / (displayRequest.goal_amount || 1)) * 100} className="h-3 mb-6" />
                                <Button className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg" disabled={isOrganizer || isAdmin || displayRequest.status !== 'APPROVED'}>
                                    {(isOrganizer || isAdmin) ? "ดูในมุมมองผู้ดูแล" : "ร่วมบริจาค"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Contact Info */}
                    <Card>
                        <CardHeader><CardTitle className="text-base">ข้อมูลติดต่อ</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div><label className="font-medium text-gray-600 flex items-center mb-1"><Phone className="w-4 h-4 mr-2" />เบอร์โทรศัพท์</label><p className="text-gray-800 ml-6">{displayRequest.contact_phone}</p></div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}