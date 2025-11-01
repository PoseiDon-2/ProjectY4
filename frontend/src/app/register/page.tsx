"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Upload, FileText, CheckCircle, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"

type RegistrationStep = "info" | "interests" | "documents" | "otp" | "success"

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
    {
        id: "arts-culture",
        label: "ศิลปะและวัฒนธรรม",
        description: "การแสดง ดนตรี ศิลปกรรม",
        icon: "🎨",
        category: "arts",
    },
    {
        id: "sports-recreation",
        label: "กีฬาและนันทนาการ",
        description: "อุปกรณ์กีฬา สนามเด็กเล่น",
        icon: "⚽",
        category: "sports",
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

export default function Register() {
    const router = useRouter()
    const { register, sendOTP, verifyOTP, isLoading } = useAuth()
    const [currentStep, setCurrentStep] = useState<RegistrationStep>("info")
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "user" as "user" | "organizer",
        organizationName: "",
        organizationType: "",
        interests: [] as string[],
        documents: {
            idCard: null as File | null,
            organizationCert: null as File | null,
        },
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [otpSent, setOtpSent] = useState(false)

    const getStepProgress = () => {
        const userSteps = ["info", "interests", "otp", "success"]
        const organizerSteps = ["info", "documents", "otp", "success"]
        const steps = formData.role === "organizer" ? organizerSteps : userSteps
        return ((steps.indexOf(currentStep) + 1) / steps.length) * 100
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Form submitted, step:", currentStep)
        setError("")

        if (currentStep === "info") {
            // Validation for basic info
            if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.phone) {
                setError("กรุณากรอกข้อมูลให้ครบถ้วน")
                return
            }

            if (formData.password !== formData.confirmPassword) {
                setError("รหัสผ่านไม่ตรงกัน")
                return
            }

            if (formData.password.length < 6) {
                setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
                return
            }

            const phoneRegex = /^[0-9-]+$/
            if (!phoneRegex.test(formData.phone)) {
                setError("เบอร์โทรศัพท์ไม่ถูกต้อง")
                return
            }

            if (formData.role === "organizer") {
                if (!formData.organizationName || !formData.organizationType) {
                    setError("กรุณากรอกข้อมูลองค์กรให้ครบถ้วน")
                    return
                }
                setCurrentStep("documents")
            } else {
                // For regular users, go to interests selection
                setCurrentStep("interests")
            }
        } else if (currentStep === "interests") {
            // Validation for interests (optional, but at least show a message if none selected)
            if (formData.interests.length === 0) {
                setError("แนะนำให้เลือกความสนใจอย่างน้อย 1 หมวดหมู่ เพื่อให้เราแนะนำการบริจาคที่เหมาะสมกับคุณ")
                // Don't return, allow to proceed even without interests
            }
            await handleSendOTP()
        } else if (currentStep === "documents") {
            // Validation for documents
            if (!formData.documents.idCard || !formData.documents.organizationCert) {
                setError("กรุณาแนบเอกสารให้ครบถ้วน")
                return
            }
            await handleSendOTP()
        } else if (currentStep === "otp") {
            await handleVerifyOTP()
        }
    }

    const handleSendOTP = async () => {
        console.log("handleSendOTP ถูกเรียก")
        try {
            const success = await sendOTP(formData.email)
            if (success) {
                setOtpSent(true)
                setCurrentStep("otp")
            } else {
                setError("ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่")
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่")
        }
    }
    const [isVerifying, setIsVerifying] = useState(false)
    const handleVerifyOTP = async () => {
        if (isVerifying) return
        if (!otpCode || otpCode.length !== 6) {
            setError("กรุณากรอกรหัส OTP 6 หลัก")
            return
        }

        setIsVerifying(true)
        setError("")

        try {
            const isValidOTP = await verifyOTP(formData.email, otpCode)
            if (!isValidOTP) {
                setError("รหัส OTP ไม่ถูกต้อง")
                setIsVerifying(false)
                return
            }

            // สร้าง FormData
            const registerData = new FormData()
            registerData.append('email', formData.email)
            registerData.append('password', formData.password)
            registerData.append('firstName', formData.firstName)
            registerData.append('lastName', formData.lastName)
            registerData.append('phone', formData.phone)
            registerData.append('role', formData.role === 'organizer' ? 'organization' : 'user')

            // เพิ่ม interests
            formData.interests.forEach(interest => {
                registerData.append('interests[]', interest)
            })

            // เพิ่มไฟล์ (เฉพาะ organization)
            if (formData.role === 'organizer') {
                if (formData.documents.idCard) {
                    registerData.append('id_card', formData.documents.idCard)
                }
                if (formData.documents.organizationCert) {
                    registerData.append('org_cert', formData.documents.organizationCert)
                }
            }

            const success = await register(registerData) // ส่ง FormData

            if (success) {
                setCurrentStep("success")
                setTimeout(() => router.push("/profile"), 3000)
            } else {
                setError("สมัครไม่สำเร็จ กรุณาลองใหม่")
            }
        } catch (err: any) {
            setError(err.message || "เกิดข้อผิดพลาด")
        } finally {
            setIsVerifying(false)
        }
    }

    const handleInputChange = (name: string, value: string) => {
        setFormData({
            ...formData,
            [name]: value,
        })
    }

    const handleInterestToggle = useCallback((interestId: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interestId)
                ? prev.interests.filter(id => id !== interestId)
                : [...prev.interests, interestId],
        }))
    }, [])

    const handleFileUpload = (type: "idCard" | "organizationCert", file: File | null) => {
        setFormData({
            ...formData,
            documents: {
                ...formData.documents,
                [type]: file,
            },
        })
    }

    const handleBack = () => {
        if (currentStep === "interests") {
            setCurrentStep("info")
        } else if (currentStep === "documents") {
            setCurrentStep("info")
        } else if (currentStep === "otp") {
            if (formData.role === "organizer") {
                setCurrentStep("documents")
            } else {
                setCurrentStep("interests")
            }
        }
    }

    if (currentStep === "success") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">สมัครสมาชิกสำเร็จ!</h2>
                        <p className="text-gray-600 mb-4">
                            {formData.role === "organizer" ? "บัญชีของคุณอยู่ระหว่างการตรวจสอบเอกสาร" : "ยินดีต้อนรับสู่ DonateSwipe"}
                        </p>
                        <p className="text-sm text-gray-500">กำลังนำคุณไปยังหน้าโปรไฟล์...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => (currentStep === "info" ? router.push("/login") : handleBack())}
                        className="absolute top-4 left-4 hover:bg-pink-50"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับ
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">💝 DonateSwipe</h1>
                    <p className="text-gray-600">สร้างบัญชีเพื่อเริ่มช่วยเหลือผู้อื่น</p>
                </div>

                <Card className="shadow-xl border-0">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            {currentStep === "info" && "ข้อมูลพื้นฐาน"}
                            {currentStep === "interests" && "ความสนใจของคุณ"}
                            {currentStep === "documents" && "แนบเอกสาร"}
                            {currentStep === "otp" && "ยืนยันอีเมล"}
                        </CardTitle>
                        <div className="mt-4">
                            <Progress value={getStepProgress()} className="h-2" />
                            <p className="text-sm text-gray-500 mt-2">
                                ขั้นตอนที่{" "}
                                {formData.role === "organizer"
                                    ? ["info", "documents", "otp"].indexOf(currentStep) + 1
                                    : ["info", "interests", "otp"].indexOf(currentStep) + 1}{" "}
                                จาก {formData.role === "organizer" ? "3" : "3"}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Step 1: Basic Information */}
                            {currentStep === "info" && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-gray-700">
                                                ชื่อ
                                            </Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <Input
                                                    id="firstName"
                                                    name="firstName"
                                                    type="text"
                                                    placeholder="ชื่อ"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-gray-700">
                                                นามสกุล
                                            </Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                type="text"
                                                placeholder="นามสกุล"
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-700">
                                            อีเมล
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="กรอกอีเมลของคุณ"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-gray-700">
                                            เบอร์โทรศัพท์
                                        </Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                placeholder="081-234-5678"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-gray-700">
                                            ประเภทบัญชี
                                        </Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value: "user" | "organizer") => handleInputChange("role", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="เลือกประเภทบัญชี" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">ผู้ใช้ทั่วไป</SelectItem>
                                                <SelectItem value="organizer">ผู้จัดการองค์กร</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.role === "organizer" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="organizationName" className="text-gray-700">
                                                    ชื่อองค์กร
                                                </Label>
                                                <Input
                                                    id="organizationName"
                                                    name="organizationName"
                                                    type="text"
                                                    placeholder="เช่น โรงเรียนบ้านดอนตาล"
                                                    value={formData.organizationName}
                                                    onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                                                    required={formData.role === "organizer"}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="organizationType" className="text-gray-700">
                                                    ประเภทองค์กร
                                                </Label>
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
                                        <Label htmlFor="password" className="text-gray-700">
                                            รหัสผ่าน
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="สร้างรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                                                value={formData.password}
                                                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                                                className="pl-10 pr-10"
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-gray-700">
                                            ยืนยันรหัสผ่าน
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="ยืนยันรหัสผ่าน"
                                                value={formData.confirmPassword}
                                                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                                                className="pl-10 pr-10"
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 2: Interests Selection (for regular users only) */}
                            {currentStep === "interests" && (
                                <>
                                    <div className="space-y-4">
                                        <div className="bg-pink-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Heart className="w-5 h-5 text-pink-600" />
                                                <h4 className="font-medium text-pink-800">เลือกความสนใจของคุณ</h4>
                                            </div>
                                            <p className="text-sm text-pink-700">
                                                เลือกหมวดหมู่ที่คุณสนใจเพื่อให้เราแนะนำการบริจาคที่เหมาะสมกับคุณ
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                                            {generalInterests.map((interest) => (
                                                <label
                                                    key={interest.id}
                                                    className={`block border rounded-lg p-4 cursor-pointer transition-all ${formData.interests.includes(interest.id)
                                                        ? "border-pink-300 bg-pink-50"
                                                        : "border-gray-200 hover:border-pink-200 hover:bg-pink-25"
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Checkbox
                                                            checked={formData.interests.includes(interest.id)}
                                                            onCheckedChange={() => handleInterestToggle(interest.id)}
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
                                                </label>
                                            ))}
                                        </div>

                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <p className="text-sm text-blue-700">
                                                <strong>เลือกแล้ว {formData.interests.length} หมวดหมู่</strong>
                                                {formData.interests.length > 0 && " - คุณสามารถเปลี่ยนแปลงได้ในภายหลัง"}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 3: Document Upload (for organizers only) */}
                            {currentStep === "documents" && (
                                <>
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-blue-800 mb-2">📋 เอกสารที่ต้องแนบ</h4>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>• สำเนาบัตรประจำตัวประชาชน</li>
                                                <li>• หนังสือรับรองการจดทะเบียนองค์กร</li>
                                                <li>• ไฟล์ต้องเป็น PDF, JPG หรือ PNG ขนาดไม่เกิน 5MB</li>
                                            </ul>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-gray-700">สำเนาบัตรประจำตัวประชาชน *</Label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileUpload("idCard", e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    id="idCard"
                                                />
                                                <label htmlFor="idCard" className="cursor-pointer">
                                                    <div className="text-center">
                                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-sm text-gray-600">
                                                            {formData.documents.idCard ? formData.documents.idCard.name : "คลิกเพื่อเลือกไฟล์"}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (ไม่เกิน 5MB)</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-gray-700">หนังสือรับรององค์กร *</Label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileUpload("organizationCert", e.target.files?.[0] || null)}
                                                    className="hidden"
                                                    id="organizationCert"
                                                />
                                                <label htmlFor="organizationCert" className="cursor-pointer">
                                                    <div className="text-center">
                                                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-sm text-gray-600">
                                                            {formData.documents.organizationCert
                                                                ? formData.documents.organizationCert.name
                                                                : "คลิกเพื่อเลือกไฟล์"}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (ไม่เกิน 5MB)</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 4: OTP Verification */}
                            {currentStep === "otp" && (
                                <>
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                            <Mail className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">ยืนยันอีเมลของคุณ</h3>
                                            <p className="text-sm text-gray-600 mt-1">เราได้ส่งรหัส OTP 6 หลักไปยัง</p>
                                            <p className="text-sm font-medium text-gray-800">{formData.email}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="otp" className="text-gray-700">
                                                รหัส OTP
                                            </Label>
                                            <Input
                                                id="otp"
                                                type="text"
                                                placeholder="กรอกรหัส 6 หลัก"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                className="text-center text-lg tracking-widest"
                                                maxLength={6}
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            variant="link"
                                            onClick={handleSendOTP}
                                            className="text-pink-600 hover:text-pink-700"
                                            disabled={isLoading}
                                        >
                                            ส่งรหัสใหม่
                                        </Button>
                                    </div>
                                </>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                disabled={isLoading || isVerifying}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        กำลังดำเนินการ...
                                    </>
                                ) : (
                                    <>
                                        {currentStep === "info" && (formData.role === "organizer" ? "ถัดไป" : "ถัดไป")}
                                        {currentStep === "interests" && "ส่ง OTP"}
                                        {currentStep === "documents" && "ส่ง OTP"}
                                        {currentStep === "otp" && "ยืนยันและสมัครสมาชิก"}
                                    </>
                                )}
                            </Button>
                        </form>

                        {currentStep === "info" && (
                            <>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-800 mb-2">🔍 ทดลองใช้งาน:</h4>
                                    <div className="text-sm text-blue-700 space-y-1">
                                        <p>
                                            <strong>ผู้ใช้:</strong> user@example.com / password123
                                        </p>
                                        <p>
                                            <strong>ผู้จัดการ:</strong> organizer@example.com / organizer123
                                        </p>
                                        <p>
                                            <strong>ผู้ดูแลระบบ:</strong> admin@example.com / admin123
                                        </p>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        มีบัญชีอยู่แล้ว?{" "}
                                        <Button
                                            variant="link"
                                            onClick={() => router.push("/login")}
                                            className="p-0 h-auto text-pink-600 hover:text-pink-700"
                                        >
                                            เข้าสู่ระบบ
                                        </Button>
                                    </p>
                                </div>
                            </>
                        )}

                        {currentStep === "interests" && (
                            <div className="text-center">
                                <p className="text-xs text-gray-500">💡 คุณสามารถข้ามขั้นตอนนี้และเลือกความสนใจในภายหลังได้</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
