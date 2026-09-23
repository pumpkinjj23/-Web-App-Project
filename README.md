# 🛒 Northwind Product Management Web Application (RESTful API CRUD)

ระบบเว็บแอปพลิเคชันสำหรับจัดการข้อมูลสินค้า (Northwind Database) พัฒนาด้วย PHP PDO, Vanilla JavaScript (ES6+), Bootstrap 5 และสถาปัตยกรรม RESTful API

---

## 🌟 ฟีเจอร์หลัก (Key Features)

- 🔍 **ค้นหาและกรองข้อมูลแบบเรียลไทม์ (Live Search & Filter)**
  - ค้นหาจากชื่อสินค้า หรือ รหัสสินค้า (Debounce 300ms)
  - กรองตามหมวดหมู่สินค้า (`tb_categories`)
  - กรองตามผู้จัดจำหน่าย (`tb_suppliers`)
  - กรองตามช่วงราคา (ต่ำสุด - สูงสุด)
  - จัดเรียงตามรหัส, ชื่อสินค้า หรือราคา (ASC/DESC)
- ➕ **เพิ่มสินค้าใหม่ (Create)**
  - แบบฟอร์ม Modal และหน้าเดี่ยว (`product_insert_api.html`)
  - Dropdown ดึงข้อมูลหมวดหมู่และผู้จัดจำหน่ายจาก API อัตโนมัติ (`loaddata.js`)
  - ตรวจสอบความถูกต้องของข้อมูลทั้ง Client-side และ Server-side (Validation)
  - แจ้งเตือนผลลัพธ์ด้วย SweetAlert2
- ✏️ **แก้ไขข้อมูลสินค้า (Update)**
  - ดึงข้อมูลเดิมมาแสดงในแบบฟอร์มเพื่อแก้ไขอย่างแม่นยำ
  - อัปเดตผ่าน RESTful API (`PUT /api/products/{id}`)
- 🗑️ **ลบข้อมูลสินค้า (Delete)**
  - กล่องยืนยันการลบ (SweetAlert2 Confirmation Dialog) เพื่อความปลอดภัย
  - ลบข้อมูลผ่าน RESTful API (`DELETE /api/products/{id}`)
- 📄 **ดูรายละเอียดสินค้า (View Details)**
  - แสดงรายละเอียดเชิงลึก: ข้อมูลสินค้า, รายละเอียดหมวดหมู่, ที่อยู่และเบอร์โทรผู้จัดจำหน่าย
- 📊 **สถิติภาพรวม (Live Stats Dashboard)**
  - จำนวนสินค้าทั้งหมด, ราคาเฉลี่ย, ราคาต่ำสุด, และราคาสูงสุด

---

## 📂 โครงสร้างโฟลเดอร์ (Directory Structure)

```text
Projack/
├── api/
│   ├── .htaccess                   # Apache URL Rewriting
│   ├── index.php                   # Front Controller
│   ├── core/
│   │   ├── Response.php            # JSON Response Handler
│   │   └── Router.php              # RESTful Routing Engine
│   └── controllers/
│       ├── CategoryController.php  # Category API
│       ├── SupplierController.php  # Supplier API
│       └── ProductController.php   # Product CRUD API
├── inc/
│   └── ConnDB.php                  # PDO Database Connection
├── js/
│   ├── form_template_reusable.js   # Client-side Validation & SweetAlert2
│   ├── loaddata.js                 # API Select Dropdown Loader
│   └── app.js                      # Main UI Controller & Pagination
├── css/
│   └── style.css                   # Dark Glassmorphism Theme
├── dbNorthwind.sql                 # Northwind Database SQL Dump
├── index.html                      # Main Dashboard UI
├── index.php                       # Entry point wrapper
├── process_product.php             # Form processing endpoint
└── product_insert_api.html         # Single product insert page
```

---

## 🚀 การติดตั้งและเปิดใช้งาน (Setup & Installation)

### 💻 A. ใช้งานบน Localhost (MAMP / XAMPP)

1. **นำไฟล์โปรเจกต์ไปไว้ในโฟลเดอร์ Web Server**:
   ```text
   C:\MAMP\htdocs\CPE66\Projack
   ```
2. **นำเข้าฐานข้อมูล (Import Database)**:
   - เปิด phpMyAdmin (`http://localhost/phpmyadmin` หรือ `http://localhost:8888/phpMyAdmin`)
   - สร้างฐานข้อมูลชื่อ `db_northwind` และนำเข้าไฟล์ `dbNorthwind.sql`
3. **เปิดใช้งานผ่านเบราว์เซอร์**:
   - หน้าหลัก Dashboard: `http://localhost/CPE66/Projack/`
   - หน้าเพิ่มสินค้า: `http://localhost/CPE66/Projack/product_insert_api.html`

---

### ☁️ B. ขั้นตอนการ Deploy ขึ้น Railway Cloud โดยละเอียด (Step-by-Step)

