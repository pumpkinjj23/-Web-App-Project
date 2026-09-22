<?php
/**
 * process_product.php - สคริปต์ประมวลผลข้อมูลสินค้า (Insert, Update, Delete)
 * อ้างอิงตาม Slide 2, 3, 4, 5, 6, 7
 */

header('Content-Type: application/json; charset=utf-8');

// Step 2 : เชื่อมต่อฐานข้อมูล (Slide 2, 3)
require_once __DIR__ . '/inc/ConnDB.php';

// ตรวจสอบ HTTP Method (Slide 4)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false, 
        'message' => 'Method Not Allowed'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// รับค่าจาก $_POST (Slide 5)
$productName = trim($_POST['ProductName'] ?? ($_POST['c_ProductName'] ?? ''));
$supplierId  = trim($_POST['SupplierID']  ?? ($_POST['i_SupplierID'] ?? ''));
$catId       = trim($_POST['CatID']       ?? ($_POST['i_CategoryID'] ?? ''));
$unit        = trim($_POST['Unit']        ?? ($_POST['c_Unit'] ?? ''));
$price       = trim($_POST['Price']       ?? ($_POST['i_Price'] ?? ''));
$quantity    = trim($_POST['Quantity']    ?? '0');
$productID   = trim($_POST['ProductID']   ?? ($_POST['i_ProductID'] ?? ''));
$action      = trim($_POST['action']      ?? 'insert');

// จัดการกรณี Action ต่างๆ (Slide 6, 7)
try {
    if ($action === 'delete' && !empty($productID)) {
        // --- กรณีลบข้อมูล (Delete) ---
        $stmt = $conn->prepare("DELETE FROM tb_products WHERE i_ProductID = :productID");
        $stmt->bindParam(':productID', $productID, PDO::PARAM_INT);
        $stmt->execute();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'ลบข้อมูลสินค้าเรียบร้อยแล้ว',
            'id'      => (int)$productID
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } else if ($action === 'update' && !empty($productID)) {
        // --- กรณีแก้ไขข้อมูล (Update) (Slide 6) ---
        // Server-side Validation
        $errors = [];
        if (empty($productName)) $errors[] = 'กรุณากรอกชื่อสินค้า';
        if (empty($supplierId) || (int)$supplierId <= 0) $errors[] = 'กรุณาเลือกผู้จัดจำหน่าย';
        if (empty($catId) || (int)$catId <= 0) $errors[] = 'กรุณาเลือกหมวดหมู่สินค้า';
        if (empty($unit)) $errors[] = 'กรุณากรอกหน่วยนับ';
        if (empty($price) || !is_numeric($price) || (float)$price <= 0) $errors[] = 'ราคาสินค้าต้องมากกว่า 0';

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => implode(', ', $errors),
                'errors'  => $errors
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "UPDATE tb_products 
                SET c_ProductName = :productName, 
                    i_SupplierID  = :supplierId, 
                    i_CategoryID  = :catId, 
                    c_Unit        = :unit, 
                    i_Price       = :price 
                WHERE i_ProductID = :productID";

        $result = $conn->prepare($sql);
        $result->bindParam(':productName', $productName, PDO::PARAM_STR);
        $result->bindParam(':supplierId',  $supplierId,  PDO::PARAM_INT);
        $result->bindParam(':catId',       $catId,       PDO::PARAM_INT);
        $result->bindParam(':unit',        $unit,        PDO::PARAM_STR);
        $result->bindParam(':price',       $price,       PDO::PARAM_STR);
        $result->bindParam(':productID',   $productID,   PDO::PARAM_INT);
        $result->execute();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว',
            'id'      => (int)$productID
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } else if ($action === 'insert') {
        // --- กรณีเพิ่มข้อมูลใหม่ (Insert) (Slide 7) ---
        // Server-side Validation
        $errors = [];
        if (empty($productName)) $errors[] = 'กรุณากรอกชื่อสินค้า';
        if (empty($supplierId) || (int)$supplierId <= 0) $errors[] = 'กรุณาเลือกผู้จัดจำหน่าย';
        if (empty($catId) || (int)$catId <= 0) $errors[] = 'กรุณาเลือกหมวดหมู่สินค้า';
        if (empty($unit)) $errors[] = 'กรุณากรอกหน่วยนับ';
        if (empty($price) || !is_numeric($price) || (float)$price <= 0) $errors[] = 'ราคาสินค้าต้องมากกว่า 0';

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => implode(', ', $errors),
                'errors'  => $errors
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "INSERT INTO tb_products (c_ProductName, i_SupplierID, i_CategoryID, c_Unit, i_Price)
                VALUES (:productName, :supplierId, :catId, :unit, :price)";

        // Prepare SQL (Slide 7)
        $result = $conn->prepare($sql);

        // Bind param to the prepared statement (Slide 7)
        $result->bindParam(':productName', $productName, PDO::PARAM_STR);
        $result->bindParam(':supplierId',  $supplierId,  PDO::PARAM_INT);
        $result->bindParam(':catId',       $catId,       PDO::PARAM_INT);
        $result->bindParam(':unit',        $unit,        PDO::PARAM_STR);
        $result->bindParam(':price',       $price,       PDO::PARAM_STR);

        // execute SQL (Slide 7)
        $result->execute();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'บันทึกข้อมูลสินค้าเรียบร้อยแล้ว',
            'id'      => $conn->lastInsertId()
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Action ไม่ถูกต้อง'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'ไม่สามารถบันทึกข้อมูลได้ : ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
?>
