<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VolunteerApplication;
use App\Models\DonationRequest;
use App\Models\PointsTransaction;
use App\Enums\VolunteerStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VolunteerApplicationController extends Controller
{
    /**
     * Submit volunteer application.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'donation_request_id' => ['required', 'exists:donation_requests,id'],
            'message' => ['nullable', 'string', 'max:2000'],
            'skills' => ['required', 'array', 'min:1'],
            'skills.*' => ['string'],
            'skill_details' => ['nullable', 'string', 'max:2000'],
            'experience' => ['nullable', 'string', 'max:500'],
            'available_dates' => ['required', 'array', 'min:1'],
            'available_dates.*' => ['string', 'date'],
            'preferred_time' => ['nullable', 'string'],
            'duration' => ['nullable', 'string'],
            'estimated_hours' => ['nullable', 'integer', 'min:1'],
            'volunteer_phone' => ['nullable', 'string'],
            'volunteer_email' => ['nullable', 'email'],
            'age' => ['nullable', 'integer', 'min:18'],
            'emergency_contact' => ['nullable', 'string'],
            'emergency_phone' => ['nullable', 'string'],
            'has_vehicle' => ['nullable', 'boolean'],
            'vehicle_type' => ['nullable', 'string'],
        ]);

        $donationRequest = DonationRequest::findOrFail($validated['donation_request_id']);
        if (!$donationRequest->accepts_volunteer) {
            return response()->json(['message' => 'คำขอนี้ไม่รับอาสาสมัคร'], 422);
        }

        $user = $request->user();
        $app = VolunteerApplication::create([
            'id' => (string) Str::uuid(),
            'request_id' => $validated['donation_request_id'],
            'volunteer_id' => $user->id,
            'message' => $validated['message'] ?? 'สมัครอาสาสมัคร',
            'skills' => json_encode($validated['skills']),
            'skill_details' => $validated['skill_details'] ?? null,
            'experience' => $validated['experience'] ?? null,
            'availability' => null,
            'available_dates' => $validated['available_dates'],
            'preferred_time' => $validated['preferred_time'] ?? null,
            'duration' => $validated['duration'] ?? null,
            'estimated_hours' => $validated['estimated_hours'] ?? null,
            'volunteer_phone' => $validated['volunteer_phone'] ?? $user->phone,
            'volunteer_email' => $validated['volunteer_email'] ?? $user->email,
            'age' => $validated['age'] ?? null,
            'emergency_contact' => $validated['emergency_contact'] ?? null,
            'emergency_phone' => $validated['emergency_phone'] ?? null,
            'has_vehicle' => $validated['has_vehicle'] ?? false,
            'vehicle_type' => $validated['vehicle_type'] ?? null,
            'status' => VolunteerStatus::APPLIED,
        ]);

        return response()->json([
            'message' => 'ส่งสมัครสำเร็จ',
            'data' => $app->load(['request:id,title', 'volunteer:id,first_name,last_name']),
        ], 201);
    }
}
