import EnhancedDonationDetail from "@/components/enhanced-donation-detail"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function DonationDetailPage({ params }: PageProps) {
    const { id } = await params
    return <EnhancedDonationDetail id={id} />
}
