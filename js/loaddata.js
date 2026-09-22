/**
 * loaddata.js - โหลดข้อมูลจาก RESTful API มาแสดงผลใน HTML Elements
 * อ้างอิงตาม Slide 11, 12
 */

/**
 * โหลดข้อมูลสำหรับ <select> Dropdown จาก API
 * @param {string} apiEndpoint - URL ของ API (เช่น 'api/categories', 'api/suppliers')
 * @param {string} elementId - ID ของ HTML <select> Element
 * @param {string} defaultText - ข้อความตัวเลือกแรก (เช่น '-- เลือก Category --')
 * @param {string|number|null} selectedValue - ค่าที่ต้องการให้เลือกเป็นค่าเริ่มต้น (optional)
 * @param {string} valueKey - ชื่อ Property ที่เป็น Value (ค่าเริ่มต้นตามตาราง: i_CategoryID หรือ i_SupplierID)
 * @param {string} textKey - ชื่อ Property ที่เป็น Label (ค่าเริ่มต้นตามตาราง: c_CategoryName หรือ c_SupplierName)
 */
async function loadSelectOptions(apiEndpoint, elementId, defaultText = '-- กรุณาเลือก --', selectedValue = null, valueKey = null, textKey = null) {
    const selectElem = document.getElementById(elementId);
    if (!selectElem) {
        console.warn(`Element with ID '${elementId}' not found.`);
        return;
    }

    // เซ็ตสถานะ Loading
    selectElem.innerHTML = `<option value="">กำลังโหลดข้อมูล...</option>`;
    selectElem.disabled = true;

    try {
        // จัดการ URL รองรับทั้ง Pretty URL และ Fallback Query String
        let url = apiEndpoint;
        // ถ้าเป็น Relative path ให้เติม base URL ถ้าจำเป็น
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // หากเรียก pretty url ไม่ผ่าน ลอง query route fallback
            const fallbackUrl = 'api/index.php?route=' + apiEndpoint.replace(/^api\//, '/');
            const fallbackRes = await fetch(fallbackUrl);
            if (!fallbackRes.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            const fallbackData = await fallbackRes.json();
            renderOptions(selectElem, fallbackData.data || fallbackData, defaultText, selectedValue, valueKey, textKey);
            return;
        }

        const result = await response.json();
        const items = result.data || result;

        renderOptions(selectElem, items, defaultText, selectedValue, valueKey, textKey);

    } catch (error) {
        console.error(`Error loading options for #${elementId} from ${apiEndpoint}:`, error);
        selectElem.innerHTML = `<option value="">-- ไม่สามารถโหลดข้อมูลได้ --</option>`;
        selectElem.disabled = false;
    }
}

/**
 * Helper เรนเดอร์ <option> ลงใน <select>
 */
function renderOptions(selectElem, items, defaultText, selectedValue, valueKey, textKey) {
    if (!Array.isArray(items)) {
        console.error('Invalid items data:', items);
        selectElem.innerHTML = `<option value="">${defaultText}</option>`;
        selectElem.disabled = false;
        return;
    }

    let html = `<option value="">${defaultText}</option>`;

    items.forEach(item => {
        // Auto-detect keys ถ้าไม่ได้ระบุ
        let val = '';
        let txt = '';

        if (valueKey && item[valueKey] !== undefined) {
            val = item[valueKey];
        } else if (item.i_CategoryID !== undefined) {
            val = item.i_CategoryID;
        } else if (item.i_SupplierID !== undefined) {
            val = item.i_SupplierID;
        } else if (item.id !== undefined) {
            val = item.id;
        }

        if (textKey && item[textKey] !== undefined) {
            txt = item[textKey];
        } else if (item.c_CategoryName !== undefined) {
            txt = item.c_CategoryName;
        } else if (item.c_SupplierName !== undefined) {
            txt = item.c_SupplierName;
        } else if (item.name !== undefined) {
            txt = item.name;
        }

        const isSelected = selectedValue !== null && String(selectedValue) === String(val) ? 'selected' : '';
        html += `<option value="${val}" ${isSelected}>${txt}</option>`;
    });

    selectElem.innerHTML = html;
    selectElem.disabled = false;
}

// Export to window
window.loadSelectOptions = loadSelectOptions;
