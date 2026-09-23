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
 * @param {string} valueKey - ชื่อ Property ที่เป็น Value
 * @param {string} textKey - ชื่อ Property ที่เป็น Label
 */
async function loadSelectOptions(apiEndpoint, elementId, defaultText = '-- กรุณาเลือก --', selectedValue = null, valueKey = null, textKey = null) {
    const selectElem = document.getElementById(elementId);
    if (!selectElem) {
        return;
    }

    selectElem.innerHTML = `<option value="">กำลังโหลดข้อมูล...</option>`;
    selectElem.disabled = true;

    try {
        let cleanRoute = apiEndpoint.replace(/^api\/?/, '/');
        if (!cleanRoute.startsWith('/')) cleanRoute = '/' + cleanRoute;
        let url = `api/index.php?route=${cleanRoute}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const result = await response.json();
        const items = result.data || result;

        renderOptions(selectElem, items, defaultText, selectedValue, valueKey, textKey);

    } catch (error) {
        console.error(`Error loading options for #${elementId}:`, error);
        selectElem.innerHTML = `<option value="">${defaultText}</option>`;
        selectElem.disabled = false;
    }
}

/**
 * Helper เรนเดอร์ <option> ลงใน <select>
 */
function renderOptions(selectElem, items, defaultText, selectedValue, valueKey, textKey) {
    if (!selectElem) return;

    if (!Array.isArray(items)) {
        selectElem.innerHTML = `<option value="">${defaultText}</option>`;
        selectElem.disabled = false;
        return;
    }

    let html = `<option value="">${defaultText}</option>`;

    items.forEach(item => {
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
