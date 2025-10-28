import Stories from "../../../stories"

interface PageProps {
    searchParams: {
        group?: string
        story?: string
    }
}

export default function StoriesPage({ searchParams }: PageProps) {
    const groupIndex = searchParams.group ? Number.parseInt(searchParams.group) : 0
    const storyIndex = searchParams.story ? Number.parseInt(searchParams.story) : 0

    return <Stories initialGroupIndex={groupIndex} initialStoryIndex={storyIndex} />
}
