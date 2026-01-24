<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Http; // [สำคัญ] ต้องเพิ่มบรรทัดนี้
use Illuminate\Support\Facades\Log;  // [สำคัญ] ต้องเพิ่มบรรทัดนี้

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// --- ส่วนที่แก้ไขใหม่ ---
Schedule::call(function () {
    // 1. ยิง Request ไปหา Python Container
    // รูปแบบ URL: http://[ชื่อ Service ใน Docker Compose]:[Port]/[Route]
    // เราตั้งชื่อ service ว่า "recommendation-engine" และพอร์ต 5000
    
    // ตั้ง timeout ไว้ 120 วินาที กัน Python คำนวณนาน
    $response = Http::timeout(120)->get('http://recommendation-engine:5000/run');

    // 2. เตรียมข้อความ Log
    $timestamp = now()->toDateTimeString();
    $status = $response->status();
    $body = $response->body();
    
    // 3. บันทึก Log (เพื่อให้เหมือนของเดิมที่คุณเก็บลงไฟล์แยก)
    $logMessage = "[{$timestamp}] Status: {$status} | Result: {$body}";
    
    // เขียนลงไฟล์ storage/logs/recommender.log
    file_put_contents(
        storage_path('logs/recommender.log'), 
        $logMessage . PHP_EOL, 
        FILE_APPEND
    );

})
->hourly() // รันทุกชั่วโมง (เปลี่ยนเป็น everyMinute() ได้ถ้าจะเทส)
->name('trigger_recommendation_engine'); // ตั้งชื่อ Task