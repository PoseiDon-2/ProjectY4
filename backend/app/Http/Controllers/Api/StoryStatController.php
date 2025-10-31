<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonationRequest;
use App\Models\Story;
use App\Enums\StoryStatus;
use App\Enums\StoryType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StoryStatController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        try {
            $timeRange = $request->get('time_range', 'all'); // all, today, week, month, year

            $basicStats = $this->getBasicStats($user->id, $timeRange);
            $engagementStats = $this->getEngagementStats($user->id, $timeRange);
            $typeDistribution = $this->getTypeDistribution($user->id, $timeRange);
            $topStories = $this->getTopStories($user->id, $timeRange, 5);
            $recentActivity = $this->getRecentActivity($user->id, 10);

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => $basicStats,
                    'engagement' => $engagementStats,
                    'typeDistribution' => $typeDistribution,
                    'topStories' => $topStories,
                    'recentActivity' => $recentActivity,
                    'timeRange' => $timeRange
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching story stats: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดสถิติได้'
            ], 500);
        }
    }

    private function getBasicStats($userId, $timeRange)
    {
        $query = Story::where('author_id', $userId);
        $query = $this->applyTimeFilter($query, $timeRange, 'created_at');

        $stats = $query->selectRaw('
            COUNT(*) as total_stories,
            SUM(views) as total_views,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as published_stories,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as draft_stories,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as archived_stories
        ', [
            StoryStatus::PUBLISHED->value,
            StoryStatus::DRAFT->value,
            StoryStatus::ARCHIVED->value
        ])->first();

        $storiesPerRequest = DonationRequest::where('organizer_id', $userId)
            ->withCount(['stories' => function ($q) use ($timeRange) {
                $this->applyTimeFilter($q, $timeRange, 'created_at');
            }])
            ->get()
            ->filter(fn($r) => $r->stories_count > 0)
            ->pluck('stories_count', 'title');

        $total = (int) ($stats->total_stories ?? 0);
        $avgViews = $total > 0 ? round(($stats->total_views ?? 0) / $total, 1) : 0;

        return [
            'totalStories' => $total,
            'totalViews' => (int) ($stats->total_views ?? 0),
            'publishedStories' => (int) ($stats->published_stories ?? 0),
            'draftStories' => (int) ($stats->draft_stories ?? 0),
            'archivedStories' => (int) ($stats->archived_stories ?? 0),
            'averageViews' => $avgViews,
            'maxViews' => (int) Story::where('author_id', $userId)
                ->when($timeRange !== 'all', fn($q) => $this->applyTimeFilter($q, $timeRange, 'created_at'))
                ->max('views'),
            'storiesPerRequest' => $storiesPerRequest
        ];
    }

    private function getEngagementStats($userId, $timeRange)
    {
        $query = Story::where('author_id', $userId)
            ->where('status', StoryStatus::PUBLISHED);
        $query = $this->applyTimeFilter($query, $timeRange, 'published_at');

        $engagement = $query->selectRaw('
            COUNT(*) as total_published,
            SUM(views) as total_views,
            AVG(views) as avg_views_per_story,
            MAX(views) as best_performing_views
        ')->first();

        $totalPublished = $engagement->total_published ?? 0;
        $totalViews = $engagement->total_views ?? 0;
        $engagementRate = $totalPublished > 0 ? round($totalViews / $totalPublished, 1) : 0;

        $viewTrends = $this->getViewTrends($userId, 7);

        return [
            'totalPublished' => (int) $totalPublished,
            'totalViews' => (int) $totalViews,
            'averageViewsPerStory' => round($engagement->avg_views_per_story ?? 0, 1),
            'bestPerformingViews' => (int) ($engagement->best_performing_views ?? 0),
            'engagementRate' => $engagementRate,
            'viewTrends' => $viewTrends
        ];
    }

    private function getTypeDistribution($userId, $timeRange)
    {
        $query = Story::where('author_id', $userId);
        $query = $this->applyTimeFilter($query, $timeRange, 'created_at');

        $distribution = $query->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->mapWithKeys(fn($item) => [
                $item->type => [
                    'count' => $item->count,
                    'label' => $this->getTypeLabel($item->type)
                ]
            ])->toArray();

        $allTypes = [
            'progress' => 'ความคืบหน้า',
            'milestone' => 'เหตุการณ์สำคัญ',
            'thank_you' => 'ขอบคุณ',
            'completion' => 'เสร็จสิ้น'
        ];

        foreach ($allTypes as $type => $label) {
            if (!isset($distribution[$type])) {
                $distribution[$type] = ['count' => 0, 'label' => $label];
            }
        }

        return $distribution;
    }

    private function getTopStories($userId, $timeRange, $limit = 5)
    {
        $query = Story::with(['donationRequest:id,title'])
            ->where('author_id', $userId)
            ->where('status', StoryStatus::PUBLISHED)
            ->orderBy('views', 'desc')
            ->limit($limit);

        $query = $this->applyTimeFilter($query, $timeRange, 'published_at');

        return $query->get()->map(function ($story) {
            return [
                'id' => $story->id,
                'title' => $story->title,
                'views' => $story->views,
                'type' => $story->type,
                'typeText' => $this->getTypeLabel($story->type),
                'duration' => $story->duration,
                'publishedAt' => $story->published_at?->format('d/m/Y H:i'),
                'donationRequest' => $story->donationRequest?->only(['id', 'title']),
                'imageUrl' => $story->images[0] ?? null
            ];
        })->toArray();
    }

    private function getRecentActivity($userId, $limit = 10)
    {
        return Story::with(['donationRequest:id,title'])
            ->where('author_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($story) {
                return [
                    'id' => $story->id,
                    'title' => $story->title,
                    'status' => $story->status,
                    'statusText' => $this->getStatusLabel($story->status),
                    'type' => $story->type,
                    'typeText' => $this->getTypeLabel($story->type),
                    'views' => $story->views,
                    'createdAt' => $story->created_at->format('d/m/Y H:i'),
                    'donationRequest' => $story->donationRequest?->only(['id', 'title']),
                    'imageUrl' => $story->images[0] ?? null
                ];
            })->toArray();
    }

    /**
     * ปรับปรุง: ใช้ views จริงจาก recordView() + จำลองตาม published_at
     */
    private function getViewTrends($userId, $days = 7)
    {
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();

        // ดึง views ตามวันที่เผยแพร่
        $trends = Story::where('author_id', $userId)
            ->where('status', StoryStatus::PUBLISHED)
            ->where('published_at', '>=', $startDate)
            ->selectRaw('DATE(published_at) as date, SUM(views) as total_views')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(fn($item) => [$item->date => (int) $item->total_views])
            ->toArray();

        $result = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i)->format('Y-m-d');
            $result[] = [
                'date' => $date,
                'formattedDate' => Carbon::parse($date)->format('d/m'),
                'views' => $trends[$date] ?? 0
            ];
        }

        return $result;
    }

    /**
     * ปรับปรุง: รองรับ `today` และเลือก field ที่จะกรอง
     */
    private function applyTimeFilter($query, $timeRange, $column = 'created_at')
    {
        $now = Carbon::now();

        return match ($timeRange) {
            'today' => $query->whereDate($column, $now->toDateString()),
            'week'  => $query->where($column, '>=', $now->copy()->startOfWeek()),
            'month' => $query->where($column, '>=', $now->copy()->startOfMonth()),
            'year'  => $query->where($column, '>=', $now->copy()->startOfYear()),
            default => $query // 'all'
        };
    }

    private function getTypeLabel($type)
    {
        return match ($type) {
            'progress' => 'ความคืบหน้า',
            'milestone' => 'เหตุการณ์สำคัญ',
            'thank_you' => 'ขอบคุณ',
            'completion' => 'เสร็จสิ้น',
            default => ucfirst($type)
        };
    }

    private function getStatusLabel($status)
    {
        return match ($status) {
            StoryStatus::DRAFT->value => 'ฉบับร่าง',
            StoryStatus::PUBLISHED->value => 'เผยแพร่แล้ว',
            StoryStatus::ARCHIVED->value => 'เก็บถาวร',
            default => $status
        };
    }

    public function show($id)
    {
        $user = Auth::user();

        try {
            $story = Story::with(['donationRequest'])
                ->where('id', $id)
                ->where('author_id', $user->id)
                ->first();

            if (!$story) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบ Story'
                ], 404);
            }

            $comparison = $this->getPerformanceComparison($story, $user->id);

            return response()->json([
                'success' => true,
                'data' => [
                    'story' => [
                        'id' => $story->id,
                        'title' => $story->title,
                        'content' => $story->content,
                        'type' => $story->type,
                        'typeText' => $this->getTypeLabel($story->type),
                        'status' => $story->status,
                        'statusText' => $this->getStatusLabel($story->status),
                        'views' => $story->views,
                        'duration' => $story->duration,
                        'publishedAt' => $story->published_at?->format('d/m/Y H:i'),
                        'createdAt' => $story->created_at->format('d/m/Y H:i'),
                        'imageUrl' => $story->images[0] ?? null,
                        'donationRequest' => $story->donationRequest?->only(['id', 'title'])
                    ],
                    'performance' => $comparison
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching story detail stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดรายละเอียดได้'
            ], 500);
        }
    }

    private function getPerformanceComparison($story, $userId)
    {
        $avgViews = Story::where('author_id', $userId)
            ->where('status', StoryStatus::PUBLISHED)
            ->where('type', $story->type)
            ->avg('views') ?: 1;

        $ratio = $story->views / $avgViews;
        $percentage = round(($ratio - 1) * 100, 1);

        return [
            'storyViews' => $story->views,
            'averageViews' => round($avgViews, 1),
            'performanceRatio' => round($ratio, 2),
            'performancePercentage' => $percentage,
            'performanceStatus' => $percentage >= 0 ? 'aboveAverage' : 'belowAverage'
        ];
    }
}