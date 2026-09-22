<?php
/**
 * ProductController.php - จัดการ CRUD ข้อมูลสินค้าทั้งหมด (tb_products)
 * อ้างอิงตามโครงสร้าง Slide 5, 6, 7, 8
 */

require_once __DIR__ . '/../../inc/ConnDB.php';
require_once __DIR__ . '/../core/Response.php';

class ProductController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    /**
     * Helper สำหรับอ่าน Request Body (รองรับทั้ง JSON, $_POST, และ x-www-form-urlencoded)
     */
    private function getRequestData() {
        $data = [];
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (strpos($contentType, 'application/json') !== false) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true) ?? [];
        } else {
            $data = $_POST;
            if (empty($data)) {
                $raw = file_get_contents('php://input');
                parse_str($raw, $data);
            }
        }
        return $data;
    }

    /**
     * GET /api/products - ค้นหาและดึงรายการสินค้า พร้อมการกรองและจัดเรียง
     */
    public function index() {
        try {
            $keyword    = trim($_GET['keyword'] ?? '');
            $catId      = trim($_GET['catId'] ?? '');
            $supplierId = trim($_GET['supplierId'] ?? '');
            $minPrice   = trim($_GET['minPrice'] ?? '');
            $maxPrice   = trim($_GET['maxPrice'] ?? '');
            $sortBy     = trim($_GET['sortBy'] ?? 'i_ProductID');
            $sortOrder  = strtoupper(trim($_GET['sortOrder'] ?? 'DESC')) === 'ASC' ? 'ASC' : 'DESC';

            // ป้องกัน SQL Injection บน Order By
            $allowedSorts = [
                'i_ProductID'   => 'p.i_ProductID',
                'c_ProductName' => 'p.c_ProductName',
                'i_Price'       => 'p.i_Price',
                'c_CategoryName'=> 'c.c_CategoryName',
                'c_SupplierName'=> 's.c_SupplierName',
                'c_Unit'        => 'p.c_Unit'
            ];
            $orderColumn = $allowedSorts[$sortBy] ?? 'p.i_ProductID';

            // Query หลักพร้อม JOIN ตาราง หมวดหมู่ และ ผู้จัดจำหน่าย
            $sql = "SELECT p.i_ProductID, p.c_ProductName, p.i_SupplierID, p.i_CategoryID, p.c_Unit, p.i_Price,
                           c.c_CategoryName, c.c_Description AS c_CategoryDescription,
                           s.c_SupplierName, s.c_ContactName, s.c_Phone AS c_SupplierPhone, s.c_Country AS c_SupplierCountry
                    FROM tb_products p
                    LEFT JOIN tb_categories c ON p.i_CategoryID = c.i_CategoryID
                    LEFT JOIN tb_suppliers s ON p.i_SupplierID = s.i_SupplierID
                    WHERE 1=1";

            $params = [];

            // กรอง Keyword (ค้นจากชื่อสินค้า หรือ รหัสสินค้า)
            if ($keyword !== '') {
                if (is_numeric($keyword)) {
                    $sql .= " AND (p.c_ProductName LIKE :kw_name OR p.i_ProductID = :kw_id)";
                    $params[':kw_name'] = "%{$keyword}%";
                    $params[':kw_id']   = (int)$keyword;
                } else {
                    $sql .= " AND (p.c_ProductName LIKE :kw_name OR c.c_CategoryName LIKE :kw_cat OR s.c_SupplierName LIKE :kw_sup)";
                    $params[':kw_name'] = "%{$keyword}%";
                    $params[':kw_cat']  = "%{$keyword}%";
                    $params[':kw_sup']  = "%{$keyword}%";
                }
            }

            // กรองตามหมวดหมู่
            if ($catId !== '' && $catId !== 'all') {
                $sql .= " AND p.i_CategoryID = :catId";
                $params[':catId'] = (int)$catId;
            }

            // กรองตามผู้จัดจำหน่าย
            if ($supplierId !== '' && $supplierId !== 'all') {
                $sql .= " AND p.i_SupplierID = :supplierId";
                $params[':supplierId'] = (int)$supplierId;
            }

            // กรองตามช่วงราคา
            if ($minPrice !== '' && is_numeric($minPrice)) {
                $sql .= " AND p.i_Price >= :minPrice";
                $params[':minPrice'] = (float)$minPrice;
            }
            if ($maxPrice !== '' && is_numeric($maxPrice)) {
                $sql .= " AND p.i_Price <= :maxPrice";
                $params[':maxPrice'] = (float)$maxPrice;
            }

            $sql .= " ORDER BY {$orderColumn} {$sortOrder}";

            $stmt = $this->conn->prepare($sql);
            foreach ($params as $key => $val) {
                if (is_int($val)) {
                    $stmt->bindValue($key, $val, PDO::PARAM_INT);
                } else {
                    $stmt->bindValue($key, $val, PDO::PARAM_STR);
                }
            }
            $stmt->execute();
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // ดึงสถิติภาพรวม
            $statStmt = $this->conn->query("SELECT 
                COUNT(*) as totalProducts,
                COALESCE(AVG(i_Price), 0) as avgPrice,
                COALESCE(MIN(i_Price), 0) as minPrice,
                COALESCE(MAX(i_Price), 0) as maxPrice
                FROM tb_products");
            $stats = $statStmt->fetch(PDO::FETCH_ASSOC);

            Response::success([
                'items' => $products,
                'total' => count($products),
                'stats' => [
                    'totalProducts' => (int)$stats['totalProducts'],
                    'avgPrice'      => round((float)$stats['avgPrice'], 2),
                    'minPrice'      => (float)$stats['minPrice'],
                    'maxPrice'      => (float)$stats['maxPrice']
                ]
            ], 'ดึงรายการสินค้าสำเร็จ');

        } catch (PDOException $e) {
            Response::serverError('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/products/{id} - ดึงรายละเอียดสินค้ารายชิ้น
     */
    public function show($id) {
        try {
            $sql = "SELECT p.i_ProductID, p.c_ProductName, p.i_SupplierID, p.i_CategoryID, p.c_Unit, p.i_Price,
                           c.c_CategoryName, c.c_Description AS c_CategoryDescription,
                           s.c_SupplierName, s.c_ContactName, s.c_Phone AS c_SupplierPhone, s.c_Address AS c_SupplierAddress, s.c_City AS c_SupplierCity, s.c_Country AS c_SupplierCountry
                    FROM tb_products p
                    LEFT JOIN tb_categories c ON p.i_CategoryID = c.i_CategoryID
                    LEFT JOIN tb_suppliers s ON p.i_SupplierID = s.i_SupplierID
                    WHERE p.i_ProductID = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($product) {
                Response::success($product, 'พบข้อมูลสินค้า');
            } else {
                Response::notFound('ไม่พบสินค้ารหัส ' . $id);
            }
        } catch (PDOException $e) {
            Response::serverError('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/products - เพิ่มข้อมูลสินค้าใหม่ (Slide 5, 7)
     */
    public function store() {
        $data = $this->getRequestData();

        // รับค่าและตัดช่องว่างตาม Slide 5
        $productName = trim($data['ProductName'] ?? ($data['c_ProductName'] ?? ''));
        $supplierId  = trim($data['SupplierID']  ?? ($data['i_SupplierID'] ?? ''));
        $catId       = trim($data['CatID']       ?? ($data['i_CategoryID'] ?? ''));
        $unit        = trim($data['Unit']        ?? ($data['c_Unit'] ?? ''));
        $price       = trim($data['Price']       ?? ($data['i_Price'] ?? ($data['f_Price'] ?? '')));

        // Server-Side Validation
        $errors = [];
        if ($productName === '') {
            $errors['ProductName'] = 'กรุณากรอกชื่อสินค้า (ProductName)';
        } elseif (mb_strlen($productName) > 30) {
            $errors['ProductName'] = 'ชื่อสินค้าต้องมีความยาวไม่เกิน 30 ตัวอักษร';
        }

        if ($supplierId === '' || !is_numeric($supplierId) || (int)$supplierId <= 0) {
            $errors['SupplierID'] = 'กรุณาเลือกผู้จัดจำหน่าย (SupplierID)';
        }

        if ($catId === '' || !is_numeric($catId) || (int)$catId <= 0) {
            $errors['CatID'] = 'กรุณาเลือกหมวดหมู่สินค้า (CatID)';
        }

        if ($unit === '') {
            $errors['Unit'] = 'กรุณากรอกขนาดบรรจุ/หน่วยนับ (Unit)';
        } elseif (mb_strlen($unit) > 30) {
            $errors['Unit'] = 'หน่วยนับต้องมีความยาวไม่เกิน 30 ตัวอักษร';
        }

        if ($price === '' || !is_numeric($price) || (float)$price <= 0) {
            $errors['Price'] = 'ราคาสินค้าต้องเป็นตัวเลขที่มากกว่า 0';
        }

        if (!empty($errors)) {
            Response::error('ข้อมูลไม่ถูกต้องตามเงื่อนไข', 400, ['errors' => $errors]);
            return;
        }

        try {
            // ใช้คำสั่ง SQL และ PDO bindParam ตาม Slide 7
            $sql = "INSERT INTO tb_products (c_ProductName, i_SupplierID, i_CategoryID, c_Unit, i_Price)
                    VALUES (:productName, :supplierId, :catId, :unit, :price)";

            $result = $this->conn->prepare($sql);
            $result->bindParam(':productName', $productName, PDO::PARAM_STR);
            $result->bindParam(':supplierId',  $supplierId,  PDO::PARAM_INT);
            $result->bindParam(':catId',       $catId,       PDO::PARAM_INT);
            $result->bindParam(':unit',        $unit,        PDO::PARAM_STR);
            $result->bindParam(':price',       $price,       PDO::PARAM_STR);
            $result->execute();

            $insertId = (int)$this->conn->lastInsertId();

            Response::json(201, [
                'id'            => $insertId,
                'i_ProductID'   => $insertId,
                'c_ProductName' => $productName,
                'i_SupplierID'  => (int)$supplierId,
                'i_CategoryID'  => (int)$catId,
                'c_Unit'        => $unit,
                'i_Price'       => (float)$price
            ], 'บันทึกข้อมูลสินค้าเรียบร้อยแล้ว', true);

        } catch (PDOException $e) {
            Response::serverError('ไม่สามารถบันทึกข้อมูลได้ : ' . $e->getMessage());
        }
    }

    /**
     * PUT or POST /api/products/{id} - แก้ไขข้อมูลสินค้าเดิม (Slide 6)
     */
    public function update($id) {
        $id = (int)$id;
        if ($id <= 0) {
            Response::error('รหัสสินค้าไม่ถูกต้อง', 400);
            return;
        }

        // ตรวจสอบว่าสินค้ามีอยู่จริงหรือไม่
        $checkStmt = $this->conn->prepare("SELECT i_ProductID FROM tb_products WHERE i_ProductID = :id");
        $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        if (!$checkStmt->fetch()) {
            Response::notFound('ไม่พบสินค้ารหัส ' . $id);
            return;
        }

        $data = $this->getRequestData();

        $productName = trim($data['ProductName'] ?? ($data['c_ProductName'] ?? ''));
        $supplierId  = trim($data['SupplierID']  ?? ($data['i_SupplierID'] ?? ''));
        $catId       = trim($data['CatID']       ?? ($data['i_CategoryID'] ?? ''));
        $unit        = trim($data['Unit']        ?? ($data['c_Unit'] ?? ''));
        $price       = trim($data['Price']       ?? ($data['i_Price'] ?? ($data['f_Price'] ?? '')));

        // Server-Side Validation
        $errors = [];
        if ($productName === '') {
            $errors['ProductName'] = 'กรุณากรอกชื่อสินค้า (ProductName)';
        } elseif (mb_strlen($productName) > 30) {
            $errors['ProductName'] = 'ชื่อสินค้าต้องมีความยาวไม่เกิน 30 ตัวอักษร';
        }

        if ($supplierId === '' || !is_numeric($supplierId) || (int)$supplierId <= 0) {
            $errors['SupplierID'] = 'กรุณาเลือกผู้จัดจำหน่าย (SupplierID)';
        }

        if ($catId === '' || !is_numeric($catId) || (int)$catId <= 0) {
            $errors['CatID'] = 'กรุณาเลือกหมวดหมู่สินค้า (CatID)';
        }

        if ($unit === '') {
            $errors['Unit'] = 'กรุณากรอกขนาดบรรจุ/หน่วยนับ (Unit)';
        } elseif (mb_strlen($unit) > 30) {
            $errors['Unit'] = 'หน่วยนับต้องมีความยาวไม่เกิน 30 ตัวอักษร';
        }

        if ($price === '' || !is_numeric($price) || (float)$price <= 0) {
            $errors['Price'] = 'ราคาสินค้าต้องเป็นตัวเลขที่มากกว่า 0';
        }

        if (!empty($errors)) {
            Response::error('ข้อมูลไม่ถูกต้องตามเงื่อนไข', 400, ['errors' => $errors]);
            return;
        }

        try {
            $sql = "UPDATE tb_products 
                    SET c_ProductName = :productName,
                        i_SupplierID  = :supplierId,
                        i_CategoryID  = :catId,
                        c_Unit        = :unit,
                        i_Price       = :price
                    WHERE i_ProductID = :id";

            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':productName', $productName, PDO::PARAM_STR);
            $stmt->bindParam(':supplierId',  $supplierId,  PDO::PARAM_INT);
            $stmt->bindParam(':catId',       $catId,       PDO::PARAM_INT);
            $stmt->bindParam(':unit',        $unit,        PDO::PARAM_STR);
            $stmt->bindParam(':price',       $price,       PDO::PARAM_STR);
            $stmt->bindParam(':id',          $id,          PDO::PARAM_INT);
            $stmt->execute();

            Response::success([
                'id'            => $id,
                'i_ProductID'   => $id,
                'c_ProductName' => $productName,
                'i_SupplierID'  => (int)$supplierId,
                'i_CategoryID'  => (int)$catId,
                'c_Unit'        => $unit,
                'i_Price'       => (float)$price
            ], 'แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว');

        } catch (PDOException $e) {
            Response::serverError('ไม่สามารถบันทึกข้อมูลได้ : ' . $e->getMessage());
        }
    }

    /**
     * DELETE /api/products/{id} - ลบข้อมูลสินค้า (Slide 8)
     */
    public function destroy($id) {
        $id = (int)$id;
        if ($id <= 0) {
            Response::error('รหัสสินค้าไม่ถูกต้อง', 400);
            return;
        }

        try {
            // ตรวจสอบว่าสินค้ามีอยู่จริงหรือไม่
            $stmt = $this->conn->prepare("SELECT i_ProductID, c_ProductName FROM tb_products WHERE i_ProductID = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                Response::notFound('ไม่พบสินค้ารหัส ' . $id);
                return;
            }

            // ทำการลบข้อมูล
            $delStmt = $this->conn->prepare("DELETE FROM tb_products WHERE i_ProductID = :id");
            $delStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $delStmt->execute();

            Response::success([
                'id'          => $id,
                'productName' => $product['c_ProductName']
            ], 'ลบข้อมูลสินค้า ' . $product['c_ProductName'] . ' สำเร็จเรียบร้อยแล้ว');

        } catch (PDOException $e) {
            Response::serverError('เกิดข้อผิดพลาดในการลบสินค้า: ' . $e->getMessage());
        }
    }
}
?>
