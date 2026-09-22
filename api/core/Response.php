<?php
/**
 * Response.php - RESTful API JSON Response Handler
 * อ้างอิงตามโครงสร้าง Slide 9, 13
 */

class Response {
    /**
     * ส่งข้อมูล JSON กลับไปยัง Frontend
     *
     * @param int $statusCode HTTP Status Code (200, 201, 400, 404, 405, 500)
     * @param mixed $data ข้อมูลที่ต้องการส่ง
     * @param string|null $message ข้อความตอบกลับ
     * @param bool $success สถานะความสำเร็จ
     */
    public static function json($statusCode = 200, $data = null, $message = '', $success = true) {
        // Clear buffer if any
        if (ob_get_length()) ob_clean();

        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

        $response = [
            'success' => $success,
            'status'  => $statusCode
        ];

        if ($message !== '') {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    public static function success($data = null, $message = 'ดำเนินการสำเร็จ', $statusCode = 200) {
        self::json($statusCode, $data, $message, true);
    }

    public static function created($data = null, $message = 'บันทึกข้อมูลเรียบร้อยแล้ว') {
        self::json(201, $data, $message, true);
    }

    public static function error($message = 'เกิดข้อผิดพลาด', $statusCode = 400, $data = null) {
        self::json($statusCode, $data, $message, false);
    }

    public static function notFound($message = 'ไม่พบข้อมูลที่ต้องการ') {
        self::json(404, null, $message, false);
    }

    public static function methodNotAllowed($message = 'Method Not Allowed') {
        self::json(405, null, $message, false);
    }

    public static function serverError($message = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์') {
        self::json(500, null, $message, false);
    }
}
?>
