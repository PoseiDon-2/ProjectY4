"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Heart, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { trustAPI } from "@/lib/api"

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

interface LevelRow {
    level: number
    name: string
    min_score: number
}

const defaultDonorLevels: LevelRow[] = [
    { level: 1, name: "เริ่มต้น", min_score: 0 },
    { level: 2, name: "ผู้ให้สม่ำเสมอ", min_score: 30 },
    { level: 3, name: "ผู้สนับสนุนที่น่าเชื่อถือ", min_score: 100 },
    { level: 4, name: "พันธมิตรผู้ให้", min_score: 300 },
    { level: 5, name: "มาตรฐานทอง", min_score: 600 },
]

const defaultOrganizerLevels: LevelRow[] = [
    { level: 1, name: "เริ่มต้น", min_score: 0 },
    { level: 2, name: "ได้รับความไว้วางใจ", min_score: 50 },
    { level: 3, name: "ผู้รับที่เชื่อถือได้", min_score: 200 },
    { level: 4, name: "พันธมิตรความดี", min_score: 500 },
    { level: 5, name: "มาตรฐานทอง", min_score: 1000 },
]

export default function TrustLevelsPage() {
    const router = useRouter()
    const [donorLevels, setDonorLevels] = useState<LevelRow[]>(defaultDonorLevels)
    const [organizerLevels, setOrganizerLevels] = useState<LevelRow[]>(defaultOrganizerLevels)

    useEffect(() => {
        if (!API_URL) return
        trustAPI.getTrustLevels().then((res) => {
            const d = res.data as any
            if (d?.donor?.length) setDonorLevels(d.donor)
            if (d?.organizer?.length) setOrganizerLevels(d.organizer)
        }).catch(() => {})
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 p-2 hover:bg-white/80">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับ
                </Button>

                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-10 h-10 text-amber-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">ระดับความน่าเชื่อถือ</h1>
                        <p className="text-gray-600 mt-1">ทำความเข้าใจว่าระบบความน่าเชื่อถือทำงานอย่างไร</p>
                    </div>
                </div>

                <p className="text-gray-700 mb-8">
                    ระบบความน่าเชื่อถือแบ่งเป็นสองประเภท: <strong>ผู้บริจาค</strong> และ <strong>ผู้รับบริจาค</strong> 
                    แต่ละฝ่ายมีระดับความน่าเชื่อถือที่คำนวณจากพฤติกรรมและผลงานจริงในแพลตฟอร์ม
                </p>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
                            <Heart className="w-6 h-6" />
                            ระดับความน่าเชื่อถือผู้บริจาค
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            คำนวณจากยอดเงินบริจาครวม จำนวนโครงการที่บริจาค และความถี่การบริจาค (เช่น การบริจาคสม่ำเสมอใน 90 วัน)
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium text-gray-700">ระดับ</th>
                                        <th className="text-left py-2 font-medium text-gray-700">ชื่อระดับ</th>
                                        <th className="text-right py-2 font-medium text-gray-700">คะแนนขั้นต่ำ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donorLevels.map((row) => (
                                        <tr key={row.level} className="border-b border-gray-100">
                                            <td className="py-3">{row.level}</td>
                                            <td className="py-3 font-medium text-gray-800">{row.name}</td>
                                            <td className="py-3 text-right text-gray-600">{row.min_score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl text-green-800">
                            <Users className="w-6 h-6" />
                            ระดับความน่าเชื่อถือผู้รับบริจาค
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            คำนวณจากยอดรับบริจาค จำนวนผู้สนับสนุน จำนวนโครงการที่ครบเป้า และความถี่ในการอัปเดตโครงการ (เช่น โพสต์ความคืบหน้าสม่ำเสมอ)
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 font-medium text-gray-700">ระดับ</th>
                                        <th className="text-left py-2 font-medium text-gray-700">ชื่อระดับ</th>
                                        <th className="text-right py-2 font-medium text-gray-700">คะแนนขั้นต่ำ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {organizerLevels.map((row) => (
                                        <tr key={row.level} className="border-b border-gray-100">
                                            <td className="py-3">{row.level}</td>
                                            <td className="py-3 font-medium text-gray-800">{row.name}</td>
                                            <td className="py-3 text-right text-gray-600">{row.min_score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-sm text-gray-500 text-center">
                    ระดับความน่าเชื่อถือของคุณจะอัปเดตตามกิจกรรมบนแพลตฟอร์ม คุณสามารถดูระดับและความคืบหน้าได้ที่หน้าโปรไฟล์
                </p>
            </div>
        </div>
    )
}
