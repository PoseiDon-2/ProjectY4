<?php

namespace Database\Seeders;

use App\Models\RewardCatalog;
use Illuminate\Database\Seeder;

/**
 * รางวัลสำหรับใช้ในหน้าตกแต่งโปรไฟล์
 * ID ต้องตรงกับที่ frontend ใช้: theme_*, badge_*, frame_*, title_*
 */
class RewardCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // ธีม (นอกจาก default ที่ฟรี)
            ['id' => 'theme_gold',     'name' => 'ธีมทอง',       'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ธีมสีทอง',      'category' => 'profile', 'points_cost' => 50],
            ['id' => 'theme_platinum', 'name' => 'ธีมแพลทินัม', 'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ธีมแพลทินัม', 'category' => 'profile', 'points_cost' => 100],
            ['id' => 'theme_diamond',  'name' => 'ธีมเพชร',     'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ธีมเพชร',      'category' => 'profile', 'points_cost' => 200],
            // ตรา
            ['id' => 'badge_heart',   'name' => 'หัวใจทอง', 'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ตราหัวใจ', 'category' => 'profile', 'points_cost' => 30],
            ['id' => 'badge_crown',   'name' => 'มงกุฎ',    'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ตรามงกุฎ',  'category' => 'profile', 'points_cost' => 60],
            ['id' => 'badge_star',    'name' => 'ดาวทอง',  'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ตราดาว',   'category' => 'profile', 'points_cost' => 40],
            ['id' => 'badge_diamond', 'name' => 'เพชร',    'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ตราเพชร',   'category' => 'profile', 'points_cost' => 80],
            // กรอบ (นอกจาก none ที่ฟรี)
            ['id' => 'frame_rainbow', 'name' => 'กรอบสีรุ้ง',   'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - กรอบสีรุ้ง',   'category' => 'profile', 'points_cost' => 45],
            ['id' => 'frame_fire',    'name' => 'กรอบเปลวไฟ', 'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - กรอบเปลวไฟ', 'category' => 'profile', 'points_cost' => 55],
            ['id' => 'frame_ice',     'name' => 'กรอบน้ำแข็ง',  'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - กรอบน้ำแข็ง',  'category' => 'profile', 'points_cost' => 55],
            // ตำแหน่ง (นอกจาก none ที่ฟรี)
            ['id' => 'title_helper',  'name' => 'ผู้ช่วยเหลือ', 'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ตำแหน่งผู้ช่วยเหลือ', 'category' => 'profile', 'points_cost' => 70],
            ['id' => 'title_guardian', 'name' => 'ผู้พิทักษ์',  'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ตำแหน่งผู้พิทักษ์',  'category' => 'profile', 'points_cost' => 120],
            ['id' => 'title_legend',  'name' => 'ตำนาน',      'description' => 'ใช้ในหน้าตกแต่งโปรไฟล์ - ตำแหน่งตำนาน',      'category' => 'profile', 'points_cost' => 250],
        ];

        foreach ($items as $row) {
            RewardCatalog::updateOrCreate(
                ['id' => $row['id']],
                [
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'category' => $row['category'],
                    'points_cost' => $row['points_cost'],
                    'image' => null,
                    'is_active' => true,
                    'is_limited' => false,
                    'limit_quantity' => null,
                    'remaining_quantity' => null,
                    'requirements' => null,
                ]
            );
        }
    }
}
