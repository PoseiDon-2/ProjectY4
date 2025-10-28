<!DOCTYPE html>
<html>

<head>
    <title>รหัส OTP ของคุณ</title>
</head>

<body style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f9f9f9;">
    <div
        style="max-width: 400px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h1 style="color: #ec4899;">DonateSwipe</h1>
        <h2 style="color: #1f2937;">รหัส OTP ของคุณคือ</h2>
        <div style="font-size: 36px; font-weight: bold; color: #ec4899; letter-spacing: 8px; margin: 20px 0;">
            {{ $otp }}
        </div>
        <p style="color: #6b7280;">รหัสนี้จะหมดอายุใน 10 นาที</p>
    </div>
</body>

</html>