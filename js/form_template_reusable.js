/**
 * form_template_reusable.js - โมดูล Reusable สำหรับ Form Validation & Notification
 * อ้างอิงตาม Slide 1, 9, 11
 */

const FormValidator = {
    /**
     * ล้างการแสดงผล Error ทั้งหมดในฟอร์ม
     */
    clearErrors: function(formElement) {
        if (!formElement) return;
        const invalidInputs = formElement.querySelectorAll('.is-invalid');
        invalidInputs.forEach(input => input.classList.remove('is-invalid'));

        const feedbacks = formElement.querySelectorAll('.invalid-feedback');
        feedbacks.forEach(fb => {
            fb.textContent = '';
            fb.style.display = 'none';
        });
    },

    /**
     * แสดงข้อผิดพลาดที่ฟิลด์ใดฟิลด์หนึ่ง
     */
    showFieldError: function(inputElement, errorMessage) {
        if (!inputElement) return;
        inputElement.classList.add('is-invalid');
        
        let feedback = inputElement.parentElement.querySelector('.invalid-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            inputElement.parentElement.appendChild(feedback);
        }
        feedback.textContent = errorMessage;
        feedback.style.display = 'block';
    },

    /**
     * ตรวจสอบความถูกต้องของข้อมูลสินค้า (Client-side Validation)
     */
    validateProductForm: function(formData) {
        const errors = {};

        // ชื่อสินค้า (ProductName)
        const name = (formData.ProductName || formData.c_ProductName || '').trim();
        if (!name) {
            errors.ProductName = 'กรุณากรอกชื่อสินค้า (ProductName)';
        } else if (name.length > 30) {
            errors.ProductName = 'ชื่อสินค้าต้องไม่เกิน 30 ตัวอักษร (ปัจจุบัน ' + name.length + ' ตัวอักษร)';
        }

        // ผู้จัดจำหน่าย (SupplierID)
        const supplierId = formData.SupplierID || formData.i_SupplierID;
        if (!supplierId || supplierId === '' || supplierId === '0' || isNaN(supplierId)) {
            errors.SupplierID = 'กรุณาเลือกผู้จัดจำหน่าย (SupplierID)';
        }

        // หมวดหมู่สินค้า (CatID)
        const catId = formData.CatID || formData.i_CategoryID;
        if (!catId || catId === '' || catId === '0' || isNaN(catId)) {
            errors.CatID = 'กรุณาเลือกหมวดหมู่สินค้า (CatID)';
        }

        // หน่วยนับ (Unit)
        const unit = (formData.Unit || formData.c_Unit || '').trim();
        if (!unit) {
            errors.Unit = 'กรุณากรอกขนาดบรรจุ/หน่วยนับ (Unit)';
        } else if (unit.length > 30) {
            errors.Unit = 'หน่วยนับต้องไม่เกิน 30 ตัวอักษร (ปัจจุบัน ' + unit.length + ' ตัวอักษร)';
        }

        // ราคาสินค้า (Price)
        const price = formData.Price !== undefined ? formData.Price : (formData.i_Price !== undefined ? formData.i_Price : formData.f_Price);
        if (price === '' || price === null || price === undefined) {
            errors.Price = 'กรุณากรอกราคาสินค้า (Price)';
        } else if (isNaN(price) || parseFloat(price) <= 0) {
            errors.Price = 'ราคาสินค้าต้องเป็นตัวเลขมากกว่า 0';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }
};

/**
 * Helper แจ้งเตือน Notification สวยงามด้วย SweetAlert2 และ Toast
 */
const Notify = {
    // แจ้งเตือนความสำเร็จ (Success Modal / Toast)
    success: function(title, message, timer = 2200) {
        if (typeof Swal !== 'undefined') {
            return Swal.fire({
                icon: 'success',
                title: title || 'สำเร็จ!',
                text: message || '',
                timer: timer,
                showConfirmButton: false,
                background: '#1e293b',
                color: '#f8fafc',
                iconColor: '#10b981',
                customClass: {
                    popup: 'swal-custom-dark'
                }
            });
        } else {
            alert((title ? title + '\n' : '') + (message || ''));
        }
    },

    // แจ้งเตือนข้อผิดพลาด (Error Modal)
    error: function(title, message) {
        if (typeof Swal !== 'undefined') {
            return Swal.fire({
                icon: 'error',
                title: title || 'เกิดข้อผิดพลาด!',
                text: message || 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
                background: '#1e293b',
                color: '#f8fafc',
                iconColor: '#ef4444',
                confirmButtonColor: '#6366f1',
                customClass: {
                    popup: 'swal-custom-dark'
                }
            });
        } else {
            alert('ข้อผิดพลาด: ' + (message || title));
        }
    },

    // แจ้งเตือนคำเตือน / Validation
    warning: function(title, message) {
        if (typeof Swal !== 'undefined') {
            return Swal.fire({
                icon: 'warning',
                title: title || 'คำเตือน!',
                text: message || '',
                background: '#1e293b',
                color: '#f8fafc',
                iconColor: '#f59e0b',
                confirmButtonColor: '#6366f1',
                customClass: {
                    popup: 'swal-custom-dark'
                }
            });
        } else {
            alert('คำเตือน: ' + message);
        }
    },

    // กล่องยืนยันการลบ (Confirm Delete Dialog)
    confirmDelete: function(itemName, callback) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'ยืนยันการลบข้อมูล?',
                html: `คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า <strong class="text-danger">${itemName}</strong> ?<br><small class="text-muted">การกระทำนี้ไม่สามารถย้อนกลับได้</small>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: '<i class="bi bi-trash3-fill me-1"></i> ยืนยันการลบ',
                cancelButtonText: 'ยกเลิก',
                background: '#1e293b',
                color: '#f8fafc',
                reverseButtons: true,
                customClass: {
                    popup: 'swal-custom-dark'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    callback();
                }
            });
        } else {
            if (confirm(`ยืนยันการลบสินค้า ${itemName} หรือไม่?`)) {
                callback();
            }
        }
    },

    // Toast เล็กมุมขวาบน
    toast: function(icon, message) {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: '#1e293b',
                color: '#f8fafc',
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });
            Toast.fire({
                icon: icon || 'success',
                title: message
            });
        }
    }
};

// Export to window for global access
window.FormValidator = FormValidator;
window.Notify = Notify;
