// hooks/useStories.ts
import { useState, useEffect } from 'react';

export interface Story {
    id: number;
    donationRequestId: number;
    title: string;
    type: "progress" | "milestone" | "thank_you" | "completion";
    content: string;
    image: string;
    timestamp: string;
    author: string;
    isViewed: boolean;
    duration: number;
}

export interface StoryGroup {
    donationRequestId: number;
    donationTitle: string;
    organizer: string;
    avatar: string;
    stories: Story[];
    hasUnviewed: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const useStories = () => {
    const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // แปลงข้อมูลจาก API เป็นรูปแบบที่ component ใช้
    const transformApiData = (apiStories: any[]): StoryGroup[] => {
        const groupsMap = new Map<number, StoryGroup>();

        apiStories.forEach((apiStory) => {
            if (apiStory.status !== 'PUBLISHED') return;

            const donationRequestId = apiStory.donation_request_id;

            if (!groupsMap.has(donationRequestId)) {
                groupsMap.set(donationRequestId, {
                    donationRequestId,
                    donationTitle: apiStory.donation_request?.title || 'Unknown Request',
                    organizer: apiStory.donation_request?.organizer?.name || `User${apiStory.author_id}`,
                    avatar: apiStory.donation_request?.organizer?.avatar || 'https://via.placeholder.com/400x300?text=No+Image',
                    stories: [],
                    hasUnviewed: false,
                });
            }

            const group = groupsMap.get(donationRequestId)!;
            const story: Story = {
                id: parseInt(apiStory.id),
                donationRequestId,
                title: apiStory.title,
                type: apiStory.type,
                content: apiStory.content,
                image: apiStory.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image',
                timestamp: apiStory.published_at || apiStory.created_at,
                author: apiStory.donation_request?.organizer?.name || `User${apiStory.author_id}`,
                isViewed: apiStory.views > 0,
                duration: apiStory.duration || 5, // default 5 seconds
            };

            group.stories.push(story);
            if (!story.isViewed) {
                group.hasUnviewed = true;
            }
        });

        // เรียงลำดับ stories ในแต่ละกลุ่มตามเวลา (ใหม่สุดก่อน)
        groupsMap.forEach((group) => {
            group.stories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });

        return Array.from(groupsMap.values()).sort((a, b) => {
            const aLatest = new Date(a.stories[0]?.timestamp || 0);
            const bLatest = new Date(b.stories[0]?.timestamp || 0);
            return bLatest.getTime() - aLatest.getTime();
        });
    };

    // โหลด public stories
    const loadPublicStories = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/stories`);
            if (!response.ok) {
                throw new Error(`Failed to fetch stories: ${response.status}`);
            }

            const data = await response.json();
            const transformedData = transformApiData(data.data || []);

            setStoryGroups(transformedData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load stories');
            console.error('Error loading stories:', err);
        } finally {
            setLoading(false);
        }
    };

    // บันทึกการดู story
    const recordView = async (storyId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`${API_BASE_URL}/stories/${storyId}/view`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        } catch (err) {
            console.error('Error recording view:', err);
        }
    };

    useEffect(() => {
        loadPublicStories();
    }, []);

    return {
        storyGroups,
        loading,
        error,
        refetch: loadPublicStories,
        recordView,
    };
};