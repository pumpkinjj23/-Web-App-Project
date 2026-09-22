<?php
/**
 * SupplierController.php - จัดการข้อมูลผู้จัดจำหน่าย
 */

require_once __DIR__ . '/../../inc/ConnDB.php';
require_once __DIR__ . '/../core/Response.php';

class SupplierController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    /**
     * GET /api/suppliers - ดึงรายชื่อผู้จัดจำหน่ายทั้งหมด
     */
    public function index() {
        try {
            $sql = "SELECT i_SupplierID, c_SupplierName, c_ContactName, c_Address, c_City, c_PostalCode, c_Country, c_Phone 
                    FROM tb_suppliers 
                    ORDER BY i_SupplierID ASC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($suppliers, 'ดึงข้อมูลผู้จัดจำหน่ายสำเร็จ');
        } catch (PDOException $e) {
            Response::serverError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้จัดจำหน่าย: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/suppliers/{id} - ดึงข้อมูลผู้จัดจำหน่ายตาม ID
     */
    public function show($id) {
        try {
            $sql = "SELECT i_SupplierID, c_SupplierName, c_ContactName, c_Address, c_City, c_PostalCode, c_Country, c_Phone 
                    FROM tb_suppliers 
                    WHERE i_SupplierID = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $supplier = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($supplier) {
                Response::success($supplier, 'พบข้อมูลผู้จัดจำหน่าย');
            } else {
                Response::notFound('ไม่พบผู้จัดจำหน่ายรหัส ' . $id);
            }
        } catch (PDOException $e) {
            Response::serverError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้จัดจำหน่าย: ' . $e->getMessage());
        }
    }
}
?>
