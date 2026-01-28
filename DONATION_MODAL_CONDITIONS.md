# 📋 เงื่อนไขทั้งหมดในหน้า Donation Modal

## 🎯 ภาพรวม

หน้า `donation-modal.tsx` เป็น Modal สำหรับบริจาคเงิน มี 4 ขั้นตอน:
1. **method** - เลือกวิธีการชำระเงิน
2. **amount** - ระบุจำนวนเงิน
3. **payment** - ชำระเงิน (แสดง QR Code / ข้อมูลบัญชี / ฟอร์มบัตร)
4. **success** - แสดงผลสำเร็จ

---

## 1️⃣ เงื่อนไขการเลือกจำนวนเงิน (Step: amount)

### ✅ เงื่อนไขการกดปุ่ม "ชำระเงิน"

**ต้องผ่านทั้งหมด:**
- ✅ มี `amount` (ไม่ว่าง)
- ✅ `Number(amount) > 0`
- ✅ `remainingAmount === null` **หรือ** `Number(amount) <= remainingAmount`

**ถ้าไม่ผ่าน:**
- ❌ ปุ่มจะถูก `disabled`

### 📊 การตรวจสอบยอดคงเหลือ

**เงื่อนไข:**
- ✅ โหลดยอดคงเหลือจาก API: `/api/donations/remaining/{donation.id}`
- ✅ ถ้า `remainingAmount <= 0` → แสดง Error: "คำขอนี้รับบริจาคครบแล้ว"
- ✅ ถ้า `numeric > remainingAmount` → แสดง Error: "ยอดสูงสุดที่บริจาคได้คือ ฿{remainingAmount}"
- ✅ ปุ่ม Quick Amount จะถูก `disabled` ถ้า `quickValue > remainingAmount` หรือ `remainingAmount === 0`

### 🔢 Quick Amounts

**ค่าที่มี:**
- 100, 500, 1000, 2000, 5000 บาท

---

## 2️⃣ เงื่อนไขการสร้าง QR Code (Step: payment, Method: qr)

### ✅ เงื่อนไขการสร้าง QR Code

**ต้องผ่านทั้งหมด:**
- ✅ `step === "payment"`
- ✅ `paymentMethod === "qr"`
- ✅ `!!amount` (มีค่า)
- ✅ `Number(amount) > 0`
- ✅ `!!promptpayId` (มีเลขพร้อมเพย์)

**ถ้าไม่ผ่าน:**
- ❌ ไม่สร้าง QR Code
- ❌ แสดง Error: "ไม่มีเลขพร้อมเพย์สำหรับคำขอบริจาคนี้"

### 📱 การ Sanitize PromptPay

**รองรับรูปแบบ:**
- ✅ เบอร์ 10 หลัก: `0828768146`
- ✅ เบอร์ 11 หลัก (ขึ้นต้น 66): `66828768146` → แปลงเป็น `0828768146`
- ✅ เบอร์ 13 หลัก (ขึ้นต้น 0066): `006628768146` → แปลงเป็น `0828768146`
- ✅ เบอร์ 9 หลัก: `828768146` → แปลงเป็น `0828768146`
- ✅ บัตร 13 หลัก: `1234567890123`
- ✅ อีเมล: `example@email.com`

**ถ้าไม่ผ่าน:**
- ❌ Error: "รูปแบบพร้อมเพย์ไม่ถูกต้อง (ต้องเป็นเบอร์ 10 หลัก, บัตร 13 หลัก หรืออีเมล)"

---

## 3️⃣ เงื่อนไขการตรวจสอบสลิป (verifySlipClient)

### 📊 ระบบคะแนน (100 คะแนน)

| รายการ | คะแนน | เงื่อนไข |
|--------|-------|----------|
| **QR Code** | 30 | พบ QR Code = +30 |
| **คำสำคัญ** | 25 | ≥3 คำ = +25, ≥2 คำ = +15, ≥1 คำ = +5 |
| **จำนวนเงิน** | 25 | ตรงเป๊ะ = +25, คลาดเคลื่อน ≤1 บาท = +20, ≤10 บาท = +10 |
| **วันที่** | 20 | วันเดียวกัน = +20, 1-2 วัน = +15, มีวันที่ = +5 |

### ✅ สีเขียว (Approved) - อนุมัติอัตโนมัติ

