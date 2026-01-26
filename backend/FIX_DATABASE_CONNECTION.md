# แก้ไขปัญหา MariaDB Connection Error

## ปัญหา
```
SQLSTATE[HY000] [1130] Host 'localhost' is not allowed to connect to this MariaDB server
```

## สาเหตุ
MariaDB ไม่ยอมให้ user `root` เชื่อมต่อจาก `localhost` หรือ `127.0.0.1` เนื่องจาก user permissions ไม่ถูกต้อง

## วิธีแก้ไข

### วิธีที่ 1: แก้ไขผ่าน MariaDB Command Line (แนะนำ)

1. เปิด Command Prompt หรือ PowerShell
2. เข้า MariaDB/MySQL:
   ```bash
   mysql -u root -p
   ```
   (ถ้าไม่มี password ให้กด Enter)

3. รันคำสั่ง SQL:
   ```sql
   GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY '' WITH GRANT OPTION;
   GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY '' WITH GRANT OPTION;
   FLUSH PRIVILEGES;
   ```

4. ออกจาก MariaDB:
   ```sql
   EXIT;
   ```

### วิธีที่ 2: ใช้ไฟล์ SQL ที่เตรียมไว้

1. เปิด Command Prompt หรือ PowerShell
2. รันคำสั่ง:
   ```bash
   cd "c:\Users\TaRrr\Desktop\new pro\ProjectY4\backend"
   mysql -u root -p < fix-mariadb-permissions.sql
   ```

### วิธีที่ 3: ใช้ phpMyAdmin หรือ HeidiSQL

1. เปิด phpMyAdmin หรือ HeidiSQL
2. เลือก database `mysql`
3. ไปที่แท็บ SQL
4. วางคำสั่ง SQL จากไฟล์ `fix-mariadb-permissions.sql`
5. กด Execute

### วิธีที่ 4: สร้าง User ใหม่ (ถ้าวิธีอื่นไม่ได้ผล)

1. เข้า MariaDB:
   ```bash
   mysql -u root -p
   ```

2. สร้าง user ใหม่:
   ```sql
   CREATE USER 'laravel_user'@'localhost' IDENTIFIED BY '';
   CREATE USER 'laravel_user'@'127.0.0.1' IDENTIFIED BY '';
   GRANT ALL PRIVILEGES ON donation_db.* TO 'laravel_user'@'localhost';
   GRANT ALL PRIVILEGES ON donation_db.* TO 'laravel_user'@'127.0.0.1';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. แก้ไข `.env` file:
   ```
   DB_USERNAME=laravel_user
   DB_PASSWORD=
   ```

4. Clear Laravel config cache:
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

## ตรวจสอบว่าการแก้ไขสำเร็จ

รันคำสั่งนี้เพื่อทดสอบการเชื่อมต่อ:
```bash
cd "c:\Users\TaRrr\Desktop\new pro\ProjectY4\backend"
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connection successful!';"
```

ถ้าเห็นข้อความ "Database connection successful!" แสดงว่าการแก้ไขสำเร็จ

## หมายเหตุ

- ถ้า MariaDB มี password ให้เพิ่ม `-p` และใส่ password เมื่อถูกถาม
- ถ้าใช้ XAMPP/WAMP/Laragon อาจต้องใช้ user `root` โดยไม่มี password
- ถ้ายังไม่ได้ผล ให้ตรวจสอบว่า MariaDB service ทำงานอยู่หรือไม่
