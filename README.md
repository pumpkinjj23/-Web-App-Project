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

1. **นำไฟล์โปรเจกต์ไปไว้ในโฟลเดอร์ Web Server (เช่น MAMP)**:
   ```text
   C:\MAMP\htdocs\CPE66\Projack
   ```
2. **นำเข้าฐานข้อมูล (Import Database)**:
   - เปิด phpMyAdmin (`http://localhost/phpmyadmin` หรือ `http://localhost:8888/phpMyAdmin`)
   - นำเข้าไฟล์ `dbNorthwind.sql` เพื่อสร้างฐานข้อมูล `db_northwind`
3. **เปิดใช้งานผ่านเบราว์เซอร์**:
   - หน้าหลัก Dashboard: `http://localhost/CPE66/Projack/`
   - หน้าเพิ่มสินค้า: `http://localhost/CPE66/Projack/product_insert_api.html`
