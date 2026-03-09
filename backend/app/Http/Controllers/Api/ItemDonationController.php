<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemDonation;
use App\Models\DonationRequest;
use App\Models\PointsTransaction;
use App\Enums\ItemDonationStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ItemDonationController extends Controller
{
    /**
     * Submit item donation (donor).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'donation_request_id' => ['required', 'exists:donation_requests,id'],
            'items_needed' => ['required', 'string', 'max:2000'],
            'estimated_value' => ['required', 'numeric', 'min:0'],
            'evidence_images' => ['required', 'array', 'min:1', 'max:5'],
            'evidence_images.*' => ['string'], // base64 data URL
            'delivery_method' => ['nullable', 'string', 'in:send-to-address,drop-off'],
            'delivery_date' => ['nullable', 'date'],
            'delivery_time' => ['nullable', 'string'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $donationRequest = DonationRequest::findOrFail($validated['donation_request_id']);
        if (!$donationRequest->accepts_items) {
            return response()->json(['message' => 'คำขอนี้ไม่รับบริจาคสิ่งของ'], 422);
        }

        $imagePaths = [];
        foreach ($validated['evidence_images'] as $idx => $dataUrl) {
            if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $dataUrl, $matches)) {
                $ext = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
                $data = base64_decode($matches[2]);
                if ($data) {
                    $path = 'item-donations/' . Str::uuid() . '.' . $ext;
                    Storage::disk('public')->put($path, $data);
                    $imagePaths[] = $path;
                }
            }
        }
        if (empty($imagePaths)) {
            return response()->json(['message' => 'รูปหลักฐานไม่ถูกต้อง'], 422);
        }

        $itemDonation = ItemDonation::create([
            'donation_request_id' => $validated['donation_request_id'],
            'donor_id' => $request->user()->id,
            'items_needed' => $validated['items_needed'],
            'estimated_value' => (float) $validated['estimated_value'],
            'evidence_images' => $imagePaths,
            'delivery_method' => $validated['delivery_method'] ?? null,
            'delivery_date' => $validated['delivery_date'] ?? null,
            'delivery_time' => $validated['delivery_time'] ?? null,
            'tracking_number' => $validated['tracking_number'] ?? null,
            'message' => $validated['message'] ?? null,
            'status' => ItemDonationStatus::PENDING_REVIEW,
        ]);

        return response()->json([
            'message' => 'ส่งแจ้งบริจาคสำเร็จ',
            'data' => $itemDonation->load(['donationRequest:id,title', 'donor:id,first_name,last_name']),
        ], 201);
    }
}