โปรเจกต์นี้รองรับการ Deploy ขึ้น **Railway.com** แบบ Serverless Cloud Architecture เต็มรูปแบบ

#### 1. สถาปัตยกรรมระบบบน Railway (Architecture Overview)
```
[ GitHub Repo ] ──(Git Push CI/CD)──> [ Railway Web Service (PHP 8.2+) ]
                                                │
                                                ▼ (Private Network)
                                      [ Railway MySQL Database ]
                                      (Tables: tb_products, tb_categories, ...)
```

#### 2. ขั้นตอนการสร้างและ Deploy บริการบน Railway

##### ขั้นตอนที่ 1: สร้าง MySQL Database Service บน Railway
1. เข้าสู่ระบบที่ [Railway.com](https://railway.com/) แล้วเปิดหน้าโปรเจกต์
2. กดปุ่ม **"+ Create"** หรือ **"New"** -> เลือก **"Database"** -> เลือก **"Add MySQL"**
3. ระบบจะสร้าง Service MySQL พร้อมสร้าง Volume จัดเก็บข้อมูลอัตโนมัติ

##### ขั้นตอนที่ 2: นำเข้าข้อมูล (Import SQL) เข้าสู่ Railway MySQL
1. คลิกที่กล่อง **MySQL Service** บน Railway
2. ไปที่แท็บ **"Data"** หรือ **"Connect"**
3. สามารถเลือกนำเข้าได้ 2 รูปแบบ:
   - **ผ่าน Railway Console**: รันคำสั่ง SQL จากไฟล์ `dbNorthwind.sql`
   - **ผ่านโปรแกรม Database Client (DBeaver / Navicat / TablePlus)**:
     - นำค่าจากแท็บ **Connect** (`MYSQL_PUBLIC_URL` หรือ Host, Port, User, Password) ไปเชื่อมต่อ
     - นำเข้าไฟล์ `dbNorthwind.sql` เพื่อสร้างตาราง `tb_products`, `tb_categories`, `tb_suppliers` ฯลฯ

##### ขั้นตอนที่ 3: สร้าง Web Service จาก GitHub Repository
1. กดปุ่ม **"+ Create"** หรือ **"New"** บนหน้าโปรเจกต์ Railway
2. เลือก **"GitHub Repo"** แล้วเลือก Repository ของคุณ (เช่น `pumpkinjj23/-Web-App-Project`)
3. Railway จะตรวจพบ `composer.json` และ `index.php` แล้วเริ่ม Build อัตโนมัติด้วย PHP Runtime

##### ขั้นตอนที่ 4: เชื่อมโยง Environment Variables (สำคัญที่สุด ⭐)
เพื่อให้ Web Service สื่อสารกับ MySQL ได้โดยตรง:
1. คลิกที่กล่อง **Web Service** (บริการ PHP)
2. ไปที่แท็บ **"Variables"**
3. กดปุ่ม **"New Variable"** -> เลือก **"Add Reference"** (ไอคอนรูปโซ่ 🔗)
4. เลือก Service **"MySQL"** และติ๊กเลือกตัวแปรทั้งหมด:
   - `MYSQL_URL`
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
5. กด **Add** ระบบจะทำการ Redeploy อัตโนมัติ

##### ขั้นตอนที่ 5: สร้าง Public Domain เพื่อเข้าใช้งาน
1. คลิกที่กล่อง **Web Service** -> ไปที่แท็บ **"Settings"**
2. เลื่อนลงมาที่หัวข้อ **"Networking"** -> กดปุ่ม **"Generate Domain"**
3. คุณจะได้ URL สำหรับเปิดใช้งาน เช่น `https://web-app-project-production.up.railway.app/`
4. คลิกเปิด URL เพื่อเข้าใช้งานระบบได้ทันทีทั่วโลก 🌐

---

## 🛠️ รายละเอียดกลไกการทำงานของ Backend & Database Connection

- **`inc/ConnDB.php`**: ระบบตรวจจับสภาพแวดล้อมอัจฉริยะ (Adaptive Connection)
  - ลำดับที่ 1: ตรวจสอบและเชื่อมต่อผ่าน `MYSQL_URL` หรือ Environment Variables ของ Railway
  - ลำดับที่ 2: เชื่อมต่อผ่าน Private Network (`mysql.railway.internal`)
  - ลำดับที่ 3: Fallback อัตโนมัติสำหรับ Localhost MAMP/XAMPP (Port 3306 / 8889)
- **`api/core/Router.php`**: รองรับ RESTful Routing แบบสมบูรณ์ (`GET`, `POST`, `PUT`, `DELETE`)
- **`js/app.js`**: ระบบโหลดข้อมูล Client-side แบบ Instant Response พร้อม Error Fallbacks ที่ทนทานต่อข้อผิดพลาด
