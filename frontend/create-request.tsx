"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
    ArrowLeft,
    Upload,
    MapPin,
    Phone,
    Save,
    Eye,
    Building,
    CheckCircle2,
    Circle,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface CreateRequestData {
    title: string
    description: string
    category: string
    donationType: string[]
    goalAmount?: number
    goalItems?: string
    goalVolunteers?: number
    volunteerDetails?: string
    location: string
    detailedAddress: string
    contactPhone: string
    promptpayNumber?: string
    // เพิ่มฟิลด์ใหม่สำหรับข้อมูลธนาคาร
    bankName?: string
    accountNumber?: string
    accountName?: string
    organizationDetails: {
        organizationType: string
        registrationNumber: string
        taxId: string
    }
}

const organizationTypes = [
    { value: "school", label: "โรงเรียน", icon: "🏫" },
    { value: "hospital", label: "โรงพยาบาล", icon: "🏥" },
    { value: "temple", label: "วัด/สถานที่ศักดิ์สิทธิ์", icon: "🏛️" },
    { value: "foundation", label: "มูลนิธิ", icon: "🤝" },
    { value: "ngo", label: "องค์กรไม่แสวงหาผลกำไร", icon: "🌟" },
    { value: "community", label: "ชุมชน", icon: "🏘️" },
    { value: "government", label: "หน่วยงานราชการ", icon: "🏛️" },
    { value: "elderly", label: "บ้านพักผู้สูงอายุ", icon: "👴" },
    { value: "orphanage", label: "สถานเลี้ยงเด็กกำพร้า", icon: "👶" },
    { value: "disability", label: "ศูนย์ผู้พิการ", icon: "♿" },
]

const categories = [
    { value: "disaster", label: "ภัยพิบัติ", icon: "🌊" },
    { value: "medical", label: "การแพทย์", icon: "🏥" },
    { value: "education", label: "การศึกษา", icon: "📚" },
    { value: "animal", label: "สัตว์", icon: "🐕" },
    { value: "environment", label: "สิ่งแวดล้อม", icon: "🌱" },
    { value: "elderly", label: "ผู้สูงอายุ", icon: "👴" },
    { value: "children", label: "เด็กและเยาวชน", icon: "👶" },
    { value: "disability", label: "ผู้พิการ", icon: "♿" },
    { value: "community", label: "ชุมชน", icon: "🏘️" },
    { value: "religion", label: "ศาสนา", icon: "🙏" },
]

const donationTypes = [
    {
        value: "money",
        label: "เงินบริจาค",
        icon: "💰",
        description: "การบริจาคเงินสดเพื่อซื้อสิ่งของหรือใช้จ่ายตามความจำเป็น",
        color: "bg-green-100 text-green-700 border-green-200",
        examples: ["ค่าอาหาร", "ค่ายา", "ค่าซ่อมแซม", "ค่าเล่าเรียน"],
    },
    {
        value: "items",
        label: "สิ่งของ",
        icon: "📦",
        description: "อุปกรณ์, เครื่องใช้, อาหาร, เสื้อผ้า หรือสิ่งของที่จำเป็น",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        examples: ["หนังสือ", "เครื่องเขียน", "อาหารแห้ง", "เสื้อผ้า"],
    },
    {
        value: "volunteer",
        label: "แรงงาน/อาสาสมัคร",
        icon: "🤝",
        description: "อาสาสมัคร, แรงคน, ความรู้ความสามารถ หรือบริการต่างๆ",
        color: "bg-purple-100 text-purple-700 border-purple-200",
        examples: ["ช่วยงานก่อสร้าง", "สอนหนังสือ", "ดูแลผู้ป่วย", "ทำความสะอาด"],
    },
]

