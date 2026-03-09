<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PointsTransaction;
use Illuminate\Http\Request;

/**
 * คะแนนสะสมของผู้ใช้ (จาก points_transactions)
 * คำนวณ totalPoints, availablePoints, level จาก transactions
 */
class PointsController extends Controller
{
    private const USER_LEVELS = [
        ['level' => 1, 'name' => 'ผู้เริ่มต้น', 'minPoints' => 0],
        ['level' => 2, 'name' => 'ผู้ช่วยเหลือ', 'minPoints' => 100],
        ['level' => 3, 'name' => 'ผู้มีจิตใจดี', 'minPoints' => 500],
        ['level' => 4, 'name' => 'นักบุญแห่งการให้', 'minPoints' => 1000],
        ['level' => 5, 'name' => 'ทูตแห่งความดี', 'minPoints' => 2500],
        ['level' => 6, 'name' => 'ตำนานแห่งการบริจาค', 'minPoints' => 5000],
    ];

    private const DONOR_TRUST_NAMES = [
        1 => 'เริ่มต้น',
        2 => 'ผู้ให้สม่ำเสมอ',
        3 => 'ผู้สนับสนุนที่น่าเชื่อถือ',
        4 => 'พันธมิตรผู้ให้',
        5 => 'มาตรฐานทอง',
    ];

    private const ORGANIZER_TRUST_NAMES = [
        1 => 'เริ่มต้น',
        2 => 'ได้รับความไว้วางใจ',
        3 => 'ผู้รับที่เชื่อถือได้',
        4 => 'พันธมิตรความดี',
        5 => 'มาตรฐานทอง',
    ];

    private function donorTrustLevelName(int $level): string
    {
        return self::DONOR_TRUST_NAMES[$level] ?? 'เริ่มต้น';
    }

    private function organizerTrustLevelName(int $level): string
    {
        return self::ORGANIZER_TRUST_NAMES[$level] ?? 'เริ่มต้น';
    }

    public function getLevel(int $totalPoints): array
    {
        $levels = collect(self::USER_LEVELS)->sortByDesc('minPoints');
        $level = $levels->first(fn($l) => $totalPoints >= $l['minPoints']) ?? self::USER_LEVELS[0];
        $nextLevel = collect(self::USER_LEVELS)->first(fn($l) => $l['minPoints'] > $totalPoints);
        return [
            ...$level,
            'nextLevelPoints' => $nextLevel ? $nextLevel['minPoints'] - $totalPoints : 0,
            'progress' => $nextLevel
                ? (($totalPoints - $level['minPoints']) / ($nextLevel['minPoints'] - $level['minPoints'])) * 100
                : 100,
        ];
    }

    /**
     * ดึงคะแนนและประวัติของผู้ใช้ที่ login อยู่
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $transactions = PointsTransaction::where('user_id', $user->id)
            ->orderByDesc('date')
            ->limit(100)
            ->get();

        $totalPoints = (int) $transactions->where('type', 'earned')->sum('amount');
        $spentPoints = (int) $transactions->where('type', 'spent')->sum('amount');
        $availablePoints = $totalPoints - $spentPoints;

        $levelInfo = $this->getLevel($totalPoints);

        $pointsHistory = $transactions->map(fn($t) => [
            'id' => $t->id,
            'type' => $t->type,
            'amount' => $t->amount,
            'source' => $t->source,
            'description' => $t->description,
            'date' => $t->date?->toIso8601String() ?? $t->date,
            'relatedId' => $t->related_id,
        ])->values()->all();

        $user->refresh();
        return response()->json([
            'userId' => $user->id,
            'totalPoints' => $totalPoints,
            'availablePoints' => max(0, $availablePoints),
            'level' => $levelInfo['level'],
            'levelName' => $levelInfo['name'],
            'nextLevelPoints' => $levelInfo['nextLevelPoints'],
            'pointsHistory' => $pointsHistory,
            'donorTrustLevel' => (int) ($user->donor_trust_level ?? 1),
            'donorTrustLevelName' => $this->donorTrustLevelName($user->donor_trust_level ?? 1),
            'organizerTrustLevel' => (int) ($user->organizer_trust_level ?? 1),
            'organizerTrustLevelName' => $this->organizerTrustLevelName($user->organizer_trust_level ?? 1),
        ]);
    }

    /**
     * ใช้คะแนน (แลกรางวัล)
     */
    public function spend(Request $request)
    {
        $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
            'source' => ['required', 'string', 'max:50'],
            'description' => ['required', 'string', 'max:500'],
            'related_id' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $transactions = PointsTransaction::where('user_id', $user->id)->get();
        $totalPoints = (int) $transactions->where('type', 'earned')->sum('amount');
        $spentPoints = (int) $transactions->where('type', 'spent')->sum('amount');
        $availablePoints = $totalPoints - $spentPoints;

        if ($availablePoints < $request->amount) {
            return response()->json([
                'message' => 'คะแนนไม่เพียงพอ',
                'availablePoints' => max(0, $availablePoints),
            ], 422);
        }

        PointsTransaction::create([
            'id' => 'ptx_' . uniqid(),
            'user_id' => $user->id,
            'type' => 'spent',
            'amount' => $request->amount,
            'source' => $request->source,
            'description' => $request->description,
            'date' => now(),
            'related_id' => $request->related_id,
        ]);

        $newAvailable = $availablePoints - $request->amount;

        return response()->json([
            'success' => true,
            'availablePoints' => max(0, $newAvailable),
            'message' => 'แลกคะแนนสำเร็จ',
        ]);
    }
}
