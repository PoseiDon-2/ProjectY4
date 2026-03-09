"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { ArrowLeft, Upload, MapPin, Phone, CreditCard, Save, Eye, Building, CheckCircle2, Circle } from "lucide-react"
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
    durationDays: number // [NEW] เพิ่มฟิลด์ระยะเวลา
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


    // รีเซ็ต currentImageIndex เมื่อ imageFiles เปลี่ยน

    useEffect(() => {
        if (imageFiles.length === 0) {
            setCurrentImageIndex(0)
        } else if (currentImageIndex >= imageFiles.length) {
            setCurrentImageIndex(imageFiles.length - 1)
        }
    }, [imageFiles])

    // โหลดข้อมูลองค์กรและบัญชีธนาคารจาก localStorage
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

    // บันทึกข้อมูลองค์กรอัตโนมัติ
    useEffect(() => {
        if (formData.organizationDetails.organizationType && formData.organizationDetails.registrationNumber) {
            localStorage.setItem("savedOrganizationDetails", JSON.stringify(formData.organizationDetails))
        }
    }, [formData.organizationDetails])

    // บันทึกข้อมูลบัญชีธนาคารอัตโนมัติ
    useEffect(() => {
        if (formData.bankAccount.bank && formData.bankAccount.accountNumber && formData.bankAccount.accountName) {
            localStorage.setItem("savedBankAccount", JSON.stringify(formData.bankAccount))
        }
    }, [formData.bankAccount])

    // ตรวจสอบสิทธิ์
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
            setFormData({
                ...formData,
                bankAccount: {
                    ...formData.bankAccount,
                    [bankField]: value,
                },
            })
        } else if (field.startsWith("organizationDetails.")) {
            const orgField = field.split(".")[1]
            setFormData({
                ...formData,
                organizationDetails: {
                    ...formData.organizationDetails,
                    [orgField]: value,
                },
            })
        } else {
            setFormData({
                ...formData,
                [field]: value,
            })

    // ... (Helpers เดิม) ...
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
        const newTypes = formData.donationType.includes(type)
            ? formData.donationType.filter((t) => t !== type)
            : [...formData.donationType, type]

        setFormData({
            ...formData,
            donationType: newTypes,
        })
    }

    const handleSelectAllDonationTypes = () => {
        const allTypes = donationTypes.map((type) => type.value)
        setFormData({
            ...formData,
            donationType: allTypes,
        })
    }

    const handleClearAllDonationTypes = () => {
        setFormData({
            ...formData,
            donationType: [],
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        // Validation พื้นฐานรวมรูปภาพ
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

        // [NEW] Validate Duration
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

            formDataToSend.append("title", formData.title)
            formDataToSend.append("description", formData.description)
            formDataToSend.append("category_id", formData.category)
            formDataToSend.append("location", formData.location)
            formDataToSend.append("contact_phone", formData.contactPhone)
            // ข้อมูลพื้นฐาน
            formDataToSend.append("title", formData.title.trim())
            formDataToSend.append("description", formData.description.trim())

            // แปลง category จาก string value เป็น ID
            const categoryObj = categories.find(cat => cat.value === formData.category)
            formDataToSend.append("category_id", categoryObj ? categoryObj.value : formData.category)

            formDataToSend.append("location", formData.location.trim())
            formDataToSend.append("contact_phone", formData.contactPhone.trim())
            formDataToSend.append("organization_type", formData.organizationDetails.organizationType)
            formDataToSend.append("registration_number", formData.organizationDetails.registrationNumber)

            if (formData.detailedAddress.trim()) formDataToSend.append("detailed_address", formData.detailedAddress)
            if (formData.organizationDetails.taxId.trim()) formDataToSend.append("tax_id", formData.organizationDetails.taxId)
            // [NEW] ส่งค่า Duration ไปยัง Backend
            formDataToSend.append("duration_days", formData.durationDays.toString())

            // [NEW] ส่งค่า Duration ไปยัง Backend
            formDataToSend.append("duration_days", formData.durationDays.toString())

            // [NEW] ส่งค่า Duration ไปยัง Backend
            formDataToSend.append("duration_days", formData.durationDays.toString())

            if (formData.detailedAddress.trim()) {
                formDataToSend.append("detailed_address", formData.detailedAddress.trim())
            }
            if (formData.organizationDetails.taxId.trim()) {
                formDataToSend.append("tax_id", formData.organizationDetails.taxId.trim())
            }

            // Send donation_types as array notation (Laravel expects this for FormData arrays)
            formData.donationType.forEach(type => {
                formDataToSend.append("donation_types[]", type)
            })

            if (formData.donationType.includes("money")) {
                formDataToSend.append("goal_amount", formData.goalAmount!.toString())

                // Bank account fields (Laravel expects nested fields in FormData)
                if (formData.bankAccount.bank && formData.bankAccount.accountNumber && formData.bankAccount.accountName) {
                    formDataToSend.append("bank_account[bank]", formData.bankAccount.bank)
                    formDataToSend.append("bank_account[account_number]", formData.bankAccount.accountNumber)
                    formDataToSend.append("bank_account[account_name]", formData.bankAccount.accountName)

                    // ส่งแบบ flat เผื่อ backend validate ที่ root
                    formDataToSend.append("bank_name", formData.bankAccount.bank)
                    formDataToSend.append("account_number", formData.bankAccount.accountNumber)
                    formDataToSend.append("account_name", formData.bankAccount.accountName)

                    // ส่งผ่าน payment_methods ด้วย เผื่อ backend validate ผ่านคีย์นี้
                    const paymentMethodsData = {
                        bank_account: {
                            bank: formData.bankAccount.bank,
                            account_number: formData.bankAccount.accountNumber,
                            account_name: formData.bankAccount.accountName,
                        },
                        promptpay_number: formData.promptpayNumber?.trim() || "",
                        truewallet: "",
                    }
                    formDataToSend.append("payment_methods", JSON.stringify(paymentMethodsData))
                    formDataToSend.append("payment_methods[bank_account][bank]", formData.bankAccount.bank)
                    formDataToSend.append("payment_methods[bank_account][account_number]", formData.bankAccount.accountNumber)
                    formDataToSend.append("payment_methods[bank_account][account_name]", formData.bankAccount.accountName)
                    if (paymentMethodsData.promptpay_number) {
                        formDataToSend.append("payment_methods[promptpay_number]", paymentMethodsData.promptpay_number)
                    }
                }

                // PromptPay (optional) - เลขพร้อมเพย์เท่านั้น, ไม่ต้องอัปโหลด QR
                if (formData.promptpayNumber && formData.promptpayNumber.trim()) {
                    formDataToSend.append("promptpay_number", formData.promptpayNumber)
                }
            }

            if (formData.donationType.includes("items") && formData.goalItems) {
                formDataToSend.append("items_needed", formData.goalItems)
            // เงินบริจาค
            if (formData.donationType.includes("money") && formData.goalAmount) {
                formDataToSend.append("goal_amount", formData.goalAmount.toString());

                // สร้าง payment_methods object
                const paymentMethodsData = {
                    bank_account: {
                        bank: formData.bankName || "",
                        account_number: formData.accountNumber || "",
                        account_name: formData.accountName || user?.organizationName || `${user?.firstName} ${user?.lastName}`
                    },
                    promptpay_number: formData.promptpayNumber || "",
                    truewallet: ""
                };

                formDataToSend.append("payment_methods", JSON.stringify(paymentMethodsData));
                formDataToSend.append("bank_account[bank]", paymentMethodsData.bank_account.bank);
                formDataToSend.append("bank_account[account_number]", paymentMethodsData.bank_account.account_number);
                formDataToSend.append("bank_account[account_name]", paymentMethodsData.bank_account.account_name);

                if (formData.promptpayNumber?.trim()) {
                    formDataToSend.append("promptpay_number", formData.promptpayNumber.trim());
                }
            }

            if (formData.donationType.includes("items") && formData.goalItems?.trim()) {
                formDataToSend.append("items_needed", formData.goalItems.trim())
            }

            if (formData.donationType.includes("volunteer")) {
                formDataToSend.append("volunteers_needed", formData.goalVolunteers!.toString())
                if (formData.volunteerDetails) formDataToSend.append("volunteer_details", formData.volunteerDetails)
            }


            // เพิ่มรูปภาพหลายไฟล์
            imageFiles.forEach(file => formDataToSend.append("images[]", file))

            formDataToSend.append("urgency", "MEDIUM")

            imageFiles.forEach((file, index) => {
                formDataToSend.append(`images[${index}]`, file)
            })

            // ... (Axios Call เดิม) ...

            const response = await axios.post(`${API_URL}/donation-requests`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
                },
            })

            setSuccess(true)
            setIsSubmitting(false)
            setTimeout(() => router.push("/organizer-dashboard"), 2000)

        } catch (err: any) {
            console.error("Full error response:", JSON.stringify(err.response?.data, null, 2))
            console.error("Status:", err.response?.status)
            console.error("Full axios error:", err)
            
            // ลองแสดง error message หลายรูปแบบ
            const errorMsg = 
                err.response?.data?.message || 
                err.response?.data?.error || 
                err.response?.data?.errors?.join(", ") ||
                "เกิดข้อผิดพลาดในการสร้างคำขอ"
            
            setError(errorMsg)

        } catch (err: any) {


        } catch (err: any) {

        } catch (err: any) {

            // ... (Error handling เดิม) ...
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

    const formatAmount = (amount: number) => new Intl.NumberFormat("th-TH").format(amount)

    const getOrganizationTypeLabel = (type: string) =>
        organizationTypes.find(t => t.value === type)?.label || type

    const getCategoryLabel = (category: string) =>
        categories.find(c => c.value === category)?.label || category

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

            <div className="bg-white shadow-sm border-b">

            {/* ... (Header เดิม) ... */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-50">

            {/* ... (Header เดิม) ... */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-50">

            {/* ... (Header เดิม) ... */}
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
                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
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
                                        <p className="text-xs text-gray-500">อธิบายให้ละเอียดเพื่อให้ผู้บริจาคเข้าใจสถานการณ์</p>
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

                                    {/* รูปภาพประกอบ - เวอร์ชันใหม่ */}
                                    <div className="space-y-4">
                                        <Label>รูปภาพประกอบ (สูงสุด 10 รูป) *</Label>

                                        {imageFiles.length === 0 ? (
                                    {/* [NEW] UI สำหรับเลือกระยะเวลารับบริจาค */}
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
                                            * ระยะเวลาขั้นต่ำ 30 วัน เพื่อให้ผู้บริจาคมีเวลาเพียงพอในการช่วยเหลือ (คุณสามารถต่ออายุโครงการได้ภายหลัง)
                                        </p>
                                    </div>

                                    {/* [NEW] UI สำหรับเลือกระยะเวลารับบริจาค */}
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
                                            * ระยะเวลาขั้นต่ำ 30 วัน เพื่อให้ผู้บริจาคมีเวลาเพียงพอในการช่วยเหลือ (คุณสามารถต่ออายุโครงการได้ภายหลัง)
                                        </p>
                                    </div>

                                    {/* [NEW] UI สำหรับเลือกระยะเวลารับบริจาค */}
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
                                            * ระยะเวลาขั้นต่ำ 30 วัน เพื่อให้ผู้บริจาคมีเวลาเพียงพอในการช่วยเหลือ (คุณสามารถต่ออายุโครงการได้ภายหลัง)
                                        </p>
                                    </div>

                                    {/* ... (รูปภาพเหมือนเดิม) ... */}
                                    <div className="space-y-4 mt-4">
                                        <Label>รูปภาพประกอบ (สูงสุด 10 รูป) *</Label>
                                        {/* ... (Code Upload Image เหมือนเดิม) ... */}
                                        {imagePreviews.length === 0 ? (
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
                                                {/* รูปหลัก - ปุ่มลบสวย ๆ แบบใหม่ */}
                                                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">

                                            <div className="space-y-4 relative z-0">
                                                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 aspect-[4/3]">
                                                    <img
                                                        src={URL.createObjectURL(imageFiles[currentImageIndex])}
                                                        alt="รูปหลัก"
                                                        className="w-full h-96 object-cover"
                                                    />
                                                    {/* ปุ่มลบ - ดีไซน์ใหม่ สวย นุ่มนวล */}
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
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Thumbnail - ขนาดเท่ากันหมด */}
                                                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                                    {imageFiles.map((file, index) => (
                                                        <div key={index} className="relative group">
                                                            <button
                                                                type="button"
                                                                onClick={() => setCurrentImageIndex(index)}
                                                                className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-3 transition-all shadow-md ${index === currentImageIndex
                                                                        ? 'border-pink-500 ring-4 ring-pink-200'
                                                                        : 'border-gray-300 hover:border-gray-400'
                                                                className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                                                    ? "border-pink-500 ring-2 ring-pink-200"
                                                                    : "border-gray-300 hover:border-gray-400"
                                                                    }`}
                                                            >
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={`รูปย่อย ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </button>

                                                            {/* ปุ่มลบ thumbnail - สวย นุ่มนวล */}
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
                                                                title="ลบรูปนี้"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* ปุ่มเพิ่มรูป */}
                                                    {imageFiles.length < 10 && (
                                                        <label className="flex-shrink-0 w-24 h-24 border-3 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition bg-white">
                                                            <Upload className="w-10 h-10 text-gray-400" />
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
                                                    )}
                                                </div>

                                                <p className="text-sm text-gray-600">
                                                    อัปโหลดแล้ว {imageFiles.length}/10 รูป
                                                    {imageFiles.length > 0 && <span className="text-green-600 ml-2">✓ พร้อมใช้งาน</span>}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Donation Types */}
                            {/* ... (Card ประเภทการบริจาค เหมือนเดิม) ... */}

                            {/* ... (Card ประเภทการบริจาค เหมือนเดิม) ... */}

                            {/* ... (Card ประเภทการบริจาค เหมือนเดิม) ... */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>ประเภทการบริจาคที่ต้องการ *</CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">เลือกประเภทการบริจาคที่ต้องการรับ (เลือกได้หลายประเภท)</p>
                                        </div>
                                        {/* ... (ปุ่มเลือกทั้งหมด/ยกเลิก) ... */}
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={handleSelectAllDonationTypes}>
                                                เลือกทั้งหมด
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={handleClearAllDonationTypes}>
                                                ยกเลิกทั้งหมด
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">

                                {/* ... (Content ประเภทการบริจาค + ข้อมูลธนาคาร + สิ่งของ + อาสา เหมือนเดิมทุกประการ) ... */}
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
                                                        <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {type.examples.map((example, index) => (
                                                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                    {example}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {formData.donationType.includes("money") && (
                                        <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">💰</span>
                                        <div className="p-5 bg-green-50 rounded-xl border border-green-200 space-y-4">
                                            {/* ... (Form เงิน เหมือนเดิม) ... */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">💰</span>
                                                <h4 className="font-semibold text-green-800">ข้อมูลการรับเงินบริจาค</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="goalAmount">เป้าหมายเงิน (บาท) *</Label>
                                                <Input
                                                    id="goalAmount"
                                                    type="number"
                                                    placeholder="50000"
                                                    min="1000"
                                                    value={formData.goalAmount || ""}
                                                    onChange={(e) => handleInputChange("goalAmount", Number.parseInt(e.target.value) || 0)}
                                                    required
                                                />
                                                <p className="text-xs text-green-700">จำนวนเงินขั้นต่ำ 1,000 บาท</p>
                                            </div>
                                        </div>
                                    )}

                                    {formData.donationType.includes("items") && (
                                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">📦</span>
                                        <div className="p-5 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
                                            {/* ... (Form สิ่งของ เหมือนเดิม) ... */}
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
                                                    onChange={(e) => handleInputChange("goalItems", e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.donationType.includes("volunteer") && (
                                        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">🤝</span>
                                        <div className="p-5 bg-purple-50 rounded-xl border border-purple-200 space-y-4">
                                            {/* ... (Form อาสา เหมือนเดิม) ... */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">🤝</span>
                                                <h4 className="font-semibold text-purple-800">ข้อมูลอาสาสมัครที่ต้องการ</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="goalVolunteers">จำนวนอาสาสมัคร (คน) *</Label>
                                                    <Input
                                                        id="goalVolunteers"
                                                        type="number"
                                                        placeholder="10"
                                                        min="1"
                                                        value={formData.goalVolunteers || ""}
                                                        onChange={(e) => handleInputChange("goalVolunteers", Number.parseInt(e.target.value) || 0)}
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
                                                    onChange={(e) => handleInputChange("volunteerDetails", e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>


                            {/* Organization Details */}
                            {/* ข้อมูลองค์กร (Card เดิม) */}

                            {/* ข้อมูลองค์กร (Card เดิม) */}

                            {/* ข้อมูลองค์กร (Card เดิม) */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building className="w-5 h-5 text-blue-500" />
                                        ข้อมูลองค์กร (บันทึกอัตโนมัติ)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="registrationNumber">เลขทะเบียนองค์กร *</Label>
                                            <Input
                                                id="registrationNumber"
                                                placeholder="เช่น 0123456789012"
                                                value={formData.organizationDetails.registrationNumber}
                                                onChange={(e) => handleInputChange("organizationDetails.registrationNumber", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
                                            <Input
                                                id="taxId"
                                                placeholder="เช่น 0123456789012"
                                                value={formData.organizationDetails.taxId}
                                                onChange={(e) => handleInputChange("organizationDetails.taxId", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>


                            {/* Location Information */}

                            {/* ที่ตั้ง & ติดต่อ (Card เดิม) */}

                            {/* ที่ตั้ง & ติดต่อ (Card เดิม) */}

                            {/* ที่ตั้ง & ติดต่อ (Card เดิม) */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-pink-500" />
                                        ข้อมูลที่ตั้ง
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location">จังหวัด/พื้นที่ *</Label>
                                        <Input
                                            id="location"
                                            placeholder="เช่น กรุงเทพมหานคร"
                                            value={formData.location}
                                            onChange={(e) => handleInputChange("location", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="detailedAddress">ที่อยู่ละเอียด</Label>
                                        <Textarea
                                            id="detailedAddress"
                                            placeholder="ที่อยู่เต็ม รวมรหัสไปรษณีย์"
                                            rows={3}
                                            value={formData.detailedAddress}
                                            onChange={(e) => handleInputChange("detailedAddress", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">เบอร์โทรติดต่อ *</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="contactPhone"
                                                type="tel"
                                                placeholder="081-234-5678"
                                                className="pl-10"
                                                value={formData.contactPhone}
                                                onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bank Account */}
                            {formData.donationType.includes("money") && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-green-500" />
                                            ข้อมูลบัญชีธนาคาร (บันทึกอัตโนมัติ)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bank">ธนาคาร *</Label>
                                            <Select
                                                value={formData.bankAccount.bank}
                                                onValueChange={(value) => handleInputChange("bankAccount.bank", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกธนาคาร" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</SelectItem>
                                                    <SelectItem value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</SelectItem>
                                                    <SelectItem value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</SelectItem>
                                                    <SelectItem value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</SelectItem>
                                                    <SelectItem value="ธนาคารทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="accountNumber">เลขที่บัญชี *</Label>
                                            <Input
                                                id="accountNumber"
                                                placeholder="123-4-56789-0"
                                                value={formData.bankAccount.accountNumber}
                                                onChange={(e) => handleInputChange("bankAccount.accountNumber", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="accountName">ชื่อบัญชี *</Label>
                                            <Input
                                                id="accountName"
                                                placeholder="นายสมชาย ใจดี"
                                                value={formData.bankAccount.accountName}
                                                onChange={(e) => handleInputChange("bankAccount.accountName", e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* PromptPay */}
                                        <div className="border-t pt-4 mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">พร้อมเพย์ (PromptPay)</h4>
                                            <div className="space-y-2">
                                                <Label htmlFor="promptpayNumber">หมายเลขพร้อมเพย์</Label>
                                                <Input
                                                    id="promptpayNumber"
                                                    placeholder="เบอร์โทรศัพท์หรือเลขบัตรประชาชน"
                                                    value={formData.promptpayNumber}
                                                    onChange={(e) => handleInputChange("promptpayNumber", e.target.value)}
                                                />
                                                <p className="text-xs text-gray-500">เบอร์โทรศัพท์หรือเลขบัตรประชาชน 13 หลัก</p>
                                            </div>

                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <p className="text-xs text-blue-800">
                                                    💡 <strong>QR Code จะถูกสร้างอัตโนมัติ</strong>
                                                    <br />
                                                    เมื่อผู้บริจาคเลือกชำระผ่าน QR Code พร้อมเพย์ ระบบจะสร้าง QR Code จากเลขที่คุณกรอกโดยอัตโนมัติ
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-blue-500" />
                                        ตัวอย่าง
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">

                                    {imageFiles.length > 0 ? (
                                        <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200">

                                    {/* ... (Preview Content เดิม) ... */}
                                    {imagePreviews.length > 0 ? (
                                        <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">

                                            <img
                                                src={URL.createObjectURL(imageFiles[0])}
                                                alt="รูปตัวอย่าง"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                            <span className="text-gray-400">ยังไม่มีรูปภาพ</span>
                                        </div>
                                    )}
                                    <h3 className="font-bold text-gray-800 line-clamp-2">{formData.title || "หัวข้อคำขอบริจาค"}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-3">{formData.description || "รายละเอียดคำขอบริจาค..."}</p>

                                    <div className="flex flex-wrap gap-2">
                                        {formData.category && (
                                            <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                                                {getCategoryLabel(formData.category)}
                                            </span>
                                        )}
                                        {formData.organizationDetails.organizationType && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                {getOrganizationTypeLabel(formData.organizationDetails.organizationType)}
                                            </span>
                                        )}
                                        {/* [NEW] Preview ระยะเวลา */}
                                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formData.durationDays} วัน
                                        </span>
                                    </div>

                                    {/* ... (ที่เหลือเหมือนเดิม) ... */}
                                    {formData.donationType.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {formData.donationType.map((type) => {
                                                const info = donationTypes.find(t => t.value === type)
                                                return (
                                                    <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                                                        <span>{info?.icon}</span>
                                                        <span>{info?.label}</span>
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {formData.goalAmount && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">เป้าหมาย</span>
                                            <span className="font-semibold">฿{formatAmount(formData.goalAmount)}</span>
                                        </div>
                                    )}

                                    {formData.location && (
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <MapPin className="w-3 h-3" />
                                            <span>{formData.location}</span>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500">
                                        <p>ผู้จัดการ: {user?.organizationName || `${user?.firstName} ${user?.lastName}`}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            กำลังสร้างคำขอ...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            สร้างคำขอบริจาค
                                        </>
                                    )}
                                </Button>
                                <Button type="button" variant="outline" className="w-full">
                                    บันทึกร่าง
                                </Button>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">เคล็ดลับ</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• เขียนหัวข้อที่ชัดเจนและน่าสนใจ</li>
                                    <li>• อธิบายสถานการณ์อย่างละเอียด</li>
                                    <li>• ใส่รูปภาพที่เกี่ยวข้อง</li>
                                    <li>• เลือกประเภทการบริจาคที่เหมาะสม</li>
                                    <li>• ระบุรายละเอียดที่ต้องการให้ชัดเจน</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}