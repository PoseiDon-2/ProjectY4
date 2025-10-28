import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const { email, otp } = await request.json()
        const backendUrl = process.env.BACKEND_URL || "http://localhost:8000/api"

        const res = await fetch(`${backendUrl}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
        })

        const data = await res.json()
        console.log("Verify OTP response:", { status: res.status, data })

        return new Response(
            JSON.stringify({
                success: res.ok && data.message === "OTP ถูกต้อง",
                message: data.message,
            }),
            { status: res.ok ? 200 : 400 }
        )
    } catch (err) {
        return new Response(
            JSON.stringify({ success: false, message: "เกิดข้อผิดพลาด" }),
            { status: 500 }
        )
    }
}