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
        
        // คำนวณ Base path อัตโนมัติ (เช่น /CPE66/Projack/ หรือ / บน Railway)
        let loc = window.location.pathname;
        let base = loc.substring(0, loc.lastIndexOf('/') + 1);

        let url;
        if (cleanEndpoint.includes('?')) {
            const [path, query] = cleanEndpoint.split('?');
            url = `${base}api/index.php?route=${path}&${query}`;
        } else {
            url = `${base}api/index.php?route=${cleanEndpoint}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const fetchOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {})
            }
        };

        try {
            const res = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            const text = await res.text();
            let json = null;
            try {
                json = JSON.parse(text);
            } catch (jsonErr) {
                console.error(`Invalid JSON received from ${url}:`, text);
                throw new Error('เซิร์ฟเวอร์ส่งข้อมูลกลับมาในรูปแบบที่ไม่ถูกต้อง (กรุณาตรวจสอบว่า Web Server และ Database เชื่อมต่อเรียบร้อยแล้ว)');
            }

            if (!res.ok) {
                const msg = (json && json.message) ? json.message : `เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด ${res.status}`;
                throw new Error(msg);
            }

            return json;

        } catch (e) {
            clearTimeout(timeoutId);
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
    const loadingElem = document.getElementById('tableLoading') || elements.tableLoading;
    const emptyElem = document.getElementById('tableEmpty') || elements.tableEmpty;
    const tbodyElem = document.getElementById('productsTableBody') || elements.productsTableBody;

    if (loadingElem) loadingElem.style.display = 'block';
    if (emptyElem) emptyElem.style.display = 'none';
    if (tbodyElem) tbodyElem.innerHTML = '';

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

        if (result && result.success && result.data) {
            AppState.products = result.data.items || [];
            AppState.stats = result.data.stats || AppState.stats;

            updateStatsDisplay();
            renderProductsTable();
        } else {
            throw new Error((result && result.message) ? result.message : 'ไม่สามารถดึงข้อมูลได้');
        }

    } catch (error) {
        console.error('Failed to fetch products:', error);
        const currentTbody = document.getElementById('productsTableBody') || elements.productsTableBody;
        if (currentTbody) {
            const errorMsg = error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล';
            currentTbody.innerHTML = `
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
        const finalLoadingElem = document.getElementById('tableLoading') || elements.tableLoading;
        if (finalLoadingElem) finalLoadingElem.style.display = 'none';
    }
}

/**
 * แสดงผลสถิติบนการ์ด Dashboard
 */