**เงื่อนไขทั้งหมดต้องผ่าน:**
- ✅ คะแนน ≥ **90**
- ✅ มี **QR Code** (`hasQR === true`)
- ✅ มีคำสำคัญ **≥2 คำ** (`foundTokens.length >= 2`)
- ✅ มีจำนวนเงิน (`ocrAmount !== null`)
- ✅ มี requiredAmount (`required !== null`)
- ✅ จำนวนเงินคลาดเคลื่อน **≤1 บาท** (`amountDiff <= 1`)

**ผลลัพธ์:**
- ✅ แสดง Toast: "✅ สลิปผ่านการตรวจสอบ"
- ✅ อนุญาตให้ส่งสลิปได้
- ✅ ส่ง `client_verdict: "approved"` ไป backend

### ⚠️ สีเหลือง (Needs Review) - ต้องให้ผู้สร้างคำขอตรวจสอบ

**เงื่อนไข:**
- ✅ คะแนน ≥ **80**
- ✅ จำนวนเงินคลาดเคลื่อน **≤10 บาท** (`amountDiff <= 10` หรือ `amountDiff === null`)

**ผลลัพธ์:**
- ⚠️ แสดง Toast: "⚠️ สลิปผ่านเบื้องต้น"
- ✅ อนุญาตให้ส่งสลิปได้
- ✅ ส่ง `client_verdict: "needs_review"` ไป backend

### ❌ สีแดง (Rejected) - ป้องกันการอัปโหลด

**เงื่อนไขใดเงื่อนไขหนึ่ง:**
- ❌ มี **Error** (ร่องรอยการแก้ไข, ไม่พบหลักฐานว่าเป็นสลิป)
- ❌ คะแนน **< 80**
- ❌ จำนวนเงินคลาดเคลื่อน **> 10 บาท** (ถ้ามี requiredAmount)

**ผลลัพธ์:**
- ❌ แสดง Toast: "❌ สลิปไม่ผ่านการตรวจสอบ"
- ❌ **หยุดการส่งสลิป** (`return` ทันที)
- ❌ ปุ่ม "ยืนยัน" จะถูก `disabled` (`slipResult?.decision === "rejected"`)

---

## 4️⃣ รายละเอียดการตรวจสอบสลิป

### 🔍 1. ตรวจสอบ EXIF Metadata (ร่องรอยการแก้ไข)

**Software ที่ตรวจพบ:**
- Photoshop, PicsArt, Snapseed, Canva, GIMP, Pixelmator, Lightroom

**ผลลัพธ์:**
- ❌ ถ้าพบ = **Error** → สีแดง (Rejected)

### 🔍 2. ตรวจสอบ QR Code

**วิธีการ:**
- ✅ ลองอ่าน QR Code จากรูปเต็มขนาด
- ✅ ถ้าไม่เจอ → ลองอ่านอีกครั้งด้วยขนาดที่เล็กลง (max 800px width)

**ผลลัพธ์:**
- ✅ พบ QR Code = +30 คะแนน
- ⚠️ ไม่พบ = Warning (แต่ไม่เป็น Error)

### 🔍 3. OCR - อ่านข้อความจากสลิป

**Library:**
- Tesseract.js (ภาษาไทย + อังกฤษ)

**ผลลัพธ์:**
- ✅ ใช้ข้อความที่อ่านได้สำหรับตรวจสอบคำสำคัญ, จำนวนเงิน, วันที่

### 🔍 4. ตรวจสอบคำสำคัญ

**คำสำคัญที่ตรวจสอบ:**
- "โอน", "โอนเงิน", "โอนสำเร็จ", "โอนเงินสำเร็จ"
- "บัญชี", "เลขที่บัญชี", "บัญชีผู้รับ"
- "บาท", "จำนวน", "จำนวนเงิน"
- "เวลา", "วันที่", "วันเวลา"
- "พร้อมเพย์", "PromptPay"
- "ธนาคาร", "ธ.", "ธนาคารไทย"
- ชื่อธนาคาร: "กสิกร", "กรุงเทพ", "กรุงไทย", "ไทยพาณิชย์", "SCB", "KBANK", "BBL", "KTB"
- "Transaction", "Reference", "เลขที่รายการ"
- "Transfer", "Amount", "Fee", "ค่าธรรมเนียม"
- "สำเร็จ", "Success", "Completed"

**คะแนน:**
- ≥3 คำ = +25 คะแนน
- ≥2 คำ = +15 คะแนน
- ≥1 คำ = +5 คะแนน

**เงื่อนไข Critical:**
- ❌ ถ้าไม่มี QR Code **และ** คำสำคัญ < 2 คำ **และ** ไม่มีจำนวนเงิน = **Error** (สีแดง)

