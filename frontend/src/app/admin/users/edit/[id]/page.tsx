"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Shield,
    Save,
    X,
    CheckCircle,
    XCircle,
    Building,
    FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"

interface EditUserProps {
    params: {
        id: string
    }
}

// Mock user data
const mockUserDetail = {
    id: 1,
    email: "user@example.com",
    firstName: "สมชาย",
    lastName: "ใจดี",
    phone: "081-234-5678",
    avatar: "https://via.placeholder.com/400x300?text=No+Image",
    joinDate: "2024-01-01",
    totalDonated: 15000,
    donationCount: 8,
    favoriteCategories: ["การแพทย์", "การศึกษา"],
    interests: ["medical-health", "education-learning", "disaster-relief"],
    role: "user",
    organizationName: "",
    organizationType: "",
    isVerified: true,
    isEmailVerified: true,
    documentsVerified: undefined,
    status: "active",
    location: "กรุงเทพมหานคร",
}

const generalInterests = [
    {
        id: "disaster-relief",
        label: "ช่วยเหลือภัยพิบัติ",
        description: "น้ำท่วม แผ่นดินไหว ไฟไหม้ ภัยแล้ง",
        icon: "🌊",
        category: "disaster",
    },
    {
        id: "medical-health",
        label: "การแพทย์และสุขภาพ",
        description: "โรงพยาบาล อุปกรณ์การแพทย์ การรักษา",
        icon: "🏥",
        category: "medical",
    },
    {
        id: "education-learning",
        label: "การศึกษาและการเรียนรู้",
        description: "โรงเรียน มหาวิทยาลัย ทุนการศึกษา",
        icon: "📚",
        category: "education",
    },
    {
        id: "animal-welfare",
        label: "สวัสดิภาพสัตว์",
        description: "สุนัขจรจัด แมวจรจัด สัตว์ป่า",
        icon: "🐕",
        category: "animal",
    },
    {
        id: "environment",
        label: "สิ่งแวดล้อม",
        description: "ปลูกป่า ลดขยะ พลังงานสะอาด",
        icon: "🌱",
        category: "environment",
    },
    {
        id: "elderly-care",
        label: "ดูแลผู้สูงอายุ",
        description: "บ้านพักคนชรา กิจกรรมผู้สูงอายุ",
        icon: "👴",
        category: "elderly",
    },
    {
        id: "children-youth",
        label: "เด็กและเยาวชน",
        description: "สถานเลี้ยงเด็กกำพร้า กิจกรรมเด็ก",
        icon: "👶",
        category: "children",
    },
    {
        id: "disability-support",
        label: "ผู้พิการ",
        description: "ศูนย์ผู้พิการ อุปกรณ์ช่วยเหลือ",
        icon: "♿",
        category: "disability",
    },
    {
        id: "community-development",
        label: "พัฒนาชุมชน",
        description: "โครงการชุมชน สาธารณูปโภค",
        icon: "🏘️",
        category: "community",
    },
    {
        id: "religious-spiritual",
        label: "ศาสนาและจิตวิญญาณ",
        description: "วัด โบสถ์ มัสยิด กิจกรรมศาสนา",
        icon: "🙏",
        category: "religion",
    },
]

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

const roleLabels = {
    user: "ผู้ใช้",
    organizer: "ผู้จัดการ",
    admin: "ผู้ดูแลระบบ",
}

const statusLabels = {
    active: "ใช้งานอยู่",
    suspended: "ระงับการใช้งาน",
    banned: "ถูกแบน",
}

