import EnhancedDonationDetail from "@/components/enhanced-donation-detail"

interface PageProps {
    params: {
        id: string
    }
}

export default function EnhancedDonationDetailPage({ params }: PageProps) {
    return <EnhancedDonationDetail id={Number.parseInt(params.id)} />
}
