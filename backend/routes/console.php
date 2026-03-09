<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Http; // [สำคัญ] ต้องเพิ่มบรรทัดนี้
use Illuminate\Support\Facades\Log;  // [สำคัญ] ต้องเพิ่มบรรทัดนี้

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {

    $response = Http::timeout(120)->get('http://recommendation-engine:5000/run');

    $timestamp = now()->toDateTimeString();
    $status = $response->status();
    $body = $response->body();

    $logMessage = "[{$timestamp}] Status: {$status} | Result: {$body}";
    
    file_put_contents(
        storage_path('logs/recommender.log'), 
        $logMessage . PHP_EOL, 
        FILE_APPEND
    );

})
->everyMinute() // hourly() รันทุกชั่วโมง (เปลี่ยนเป็น everyMinute() ได้ถ้าจะเทส)
->name('trigger_recommendation_engine'); // ตั้งชื่อ Task

Schedule::call(function () {
    $now = now();
    
    // ดึง Story ที่ถึงเวลาเผยแพร่ แต่ยังไม่ได้ publish
    $stories = \App\Models\Story::where('is_published', false)
        ->where('is_scheduled', true)
        ->where('scheduled_time', '<=', $now)
        ->get();

    foreach ($stories as $story) {
        $story->update([
            'is_published' => true,
            'published_at' => $now,
            'expires_at'   => $story->computeExpiresAt($now),
        ]);
        
        Log::info("Story ID {$story->id} has been published automatically.");
    }

})
->everyMinute() // รันทุก 1 นาที เพื่อให้โพสต์ได้ตรงเวลาที่สุด
->name('publish_scheduled_stories');