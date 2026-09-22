<?php
/**
 * CategoryController.php - จัดการข้อมูลหมวดหมู่สินค้า
 * อ้างอิงตามโครงสร้าง Slide 10, 14
 */

require_once __DIR__ . '/../../inc/ConnDB.php';
require_once __DIR__ . '/../core/Response.php';

class CategoryController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    /**
     * GET /api/categories - ดึงรายชื่อหมวดหมู่ทั้งหมด
     */
    public function index() {
        try {
            $sql = "SELECT i_CategoryID, c_CategoryName, c_Description FROM tb_categories ORDER BY i_CategoryID ASC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($categories, 'ดึงข้อมูลหมวดหมู่สินค้าสำเร็จ');
        } catch (PDOException $e) {
            Response::serverError('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/categories/{id} - ดึงข้อมูลหมวดหมู่ตาม ID
     */
    public function show($id) {
        try {
            $sql = "SELECT i_CategoryID, c_CategoryName, c_Description FROM tb_categories WHERE i_CategoryID = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $category = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($category) {
                Response::success($category, 'พบข้อมูลหมวดหมู่สินค้า');
            } else {
                Response::notFound('ไม่พบหมวดหมู่สินค้ารหัส ' . $id);
            }
        } catch (PDOException $e) {
            Response::serverError('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่: ' . $e->getMessage());
        }
    }
}
?>