export default function EditUser({ params }: EditUserProps) {
    const router = useRouter()
    const { user: currentUser } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        firstName: mockUserDetail.firstName,
        lastName: mockUserDetail.lastName,
        email: mockUserDetail.email,
        phone: mockUserDetail.phone,
        location: mockUserDetail.location,
        role: mockUserDetail.role,
        organizationName: mockUserDetail.organizationName,
        organizationType: mockUserDetail.organizationType,
        status: mockUserDetail.status,
        isVerified: mockUserDetail.isVerified,
        isEmailVerified: mockUserDetail.isEmailVerified,
        documentsVerified: mockUserDetail.documentsVerified,
        interests: mockUserDetail.interests,
    })

    // Check if current user has permission to edit
    if (!currentUser || currentUser.role !== "admin") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                        <p className="text-gray-600 mb-4">คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลผู้ใช้</p>
                        <Button onClick={() => router.push("/")} className="bg-pink-500 hover:bg-pink-600">
                            กลับหน้าหลัก
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData({
            ...formData,
            [field]: value,
        })
    }

    const handleInterestToggle = (interestId: string) => {
        setFormData({
            ...formData,
            interests: formData.interests.includes(interestId)
                ? formData.interests.filter((id) => id !== interestId)
                : [...formData.interests, interestId],
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน")
            setIsLoading(false)
            return
        }

        if (formData.role === "organizer") {
            if (!formData.organizationName || !formData.organizationType) {
                setError("กรุณากรอกข้อมูลองค์กรให้ครบถ้วน")
                setIsLoading(false)
                return
            }
        }

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000))

        console.log("Updating user:", formData)

        setSuccess(true)
        setIsLoading(false)

        // Redirect after success
        setTimeout(() => {
            router.push(`/admin/users/${params.id}`)
        }, 2000)
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">บันทึกสำเร็จ!</h2>
                        <p className="text-gray-600 mb-4">ข้อมูลผู้ใช้ได้รับการอัปเดตเรียบร้อยแล้ว</p>
                        <p className="text-sm text-gray-500">กำลังนำคุณกลับไปยังหน้ารายละเอียด...</p>
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-pink-50">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                กลับ
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">แก้ไขข้อมูลผู้ใช้</h1>
                                <p className="text-sm text-gray-600">อัปเดตข้อมูลและการตั้งค่าผู้ใช้</p>
                            </div>
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
                        {/* Profile Preview */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle>ตัวอย่าง</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center space-y-4">
                                    <Avatar className="w-24 h-24 mx-auto">
                                        <AvatarImage src={mockUserDetail.avatar || "https://via.placeholder.com/400x300?text=No+Image"} />
                                        <AvatarFallback className="text-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                                            {getInitials(formData.firstName, formData.lastName)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            {formData.firstName} {formData.lastName}
                                        </h3>
                                        <p className="text-gray-600">{formData.email}</p>
                                        <Badge className="mt-2 bg-blue-100 text-blue-700">
                                            {roleLabels[formData.role as keyof typeof roleLabels]}
                                        </Badge>
                                    </div>

                                    {formData.role === "organizer" && formData.organizationName && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2 justify-center">
                                                <Building className="w-4 h-4 text-gray-600" />
                                                <span className="text-sm font-medium text-gray-800">{formData.organizationName}</span>
                                            </div>
                                            {formData.organizationType && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {organizationTypes.find((t) => t.value === formData.organizationType)?.label}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            {formData.isVerified ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className="text-gray-600">ยืนยันตัวตน</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {formData.isEmailVerified ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className="text-gray-600">ยืนยันอีเมล</span>
                                        </div>
                                    </div>

                                    {formData.interests.length > 0 && (
                                        <div className="text-left">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">ความสนใจ</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {formData.interests.slice(0, 3).map((interestId) => {
                                                    const interest = generalInterests.find((i) => i.id === interestId)
                                                    return (
                                                        <Badge key={interestId} variant="secondary" className="text-xs bg-pink-100 text-pink-700">
                                                            {interest?.icon} {interest?.label.split(" ")[0]}
                                                        </Badge>
                                                    )
                                                })}
                                                {formData.interests.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                                        +{formData.interests.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Form Fields */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-pink-500" />
                                        ข้อมูลพื้นฐาน
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">ชื่อ *</Label>
                                            <Input
                                                id="firstName"
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">นามสกุล *</Label>
                                            <Input
                                                id="lastName"
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">อีเมล *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange("email", e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="location">ที่อยู่</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="location"
                                                value={formData.location}
                                                onChange={(e) => handleInputChange("location", e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Role and Organization */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-purple-500" />
                                        บทบาทและองค์กร
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">บทบาท *</Label>
                                        <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">ผู้ใช้</SelectItem>
                                                <SelectItem value="organizer">ผู้จัดการ</SelectItem>
                                                <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.role === "organizer" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="organizationName">ชื่อองค์กร *</Label>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                    <Input
                                                        id="organizationName"
                                                        value={formData.organizationName}
                                                        onChange={(e) => handleInputChange("organizationName", e.target.value)}
                                                        className="pl-10"
                                                        required={formData.role === "organizer"}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="organizationType">ประเภทองค์กร *</Label>
                                                <Select
                                                    value={formData.organizationType}
                                                    onValueChange={(value) => handleInputChange("organizationType", value)}
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
                                        </>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="status">สถานะบัญชี</Label>
                                        <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">ใช้งานอยู่</SelectItem>
                                                <SelectItem value="suspended">ระงับการใช้งาน</SelectItem>
                                                <SelectItem value="banned">ถูกแบน</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Verification Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        สถานะการยืนยัน
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="isVerified"
                                            checked={formData.isVerified}
                                            onCheckedChange={(checked) => handleInputChange("isVerified", checked as boolean)}
                                        />
                                        <Label
                                            htmlFor="isVerified"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            ยืนยันตัวตนแล้ว
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="isEmailVerified"
                                            checked={formData.isEmailVerified}
                                            onCheckedChange={(checked) => handleInputChange("isEmailVerified", checked as boolean)}
                                        />
                                        <Label
                                            htmlFor="isEmailVerified"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            ยืนยันอีเมลแล้ว
                                        </Label>
                                    </div>

                                    {formData.role === "organizer" && (
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="documentsVerified"
                                                checked={formData.documentsVerified || false}
                                                onCheckedChange={(checked) => handleInputChange("documentsVerified", checked as boolean)}
                                            />
                                            <Label
                                                htmlFor="documentsVerified"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                ยืนยันเอกสารแล้ว
                                            </Label>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Interests */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-orange-500" />
                                        ความสนใจ
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-3 max-h-64 overflow-y-auto">
                                        {generalInterests.map((interest) => (
                                            <div
                                                key={interest.id}
                                                className={`border rounded-lg p-3 cursor-pointer transition-all ${formData.interests.includes(interest.id)
                                                        ? "border-pink-300 bg-pink-50"
                                                        : "border-gray-200 hover:border-pink-200"
                                                    }`}
                                                onClick={() => handleInterestToggle(interest.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        checked={formData.interests.includes(interest.id)}
                                                        onChange={() => handleInterestToggle(interest.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-lg">{interest.icon}</span>
                                                            <h5 className="font-medium text-gray-800">{interest.label}</h5>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{interest.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            💡 <strong>เลือกแล้ว {formData.interests.length} หมวดหมู่</strong>
                                            {formData.interests.length > 0 && " - ความสนใจจะช่วยในการแนะนำการบริจาค"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            บันทึกการเปลี่ยนแปลง
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="bg-transparent"
                                    disabled={isLoading}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    ยกเลิก
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
