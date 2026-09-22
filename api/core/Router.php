<?php
/**
 * Router.php - Simple RESTful Router
 * อ้างอิงตามโครงสร้าง Slide 9, 13
 */

require_once __DIR__ . '/Response.php';

class Router {
    private $routes = [];

    public function get($path, $handler) {
        $this->addRoute('GET', $path, $handler);
    }

    public function post($path, $handler) {
        $this->addRoute('POST', $path, $handler);
    }

    public function put($path, $handler) {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete($path, $handler) {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute($method, $path, $handler) {
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . trim($pattern, '/') . '$#';
        
        $this->routes[] = [
            'method'   => strtoupper($method),
            'pattern'  => $pattern,
            'original' => $path,
            'handler'  => $handler
        ];
    }

    public function dispatch($method, $uri) {
        // จัดการกรณี OPTIONS (CORS preflight)
        if ($method === 'OPTIONS') {
            Response::json(200, null, 'OK', true);
            return;
        }

        // ตัด query string ออก และ normalize path
        $path = parse_url($uri, PHP_URL_PATH);
        
        // ตัด base directory เช่น /cpe66/Projack/api หรือ /api ออก เพื่อให้เหลือเฉพาะ resource route
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        $baseDir = dirname($scriptName); // e.g. /cpe66/Projack/api
        
        if (strpos($path, $baseDir) === 0) {
            $path = substr($path, strlen($baseDir));
        }

        $path = trim($path, '/');

        // ถ้ามี query parameter 'route' ส่งมาโดยตรง (สำหรับกรณีที่ mod_rewrite ไม่ทำงาน)
        if (isset($_GET['route']) && !empty($_GET['route'])) {
            $path = trim($_GET['route'], '/');
        }

        // ค้นหา Route ที่ตรงกัน
        foreach ($this->routes as $route) {
            if ($route['method'] === $method) {
                if (preg_match($route['pattern'], $path, $matches)) {
                    // กรองเฉพาะ named parameters
                    $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                    
                    // เรียกใช้งาน handler
                    $handler = $route['handler'];
                    if (is_callable($handler)) {
                        call_user_func_array($handler, array_values($params));
                        return;
                    } elseif (is_array($handler) && count($handler) === 2) {
                        list($controller, $action) = $handler;
                        if (is_string($controller)) {
                            $controller = new $controller();
                        }
                        call_user_func_array([$controller, $action], array_values($params));
                        return;
                    }
                }
            }
        }

        // ตรวจสอบว่า path ตรงแต่ Method ไม่ตรงหรือไม่
        foreach ($this->routes as $route) {
            if (preg_match($route['pattern'], $path)) {
                Response::methodNotAllowed("HTTP Method '{$method}' is not allowed for path '/{$path}'");
                return;
            }
        }

        Response::notFound("API Endpoint '/{$path}' not found");
    }
}
?>
