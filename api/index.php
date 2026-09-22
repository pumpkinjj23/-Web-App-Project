<?php
/**
 * api/index.php - RESTful API Front Controller
 * อ้างอิงตามโครงสร้าง Slide 9, 10, 13, 14
 */

// เปิดการแสดง Error ในขั้นตอนการพัฒนา
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/controllers/CategoryController.php';
require_once __DIR__ . '/controllers/SupplierController.php';
require_once __DIR__ . '/controllers/ProductController.php';

$router = new Router();

// ==========================================
// กำหนด Routes ตามตาราง CRUD (Slide 8, 10, 14)
// ==========================================

// --- Categories API ---
$router->get('/categories', [CategoryController::class, 'index']);
$router->get('/categories/{id}', [CategoryController::class, 'show']);

// --- Suppliers API ---
$router->get('/suppliers', [SupplierController::class, 'index']);
$router->get('/suppliers/{id}', [SupplierController::class, 'show']);

// --- Products API (CRUD) ---
$router->get('/products', [ProductController::class, 'index']);
$router->get('/products/{id}', [ProductController::class, 'show']);
$router->post('/products', [ProductController::class, 'store']);
$router->put('/products/{id}', [ProductController::class, 'update']);
$router->post('/products/{id}', [ProductController::class, 'update']);
$router->delete('/products/{id}', [ProductController::class, 'destroy']);
$router->post('/products/delete/{id}', [ProductController::class, 'destroy']);

// Route สำหรับตรวจสอบสถานะ API / Ping
$router->get('/ping', function() {
    Response::success([
        'status'    => 'online',
        'timestamp' => date('Y-m-d H:i:s'),
        'api'       => 'Northwind RESTful API v1.0'
    ], 'API is running normally');
});

// เริ่มต้น Dispatch Request
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri    = $_SERVER['REQUEST_URI'] ?? '/';

$router->dispatch($method, $uri);
?>
