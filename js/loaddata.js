/**
 * loaddata.js - โหลดข้อมูลจาก RESTful API มาแสดงผลใน HTML Elements
 */

async function loadSelectOptions(apiEndpoint, elementId, defaultText = '-- กรุณาเลือก --', selectedValue = null, valueKey = null, textKey = null) {
    const selectElem = document.getElementById(elementId);
    if (!selectElem) {
        console.warn(`Element with ID '${elementId}' not found.`);
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

        const result = await response.json();
        const items = result.data || result;

        renderOptions(selectElem, items, defaultText, selectedValue, valueKey, textKey);

    } catch (error) {
        console.error(`Error loading options for #${elementId} from ${apiEndpoint}:`, error);
        selectElem.innerHTML = `<option value="">-- ไม่สามารถโหลดข้อมูลได้ --</option>`;
        selectElem.disabled = false;
    }
}

function renderOptions(selectElem, items, defaultText, selectedValue, valueKey, textKey) {
    if (!Array.isArray(items)) {
        console.error('Invalid items data:', items);
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

window.loadSelectOptions = loadSelectOptions;
