<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonationRequest;
use App\Models\Favorite;
use App\Enums\DonationRequestStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class FavoriteController extends Controller
{
    /**
     * รายการคำขอบริจาคที่ user ถูกใจ
     */
    public function index()
    {
        $userId = Auth::id();
        $favorites = Favorite::where('user_id', $userId)
            ->with(['request' => function ($q) {
                $q->with(['category:id,name', 'organizer:id,first_name,last_name,organization_name']);
            }])
            ->orderByDesc('created_at')
            ->get();

        $list = $favorites->map(function (Favorite $f) {
            $req = $f->request;
            if (!$req) {
                return null;
            }
            return $this->formatDonationRequestForFrontend($req);
        })->filter()->values();

        return response()->json(['data' => $list]);
    }

    /**
     * เพิ่มรายการที่สนใจ
     */
    public function store(Request $request)
    {
        $request->validate(['request_id' => 'required|string|uuid']);

        $userId = Auth::id();
        $requestId = $request->input('request_id');

        $donationRequest = DonationRequest::find($requestId);
        if (!$donationRequest) {
            return response()->json(['message' => 'ไม่พบคำขอบริจาค'], 404);
        }
        if ($donationRequest->status !== DonationRequestStatus::APPROVED) {
            return response()->json(['message' => 'คำขอนี้ยังไม่เปิดรับการสนับสนุน'], 422);
        }

        $existing = Favorite::where('user_id', $userId)->where('request_id', $requestId)->first();
        if ($existing) {
            return response()->json(['message' => 'อยู่ในรายการที่สนใจแล้ว', 'data' => []], 200);
        }

        Favorite::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'request_id' => $requestId,
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'เพิ่มลงรายการที่สนใจแล้ว'], 201);
    }

    /**
     * ลบออกจากรายการที่สนใจ
     */
    public function destroy(string $request_id)
    {
        $userId = Auth::id();
        $deleted = Favorite::where('user_id', $userId)->where('request_id', $request_id)->delete();

        if ($deleted) {
            return response()->json(['message' => 'ลบออกจากรายการที่สนใจแล้ว']);
        }
        return response()->json(['message' => 'ไม่พบรายการในรายการที่สนใจ'], 404);
    }

    private function formatDonationRequestForFrontend(DonationRequest $req): array
    {
        $categoryName = $req->category ? $req->category->name : null;
        $organizer = $req->organizer;
        $organizerName = $organizer
            ? ($organizer->organization_name ?? trim(($organizer->first_name ?? '') . ' ' . ($organizer->last_name ?? '')))
            : null;

        $images = $req->images;
        $imageUrl = null;
        if (is_array($images) && count($images) > 0) {
            $first = $images[0];
            $imageUrl = is_string($first) ? $first : ($first['url'] ?? $first['src'] ?? null);
        }

        $goal = (float) ($req->goal_amount ?? $req->target_amount ?? 0);
        $current = (float) ($req->current_amount ?? 0);
        $supporters = (int) ($req->supporters ?? 0);

        $daysLeft = null;
        if ($req->expires_at) {
            $daysLeft = max(0, (int) now()->diffInDays($req->expires_at, false));
        }

        return [
            'id' => $req->id,
            'title' => $req->title,
            'description' => $req->description ?? '',
            'category' => $categoryName,
            'location' => $req->location ?? '',
            'goal_amount' => $goal,
            'current_amount' => $current,
            'goalAmount' => $goal,
            'currentAmount' => $current,
            'supporters' => $supporters,
            'images' => $req->images,
            'image' => $imageUrl,
            'organizer' => $organizerName,
            'daysLeft' => $daysLeft,
            'status' => $req->status?->value ?? $req->status,
        ];
    }
}
