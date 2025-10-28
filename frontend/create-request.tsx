"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, MapPin, Phone, CreditCard, Save, Eye, Building, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "./src/app/auth-context"

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
    organizationDetails: {
        organizationType: string
        registrationNumber: string
        taxId: string
    }
    image?: File
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
        organizationDetails: {
            organizationType: "",
            registrationNumber: "",
            taxId: "",
        },
    })

    // Redirect if not organizer
    if (!user || user.role !== "organizer") {
        router.push("/")
        return null
    }

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

        // Validation
        if (!formData.title || !formData.description || !formData.category || formData.donationType.length === 0) {
            setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน")
            setIsSubmitting(false)
            return
        }

        // Validate donation type specific fields
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

        // Validate organization details
        if (!formData.organizationDetails.organizationType || !formData.organizationDetails.registrationNumber) {
            setError("กรุณากรอกข้อมูลองค์กรให้ครบถ้วน")
            setIsSubmitting(false)
            return
        }

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // In a real app, this would save to database
        console.log("Creating donation request:", formData)

        setSuccess(true)
        setIsSubmitting(false)

        // Redirect after success
        setTimeout(() => {
            router.push("/organizer-dashboard")
        }, 2000)
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("th-TH").format(amount)
    }

    const getOrganizationTypeLabel = (type: string) => {
        return organizationTypes.find((t) => t.value === type)?.label || type
    }

    const getCategoryLabel = (category: string) => {
        return categories.find((c) => c.value === category)?.label || category
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
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
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
                                            onChange={(e) => handleInputChange("title", e.target.value)}
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
                                            onChange={(e) => handleInputChange("description", e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-gray-500">อธิบายให้ละเอียดเพื่อให้ผู้บริจาคเข้าใจสถานการณ์</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">หมวดหมู่ *</Label>
                                            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((category) => (
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
                                                onValueChange={(value) => handleInputChange("organizationDetails.organizationType", value)}
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

                                    <div className="space-y-2">
                                        <Label htmlFor="image">รูปภาพประกอบ</Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</p>
                                            <p className="text-xs text-gray-500 mt-1">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Donation Types */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>ประเภทการบริจาคที่ต้องการ *</CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">เลือกประเภทการบริจาคที่ต้องการรับ (เลือกได้หลายประเภท)</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectAllDonationTypes}
                                                className="text-xs bg-transparent"
                                            >
                                                เลือกทั้งหมด
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClearAllDonationTypes}
                                                className="text-xs bg-transparent"
                                            >
                                                ยกเลิกทั้งหมด
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
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

                                    {/* Conditional Fields Based on Donation Type */}
                                    {formData.donationType.includes("money") && (
                                        <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">💰</span>
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
                                                <h4 className="font-semibold text-blue-800">ข้อมูลสิ่งของที่ต้องการ</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="goalItems">รายการสิ่งของที่ต้องการ *</Label>
                                                <Textarea
                                                    id="goalItems"
                                                    placeholder="เช่น หนังสือเรียน 100 เล่ม, เครื่องเขียน 50 ชุด, อุปกรณ์กีฬา (ลูกฟุตบอล 5 ลูก, ตาข่ายวอลเลย์บอล 2 ผืน)"
                                                    rows={4}
                                                    value={formData.goalItems}
                                                    onChange={(e) => handleInputChange("goalItems", e.target.value)}
                                                    required
                                                />
                                                <p className="text-xs text-blue-700">ระบุรายการสิ่งของและจำนวนให้ละเอียด</p>
                                            </div>
                                        </div>
                                    )}

                                    {formData.donationType.includes("volunteer") && (
                                        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">🤝</span>
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
                                                <div className="space-y-2">
                                                    <Label>ระยะเวลาที่ต้องการ</Label>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="เลือกระยะเวลา" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1day">1 วัน</SelectItem>
                                                            <SelectItem value="weekend">สุดสัปดาห์</SelectItem>
                                                            <SelectItem value="1week">1 สัปดาห์</SelectItem>
                                                            <SelectItem value="1month">1 เดือน</SelectItem>
                                                            <SelectItem value="ongoing">ต่อเนื่อง</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="volunteerDetails">รายละเอียดงานที่ต้องการ *</Label>
                                                <Textarea
                                                    id="volunteerDetails"
                                                    placeholder="เช่น ช่วยงานก่อสร้าง (ไม่ต้องมีประสบการณ์), สอนหนังสือให้เด็ก (ต้องมีความรู้พื้นฐาน), ดูแลผู้ป่วย (ต้องมีใจรักการบริการ), ทำความสะอาด"
                                                    rows={4}
                                                    value={formData.volunteerDetails}
                                                    onChange={(e) => handleInputChange("volunteerDetails", e.target.value)}
                                                    required
                                                />
                                                <p className="text-xs text-purple-700">ระบุประเภทงาน ความรู้ที่ต้องการ และเงื่อนไขต่างๆ</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Organization Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building className="w-5 h-5 text-blue-500" />
                                        ข้อมูลองค์กร
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
                                            placeholder="เช่น กรุงเทพมหานคร, จังหวัดเชียงใหม่"
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

                            {/* Bank Account Information - Only show if money donation is selected */}
                            {formData.donationType.includes("money") && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-green-500" />
                                            ข้อมูลบัญชีธนาคาร
                                        </CardTitle>
                                        <p className="text-sm text-gray-600">สำหรับรับเงินบริจาค</p>
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
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Preview Sidebar */}
                        <div className="space-y-6">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-blue-500" />
                                        ตัวอย่าง
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                        <span className="text-gray-400">รูปภาพประกอบ</span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-800 line-clamp-2">{formData.title || "หัวข้อคำขอบริจาค"}</h3>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                                            {formData.description || "รายละเอียดคำขอบริจาค..."}
                                        </p>
                                    </div>

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
                                    </div>

                                    {formData.donationType.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-gray-700">ประเภทการบริจาค:</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {formData.donationType.map((type) => {
                                                    const typeInfo = donationTypes.find((t) => t.value === type)
                                                    return (
                                                        <span
                                                            key={type}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1"
                                                        >
                                                            <span>{typeInfo?.icon}</span>
                                                            <span>{typeInfo?.label}</span>
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {formData.goalAmount && formData.goalAmount > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">เป้าหมาย</span>
                                                <span className="font-semibold">฿{formatAmount(formData.goalAmount)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-pink-500 h-2 rounded-full w-0"></div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.goalItems && (
                                        <div className="space-y-1">
                                            <span className="text-sm font-medium text-gray-700">สิ่งของที่ต้องการ:</span>
                                            <p className="text-xs text-gray-600 line-clamp-2">{formData.goalItems}</p>
                                        </div>
                                    )}

                                    {formData.goalVolunteers && formData.goalVolunteers > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-sm font-medium text-gray-700">อาสาสมัคร:</span>
                                            <p className="text-xs text-gray-600">{formData.goalVolunteers} คน</p>
                                            {formData.volunteerDetails && (
                                                <p className="text-xs text-gray-500 line-clamp-2">{formData.volunteerDetails}</p>
                                            )}
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

                                <Button type="button" variant="outline" className="w-full bg-transparent">
                                    บันทึกร่าง
                                </Button>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">💡 เคล็ดลับ</h4>
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
