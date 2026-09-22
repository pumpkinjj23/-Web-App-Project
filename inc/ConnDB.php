<?php
/**
 * ConnDB.php - การเชื่อมต่อฐานข้อมูล PDO สำหรับ MySQL (Northwind Database)
 * รองรับทั้ง MAMP (Default port 3306 / 8889, Password 'root' หรือ '')
 */

$servername = "localhost";
$username   = "root";
$password   = "root";
$dbname     = "db_northwind";
$charset    = "utf8mb4";

$conn = null;

// ลองเชื่อมต่อด้วยพอร์ตมาตรฐาน 3306 รหัสผ่าน 'root'
try {
    $conn = new PDO("mysql:host=$servername;port=3306;dbname=$dbname;charset=$charset", $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e1) {
    // ลองเชื่อมต่อด้วยรหัสผ่านว่างเปล่า ''
    try {
        $conn = new PDO("mysql:host=$servername;port=3306;dbname=$dbname;charset=$charset", $username, "", [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e2) {
        // ลองเชื่อมต่อด้วยพอร์ต MAMP Mac / Custom 8889
        try {
            $conn = new PDO("mysql:host=$servername;port=8889;dbname=$dbname;charset=$charset", $username, $password, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e3) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ' . $e3->getMessage(),
                'hint'    => 'กรุณาตรวจสอบว่าเปิด MySQL ใน MAMP แล้วและมีฐานข้อมูล db_northwind'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
}
?>
