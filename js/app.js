/**
 * app.js - Main Application Controller for Northwind Product CRUD System
 */

// State Management
const AppState = {
    products: [],
    categories: [],
    suppliers: [],
    filteredProducts: [],
    stats: {
        totalProducts: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0
    },
    filters: {
        keyword: '',
        catId: 'all',
        supplierId: 'all',
        minPrice: '',
        maxPrice: '',
        sortBy: 'i_ProductID',
        sortOrder: 'DESC'
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10
    },
    editingProductId: null
};

// API Base Helpers
const API = {
    async fetch(endpoint, options = {}) {
        let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        let url;
        if (cleanEndpoint.includes('?')) {
            const [path, query] = cleanEndpoint.split('?');
            url = `api/index.php?route=${path}&${query}`;
        } else {
            url = `api/index.php?route=${cleanEndpoint}`;
        }
        try {
            const res = await fetch(url, options);
            return await res.json();
        } catch (e) {
            console.error(`API Fetch error for ${endpoint}:`, e);
            throw e;
        }
    }
};

// DOM Elements
let elements = {};

document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบว่าเปิดผ่าน file:// หรือไม่
    if (window.location.protocol === 'file:') {
        Swal.fire({
            icon: 'warning',
            title: 'คำแนะนำการเปิดใช้งาน',
            html: `คุณกำลังเปิดไฟล์ผ่าน <code>file:///</code> ซึ่งไม่สามารถรัน PHP และ API ได้<br><br>กรุณาเปิดผ่าน Web Server ในเบราว์เซอร์ที่:<br><a href="http://localhost/CPE66/Projack/" target="_blank" class="btn btn-primary mt-2">http://localhost/CPE66/Projack/</a>`,
            background: '#1e293b',
            color: '#f8fafc',
            allowOutsideClick: false
        });
        return;
    }

    initElements();
    initEventListeners();
    loadInitialData();
});

function initElements() {
    elements = {
        // Table & Search
        searchInput: document.getElementById('searchKeyword'),
        categoryFilter: document.getElementById('filterCategory'),
        supplierFilter: document.getElementById('filterSupplier'),
        minPriceInput: document.getElementById('filterMinPrice'),
        maxPriceInput: document.getElementById('filterMaxPrice'),
        sortSelect: document.getElementById('sortBy'),
        btnResetFilters: document.getElementById('btnResetFilters'),
        productsTableBody: document.getElementById('productsTableBody'),
        tableLoading: document.getElementById('tableLoading'),
        tableEmpty: document.getElementById('tableEmpty'),
        totalCountBadge: document.getElementById('totalCountBadge'),
        
        // Stats
        statTotalProducts: document.getElementById('statTotalProducts'),
        statAvgPrice: document.getElementById('statAvgPrice'),
        statMinPrice: document.getElementById('statMinPrice'),
        statMaxPrice: document.getElementById('statMaxPrice'),

        // Pagination
        paginationContainer: document.getElementById('paginationContainer'),
        pageInfo: document.getElementById('pageInfo'),

        // Modals & Forms
        productModal: document.getElementById('productModal'),
        productModalTitle: document.getElementById('productModalTitle'),
        productForm: document.getElementById('productForm'),
        productIdInput: document.getElementById('productId'),
        productNameInput: document.getElementById('productName'),
        productSupplierSelect: document.getElementById('productSupplier'),
        productCategorySelect: document.getElementById('productCategory'),
        productUnitInput: document.getElementById('productUnit'),
        productPriceInput: document.getElementById('productPrice'),
        btnSaveProduct: document.getElementById('btnSaveProduct'),

        // Details Modal
        detailsModal: document.getElementById('detailsModal')
    };
}

