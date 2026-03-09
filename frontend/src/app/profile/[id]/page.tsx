"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, MapPin, Calendar, Heart, Share2, Globe, Facebook } from "lucide-react"

// Map สำหรับ Interest
const INTEREST_MAP: Record<string, string> = {
    "education-learning": "การศึกษาและการเรียนรู้",
    "environment": "สิ่งแวดล้อม",
    "animal-welfare": "สวัสดิภาพสัตว์",
    "medical-health": "การแพทย์และสุขภาพ",
    "elderly-care": "ดูแลผู้สูงอายุ",
    "disaster-relief": "ช่วยเหลือภัยพิบัติ",
    "disability-support": "ผู้พิการ",
    "children-youth": "เด็กและเยาวชน",
    "community-development": "พัฒนาชุมชน",
    "religious-spiritual": "ศาสนาและจิตวิญญาณ",
    "arts-culture": "ศิลปะและวัฒนธรรม",
    "sports-recreation": "กีฬาและนันทนาการ",
}
export default function PublicProfilePage() {
    const params = useParams() // รับ ID จาก URL
    const router = useRouter()
    const [userData, setUserData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPublicProfile = async () => {
            setLoading(true)
            setError(null)
            try {
                // --- ส่วนที่แก้ไข: Fetch ข้อมูลจาก Laravel API ---
                // ปรับ URL ให้ตรงกับที่รัน Laravel จริง (เช่น http://127.0.0.1:8000)
                const response = await fetch(`http://localhost:8000/api/users/${params.id}`)

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("ไม่พบผู้ใช้งานนี้")
                    }
                    throw new Error("เกิดข้อผิดพลาดในการดึงข้อมูล")
                }

                const data = await response.json()
                setUserData(data)
                // ------------------------------------
            } catch (err: any) {
                console.error(err)
                setError(err.message)
                setUserData(null)
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchPublicProfile()
        }
    }, [params.id])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        )
    }

    if (error || !userData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <h1 className="text-2xl font-bold text-gray-400">{error || "ไม่พบข้อมูล"}</h1>
                <Button variant="outline" onClick={() => router.push("/")}>กลับหน้าหลัก</Button>
            </div>
        )
    }

    // --- ส่วนการแสดงผล (Rendering) ---
    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Cover / Header Area */}
            <div className="bg-gradient-to-r from-pink-400 to-purple-500 h-48 w-full relative">
                <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 text-white border-none"
                    onClick={() => router.push("/")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> กลับ
                </Button>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
                <Card className="shadow-lg border-none">
                    <CardContent className="pt-0 relative">

                        {/* Avatar & Basic Info */}
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pb-6">
                            <div className="relative -mt-16">
                                <div className="p-1.5 bg-white rounded-full">
                                    <Avatar className="w-32 h-32 border-4 border-white shadow-md">
                                        <AvatarImage src={userData.avatar} />
                                        <AvatarFallback className="text-2xl">{userData.firstName?.[0]}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left mt-4 md:mt-0 space-y-1">
                                <h1 className="text-2xl font-bold text-gray-900">{userData.firstName} {userData.lastName}</h1>
                                <p className="text-white flex items-center justify-center md:justify-start gap-2 text-sm">
                                    <MapPin className="w-4 h-4" /> {userData.location || "ไม่ระบุสถานที่"} •
                                    <Calendar className="w-4 h-4 ml-1" /> สมาชิกเมื่อ {new Date(userData.joinDate).getFullYear()}
                                </p>
                            </div>

                            <div className="mt-4 md:mt-0 flex gap-2">
                                <Button className="bg-pink-600 hover:bg-pink-700 rounded-full">
                                    <Heart className="w-4 h-4 mr-2" /> ติดตาม
                                </Button>
                                <Button variant="outline" className="rounded-full" onClick={() => {
                                    navigator.clipboard.writeText(window.location.href)
                                    alert("คัดลอกลิ้งค์แล้ว")
                                }}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Bio & Socials */}
                        <div className="mt-4 border-t pt-6 grid md:grid-cols-3 gap-8">

                            {/* Left: About */}
                            <div className="md:col-span-1 space-y-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">เกี่ยวกับฉัน</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{userData.bio || "ยังไม่มีชีวประวัติ"}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">สิ่งที่สนใจ</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {userData.interests?.map((interest: string) => (
                                            <Badge key={interest} variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100">
                                                {INTEREST_MAP[interest] || interest}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {userData.socials?.facebook && (
                                        <a href={userData.socials.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                            <Facebook className="w-4 h-4" /> Facebook
                                        </a>
                                    )}
                                    {userData.socials?.website && (
                                        <a href={userData.socials.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:underline">
                                            <Globe className="w-4 h-4" /> Website
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Right: Stats & Content */}
                            <div className="md:col-span-2">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                                        <div className="text-2xl font-bold text-pink-600">{userData.donationCount || 0}</div>
                                        <div className="text-xs text-gray-500">ครั้งที่บริจาค</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                                        <div className="text-2xl font-bold text-purple-600">฿{(userData.totalDonated || 0).toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">ยอดเงินช่วยเหลือ</div>
                                    </div>
                                </div>

                                <Tabs defaultValue="stories">
                                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                                        <TabsTrigger value="stories" className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-4 py-2">เรื่องราวความประทับใจ</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="stories" className="pt-4 space-y-4">
                                        {userData.stories?.map((story: any) => (
                                            <Card key={story.id} className="hover:shadow-md transition-shadow">
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{story.title}</CardTitle>
                                                    <p className="text-xs text-gray-400">{new Date(story.date).toLocaleDateString('th-TH')}</p>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-gray-600 text-sm">{story.content}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}