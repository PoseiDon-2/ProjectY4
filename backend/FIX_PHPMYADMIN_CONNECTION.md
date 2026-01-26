# แก้ไขปัญหา phpMyAdmin Connection Error

## ปัญหา
```
mysqli::real_connect(): (HY000/1130): Host 'localhost' is not allowed to connect to this MariaDB server
```

## สาเหตุ
MariaDB ไม่ยอมให้ user `root` เชื่อมต่อจาก `localhost` เนื่องจาก user permissions ไม่ถูกต้อง

## วิธีแก้ไข (เลือกวิธีที่เหมาะสมกับระบบของคุณ)

### วิธีที่ 1: ใช้ Command Line (แนะนำ - ใช้ได้แน่นอน)

#### สำหรับ XAMPP:
1. เปิด Command Prompt (cmd) หรือ PowerShell
2. ไปที่โฟลเดอร์ XAMPP:
   ```bash
   cd C:\xampp\mysql\bin
   ```
3. เข้า MariaDB (ถ้าไม่มี password):
   ```bash
   mysql.exe -u root
   ```
   หรือถ้ามี password:
   ```bash
   mysql.exe -u root -p
   ```

#### สำหรับ Laragon:
1. เปิด Command Prompt
2. ไปที่โฟลเดอร์ Laragon:
   ```bash
   cd C:\laragon\bin\mysql\mysql-8.x.x\bin
   ```
   (เปลี่ยน x.x เป็นเวอร์ชันที่ติดตั้ง)
3. เข้า MariaDB:
   ```bash
   mysql.exe -u root
   ```

#### สำหรับ MariaDB ที่ติดตั้งแยก:
1. เปิด Command Prompt
2. ไปที่โฟลเดอร์ MariaDB:
   ```bash
   cd C:\Program Files\MariaDB 10.x\bin
   ```
3. เข้า MariaDB:
   ```bash
   mysql.exe -u root -p
   ```

#### หลังจากเข้า MariaDB แล้ว:
รันคำสั่ง SQL ต่อไปนี้:
```sql
-- แก้ไข permissions สำหรับ root@localhost
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY '' WITH GRANT OPTION;

-- แก้ไข permissions สำหรับ root@127.0.0.1
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY '' WITH GRANT OPTION;

-- ถ้ายังมีปัญหา ให้ลองสร้าง user ใหม่
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;

-- บังคับให้ MariaDB อัพเดท permissions
FLUSH PRIVILEGES;

-- ตรวจสอบว่าแก้ไขสำเร็จ
SELECT User, Host FROM mysql.user WHERE User = 'root';

-- ออก
EXIT;
```

### วิธีที่ 2: ใช้ HeidiSQL (ถ้ามี)

1. เปิด HeidiSQL
2. สร้าง connection ใหม่:
   - Host: `127.0.0.1` (ไม่ใช่ localhost)
   - User: `root`
   - Password: (ว่าง หรือใส่ password ถ้ามี)
   - Port: `3306`
3. กด Connect
4. ไปที่ Query tab
5. วางคำสั่ง SQL จากด้านบน
6. กด Execute (F9)

### วิธีที่ 3: แก้ไขผ่าน Windows Service (ถ้าใช้ MariaDB Service)

1. เปิด Command Prompt **เป็น Administrator**
2. หยุด MariaDB service:
   ```bash
   net stop MariaDB
   ```
   หรือ
   ```bash
   sc stop MariaDB
   ```

3. เริ่ม MariaDB ใน safe mode (skip grant tables):
   ```bash
   mysqld --skip-grant-tables --skip-networking
   ```

4. เปิด Command Prompt อีกหน้าต่างหนึ่ง (ไม่ต้องเป็น Admin)
5. เข้า MariaDB:
   ```bash
   mysql -u root
   ```

6. รันคำสั่ง:
   ```sql
   USE mysql;
   UPDATE user SET host='%' WHERE user='root' AND host='localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

7. หยุด MariaDB ที่รันใน safe mode (กด Ctrl+C)
8. เริ่ม MariaDB service ใหม่:
   ```bash
   net start MariaDB
   ```

### วิธีที่ 4: ใช้ไฟล์ SQL โดยตรง

1. เปิด Command Prompt
2. ไปที่โฟลเดอร์ที่มีไฟล์ `fix-mariadb-permissions.sql`
3. รันคำสั่ง:
   ```bash
   mysql -u root -p < fix-mariadb-permissions.sql
   ```
   (ถ้าไม่มี password ให้กด Enter)

### วิธีที่ 5: แก้ไข phpMyAdmin Config (ชั่วคราว)

ถ้าแก้ไข MariaDB permissions ไม่ได้ ให้แก้ไข phpMyAdmin config:

1. หาไฟล์ `config.inc.php` ในโฟลเดอร์ phpMyAdmin
   - XAMPP: `C:\xampp\phpMyAdmin\config.inc.php`
   - Laragon: `C:\laragon\etc\apps\phpMyAdmin\config.inc.php`

2. แก้ไข:
   ```php
   $cfg['Servers'][$i]['host'] = '127.0.0.1';  // เปลี่ยนจาก 'localhost'
   ```

3. บันทึกและ refresh phpMyAdmin

## ตรวจสอบว่าการแก้ไขสำเร็จ

### ทดสอบผ่าน Command Line:
```bash
mysql -u root -e "SELECT 'Connection successful!' AS Result;"
```

### ทดสอบผ่าน Laravel:
```bash
cd "c:\Users\TaRrr\Desktop\new pro\ProjectY4\backend"
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connection successful!';"
```

### ทดสอบผ่าน phpMyAdmin:
1. Refresh หน้า phpMyAdmin
2. ควรจะเข้าได้โดยไม่มี error

## หมายเหตุสำคัญ

- **ถ้าใช้ XAMPP/WAMP/Laragon**: มักจะไม่มี password สำหรับ root user
- **ถ้าใช้ MariaDB ที่ติดตั้งแยก**: อาจมี password ที่ตั้งไว้ตอนติดตั้ง
- **ถ้ายังไม่ได้ผล**: ลองใช้ `127.0.0.1` แทน `localhost` ในทุกที่
- **ถ้าใช้ Windows**: อาจต้องรัน Command Prompt เป็น Administrator

## ถ้ายังไม่ได้ผล

ลองวิธีนี้:
1. หยุด MariaDB service
2. เริ่ม MariaDB ใน safe mode
3. รันคำสั่ง SQL เพื่อแก้ไข permissions
4. เริ่ม MariaDB service ใหม่

หรือติดต่อผู้ดูแลระบบ MariaDB เพื่อขอแก้ไข permissions
