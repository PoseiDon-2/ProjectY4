<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
<<<<<<< HEAD
<<<<<<< HEAD
use App\Models\User;
use App\Services\TrustLevelService;
=======
use Illuminate\Support\Facades\Http; // [สำคัญ] ต้องเพิ่มบรรทัดนี้
use Illuminate\Support\Facades\Log;  // [สำคัญ] ต้องเพิ่มบรรทัดนี้
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
use Illuminate\Support\Facades\Http; // [สำคัญ] ต้องเพิ่มบรรทัดนี้
use Illuminate\Support\Facades\Log;  // [สำคัญ] ต้องเพิ่มบรรทัดนี้
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

<<<<<<< HEAD
<<<<<<< HEAD
Artisan::command('trust:recalculate', function () {
    $service = app(TrustLevelService::class);
    $count = 0;
    User::query()->chunk(100, function ($users) use ($service, &$count) {
        foreach ($users as $user) {
            try {
                $service->updateUserTrust($user);
                $count++;
            } catch (\Throwable $e) {
                $this->warn("Trust update failed for user {$user->id}: " . $e->getMessage());
            }
        }
    });
    $this->info("Recalculated trust for {$count} users.");
})->purpose('Recalculate donor and organizer trust levels for all users');

Schedule::command('trust:recalculate')->daily();
=======
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
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
<<<<<<< HEAD
->name('publish_scheduled_stories');
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
->name('publish_scheduled_stories');
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
