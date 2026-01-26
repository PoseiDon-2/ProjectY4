<?php
/**
 * Script สำหรับทดสอบ URL ของสลิป
 * รัน: php test-slip-url.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DonationSlip;
use Illuminate\Support\Facades\Storage;

echo "🔍 Testing Slip URLs...\n\n";

// ดึงสลิปตัวอย่าง
$slip = DonationSlip::with('donationRequest')->first();

if (!$slip) {
    echo "❌ ไม่พบสลิปในฐานข้อมูล\n";
    exit(1);
}

echo "📄 Slip ID: {$slip->id}\n";
echo "📁 Slip Path: {$slip->slip_path}\n";
echo "💾 File exists in storage: " . (Storage::disk('public')->exists($slip->slip_path) ? "✅ Yes" : "❌ No") . "\n";

// ทดสอบ URL ต่างๆ
$baseUrl = 'http://127.0.0.1:8000';
$storageUrl = Storage::disk('public')->url($slip->slip_path);
$assetUrl = asset('storage/' . $slip->slip_path);
$manualUrl = $baseUrl . '/storage/' . $slip->slip_path;

echo "\n🔗 URLs:\n";
echo "   Storage::url(): {$storageUrl}\n";
echo "   asset(): {$assetUrl}\n";
echo "   Manual: {$manualUrl}\n";

// ตรวจสอบว่าไฟล์มีจริง
$fullPath = storage_path('app/public/' . $slip->slip_path);
echo "\n📂 Full Path: {$fullPath}\n";
echo "   File exists: " . (file_exists($fullPath) ? "✅ Yes" : "❌ No") . "\n";

// ตรวจสอบ symlink
$publicStoragePath = public_path('storage');
$storageAppPublicPath = storage_path('app/public');
echo "\n🔗 Symlink:\n";
echo "   public/storage exists: " . (is_dir($publicStoragePath) || is_link($publicStoragePath) ? "✅ Yes" : "❌ No") . "\n";
echo "   Points to: " . (is_link($publicStoragePath) ? readlink($publicStoragePath) : "N/A") . "\n";
echo "   Should point to: {$storageAppPublicPath}\n";

// ตรวจสอบว่าไฟล์เข้าถึงได้ผ่าน public/storage
$publicSlipPath = public_path('storage/' . $slip->slip_path);
echo "\n🌐 Public Access:\n";
echo "   public/storage/{$slip->slip_path} exists: " . (file_exists($publicSlipPath) ? "✅ Yes" : "❌ No") . "\n";

echo "\n✅ Test complete!\n";