### 🔍 5. ตรวจสอบจำนวนเงิน

**รูปแบบที่รองรับ:**
- `"100.00 บาท"`
- `"1,000 บาท"`
- `"100 บาท"`
- `"จำนวน: 1000"`
- `"Amount: 1000"`

**คะแนน:**
- ตรงเป๊ะ = +25 คะแนน
- คลาดเคลื่อน ≤1 บาท = +20 คะแนน
- คลาดเคลื่อน ≤10 บาท = +10 คะแนน
- คลาดเคลื่อน >10 บาท = 0 คะแนน

**เงื่อนไข Critical:**
- ❌ ถ้ามี requiredAmount **และ** จำนวนเงินคลาดเคลื่อน >10 บาท = **Error** (สีแดง)

### 🔍 6. ตรวจสอบวันที่

**รูปแบบที่รองรับ:**
- `DD/MM/YYYY`, `DD-MM-YYYY`
- `YYYY/MM/DD`, `YYYY-MM-DD`
- `DD ม.ค. YYYY`, `DD มกราคม YYYY` (รองรับทุกเดือน)

**การแปลงปี:**
- ✅ พ.ศ. (≥2400) → แปลงเป็น ค.ศ. (ลบ 543)
- ✅ ปี 2 หลัก → แปลงเป็น ค.ศ. หรือ พ.ศ. ตามที่ใกล้เคียงกับปีปัจจุบัน

**คะแนน:**
- วันเดียวกัน = +20 คะแนน
- 1-2 วันก่อน = +15 คะแนน
- มีวันที่แต่ไม่ตรง = +5 คะแนน

**Warning:**
- ⚠️ ถ้าไม่พบวันที่ = Warning (ไม่เป็น Error)
- ⚠️ ถ้าวันที่มากกว่า 2 วัน = Warning (ไม่เป็น Error)

---

## 5️⃣ เงื่อนไขการส่งสลิป (handlePayment)

### ✅ เงื่อนไขก่อนส่งสลิป

**ตรวจสอบยอดเงิน:**
- ❌ ถ้า `remainingAmount !== null && Number(amount) > remainingAmount` → แสดง Toast Error และหยุด

**ตรวจสอบสลิป (สำหรับ QR/Bank):**
- ❌ ถ้า `paymentMethod === "qr" || paymentMethod === "bank"` **และ** `!slipFile` → แสดง Toast Error และหยุด

### ✅ เงื่อนไขการตรวจสอบสลิป

**ถ้ามีสลิป (`slipFile`):**
1. ✅ เรียก `verifySlipClient()` เพื่อตรวจสอบ
2. ✅ ถ้า `result.decision === "rejected"` → แสดง Toast Error และหยุด (ไม่ส่งสลิป)
3. ✅ ถ้า `result.decision === "approved"` → แสดง Toast Success
4. ✅ ถ้า `result.decision === "needs_review"` → แสดง Toast Warning

### 📤 ข้อมูลที่ส่งไป Backend

**FormData:**
- ✅ `donation_request_id` (required)
- ✅ `amount` (required)
- ✅ `payment_method` (required): "promptpay" | "bank" | "credit"
- ✅ `slip` (ถ้ามี `slipFile`)
- ✅ `client_verdict` (ถ้ามี `slipResult?.decision`): "approved" | "rejected" | "needs_review"
- ✅ `client_reasons[0]`, `client_reasons[1]`, ... (ถ้ามี `slipResult?.reasons`)

**API Endpoint:**
- `POST /api/donations/slips`
- Headers: `Authorization: Bearer {token}`

---

## 6️⃣ เงื่อนไขการปิด/เปิดปุ่ม "ยืนยัน"

### 🔴 ปุ่มถูก Disabled เมื่อ:

**สำหรับ QR Code (paymentMethod === "qr"):**
- ❌ `isProcessing === true`
- ❌ `verifying === true`
- ❌ `!!qrError` (มี Error ในการสร้าง QR Code)
- ❌ `!slipFile` (ไม่มีสลิป)
- ❌ `slipResult?.decision === "rejected"` (สลิปไม่ผ่าน)
- ❌ `remainingAmount !== null && Number(amount) > remainingAmount` (ยอดเกิน)

**สำหรับ Bank Transfer (paymentMethod === "bank"):**
- ❌ `isProcessing === true`
- ❌ `verifying === true`
- ❌ `!slipFile` (ไม่มีสลิป)
- ❌ `slipResult?.decision === "rejected"` (สลิปไม่ผ่าน)
- ❌ `remainingAmount !== null && Number(amount) > remainingAmount` (ยอดเกิน)

