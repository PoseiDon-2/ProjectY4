"use client"

import { use } from "react"
import EnhancedDonationDetail from "@/components/enhanced-donation-detail"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default function EnhancedDonationDetailPage({ params }: PageProps) {
    const { id } = use(params)
    return <EnhancedDonationDetail id={id} />
}
