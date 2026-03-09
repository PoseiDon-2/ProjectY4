"use client"

import { useState } from "react"
import { X, ArrowLeft, Check, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { volunteerApplicationsAPI } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface VolunteerModalProps {
    isOpen: boolean
    onClose: () => void
    donation: {
        id: number | string
        title: string
        volunteerDescription: string
        contactPhone: string
        location: string
    }
}

interface SkillCategory {
    id: string
    name: string
    icon: string
    description: string
}

const skillCategories: SkillCategory[] = [
    {
        id: "physical",
        name: "งานใช้แรงงาน",
        icon: "💪",
        description: "ยกของหนัก ขนย้าย ทำความสะอาด",
    },
    {
        id: "professional",
        name: "งานเฉพาะทาง",
        icon: "👨‍💼",
        description: "ช่างไฟฟ้า ช่างประปา ช่างก่อสร้าง",
    },
    {
        id: "creative",
        name: "งานสร้างสรรค์",
        icon: "🎨",
        description: "ถ่ายภาพ วีดีโอ ออกแบบ",
    },
    {
        id: "coordination",
        name: "งานประสานงาน",
        icon: "📋",
        description: "จัดการ ประสานงาน บันทึกข้อมูล",
    },
    {
        id: "cooking",
        name: "งานครัว",
        icon: "👨‍🍳",
        description: "ทำอาหาร เตรียมอาหาร แจกอาหาร",
    },
    {
        id: "transport",
        name: "งานขนส่ง",
        icon: "🚗",
        description: "ขับรถ ส่งของ รับส่งคน",
    },
]

export default function VolunteerModal({ isOpen, onClose, donation }: VolunteerModalProps) {
    const [step, setStep] = useState<"personal" | "skills" | "schedule" | "success">("personal")
    const [volunteerName, setVolunteerName] = useState("")
    const [volunteerPhone, setVolunteerPhone] = useState("")
    const [volunteerEmail, setVolunteerEmail] = useState("")
    const [age, setAge] = useState("")
    const [experience, setExperience] = useState("")
    const [emergencyContact, setEmergencyContact] = useState("")
    const [emergencyPhone, setEmergencyPhone] = useState("")
    const [hasVehicle, setHasVehicle] = useState(false)
    const [vehicleType, setVehicleType] = useState("")
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])
    const [skillDetails, setSkillDetails] = useState("")
    const [availableDates, setAvailableDates] = useState<string[]>([])
    const [preferredTime, setPreferredTime] = useState("")
    const [duration, setDuration] = useState("")
    const [message, setMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { user } = useAuth()

    const handleSkillToggle = (skillId: string) => {
        setSelectedSkills((prev) => (prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]))
    }

    const handleDateToggle = (date: string) => {
        setAvailableDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]))
    }

    const handleSubmit = async () => {
        if (!user) return
        setIsSubmitting(true)

        const estimatedHours = duration === "half-day" ? 4 : duration === "full-day" ? 8 : duration === "multiple-days" ? 16 : 4
        const requestId = donation.id.toString()

        try {
            if (localStorage.getItem("auth_token")) {
                const res = await volunteerApplicationsAPI.submit({
                    donation_request_id: requestId,
                    message: message || undefined,
                    skills: selectedSkills,
                    skill_details: skillDetails || undefined,
                    experience: experience || undefined,
                    available_dates: availableDates,
                    preferred_time: preferredTime || undefined,
                    duration: duration || undefined,
                    estimated_hours: estimatedHours,
                    volunteer_phone: volunteerPhone || user.phone,
                    volunteer_email: volunteerEmail || user.email,
                    age: age ? parseInt(age, 10) : undefined,
                    emergency_contact: emergencyContact || undefined,
                    emergency_phone: emergencyPhone || undefined,
                    has_vehicle: hasVehicle,
                    vehicle_type: vehicleType || undefined,
                })
                if (res.data) {
                    toast({ title: "ส่งสมัครสำเร็จ", description: "รอการอนุมัติจากผู้จัด คะแนนจะได้รับเมื่ออนุมัติแล้ว" })
                    setIsSubmitting(false)
                    setStep("success")
                    return
                }
            }
        } catch (e) {
            console.warn("API submit failed, using localStorage fallback:", e)
        }

        const volunteerId = `volunteer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        const volunteerRecord = {
            id: volunteerId,
            userId: user.id,
            requestId,
            requestTitle: donation.title,
            type: "volunteer" as const,
            date: new Date().toISOString(),
            status: "pending_review" as const,
            skills: selectedSkills,
            skillDetails,
            availableDates,
            preferredTime,
            duration,
            estimatedHours,
            volunteerName: volunteerName || `${user.firstName} ${user.lastName}`,
            volunteerPhone,
            volunteerEmail,
            age,
            experience,
            emergencyContact,
            emergencyPhone,
            hasVehicle,
            vehicleType,
            message,
            pointsEarned: 0,
        }

        const existingVolunteers = JSON.parse(localStorage.getItem(`user_volunteers_${user.id}`) || "[]")
        existingVolunteers.push(volunteerRecord)
        localStorage.setItem(`user_volunteers_${user.id}`, JSON.stringify(existingVolunteers))

        const pendingVolunteers = JSON.parse(localStorage.getItem("pending_volunteer_applications") || "[]")
        pendingVolunteers.push({ ...volunteerRecord, volunteerId: user.id })
        localStorage.setItem("pending_volunteer_applications", JSON.stringify(pendingVolunteers))

        toast({ title: "ส่งสมัครสำเร็จ", description: "รอการอนุมัติจากผู้จัด คะแนนจะได้รับเมื่ออนุมัติแล้ว" })
        setIsSubmitting(false)
        setStep("success")
    }

    const resetModal = () => {
        setStep("personal")
        setVolunteerName("")
        setVolunteerPhone("")
        setVolunteerEmail("")
        setAge("")
        setExperience("")
        setEmergencyContact("")
        setEmergencyPhone("")
        setHasVehicle(false)
        setVehicleType("")
        setSelectedSkills([])
        setSkillDetails("")
        setAvailableDates([])
        setPreferredTime("")
        setDuration("")
        setMessage("")
        setIsSubmitting(false)
    }

    const handleClose = () => {
        resetModal()
        onClose()
    }

    const getSelectedSkillNames = () => {
        return selectedSkills.map((id) => skillCategories.find((skill) => skill.id === id)?.name).join(", ")
    }

    const getNextDays = (count: number) => {
        const dates = []
        const today = new Date()
        for (let i = 1; i <= count; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)
            dates.push({
                value: date.toISOString().split("T")[0],
                label: date.toLocaleDateString("th-TH", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                }),
            })
        }
        return dates
    }

    const getTimeText = (time: string) => {
        const times = {
            morning: "เช้า (09:00-12:00)",
            afternoon: "บ่าย (13:00-17:00)",
            evening: "เย็น (17:00-20:00)",
            flexible: "ยืดหยุ่นได้",
        }
        return times[time as keyof typeof times] || time
    }

    const getDurationText = (duration: string) => {
        const durations = {
            "half-day": "ครึ่งวัน (4 ชั่วโมง)",
            "full-day": "เต็มวัน (8 ชั่วโมง)",
            "multiple-days": "หลายวัน",
            flexible: "ยืดหยุ่นได้",
        }
        return durations[duration as keyof typeof durations] || duration
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-2">
                        {step !== "personal" && step !== "success" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (step === "skills") setStep("personal")
                                    else if (step === "schedule") setStep("skills")
                                }}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        )}
                        <CardTitle className="text-lg">
                            {step === "personal" && "ข้อมูลส่วนตัว"}
                            {step === "skills" && "ทักษะและความสามารถ"}
                            {step === "schedule" && "กำหนดการและเวลา"}
                            {step === "success" && "สมัครสำเร็จ"}
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                    {step === "personal" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-800 mb-2">สมัครอาสาสมัครสำหรับ</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{donation.title}</p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">งานที่ต้องการอาสาสมัคร</h4>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <p className="text-sm text-purple-800">{donation.volunteerDescription}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">ข้อมูลส่วนตัว</h4>

                                <div className="space-y-2">
                                    <Label htmlFor="volunteerName">ชื่อ-นามสกุล *</Label>
                                    <Input
                                        id="volunteerName"
                                        placeholder="ระบุชื่อ-นามสกุล"
                                        value={volunteerName}
                                        onChange={(e) => setVolunteerName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="volunteerPhone">เบอร์โทร *</Label>
                                        <Input
                                            id="volunteerPhone"
                                            type="tel"
                                            placeholder="081-234-5678"
                                            value={volunteerPhone}
                                            onChange={(e) => setVolunteerPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="age">อายุ *</Label>
                                        <Input
                                            id="age"
                                            type="number"
                                            placeholder="25"
                                            min="18"
                                            max="70"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="volunteerEmail">อีเมล</Label>
                                    <Input
                                        id="volunteerEmail"
                                        type="email"
                                        placeholder="example@email.com"
                                        value={volunteerEmail}
                                        onChange={(e) => setVolunteerEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="experience">ประสบการณ์อาสาสมัคร</Label>
                                    <Select value={experience} onValueChange={setExperience}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกประสบการณ์" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">ไม่มีประสบการณ์</SelectItem>
                                            <SelectItem value="some">มีประสบการณ์บ้าง</SelectItem>
                                            <SelectItem value="experienced">มีประสบการณ์มาก</SelectItem>
                                            <SelectItem value="expert">เชี่ยวชาญ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">ข้อมูลติดต่อฉุกเฉิน</h4>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="emergencyContact">ชื่อผู้ติดต่อ *</Label>
                                        <Input
                                            id="emergencyContact"
                                            placeholder="ชื่อญาติหรือเพื่อน"
                                            value={emergencyContact}
                                            onChange={(e) => setEmergencyContact(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergencyPhone">เบอร์โทร *</Label>
                                        <Input
                                            id="emergencyPhone"
                                            type="tel"
                                            placeholder="081-234-5678"
                                            value={emergencyPhone}
                                            onChange={(e) => setEmergencyPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">พาหนะส่วนตัว</h4>

                                <div className="flex items-center gap-2">
                                    <Checkbox id="hasVehicle" checked={hasVehicle} onCheckedChange={(checked) => setHasVehicle(checked === true)} />
                                    <Label htmlFor="hasVehicle" className="text-sm">
                                        มีพาหนะส่วนตัว
                                    </Label>
                                </div>

                                {hasVehicle && (
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicleType">ประเภทพาหนะ</Label>
                                        <Select value={vehicleType} onValueChange={setVehicleType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="เลือกประเภทพาหนะ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="motorcycle">รถจักรยานยนต์</SelectItem>
                                                <SelectItem value="car">รถยนต์</SelectItem>
                                                <SelectItem value="pickup">รถกระบะ</SelectItem>
                                                <SelectItem value="van">รถตู้</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                onClick={() => setStep("skills")}
                                disabled={!volunteerName || !volunteerPhone || !age || !emergencyContact || !emergencyPhone}
                            >
                                ถัดไป
                            </Button>
                        </div>
                    )}

                    {step === "skills" && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">ทักษะและความสามารถ</h4>
                                <p className="text-sm text-gray-600">เลือกทักษะที่คุณสามารถช่วยได้ (เลือกได้หลายข้อ)</p>

                                <div className="grid grid-cols-1 gap-2">
                                    {skillCategories.map((skill) => (
                                        <button
                                            key={skill.id}
                                            className={`p-3 border rounded-lg text-left transition-all ${selectedSkills.includes(skill.id)
                                                ? "border-purple-500 bg-purple-50"
                                                : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            onClick={() => handleSkillToggle(skill.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{skill.icon}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">{skill.name}</span>
                                                        {selectedSkills.includes(skill.id) && <Check className="w-4 h-4 text-purple-600" />}
                                                    </div>
                                                    <p className="text-xs text-gray-600">{skill.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="skillDetails">รายละเอียดทักษะเพิ่มเติม</Label>
                                <Textarea
                                    id="skillDetails"
                                    placeholder="เช่น มีประสบการณ์ช่างไฟฟ้า 5 ปี, เคยเป็นอาสาสมัครช่วยเหลือผู้ประสบภัย..."
                                    rows={4}
                                    value={skillDetails}
                                    onChange={(e) => setSkillDetails(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">ข้อความเพิ่มเติม</Label>
                                <Textarea
                                    id="message"
                                    placeholder="ข้อความให้กำลังใจหรือสิ่งที่อยากบอกผู้จัดการ..."
                                    rows={3}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                onClick={() => setStep("schedule")}
                                disabled={selectedSkills.length === 0}
                            >
                                ถัดไป ({selectedSkills.length} ทักษะ)
                            </Button>
                        </div>
                    )}

                    {step === "schedule" && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">วันที่สะดวก</h4>
                                <p className="text-sm text-gray-600">เลือกวันที่คุณสะดวกจะมาช่วย (เลือกได้หลายวัน)</p>

                                <div className="grid grid-cols-2 gap-2">
                                    {getNextDays(14).map((date) => (
                                        <button
                                            key={date.value}
                                            className={`p-3 border rounded-lg text-center transition-all ${availableDates.includes(date.value)
                                                ? "border-purple-500 bg-purple-50"
                                                : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            onClick={() => handleDateToggle(date.value)}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm font-medium">{date.label}</span>
                                                {availableDates.includes(date.value) && <Check className="w-4 h-4 text-purple-600" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">ช่วงเวลาที่สะดวก</h4>

                                <Select value={preferredTime} onValueChange={setPreferredTime}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกช่วงเวลา" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="morning">เช้า (09:00-12:00)</SelectItem>
                                        <SelectItem value="afternoon">บ่าย (13:00-17:00)</SelectItem>
                                        <SelectItem value="evening">เย็น (17:00-20:00)</SelectItem>
                                        <SelectItem value="flexible">ยืดหยุ่นได้</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-800">ระยะเวลาที่สามารถช่วยได้</h4>

                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกระยะเวลา" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="half-day">ครึ่งวัน (4 ชั่วโมง)</SelectItem>
                                        <SelectItem value="full-day">เต็มวัน (8 ชั่วโมง)</SelectItem>
                                        <SelectItem value="multiple-days">หลายวัน</SelectItem>
                                        <SelectItem value="flexible">ยืดหยุ่นได้</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-left">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">ชื่อ:</span>
                                    <span className="text-sm font-medium">{volunteerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">ทักษะ:</span>
                                    <span className="text-sm text-right">{getSelectedSkillNames()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">วันที่สะดวก:</span>
                                    <span className="text-sm">{availableDates.length} วัน</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">ช่วงเวลา:</span>
                                    <span className="text-sm">{getTimeText(preferredTime)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">ระยะเวลา:</span>
                                    <span className="text-sm">{getDurationText(duration)}</span>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-xs text-amber-600">ผู้จัดจะอนุมัติและระบุชั่วโมงจริงก่อน จึงจะได้รับคะแนน</p>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                onClick={handleSubmit}
                                disabled={isSubmitting || availableDates.length === 0 || !preferredTime || !duration}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        กำลังส่งข้อมูล...
                                    </>
                                ) : (
                                    "ยืนยันการสมัคร"
                                )}
                            </Button>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="space-y-4 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">ส่งสมัครสำเร็จ!</h3>
                                <p className="text-gray-600">รอการอนุมัติจากผู้จัด คะแนนจะได้รับเมื่ออนุมัติแล้ว</p>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-lg">📋</span>
                                    <span className="font-bold text-amber-700">รอการอนุมัติ</span>
                                </div>
                                <p className="text-sm text-amber-600">ผู้จัดจะตรวจสอบและระบุชั่วโมงจริง คะแนนจะได้รับเมื่ออนุมัติแล้ว</p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-left">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">ชื่อ:</span>
                                    <span className="text-sm font-medium">{volunteerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">ทักษะ:</span>
                                    <span className="text-sm text-right">{getSelectedSkillNames()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">วันที่สะดวก:</span>
                                    <span className="text-sm">{availableDates.length} วัน</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">ช่วงเวลา:</span>
                                    <span className="text-sm">{getTimeText(preferredTime)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">ระยะเวลา:</span>
                                    <span className="text-sm">{getDurationText(duration)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                    onClick={handleClose}
                                >
                                    เสร็จสิ้น
                                </Button>
                                <Button variant="outline" className="w-full bg-transparent">
                                    แชร์การเป็นอาสาสมัคร
                                </Button>
                            </div>

                            <div className="bg-purple-50 p-3 rounded-lg">
                                <p className="text-sm text-purple-800">
                                    📞 ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
                                    <br />📧 คุณจะได้รับอีเมลยืนยันการสมัครในอีกสักครู่
                                    <br />📅 รอการนัดหมายวันเวลาที่เหมาะสม
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