**สำหรับ Credit Card (paymentMethod === "credit"):**
- ❌ `isProcessing === true`
- ❌ `!cardNumber` (ไม่มีเลขบัตร)
- ❌ `!expiryDate` (ไม่มีวันหมดอายุ)
- ❌ `!cvv` (ไม่มี CVV)
- ❌ `!cardName` (ไม่มีชื่อบนบัตร)

---

## 7️⃣ เงื่อนไขการแสดงผล

### 📱 QR Code Display

**แสดงเมื่อ:**
- ✅ `step === "payment" && paymentMethod === "qr" && !!amount && Number(amount) > 0 && !!promptpayId`

**ไม่แสดงเมื่อ:**
- ❌ ไม่เข้าเงื่อนไขด้านบน
- ❌ มี Error (`qrError`)

### 🖼️ Slip Preview

**แสดงเมื่อ:**
- ✅ `slipPreview !== null` (มีไฟล์สลิป)

### 📊 Slip Result Display

**แสดงเมื่อ:**
- ✅ `slipResult !== null` (มีการตรวจสอบสลิปแล้ว)

**สี:**
- 🟢 **เขียว** (`approved`): `bg-green-50 border-green-300`
- 🟡 **เหลือง** (`needs_review`): `bg-yellow-50 border-yellow-300`
- 🔴 **แดง** (`rejected`): `bg-red-50 border-red-300`

---

## 8️⃣ เงื่อนไขการคำนวณคะแนน

### 📊 สูตรคะแนน

```
score = 0

if (hasQR) score += 30

if (foundTokens.length >= 3) score += 25
else if (foundTokens.length >= 2) score += 15
else if (foundTokens.length >= 1) score += 5

if (ocrAmount !== null) {
    if (required !== null) {
        diff = |ocrAmount - required|
        if (diff === 0) score += 25
        else if (diff <= 1) score += 20
        else if (diff <= 10) score += 10
    } else {
        score += 15
    }
}

if (ocrDate !== null) {
    if (isSameDay) score += 20
    else if (isWithin2Days) score += 15
    else score += 5
}
```

**Max Score:** 100

---

## 9️⃣ เงื่อนไขการตัดสินใจ (Decision Logic)

### 🔴 สีแดง (Rejected) - Priority 1

**ถ้ามีอย่างใดอย่างหนึ่ง:**
1. ❌ `errors.length > 0` (มี Error)
2. ❌ `score < 80`
3. ❌ `required !== null && amountDiff > 10` (จำนวนเงินคลาดเคลื่อน >10 บาท)

### 🟢 สีเขียว (Approved) - Priority 2

**ต้องผ่านทั้งหมด:**
- ✅ `score >= 90`
- ✅ `hasQR === true`
- ✅ `foundTokens.length >= 2`
- ✅ `ocrAmount !== null`
- ✅ `required !== null`
- ✅ `amountDiff !== null && amountDiff <= 1`

### 🟡 สีเหลือง (Needs Review) - Priority 3

**ต้องผ่านทั้งหมด:**
- ✅ `score >= 80`
- ✅ `amountOkForYellow === true` (จำนวนเงินคลาดเคลื่อน ≤10 บาท หรือไม่มี requiredAmount)

### 🔴 สีแดง (Rejected) - Default

**ถ้าไม่เข้าเงื่อนไขใดๆ:**
- ❌ `decision = "rejected"`

---

## 🔟 เงื่อนไขการส่งข้อมูลไป Backend

### ✅ ข้อมูลที่ส่ง (FormData)

**Required:**
- ✅ `donation_request_id` (string)
- ✅ `amount` (string, แปลงจาก Number)
- ✅ `payment_method` (string): "promptpay" | "bank" | "credit"

**Optional:**
- ✅ `slip` (File) - ถ้ามี `slipFile`
- ✅ `client_verdict` (string) - ถ้ามี `slipResult?.decision`
- ✅ `client_reasons[0]`, `client_reasons[1]`, ... - ถ้ามี `slipResult?.reasons`

### 🔐 Authentication

**Headers:**
- ✅ `Authorization: Bearer {token}` (จาก localStorage.getItem("auth_token"))

### 📡 API Endpoint

- ✅ `POST /api/donations/slips`
- ✅ Base URL: `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"`

---

