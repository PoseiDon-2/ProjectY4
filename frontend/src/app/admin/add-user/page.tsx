"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Phone, Save, X, Shield, Building, AlertTriangle, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "../../auth-context"

// Updated organization types
const organizationTypes = [
    { id: "school", label: "สถานศึกษา" },
    { id: "hospital", label: "สถานพยาบาล" },
    { id: "foundation", label: "มูลนิธิ/องค์กรการกุศล" },
    { id: "ngo", label: "องค์กรพัฒนาเอกชน" },
    { id: "government", label: "หน่วยงานราชการ" },
    { id: "community", label: "องค์กรชุมชน" },
    { id: "religious", label: "สถานศาสนา" },
    { id: "sports", label: "สโมสรกีฬา" },
    { id: "arts", label: "องค์กรศิลปะ" },
    { id: "other", label: "อื่นๆ" },
]

// Updated general categories for interests
const generalCategories = [
    { id: "education", label: "การศึกษา" },
    { id: "healthcare", label: "สาธารณสุข" },
    { id: "social-welfare", label: "สวัสดิการสังคม" },
    { id: "environment", label: "สิ่งแวดล้อม" },
    { id: "disaster-relief", label: "การช่วยเหลือภัยพิบัติ" },
    { id: "animal-welfare", label: "สวัสดิการสัตว์" },
    { id: "arts-culture", label: "ศิลปะและวัฒนธรรม" },
    { id: "technology", label: "เทคโนโลยีและนวัตกรรม" },
    { id: "sports", label: "กีฬาและนันทนาการ" },
    { id: "community", label: "พัฒนาชุมชน" },
]

interface AddUserData {
    email: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    phone: string
    role: "user" | "organizer" | "admin"
    organizationName?: string
    organizationType?: string
    organizationId?: string
    interests: string[]
    isVerified: boolean
    documentsVerified?: boolean
}