function initEventListeners() {
    // Search with Debounce
    let debounceTimer;
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                AppState.filters.keyword = e.target.value.trim();
                AppState.pagination.currentPage = 1;
                fetchProducts();
            }, 300);
        });
    }

    // Category Filter
    if (elements.categoryFilter) {
        elements.categoryFilter.addEventListener('change', (e) => {
            AppState.filters.catId = e.target.value;
            AppState.pagination.currentPage = 1;
            fetchProducts();
        });
    }

    // Supplier Filter
    if (elements.supplierFilter) {
        elements.supplierFilter.addEventListener('change', (e) => {
            AppState.filters.supplierId = e.target.value;
            AppState.pagination.currentPage = 1;
            fetchProducts();
        });
    }

    // Price Filters
    if (elements.minPriceInput) {
        elements.minPriceInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                AppState.filters.minPrice = e.target.value;
                AppState.pagination.currentPage = 1;
                fetchProducts();
            }, 350);
        });
    }
    if (elements.maxPriceInput) {
        elements.maxPriceInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                AppState.filters.maxPrice = e.target.value;
                AppState.pagination.currentPage = 1;
                fetchProducts();
            }, 350);
        });
    }

    // Sort Select
    if (elements.sortSelect) {
        elements.sortSelect.addEventListener('change', (e) => {
            const [sortBy, sortOrder] = e.target.value.split(':');
            AppState.filters.sortBy = sortBy;
            AppState.filters.sortOrder = sortOrder;
            fetchProducts();
        });
    }

    // Reset Filters
    if (elements.btnResetFilters) {
        elements.btnResetFilters.addEventListener('click', () => {
            if (elements.searchInput) elements.searchInput.value = '';
            if (elements.categoryFilter) elements.categoryFilter.value = 'all';
            if (elements.supplierFilter) elements.supplierFilter.value = 'all';
            if (elements.minPriceInput) elements.minPriceInput.value = '';
            if (elements.maxPriceInput) elements.maxPriceInput.value = '';
            if (elements.sortSelect) elements.sortSelect.value = 'i_ProductID:DESC';

            AppState.filters = {
                keyword: '',
                catId: 'all',
                supplierId: 'all',
                minPrice: '',
                maxPrice: '',
                sortBy: 'i_ProductID',
                sortOrder: 'DESC'
            };
            AppState.pagination.currentPage = 1;
            fetchProducts();
            Notify.toast('info', 'รีเซ็ตตัวกรองเรียบร้อยแล้ว');
        });
    }

    // Product Form Submit (Create / Update)
    if (elements.productForm) {
        elements.productForm.addEventListener('submit', handleProductFormSubmit);
    }
}

/**
 * โหลดข้อมูลเริ่มต้น (Categories, Suppliers, Products)
 */
function loadInitialData() {
    // 1. ดึงข้อมูลสินค้าทันที
    fetchProducts();

    // 2. โหลด Dropdown หมวดหมู่และผู้จัดจำหน่ายคู่ขนาน
    loadSelectOptions('api/categories', 'filterCategory', 'หมวดหมู่ทั้งหมด (All Categories)');
    loadSelectOptions('api/suppliers', 'filterSupplier', 'ผู้จัดจำหน่ายทั้งหมด (All Suppliers)');
    loadSelectOptions('api/categories', 'productCategory', '-- เลือกหมวดหมู่สินค้า --');
    loadSelectOptions('api/suppliers', 'productSupplier', '-- เลือกผู้จัดจำหน่าย --');
}

/**
 * ดึงรายการสินค้าจาก API
 */
