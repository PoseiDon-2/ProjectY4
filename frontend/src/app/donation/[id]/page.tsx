import DonationDetail from "../../../../donation-detail"

interface PageProps {
    params: {
        id: string
    }
}

export default function DonationDetailPage({ params }: PageProps) {
    return <DonationDetail id={params.id} />
}
