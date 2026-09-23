<?php
/**
 * ConnDB.php - การเชื่อมต่อฐานข้อมูลอัจฉริยะ รองรับทั้ง Railway Cloud MySQL และ Localhost MAMP/XAMPP
 */

// ปิดการแสดงข้อผิดพลาดที่ไม่จำเป็น เพื่อไม่ให้ JSON Response พัง
error_reporting(E_ALL);
ini_set('display_errors', 0);

/**
 * ฟังก์ชันดึงค่า Environment Variable จากทุกช่องทาง
 */
function getEnvVar($key, $default = '') {
    $val = getenv($key);
    if ($val !== false && $val !== '') return $val;
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return $_SERVER[$key];
    return $default;
}

// 1. ตรวจสอบ Connection URL (MYSQL_URL, DATABASE_URL, MYSQL_PUBLIC_URL)
$mysqlUrl = getEnvVar('MYSQL_URL') ?: (getEnvVar('DATABASE_URL') ?: getEnvVar('MYSQL_PUBLIC_URL'));
$urlHost = null;
$urlPort = null;
$urlUser = null;
$urlPass = null;
$urlDb   = null;

if (!empty($mysqlUrl)) {
    $parsed = parse_url($mysqlUrl);
    if ($parsed) {
        if (!empty($parsed['host'])) $urlHost = $parsed['host'];
        if (!empty($parsed['port'])) $urlPort = (string)$parsed['port'];
        if (!empty($parsed['user'])) $urlUser = $parsed['user'];
        if (isset($parsed['pass']))   $urlPass = $parsed['pass'];
        if (!empty($parsed['path'])) $urlDb   = ltrim($parsed['path'], '/');
    }
}

// 2. ตรวจสอบค่าตัวแปรรายตัว
$envHost = getEnvVar('MYSQLHOST') ?: getEnvVar('DB_HOST');
$envPort = getEnvVar('MYSQLPORT') ?: (getEnvVar('DB_PORT') ?: '3306');
$envUser = getEnvVar('MYSQLUSER') ?: (getEnvVar('DB_USER') ?: 'root');
$envPass = getEnvVar('MYSQLPASSWORD') !== '' ? getEnvVar('MYSQLPASSWORD') : (getEnvVar('DB_PASSWORD') !== '' ? getEnvVar('DB_PASSWORD') : null);
$envDb   = getEnvVar('MYSQLDATABASE') ?: (getEnvVar('DB_NAME') ?: 'db_northwind');

$charset = "utf8mb4";
$conn = null;
$lastError = null;
$connectedConfig = null;

// รายชื่อฐานข้อมูลที่จะลองเชื่อมต่อ (db_northwind หรือ railway)
$dbList = array_unique(array_filter([$urlDb, $envDb, 'db_northwind', 'railway']));

// สร้างรายการ Configurations ที่จะลองเชื่อมต่อตามลำดับความสำคัญ
$configsToTry = [];

// A. หากมี URL จาก Railway Environment
if ($urlHost) {
    foreach ($dbList as $db) {
        $configsToTry[] = [
            'label' => 'Railway MYSQL_URL',
            'host'  => $urlHost,
            'port'  => $urlPort ?: '3306',
            'user'  => $urlUser ?: 'root',
            'pass'  => $urlPass ?? '',
            'db'    => $db
        ];
    }
}

// B. หากมี Environment Variables ระบุไว้
if ($envHost) {
    foreach ($dbList as $db) {
        $configsToTry[] = [
            'label' => 'Environment Variables',
            'host'  => $envHost,
            'port'  => $envPort,
            'user'  => $envUser,
            'pass'  => $envPass ?? '',
            'db'    => $db
        ];
    }
}

// C. Railway Private Network Fallback (สำหรับกรณี Deploy บน Railway)
$railwayHosts = ['mysql.railway.internal', 'mysql'];
foreach ($railwayHosts as $rHost) {
    foreach ($dbList as $db) {
        if ($envPass !== null) {
            $configsToTry[] = [
                'label' => "Railway Internal ($rHost with ENV Pass)",
                'host'  => $rHost,
                'port'  => '3306',
                'user'  => $envUser ?: 'root',
                'pass'  => $envPass,
                'db'    => $db
            ];
        }
    }
}

// D. Localhost Fallbacks (MAMP Windows: root:root / MAMP Mac: 8889 / XAMPP: root:no-password)
$localHosts = ['127.0.0.1', 'localhost'];
$localPorts = [3306, 8889, 3307];
$localPasses = ['root', ''];

foreach ($localHosts as $h) {
    foreach ($localPorts as $p) {
        foreach ($localPasses as $pwd) {
            foreach ($dbList as $db) {
                $configsToTry[] = [
                    'label' => "Localhost ($h:$p, pass:" . ($pwd === '' ? 'none' : 'root') . ")",
                    'host'  => $h,
                    'port'  => $p,
                    'user'  => 'root',
                    'pass'  => $pwd,
                    'db'    => $db
                ];
            }
        }
    }
}

// เชื่อมต่อตามรายการ Configurations
foreach ($configsToTry as $cfg) {
    try {
        $dsn = "mysql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['db']};charset={$charset}";
        $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 2, // Timeout รวดเร็วเพียง 2 วินาที ป้องกันหน้าเว็บค้าง
        ]);
        if ($pdo) {
            $conn = $pdo;
            $connectedConfig = $cfg;
            break;
        }
    } catch (PDOException $e) {
        $lastError = $e;
        $conn = null;
    }
}

// หากไม่สามารถเชื่อมต่อได้เลย
if (!$conn) {
    http_response_code(500);
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
    }
    echo json_encode([
        'success' => false,
        'status'  => 500,
        'message' => 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ' . ($lastError ? $lastError->getMessage() : 'กรุณาตรวจสอบการตั้งค่า MySQL'),
        'hint'    => 'สำหรับ Localhost: เปิดโปรแกรม MAMP แล้วกด Start Servers | สำหรับ Railway: เข้าแท็บ Variables ของ Web Service แล้วกด Add Reference -> เลือกตัวแปรจาก MySQL'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
?>
