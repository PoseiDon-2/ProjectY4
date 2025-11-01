"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"

export default function Login() {
    const router = useRouter()
    const { login, isLoading } = useAuth()
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!formData.email || !formData.password) {
            setError("กรุณากรอกอีเมลและรหัสผ่าน")
            return
        }

        const success = await login(formData.email, formData.password)
        if (success) {
            router.push("/") // ไปหน้าแรก
        } else {
            setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value,
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">DonateSwipe</h1>
                    <p className="text-gray-600">เข้าสู่ระบบเพื่อเริ่มช่วยเหลือผู้อื่น</p>
                </div>

                <Card className="shadow-xl border-0">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                                </Alert>
                            )}

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
                                        onChange={handleInputChange}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

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
                                        placeholder="กรอกรหัสผ่านของคุณ"
                                        value={formData.password}
                                        onChange={handleInputChange}
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

                            <div className="text-right">
                                <Button
                                    variant="link"
                                    onClick={() => router.push("/forgot-password")}
                                    className="p-0 h-auto text-pink-600 hover:text-pink-700 text-sm"
                                >
                                    ลืมรหัสผ่าน?
                                </Button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        กำลังเข้าสู่ระบบ...
                                    </>
                                ) : (
                                    "เข้าสู่ระบบ"
                                )}
                            </Button>
                        </form>

                        {/* Mock Login Info */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-800 mb-2">ทดลองใช้งาน:</h4>
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
                                ยังไม่มีบัญชี?{" "}
                                <Button
                                    variant="link"
                                    onClick={() => router.push("/register")}
                                    className="p-0 h-auto text-pink-600 hover:text-pink-700"
                                >
                                    สมัครสมาชิก
                                </Button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}