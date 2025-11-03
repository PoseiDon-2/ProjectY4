// app/api/auth/send-otp/route.ts
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(
                JSON.stringify({ success: false, message: "อีเมลไม่ถูกต้อง" }),
                { status: 400 }
            )
        }

        const backendUrl = process.env.NEXT_PUBLIC_API_URL
        console.log("Proxy: ส่ง OTP ไปที่", backendUrl + "/auth/send-otp")

        const res = await fetch(`${backendUrl}/auth/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        })

        const data = await res.json()
        console.log("Backend response:", { status: res.status, data })

        // ส่ง response กลับ Frontend เหมือนเดิม
        return new Response(
            JSON.stringify({
                success: res.ok,
                message: data.message || (res.ok ? "ส่ง OTP สำเร็จ" : "ส่ง OTP ล้มเหลว"),
                ...(process.env.NODE_ENV === "development" && { debug: data })
            }),
            { status: res.ok ? 200 : res.status }
        )
    } catch (err) {
        console.error("Proxy error:", err)
        return new Response(
            JSON.stringify({ success: false, message: "เซิร์ฟเวอร์มีปัญหา" }),
            { status: 500 }
        )
    }
}