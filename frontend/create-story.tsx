"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Camera, ImageIcon, Save, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

interface StoryFormData {
    title: string
    content: string
    type: "progress" | "milestone" | "thank_you" | "completion"
    image?: File
    duration: number
    donation_request_id: string // เปลี่ยนจาก number เป็น string
}

interface DonationRequest {
    id: string // เปลี่ยนจาก number เป็น string
    title: string
    organizer: string
    currentAmount: number
    goalAmount: number
    supporters: number
}

// API Service
class StoryApiService {
    private baseUrl = process.env.NEXT_PUBLIC_API_URL

    private async request(endpoint: string, options: RequestInit = {}) {
        const token = localStorage.getItem('auth_token')

        const config: RequestInit = {
            headers: {
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `API error: ${response.status}`)
        }

        return response.json()
    }

    async getOrganizerRequests(): Promise<DonationRequest[]> {
        try {
            const response = await this.request('/organizer/donation-requests')
            return response.data || []
        } catch (error) {
            console.error('Error fetching organizer requests:', error)
            throw error
        }
    }

    async createStory(formData: StoryFormData) {
        const formDataToSend = new FormData()

        // Append basic fields
        formDataToSend.append('title', formData.title)
        formDataToSend.append('content', formData.content)
        formDataToSend.append('type', formData.type)
        formDataToSend.append('duration', formData.duration.toString())
        formDataToSend.append('donation_request_id', formData.donation_request_id)

        // Append image if exists
        if (formData.image) {
            formDataToSend.append('image', formData.image)
        }

        return this.request('/organizer/stories', {
            method: 'POST',
            body: formDataToSend,
        })
    }
}

export const storyApiService = new StoryApiService()