function updateStatsDisplay() {
    const totalElem = document.getElementById('statTotalProducts') || elements.statTotalProducts;
    const avgElem = document.getElementById('statAvgPrice') || elements.statAvgPrice;
    const minElem = document.getElementById('statMinPrice') || elements.statMinPrice;
    const maxElem = document.getElementById('statMaxPrice') || elements.statMaxPrice;
    const countBadge = document.getElementById('totalCountBadge') || elements.totalCountBadge;

    if (totalElem) totalElem.textContent = (AppState.stats.totalProducts || 0).toLocaleString();
    if (avgElem) avgElem.textContent = '฿' + (AppState.stats.avgPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (minElem) minElem.textContent = '฿' + (AppState.stats.minPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (maxElem) maxElem.textContent = '฿' + (AppState.stats.maxPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (countBadge) countBadge.textContent = `${AppState.products.length} รายการ`;
}

/**
 * เรนเดอร์ข้อมูลลงในตาราง HTML
 */
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody') || elements.productsTableBody;
    if (!tbody) return;

    const emptyElem = document.getElementById('tableEmpty') || elements.tableEmpty;
    const pageInfoElem = document.getElementById('pageInfo') || elements.pageInfo;
    const paginationElem = document.getElementById('paginationContainer') || elements.paginationContainer;

    if (AppState.products.length === 0) {
        if (emptyElem) emptyElem.style.display = 'block';
        if (paginationElem) paginationElem.innerHTML = '';
        if (pageInfoElem) pageInfoElem.textContent = 'แสดง 0 จาก 0 รายการ';
        return;
    }

    if (emptyElem) emptyElem.style.display = 'none';

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
    const pageInfoElem = document.getElementById('pageInfo') || elements.pageInfo;
    if (pageInfoElem) {
        pageInfoElem.textContent = `แสดง ${startIndex + 1} - ${endIndex} จาก ${total} รายการ`;
    }

    const container = document.getElementById('paginationContainer') || elements.paginationContainer;
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

    if (elements.productForm) elements.productForm.reset();
    if (elements.productIdInput) elements.productIdInput.value = '';

    const modal = new bootstrap.Modal(elements.productModal);
    modal.show();
}

/**
 * เปิด Modal แก้ไขสินค้าเดิม
 */
async function openEditProductModal(id) {
    AppState.editingProductId = id;
    FormValidator.clearErrors(elements.productForm);

    if (elements.productModalTitle) {
        elements.productModalTitle.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> แก้ไขข้อมูลสินค้า (ID: #${id})`;
    }
    if (elements.btnSaveProduct) {
        elements.btnSaveProduct.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> อัปเดตข้อมูล`;
    }

    // 1. ดึงข้อมูลจาก AppState ในเครื่องมาใส่ทันทีก่อน (เปิดปุ๊บติดปั๊บ 0ms)
    const localProduct = AppState.products.find(p => String(p.i_ProductID) === String(id));
    if (localProduct) {
        if (elements.productIdInput) elements.productIdInput.value = localProduct.i_ProductID;
        if (elements.productNameInput) elements.productNameInput.value = localProduct.c_ProductName || '';
        if (elements.productSupplierSelect) elements.productSupplierSelect.value = localProduct.i_SupplierID || '';
        if (elements.productCategorySelect) elements.productCategorySelect.value = localProduct.i_CategoryID || '';
        if (elements.productUnitInput) elements.productUnitInput.value = localProduct.c_Unit || '';
        if (elements.productPriceInput) elements.productPriceInput.value = localProduct.i_Price || '';
    }

    const modalElem = document.getElementById('productModal') || elements.productModal;
    const modal = bootstrap.Modal.getOrCreateInstance(modalElem);
    modal.show();

    // 2. ดึงข้อมูลอัปเดตเพิ่มเติมจาก API ในพื้นหลัง
    try {
        const result = await API.fetch(`products/${id}`);
        if (result && result.success && result.data) {
            const p = result.data;
            if (elements.productIdInput) elements.productIdInput.value = p.i_ProductID;
            if (elements.productNameInput) elements.productNameInput.value = p.c_ProductName || '';
            if (elements.productSupplierSelect) elements.productSupplierSelect.value = p.i_SupplierID || '';
            if (elements.productCategorySelect) elements.productCategorySelect.value = p.i_CategoryID || '';
            if (elements.productUnitInput) elements.productUnitInput.value = p.c_Unit || '';
            if (elements.productPriceInput) elements.productPriceInput.value = p.i_Price || '';
        }
    } catch (e) {
        // หาก API เดี่ยวมีปัญหาแต่มีข้อมูลในตารางอยู่แล้ว ไม่ต้องแสดง Error รบกวนผู้ใช้
        if (!localProduct) {
            Notify.error('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลสินค้ามาแก้ไขได้');
        }
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

    const validation = FormValidator.validateProductForm(formData);
    if (!validation.isValid) {
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

    elements.btnSaveProduct.disabled = true;
    elements.btnSaveProduct.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> กำลังบันทึก...`;

    try {
        let endpoint = isEdit ? `products/${productId}` : 'products';
        let method = isEdit ? 'PUT' : 'POST';

        const result = await API.fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (result && result.success) {
            const modalInstance = bootstrap.Modal.getInstance(elements.productModal);
            if (modalInstance) modalInstance.hide();

            Notify.success(
                isEdit ? 'แก้ไขข้อมูลสำเร็จ!' : 'เพิ่มสินค้าสำเร็จ!',
                result.message || (isEdit ? 'อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว' : 'บันทึกข้อมูลสินค้าใหม่เรียบร้อยแล้ว')
            );

            await fetchProducts();

        } else {
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
            const result = await API.fetch(`products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });

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
    // 1. ดึงข้อมูลจาก AppState ในเครื่องมาแสดงผลทันที (เปิดปุ๊บแสดงปั๊บ ไม่ต้องรอโหลด)
    const localProduct = AppState.products.find(p => String(p.i_ProductID) === String(id));
    if (localProduct) {
        const price = parseFloat(localProduct.i_Price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('detailProductName').textContent = localProduct.c_ProductName || '-';
        document.getElementById('detailProductId').textContent = `#${localProduct.i_ProductID}`;
        document.getElementById('detailCategoryName').textContent = localProduct.c_CategoryName || '-';
        document.getElementById('detailCategoryDesc').textContent = localProduct.c_CategoryDescription || '-';
        document.getElementById('detailSupplierName').textContent = localProduct.c_SupplierName || '-';
        document.getElementById('detailSupplierContact').textContent = localProduct.c_ContactName || '-';
        document.getElementById('detailSupplierPhone').textContent = localProduct.c_SupplierPhone || '-';
        document.getElementById('detailSupplierCountry').textContent = localProduct.c_SupplierCountry || '-';
        document.getElementById('detailSupplierAddress').textContent = `${localProduct.c_SupplierAddress || ''} ${localProduct.c_SupplierCity || ''}`.trim() || '-';
        document.getElementById('detailUnit').textContent = localProduct.c_Unit || '-';
        document.getElementById('detailPrice').textContent = `฿${price}`;
    }

    const modalElem = document.getElementById('detailsModal') || elements.detailsModal;
    const modal = bootstrap.Modal.getOrCreateInstance(modalElem);
    modal.show();

    // 2. ดึงข้อมูลเชิงลึกเพิ่มเติมจาก API ในพื้นหลัง
    try {
        const result = await API.fetch(`products/${id}`);
        if (result && result.success && result.data) {
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
        }
    } catch (e) {
        // หากมีข้อมูลแสดงอยู่แล้ว ไม่ต้องแสดง Popup error รบกวนผู้ใช้
        if (!localProduct) {
            Notify.error('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลรายละเอียดสินค้าได้');
        }
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