## 1️⃣1️⃣ เงื่อนไขการจัดการ Points และ Receipt

### 🪙 Points System

**คำนวณคะแนน:**
- ✅ เรียก `pointsSystem.calculateDonationPoints(donationAmount, "money")`
- ✅ เรียก `pointsSystem.addPoints(user.id, earnedPoints, "donation", ...)`

**แสดงผล:**
- ✅ แสดง Toast: "ได้รับ {earnedPoints} คะแนน!"
- ✅ แสดงในหน้า Success

### 📄 Receipt System

**สร้าง Receipt:**
- ✅ เรียก `receiptSystem.createReceipt({...})`
- ✅ เก็บใน localStorage: `user_donations_{user.id}`

**ข้อมูล Receipt:**
- ✅ `donationId`: `donation_{Date.now()}`
- ✅ `requestId`: `donation.id`
- ✅ `requestTitle`: `donation.title`
- ✅ `donorId`: `user.id`
- ✅ `donorName`: `${user.firstName} ${user.lastName}`
- ✅ `amount`: `donationAmount`
- ✅ `type`: `"money"`
- ✅ `paymentMethod`: "PromptPay" | "Credit Card" | "Bank Transfer"
- ✅ `transactionId`: `TXN_{Date.now()}_{random}`
- ✅ `message`: ข้อความให้กำลังใจ
- ✅ `isAnonymous`: บริจาคแบบไม่ระบุชื่อ
- ✅ `pointsEarned`: คะแนนที่ได้รับ

---

## 1️⃣2️⃣ เงื่อนไขการ Reset Modal

### 🔄 resetModal()

**Reset ทุก State:**
- ✅ `step` → "method"
- ✅ `paymentMethod` → "qr"
- ✅ `amount` → ""
- ✅ `customAmount` → ""
- ✅ `message` → ""
- ✅ `isAnonymous` → false
- ✅ `cardNumber` → ""
- ✅ `expiryDate` → ""
- ✅ `cvv` → ""
- ✅ `cardName` → ""
- ✅ `isProcessing` → false
- ✅ `pointsEarned` → 0
- ✅ `qrCodeUrl` → ""
- ✅ `qrError` → ""
- ✅ `slipFile` → null
- ✅ `slipPreview` → null
- ✅ `slipResult` → null

---

## 📌 สรุปเงื่อนไขสำคัญ

### ✅ ต้องมีก่อนส่งสลิป

1. ✅ **จำนวนเงิน**: ต้องมีและ > 0 และ ≤ remainingAmount
2. ✅ **สลิป** (QR/Bank): ต้องมี `slipFile`
3. ✅ **การตรวจสอบสลิป**: ต้องไม่เป็น `rejected`
4. ✅ **บัตรเครดิต** (Credit): ต้องกรอก `cardNumber`, `expiryDate`, `cvv`, `cardName`

### ❌ ป้องกันการส่ง

1. ❌ สลิปไม่ผ่าน (`rejected`)
2. ❌ ยอดเงินเกิน `remainingAmount`
3. ❌ ไม่มีสลิป (สำหรับ QR/Bank)
4. ❌ ไม่มีข้อมูลบัตร (สำหรับ Credit)

### 🎯 Flow การทำงาน

```
1. เลือกวิธีการชำระเงิน (qr/credit/bank)
   ↓
2. ระบุจำนวนเงิน (ตรวจสอบ remainingAmount)
   ↓
3. ชำระเงิน:
   - QR: สร้าง QR Code → อัปโหลดสลิป → ตรวจสอบสลิป → ส่ง
   - Bank: แสดงข้อมูลบัญชี → อัปโหลดสลิป → ตรวจสอบสลิป → ส่ง
   - Credit: กรอกข้อมูลบัตร → ส่ง
   ↓
4. แสดงผลสำเร็จ (คำนวณ Points, สร้าง Receipt)
```

---

## 🔍 หมายเหตุ

- **การตรวจสอบสลิป** ทำงานอัตโนมัติเมื่ออัปโหลดสลิป
- **ถ้าสลิปเป็น `rejected`** → หยุดการส่งทันที (ไม่เรียก API)
- **ถ้าสลิปเป็น `approved` หรือ `needs_review`** → ส่งสลิปไป backend พร้อม `client_verdict` และ `client_reasons`
- **QR Code** สร้างอัตโนมัติเมื่อเข้า step "payment" และเลือก method "qr"
- **Points** คำนวณและเพิ่มอัตโนมัติเมื่อส่งสลิปสำเร็จ
