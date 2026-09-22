<?php
/**
 * ConnDB.php - การเชื่อมต่อฐานข้อมูล PDO สำหรับ MySQL (Northwind Database)
 * รองรับทั้ง Railway Cloud Environment (Environment Variables) และ Localhost (MAMP / XAMPP)
 */

// อ่านค่าจาก Railway Environment Variables ถ้าไม่มีให้ใช้ localhost (สำหรับรันในเครื่อง)
$servername = getenv('MYSQLHOST') ?: ($_ENV['MYSQLHOST'] ?? "localhost");
$username   = getenv('MYSQLUSER') ?: ($_ENV['MYSQLUSER'] ?? "root");
$password   = getenv('MYSQLPASSWORD') !== false ? getenv('MYSQLPASSWORD') : (isset($_ENV['MYSQLPASSWORD']) ? $_ENV['MYSQLPASSWORD'] : "root");
$dbname     = getenv('MYSQLDATABASE') ?: ($_ENV['MYSQLDATABASE'] ?? "db_northwind");
$port       = getenv('MYSQLPORT') ?: ($_ENV['MYSQLPORT'] ?? "3306");
$charset    = "utf8mb4";

$conn = null;

try {
    $conn = new PDO("mysql:host=$servername;port=$port;dbname=$dbname;charset=$charset", $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    // กรณีรันบน Localhost แล้วเชื่อมต่อ 'root' ไม่ผ่าน ให้ลองรหัสผ่านว่าง '' หรือ พอร์ต 8889
    if ($servername === 'localhost' || $servername === '127.0.0.1') {
        try {
            $conn = new PDO("mysql:host=$servername;port=$port;dbname=$dbname;charset=$charset", $username, "", [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e2) {
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
                    'message' => 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ' . $e3->getMessage()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
?>