export default function CreateStory() {
    const router = useRouter()
    const { user } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [organizerRequests, setOrganizerRequests] = useState<DonationRequest[]>([])

    const [formData, setFormData] = useState<StoryFormData>({
        title: "",
        content: "",
        type: "progress",
        duration: 5,
        donation_request_id: "", // เปลี่ยนจาก 0 เป็น ""
    })

    // Redirect if not organizer - ใช้ useEffect แทน
    useEffect(() => {
        if (!user || user.role !== "organizer") {
            router.push("/")
        }
    }, [user, router])

    // Fetch organizer's donation requests
    useEffect(() => {
        fetchOrganizerRequests()
    }, [])

    const fetchOrganizerRequests = async () => {
        try {
            setIsLoading(true)
            const requests = await storyApiService.getOrganizerRequests()
            setOrganizerRequests(requests)

            // Auto-select the first request if available
            if (requests.length > 0 && !formData.donation_request_id) {
                setFormData(prev => ({
                    ...prev,
                    donation_request_id: requests[0].id
                }))
            }
        } catch (err) {
            console.error('Error fetching organizer requests:', err)
            setError('ไม่สามารถโหลดข้อมูลคำขอบริจาคได้')
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB")
                return
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น")
                return
            }

            setFormData(prev => ({ ...prev, image: file }))
            setError("")

            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => {
                setPreviewImage(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: undefined }))
        setPreviewImage(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        // Validation
        if (!formData.title.trim()) {
            setError("กรุณากรอกหัวข้อ Story")
            setIsSubmitting(false)
            return
        }

        if (!formData.content.trim()) {
            setError("กรุณากรอกเนื้อหา Story")
            setIsSubmitting(false)
            return
        }

        if (!formData.donation_request_id) {
            setError("กรุณาเลือกคำขอบริจาค")
            setIsSubmitting(false)
            return
        }

        if (formData.content.length < 10) {
            setError("เนื้อหาต้องมีอย่างน้อย 10 ตัวอักษร")
            setIsSubmitting(false)
            return
        }

        if (formData.content.length > 500) {
            setError("เนื้อหาต้องไม่เกิน 500 ตัวอักษร")
            setIsSubmitting(false)
            return
        }

        if (!formData.image) {
            setError("กรุณาเลือกรูปภาพสำหรับ Story")
            setIsSubmitting(false)
            return
        }

        try {
            // Call API to create story
            const response = await storyApiService.createStory(formData)

            if (response.success) {
                setSuccess(true)

                // Redirect after success
                setTimeout(() => {
                    router.push("/story-management")
                }, 2000)
            } else {
                setError(response.message || 'เกิดข้อผิดพลาดในการสร้าง Story')
            }
        } catch (err: any) {
            console.error('Error creating story:', err)
            setError(err.message || 'เกิดข้อผิดพลาดในการสร้าง Story')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getTypeColor = (type: string) => {
        const colors = {
            progress: "bg-blue-500",
            milestone: "bg-purple-500",
            thank_you: "bg-green-500",
            completion: "bg-orange-500",
        }
        return colors[type as keyof typeof colors] || "bg-gray-500"
    }

    const getTypeText = (type: string) => {
        const texts = {
            progress: "ความคืบหน้า",
            milestone: "เหตุการณ์สำคัญ",
            thank_you: "ขอบคุณ",
            completion: "เสร็จสิ้น",
        }
        return texts[type as keyof typeof texts] || type
    }

    const selectedRequest = organizerRequests.find((req) => req.id === formData.donation_request_id)

    // Redirect if not organizer
    if (!user || user.role !== "organizer") {
        return null
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">✅</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">สร้าง Story สำเร็จ!</h2>
                        <p className="text-gray-600 mb-4">Story ของคุณได้ถูกเผยแพร่แล้ว</p>
                        <p className="text-sm text-gray-500">กำลังนำคุณไปยังหน้าจัดการ...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-pink-50">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับ
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">สร้าง Story ใหม่</h1>
                            <p className="text-sm text-gray-600">แชร์ความคืบหน้าและอัปเดตให้ผู้บริจาคทราบ</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertDescription className="text-red-700">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>ข้อมูล Story</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="donationRequestId">เลือกคำขอบริจาค *</Label>
                                        <Select
                                            value={formData.donation_request_id}
                                            onValueChange={(value) => handleInputChange("donation_request_id", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="เลือกคำขอบริจาคที่ต้องการสร้าง Story" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {organizerRequests.map((request) => (
                                                    <SelectItem key={request.id} value={request.id}>
                                                        {request.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {organizerRequests.length === 0 && (
                                            <p className="text-sm text-yellow-600 mt-2">
                                                คุณยังไม่มีคำขอบริจาคที่ได้รับการอนุมัติ
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="p-0 h-auto text-blue-600 ml-1"
                                                    onClick={() => router.push('/create-donation-request')}
                                                >
                                                    สร้างคำขอบริจาคใหม่
                                                </Button>
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title">หัวข้อ Story *</Label>
                                        <Input
                                            id="title"
                                            placeholder="เช่น เริ่มซ่อมแซมบ้านแล้ว, ขอบคุณผู้บริจาค"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange("title", e.target.value)}
                                            required
                                            maxLength={100}
                                        />
                                        <p className="text-xs text-gray-500">{formData.title.length}/100 ตัวอักษร</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="content">เนื้อหา Story *</Label>
                                        <Textarea
                                            id="content"
                                            placeholder="เล่าเรื่องราวความคืบหน้า ขอบคุณผู้บริจาค หรือแชร์ข้อมูลที่น่าสนใจ..."
                                            rows={4}
                                            value={formData.content}
                                            onChange={(e) => handleInputChange("content", e.target.value)}
                                            required
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-gray-500">{formData.content.length}/500 ตัวอักษร (อย่างน้อย 10 ตัวอักษร)</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="type">ประเภท Story *</Label>
                                            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกประเภท" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="progress">ความคืบหน้า</SelectItem>
                                                    <SelectItem value="milestone">เหตุการณ์สำคัญ</SelectItem>
                                                    <SelectItem value="thank_you">ขอบคุณ</SelectItem>
                                                    <SelectItem value="completion">เสร็จสิ้น</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="duration">ระยะเวลาแสดง (วินาที)</Label>
                                            <Select
                                                value={formData.duration.toString()}
                                                onValueChange={(value) => handleInputChange("duration", Number.parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกระยะเวลา" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="3">3 วินาที</SelectItem>
                                                    <SelectItem value="5">5 วินาที</SelectItem>
                                                    <SelectItem value="7">7 วินาที</SelectItem>
                                                    <SelectItem value="10">10 วินาที</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Image Upload */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-blue-500" />
                                        รูปภาพ Story
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!previewImage ? (
                                        <div className="space-y-4">
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-400 transition-colors"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-600 mb-2">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</p>
                                                <p className="text-sm text-gray-500">รองรับไฟล์ JPG, PNG, GIF, WEBP ขนาดไม่เกิน 5MB</p>
                                                <p className="text-xs text-gray-400 mt-2">แนะนำขนาด 9:16 (เหมาะสำหรับมือถือ)</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex-1"
                                                >
                                                    <ImageIcon className="w-4 h-4 mr-2" />
                                                    เลือกจากแกลเลอรี่
                                                </Button>
                                                <Button type="button" variant="outline" className="flex-1" disabled>
                                                    <Camera className="w-4 h-4 mr-2" />
                                                    ถ่ายรูป
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <img
                                                    src={previewImage || "https://via.placeholder.com/400x300?text=No+Image"}
                                                    alt="Preview"
                                                    className="w-full max-w-xs mx-auto rounded-lg shadow-lg object-cover aspect-[9/16]"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={removeImage}
                                                    className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full"
                                            >
                                                เปลี่ยนรูปภาพ
                                            </Button>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview Sidebar */}
                        <div className="space-y-6">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-purple-500" />
                                        ตัวอย่าง Story
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Story Preview */}
                                    <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-[200px] mx-auto">
                                        {previewImage ? (
                                            <img
                                                src={previewImage || "https://via.placeholder.com/400x300?text=No+Image"}
                                                alt="Story preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400 text-sm">ไม่มีรูปภาพ</span>
                                            </div>
                                        )}

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                                        {/* Progress Bar */}
                                        <div className="absolute top-2 left-2 right-2 h-1 bg-white/30 rounded-full">
                                            <div className="h-full bg-white rounded-full w-0" />
                                        </div>

                                        {/* Header */}
                                        <div className="absolute top-6 left-2 right-2 flex items-center gap-2">
                                            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">
                                                    {user.firstName?.charAt(0)}
                                                    {user.lastName?.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs font-medium truncate">
                                                    {user.organizationName || `${user.firstName} ${user.lastName}`}
                                                </p>
                                                <p className="text-white/80 text-xs">เมื่อสักครู่</p>
                                            </div>
                                        </div>

                                        {/* Type Badge */}
                                        {formData.type && (
                                            <div className="absolute top-16 left-2">
                                                <Badge className={`${getTypeColor(formData.type)} text-white border-0 text-xs`}>
                                                    {getTypeText(formData.type)}
                                                </Badge>
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="absolute bottom-4 left-2 right-2">
                                            <h3 className="text-white text-sm font-bold mb-1 line-clamp-2">
                                                {formData.title || "หัวข้อ Story"}
                                            </h3>
                                            <p className="text-white/90 text-xs line-clamp-3">
                                                {formData.content || "เนื้อหา Story จะแสดงที่นี่..."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Request Info */}
                                    {selectedRequest && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <h4 className="font-medium text-sm text-gray-800 mb-2">คำขอที่เลือก:</h4>
                                            <p className="text-xs text-gray-600 line-clamp-2">{selectedRequest.title}</p>
                                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                                <span>ระดมทุนได้: ฿{selectedRequest.currentAmount.toLocaleString()}</span>
                                                <span>{selectedRequest.supporters} ผู้สนับสนุน</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Story Settings */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">ระยะเวลาแสดง:</span>
                                            <span className="font-medium">{formData.duration} วินาที</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">ประเภท:</span>
                                            <Badge className={`${getTypeColor(formData.type)} text-white text-xs`}>
                                                {getTypeText(formData.type)}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                                    disabled={isSubmitting || organizerRequests.length === 0 || !formData.image}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            กำลังสร้าง Story...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            เผยแพร่ Story
                                        </>
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.back()}
                                >
                                    ยกเลิก
                                </Button>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">💡 เคล็ดลับ Story ที่ดี</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• ใช้รูปภาพที่ชัดเจนและน่าสนใจ</li>
                                    <li>• เขียนเนื้อหาที่กระชับและเข้าใจง่าย</li>
                                    <li>• แชร์ความคืบหน้าจริงๆ</li>
                                    <li>• ขอบคุณผู้บริจาคเป็นประจำ</li>
                                    <li>• อัปเดตอย่างสม่ำเสมอ</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}