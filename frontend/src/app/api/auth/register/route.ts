// app/api/auth/register/route.ts
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
    try {
        // รับ FormData จาก Frontend
        const formData = await request.formData()

        const backendUrl = process.env.NEXT_PUBLIC_API_URL
        console.log("Proxy: ส่ง register ไปที่", backendUrl + "/auth/register")

        // ส่ง FormData ไป Laravel
        const res = await fetch(`${backendUrl}/auth/register`, {
            method: "POST",
            body: formData, // ← สำคัญ! ต้องส่ง FormData
        })

        const contentType = res.headers.get("content-type") || ""
        let data: any = {}

        if (contentType.includes("application/json")) {
            data = await res.json()
        } else {
            data = { message: await res.text() }
        }

        console.log("Backend response:", { status: res.status, data })

        return new Response(
            JSON.stringify({
                success: res.ok,
                message: data.message || (res.ok ? "สมัครสำเร็จ" : "สมัครล้มเหลว"),
                ...(process.env.NODE_ENV === "development" && { debug: data }),
            }),
            { status: res.ok ? 200 : res.status }
        )
    } catch (err) {
        console.error("Proxy register error:", err)
        return new Response(
            JSON.stringify({ success: false, message: "เซิร์ฟเวอร์มีปัญหา" }),
            { status: 500 }
        )
    }
}