export default function CreateRequest() {
    const router = useRouter()
    const { user } = useAuth()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string>("")
    const [success, setSuccess] = useState(false)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const previewUrlsRef = useRef<string[]>([])

    const [formData, setFormData] = useState<CreateRequestData>({
        title: "",
        description: "",
        category: "",
        donationType: [],
        goalAmount: undefined,
        goalItems: "",
        goalVolunteers: undefined,
        volunteerDetails: "",
        location: "",
        detailedAddress: "",
        contactPhone: user?.phone || "",
        promptpayNumber: "",
        // กำหนดค่าเริ่มต้นสำหรับฟิลด์ธนาคาร
        bankName: "",
        accountNumber: "",
        accountName: user?.organizationName || `${user?.firstName || ""} ${user?.lastName || ""}`,
        organizationDetails: {
            organizationType: "",
            registrationNumber: "",
            taxId: "",
        },
    })

    // Cleanup Object URLs
    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
        }
    }, [])

    // Update image previews
    useEffect(() => {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
        const newPreviews = imageFiles.map((file) => URL.createObjectURL(file))
        setImagePreviews(newPreviews)
        previewUrlsRef.current = newPreviews

        if (imageFiles.length === 0) setCurrentImageIndex(0)
        else if (currentImageIndex >= imageFiles.length) setCurrentImageIndex(imageFiles.length - 1)
    }, [imageFiles])

    // Load saved data
    useEffect(() => {
        if (user) {
            const savedOrg = localStorage.getItem("savedOrganizationDetails")
            if (savedOrg) {
                try {
                    const org = JSON.parse(savedOrg)
                    setFormData((prev) => ({ ...prev, organizationDetails: { ...org } }))
                } catch { }
            }
        }
    }, [user])

    // Auto-save organization details
    useEffect(() => {
        const org = formData.organizationDetails
        if (org.organizationType && org.registrationNumber.trim()) {
            localStorage.setItem("savedOrganizationDetails", JSON.stringify(org))
        }
    }, [formData.organizationDetails])

    // Auth check
    useEffect(() => {
        if (user) {
            if (user.role !== "organizer") {
                router.replace("/")
            } else {
                setIsAuthorized(true)
            }
        }
    }, [user, router])

    if (!user || !isAuthorized) return null

    const handleTextChange = (field: keyof CreateRequestData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleNestedTextChange = (
        parent: "organizationDetails",
        field: string,
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value },
        }))
    }

    const handleNumberChange = (field: "goalAmount" | "goalVolunteers", value: string) => {
        if (value === "" || /^\d+$/.test(value)) {
            setFormData((prev) => ({
                ...prev,
                [field]: value === "" ? undefined : Number(value),
            }))
        }
    }

    const handleDonationTypeToggle = (type: string) => {
        setFormData((prev) => ({
            ...prev,
            donationType: prev.donationType.includes(type)
                ? prev.donationType.filter((t) => t !== type)
                : [...prev.donationType, type],
        }))
    }

    const handleSelectAllDonationTypes = () => {
        setFormData((prev) => ({
            ...prev,
            donationType: donationTypes.map((t) => t.value),
        }))
    }

    const handleClearAllDonationTypes = () => {
        setFormData((prev) => ({ ...prev, donationType: [] }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        // Validation
        if (imageFiles.length === 0) {
            setError("กรุณาอัปโหลดรูปภาพประกอบอย่างน้อย 1 รูป")
            setIsSubmitting(false)
            return
        }

        if (!formData.title.trim() || !formData.description.trim() || !formData.category || formData.donationType.length === 0) {
            setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน")
            setIsSubmitting(false)
            return
        }

        if (formData.donationType.includes("money")) {
            if (!formData.goalAmount || formData.goalAmount < 1000) {
                setError("เป้าหมายการระดมทุนต้องไม่น้อยกว่า 1,000 บาท")
                setIsSubmitting(false)
                return
            }
            // ตรวจสอบข้อมูลธนาคาร
            if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
                setError("กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน")
                setIsSubmitting(false)
                return
            }
        }

        if (formData.donationType.includes("items") && !formData.goalItems?.trim()) {
            setError("กรุณาระบุสิ่งของที่ต้องการให้ละเอียด")
            setIsSubmitting(false)
            return
        }

        if (formData.donationType.includes("volunteer")) {
            if (!formData.goalVolunteers || formData.goalVolunteers < 1) {
                setError("กรุณาระบุจำนวนอาสาสมัครที่ต้องการ")
                setIsSubmitting(false)
                return
            }
            if (!formData.volunteerDetails?.trim()) {
                setError("กรุณาระบุรายละเอียดงานที่ต้องการอาสาสมัคร")
                setIsSubmitting(false)
                return
            }
        }

        if (!formData.organizationDetails.organizationType || !formData.organizationDetails.registrationNumber.trim()) {
            setError("กรุณากรอกข้อมูลองค์กรให้ครบถ้วน")
            setIsSubmitting(false)
            return
        }

        try {
            const formDataToSend = new FormData()

            // ข้อมูลพื้นฐาน
            formDataToSend.append("title", formData.title.trim())
            formDataToSend.append("description", formData.description.trim())
            
            // แปลง category จาก string value เป็น ID
            const categoryObj = categories.find(cat => cat.value === formData.category)
            formDataToSend.append("category_id", categoryObj ? categoryObj.value : formData.category)
            
            formDataToSend.append("location", formData.location.trim())
            formDataToSend.append("contact_phone", formData.contactPhone.trim())
            formDataToSend.append("organization_type", formData.organizationDetails.organizationType)
            formDataToSend.append("registration_number", formData.organizationDetails.registrationNumber.trim())

            if (formData.detailedAddress.trim()) {
                formDataToSend.append("detailed_address", formData.detailedAddress.trim())
            }
            if (formData.organizationDetails.taxId.trim()) {
                formDataToSend.append("tax_id", formData.organizationDetails.taxId.trim())
            }

            // ประเภทบริจาค
            formData.donationType.forEach((type) => {
                formDataToSend.append("donation_types[]", type)
            })

            // เงินบริจาค
            if (formData.donationType.includes("money") && formData.goalAmount) {
                formDataToSend.append("goal_amount", formData.goalAmount.toString())
                
                // ใช้ข้อมูลจากฟอร์ม
                const bankAccount = {
                    bank: formData.bankName || "",
                    account_number: formData.accountNumber || "",
                    account_name: formData.accountName || user?.organizationName || `${user?.firstName} ${user?.lastName}`
                }
                
                formDataToSend.append("bank_account[bank]", bankAccount.bank)
                formDataToSend.append("bank_account[account_number]", bankAccount.account_number)
                formDataToSend.append("bank_account[account_name]", bankAccount.account_name)
                
                if (formData.promptpayNumber?.trim()) {
                    formDataToSend.append("promptpay_number", formData.promptpayNumber.trim())
                }
            }

            // สิ่งของ
            if (formData.donationType.includes("items") && formData.goalItems?.trim()) {
                formDataToSend.append("items_needed", formData.goalItems.trim())
            }

            // อาสาสมัคร
            if (formData.donationType.includes("volunteer")) {
                formDataToSend.append("volunteers_needed", formData.goalVolunteers!.toString())
                formDataToSend.append("volunteer_details", formData.volunteerDetails!.trim())
            }

            // กำหนด urgency
            formDataToSend.append("urgency", "MEDIUM")

            // รูปภาพ
            imageFiles.forEach((file, index) => {
                formDataToSend.append(`images[${index}]`, file)
            })

            // Debug
            console.log("=== ข้อมูลที่จะส่งไป backend ===")
            const debugData: Record<string, any> = {}
            for (const [key, value] of formDataToSend.entries()) {
                debugData[key] = value instanceof File ? `File: ${value.name}` : value
            }
            console.log(JSON.stringify(debugData, null, 2))

            const response = await axios.post(`${API_URL}/donation-requests`, formDataToSend, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`,
                    "Content-Type": "multipart/form-data",
                },
            })

            setSuccess(true)
            localStorage.removeItem("savedOrganizationDetails")
            setTimeout(() => router.push("/organizer-dashboard"), 2000)
            
        } catch (err: any) {
            console.error("เกิดข้อผิดพลาด:", err)
            console.error("Response data:", err.response?.data)

            let errorMessage = "เกิดข้อผิดพลาดในการสร้างคำขอ"

            if (err.response?.data?.messages) {
                const errors = err.response.data.messages
                errorMessage = Object.entries(errors)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join(' • ')
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error
            } else if (err.response?.status === 422) {
                errorMessage = "ข้อมูลไม่ครบถ้วนหรือรูปแบบไม่ถูกต้อง"
            } else if (err.response?.status === 403) {
                errorMessage = "คุณไม่มีสิทธิ์สร้างคำขอ กรุณาเข้าสู่ระบบใหม่"
                router.push("/login")
            }

            setError(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatAmount = (amount?: number) => (amount ? new Intl.NumberFormat("th-TH").format(amount) : "-")

    const getOrganizationTypeLabel = (type: string) =>
        organizationTypes.find((t) => t.value === type)?.label || type

    const getCategoryLabel = (category: string) =>
        categories.find((c) => c.value === category)?.label || category

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">สร้างคำขอสำเร็จ!</h2>
                        <p className="text-gray-600 mb-4">คำขอบริจาคของคุณได้ถูกส่งไปรอการอนุมัติแล้ว</p>
                        <p className="text-sm text-gray-500">กำลังนำคุณไปยังหน้าจัดการ...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-pink-50">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับ
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">สร้างคำขอบริจาค</h1>
                            <p className="text-sm text-gray-600">กรอกข้อมูลเพื่อสร้างคำขอบริจาคใหม่</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 lg:p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* ข้อมูลพื้นฐาน */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">หัวข้อคำขอ *</Label>
                                        <Input
                                            id="title"
                                            placeholder="เช่น ช่วยเหลือครอบครัวที่ประสบอุทกภัย"
                                            value={formData.title}
                                            onChange={(e) => handleTextChange("title", e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">รายละเอียด *</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="อธิบายสถานการณ์และความต้องการความช่วยเหลือ..."
                                            rows={6}
                                            value={formData.description}
                                            onChange={(e) => handleTextChange("description", e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-gray-500">
                                            อธิบายให้ละเอียดเพื่อให้ผู้บริจาคเข้าใจสถานการณ์
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">หมวดหมู่ *</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value) => handleTextChange("category", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.value} value={cat.value}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{cat.icon}</span>
                                                                <span>{cat.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="organizationType">ประเภทองค์กร *</Label>
                                            <Select
                                                value={formData.organizationDetails.organizationType}
                                                onValueChange={(value) =>
                                                    handleNestedTextChange("organizationDetails", "organizationType", value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกประเภทองค์กร" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {organizationTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{type.icon}</span>
                                                                <span>{type.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* รูปภาพ */}
                                    <div className="space-y-4">
                                        <Label>รูปภาพประกอบ (สูงสุด 10 รูป) *</Label>

                                        {imagePreviews.length === 0 ? (
                                            <label className="flex flex-col items-center justify-center w-full h-96 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                                                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                                                <span className="text-lg font-medium text-gray-700">คลิกเพื่อเพิ่มรูปภาพ</span>
                                                <span className="text-sm text-gray-500 mt-2">
                                                    รองรับ JPG, PNG, WEBP • สูงสุด 5MB ต่อรูป
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files || [])
                                                        const validFiles = files.filter((file) => {
                                                            if (file.size > 5 * 1024 * 1024) {
                                                                setError(`ไฟล์ ${file.name} ใหญ่เกิน 5MB`)
                                                                return false
                                                            }
                                                            return true
                                                        })

                                                        if (imageFiles.length + validFiles.length > 10) {
                                                            setError("อัปโหลดได้สูงสุด 10 รูปเท่านั้น")
                                                            return
                                                        }

                                                        setImageFiles((prev) => [...prev, ...validFiles])
                                                    }}
                                                />
                                            </label>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 aspect-[4/3]">
                                                    <img
                                                        src={imagePreviews[currentImageIndex]}
                                                        alt={`รูปภาพหลัก ${currentImageIndex + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newFiles = imageFiles.filter((_, i) => i !== currentImageIndex)
                                                            setImageFiles(newFiles)
                                                        }}
                                                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-red-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white transition-all border border-gray-200"
                                                        title="ลบรูปนี้"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="flex gap-3 overflow-x-auto pb-2">
                                                    {imagePreviews.map((preview, index) => (
                                                        <div key={index} className="relative group">
                                                            <button
                                                                type="button"
                                                                onClick={() => setCurrentImageIndex(index)}
                                                                className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                                                        ? "border-pink-500 ring-2 ring-pink-200"
                                                                        : "border-gray-300 hover:border-gray-400"
                                                                    }`}
                                                            >
                                                                <img
                                                                    src={preview}
                                                                    alt={`thumbnail ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    const newFiles = imageFiles.filter((_, i) => i !== index)
                                                                    setImageFiles(newFiles)
                                                                }}
                                                                className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                                                                title="ลบ"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {imageFiles.length < 10 && (
                                                        <label className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50">
                                                            <Upload className="w-8 h-8 text-gray-400" />
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const files = Array.from(e.target.files || [])
                                                                    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024)

                                                                    if (imageFiles.length + validFiles.length > 10) {
                                                                        setError("อัปโหลดได้สูงสุด 10 รูปเท่านั้น")
                                                                        return
                                                                    }

                                                                    setImageFiles((prev) => [...prev, ...validFiles])
                                                                }}
                                                            />
                                                        </label>
                                                    )}
                                                </div>

                                                <p className="text-sm text-gray-600">
                                                    อัปโหลดแล้ว {imageFiles.length}/10 รูป
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ประเภทการบริจาค */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>ประเภทการบริจาคที่ต้องการ *</CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">
                                                เลือกประเภทการบริจาคที่ต้องการรับ (เลือกได้หลายประเภท)
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectAllDonationTypes}
                                            >
                                                เลือกทั้งหมด
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClearAllDonationTypes}
                                            >
                                                ยกเลิกทั้งหมด
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4">
                                        {donationTypes.map((type) => (
                                            <div
                                                key={type.value}
                                                className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.donationType.includes(type.value)
                                                        ? `${type.color} border-2`
                                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                    }`}
                                                onClick={() => handleDonationTypeToggle(type.value)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1">
                                                        {formData.donationType.includes(type.value) ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <Circle className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xl">{type.icon}</span>
                                                            <h4 className="font-semibold text-gray-800">{type.label}</h4>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {type.examples.map((ex, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                                                >
                                                                    {ex}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {formData.donationType.includes("money") && (
                                        <div className="p-5 bg-green-50 rounded-xl border border-green-200 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">💰</span>
                                                <h4 className="font-semibold text-green-800">ข้อมูลการรับเงินบริจาค</h4>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="goalAmount">เป้าหมายเงิน (บาท) *</Label>
                                                <Input
                                                    id="goalAmount"
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    placeholder="50000"
                                                    value={formData.goalAmount ?? ""}
                                                    onChange={(e) => handleNumberChange("goalAmount", e.target.value)}
                                                    required
                                                />
                                                <p className="text-xs text-green-700">จำนวนเงินขั้นต่ำ 1,000 บาท</p>
                                            </div>

                                            {/* เพิ่มฟิลด์ข้อมูลธนาคาร */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="bankName">ชื่อธนาคาร *</Label>
                                                    <Select
                                                        value={formData.bankName || ""}
                                                        onValueChange={(value) => handleTextChange("bankName", value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="เลือกธนาคาร" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</SelectItem>
                                                            <SelectItem value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</SelectItem>
                                                            <SelectItem value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</SelectItem>
                                                            <SelectItem value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</SelectItem>
                                                            <SelectItem value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</SelectItem>
                                                            <SelectItem value="ธนาคารทหารไทย">ธนาคารทหารไทย</SelectItem>
                                                            <SelectItem value="ธนาคารออมสิน">ธนาคารออมสิน</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="accountNumber">เลขที่บัญชี *</Label>
                                                    <Input
                                                        id="accountNumber"
                                                        type="text"
                                                        placeholder="123-4-56789-0"
                                                        value={formData.accountNumber || ""}
                                                        onChange={(e) => handleTextChange("accountNumber", e.target.value)}
                                                        required={formData.donationType.includes("money")}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="accountName">ชื่อบัญชี *</Label>
                                                <Input
                                                    id="accountName"
                                                    placeholder="ชื่อ-นามสกุล หรือ ชื่อองค์กร"
                                                    value={formData.accountName || user?.organizationName || `${user?.firstName} ${user?.lastName}`}
                                                    onChange={(e) => handleTextChange("accountName", e.target.value)}
                                                    required={formData.donationType.includes("money")}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="promptpayNumber">พร้อมเพย์ (optional)</Label>
                                                <Input
                                                    id="promptpayNumber"
                                                    placeholder="เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน 13 หลัก"
                                                    value={formData.promptpayNumber || ""}
                                                    onChange={(e) => handleTextChange("promptpayNumber", e.target.value)}
                                                />
                                                <p className="text-xs text-green-700">
                                                    สามารถกรอกพร้อมเพย์หรือบัญชีธนาคารอย่างใดอย่างหนึ่ง
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {formData.donationType.includes("items") && (
                                        <div className="p-5 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">📦</span>
                                                <h4 className="font-semibold text-blue-800">ข้อมูลสิ่งของที่ต้องการ</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="goalItems">รายการสิ่งของที่ต้องการ *</Label>
                                                <Textarea
                                                    id="goalItems"
                                                    placeholder="เช่น หนังสือเรียน 100 เล่ม, เครื่องเขียน 50 ชุด..."
                                                    rows={4}
                                                    value={formData.goalItems}
                                                    onChange={(e) => handleTextChange("goalItems", e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.donationType.includes("volunteer") && (
                                        <div className="p-5 bg-purple-50 rounded-xl border border-purple-200 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">🤝</span>
                                                <h4 className="font-semibold text-purple-800">ข้อมูลอาสาสมัครที่ต้องการ</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="goalVolunteers">จำนวนอาสาสมัคร (คน) *</Label>
                                                    <Input
                                                        id="goalVolunteers"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        placeholder="10"
                                                        value={formData.goalVolunteers ?? ""}
                                                        onChange={(e) => handleNumberChange("goalVolunteers", e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="volunteerDetails">รายละเอียดงานที่ต้องการ *</Label>
                                                <Textarea
                                                    id="volunteerDetails"
                                                    placeholder="เช่น ช่วยงานก่อสร้าง, สอนหนังสือให้เด็ก..."
                                                    rows={4}
                                                    value={formData.volunteerDetails}
                                                    onChange={(e) => handleTextChange("volunteerDetails", e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* ข้อมูลองค์กร */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building className="w-5 h-5 text-blue-500" />
                                        ข้อมูลองค์กร (บันทึกอัตโนมัติ)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="registrationNumber">เลขทะเบียนองค์กร *</Label>
                                            <Input
                                                id="registrationNumber"
                                                placeholder="เช่น 0123456789012"
                                                value={formData.organizationDetails.registrationNumber}
                                                onChange={(e) =>
                                                    handleNestedTextChange("organizationDetails", "registrationNumber", e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
                                            <Input
                                                id="taxId"
                                                placeholder="เช่น 0123456789012"
                                                value={formData.organizationDetails.taxId}
                                                onChange={(e) =>
                                                    handleNestedTextChange("organizationDetails", "taxId", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ที่ตั้ง & ติดต่อ */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-pink-500" />
                                        ข้อมูลที่ตั้ง & การติดต่อ
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location">จังหวัด/พื้นที่ *</Label>
                                        <Input
                                            id="location"
                                            placeholder="เช่น กรุงเทพมหานคร, เชียงใหม่"
                                            value={formData.location}
                                            onChange={(e) => handleTextChange("location", e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="detailedAddress">ที่อยู่ละเอียด</Label>
                                        <Textarea
                                            id="detailedAddress"
                                            placeholder="ที่อยู่เต็ม รวมหมู่บ้าน ซอย ถนน รหัสไปรษณีย์"
                                            rows={3}
                                            value={formData.detailedAddress}
                                            onChange={(e) => handleTextChange("detailedAddress", e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">เบอร์โทรติดต่อ *</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="contactPhone"
                                                type="tel"
                                                placeholder="0812345678"
                                                className="pl-10"
                                                value={formData.contactPhone}
                                                onChange={(e) => handleTextChange("contactPhone", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-blue-500" />
                                        ตัวอย่างการแสดงผล
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {imagePreviews.length > 0 ? (
                                        <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                                            <img
                                                src={imagePreviews[0]}
                                                alt="ตัวอย่างรูปแรก"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                            <span className="text-gray-400">ยังไม่มีรูปภาพ</span>
                                        </div>
                                    )}

                                    <h3 className="font-bold text-lg line-clamp-2">
                                        {formData.title || "หัวข้อคำขอบริจาค"}
                                    </h3>

                                    <p className="text-sm text-gray-600 line-clamp-4">
                                        {formData.description || "รายละเอียดคำขอบริจาค..."}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {formData.category && (
                                            <span className="px-2.5 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                                                {getCategoryLabel(formData.category)}
                                            </span>
                                        )}
                                        {formData.organizationDetails.organizationType && (
                                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                {getOrganizationTypeLabel(formData.organizationDetails.organizationType)}
                                            </span>
                                        )}
                                    </div>

                                    {formData.donationType.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {formData.donationType.map((type) => {
                                                const info = donationTypes.find((t) => t.value === type)
                                                return (
                                                    <span
                                                        key={type}
                                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1"
                                                    >
                                                        <span>{info?.icon}</span>
                                                        <span>{info?.label}</span>
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {formData.goalAmount && (
                                        <div className="flex justify-between text-sm pt-2 border-t">
                                            <span className="text-gray-600">เป้าหมาย</span>
                                            <span className="font-semibold text-green-700">
                                                ฿{formatAmount(formData.goalAmount)}
                                            </span>
                                        </div>
                                    )}

                                    {formData.location && (
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4" />
                                            <span>{formData.location}</span>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500 pt-2 border-t">
                                        <p>
                                            ผู้จัดการ:{" "}
                                            {user?.organizationName ||
                                                `${user?.firstName || ""} ${user?.lastName || ""}`}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex flex-col gap-3">
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 h-12 text-base"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                                            กำลังสร้างคำขอ...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" />
                                            สร้างคำขอบริจาค
                                        </>
                                    )}
                                </Button>

                                <Button type="button" variant="outline" className="w-full">
                                    บันทึกร่าง (กำลังจะมา)
                                </Button>
                            </div>

                            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                                <h4 className="font-medium text-blue-800 mb-3">เคล็ดลับการสร้างคำขอที่ดี</h4>
                                <ul className="text-sm text-blue-700 space-y-2">
                                    <li>• เขียนหัวข้อที่ดึงดูดและชัดเจน</li>
                                    <li>• อธิบายสถานการณ์อย่างละเอียดและจริงใจ</li>
                                    <li>• ใช้รูปภาพที่สื่ออารมณ์และชัดเจน</li>
                                    <li>• ระบุความต้องการให้เจาะจงที่สุด</li>
                                    <li>• ตรวจสอบข้อมูลองค์กรและติดต่อให้ถูกต้อง</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}