async function fetchProducts() {
    if (elements.tableLoading) elements.tableLoading.style.display = 'block';
    if (elements.tableEmpty) elements.tableEmpty.style.display = 'none';
    if (elements.productsTableBody) elements.productsTableBody.innerHTML = '';

    try {
        // Query Params
        const params = new URLSearchParams();
        if (AppState.filters.keyword) params.append('keyword', AppState.filters.keyword);
        if (AppState.filters.catId && AppState.filters.catId !== 'all') params.append('catId', AppState.filters.catId);
        if (AppState.filters.supplierId && AppState.filters.supplierId !== 'all') params.append('supplierId', AppState.filters.supplierId);
        if (AppState.filters.minPrice) params.append('minPrice', AppState.filters.minPrice);
        if (AppState.filters.maxPrice) params.append('maxPrice', AppState.filters.maxPrice);
        params.append('sortBy', AppState.filters.sortBy);
        params.append('sortOrder', AppState.filters.sortOrder);

        const result = await API.fetch(`products?${params.toString()}`);

        if (result && result.success) {
            AppState.products = result.data.items || [];
            AppState.stats = result.data.stats || AppState.stats;

            updateStatsDisplay();
            renderProductsTable();
        } else {
            throw new Error(result.message || 'ไม่สามารถดึงข้อมูลได้');
        }

    } catch (error) {
        console.error('Failed to fetch products:', error);
        if (elements.productsTableBody) {
            const errorMsg = error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล';
            elements.productsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <div class="text-danger mb-2">
                            <i class="bi bi-exclamation-triangle-fill fs-1 d-block mb-2 text-warning"></i>
                            <h5 class="fw-bold text-white mb-2">ไม่สามารถโหลดข้อมูลสินค้าได้</h5>
                            <p class="text-muted small mb-3">${errorMsg}</p>
                        </div>
                        <div class="d-inline-flex gap-2">
                            <button onclick="fetchProducts()" class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-arrow-clockwise me-1"></i> ลองใหม่อีกครั้ง
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    } finally {
        if (elements.tableLoading) elements.tableLoading.style.display = 'none';
    }
}

/**
 * แสดงผลสถิติบนการ์ด Dashboard
 */
function updateStatsDisplay() {
    if (elements.statTotalProducts) elements.statTotalProducts.textContent = (AppState.stats.totalProducts || 0).toLocaleString();
    if (elements.statAvgPrice) elements.statAvgPrice.textContent = '฿' + (AppState.stats.avgPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elements.statMinPrice) elements.statMinPrice.textContent = '฿' + (AppState.stats.minPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elements.statMaxPrice) elements.statMaxPrice.textContent = '฿' + (AppState.stats.maxPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elements.totalCountBadge) elements.totalCountBadge.textContent = `${AppState.products.length} รายการ`;
}

/**
 * เรนเดอร์ข้อมูลลงในตาราง HTML
 */
function renderProductsTable() {
    const tbody = elements.productsTableBody;
    if (!tbody) return;

    if (AppState.products.length === 0) {
        if (elements.tableEmpty) elements.tableEmpty.style.display = 'block';
        if (elements.paginationContainer) elements.paginationContainer.innerHTML = '';
        if (elements.pageInfo) elements.pageInfo.textContent = 'แสดง 0 จาก 0 รายการ';
        return;
    }

    if (elements.tableEmpty) elements.tableEmpty.style.display = 'none';

    // Pagination slice
    const total = AppState.products.length;
    const itemsPerPage = AppState.pagination.itemsPerPage;
    const totalPages = Math.ceil(total / itemsPerPage);
    const currentPage = Math.min(AppState.pagination.currentPage, totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, total);
    const pageItems = AppState.products.slice(startIndex, endIndex);

    let html = '';
    pageItems.forEach((product, idx) => {
        const rowNumber = startIndex + idx + 1;
        const price = parseFloat(product.i_Price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const categoryName = product.c_CategoryName || '<span class="text-muted">ไม่ระบุ</span>';
        const supplierName = product.c_SupplierName || '<span class="text-muted">ไม่ระบุ</span>';

        html += `
            <tr class="product-row animate-fade-in" data-id="${product.i_ProductID}">
                <td class="text-center text-muted fw-semibold">${rowNumber}</td>
                <td class="text-center">
                    <span class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill px-2 py-1">
                        #${product.i_ProductID}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="product-icon me-2">
                            <i class="bi bi-box-seam-fill"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-light product-name-cell">${escapeHtml(product.c_ProductName)}</div>
                            <small class="text-muted d-md-none">${categoryName}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">
                        <i class="bi bi-tag-fill me-1"></i> ${categoryName}
                    </span>
                </td>
                <td class="text-truncate" style="max-width: 180px;" title="${escapeHtml(supplierName)}">
                    <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill">
                        <i class="bi bi-building me-1"></i> ${supplierName}
                    </span>
                </td>
                <td>
                    <span class="text-secondary small bg-dark-subtle px-2 py-1 rounded">
                        ${escapeHtml(product.c_Unit || '-')}
                    </span>
                </td>
                <td class="text-end">
                    <span class="fw-bold text-emerald fs-6">฿${price}</span>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-info" title="ดูรายละเอียด" onclick="viewProductDetails(${product.i_ProductID})">
                            <i class="bi bi-eye-fill"></i>
                        </button>
                        <button type="button" class="btn btn-outline-warning" title="แก้ไข" onclick="openEditProductModal(${product.i_ProductID})">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" title="ลบ" onclick="deleteProduct(${product.i_ProductID}, '${escapeHtml(product.c_ProductName).replace(/'/g, "\\'")}')">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // Render Pagination Controls
    renderPagination(total, totalPages, currentPage, startIndex, endIndex);
}

/**
 * เรนเดอร์แถบ Pagination
 */
function renderPagination(total, totalPages, currentPage, startIndex, endIndex) {
    if (elements.pageInfo) {
        elements.pageInfo.textContent = `แสดง ${startIndex + 1} - ${endIndex} จาก ${total} รายการ`;
    }

    const container = elements.paginationContainer;
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let paginationHtml = `<ul class="pagination pagination-sm mb-0">`;

    // ปุ่ม Previous
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage - 1})" aria-label="Previous">
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
    `;

    // เลขหน้า
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="changePage(${i})">${i}</button>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // ปุ่ม Next
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage + 1})" aria-label="Next">
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>
    `;

    paginationHtml += `</ul>`;
    container.innerHTML = paginationHtml;
}

function changePage(page) {
    AppState.pagination.currentPage = page;
    renderProductsTable();
    // เลื่อนหน้าจอขึ้นตารางเล็กน้อย
    document.getElementById('productsTableCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * เปิด Modal เพิ่มสินค้าใหม่
 */
function openAddProductModal() {
    AppState.editingProductId = null;
    FormValidator.clearErrors(elements.productForm);

    if (elements.productModalTitle) {
        elements.productModalTitle.innerHTML = `<i class="bi bi-plus-circle-fill text-success me-2"></i> เพิ่มข้อมูลสินค้าใหม่`;
    }
    if (elements.btnSaveProduct) {
        elements.btnSaveProduct.innerHTML = `<i class="bi bi-save-fill me-1"></i> บันทึกข้อมูลสินค้า`;
    }

    elements.productIdInput.value = '';
    elements.productNameInput.value = '';
    elements.productSupplierSelect.value = '';
    elements.productCategorySelect.value = '';
    elements.productUnitInput.value = '';
    elements.productPriceInput.value = '';

    const modal = new bootstrap.Modal(elements.productModal);
    modal.show();
}

/**
 * เปิด Modal แก้ไขสินค้า
 */
async function openEditProductModal(id) {
    AppState.editingProductId = id;
    FormValidator.clearErrors(elements.productForm);

    if (elements.productModalTitle) {
        elements.productModalTitle.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> แก้ไขข้อมูลสินค้า #${id}`;
    }
    if (elements.btnSaveProduct) {
        elements.btnSaveProduct.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> อัปเดตข้อมูล`;
    }

    try {
        const result = await API.fetch(`products/${id}`);
        if (result && result.success) {
            const p = result.data;
            elements.productIdInput.value = p.i_ProductID;
            elements.productNameInput.value = p.c_ProductName;
            elements.productSupplierSelect.value = p.i_SupplierID;
            elements.productCategorySelect.value = p.i_CategoryID;
            elements.productUnitInput.value = p.c_Unit;
            elements.productPriceInput.value = p.i_Price;

            const modal = new bootstrap.Modal(elements.productModal);
            modal.show();
        } else {
            Notify.error('เกิดข้อผิดพลาด', result.message || 'ไม่พบข้อมูลสินค้า');
        }
    } catch (e) {
        Notify.error('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลสินค้ามาแก้ไขได้');
    }
}

/**
 * จัดการ Submit ฟอร์มสินค้า (เพิ่ม / แก้ไข)
 */
async function handleProductFormSubmit(e) {
    e.preventDefault();
    FormValidator.clearErrors(elements.productForm);

    const isEdit = AppState.editingProductId !== null;
    const productId = elements.productIdInput.value;

    const formData = {
        ProductName: elements.productNameInput.value.trim(),
        SupplierID: elements.productSupplierSelect.value,
        CatID: elements.productCategorySelect.value,
        Unit: elements.productUnitInput.value.trim(),
        Price: elements.productPriceInput.value.trim(),
        ProductID: productId,
        action: isEdit ? 'update' : 'insert'
    };

    // Client-side Validation ด้วย FormValidator
    const validation = FormValidator.validateProductForm(formData);
    if (!validation.isValid) {
        // แสดง Inline Error ใต้ฟิลด์
        for (const [field, msg] of Object.entries(validation.errors)) {
            let elem = null;
            if (field === 'ProductName') elem = elements.productNameInput;
            else if (field === 'SupplierID') elem = elements.productSupplierSelect;
            else if (field === 'CatID') elem = elements.productCategorySelect;
            else if (field === 'Unit') elem = elements.productUnitInput;
            else if (field === 'Price') elem = elements.productPriceInput;

            if (elem) FormValidator.showFieldError(elem, msg);
        }

        Notify.warning('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลในช่องที่มีเครื่องหมายดอกจัน (*) ให้ถูกต้องครบถ้วน');
        return;
    }

    // ปิดปุ่มระหว่างบันทึก
    elements.btnSaveProduct.disabled = true;
    elements.btnSaveProduct.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> กำลังบันทึก...`;

    try {
        let endpoint = 'products';
        let method = 'POST';

        if (isEdit) {
            endpoint = `products/${productId}`;
            method = 'PUT';
        }

        let cleanRoute = endpoint.startsWith('/') ? endpoint :/${endpoint};
const response = await fetch(api/index.php?route=${cleanRoute}, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result && result.success) {
            // ปิด Modal
            const modalInstance = bootstrap.Modal.getInstance(elements.productModal);
            if (modalInstance) modalInstance.hide();

            // แจ้งเตือนความสำเร็จ
            Notify.success(
                isEdit ? 'แก้ไขข้อมูลสำเร็จ!' : 'เพิ่มสินค้าสำเร็จ!',
                result.message || (isEdit ? 'อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว' : 'บันทึกข้อมูลสินค้าใหม่เรียบร้อยแล้ว')
            );

            // โหลดข้อมูลตารางใหม่
            await fetchProducts();

        } else {
            // Server-side validation errors
            if (result.data && result.data.errors) {
                for (const [field, msg] of Object.entries(result.data.errors)) {
                    let elem = null;
                    if (field === 'ProductName') elem = elements.productNameInput;
                    else if (field === 'SupplierID') elem = elements.productSupplierSelect;
                    else if (field === 'CatID') elem = elements.productCategorySelect;
                    else if (field === 'Unit') elem = elements.productUnitInput;
                    else if (field === 'Price') elem = elements.productPriceInput;

                    if (elem) FormValidator.showFieldError(elem, msg);
                }
            }
            Notify.error('ไม่สามารถบันทึกได้', result.message || 'กรุณาตรวจสอบข้อมูลที่กรอก');
        }

    } catch (error) {
        console.error('Submit error:', error);
        Notify.error('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
        elements.btnSaveProduct.disabled = false;
        elements.btnSaveProduct.innerHTML = isEdit ? `<i class="bi bi-check-circle-fill me-1"></i> อัปเดตข้อมูล` : `<i class="bi bi-save-fill me-1"></i> บันทึกข้อมูลสินค้า`;
    }
}

/**
 * ลบข้อมูลสินค้า
 */
function deleteProduct(id, productName) {
    Notify.confirmDelete(productName, async () => {
        try {
            const response = await fetch(`api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });

           const response = await fetch(api/index.php?route=/products/${id}, {

            if (result && result.success) {
                Notify.success('ลบสินค้าสำเร็จ!', result.message || `ลบสินค้า ${productName} เรียบร้อยแล้ว`);
                await fetchProducts();
            } else {
                Notify.error('ลบไม่สำเร็จ', result.message || 'ไม่สามารถลบสินค้านี้ได้');
            }
        } catch (e) {
            console.error('Delete error:', e);
            Notify.error('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    });
}

/**
 * ดูรายละเอียดสินค้าใน Modal
 */
async function viewProductDetails(id) {
    try {
        const result = await API.fetch(`products/${id}`);
        if (result && result.success) {
            const p = result.data;
            const price = parseFloat(p.i_Price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            document.getElementById('detailProductName').textContent = p.c_ProductName || '-';
            document.getElementById('detailProductId').textContent = `#${p.i_ProductID}`;
            document.getElementById('detailCategoryName').textContent = p.c_CategoryName || '-';
            document.getElementById('detailCategoryDesc').textContent = p.c_CategoryDescription || '-';
            document.getElementById('detailSupplierName').textContent = p.c_SupplierName || '-';
            document.getElementById('detailSupplierContact').textContent = p.c_ContactName || '-';
            document.getElementById('detailSupplierPhone').textContent = p.c_SupplierPhone || '-';
            document.getElementById('detailSupplierCountry').textContent = p.c_SupplierCountry || '-';
            document.getElementById('detailSupplierAddress').textContent = `${p.c_SupplierAddress || ''} ${p.c_SupplierCity || ''}`.trim() || '-';
            document.getElementById('detailUnit').textContent = p.c_Unit || '-';
            document.getElementById('detailPrice').textContent = `฿${price}`;

            const modal = new bootstrap.Modal(elements.detailsModal);
            modal.show();
        } else {
            Notify.error('เกิดข้อผิดพลาด', result.message || 'ไม่พบข้อมูลสินค้า');
        }
    } catch (e) {
        Notify.error('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลรายละเอียดสินค้าได้');
    }
}

// Utility: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Export globally
window.openAddProductModal = openAddProductModal;
window.openEditProductModal = openEditProductModal;
window.deleteProduct = deleteProduct;
window.viewProductDetails = viewProductDetails;
window.changePage = changePage;
