<?php

namespace App\Services;

use App\Enums\DonationRequestStatus;
use App\Enums\StoryStatus;
use App\Models\DonationRequest;
use App\Models\DonationSlip;
use App\Models\Story;
use App\Models\TrustLevelConfig;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TrustLevelService
{
    /**
     * ดึงระดับความน่าเชื่อถือจาก DB หรือ fallback config. คืนค่า [ level => ['name' => ..., 'min_score' => ...], ... ]
     */
    private function getLevelsForRole(string $role): array
    {
        $rows = TrustLevelConfig::where('role', $role)
            ->orderBy('sort_order')
            ->orderBy('min_score')
            ->get(['level', 'name', 'min_score']);

        if ($rows->isNotEmpty()) {
            $levels = [];
            foreach ($rows as $r) {
                $levels[(int) $r->level] = ['name' => $r->name, 'min_score' => (int) $r->min_score];
            }
            return $levels;
        }

        $configKey = $role === TrustLevelConfig::ROLE_ORGANIZER ? 'trust.organizer.levels' : 'trust.donor.levels';
        $fromConfig = config($configKey, []);
        return is_array($fromConfig) ? $fromConfig : [];
    }

    public function getLevelsForDisplay(): array
    {
        $donor = $this->getLevelsForRole(TrustLevelConfig::ROLE_DONOR);
        $organizer = $this->getLevelsForRole(TrustLevelConfig::ROLE_ORGANIZER);

        $donorList = [];
        foreach ($donor as $level => $data) {
            if (is_array($data)) {
                $donorList[] = ['level' => (int) $level, 'name' => $data['name'] ?? 'ระดับ ' . $level, 'min_score' => (int) ($data['min_score'] ?? 0)];
            }
        }
        usort($donorList, fn ($a, $b) => $a['min_score'] <=> $b['min_score']);

        $organizerList = [];
        foreach ($organizer as $level => $data) {
            if (is_array($data)) {
                $organizerList[] = ['level' => (int) $level, 'name' => $data['name'] ?? 'ระดับ ' . $level, 'min_score' => (int) ($data['min_score'] ?? 0)];
            }
        }
        usort($organizerList, fn ($a, $b) => $a['min_score'] <=> $b['min_score']);

        return ['donor' => $donorList, 'organizer' => $organizerList];
    }

    public function computeOrganizerTrustScore(User $user): int
    {
        $requests = DonationRequest::where('organizer_id', $user->id)->get();

        $totalReceived = (float) $requests->sum('current_amount');
        $totalSupporters = (int) $requests->sum('supporters');
        $projectsCompleted = $requests->where('status', DonationRequestStatus::COMPLETED)->count();
        $projectsWithSupport = $requests->where('supporters', '>', 0)->count();

        $config = config('trust.organizer');
        $score = 0;

        $score += (int) floor($totalReceived * ($config['score']['per_baht_received'] ?? 0.1));
        $score += $totalSupporters * ($config['score']['per_supporter'] ?? 5);
        $score += $projectsCompleted * ($config['score']['per_project_completed'] ?? 30);

        $storyCount = Story::whereHas('donationRequest', fn ($q) => $q->where('organizer_id', $user->id))
            ->where('status', StoryStatus::PUBLISHED)
            ->count();
        $score += $storyCount * ($config['score']['per_story_published'] ?? 3);

        $tracks = $config['tracks'] ?? [];
        if ($projectsCompleted >= 1 && !empty($tracks['has_completed_project_bonus'])) {
            $score += (int) $tracks['has_completed_project_bonus'];
        }

        $days = $config['days_for_frequent_updates'] ?? 90;
        $minStories = $config['min_stories_for_frequent_bonus'] ?? 3;
        $recentStories = Story::whereHas('donationRequest', fn ($q) => $q->where('organizer_id', $user->id))
            ->where('status', StoryStatus::PUBLISHED)
            ->where('created_at', '>=', now()->subDays($days))
            ->count();
        if ($recentStories >= $minStories && !empty($tracks['frequent_updater_bonus'])) {
            $score += (int) $tracks['frequent_updater_bonus'];
        }

        $minPerProject = $tracks['min_stories_per_project'] ?? 2;
        $projectsWithEnoughStories = 0;
        foreach ($requests as $req) {
            $published = $req->stories()->where('status', StoryStatus::PUBLISHED)->count();
            if ($published >= $minPerProject) {
                $projectsWithEnoughStories++;
            }
        }
        if ($projectsWithEnoughStories > 0 && !empty($tracks['frequent_updater_bonus'])) {
            $score += (int) ($tracks['frequent_updater_bonus'] / 2);
        }

        return max(0, $score);
    }

    public function getOrganizerTrustLevel(int $score): array
    {
        $levels = $this->getLevelsForRole(TrustLevelConfig::ROLE_ORGANIZER);
        if (!is_array($levels) || empty($levels)) {
            return ['level' => 1, 'name' => 'เริ่มต้น', 'nextLevelPoints' => 0, 'nextLevelName' => null, 'progress' => 100, 'isMaxLevel' => true];
        }
        krsort($levels, SORT_NUMERIC);
        $current = null;
        foreach ($levels as $level => $data) {
            if (!is_array($data)) {
                continue;
            }
            if ($score >= (int) ($data['min_score'] ?? 0)) {
                $current = ['level' => $level, 'name' => $data['name'] ?? 'ระดับ ' . $level, 'min_score' => $data['min_score'] ?? 0];
                break;
            }
        }
        if (!$current) {
            $first = reset($levels);
            $current = [
                'level' => key($levels),
                'name' => is_array($first) ? ($first['name'] ?? 'เริ่มต้น') : 'เริ่มต้น',
                'min_score' => is_array($first) ? ($first['min_score'] ?? 0) : 0,
            ];
        }

        $nextLevel = null;
        foreach ($levels as $level => $data) {
            if ((int) ($data['min_score'] ?? 0) > $score) {
                $nextLevel = ['level' => $level, 'name' => $data['name'] ?? null, 'min_score' => $data['min_score'] ?? 0];
                break;
            }
        }

        $nextThreshold = $nextLevel ? (int) $nextLevel['min_score'] - $score : 0;
        $progress = 100;
        if ($nextLevel && isset($current['min_score'])) {
            $range = (int) $nextLevel['min_score'] - (int) $current['min_score'];
            if ($range > 0) {
                $progress = (($score - (int) $current['min_score']) / $range) * 100;
                $progress = min(100, max(0, round($progress, 2)));
            }
        }

        return [
            'level' => (int) $current['level'],
            'name' => $current['name'],
            'nextLevelPoints' => $nextThreshold,
            'nextLevelName' => $nextLevel ? ($nextLevel['name'] ?? null) : null,
            'progress' => $progress,
            'isMaxLevel' => $nextLevel === null,
        ];
    }

    public function computeDonorTrustScore(User $user): int
    {
        $config = config('trust.donor');
        $score = 0;

        $totalDonated = (float) ($user->total_donated ?? 0);
        $score += (int) floor($totalDonated * ($config['score']['per_baht_donated'] ?? 0.05));

        $distinctProjects = DonationSlip::where('donor_id', $user->id)
            ->where('status', 'verified')
            ->pluck('donation_request_id')
            ->unique()
            ->count();
        $score += $distinctProjects * ($config['score']['per_project'] ?? 10);

        $days = $config['days_for_frequency'] ?? 90;
        $donationsInWindow = DonationSlip::where('donor_id', $user->id)
            ->where('status', 'verified')
            ->where('verified_at', '>=', now()->subDays($days))
            ->count();
        $score += $donationsInWindow * ($config['score']['per_donation_in_window'] ?? 2);

        return max(0, $score);
    }

    public function getDonorTrustLevel(int $score): array
    {
        $levels = $this->getLevelsForRole(TrustLevelConfig::ROLE_DONOR);
        if (!is_array($levels) || empty($levels)) {
            return ['level' => 1, 'name' => 'เริ่มต้น', 'nextLevelPoints' => 0, 'nextLevelName' => null, 'progress' => 100, 'isMaxLevel' => true];
        }
        krsort($levels, SORT_NUMERIC);
        $current = null;
        foreach ($levels as $level => $data) {
            if (!is_array($data)) {
                continue;
            }
            if ($score >= (int) ($data['min_score'] ?? 0)) {
                $current = ['level' => $level, 'name' => $data['name'] ?? 'ระดับ ' . $level, 'min_score' => $data['min_score'] ?? 0];
                break;
            }
        }
        if (!$current) {
            $first = reset($levels);
            $current = [
                'level' => key($levels),
                'name' => is_array($first) ? ($first['name'] ?? 'เริ่มต้น') : 'เริ่มต้น',
                'min_score' => is_array($first) ? ($first['min_score'] ?? 0) : 0,
            ];
        }

        $nextLevel = null;
        foreach ($levels as $level => $data) {
            if ((int) ($data['min_score'] ?? 0) > $score) {
                $nextLevel = ['level' => $level, 'name' => $data['name'] ?? null, 'min_score' => $data['min_score'] ?? 0];
                break;
            }
        }

        $nextThreshold = $nextLevel ? (int) $nextLevel['min_score'] - $score : 0;
        $progress = 100;
        if ($nextLevel && isset($current['min_score'])) {
            $range = (int) $nextLevel['min_score'] - (int) $current['min_score'];
            if ($range > 0) {
                $progress = (($score - (int) $current['min_score']) / $range) * 100;
                $progress = min(100, max(0, round($progress, 2)));
            }
        }

        return [
            'level' => (int) $current['level'],
            'name' => $current['name'],
            'nextLevelPoints' => $nextThreshold,
            'nextLevelName' => $nextLevel ? ($nextLevel['name'] ?? null) : null,
            'progress' => $progress,
            'isMaxLevel' => $nextLevel === null,
        ];
    }

    public function updateUserTrust(User $user): void
    {
        $donorScore = $this->computeDonorTrustScore($user);
        $donorLevelInfo = $this->getDonorTrustLevel($donorScore);

        $organizerScore = $this->computeOrganizerTrustScore($user);
        $organizerLevelInfo = $this->getOrganizerTrustLevel($organizerScore);

        $user->update([
            'donor_trust_score' => $donorScore,
            'donor_trust_level' => $donorLevelInfo['level'],
            'organizer_trust_score' => $organizerScore,
            'organizer_trust_level' => $organizerLevelInfo['level'],
            'trust_calculated_at' => now(),
        ]);
    }
}
