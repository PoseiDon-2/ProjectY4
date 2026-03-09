<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TrustLevelService;
use Illuminate\Http\Request;

class TrustController extends Controller
{
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

    /**
     * เลเวลความน่าเชื่อถือของตัวเอง (auth) พร้อมความคืบหน้าไประดับถัดไป
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $user->refresh();

        $service = app(TrustLevelService::class);
        $donorScore = (int) ($user->donor_trust_score ?? 0);
        $organizerScore = (int) ($user->organizer_trust_score ?? 0);
        $donorLevel = $service->getDonorTrustLevel($donorScore);
        $organizerLevel = $service->getOrganizerTrustLevel($organizerScore);

        return response()->json([
            'donorTrustLevel' => $donorLevel['level'],
            'donorTrustLevelName' => $donorLevel['name'],
            'donorTrustScore' => $donorScore,
            'donorNextLevelPoints' => $donorLevel['nextLevelPoints'] ?? 0,
            'donorNextLevelName' => $donorLevel['nextLevelName'] ?? null,
            'donorProgress' => (float) ($donorLevel['progress'] ?? 100),
            'donorIsMaxLevel' => (bool) ($donorLevel['isMaxLevel'] ?? false),
            'organizerTrustLevel' => $organizerLevel['level'],
            'organizerTrustLevelName' => $organizerLevel['name'],
            'organizerTrustScore' => $organizerScore,
            'organizerNextLevelPoints' => $organizerLevel['nextLevelPoints'] ?? 0,
            'organizerNextLevelName' => $organizerLevel['nextLevelName'] ?? null,
            'organizerProgress' => (float) ($organizerLevel['progress'] ?? 100),
            'organizerIsMaxLevel' => (bool) ($organizerLevel['isMaxLevel'] ?? false),
        ]);
    }

    /**
     * รายการระดับความน่าเชื่อถือ (สาธารณะ สำหรับหน้าอธิบาย) — อ่านจาก DB ผ่าน TrustLevelService
     */
    public function levels()
    {
        $service = app(TrustLevelService::class);
        $data = $service->getLevelsForDisplay();

        return response()->json([
            'donor' => $data['donor'] ?? [],
            'organizer' => $data['organizer'] ?? [],
        ]);
    }

    /**
     * เลเวลความน่าเชื่อถือผู้รับบริจาค (public สำหรับแสดงในการ์ดคำขอ)
     */
    public function show(string $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        return response()->json([
            'userId' => $user->id,
            'organizerTrustLevel' => (int) ($user->organizer_trust_level ?? 1),
            'organizerTrustLevelName' => self::ORGANIZER_TRUST_NAMES[$user->organizer_trust_level ?? 1] ?? 'เริ่มต้น',
        ]);
    }
}