export default function AddUserPage() {
    const router = useRouter()
    const { user: currentUser } = useAuth()
    const [formData, setFormData] = useState<AddUserData>({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "user",
        organizationName: "",
        organizationType: "",
        organizationId: "",
        interests: [],
        isVerified: true,
        documentsVerified: undefined,
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Redirect if not admin
    if (!currentUser || currentUser.role !== "admin") {
        router.push("/")
        return null
    }

    const handleInputChange = (name: string, value: string | boolean) => {
        setFormData({
            ...formData,
            [name]: value,
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
        setSuccess("")
        setSaving(true)

        // Enhanced validation
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.phone) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน")
            setSaving(false)
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน")
            setSaving(false)
            return
        }

        if (formData.password.length < 6) {
            setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
            setSaving(false)
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setError("รูปแบบอีเมลไม่ถูกต้อง")
            setSaving(false)
            return
        }

        const phoneRegex = /^[0-9-]+$/
        if (!phoneRegex.test(formData.phone)) {
            setError("เบอร์โทรศัพท์ไม่ถูกต้อง")
            setSaving(false)
            return
        }

        if (formData.role === "organizer") {
            if (!formData.organizationName || !formData.organizationType) {
                setError("กรุณากรอกข้อมูลองค์กรให้ครบถ้วน")
                setSaving(false)
                return
            }
        }

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // In real app, this would call API to create user
            console.log("Creating user:", formData)

            setSuccess("สร้างผู้ใช้ใหม่เรียบร้อยแล้ว")

            // Reset form after success
            setTimeout(() => {
                setFormData({
                    email: "",
                    password: "",
                    confirmPassword: "",
                    firstName: "",
                    lastName: "",
                    phone: "",
                    role: "user",
                    organizationName: "",
                    organizationType: "",
                    organizationId: "",
                    interests: [],
                    isVerified: true,
                    documentsVerified: undefined,
                })
                setSuccess("")
            }, 3000)
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการสร้างผู้ใช้")
        }

        setSaving(false)
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
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <UserPlus className="w-6 h-6 text-purple-500" />
                                    เพิ่มผู้ใช้ใหม่
                                </h1>
                                <p className="text-sm text-gray-600">สร้างบัญชีผู้ใช้ใหม่โดยผู้ดูแลระบบ</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            ข้อมูลผู้ใช้ใหม่
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertTriangle className="w-4 h-4" />
                                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                                </Alert>
                            )}

                            {success && (
                                <Alert className="border-green-200 bg-green-50">
                                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                                </Alert>
                            )}

                            {/* Basic Information */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-gray-700">
                                        ชื่อ *
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            id="firstName"
                                            type="text"
                                            placeholder="ชื่อ"
                                            value={formData.firstName}
                                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-gray-700">
                                        นามสกุล *
                                    </Label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="นามสกุล"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700">
                                        อีเมล *
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="อีเมล"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-gray-700">
                                        เบอร์โทรศัพท์ *
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="081-234-5678"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange("phone", e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-700">
                                        รหัสผ่าน *
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-gray-700">
                                        ยืนยันรหัสผ่าน *
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="ยืนยันรหัสผ่าน"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-gray-700">
                                    บทบาท *
                                </Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value: "user" | "organizer" | "admin") => handleInputChange("role", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกบทบาท" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">ผู้ใช้ทั่วไป</SelectItem>
                                        <SelectItem value="organizer">ผู้แทนองค์กร</SelectItem>
                                        <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Organization Information (for organizers) */}
                            {formData.role === "organizer" && (
                                <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                                    <h4 className="font-medium text-green-800 flex items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        ข้อมูลองค์กร
                                    </h4>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="organizationName" className="text-gray-700">
                                                ชื่อองค์กร *
                                            </Label>
                                            <Input
                                                id="organizationName"
                                                type="text"
                                                placeholder="เช่น โรงเรียนบ้านดอนตาล"
                                                value={formData.organizationName || ""}
                                                onChange={(e) => handleInputChange("organizationName", e.target.value)}
                                                required={formData.role === "organizer"}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="organizationType" className="text-gray-700">
                                                ประเภทองค์กร *
                                            </Label>
                                            <Select
                                                value={formData.organizationType || ""}
                                                onValueChange={(value) => handleInputChange("organizationType", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกประเภทองค์กร" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {organizationTypes.map((type) => (
                                                        <SelectItem key={type.id} value={type.id}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="organizationId" className="text-gray-700">
                                            เลขที่องค์กร/หน่วยงาน
                                        </Label>
                                        <Input
                                            id="organizationId"
                                            type="text"
                                            placeholder="เช่น เลขที่จดทะเบียน, รหัสสถานศึกษา"
                                            value={formData.organizationId || ""}
                                            onChange={(e) => handleInputChange("organizationId", e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="documentsVerified"
                                            checked={formData.documentsVerified || false}
                                            onChange={(e) => handleInputChange("documentsVerified", e.target.checked)}
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="documentsVerified" className="text-sm text-gray-700">
                                            ยืนยันเอกสารแล้ว
                                        </Label>
                                    </div>
                                </div>
                            )}

                            {/* Interests (for regular users) */}
                            {formData.role === "user" && (
                                <div className="space-y-4 p-4 bg-pink-50 rounded-lg">
                                    <h4 className="font-medium text-pink-800">ความสนใจ</h4>
                                    <p className="text-sm text-pink-700">เลือกหมวดหมู่ที่ผู้ใช้สนใจ</p>

                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                        {generalCategories.map((category) => (
                                            <div key={category.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`interest-${category.id}`}
                                                    checked={formData.interests.includes(category.id)}
                                                    onChange={() => handleInterestToggle(category.id)}
                                                    className="rounded border-gray-300"
                                                />
                                                <Label htmlFor={`interest-${category.id}`} className="text-sm text-gray-700">
                                                    {category.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Verification Status */}
                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-800 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    สถานะการยืนยัน
                                </h4>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="isVerified"
                                        checked={formData.isVerified}
                                        onChange={(e) => handleInputChange("isVerified", e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="isVerified" className="text-sm text-gray-700">
                                        ยืนยันตัวตนแล้ว
                                    </Label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-6">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            กำลังสร้าง...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            สร้างผู้ใช้ใหม่
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={saving}
                                    className="flex-1"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    ยกเลิก
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
