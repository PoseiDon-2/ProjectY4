<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrustLevelConfig;
use Illuminate\Http\Request;

class AdminTrustLevelController extends Controller
{
    /**
     * GET /admin/trust-levels - ดึงระดับทั้ง donor และ organizer (จาก DB หรือ fallback config)
     */
    public function index()
    {
        $donor = TrustLevelConfig::where('role', TrustLevelConfig::ROLE_DONOR)
            ->orderBy('sort_order')
            ->orderBy('min_score')
            ->get(['level', 'name', 'min_score', 'sort_order'])
            ->map(fn ($r) => ['level' => $r->level, 'name' => $r->name, 'min_score' => $r->min_score]);

        $organizer = TrustLevelConfig::where('role', TrustLevelConfig::ROLE_ORGANIZER)
            ->orderBy('sort_order')
            ->orderBy('min_score')
            ->get(['level', 'name', 'min_score', 'sort_order'])
            ->map(fn ($r) => ['level' => $r->level, 'name' => $r->name, 'min_score' => $r->min_score]);

        if ($donor->isEmpty()) {
            $donor = collect(config('trust.donor.levels', []))->map(fn ($d, $lvl) => [
                'level' => (int) $lvl,
                'name' => $d['name'] ?? 'ระดับ ' . $lvl,
                'min_score' => (int) ($d['min_score'] ?? 0),
            ])->values()->sortBy('min_score')->values()->all();
        } else {
            $donor = $donor->toArray();
        }
        if ($organizer->isEmpty()) {
            $organizer = collect(config('trust.organizer.levels', []))->map(fn ($d, $lvl) => [
                'level' => (int) $lvl,
                'name' => $d['name'] ?? 'ระดับ ' . $lvl,
                'min_score' => (int) ($d['min_score'] ?? 0),
            ])->values()->sortBy('min_score')->values()->all();
        } else {
            $organizer = $organizer->toArray();
        }

        return response()->json(['donor' => $donor, 'organizer' => $organizer]);
    }

    /**
     * PUT /admin/trust-levels - อัปเดตระดับ (รับ donor และ organizer arrays)
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'donor' => ['required', 'array'],
            'donor.*.level' => ['required', 'integer', 'min:1', 'max:20'],
            'donor.*.name' => ['required', 'string', 'max:100'],
            'donor.*.min_score' => ['required', 'integer', 'min:0'],
            'organizer' => ['required', 'array'],
            'organizer.*.level' => ['required', 'integer', 'min:1', 'max:20'],
            'organizer.*.name' => ['required', 'string', 'max:100'],
            'organizer.*.min_score' => ['required', 'integer', 'min:0'],
        ]);

        foreach ([TrustLevelConfig::ROLE_DONOR => $validated['donor'], TrustLevelConfig::ROLE_ORGANIZER => $validated['organizer']] as $role => $items) {
            TrustLevelConfig::where('role', $role)->delete();
            $sortOrder = 0;
            foreach ($items as $item) {
                TrustLevelConfig::create([
                    'role' => $role,
                    'level' => (int) $item['level'],
                    'name' => $item['name'],
                    'min_score' => (int) $item['min_score'],
                    'sort_order' => $sortOrder++,
                ]);
            }
        }

        return response()->json(['message' => 'อัปเดตระดับความน่าเชื่อถือเรียบร้อย']);
    }
}
