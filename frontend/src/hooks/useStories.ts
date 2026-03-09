// hooks/useStories.ts
import { useState, useEffect, useCallback } from 'react';

export interface Story {
    id: number | string;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const VIEWED_KEY = 'viewed_stories';

export const useStories = () => {
    const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // โหลด viewed stories จาก localStorage
    const getViewedSet = useCallback((): Set<string> => {
        try {
            const stored = localStorage.getItem(VIEWED_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    }, []);

    const transformApiData = useCallback((apiStories: any[], viewed: Set<string>): StoryGroup[] => {
        const groupsMap = new Map<number, StoryGroup>();

        apiStories.forEach((apiStory) => {
            if (apiStory.status !== 'PUBLISHED') return;

            const donationRequestId = apiStory.donation_request_id;
            const storyIdStr = String(apiStory.id);

            if (!groupsMap.has(donationRequestId)) {
                groupsMap.set(donationRequestId, {
                    donationRequestId,
                    donationTitle: apiStory.donation_request?.title || 'Unknown',
                    organizer: apiStory.donation_request?.organizer?.name || `User ${apiStory.author_id}`,
                    avatar: apiStory.donation_request?.organizer?.avatar || 'https://via.placeholder.com/400?text=No+Avatar',
                    stories: [],
                    hasUnviewed: false,
                });
            }

            const group = groupsMap.get(donationRequestId)!;

            const story: Story = {
                id: apiStory.id, // เก็บเป็นเดิม ไม่ parseInt ถ้าเป็น string
                donationRequestId,
                title: apiStory.title || '',
                type: apiStory.type || 'progress',
                content: apiStory.content || '',
                image: Array.isArray(apiStory.images) ? apiStory.images[0] : (apiStory.image || 'https://via.placeholder.com/400x300?text=No+Image'),
                timestamp: apiStory.published_at || apiStory.created_at || new Date().toISOString(),
                author: apiStory.donation_request?.organizer?.name || `User ${apiStory.author_id}`,
                isViewed: viewed.has(storyIdStr),
                duration: Number(apiStory.duration) || 5,
            };

            group.stories.push(story);

            if (!story.isViewed) {
                group.hasUnviewed = true;
            }
        });

        // Sort
        groupsMap.forEach((group) => {
            group.stories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });

        return Array.from(groupsMap.values()).sort((a, b) => {
            const aTime = new Date(a.stories[0]?.timestamp || 0).getTime();
            const bTime = new Date(b.stories[0]?.timestamp || 0).getTime();
            return bTime - aTime;
        });
    }, []);

    const loadStories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE_URL}/stories`, { headers });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const viewed = getViewedSet();
            const transformed = transformApiData(data.data || data || [], viewed);

            setStoryGroups(transformed);
        } catch (err: any) {
            setError(err.message || 'โหลด Stories ไม่สำเร็จ');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [transformApiData, getViewedSet]);

    const recordView = useCallback(async (storyId: string | number) => {
        const storyIdStr = String(storyId);
        const viewed = getViewedSet();

        if (viewed.has(storyIdStr)) return; // already viewed

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            await fetch(`${API_BASE_URL}/stories/${storyId}/view`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            // Update local viewed
            viewed.add(storyIdStr);
            localStorage.setItem(VIEWED_KEY, JSON.stringify(Array.from(viewed)));

            // Update state
            setStoryGroups(prev =>
                prev.map(group => ({
                    ...group,
                    stories: group.stories.map(s =>
                        String(s.id) === storyIdStr ? { ...s, isViewed: true } : s
                    ),
                    hasUnviewed: group.stories.some(s => String(s.id) !== storyIdStr && !s.isViewed),
                }))
            );
        } catch (err) {
            console.error('Record view failed:', err);
        }
    }, [getViewedSet]);

    useEffect(() => {
        loadStories();
    }, [loadStories]);

    return {
        storyGroups,
        loading,
        error,
        refetch: loadStories,
        recordView,
    };
};