"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
    ArrowLeft,
    Upload,
    MapPin,
    Phone,
    CreditCard,
    Save,
    Eye,
    Building,
    CheckCircle2,
    Circle,
    X,
    Calendar, 
    Clock     
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

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
    bankAccount: {
        bank: string
        accountNumber: string
        accountName: string
    }
    promptpayNumber?: string
    bankName?: string
    accountNumber?: string
    accountName?: string
    organizationDetails: {
        organizationType: string
        registrationNumber: string
        taxId: string
    }
    durationDays: number
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
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

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
        bankAccount: {
            bank: "",
            accountNumber: "",
            accountName: "",
        },
        promptpayNumber: "",
        bankName: "",
        accountNumber: "",
        accountName: user?.organizationName || `${user?.firstName || ""} ${user?.lastName || ""}`,
        organizationDetails: {
            organizationType: "",
            registrationNumber: "",
            taxId: "",
        },
        durationDays: 30
    })

    useEffect(() => {
        if (imageFiles.length === 0) {
            setCurrentImageIndex(0)
        } else if (currentImageIndex >= imageFiles.length) {
            setCurrentImageIndex(imageFiles.length - 1)
        }
    }, [imageFiles, currentImageIndex])

    useEffect(() => {
        if (user) {
            const savedOrg = localStorage.getItem("savedOrganizationDetails")
            const savedBank = localStorage.getItem("savedBankAccount")

            if (savedOrg) {
                const org = JSON.parse(savedOrg)
                setFormData(prev => ({
                    ...prev,
                    organizationDetails: { ...org }
                }))
            }

            if (savedBank) {
                const bank = JSON.parse(savedBank)
                setFormData(prev => ({
                    ...prev,
                    bankAccount: { ...bank }
                }))
            }
        }
    }, [user])

    useEffect(() => {
        if (formData.organizationDetails.organizationType && formData.organizationDetails.registrationNumber) {
            localStorage.setItem("savedOrganizationDetails", JSON.stringify(formData.organizationDetails))
        }
    }, [formData.organizationDetails])

    useEffect(() => {
        if (formData.bankAccount.bank && formData.bankAccount.accountNumber && formData.bankAccount.accountName) {
            localStorage.setItem("savedBankAccount", JSON.stringify(formData.bankAccount))
        }
    }, [formData.bankAccount])

    useEffect(() => {
        if (user) {
            if (user.role !== "organizer") {
                router.push("/")
            } else {
                setIsAuthorized(true)
            }
        }
    }, [user, router])

    if (!user || !isAuthorized) return null

    const handleInputChange = (field: string, value: string | number) => {
        if (field.startsWith("bankAccount.")) {
            const bankField = field.split(".")[1]
            setFormData(prev => ({
                ...prev,
                bankAccount: {
                    ...prev.bankAccount,
                    [bankField]: value as string,
                },
            }))
        } else if (field.startsWith("organizationDetails.")) {
            const orgField = field.split(".")[1]
            setFormData(prev => ({
                ...prev,
                organizationDetails: {
                    ...prev.organizationDetails,
                    [orgField]: value as string,
                },
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value,
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        if (imageFiles.length === 0) {
            setError("กรุณาอัปโหลดรูปภาพประกอบอย่างน้อย 1 รูป")
            setIsSubmitting(false)
            return
        }

        if (!formData.title || !formData.description || !formData.category || formData.donationType.length === 0) {
            setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน")
            setIsSubmitting(false)
            return
        }

        if (formData.durationDays < 30) {
            setError("ระยะเวลารับบริจาคต้องไม่น้อยกว่า 30 วัน")
            setIsSubmitting(false)
            return
        }

        if (formData.donationType.includes("money")) {
            if (!formData.goalAmount || formData.goalAmount < 1000) {
                setError("เป้าหมายการระดมทุนต้องไม่น้อยกว่า 1,000 บาท")
                setIsSubmitting(false)
                return
            }
            if (!formData.bankAccount.bank || !formData.bankAccount.accountNumber || !formData.bankAccount.accountName) {
                setError("กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วนสำหรับการรับเงินบริจาค")
                setIsSubmitting(false)
                return
            }
        }

        if (formData.donationType.includes("items") && !formData.goalItems) {
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
            if (!formData.volunteerDetails) {
                setError("กรุณาระบุรายละเอียดงานที่ต้องการอาสาสมัคร")
                setIsSubmitting(false)
                return
            }
        }

        if (!formData.organizationDetails.organizationType || !formData.organizationDetails.registrationNumber) {
            setError("กรุณากรอกข้อมูลองค์กรให้ครบถ้วน")
            setIsSubmitting(false)
            return
        }

        try {
            const formDataToSend = new FormData()

            formDataToSend.append("title", formData.title.trim())
            formDataToSend.append("description", formData.description.trim())

            const categoryObj = categories.find(cat => cat.value === formData.category)
            formDataToSend.append("category_id", categoryObj ? categoryObj.value : formData.category)

            formDataToSend.append("location", formData.location.trim())
            formDataToSend.append("contact_phone", formData.contactPhone.trim())
            formDataToSend.append("organization_type", formData.organizationDetails.organizationType)
            formDataToSend.append("registration_number", formData.organizationDetails.registrationNumber)
            
            formDataToSend.append("duration_days", formData.durationDays.toString())

            if (formData.detailedAddress.trim()) {
                formDataToSend.append("detailed_address", formData.detailedAddress.trim())
            }
            if (formData.organizationDetails.taxId.trim()) {
                formDataToSend.append("tax_id", formData.organizationDetails.taxId.trim())
            }

            formData.donationType.forEach(type => {
                formDataToSend.append("donation_types[]", type)
            })

            if (formData.donationType.includes("money") && formData.goalAmount) {
                formDataToSend.append("goal_amount", formData.goalAmount.toString())

                const paymentMethodsData = {
                    bank_account: {
                        bank: formData.bankAccount.bank || formData.bankName || "",
                        account_number: formData.bankAccount.accountNumber || formData.accountNumber || "",
                        account_name: formData.bankAccount.accountName || formData.accountName || ""
                    },
                    promptpay_number: formData.promptpayNumber?.trim() || "",
                    truewallet: ""
                }

                formDataToSend.append("payment_methods", JSON.stringify(paymentMethodsData))
                formDataToSend.append("bank_account[bank]", paymentMethodsData.bank_account.bank)
                formDataToSend.append("bank_account[account_number]", paymentMethodsData.bank_account.account_number)
                formDataToSend.append("bank_account[account_name]", paymentMethodsData.bank_account.account_name)

                // แบบ Flat เผื่อ Backend
                formDataToSend.append("bank_name", paymentMethodsData.bank_account.bank)
                formDataToSend.append("account_number", paymentMethodsData.bank_account.account_number)
                formDataToSend.append("account_name", paymentMethodsData.bank_account.account_name)

                if (formData.promptpayNumber?.trim()) {
                    formDataToSend.append("promptpay_number", formData.promptpayNumber.trim())
                }
            }

            if (formData.donationType.includes("items") && formData.goalItems?.trim()) {
                formDataToSend.append("items_needed", formData.goalItems.trim())
            }

            if (formData.donationType.includes("volunteer") && formData.goalVolunteers) {
                formDataToSend.append("volunteers_needed", formData.goalVolunteers.toString())
                if (formData.volunteerDetails) {
                    formDataToSend.append("volunteer_details", formData.volunteerDetails)
                }
            }

            imageFiles.forEach(file => formDataToSend.append("images[]", file))
            formDataToSend.append("urgency", "MEDIUM")

            await axios.post(`${API_URL}/donation-requests`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
                },
            })

            setSuccess(true)
            setIsSubmitting(false)
            setTimeout(() => router.push("/organizer-dashboard"), 2000)

        } catch (err: any) {
            console.error("เกิดข้อผิดพลาดในการสร้างคำขอ:", err)
            let errorMessage = "เกิดข้อผิดพลาดในการสร้างคำขอ"

            if (err.response?.data?.messages) {
                const errors = err.response.data.messages
                errorMessage = Object.entries(errors)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? (messages as string[]).join(', ') : messages}`)
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
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">✅</span>
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
            <div className="bg-white shadow-sm border-b sticky top-0 z-50">
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

            <div className="max-w-4xl mx-auto p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertDescription className="text-red-700">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
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
                                            onChange={e => handleInputChange("title", e.target.value)}
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
                                            onChange={e => handleInputChange("description", e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">หมวดหมู่ *</Label>
                                            <Select value={formData.category} onValueChange={value => handleInputChange("category", value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(category => (
                                                        <SelectItem key={category.value} value={category.value}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{category.icon}</span>
                                                                <span>{category.label}</span>
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
                                                onValueChange={value => handleInputChange("organizationDetails.organizationType", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกประเภทองค์กร" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {organizationTypes.map(type => (
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

                                    <div className="space-y-2 pt-2 border-t mt-4">
                                        <Label htmlFor="duration" className="flex items-center gap-2 text-blue-800">
                                            <Clock className="w-4 h-4" />
                                            ระยะเวลารับบริจาค *
                                        </Label>
                                        <Select
                                            value={formData.durationDays.toString()}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, durationDays: parseInt(value) }))}
                                        >
                                            <SelectTrigger className="w-full md:w-1/2">
                                                <SelectValue placeholder="เลือกระยะเวลา" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30">30 วัน (1 เดือน)</SelectItem>
                                                <SelectItem value="45">45 วัน (1.5 เดือน)</SelectItem>
                                                <SelectItem value="60">60 วัน (2 เดือน)</SelectItem>
                                                <SelectItem value="90">90 วัน (3 เดือน)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-blue-600">
                                            * ระยะเวลาขั้นต่ำ 30 วัน เพื่อให้ผู้บริจาคมีเวลาเพียงพอในการช่วยเหลือ
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-4">
                                        <Label>รูปภาพประกอบ (สูงสุด 10 รูป) *</Label>
                                        {imageFiles.length === 0 ? (
                                            <label className="flex flex-col items-center justify-center w-full h-96 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                                                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                                                <span className="text-lg font-medium text-gray-700">คลิกเพื่อเพิ่มรูปภาพ</span>
                                                <span className="text-sm text-gray-500 mt-2">รองรับ JPG, PNG, WEBP • สูงสุด 5MB ต่อรูป</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files || [])
                                                        const validFiles = files.filter(file => {
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
                                                        setImageFiles(prev => [...prev, ...validFiles])
                                                    }}
                                                />
                                            </label>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                                                    <div className="space-y-4 relative z-0">
                                                        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 aspect-[4/3]">
                                                            <img
                                                                src={URL.createObjectURL(imageFiles[currentImageIndex])}
                                                                alt="รูปหลัก"
                                                                className="w-full h-96 object-cover"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newFiles = imageFiles.filter((_, i) => i !== currentImageIndex)
                                                                    setImageFiles(newFiles)
                                                                    if (currentImageIndex >= newFiles.length && newFiles.length > 0) {
                                                                        setCurrentImageIndex(newFiles.length - 1)
                                                                    } else if (newFiles.length === 0) {
                                                                        setCurrentImageIndex(0)
                                                                    }
                                                                }}
                                                                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-red-500 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 border border-gray-200"
                                                                title="ลบรูปนี้"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                                            {imageFiles.map((file, index) => (
                                                                <div key={index} className="relative group">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCurrentImageIndex(index)}
                                                                        className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? "border-pink-500 ring-2 ring-pink-200" : "border-gray-300 hover:border-gray-400"}`}
                                                                    >
                                                                        <img src={URL.createObjectURL(file)} alt={`รูปย่อย ${index + 1}`} className="w-full h-full object-cover" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            const newFiles = imageFiles.filter((_, i) => i !== index)
                                                                            setImageFiles(newFiles)
                                                                            if (index === currentImageIndex && newFiles.length > 0) {
                                                                                setCurrentImageIndex(Math.max(0, index - 1))
                                                                            }
                                                                        }}
                                                                        className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full w-8 h-8 flex items-center justify-center shadow-xl hover:bg-gray-100 hover:scale-110 transition-all duration-200 border border-gray-200 opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {imageFiles.length < 10 && (
                                                                <label className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition bg-white">
                                                                    <Upload className="w-8 h-8 text-gray-400" />
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        multiple
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const files = Array.from(e.target.files || [])
                                                                            const validFiles = files.filter(file => {
                                                                                if (file.size > 5 * 1024 * 1024) return false
                                                                                return true
                                                                            })
                                                                            if (imageFiles.length + validFiles.length > 10) return
                                                                            setImageFiles(prev => [...prev, ...validFiles])
                                                                        }}
                                                                    />
                                                                </label>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {/* คุณสามารถเพิ่ม <Card> ส่วนอื่นๆ ต่อจากตรงนี้ตามที่โปรเจกต์คุณมีได้เลยครับ */}
                            
                        </div>
                        
                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4 sticky top-24">
                                <h3 className="font-bold text-gray-800 border-b pb-2">ดำเนินการ</h3>
                                <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" disabled={isSubmitting}>
                                    {isSubmitting ? "กำลังสร้างคำขอ..." : "สร้างคำขอบริจาค"}
                                </Button>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    )
}