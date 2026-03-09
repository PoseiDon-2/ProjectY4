<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function show($id)
    {
        // 1. ดึงข้อมูลผู้ใช้พร้อมข้อมูลที่เกี่ยวข้อง (เช่น stories)
        $user = User::with('stories')->find($id);

        // 2. ถ้าไม่พบผู้ใช้ ส่งกลับ 404
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // 3. ปรับโครงสร้างข้อมูล (Transformation) ให้ตรงกับที่ Frontend ต้องการ
        // สมมติว่า Model ของคุณมีชื่อฟิลด์ต่างจากนี้ ให้ปรับแก้ตรงนี้ครับ
        $formattedUser = [
            'id' => $user->id,
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
            'avatar' => $user->avatar_url ?? '/placeholder.svg',
            'bio' => $user->bio,
            'joinDate' => $user->created_at->format('Y-m-d'),
            'location' => $user->location,
            'totalDonated' => $user->total_donated ?? 0,
            'donationCount' => $user->donation_count ?? 0,
            'interests' => $user->interests ?? [], // เก็บเป็น Array
            'socials' => [
                'facebook' => $user->facebook_url,
                'instagram' => $user->instagram_url,
                'website' => $user->website_url,
            ],
            'stories' => $user->stories->map(function ($story) {
                return [
                    'id' => $story->id,
                    'title' => $story->title,
                    'content' => $story->content,
                    'date' => $story->created_at->format('Y-m-d'),
                    'image' => $story->image_url ?? '/placeholder.svg',
                ];
            }),
        ];

        // 4. ส่งข้อมูลกลับเป็น JSON
        return response()->json($formattedUser);
    }
}