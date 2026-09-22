<?php
/**
 * ConnDB.php - การเชื่อมต่อฐานข้อมูลสำหรับ Railway MySQL (Northwind Database)
 */

$servername = getenv('MYSQLHOST') ?: "mysql.railway.internal";
$username   = getenv('MYSQLUSER') ?: "root";
$password   = (getenv('MYSQLPASSWORD') !== false && getenv('MYSQLPASSWORD') !== '') ? getenv('MYSQLPASSWORD') : "foWpjwaElvnSkrGjBXfQGWHJYjOTMDyo";
$dbname     = "db_northwind";
$port       = getenv('MYSQLPORT') ?: "3306";
$charset    = "utf8mb4";

$conn = null;

try {
    $conn = new PDO("mysql:host=$servername;port=$port;dbname=$dbname;charset=$charset", $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
