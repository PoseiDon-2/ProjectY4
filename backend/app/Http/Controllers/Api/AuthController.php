<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use App\Enums\UserRole;


class AuthController extends Controller
{
    public function sendOTP(Request $request)
    {
        try {
            $request->validate(['email' => 'required|email']);

            $email = $request->email;

            // ลบ OTP เก่าก่อน (สำคัญ!)
            Cache::forget('otp_' . $email);

            $otp = rand(100000, 999999);

            Cache::put('otp_' . $email, $otp, now()->addMinutes(10));

            Log::info("OTP ใหม่สำหรับ $email: $otp");

            // ข้ามส่งเมลชั่วคราว (เพื่อทดสอบ)
            Mail::to($email)->send(new \App\Mail\SendOtpMail($otp));

            return response()->json(['message' => 'ส่ง OTP สำเร็จ']);
        } catch (\Exception $e) {
            Log::error("OTP Send Failed: " . $e->getMessage());
            return response()->json(['message' => 'ส่ง OTP ล้มเหลว'], 500);
        }
    }

    public function verifyOTP(Request $request)
    {
        $request->validate(['email' => 'required|email', 'otp' => 'required|digits:6']);

        $cached = Cache::get('otp_' . $request->email);

        Log::info("ตรวจ OTP: email={$request->email}, input={$request->otp}, cached={$cached}");

        if ($cached && $cached == $request->otp) {
            Cache::forget('otp_' . $request->email); // ลบ OTP ทันที
            return response()->json(['message' => 'OTP ถูกต้อง']);
        }

        return response()->json(['message' => 'OTP ไม่ถูกต้องหรือหมดอายุ'], 400);
    }

    public function register(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:6',
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'role' => 'required|in:user,organization',
                'interests.*' => 'nullable|string',
                'id_card' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'org_cert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            // เอา OTP check ออก! เพราะ verifyOTP() ลบแล้ว
            // $cachedOtp = Cache::get('otp_' . $request->email);
            // if (!$cachedOtp) {
            //     return response()->json(['message' => 'กรุณาขอ OTP ใหม่'], 400);
            // }

            $interests = $request->input('interests', []);
            $role = $request->role === 'organization' ? UserRole::ORGANIZER : UserRole::DONOR;

            $user = User::create([
                'id' => (string) Str::uuid(),
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'first_name' => $request->firstName,
                'last_name' => $request->lastName,
                'phone' => $request->phone,
                'role' => $role->value,
                'preferred_categories' => !empty($interests) ? json_encode($interests) : null,
                'is_email_verified' => true,
            ]);

            if ($request->role === 'organization') {
                if (!$request->hasFile('id_card') || !$request->hasFile('org_cert')) {
                    return response()->json(['message' => 'องค์กรต้องอัปโหลดเอกสารทั้ง 2 ไฟล์'], 400);
                }
                $user->id_card_url = $request->file('id_card')->store('documents', 'public');
                $user->organization_cert_url = $request->file('org_cert')->store('documents', 'public');
                $user->documents_verified = false;
                $user->save();
            }

            // ไม่ต้องลบ OTP → เพราะ verifyOTP ลบแล้ว
            // Cache::forget('otp_' . $request->email);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'สมัครสมาชิกสำเร็จ',
                'access_token' => $token,
                'user' => $user->only([
                    'id',
                    'email',
                    'first_name',
                    'last_name',
                    'phone',
                    'role',
                    'is_email_verified',
                    'documents_verified'
                ])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("Register failed: " . $e->getMessage());
            return response()->json([
                'message' => 'สมัครสมาชิกไม่สำเร็จ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required']);

        $user = User::where('email', $request->email)->first();

        if ($user && Hash::check($request->password, $user->password)) {
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'user' => $user->only(['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'organization_name', 'organization_type', 'interests'])
            ]);
        }

        return response()->json(['message' => 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'], 401);
    }

    public function me()
    {
        $user = auth('sanctum')->user();

        $role = $user->role->value;
        $mappedRole = match ($role) {
            'DONOR' => 'user',
            'ORGANIZER' => 'organization',
            'ADMIN' => 'admin',
            default => 'user',
        };

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
            'phone' => $user->phone,
            'role' => $mappedRole,  // ใช้ mappedRole
            'organizationName' => $user->organization?->name ?? null,
            'organizationType' => $user->organization?->type ?? null,
            'interests' => $user->preferred_categories ?? [],
            'isVerified' => (bool) $user->documents_verified,
            'isEmailVerified' => (bool) $user->is_email_verified,
            'joinDate' => $user->created_at->format('Y-m-d'),
            'totalDonated' => $user->total_donated,
            'donationCount' => $user->donation_count,
            'donations' => []
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'ออกจากระบบสำเร็จ']);
    }

    public function donations()
    {
        // ยังไม่มี donation จริง → ส่ง mock
        return response()->json([]);
    }
}
