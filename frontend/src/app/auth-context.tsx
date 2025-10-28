'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Donation {
    id: string
    requestId: string
    requestTitle: string
    type: "money" | "item"
    date: string
    status: "completed" | "pending" | "shipped" | "received" | "cancelled"
    amount?: number
    items?: { name: string; quantity: number; status?: string }[]
    paymentMethod?: string
    trackingNumber?: string
}

interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string
    avatar?: string
    joinDate: string
    totalDonated: number
    donationCount: number
    favoriteCategories: string[]
    interests: string[]
    role: "user" | "organizer" | "admin"  // เปลี่ยนเป็น lowercase
    organizationName?: string
    organizationType?: string
    isVerified: boolean
    isEmailVerified: boolean
    documentsVerified?: boolean
    donations: Donation[]
}

interface AuthContextType {
    user: User | null
    login: (email: string, password: string) => Promise<boolean>
    register: (payload: RegisterPayload) => Promise<boolean>
    sendOTP: (email: string) => Promise<boolean>
    verifyOTP: (email: string, otp: string) => Promise<boolean>
    logout: () => void
    isLoading: boolean
    fetchUser: () => Promise<void>
}

interface RegisterData {
    email: string
    password: string
    firstName: string
    lastName: string
    phone: string
    role: "user" | "organizer"
    organizationName?: string
    organizationType?: string
    interests?: string[]
    documents?: {
        idCard: File | null
        organizationCert: File | null
    }
}

type RegisterPayload = RegisterData | FormData

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const setAuthToken = (token: string) => {
        localStorage.setItem('auth_token', token)
    }

    const getAuthToken = () => {
        return localStorage.getItem('auth_token')
    }

    const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
        const token = getAuthToken()
        const headers = new Headers(options.headers || {})
        if (token) {
            headers.set('Authorization', `Bearer ${token}`)
        }
        headers.set('Accept', 'application/json')

        return fetch(`${API_BASE}${url}`, { ...options, headers })
    }

    const fetchUser = async () => {
        setIsLoading(true)
        try {
            const res = await fetchWithAuth('/auth/me')
            if (res.ok) {
                const data = await res.json()

                // แปลง role
                const mappedRole = (() => {
                    const role = data.role.toUpperCase()
                    if (role === 'DONOR') return 'user'
                    if (role === 'ORGANIZATION' || role === 'ORGANIZER') return 'organizer'
                    if (role === 'ADMIN') return 'admin'
                    return 'user'
                })()

                const donationsRes = await fetchWithAuth('/auth/donations')
                const donations = donationsRes.ok ? await donationsRes.json() : []

                // แปลง interests ถ้าเป็น string
                let interests: string[] = []
                if (typeof data.interests === 'string') {
                    try {
                        interests = JSON.parse(data.interests)
                    } catch (e) {
                        console.error("Failed to parse interests:", e)
                        interests = []
                    }
                } else {
                    interests = data.interests ?? []
                }

                setUser({
                    ...data,
                    role: mappedRole,
                    donations,
                    favoriteCategories: data.favoriteCategories ?? [],
                    interests,
                })
            } else {
                setUser(null)
            }
        } catch (err) {
            console.error('Failed to fetch user:', err)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    // เรียก fetchUser เมื่อมี token (ไม่ต้องรอ user)
    useEffect(() => {
        const token = getAuthToken()
        if (token) {
            fetchUser()
        } else {
            setUser(null)
            setIsLoading(false)
        }
    }, [])  // เรียกแค่ครั้งเดียวตอน mount

    const login = async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true)
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            if (res.ok) {
                const data = await res.json()
                setAuthToken(data.access_token)
                await fetchUser()
                return true
            }
            return false
        } catch {
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const sendOTP = async (email: string): Promise<boolean> => {
        setIsLoading(true)
        try {
            const res = await fetch(`${API_BASE}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            return res.ok
        } catch (err) {
            console.error("Error:", err)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
        setIsLoading(true)
        try {
            const res = await fetch(`${API_BASE}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            })
            const data = await res.json()
            return res.ok && data.message === 'OTP ถูกต้อง'
        } catch (err) {
            console.error("OTP verify error:", err)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (payload: RegisterPayload): Promise<boolean> => {
        setIsLoading(true)
        try {
            const isFormData = payload instanceof FormData
            const formData = isFormData ? payload : new FormData()

            if (!isFormData) {
                const data = payload as RegisterData
                formData.append('email', data.email)
                formData.append('password', data.password)
                formData.append('firstName', data.firstName)
                formData.append('lastName', data.lastName)
                formData.append('phone', data.phone)
                formData.append('role', data.role === 'organizer' ? 'organization' : 'user')

                if (data.role === 'organizer') {
                    formData.append('organizationName', data.organizationName!)
                    formData.append('organizationType', data.organizationType!)
                    if (data.documents?.idCard) formData.append('id_card', data.documents.idCard)
                    if (data.documents?.organizationCert) formData.append('org_cert', data.documents.organizationCert)
                }

                data.interests?.forEach(i => formData.append('interests[]', i))
            }

            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (res.ok) {
                const email = isFormData ? formData.get('email') : (payload as RegisterData).email
                const password = isFormData ? formData.get('password') : (payload as RegisterData).password
                return await login(email as string, password as string)
            } else {
                console.error("Register failed:", data)
                return false
            }
        } catch (err) {
            console.error("Register error:", err)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            await fetchWithAuth('/auth/logout', { method: 'POST' })
        } catch (err) {
            console.error("Logout API failed:", err)
        }

        localStorage.removeItem('auth_token')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, register, sendOTP, verifyOTP, logout, isLoading, fetchUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}