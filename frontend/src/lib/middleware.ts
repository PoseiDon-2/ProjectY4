import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from './auth'

export async function authMiddleware(request: NextRequest) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('auth-token')?.value

    if (!token) {
        return NextResponse.json(
            { error: 'ไม่พบ token การยืนยันตัวตน' },
            { status: 401 }
        )
    }

    const user = await getUserFromToken(token)
    if (!user) {
        return NextResponse.json(
            { error: 'Token ไม่ถูกต้องหรือหมดอายุ' },
            { status: 401 }
        )
    }

    // Add user to request headers for use in API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role)

    return NextResponse.next({
        request: {
            headers: requestHeaders
        }
    })
}

export function requireRole(allowedRoles: string[]) {
    return (request: NextRequest) => {
        const userRole = request.headers.get('x-user-role')

        if (!userRole || !allowedRoles.includes(userRole)) {
            return NextResponse.json(
                { error: 'ไม่มีสิทธิ์เข้าถึง' },
                { status: 403 }
            )
        }

        return NextResponse.next()
    }
}

export function validateRequest(schema: any) {
    return async (request: NextRequest) => {
        try {
            const body = await request.json()
            const validatedData = schema.parse(body)

            // Add validated data to request headers
            const requestHeaders = new Headers(request.headers)
            requestHeaders.set('x-validated-data', JSON.stringify(validatedData))

            return NextResponse.next({
                request: {
                    headers: requestHeaders
                }
            })
        } catch (error: any) {
            return NextResponse.json(
                {
                    error: 'ข้อมูลไม่ถูกต้อง',
                    details: error.errors || error.message
                },
                { status: 400 }
            )
        }
    }
}
