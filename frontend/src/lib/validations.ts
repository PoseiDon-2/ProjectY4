import { z } from 'zod'

// User validations
export const registerSchema = z.object({
    email: z.string().email('อีเมลไม่ถูกต้อง'),
    password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
    firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
    lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
    phone: z.string().optional(),
    role: z.enum(['DONOR', 'ORGANIZER']).default('DONOR')
})

export const loginSchema = z.object({
    email: z.string().email('อีเมลไม่ถูกต้อง'),
    password: z.string().min(1, 'กรุณากรอกรหัสผ่าน')
})

// Donation Request validations
export const donationRequestSchema = z.object({
    title: z.string().min(1, 'กรุณากรอกหัวข้อ'),
    description: z.string().min(10, 'คำอธิบายต้องมีอย่างน้อย 10 ตัวอักษร'),
    category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
    location: z.string().min(1, 'กรุณากรอกสถานที่'),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    acceptsMoney: z.boolean().default(false),
    acceptsItems: z.boolean().default(false),
    acceptsVolunteer: z.boolean().default(false),
    targetAmount: z.number().positive().optional(),
    itemsNeeded: z.string().optional(),
    volunteersNeeded: z.number().positive().optional(),
    volunteerDuration: z.string().optional(),
    volunteerSkills: z.string().optional(),
    images: z.array(z.string()).default([])
})

// Donation validations
export const donationSchema = z.object({
    requestId: z.string().min(1, 'กรุณาเลือกคำขอ'),
    amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
    message: z.string().optional(),
    anonymous: z.boolean().default(false),
    paymentMethod: z.string().min(1, 'กรุณาเลือกวิธีการชำระเงิน')
})

// Volunteer Application validations
export const volunteerApplicationSchema = z.object({
    requestId: z.string().min(1, 'กรุณาเลือกคำขอ'),
    message: z.string().min(10, 'ข้อความต้องมีอย่างน้อย 10 ตัวอักษร'),
    skills: z.string().optional(),
    experience: z.string().optional(),
    availability: z.string().optional(),
    hoursCommitted: z.number().positive().optional()
})

// Story validations
export const storySchema = z.object({
    title: z.string().min(1, 'กรุณากรอกหัวข้อ'),
    content: z.string().min(50, 'เนื้อหาต้องมีอย่างน้อย 50 ตัวอักษร'),
    requestId: z.string().optional(),
    images: z.array(z.string()).default([])
})
