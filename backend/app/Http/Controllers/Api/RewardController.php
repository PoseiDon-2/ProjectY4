<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PointsTransaction;
use App\Models\Reward;
use App\Models\RewardCatalog;
use Illuminate\Http\Request;

class RewardController extends Controller
{
    /**
     * GET /rewards - รายการรางวัลที่เปิดให้แลก (is_active, เหลือจำนวนถ้า limited)
     */
    public function index()
    {
        $items = RewardCatalog::where('is_active', true)
            ->orderBy('points_cost')
            ->get();

        $list = $items->filter(function ($r) {
            if ($r->is_limited && ($r->remaining_quantity === null || (int) $r->remaining_quantity <= 0)) {
                return false;
            }
            return true;
        })->map(fn ($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'description' => $r->description,
            'category' => $r->category,
            'pointsCost' => (int) $r->points_cost,
            'image' => $r->image,
            'isActive' => true,
            'isLimited' => (bool) $r->is_limited,
            'limitQuantity' => $r->limit_quantity,
            'remainingQuantity' => $r->remaining_quantity,
            'requirements' => $r->requirements ?? (object) [],
            'createdBy' => 'system',
            'createdAt' => $r->created_at?->toIso8601String(),
        ])->values()->all();

        return response()->json($list);
    }

    /**
     * GET /me/rewards - รายการรางวัลที่ user แลกไปแล้ว (auth)
     */
    public function myRewards(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $rows = Reward::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        $list = $rows->map(fn ($r) => [
            'id' => $r->id,
            'rewardId' => $r->reward_id,
            'isActive' => (bool) $r->is_active,
            'purchasedAt' => $r->created_at?->toIso8601String(),
        ])->values()->all();

        return response()->json($list);
    }

    /**
     * POST /rewards/redeem - แลกรางวัล (auth)
     */
    public function redeem(Request $request)
    {
        $request->validate([
            'reward_id' => ['required', 'string', 'max:100'],
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $catalog = RewardCatalog::find($request->reward_id);
        if (!$catalog) {
            return response()->json(['message' => 'ไม่พบรางวัล'], 404);
        }
        if (!$catalog->is_active) {
            return response()->json(['message' => 'รางวัลนี้ปิดการแลกแล้ว'], 422);
        }
        if ($catalog->is_limited && ($catalog->remaining_quantity === null || (int) $catalog->remaining_quantity <= 0)) {
            return response()->json(['message' => 'รางวัลนี้หมดแล้ว'], 422);
        }

        $cost = (int) $catalog->points_cost;
        if ($cost <= 0) {
            return response()->json(['message' => 'รางวัลไม่ถูกต้อง'], 422);
        }

        $transactions = PointsTransaction::where('user_id', $user->id)->get();
        $totalPoints = (int) $transactions->where('type', 'earned')->sum('amount');
        $spentPoints = (int) $transactions->where('type', 'spent')->sum('amount');
        $availablePoints = $totalPoints - $spentPoints;

        if ($availablePoints < $cost) {
            return response()->json([
                'message' => 'คะแนนไม่เพียงพอ',
                'availablePoints' => max(0, $availablePoints),
            ], 422);
        }

        \DB::transaction(function () use ($user, $catalog, $cost) {
            PointsTransaction::create([
                'id' => 'ptx_' . uniqid(),
                'user_id' => $user->id,
                'type' => 'spent',
                'amount' => $cost,
                'source' => 'reward',
                'description' => 'แลก: ' . $catalog->name,
                'date' => now(),
                'related_id' => $catalog->id,
            ]);

            if ($catalog->is_limited && $catalog->remaining_quantity !== null) {
                $catalog->decrement('remaining_quantity');
            }

            Reward::create([
                'id' => 'ur_' . uniqid(),
                'user_id' => $user->id,
                'reward_id' => $catalog->id,
                'is_active' => true,
            ]);
        });

        $newAvailable = $availablePoints - $cost;

        return response()->json([
            'success' => true,
            'availablePoints' => max(0, $newAvailable),
            'message' => 'แลกรางวัลสำเร็จ',
        ]);
    }

    private function getUserLevel(string $userId): array
    {
        $transactions = PointsTransaction::where('user_id', $userId)->get();
        $totalPoints = (int) $transactions->where('type', 'earned')->sum('amount');
        $levels = [
            ['level' => 1, 'minPoints' => 0],
            ['level' => 2, 'minPoints' => 100],
            ['level' => 3, 'minPoints' => 500],
            ['level' => 4, 'minPoints' => 1000],
            ['level' => 5, 'minPoints' => 2500],
            ['level' => 6, 'minPoints' => 5000],
        ];
        $level = collect($levels)->sortByDesc('minPoints')->first(fn ($l) => $totalPoints >= $l['minPoints']) ?? $levels[0];
        return $level;
    }
}
