<?php
/**
 * ConnDB.php - การเชื่อมต่อฐานข้อมูลสำหรับ Railway MySQL และ Localhost MAMP (Northwind Database)
 */

// 1. อ่านค่าจาก MYSQL_URL หรือ DATABASE_URL ถ้ามี
$mysqlUrl = getenv('MYSQL_URL') ?: (getenv('DATABASE_URL') ?: ($_ENV['MYSQL_URL'] ?? ($_ENV['DATABASE_URL'] ?? '')));
if (!empty($mysqlUrl)) {
    $parsedUrl = parse_url($mysqlUrl);
    if ($parsedUrl) {
        if (!empty($parsedUrl['host'])) $railwayHost = $parsedUrl['host'];
        if (!empty($parsedUrl['port'])) $railwayPort = (string)$parsedUrl['port'];
        if (!empty($parsedUrl['user'])) $railwayUser = $parsedUrl['user'];
        if (isset($parsedUrl['pass']))   $railwayPass = $parsedUrl['pass'];
        if (!empty($parsedUrl['path'])) $railwayDb   = ltrim($parsedUrl['path'], '/');
    }
}

// 2. อ่านค่า Host, User, Pass, Db, Port
$fallbackPass = "foWpjwaElvnSkrGjBXfQGWHJYjOTMDyo";
$servername = $railwayHost ?? (getenv('MYSQLHOST') ?: ($_ENV['MYSQLHOST'] ?? "localhost"));
$username   = $railwayUser ?? (getenv('MYSQLUSER') ?: ($_ENV['MYSQLUSER'] ?? "root"));
$password   = isset($railwayPass) ? $railwayPass : (getenv('MYSQLPASSWORD') !== false ? getenv('MYSQLPASSWORD') : (isset($_ENV['MYSQLPASSWORD']) ? $_ENV['MYSQLPASSWORD'] : "root"));
$dbname     = $railwayDb   ?? (getenv('MYSQLDATABASE') ?: ($_ENV['MYSQLDATABASE'] ?? "db_northwind"));
$port       = $railwayPort ?? (getenv('MYSQLPORT') ?: ($_ENV['MYSQLPORT'] ?? "3306"));
$charset    = "utf8mb4";

$conn = null;
$lastError = null;

// รายชื่อชื่อฐานข้อมูลที่จะลองเชื่อมต่อ (db_northwind หรือ railway)
$dbNamesToTry = array_unique(array_filter([$dbname, 'db_northwind', 'railway']));

// รายการ Configurations ที่จะลองเชื่อมต่อตามลำดับ
$configsToTry = [];

// A. ลอง Environment Variables ที่ตั้งไว้
foreach ($dbNamesToTry as $d) {
    $configsToTry[] = ['host' => $servername, 'port' => $port, 'user' => $username, 'pass' => $password, 'db' => $d];
}

// B. สำหรับ Railway Cloud Fallback (mysql.railway.internal)
$railwayHosts = ['mysql.railway.internal', 'roundhouse.proxy.rlwy.net'];
foreach ($railwayHosts as $rh) {
    foreach ($dbNamesToTry as $d) {
        $configsToTry[] = ['host' => $rh, 'port' => $port, 'user' => 'root', 'pass' => $fallbackPass, 'db' => $d];
        $configsToTry[] = ['host' => $rh, 'port' => $port, 'user' => $username, 'pass' => $password, 'db' => $d];
    }
}

// C. สำหรับ Localhost (MAMP / XAMPP)
if ($servername === 'localhost' || $servername === '127.0.0.1' || !getenv('MYSQLHOST')) {
    $localHosts = ['localhost', '127.0.0.1'];
    $localPorts = [3306, 8889, 3307];
    $localPasses = ['root', ''];

    foreach ($localHosts as $h) {
        foreach ($localPorts as $p) {
            foreach ($localPasses as $pwd) {
                foreach ($dbNamesToTry as $d) {
                    $configsToTry[] = ['host' => $h, 'port' => $p, 'user' => 'root', 'pass' => $pwd, 'db' => $d];
                }
            }
        }
    }
}

foreach ($configsToTry as $cfg) {
    try {
        $dsn = "mysql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['db']};charset={$charset}";
        $conn = new PDO($dsn, $cfg['user'], $cfg['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 3,
        ]);
        if ($conn) {
            break; // เชื่อมต่อสำเร็จ
        }
    } catch (PDOException $e) {
        $lastError = $e;
        $conn = null;
    }
}

if (!$conn) {
    http_response_code(500);
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode([
        'success' => false,
        'message' => 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ' . ($lastError ? $lastError->getMessage() : 'กรุณาตรวจสอบการตั้งค่า MySQL'),
        'hint'    => 'สำหรับ Localhost: กรุณาเปิดโปรแกรม MAMP แล้วกดปุ่ม Start Servers | สำหรับ Railway: กรุณากดปุ่ม Deploy และตรวจสอบว่าได้ Import ข้อมูล dbNorthwind.sql แล้ว'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
