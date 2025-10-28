import { mockData } from "./mock-data"

export interface AuthUser {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    avatar?: string
    phone?: string
    organizationName?: string
    organizationType?: string
    isVerified: boolean
}

// Simple client-side password hashing (for demo purposes only)
function simpleHash(password: string): string {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
    }
    return hash.toString(36)
}

export function hashPassword(password: string): string {
    return simpleHash(password)
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
    return simpleHash(password) === hashedPassword
}

export function generateToken(user: AuthUser): string {
    // Simple token generation for client-side
    return btoa(
        JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            timestamp: Date.now(),
        }),
    )
}

export function verifyToken(token: string): AuthUser | null {
    try {
        const decoded = JSON.parse(atob(token))
        // Check if token is expired (7 days)
        if (Date.now() - decoded.timestamp > 7 * 24 * 60 * 60 * 1000) {
            return null
        }
        return decoded
    } catch (error) {
        return null
    }
}

export function getUserFromToken(token: string): any | null {
    try {
        const decoded = verifyToken(token)
        if (!decoded) return null

        const user = mockData.users.find((u) => u.id === decoded.id)
        return user || null
    } catch (error) {
        return null
    }
}

export function login(email: string, password: string): { user: AuthUser; token: string } | null {
    const user = mockData.users.find((u) => u.email === email)
    if (!user) return null

    if (!verifyPassword(password, user.password)) return null

    const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        organizationName: user.organizationName,
        organizationType: user.organizationType,
        isVerified: user.isVerified,
    }

    const token = generateToken(authUser)
    return { user: authUser, token }
}

export function register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    role: string
    organizationName?: string
    organizationType?: string
}): { user: AuthUser; token: string } | null {
    // Check if user already exists
    if (mockData.users.find((u) => u.email === data.email)) {
        return null
    }

    const newUser = {
        id: `user_${Date.now()}`,
        email: data.email,
        password: hashPassword(data.password),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || "",
        avatar: "/placeholder.svg?height=100&width=100",
        joinDate: new Date().toISOString().split("T")[0],
        totalDonated: 0,
        donationCount: 0,
        favoriteCategories: [],
        interests: [],
        role: data.role as any,
        organizationName: data.organizationName,
        organizationType: data.organizationType,
        isVerified: false,
        isEmailVerified: false,
        documentsVerified: false,
    }

    mockData.users.push(newUser)

    const authUser: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        avatar: newUser.avatar,
        phone: newUser.phone,
        organizationName: newUser.organizationName,
        organizationType: newUser.organizationType,
        isVerified: newUser.isVerified,
    }

    const token = generateToken(authUser)
    return { user: authUser, token }
}
