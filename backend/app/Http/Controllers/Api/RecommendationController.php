<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class RecommendationController extends Controller
{
    public function getRecommendations(Request $request)
    {
        $userId = $request->query('user_id');
        $sessionId = $request->query('session_id');

        $query = DB::table('user_recommendations')
            ->select(
                'donation_request_id',
                'score',
                'base_tfidf_score',
                'behavior_adjust',
                'metadata'
            )
            ->where('score', '>', 0) // เฉพาะที่มีคะแนนบวก
            ->orderBy('score', 'DESC')
            ->limit(50); // จำกัดจำนวน

        // Priority: user_id ก่อน, ถ้าไม่มีใช้ session_id
        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId);
        } else {
            // ถ้าไม่มีทั้งสอง ให้ดึงทั่วไป (popular items)
            $query->whereNull('user_id')
                ->whereNull('session_id')
                ->orderBy('score', 'DESC')
                ->limit(20);
        }

        // ลบข้อมูลเก่า (older than 24 hours) ออก
        DB::table('user_recommendations')
            ->where('last_calculated_at', '<', now()->subDay())
            ->delete();

        $recommendations = $query->get();

        // ถ้าไม่มีคำแนะนำ ให้ส่ง popular items เป็น fallback
        if ($recommendations->isEmpty()) {
            $recommendations = DB::table('donation_requests')
                ->select(
                    'id as donation_request_id',
                    DB::raw('(RAND() * 100) as score'),
                    DB::raw('0 as base_tfidf_score'),
                    DB::raw('0 as behavior_adjust'),
                    DB::raw('"{\"match_source\":\"popular\"}" as metadata')
                )
                ->where('status', 'APPROVED')
                ->orderBy('created_at', 'DESC')
                ->limit(20)
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $recommendations,
            'count' => $recommendations->count()
        ]);
    }
}
