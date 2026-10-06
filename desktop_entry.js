/**
 * desktop_entry.js
 * Cloned Mobile Entry Controller for Desktop Entry View (#view-data)
 * Provides Farm, Vựa, and Chi Phí forms matching mobile_entry.html with 2-column responsive layout
 */

(function () {
    // ═══════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════
    const FLOWER_TYPES = [
        'Ô Hồng', 'Lạc Thần', 'Vitto', 'Trắng', 'Hỷ', 'Lạc', 'Xô', 'Đỏ',
        'Bạch Tuyết', 'Phấn', 'Cam', 'Tím', 'Vàng HL', 'Thần', 'Thái'
    ];

    const EXPENSE_TYPES = [
        'Chi Phí Khác', 'Thuốc', 'Phân', 'Công', 'Mua Bông', 'Vận Chuyển', 'Vật Tư KD', 'Lãi', 'Expensed'
    ];

    const VUA_KNOWN = ['Đoan CR', 'Thanh Lam', 'Quân', 'Cô Lisu', 'Ngọc', 'Chiến'];

    // ═══════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════
    let farmFlowerCount = 0;
    let vuaFlowerCount = 0;
    let expenseRowCount = 0;
    let onConfirmProceedCallback = null;

    // ═══════════════════════════════════════════
    //  UTILS
    // ═══════════════════════════════════════════
    function getTodayISO() {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${yyyy}-${mm}-${dd}`;
    }

    function getTodayVN() {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    function isoToVN(isoStr) {
        if (!isoStr) return getTodayVN();
        const [y, m, d] = isoStr.split('-');
        return `${d}/${m}/${y}`;
    }

    function parseMoneyVal(v) {
        if (v === null || v === undefined) return 0;
        if (typeof v === 'number') return isNaN(v) ? 0 : v;
        const s = String(v).trim();
        if (!s) return 0;
        const isNeg = s.startsWith('-');
        const digits = s.replace(/[^\d]/g, '');
        if (!digits) return 0;
        const n = parseInt(digits, 10) || 0;
        return isNeg ? -n : n;
    }

    function fmtMoney(n) {
        if (!n && n !== 0) return '0 ₫';
        return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
    }

    function fmtNum(n) {
        return new Intl.NumberFormat('vi-VN').format(n || 0);
    }

    function formatMoneyInput(input) {
        if (!input) return;
        const isNeg = input.value.trim().startsWith('-');
        const v = parseMoneyVal(input.value);
        if (v === 0 && !isNeg) { input.value = ''; return; }
        const pos = input.selectionStart;
        const oldLen = input.value.length;
        input.value = (isNeg && v === 0 ? '-' : '') + new Intl.NumberFormat('vi-VN').format(v);
        const newLen = input.value.length;
        try { input.setSelectionRange(pos + (newLen - oldLen), pos + (newLen - oldLen)); } catch (e) {}
    }

    function showToast(msg, type = 'info', duration = 3500) {
        let container = document.getElementById('desktop-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'desktop-toast-container';
            container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none; font-family:"Nunito",sans-serif;';
            document.body.appendChild(container);
        }
        const el = document.createElement('div');
        el.style.cssText = 'pointer-events:auto; padding:14px 20px; border-radius:14px; color:#fff; font-size:14px; font-weight:700; box-shadow:0 10px 25px rgba(0,0,0,0.25); display:flex; align-items:center; gap:10px; animation:fadeInUp 0.3s ease; max-width:420px;';
        if (type === 'success') {
            el.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
        } else if (type === 'error' || type === 'danger') {
            el.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
        } else if (type === 'warning') {
            el.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
        } else {
            el.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
        }
        el.innerHTML = `<span>${msg}</span>`;
        container.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            el.style.transition = 'all 0.3s ease';
            setTimeout(() => el.remove(), 300);
        }, duration);
    }

    function checkAdminLock(dateInput) {
        const isUserAdmin = typeof window.isAdmin === 'function' ? window.isAdmin() : false;
        if (!isUserAdmin && dateInput && dateInput.value !== getTodayISO()) {
            if (typeof window.notifyAdminToEntry === 'function') {
                window.notifyAdminToEntry();
            } else {
                alert('Vui lòng thông báo huytran97');
            }
            dateInput.value = getTodayISO();
            return false;
        }
        return true;
    }

    // ═══════════════════════════════════════════
    //  CONFIRM MODAL
    // ═══════════════════════════════════════════
    function showDesktopConfirmModal({ title, htmlContent, confirmBtnText = '✅ Xác nhận', confirmBtnClass = '', onProceed }) {
        const modal = document.getElementById('desktop-entry-confirm-modal');
        if (!modal) return;
        document.getElementById('desktop-confirm-modal-title').innerHTML = title;
        document.getElementById('desktop-confirm-modal-body').innerHTML = htmlContent;
        const btn = document.getElementById('desktop-confirm-modal-proceed-btn');
        btn.innerHTML = confirmBtnText;
        if (confirmBtnClass.includes('blue')) {
            btn.style.background = '#2563eb';
        } else if (confirmBtnClass.includes('red')) {
            btn.style.background = '#dc2626';
        } else {
            btn.style.background = '#16a34a';
        }
        onConfirmProceedCallback = onProceed;
        btn.onclick = () => {
            const cb = onConfirmProceedCallback;
            closeDesktopConfirmModal();
            if (typeof cb === 'function') cb();
        };
        modal.style.display = 'flex';
    }

    function closeDesktopConfirmModal() {
        const modal = document.getElementById('desktop-entry-confirm-modal');
        if (modal) modal.style.display = 'none';
        onConfirmProceedCallback = null;
    }

    // ═══════════════════════════════════════════
    //  TAB SWITCHER
    // ═══════════════════════════════════════════
    function switchDesktopEntryTab(tabId, btn) {
        const container = document.querySelector('.mobile-entry-container');
        if (!container) return;
        container.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

        const target = document.getElementById('view-' + tabId);
        if (target) target.classList.add('active');
        if (btn) {
            btn.classList.add('active');
        } else {
            const match = container.querySelector(`.tab-btn.${tabId}`);
            if (match) match.classList.add('active');
        }

        if (tabId === 'farm') calcFarmTotals();
        if (tabId === 'vua') recalcVua();
        if (tabId === 'expense') recalcExpenseTotals();
    }

    // ═══════════════════════════════════════════
    //  FARM CONTROLLER
    // ═══════════════════════════════════════════
    function initDesktopFarmForm() {
        const container = document.getElementById('farm-flowers-container');
        if (!container) return;
        if (container.querySelectorAll('.flower-item').length === 0) {
            addFarmFlower();
        }
        const d = document.getElementById('farm-date');
        if (d && !d.value) d.value = getTodayISO();
        calcFarmTotals();
    }

    function addFarmFlower() {
        farmFlowerCount++;
        const container = document.getElementById('farm-flowers-container');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'flower-item';
        div.dataset.id = farmFlowerCount;
        const rowIdx = container.children.length + 1;
        div.innerHTML = `
            <div class="item-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="item-number">${rowIdx}</span>
                    <span class="item-title-tag" style="font-size:13px; font-weight:800; color:#16a34a; text-transform:uppercase; letter-spacing:0.3px;">Mặt hàng #${rowIdx}</span>
                </div>
                <button type="button" class="del-item-btn" onclick="removeFarmFlower(this)" title="Xóa">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            <div class="form-field">
                <label>Loại hoa</label>
                <input type="text" class="field-input farm-type" placeholder="Tên loại hoa..." list="flower-types-datalist"
                    oninput="calcFarmTotals()">
            </div>
            <div class="quick-pills" style="margin-top:-2px; margin-bottom:12px;">
                ${FLOWER_TYPES.slice(0, 8).map(f => `<button type="button" class="quick-pill" onclick="setFarmType(this,'${f}')">${f}</button>`).join('')}
            </div>
            <div class="field-row">
                <div class="form-field">
                    <label>Số lượng (bông)</label>
                    <input type="number" class="field-input farm-qty" placeholder="0" min="0" oninput="calcFarmTotals()" inputmode="numeric">
                </div>
                <div class="form-field">
                    <label>Đơn giá (₫)</label>
                    <input type="text" class="field-input farm-price money-input" placeholder="0" oninput="calcFarmTotals()">
                </div>
            </div>
            <div class="item-total-display farm-row-total">= 0 ₫</div>
        `;
        container.appendChild(div);
        div.querySelector('.farm-type').focus();
        calcFarmTotals();
    }

    function setFarmType(btn, val) {
        const item = btn.closest('.flower-item');
        if (!item) return;
        const typeInput = item.querySelector('.farm-type');
        if (typeInput) typeInput.value = val;
        item.querySelectorAll('.quick-pills .quick-pill').forEach(p => p.classList.remove('active-pill'));
        btn.classList.add('active-pill');
        const qtyInput = item.querySelector('.farm-qty');
        if (qtyInput && !qtyInput.value) qtyInput.focus();
        calcFarmTotals();
    }

    function removeFarmFlower(btn) {
        const container = document.getElementById('farm-flowers-container');
        if (!container) return;
        if (container.querySelectorAll('.flower-item').length <= 1) {
            showToast('Phải có ít nhất 1 loại hoa!', 'warning');
            return;
        }
        btn.closest('.flower-item').remove();
        container.querySelectorAll('.flower-item').forEach((it, idx) => {
            const num = it.querySelector('.item-number');
            if (num) num.textContent = idx + 1;
            const titleTag = it.querySelector('.item-title-tag');
            if (titleTag) titleTag.textContent = `Mặt hàng #${idx + 1}`;
        });
        calcFarmTotals();
    }

    function calcFarmTotals() {
        let totalQty = 0, totalRev = 0;
        document.querySelectorAll('#farm-flowers-container .flower-item').forEach(item => {
            const qty = parseFloat(item.querySelector('.farm-qty')?.value) || 0;
            const price = parseMoneyVal(item.querySelector('.farm-price')?.value);
            const rowTotal = qty * price;
            const totalEl = item.querySelector('.farm-row-total');
            if (totalEl) totalEl.textContent = `= ${fmtMoney(rowTotal)}`;
            totalQty += qty;
            totalRev += rowTotal;
        });
        const qtyEl = document.getElementById('farm-total-qty');
        if (qtyEl) qtyEl.textContent = fmtNum(totalQty) + ' bông';
        const revEl = document.getElementById('farm-total-revenue');
        if (revEl) revEl.textContent = fmtMoney(totalRev);
    }

    function submitFarmOrder() {
        const dateInput = document.getElementById('farm-date');
        if (!checkAdminLock(dateInput)) return;

        const farmDateVal = dateInput.value || getTodayISO();
        const dateVN = isoToVN(farmDateVal);
        const buyer = document.getElementById('farm-buyer').value.trim();
        const status = document.getElementById('farm-status').value;
        const note = document.getElementById('farm-note').value.trim();

        if (!buyer) {
            showToast('Vui lòng nhập tên khách hàng!', 'warning');
            document.getElementById('farm-buyer').focus();
            return;
        }

        const flowers = [];
        let hasError = false;
        document.querySelectorAll('#farm-flowers-container .flower-item').forEach(item => {
            const type = item.querySelector('.farm-type')?.value?.trim();
            const qty = parseFloat(item.querySelector('.farm-qty')?.value) || 0;
            const price = parseMoneyVal(item.querySelector('.farm-price')?.value);
            if (!type || qty <= 0 || price <= 0) { hasError = true; return; }
            flowers.push({ type, qty, price, total: qty * price });
        });

        if (hasError || flowers.length === 0) {
            showToast('Vui lòng điền đầy đủ loại hoa, số lượng (>0) và giá (>0)!', 'warning');
            return;
        }

        const totalQty = flowers.reduce((s, f) => s + f.qty, 0);
        const totalRev = flowers.reduce((s, f) => s + f.total, 0);
        const statusLabel = status === 'Xong' ? '✅ Đã thu tiền' : '⏳ Chưa thu tiền';

        const flowersHtml = flowers.map(f => `
            <div class="confirm-flower-item" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                <div>
                    <div style="font-weight:800; font-size:15px; color:#1e293b;">${f.type}</div>
                    <div style="font-size:13px; color:#64748b; font-weight:700;">${fmtNum(f.qty)} bông × ${fmtMoney(f.price)}</div>
                </div>
                <div style="font-weight:900; font-size:16px; color:#16a34a;">${fmtMoney(f.total)}</div>
            </div>
        `).join('');

        const htmlContent = `
            <div class="confirm-summary-box" style="background:#f8fafc; border-radius:14px; padding:14px; margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">👤 Khách hàng</span><span style="font-weight:800; color:#1e293b;">${buyer}</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">📅 Ngày đơn</span><span style="font-weight:800; color:#1e293b;">${dateVN}</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">📦 Tổng số lượng</span><span style="font-weight:800; color:#16a34a;">${fmtNum(totalQty)} bông</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">📌 Trạng thái</span><span style="font-weight:800; color:#1e293b;">${statusLabel}</span></div>
                ${note ? `<div style="display:flex; justify-content:space-between;"><span style="color:#64748b; font-weight:700;">📝 Ghi chú</span><span style="font-weight:700; color:#1e293b;">${note}</span></div>` : ''}
            </div>
            <div style="font-size:13px; font-weight:800; color:#64748b; margin-bottom:6px; text-transform:uppercase;">Chi tiết hoa (${flowers.length} loại):</div>
            <div style="max-height: 180px; overflow-y: auto; margin-bottom: 12px;">${flowersHtml}</div>
            <div style="background:linear-gradient(135deg, #f0fdf4, #dcfce7); border:2px solid #86efac; border-radius:14px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:12px; font-weight:800; color:#15803d; text-transform:uppercase;">TỔNG TIỀN ĐƠN FARM</div>
                    <div style="font-size:12px; color:#64748b; font-weight:700;">${fmtNum(totalQty)} bông</div>
                </div>
                <div style="font-size:22px; font-weight:900; color:#16a34a;">${fmtMoney(totalRev)}</div>
            </div>
        `;

        showDesktopConfirmModal({
            title: '🌱 Xác Nhận Lưu Đơn Farm',
            htmlContent: htmlContent,
            confirmBtnText: '✅ Xác Nhận Lưu Đơn',
            confirmBtnClass: 'confirm green',
            onProceed: () => {
                executeSubmitFarmOrder({ farmDateVal, dateVN, buyer, status, note, flowers, totalQty, totalRev });
            }
        });
    }

    function executeSubmitFarmOrder({ farmDateVal, dateVN, buyer, status, note, flowers, totalQty, totalRev }) {
        const btn = document.getElementById('farm-submit-btn');
        const timestampId = 'OFFLINE_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
        const dateParts = farmDateVal.split('-');
        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

        flowers.forEach((f, idx) => {
            const rowClientId = `${timestampId}_${idx}`;
            const rowData = {
                'Ngày': dateVN,
                'Người Mua': buyer,
                'Phân Loại Bông': f.type,
                'Số lượng': f.qty,
                'Giá': f.price,
                'Doanh Thu Bông': f.total,
                'Status': status || '',
                'Ghi Chú': note || '',
                'Loại DT': 'Farm'
            };

            queue.push({
                action: 'add',
                payload: { action: 'add', data: rowData },
                clientId: rowClientId
            });

            if (window.farmData && Array.isArray(window.farmData)) {
                window.farmData.unshift({
                    _sheetRowNumber: rowClientId,
                    'Ngày': dateVN,
                    'Người Mua': buyer,
                    'Phân Loại Bông': f.type,
                    'Số lượng': f.qty,
                    'Giá': f.price,
                    'Doanh Thu Bông': f.total,
                    'Status': status || '',
                    'Ghi Chú': note || '',
                    'Đã Thu': status === 'Xong' ? f.total : 0,
                    'Tiền Phải Thu': 0,
                    'Ghi Chú thu': '',
                    'Doanh Thu Khác': 0,
                    'Loại DT': 'Farm',
                    'Chi Phí': 0,
                    'Loại CP': '',
                    'Ghi Chú Chi Phí': '',
                    parsedDate: dateObj
                });
            }
        });

        localStorage.setItem('harvest_sync_queue', JSON.stringify(queue));

        // UI Updates
        if (typeof window.applyFiltersAndRender === 'function') window.applyFiltersAndRender();
        if (typeof window.updateCashInHand === 'function') window.updateCashInHand();
        if (typeof window.updateBuyerSuggestions === 'function' && window.farmData) window.updateBuyerSuggestions(window.farmData);
        if (typeof window.processSyncQueue === 'function') window.processSyncQueue();

        // Reset form
        document.getElementById('farm-buyer').value = '';
        document.getElementById('farm-note').value = '';
        document.getElementById('farm-status').value = '';
        const container = document.getElementById('farm-flowers-container');
        if (container) container.innerHTML = '';
        farmFlowerCount = 0;
        addFarmFlower();

        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã lưu đơn!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Lưu Đơn Farm';
            }, 800);
        }

        showToast(`⚡ Đã lưu đơn Farm "${buyer}" (${fmtMoney(totalRev)})! Đã cập nhật danh sách.`, 'success');
    }

    // ═══════════════════════════════════════════
    //  VỰA CONTROLLER
    // ═══════════════════════════════════════════
    function initDesktopVuaForm() {
        const vattuEl = document.getElementById('vua-vattu');
        if (vattuEl) vattuEl.value = '150.000';

        const quickContainer = document.getElementById('vua-quick-buyers');
        if (quickContainer && quickContainer.children.length === 0) {
            VUA_KNOWN.forEach(name => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'quick-pill blue';
                btn.textContent = name;
                btn.onclick = () => {
                    document.getElementById('vua-buyer').value = name;
                    quickContainer.querySelectorAll('.quick-pill').forEach(p => p.classList.remove('active-pill'));
                    btn.classList.add('active-pill');
                };
                quickContainer.appendChild(btn);
            });
        }

        const container = document.getElementById('vua-flowers-container');
        if (container && container.querySelectorAll('.flower-item').length === 0) {
            addVuaFlower();
        }

        const d = document.getElementById('vua-date');
        if (d && !d.value) d.value = getTodayISO();

        recalcVua();
    }

    function addVuaFlower() {
        vuaFlowerCount++;
        const container = document.getElementById('vua-flowers-container');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'flower-item';
        div.dataset.id = vuaFlowerCount;
        const rowIdx = container.children.length + 1;
        div.innerHTML = `
            <div class="item-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="item-number blue">${rowIdx}</span>
                    <span class="item-title-tag" style="font-size:13px; font-weight:800; color:#2563eb; text-transform:uppercase; letter-spacing:0.3px;">Mặt hàng #${rowIdx}</span>
                </div>
                <button type="button" class="del-item-btn" onclick="removeVuaFlower(this)" title="Xóa">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            <div class="form-field">
                <label>Loại hoa</label>
                <input type="text" class="field-input blue vua-type" placeholder="Tên loại hoa..." list="flower-types-datalist" oninput="recalcVua()">
            </div>
            <div class="quick-pills" style="margin-top:-2px; margin-bottom:12px;">
                ${FLOWER_TYPES.slice(0, 8).map(f => `<button type="button" class="quick-pill blue" onclick="setVuaType(this,'${f}')">${f}</button>`).join('')}
            </div>
            <div class="field-row">
                <div class="form-field">
                    <label>Số lượng (bông)</label>
                    <input type="number" class="field-input blue vua-qty" placeholder="0" min="0" oninput="recalcVua()" inputmode="numeric">
                </div>
                <div class="form-field">
                    <label>Giá vốn (₫)</label>
                    <input type="text" class="field-input blue vua-price money-input" placeholder="0" oninput="recalcVua()">
                </div>
            </div>
            <div class="item-total-display blue vua-row-total">= 0 ₫</div>
        `;
        container.appendChild(div);
        div.querySelector('.vua-type').focus();
        recalcVua();
    }

    function setVuaType(btn, val) {
        const item = btn.closest('.flower-item');
        if (!item) return;
        const typeInput = item.querySelector('.vua-type');
        if (typeInput) typeInput.value = val;
        item.querySelectorAll('.quick-pills .quick-pill').forEach(p => p.classList.remove('active-pill'));
        btn.classList.add('active-pill');
        const qtyInput = item.querySelector('.vua-qty');
        if (qtyInput && !qtyInput.value) qtyInput.focus();
        recalcVua();
    }

    function removeVuaFlower(btn) {
        const container = document.getElementById('vua-flowers-container');
        if (!container) return;
        if (container.querySelectorAll('.flower-item').length <= 1) {
            showToast('Phải có ít nhất 1 loại hoa!', 'warning');
            return;
        }
        btn.closest('.flower-item').remove();
        container.querySelectorAll('.flower-item').forEach((it, idx) => {
            const num = it.querySelector('.item-number');
            if (num) num.textContent = idx + 1;
            const titleTag = it.querySelector('.item-title-tag');
            if (titleTag) titleTag.textContent = `Mặt hàng #${idx + 1}`;
        });
        recalcVua();
    }

    function recalcVua() {
        let totalCost = 0;
        let totalQty = 0;
        document.querySelectorAll('#vua-flowers-container .flower-item').forEach(item => {
            const qty = parseFloat(item.querySelector('.vua-qty')?.value) || 0;
            const price = parseMoneyVal(item.querySelector('.vua-price')?.value);
            const rowTotal = qty * price;
            const rowTotalEl = item.querySelector('.vua-row-total');
            if (rowTotalEl) rowTotalEl.textContent = `= ${fmtMoney(rowTotal)}`;
            totalCost += rowTotal;
            totalQty += qty;
        });

        const shipping = parseMoneyVal(document.getElementById('vua-shipping')?.value);
        const vattu = parseMoneyVal(document.getElementById('vua-vattu')?.value) || 150000;
        const profit = parseMoneyVal(document.getElementById('vua-profit')?.value);
        const totalCollect = totalCost + shipping + vattu + profit;

        // Cập nhật bảng phân rã chi phí (Cost breakdown - Hình 2 mobile entry)
        const bdCost = document.getElementById('bd-cost');
        if (bdCost) bdCost.textContent = fmtMoney(totalCost);

        const bdShipping = document.getElementById('bd-shipping');
        if (bdShipping) bdShipping.textContent = fmtMoney(shipping);

        const bdVattu = document.getElementById('bd-vattu');
        if (bdVattu) bdVattu.textContent = fmtMoney(vattu);

        const bdProfit = document.getElementById('bd-profit');
        if (bdProfit) {
            bdProfit.textContent = fmtMoney(profit);
            bdProfit.style.color = profit >= 0 ? '#16a34a' : '#dc2626';
        }

        const bdTotal = document.getElementById('bd-total');
        if (bdTotal) bdTotal.textContent = fmtMoney(totalCollect);

        const qtyEl = document.getElementById('vua-total-qty');
        if (qtyEl) qtyEl.textContent = fmtNum(totalQty) + ' bông';
        const costEl = document.getElementById('vua-flower-cost');
        if (costEl) costEl.textContent = fmtMoney(totalCost);
    }

    function submitVuaOrder() {
        const dateInput = document.getElementById('vua-date');
        if (!checkAdminLock(dateInput)) return;

        const vuaDateVal = dateInput.value || getTodayISO();
        const dateVN = isoToVN(vuaDateVal);
        const buyer = document.getElementById('vua-buyer').value.trim();
        const status = document.getElementById('vua-status').value;
        const note = document.getElementById('vua-note').value.trim();

        if (!buyer) {
            showToast('Vui lòng nhập tên vựa!', 'warning');
            document.getElementById('vua-buyer').focus();
            return;
        }

        const flowers = [];
        let hasError = false;
        document.querySelectorAll('#vua-flowers-container .flower-item').forEach(item => {
            const type = item.querySelector('.vua-type')?.value?.trim();
            const qty = parseFloat(item.querySelector('.vua-qty')?.value) || 0;
            const price = parseMoneyVal(item.querySelector('.vua-price')?.value);
            if (!type || qty <= 0 || price <= 0) { hasError = true; return; }
            flowers.push({ type, qty, price, total: qty * price });
        });

        if (hasError || flowers.length === 0) {
            showToast('Vui lòng điền đầy đủ loại hoa, số lượng (>0) và giá vốn (>0)!', 'warning');
            return;
        }

        const totalCost = flowers.reduce((s, f) => s + f.total, 0);
        const shipping = parseMoneyVal(document.getElementById('vua-shipping').value);
        const vattu = parseMoneyVal(document.getElementById('vua-vattu')?.value) || 150000;
        const profit = parseMoneyVal(document.getElementById('vua-profit').value);
        const totalCollect = totalCost + shipping + vattu + profit;
        const totalQty = flowers.reduce((s, f) => s + f.qty, 0);
        const loaiCP = shipping > 0 ? 'Vận Chuyển' : '';
        const statusLabel = status === 'Xong' ? '✅ Đã thu tiền' : '⏳ Chưa thu tiền';

        const flowersHtml = flowers.map(f => `
            <div class="confirm-flower-item" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                <div>
                    <div style="font-weight:800; font-size:15px; color:#1e293b;">${f.type}</div>
                    <div style="font-size:13px; color:#64748b; font-weight:700;">${fmtNum(f.qty)} bông × ${fmtMoney(f.price)}</div>
                </div>
                <div style="font-weight:900; font-size:16px; color:#2563eb;">${fmtMoney(f.total)}</div>
            </div>
        `).join('');

        const htmlContent = `
            <div class="confirm-summary-box" style="background:#eff6ff; border-radius:14px; padding:14px; margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">👤 Tên Vựa</span><span style="font-weight:800; color:#1e293b;">${buyer}</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">📅 Ngày đơn</span><span style="font-weight:800; color:#1e293b;">${dateVN}</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">📦 Tổng số lượng</span><span style="font-weight:800; color:#2563eb;">${fmtNum(totalQty)} bông</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">💐 Tiền hoa vốn</span><span style="font-weight:800; color:#1e293b;">${fmtMoney(totalCost)}</span></div>
                ${shipping > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">🚚 Vận chuyển</span><span style="font-weight:800; color:#dc2626;">${fmtMoney(shipping)}</span></div>` : ''}
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">📦 Vật tư khác</span><span style="font-weight:800; color:#64748b;">${fmtMoney(vattu)}</span></div>
                ${profit !== 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">✨ Lợi nhuận</span><span style="font-weight:800; color:${profit >= 0 ? '#16a34a' : '#dc2626'};">${fmtMoney(profit)}</span></div>` : ''}
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">📌 Trạng thái</span><span style="font-weight:800; color:#1e293b;">${statusLabel}</span></div>
                ${note ? `<div style="display:flex; justify-content:space-between;"><span style="color:#64748b; font-weight:700;">📝 Ghi chú</span><span style="font-weight:700; color:#1e293b;">${note}</span></div>` : ''}
            </div>
            <div style="font-size:13px; font-weight:800; color:#64748b; margin-bottom:6px; text-transform:uppercase;">Chi tiết hoa (${flowers.length} loại):</div>
            <div style="max-height: 180px; overflow-y: auto; margin-bottom: 12px;">${flowersHtml}</div>
            <div style="background:linear-gradient(135deg, #eff6ff, #dbeafe); border:2px solid #93c5fd; border-radius:14px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:12px; font-weight:800; color:#1d4ed8; text-transform:uppercase;">TỔNG TIỀN PHẢI THU VỰA</div>
                    <div style="font-size:12px; color:#64748b; font-weight:700;">${fmtNum(totalQty)} bông</div>
                </div>
                <div style="font-size:22px; font-weight:900; color:#2563eb;">${fmtMoney(totalCollect)}</div>
            </div>
        `;

        showDesktopConfirmModal({
            title: '🚛 Xác Nhận Lưu Đơn Vựa',
            htmlContent: htmlContent,
            confirmBtnText: '✅ Xác Nhận Lưu Đơn Vựa',
            confirmBtnClass: 'confirm blue',
            onProceed: () => {
                executeSubmitVuaOrder({
                    vuaDateVal, dateVN, buyer, status, note, flowers,
                    totalCost, shipping, vattu, profit, totalCollect, totalQty, loaiCP
                });
            }
        });
    }

    function executeSubmitVuaOrder({
        vuaDateVal, dateVN, buyer, status, note, flowers,
        totalCost, shipping, vattu, profit, totalCollect, totalQty, loaiCP
    }) {
        const btn = document.getElementById('vua-submit-btn');
        const orderId = 'vua_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const timestampId = 'OFFLINE_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
        const dateParts = vuaDateVal.split('-');
        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

        for (let i = 0; i < flowers.length; i++) {
            const f = flowers[i];
            const isFirst = (i === 0);
            const rowClientId = `${timestampId}_${i}`;

            const rowData = {
                'Ngày': dateVN,
                'Status': status || '',
                'Người Mua': buyer,
                'Số lượng': f.qty,
                'Giá': f.price,
                'Doanh Thu Bông': f.total,
                'Phân Loại Bông': f.type,
                'Ghi Chú': isFirst ? (note || '') : '',
                'Đã Thu': (status === 'Xong' && isFirst) ? totalCollect : '',
                'Tiền Phải Thu': isFirst ? totalCollect : '',
                'Ghi Chú thu': orderId,
                'Doanh Thu Khác': (isFirst && profit !== 0) ? profit : '',
                'Loại DT': 'Vựa',
                'Chi Phí': (isFirst && shipping > 0) ? shipping : '',
                'Loại CP': (isFirst && shipping > 0) ? 'Vận Chuyển' : '',
                'Ghi Chú Chi Phí': ''
            };

            queue.push({
                action: 'add',
                payload: { action: 'add', data: rowData },
                clientId: rowClientId
            });

            if (window.farmData && Array.isArray(window.farmData)) {
                window.farmData.unshift({
                    _sheetRowNumber: rowClientId,
                    'Ngày': dateVN,
                    'Status': status || '',
                    'Người Mua': buyer,
                    'Số lượng': f.qty,
                    'Giá': f.price,
                    'Doanh Thu Bông': f.total,
                    'Phân Loại Bông': f.type,
                    'Ghi Chú': isFirst ? (note || '') : '',
                    'Đã Thu': (status === 'Xong' && isFirst) ? totalCollect : 0,
                    'Tiền Phải Thu': isFirst ? totalCollect : 0,
                    'Ghi Chú thu': orderId,
                    'Doanh Thu Khác': (isFirst && profit !== 0) ? profit : 0,
                    'Loại DT': 'Vựa',
                    'Chi Phí': (isFirst && shipping > 0) ? shipping : 0,
                    'Loại CP': (isFirst && shipping > 0) ? 'Vận Chuyển' : '',
                    'Ghi Chú Chi Phí': '',
                    parsedDate: dateObj
                });
            }
        }

        localStorage.setItem('harvest_sync_queue', JSON.stringify(queue));

        // UI Updates
        if (typeof window.applyFiltersAndRender === 'function') window.applyFiltersAndRender();
        if (typeof window.updateCashInHand === 'function') window.updateCashInHand();
        if (typeof window.updateBuyerSuggestions === 'function' && window.farmData) window.updateBuyerSuggestions(window.farmData);
        if (typeof window.processSyncQueue === 'function') window.processSyncQueue();

        // Reset form
        document.getElementById('vua-buyer').value = '';
        document.getElementById('vua-note').value = '';
        document.getElementById('vua-status').value = '';
        document.getElementById('vua-shipping').value = '0';
        document.getElementById('vua-vattu').value = '150.000';
        document.getElementById('vua-profit').value = '0';
        const container = document.getElementById('vua-flowers-container');
        if (container) container.innerHTML = '';
        vuaFlowerCount = 0;
        addVuaFlower();
        document.querySelectorAll('#vua-quick-buyers .quick-pill').forEach(p => p.classList.remove('active-pill'));
        recalcVua();

        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã lưu đơn!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Lưu Đơn Vựa';
            }, 800);
        }

        showToast(`⚡ Đã lưu đơn Vựa "${buyer}" (Thu: ${fmtMoney(totalCollect)})! Đã cập nhật danh sách.`, 'success');
    }

    // ═══════════════════════════════════════════
    //  EXPENSE CONTROLLER
    // ═══════════════════════════════════════════
    function initDesktopExpenseForm() {
        const d = document.getElementById('expense-date');
        if (d && !d.value) d.value = getTodayISO();

        const container = document.getElementById('expense-items-container');
        if (container && container.querySelectorAll('.expense-item-card').length === 0) {
            addExpenseRow();
        }
        recalcExpenseTotals();
    }

    function addExpenseRow() {
        expenseRowCount++;
        const container = document.getElementById('expense-items-container');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'flower-item expense-item-card';
        div.dataset.id = expenseRowCount;
        const rowIdx = container.children.length + 1;
        div.innerHTML = `
            <div class="item-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="item-number red">${rowIdx}</span>
                    <span class="item-title-tag" style="font-weight:800; font-size:13px; color:var(--me-red); text-transform:uppercase; letter-spacing:0.3px;">Khoản chi #${rowIdx}</span>
                </div>
                <button type="button" class="del-item-btn" onclick="removeExpenseRow(this)" title="Xóa">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            <div class="form-field">
                <label>Hạng mục <span>*</span></label>
                <select class="field-select red exp-type" onchange="onExpTypeChange(this)">
                    ${EXPENSE_TYPES.map(t => `<option value="${t}" ${t === 'Chi Phí Khác' ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
            </div>
            <div class="quick-pills exp-quick-types" style="margin-top:-2px; margin-bottom:12px;">
                ${EXPENSE_TYPES.map((t, i) => `<button type="button" class="quick-pill red ${i === 0 ? 'active-pill' : ''}" onclick="setExpType(this, '${t}')">${t}</button>`).join('')}
            </div>
            <div class="form-field">
                <label>Số tiền (₫) <span>*</span></label>
                <input type="text" class="field-input red exp-amount money-input" placeholder="0" oninput="recalcExpenseTotals()" inputmode="numeric">
            </div>
            <div class="form-field" style="margin-bottom:0">
                <label>Ghi chú chi phí</label>
                <input type="text" class="field-input red exp-note" placeholder="Chi tiết / ghi chú chi phí...">
            </div>
            <div class="item-total-display red exp-row-total" style="background:var(--me-red-bg); border-color:#fecaca; color:var(--me-red);">= 0 ₫</div>
        `;
        container.appendChild(div);
        div.querySelector('.exp-amount').focus();
        recalcExpenseTotals();
    }

    function setExpType(btn, val) {
        const item = btn.closest('.expense-item-card');
        if (!item) return;
        const select = item.querySelector('.exp-type');
        if (select) select.value = val;
        item.querySelectorAll('.exp-quick-types .quick-pill').forEach(p => p.classList.remove('active-pill'));
        btn.classList.add('active-pill');
        const amountInput = item.querySelector('.exp-amount');
        if (amountInput && !amountInput.value) amountInput.focus();
        recalcExpenseTotals();
    }

    function onExpTypeChange(select) {
        const item = select.closest('.expense-item-card');
        if (!item) return;
        const val = select.value;
        item.querySelectorAll('.exp-quick-types .quick-pill').forEach(p => {
            if (p.textContent.trim() === val) p.classList.add('active-pill');
            else p.classList.remove('active-pill');
        });
        recalcExpenseTotals();
    }

    function removeExpenseRow(btn) {
        const container = document.getElementById('expense-items-container');
        if (!container) return;
        if (container.querySelectorAll('.expense-item-card').length <= 1) {
            showToast('Phải có ít nhất 1 dòng chi phí!', 'warning');
            return;
        }
        btn.closest('.expense-item-card').remove();
        container.querySelectorAll('.expense-item-card').forEach((it, idx) => {
            const num = it.querySelector('.item-number');
            if (num) num.textContent = idx + 1;
            const titleTag = it.querySelector('.item-title-tag');
            if (titleTag) titleTag.textContent = `Khoản chi #${idx + 1}`;
        });
        recalcExpenseTotals();
    }

    function recalcExpenseTotals() {
        let totalCount = 0;
        let totalAmount = 0;
        document.querySelectorAll('#expense-items-container .expense-item-card').forEach(item => {
            const amount = parseMoneyVal(item.querySelector('.exp-amount')?.value);
            const totalEl = item.querySelector('.exp-row-total');
            if (totalEl) totalEl.textContent = `= ${fmtMoney(amount)}`;
            if (amount > 0) {
                totalCount++;
                totalAmount += amount;
            }
        });
        const countEl = document.getElementById('expense-total-count');
        if (countEl) countEl.textContent = `${totalCount} khoản`;
        const amountEl = document.getElementById('expense-total-amount');
        if (amountEl) amountEl.textContent = fmtMoney(totalAmount);
    }

    function submitExpenseOrder() {
        const dateInput = document.getElementById('expense-date');
        if (!checkAdminLock(dateInput)) return;

        const expDateVal = dateInput.value || getTodayISO();
        const dateVN = isoToVN(expDateVal);

        const expItems = [];
        let hasError = false;
        document.querySelectorAll('#expense-items-container .expense-item-card').forEach(item => {
            const type = item.querySelector('.exp-type')?.value?.trim() || 'Chi Phí Khác';
            const amount = parseMoneyVal(item.querySelector('.exp-amount')?.value);
            const note = item.querySelector('.exp-note')?.value?.trim() || '';
            if (amount <= 0) {
                hasError = true;
                return;
            }
            expItems.push({ type, amount, note });
        });

        if (hasError && expItems.length === 0) {
            showToast('Vui lòng nhập số tiền chi phí lớn hơn 0!', 'warning');
            return;
        }
        if (expItems.length === 0) {
            showToast('Vui lòng nhập ít nhất 1 khoản chi phí hợp lệ!', 'warning');
            return;
        }

        const totalExp = expItems.reduce((s, it) => s + it.amount, 0);

        const itemsHtml = expItems.map(it => `
            <div class="confirm-flower-item" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                <div>
                    <div style="font-weight:800; font-size:15px; color:#1e293b;">${it.type}</div>
                    ${it.note ? `<div style="font-size:13px; color:#64748b; font-weight:700;">${it.note}</div>` : ''}
                </div>
                <div style="font-weight:900; font-size:16px; color:#dc2626;">- ${fmtMoney(it.amount)}</div>
            </div>
        `).join('');

        const htmlContent = `
            <div class="confirm-summary-box" style="background:#fef2f2; border-radius:14px; padding:14px; margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:700;">📅 Ngày chi</span><span style="font-weight:800; color:#1e293b;">${dateVN}</span></div>
                <div style="display:flex; justify-content:space-between;"><span style="color:#64748b; font-weight:700;">🧾 Số khoản chi</span><span style="font-weight:800; color:#dc2626;">${expItems.length} khoản</span></div>
            </div>
            <div style="font-size:13px; font-weight:800; color:#64748b; margin-bottom:6px; text-transform:uppercase;">Chi tiết các khoản chi (${expItems.length}):</div>
            <div style="max-height: 180px; overflow-y: auto; margin-bottom: 12px;">${itemsHtml}</div>
            <div style="background:linear-gradient(135deg, #fef2f2, #fee2e2); border:2px solid #fca5a5; border-radius:14px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:12px; font-weight:800; color:#991b1b; text-transform:uppercase;">TỔNG TIỀN CHI PHÍ</div>
                    <div style="font-size:12px; color:#64748b; font-weight:700;">${expItems.length} khoản chi</div>
                </div>
                <div style="font-size:22px; font-weight:900; color:#dc2626;">${fmtMoney(totalExp)}</div>
            </div>
        `;

        showDesktopConfirmModal({
            title: '💸 Xác Nhận Ghi Nhận Chi Phí',
            htmlContent: htmlContent,
            confirmBtnText: '✅ Xác Nhận Chi Phí',
            confirmBtnClass: 'confirm red',
            onProceed: () => {
                executeSubmitExpenseOrder({ expDateVal, dateVN, expItems, totalExp });
            }
        });
    }

    function executeSubmitExpenseOrder({ expDateVal, dateVN, expItems, totalExp }) {
        const btn = document.getElementById('expense-submit-btn');
        const timestampId = 'OFFLINE_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        let queue = JSON.parse(localStorage.getItem('harvest_sync_queue') || '[]');
        const dateParts = expDateVal.split('-');
        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

        expItems.forEach((it, idx) => {
            const rowClientId = `${timestampId}_${idx}`;
            const expenseData = {
                'Ngày': dateVN,
                'Status': 'Xong',
                'Người Mua': '',
                'Chi Phí': it.amount.toString(),
                'Loại CP': it.type,
                'Ghi Chú Chi Phí': it.note || ''
            };

            queue.push({
                action: 'add_expense',
                payload: { action: 'add_expense', data: expenseData },
                clientId: rowClientId
            });

            if (window.farmData && Array.isArray(window.farmData)) {
                window.farmData.unshift({
                    _sheetRowNumber: rowClientId,
                    'Ngày': dateVN,
                    'Status': 'Xong',
                    'Người Mua': '',
                    'Phân Loại Bông': '',
                    'Số lượng': 0,
                    'Giá': 0,
                    'Doanh Thu Bông': 0,
                    'Ghi Chú': it.note || '',
                    'Đã Thu': 0,
                    'Tiền Phải Thu': 0,
                    'Ghi Chú thu': '',
                    'Doanh Thu Khác': 0,
                    'Loại DT': 'Chi Phí',
                    'Chi Phí': it.amount,
                    'Loại CP': it.type,
                    'Ghi Chú Chi Phí': it.note || '',
                    parsedDate: dateObj
                });
            }
        });

        localStorage.setItem('harvest_sync_queue', JSON.stringify(queue));

        // UI Updates
        if (typeof window.applyFiltersAndRender === 'function') window.applyFiltersAndRender();
        if (typeof window.updateCashInHand === 'function') window.updateCashInHand();
        if (typeof window.processSyncQueue === 'function') window.processSyncQueue();

        // Reset form
        const container = document.getElementById('expense-items-container');
        if (container) container.innerHTML = '';
        expenseRowCount = 0;
        addExpenseRow();

        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã ghi nhận!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Ghi Nhận Chi Phí';
            }, 800);
        }

        showToast(`💸 Đã ghi nhận ${fmtMoney(totalExp)} chi phí! Đã cập nhật danh sách.`, 'success');
    }

    // ═══════════════════════════════════════════
    //  INIT & EXPOSURE
    // ═══════════════════════════════════════════
    function initDesktopEntry() {
        // Create datalist if needed
        if (!document.getElementById('flower-types-datalist')) {
            const dl = document.createElement('datalist');
            dl.id = 'flower-types-datalist';
            FLOWER_TYPES.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                dl.appendChild(opt);
            });
            document.body.appendChild(dl);
        }

        // Attach global money input formatter listener
        document.addEventListener('input', e => {
            if (e.target && e.target.classList.contains('money-input')) {
                formatMoneyInput(e.target);
            }
        });

        // Initialize tabs
        initDesktopFarmForm();
        initDesktopVuaForm();
        initDesktopExpenseForm();

        // Close modal on background click
        const modal = document.getElementById('desktop-entry-confirm-modal');
        if (modal) {
            modal.addEventListener('click', e => {
                if (e.target === modal) closeDesktopConfirmModal();
            });
        }
    }

    // Expose functions globally for HTML onclick handlers
    window.switchDesktopEntryTab = switchDesktopEntryTab;
    window.addFarmFlower = addFarmFlower;
    window.setFarmType = setFarmType;
    window.removeFarmFlower = removeFarmFlower;
    window.calcFarmTotals = calcFarmTotals;
    window.submitFarmOrder = submitFarmOrder;

    window.addVuaFlower = addVuaFlower;
    window.setVuaType = setVuaType;
    window.removeVuaFlower = removeVuaFlower;
    window.recalcVua = recalcVua;
    window.submitVuaOrder = submitVuaOrder;

    window.addExpenseRow = addExpenseRow;
    window.setExpType = setExpType;
    window.onExpTypeChange = onExpTypeChange;
    window.removeExpenseRow = removeExpenseRow;
    window.recalcExpenseTotals = recalcExpenseTotals;
    window.submitExpenseOrder = submitExpenseOrder;

    window.showDesktopConfirmModal = showDesktopConfirmModal;
    window.closeDesktopConfirmModal = closeDesktopConfirmModal;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDesktopEntry);
    } else {
        initDesktopEntry();
    }
})();
