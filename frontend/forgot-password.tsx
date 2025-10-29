"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/app/auth-context"

type ResetStep = "email" | "otp" | "password" | "success"

export default function ForgotPassword() {
    const router = useRouter()
    const { sendOTP, verifyOTP, isLoading } = useAuth()
    const [currentStep, setCurrentStep] = useState<ResetStep>("email")
    const [formData, setFormData] = useState({
        email: "",
        otpCode: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState("")

    const getStepProgress = () => {
        const steps = ["email", "otp", "password", "success"]
        return ((steps.indexOf(currentStep) + 1) / steps.length) * 100
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (currentStep === "email") {
            if (!formData.email) {
                setError("กรุณากรอกอีเมล")
                return
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                setError("รูปแบบอีเมลไม่ถูกต้อง")
                return
            }

            try {
                const success = await sendOTP(formData.email)
                if (success) {
                    setCurrentStep("otp")
                } else {
                    setError("ไม่พบอีเมลนี้ในระบบ")
                }
            } catch (err) {
                setError("เกิดข้อผิดพลาด กรุณาลองใหม่")
            }
        } else if (currentStep === "otp") {
            if (!formData.otpCode || formData.otpCode.length !== 6) {
                setError("กรุณากรอกรหัส OTP 6 หลัก")
                return
            }

            try {
                const isValidOTP = await verifyOTP(formData.email, formData.otpCode)
                if (isValidOTP) {
                    setCurrentStep("password")
                } else {
                    setError("รหัส OTP ไม่ถูกต้อง")
                }
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการยืนยัน OTP")
            }
        } else if (currentStep === "password") {
            if (!formData.newPassword || !formData.confirmPassword) {
                setError("กรุณากรอกรหัสผ่านให้ครบถ้วน")
                return
            }

            if (formData.newPassword.length < 6) {
                setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
                return
            }

            if (formData.newPassword !== formData.confirmPassword) {
                setError("รหัสผ่านไม่ตรงกัน")
                return
            }

            // Simulate password reset
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                setCurrentStep("success")
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน")
            }
        }
    }

    const handleInputChange = (name: string, value: string) => {
        setFormData({
            ...formData,
            [name]: value,
        })
    }

    const handleResendOTP = async () => {
        try {
            const success = await sendOTP(formData.email)
            if (!success) {
                setError("ไม่สามารถส่งรหัสใหม่ได้")
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่")
        }
    }

    const handleBack = () => {
        if (currentStep === "otp") {
            setCurrentStep("email")
        } else if (currentStep === "password") {
            setCurrentStep("otp")
        } else {
            router.push("/login")
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
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">รีเซ็ตรหัสผ่านสำเร็จ!</h2>
                        <p className="text-gray-600 mb-4">รหัสผ่านของคุณได้รับการเปลี่ยนแปลงเรียบร้อยแล้ว</p>
                        <p className="text-sm text-gray-500">กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p>
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
                    <Button variant="ghost" onClick={handleBack} className="absolute top-4 left-4 hover:bg-pink-50">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับ
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">💝 DonateSwipe</h1>
                    <p className="text-gray-600">รีเซ็ตรหัสผ่านของคุณ</p>
                </div>

                <Card className="shadow-xl border-0">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            {currentStep === "email" && "กรอกอีเมล"}
                            {currentStep === "otp" && "ยืนยันรหัส OTP"}
                            {currentStep === "password" && "รหัสผ่านใหม่"}
                        </CardTitle>
                        <div className="mt-4">
                            <Progress value={getStepProgress()} className="h-2" />
                            <p className="text-sm text-gray-500 mt-2">
                                ขั้นตอนที่ {["email", "otp", "password"].indexOf(currentStep) + 1} จาก 3
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

                            {/* Step 1: Email Input */}
                            {currentStep === "email" && (
                                <>
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                                            <Mail className="w-8 h-8 text-pink-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">ลืมรหัสผ่าน?</h3>
                                            <p className="text-sm text-gray-600 mt-1">กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งรหัสยืนยันให้คุณ</p>
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
                                    </div>
                                </>
                            )}

                            {/* Step 2: OTP Verification */}
                            {currentStep === "otp" && (
                                <>
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                            <KeyRound className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">ยืนยันรหัส OTP</h3>
                                            <p className="text-sm text-gray-600 mt-1">เราได้ส่งรหัส OTP 6 หลักไปยัง</p>
                                            <p className="text-sm font-medium text-gray-800">{formData.email}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="otpCode" className="text-gray-700">
                                                รหัส OTP
                                            </Label>
                                            <Input
                                                id="otpCode"
                                                name="otpCode"
                                                type="text"
                                                placeholder="กรอกรหัส 6 หลัก"
                                                value={formData.otpCode}
                                                onChange={(e) =>
                                                    handleInputChange(e.target.name, e.target.value.replace(/\D/g, "").slice(0, 6))
                                                }
                                                className="text-center text-lg tracking-widest"
                                                maxLength={6}
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            variant="link"
                                            onClick={handleResendOTP}
                                            className="text-pink-600 hover:text-pink-700"
                                            disabled={isLoading}
                                        >
                                            ส่งรหัสใหม่
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Step 3: New Password */}
                            {currentStep === "password" && (
                                <>
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                            <Lock className="w-8 h-8 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">สร้างรหัสผ่านใหม่</h3>
                                            <p className="text-sm text-gray-600 mt-1">กรอกรหัสผ่านใหม่ที่คุณต้องการใช้</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="newPassword" className="text-gray-700">
                                                    รหัสผ่านใหม่
                                                </Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                    <Input
                                                        id="newPassword"
                                                        name="newPassword"
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="สร้��งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                                                        value={formData.newPassword}
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
                                                        placeholder="ยืนยันรหัสผ่านใหม่"
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
                                        </div>
                                    </div>
                                </>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        กำลังดำเนินการ...
                                    </>
                                ) : (
                                    <>
                                        {currentStep === "email" && "ส่งรหัส OTP"}
                                        {currentStep === "otp" && "ยืนยันรหัส"}
                                        {currentStep === "password" && "รีเซ็ตรหัสผ่าน"}
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Demo Information */}
                        {currentStep === "email" && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">🔍 ทดลองใช้งาน:</h4>
                                <div className="text-sm text-blue-700 space-y-1">
                                    <p>ใช้อีเมลใดก็ได้ เช่น: user@example.com</p>
                                    <p>
                                        รหัส OTP สำหรับทดสอบ: <strong>123456</strong>
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentStep === "otp" && (
                            <div className="bg-yellow-50 p-3 rounded-lg">
                                <p className="text-sm text-yellow-700">
                                    💡 <strong>สำหรับการทดสอบ:</strong> ใช้รหัส OTP <strong>123456</strong>
                                </p>
                            </div>
                        )}

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                จำรหัสผ่านได้แล้ว?{" "}
                                <Button
                                    variant="link"
                                    onClick={() => router.push("/login")}
                                    className="p-0 h-auto text-pink-600 hover:text-pink-700"
                                >
                                    เข้าสู่ระบบ
                                </Button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
