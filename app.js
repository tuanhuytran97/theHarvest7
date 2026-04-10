// Configuration is loaded from config.js

document.addEventListener("DOMContentLoaded", () => {
    // 0. Internal Access Control (Server-side validation)
    const loginOverlay = document.getElementById("login-overlay");
    const loginForm = document.getElementById("login-form");
    const appContainer = document.querySelector(".app-container");
    const passwordInput = document.getElementById("admin-password");
    const loginError = document.getElementById("login-error");
    const togglePasswordBtn = document.getElementById("toggle-password-btn");

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            
            // Switch icon and state
            const icon = togglePasswordBtn.querySelector("i");
            if (isPassword) {
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
                togglePasswordBtn.classList.add("active");
                togglePasswordBtn.title = "Ẩn mật khẩu";
            } else {
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
                togglePasswordBtn.classList.remove("active");
                togglePasswordBtn.title = "Hiện mật khẩu";
            }
        });
    }

    // Safety check for CONFIG
    if (typeof CONFIG === 'undefined') {
        console.error("CRITICAL: config.js is missing or failed to load!");
        window.CONFIG = { WEB_APP_URL: "NOT_CONFIGURED", USERS: {} };
    }

    const getRole = () => sessionStorage.getItem("user-role");
    const getUserName = () => sessionStorage.getItem("user-name");
    const getToken = () => sessionStorage.getItem("user-token");

    const updateUserProfile = () => {
        const name = getUserName() || "Người dùng";
        const role = getRole();
        const displayNameEl = document.getElementById("user-display-name");
        const avatarEl = document.getElementById("user-avatar");
        const roleBadgeEl = document.getElementById("user-role-badge");

        if (displayNameEl) displayNameEl.innerText = name;
        if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;

        if (roleBadgeEl) {
            roleBadgeEl.className = 'role-badge'; // reset
            if (role === 'ADMIN') {
                roleBadgeEl.innerText = 'Quản trị';
                roleBadgeEl.classList.add('admin');
            } else if (role === 'EMP_LV1') {
                roleBadgeEl.innerText = 'Bậc 1';
                roleBadgeEl.classList.add('emp1');
            } else if (role === 'EMP_LV2') {
                roleBadgeEl.innerText = 'Bậc 2';
                roleBadgeEl.classList.add('emp2');
            } else {
                roleBadgeEl.style.display = 'none';
            }
        }
    };

    // User Profile Dropdown Logic
    const userTrigger = document.getElementById("user-avatar-trigger");
    const userDropdown = document.getElementById("user-dropdown");
    if (userTrigger && userDropdown) {
        userTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle("active");
        });

        document.addEventListener("click", () => {
            userDropdown.classList.remove("active");
        });
    }

    const checkAuth = () => {
        const role = getRole();
        if (role) {
            loginOverlay.style.display = "none";
            appContainer.style.display = "flex";
            applyRolePermissions(role);
            updateUserProfile();
            return true;
        }
        return false;
    };

    function applyRolePermissions(role) {
        // Elements to hide for specific roles
        const syncBtn = document.getElementById('sync-gsheet-btn');
        const entryCard = document.querySelector('.card:has(#dataEntryForm)');
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        const debtActionBox = document.querySelector('.invoice-footer-actions');

        // EMP_LV2: Readonly, hide sensitive/entry tools
        if (role === 'EMP_LV2') {
            if (syncBtn) syncBtn.style.display = 'none';
            if (entryCard) entryCard.style.display = 'none';
            if (bulkDeleteBtn) bulkDeleteBtn.style.display = 'none';
            if (debtActionBox) debtActionBox.style.display = 'none';
        }
    }

    // Protection Guards for Mutating Functions
    const canMutate = () => {
        const r = getRole();
        return r === 'ADMIN' || r === 'EMP_LV1';
    };

    const isAuthorizedForSync = () => canMutate();
    const isAuthorizedForEntry = () => canMutate();
    const isAuthorizedForDebt = () => canMutate();

    if (!checkAuth()) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const pw = passwordInput.value;
            if (!pw) return;

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            const originalText = submitBtn.innerText;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';
            submitBtn.disabled = true;

            try {
                // Gửi mật khẩu lên Apps Script để kiểm tra
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "login", password: pw }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();

                if (result.status === "success") {
                    // Lấy thông tin từ danh sách ẩn trong config.js nếu có
                    const userConfig = (typeof CONFIG !== 'undefined' && CONFIG.USERS) ? CONFIG.USERS[pw] : null;
                    const userName = userConfig ? userConfig.name : (result.userName || "Người dùng");

                    sessionStorage.setItem("user-role", result.role);
                    sessionStorage.setItem("user-name", userName);
                    sessionStorage.setItem("user-token", pw); // Dùng password làm token xác thực

                    loginOverlay.style.display = "none";
                    appContainer.style.display = "flex";
                    applyRolePermissions(result.role);
                    updateUserProfile();

                    if (typeof initDashboard === "function") initDashboard();

                    // Thông báo thành công mượt mà
                    setTimeout(() => location.reload(), 500);
                } else {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                    loginError.style.display = "block";
                    loginError.innerText = result.message || "Mật khẩu không đúng!";
                    passwordInput.value = "";
                    passwordInput.focus();
                }
            } catch (err) {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                console.error(err);
                alert("Lỗi kết nối Server! Vui lòng kiểm tra lại Google Apps Script.");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("user-role");
            sessionStorage.removeItem("user-name");
            location.reload();
        });
    }

    // 1. Data Initialization & Utility Functions
    let farmData = window.farmData || [];
    let sortState = { column: 'Ngày', direction: 'desc' };
    let currentTableTab = 'today';
    let currentLimit = 20;
    let dataToRenderRef = []; // module-level ref for deleteRowByIndex
    let annualQtyChartInstance = null;
    let annualRevProfitChartInstance = null;
    let annualExpenseChartInstance = null;
    let monthlyCombinedChartInstance = null;
    let currentEditRowData = null; // Track row being edited

    // Convert Excel Serial Date to JS Date Object
    function excelToJsDate(serial) {
        if (!serial) return new Date();
        const epoch = new Date(1899, 11, 30);
        const days = serial;
        return new Date(epoch.getTime() + days * 86400000);
    }

    // Convert JS Date to DD/MM/YYYY format
    function formatDateVietnamese(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "";
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    // Convert JS Date to YYYY-MM-DD for HTML inputs
    function formatDateInput(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "";
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${yyyy}-${mm}-${dd}`;
    }

    function formatCurrency(number) {
        if (!number) return "0 ₫";
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
    }

    // Process initial data: normalize dates
    farmData = farmData.map(item => {
        return {
            ...item,
            parsedDate: excelToJsDate(item["Ngày"]),
            "Status": (item["Status"] && item["Status"].trim() !== "") ? item["Status"].trim() : "Chưa Xong"
        };
    });

    // 2. DOM Elements
    const tableBody = document.getElementById('table-body');
    const searchBuyerInput = document.getElementById('search-buyer');
    const filterStatusSelect = document.getElementById('filter-status');
    const headers = document.querySelectorAll('th[data-sort]');

    const form = document.getElementById('dataEntryForm');
    const qtyInput = document.getElementById('qty-input');
    const priceInput = document.getElementById('price-input');
    const revenueInput = document.getElementById('revenue-input');

    // Vua UI Elements
    const entryTypeSelect = document.getElementById('entry-type');
    const farmFields = document.getElementById('farm-fields');
    const vuaFields = document.getElementById('vua-fields');
    const labelBuyerInput = document.getElementById('label-buyer-input');
    const addFlowerBtn = document.getElementById('add-flower-btn');
    const flowerItemsContainer = document.getElementById('flower-items-container');
    const vuaShipCostInput = document.getElementById('vua-shipping-cost');
    const vuaVattuCostInput = document.getElementById('vua-vattu-cost');
    const vuaPackCostInput = document.getElementById('vua-packing-cost');
    const vuaTotalCostInput = document.getElementById('vua-total-cost');
    const vuaTotalCollectInput = document.getElementById('vua-total-collect');

    const expenseFields = document.getElementById('expense-fields');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseItemsContainer = document.getElementById('expense-items-container');


    // --- UTILS FOR MONEY INPUTS ---
    function parseMoney(val) {
        if (!val) return 0;
        return parseFloat(String(val).replace(/[^\d]/g, '')) || 0;
    }

    function formatMoneyStr(num) {
        if (num === 0) return "0";
        if (!num) return "";
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('money-input')) {
            const val = parseMoney(e.target.value);
            e.target.value = val === 0 ? "0" : formatMoneyStr(val);
        }
    });

    // --- FORM UI LOGIC ---
    if (entryTypeSelect) {
        entryTypeSelect.addEventListener('change', (e) => {
            const type = e.target.value;
            const buyerInput = document.getElementById('buyer-input');
            const statusInput = document.getElementById('status-input');
            const statusGroup = statusInput ? statusInput.closest('.form-group') : null;
            const buyerGroup = buyerInput ? buyerInput.closest('.form-group') : null;

            const flowerContainerBlock = document.querySelector('.span-full:has(#add-flower-btn)');
            const flowerListBlock = document.getElementById('flower-items-container');
            const flowerDivider = flowerListBlock ? flowerListBlock.nextElementSibling : null;

            const toggleFlowerReq = (isReq) => {
                if (flowerListBlock) {
                    flowerListBlock.querySelectorAll('input').forEach(i => i.required = isReq);
                }
            };
            const toggleExpenseReq = (isReq) => {
                if (expenseItemsContainer) {
                    expenseItemsContainer.querySelectorAll('input').forEach(i => i.required = isReq);
                }
            };

            if (type === "farm") {
                if (vuaFields) vuaFields.style.display = "none";
                if (expenseFields) expenseFields.style.display = "none";
                if (statusGroup) statusGroup.style.display = "block";
                if (buyerGroup) buyerGroup.style.display = "block";
                if (flowerContainerBlock) flowerContainerBlock.style.display = "flex";
                if (flowerListBlock) flowerListBlock.style.display = "flex";
                if (flowerDivider) flowerDivider.style.display = "block";
                if (labelBuyerInput) labelBuyerInput.innerText = "Khách Hàng (Tên Khách)";
                if (buyerInput) { buyerInput.value = ""; buyerInput.required = true; }
                if (vuaTotalCollectInput) vuaTotalCollectInput.required = false;
                toggleFlowerReq(true);
                toggleExpenseReq(false);
            } else if (type === "vua") {
                if (vuaFields) vuaFields.style.display = "grid";
                if (expenseFields) expenseFields.style.display = "none";
                if (statusGroup) statusGroup.style.display = "block";
                if (buyerGroup) buyerGroup.style.display = "block";
                if (flowerContainerBlock) flowerContainerBlock.style.display = "flex";
                if (flowerListBlock) flowerListBlock.style.display = "flex";
                if (flowerDivider) flowerDivider.style.display = "block";
                if (labelBuyerInput) labelBuyerInput.innerText = "Đối Soát Vựa (Tên Vựa)";
                if (buyerInput) { buyerInput.value = "Đoan CR"; buyerInput.required = true; }
                if (vuaTotalCollectInput) vuaTotalCollectInput.required = true;
                toggleFlowerReq(true);
                toggleExpenseReq(false);
                calculateVuaTotals();
            } else if (type === "expense") {
                if (vuaFields) vuaFields.style.display = "none";
                if (expenseFields) expenseFields.style.display = "flex";
                if (statusGroup) statusGroup.style.display = "none";
                if (buyerGroup) buyerGroup.style.display = "none";
                if (flowerContainerBlock) flowerContainerBlock.style.display = "none";
                if (flowerListBlock) flowerListBlock.style.display = "none";
                if (flowerDivider) flowerDivider.style.display = "none";
                if (buyerInput) { buyerInput.value = ""; buyerInput.required = false; }
                if (vuaTotalCollectInput) vuaTotalCollectInput.required = false;
                toggleFlowerReq(false);
                toggleExpenseReq(true);
            }

            // Auto-switch disabled to respect user's "Today" default tab
        });
    }

    function calculateVuaTotals() {
        let totalCost = 0;
        let totalSL = 0;
        let flowerNames = [];

        if (flowerItemsContainer) {
            flowerItemsContainer.querySelectorAll('.flower-item').forEach(item => {
                const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const p = parseMoney(item.querySelector('.fw-price').value);
                const type = item.querySelector('.fw-type').value;

                totalCost += (q * p);
                totalSL += q;
                if (q > 0 && !flowerNames.includes(type)) flowerNames.push(type);
            });
        }

        // Update Dynamic Label for Giá vốn
        const labelTotalCost = document.getElementById('label-vua-total-cost');
        if (labelTotalCost) {
            const nameDisplay = flowerNames.length > 0 ? flowerNames.join(', ') : 'Bông';
            labelTotalCost.textContent = `💰 Giá vốn (${totalSL.toLocaleString('vi-VN')} ${nameDisplay})`;
        }

        if (vuaTotalCostInput) vuaTotalCostInput.value = formatCurrency(totalCost);

        const shipping = parseMoney(vuaShipCostInput ? vuaShipCostInput.value : "0");
        const vattu = parseMoney(vuaVattuCostInput ? vuaVattuCostInput.value : "0");
        const packing = parseMoney(vuaPackCostInput ? vuaPackCostInput.value : "0");

        let totalCollect = totalCost + shipping + vattu + packing;

        if (vuaTotalCollectInput) {
            vuaTotalCollectInput.value = formatMoneyStr(totalCollect);
            calculateBundlesAndPrice(vuaTotalCollectInput.value);
        }
    }

    function calculateBundlesAndPrice(totalCollectStr) {
        let totalQty = 0;
        let sumCost = 0; // Cost of flowers
        if (flowerItemsContainer) {
            flowerItemsContainer.querySelectorAll('.flower-item').forEach(item => {
                const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
                totalQty += q;
                const p = parseMoney(item.querySelector('.fw-price').value);
                sumCost += (q * p);
            });
        }

        const totalBundles = totalQty / 50;
        const vuaTotalBundlesEl = document.getElementById('vua-total-bundles');
        if (vuaTotalBundlesEl) {
            vuaTotalBundlesEl.value = totalBundles > 0 ? parseFloat(totalBundles.toFixed(1)) : "0";
        }

        const vuaPricePerBundleEl = document.getElementById('vua-price-per-bundle');
        const suggestBox = document.getElementById('packing-suggest-box');
        const suggestBtn = document.getElementById('btn-apply-suggest');

        if (vuaPricePerBundleEl && totalBundles > 0) {
            const actualCollect = parseMoney(totalCollectStr);
            const pricePerBundle = actualCollect / totalBundles;
            vuaPricePerBundleEl.value = formatCurrency(pricePerBundle);

            // Suggest rounding to nearest 5000 (VND 5k) - e.g. 62->60, 63->65
            const roundedPrice = Math.round(pricePerBundle / 5000) * 5000;

            // Check if it's already perfectly rounded or diff is extremely small
            if (Math.abs(roundedPrice - pricePerBundle) < 100) {
                if (suggestBox) suggestBox.style.display = 'none';
            } else {
                const targetCollect = roundedPrice * totalBundles;
                const shipping = parseMoney(vuaShipCostInput ? vuaShipCostInput.value : "0");
                const vattu = parseMoney(vuaVattuCostInput ? vuaVattuCostInput.value : "0");
                const newPacking = targetCollect - (sumCost + shipping + vattu);

                if (suggestBox && suggestBtn && newPacking >= 0) {
                    suggestBox.style.display = 'block';
                    suggestBtn.innerHTML = `💡 Gợi ý Lợi nhuận: ${formatCurrency(newPacking)} => Giá bó chẵn: ${formatCurrency(roundedPrice)}`;
                    suggestBtn.onclick = () => {
                        if (vuaPackCostInput) {
                            vuaPackCostInput.value = formatMoneyStr(newPacking);
                            calculateVuaTotals();
                        }
                    };
                } else if (suggestBox) {
                    suggestBox.style.display = 'none';
                }
            }
        } else {
            if (vuaPricePerBundleEl) vuaPricePerBundleEl.value = "0 ₫";
            if (suggestBox) suggestBox.style.display = 'none';
        }
    }

    function attachFlowerRowEvents(row) {
        const delBtn = row.querySelector('.del-flower-btn');
        const qtyInput = row.querySelector('.fw-qty');
        const pInput = row.querySelector('.fw-price');
        const totalInput = row.querySelector('.fw-total');

        const updateRowTotal = () => {
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseMoney(pInput.value);
            const total = qty * price;
            if (totalInput) totalInput.value = formatCurrency(total);
            calculateVuaTotals();
        };

        if (delBtn) {
            delBtn.addEventListener('click', () => {
                if (flowerItemsContainer.children.length > 1) {
                    row.remove();
                    calculateVuaTotals();
                } else {
                    alert('Phải có ít nhất 1 dòng Bông!');
                }
            });
        }

        if (qtyInput) qtyInput.addEventListener('input', updateRowTotal);
        if (pInput) pInput.addEventListener('input', updateRowTotal);
    }

    if (flowerItemsContainer) {
        attachFlowerRowEvents(flowerItemsContainer.querySelector('.flower-item'));
    }

    if (addFlowerBtn) {
        addFlowerBtn.addEventListener('click', () => {
            const item = document.createElement('div');
            item.className = 'flower-item';
            item.innerHTML = `
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Loại mặt hàng</label>
                    <select class="fw-type" required>
                        <option value="Xô ngoại">Xô ngoại</option>
                        <option value="Xô nội">Xô nội</option>
                        <option value="Ecuador">Ecuador</option>
                        <option value="Pháp">Pháp</option>
                        <option value="Trắng ù">Trắng ù</option>
                        <option value="Ô Hồng">Ô Hồng</option>
                        <option value="Ô Trắng">Ô Trắng</option>
                        <option value="Simmo">Simmo</option>
                        <option value="Cam Cháy">Cam Cháy</option>
                        <option value="Vitto">Vitto</option>
                        <option value="Lạc Thần">Lạc Thần</option>
                        <option value="Hỷ Trứng">Hỷ Trứng</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">SL</label>
                    <input type="number" placeholder="0" class="fw-qty" min="0" required>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Đơn Giá</label>
                    <input type="text" placeholder="0" class="fw-price money-input" required>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Thành tiền</label>
                    <input type="text" placeholder="0" class="fw-total" readonly style="background: #f1f5f9; color: #0f172a; font-weight: 800; border: 1.5px solid #cbd5e1 !important;">
                </div>
                <button type="button" class="del-flower-btn" title="Xoá"><i class="fa-solid fa-trash-can"></i></button>
            `;
            flowerItemsContainer.appendChild(item);
            attachFlowerRowEvents(item);
        });
    }

    if (vuaShipCostInput) vuaShipCostInput.addEventListener('input', calculateVuaTotals);
    if (vuaVattuCostInput) vuaVattuCostInput.addEventListener('input', calculateVuaTotals);
    if (vuaPackCostInput) vuaPackCostInput.addEventListener('input', calculateVuaTotals);
    if (vuaTotalCollectInput) vuaTotalCollectInput.addEventListener('input', () => {
        const userCollect = parseMoney(vuaTotalCollectInput.value);
        let sumCost = 0;
        flowerItemsContainer.querySelectorAll('.flower-item').forEach(item => {
            const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
            const p = parseMoney(item.querySelector('.fw-price').value);
            sumCost += (q * p);
        });

        const shipping = parseMoney(vuaShipCostInput ? vuaShipCostInput.value : "0");
        const vattu = parseMoney(vuaVattuCostInput ? vuaVattuCostInput.value : "0");

        // Auto update Packing Cost based on Total Collect changes
        const newPacking = userCollect - (sumCost + shipping + vattu);
        if (vuaPackCostInput) vuaPackCostInput.value = formatMoneyStr(Math.max(0, newPacking));

        calculateBundlesAndPrice(vuaTotalCollectInput.value);
    });


    // 3. Table Rendering Logic
    function renderTable(dataToRender) {
        dataToRenderRef = dataToRender; // expose to delete handler
        tableBody.innerHTML = '';

        // Cập nhật Header tiêu đề cột dựa trên Tab
        const thead = document.querySelector('#farm-data-table thead tr');
        if (thead) {
            if (currentTableTab === 'expense') {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ngày">Ngày <i class="fa-solid fa-sort"></i></th>
                    <th>Phân Loại CP</th>
                    <th>Ghi Chú Chi Phí</th>
                    <th>Số tiền</th>
                    <th>Thao Tác</th>
                `;
            } else if (currentTableTab === 'vua') {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ngày">Ngày <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Người Mua">Tên Vựa <i class="fa-solid fa-sort"></i></th>
                    <th>Phân Loại</th>
                    <th data-sort="Số lượng">SL <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Tiền Phải Thu">Phải Thu <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Doanh Thu Khác">Doanh Thu <i class="fa-solid fa-sort"></i></th>
                    <th>Status</th>
                    <th>Ghi Chú</th>
                    <th>Thao Tác</th>
                `;
            } else {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ngày">Ngày <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Người Mua">Người Mua <i class="fa-solid fa-sort"></i></th>
                    <th>Phân Loại</th>
                    <th data-sort="Số lượng">Số Lượng <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Giá">Giá <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Doanh Thu Bông">Doanh Thu Bông <i class="fa-solid fa-sort"></i></th>
                    <th>Trạng Thái</th>
                    <th>Ghi Chú</th>
                    <th>Thao Tác</th>
                `;
            }

            // Re-attach select-all listener
            const newSelectAll = document.getElementById('select-all-checkbox');
            if (newSelectAll) {
                newSelectAll.addEventListener('change', (e) => {
                    const isChecked = e.target.checked;
                    tableBody.querySelectorAll('.row-checkbox:not(:disabled)').forEach(cb => {
                        cb.checked = isChecked;
                    });
                    updateBulkDeleteUI();
                });
            }
        }

        if (dataToRender.length === 0) {
            const colCount = currentTableTab === 'expense' ? 6 : 10;
            tableBody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;color:var(--text-light)">Không tìm thấy giao dịch nào.</td></tr>`;
            return;
        }

        const todayStr = formatDateInput(new Date());

        dataToRender.forEach((row, index) => {
            const tr = document.createElement('tr');
            const isDone = row["Status"] === "Xong";
            const statusClass = isDone ? "status-badge status-done" : "status-badge status-pending";

            const rowDateStr = formatDateInput(row.parsedDate);
            const isToday = rowDateStr === todayStr;
            const rowIndex = index; // use array index as stable reference
            const rowJson = JSON.stringify(row).replace(/'/g, "&apos;").replace(/"/g, "&quot;"); // kept for checkbox value only

            if (currentTableTab === 'expense') {
                const amount = parseFloat(String(row["Chi Phí"] || "0").replace(/,/g, ''));
                tr.innerHTML = `
                    <td data-label="Chọn" style="text-align: center;">
                        ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `<input type="checkbox" class="row-checkbox" data-row-index="${rowIndex}" style="cursor:pointer;">` : `<input type="checkbox" disabled>`}
                    </td>
                    <td data-label="Ngày">${formatDateVietnamese(row.parsedDate)}</td>
                    <td data-label="Loại CP" style="font-weight:600;">${row["Loại CP"] || 'Chi phí'}</td>
                    <td data-label="Ghi chú" title="${row["Ghi Chú Chi Phí"] || row["Ghi Chú"] || ''}">${(row["Ghi Chú Chi Phí"] || row["Ghi Chú"] || '').substring(0, 30)}</td>
                    <td data-label="Số tiền" style="color:#ef4444; font-weight:700;">${formatCurrency(amount)}</td>
                    <td data-label="Thao tác">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="switchToInlineEdit(this)" title="Sửa" style="color:var(--primary-color);">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ` : ''}
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="deleteRowByIndex(this)" title="Xoá">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            ` : (getRole() === 'EMP_LV2' ? '-' : `<span style="color:var(--text-light);font-size:12px">${isToday ? '' : 'Khóa'}</span>`)}
                        </div>
                    </td>
                `;
            } else if (currentTableTab === 'vua') {
                const pt = parseFloat(String(row["Tiền Phải Thu"] || "0").replace(/[^\d]/g, '')) || 0;
                const dt = parseFloat(String(row["Doanh Thu Khác"] || "0").replace(/[^\d]/g, '')) || 0;
                tr.innerHTML = `
                    <td data-label="Chọn" style="text-align: center;">
                        ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `<input type="checkbox" class="row-checkbox" data-row-index="${rowIndex}" style="cursor:pointer;">` : `<input type="checkbox" disabled>`}
                    </td>
                    <td data-label="Ngày">${formatDateVietnamese(row.parsedDate)}</td>
                    <td data-label="Tên Vựa" style="font-weight:600;">${row["Người Mua"] || ''}</td>
                    <td data-label="Loại Bông">${row["Phân Loại Bông"] || ''}</td>
                    <td data-label="SL">${row["Số lượng"] ? row["Số lượng"].toLocaleString('vi-VN') : 0}</td>
                    <td data-label="Phải Thu" style="color:var(--primary-color); font-weight:600;">${formatCurrency(pt)}</td>
                    <td data-label="Doanh Thu" style="color:#ec4899; font-weight:700;">${formatCurrency(dt)}</td>
                    <td data-label="Status">${row["Status"] ? `<span class="${statusClass}">${row["Status"]}</span>` : ''}</td>
                    <td data-label="Ghi chú" title="${row["Ghi Chú"] || ''}">${(row["Ghi Chú"] || '').substring(0, 15)}${(row["Ghi Chú"] || '').length > 15 ? '...' : ''}</td>
                    <td data-label="Thao tác">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="switchToInlineEdit(this)" title="Sửa" style="color:var(--primary-color);">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ` : ''}
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="deleteRowByIndex(this)" title="Xoá">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            ` : (getRole() === 'EMP_LV2' ? '-' : `<span style="color:var(--text-light);font-size:12px">${isToday ? '' : 'Khóa'}</span>`)}
                        </div>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td data-label="Chọn" style="text-align: center;">
                        ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `<input type="checkbox" class="row-checkbox" data-row-index="${rowIndex}" style="cursor:pointer;">` : `<input type="checkbox" disabled>`}
                    </td>
                    <td data-label="Ngày">${formatDateVietnamese(row.parsedDate)}</td>
                    <td data-label="Người Mua" style="font-weight:600;">${row["Người Mua"] || ''}</td>
                    <td data-label="Loại Bông">${row["Phân Loại Bông"] || ''}</td>
                    <td data-label="Số Lượng">${row["Số lượng"] ? row["Số lượng"].toLocaleString('vi-VN') : 0}</td>
                    <td data-label="Giá">${formatCurrency(row["Giá"])}</td>
                    <td data-label="Doanh Thu" style="color:var(--secondary-color); font-weight:600;">${formatCurrency(row["Doanh Thu Bông"])}</td>
                    <td data-label="Status">${row["Status"] ? `<span class="status-badge ${statusClass}">${row["Status"]}</span>` : ''}</td>
                    <td data-label="Ghi chú" title="${row["Ghi Chú"] || ''}">${(row["Ghi Chú"] || '').substring(0, 20)}${row["Ghi Chú"] && row["Ghi Chú"].length > 20 ? '...' : ''}</td>
                    <td data-label="Thao tác">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="switchToInlineEdit(this)" title="Sửa" style="color:var(--primary-color);">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ` : ''}
                            ${(getRole() === 'ADMIN' || (getRole() === 'EMP_LV1' && isToday)) ? `
                            <button class="action-btn" data-row-index="${rowIndex}" onclick="deleteRowByIndex(this)" title="Xoá">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            ` : (getRole() === 'EMP_LV2' ? '-' : `<span style="color:var(--text-light);font-size:12px">${isToday ? '' : 'Khóa'}</span>`)}
                        </div>
                    </td>
                `;
            }
            tableBody.appendChild(tr);
        });

        if (typeof updateBulkDeleteUI === 'function') updateBulkDeleteUI();
    }

    // Strip client-side fields before sending to Apps Script for deletion
    // Apps Script uses getDisplayValues() so "Ngày" must be "DD/MM/YYYY" format
    function cleanRowForDelete(row) {
        const cleaned = { ...row };

        // Convert "Ngày" to DD/MM/YYYY — Apps Script reads display values from Sheet
        if (cleaned.parsedDate && !isNaN(cleaned.parsedDate.getTime())) {
            const d = cleaned.parsedDate;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            cleaned["Ngày"] = `${dd}/${mm}/${yyyy}`;
        }

        delete cleaned.parsedDate; // remove JS Date object — not in Sheet

        // Convert numeric fields back to String (Sheet stores as strings)
        const numFields = ["Số lượng", "Giá", "Doanh Thu Bông", "Chi Phí", "Tiền Phải Thu", "Doanh Thu Khác", "Đã Thu"];
        numFields.forEach(f => {
            if (cleaned[f] !== undefined && cleaned[f] !== "") {
                cleaned[f] = String(cleaned[f]);
            }
        });
        return cleaned;
    }

    // deleteRowByIndex: look up real object from dataToRender by index

    window.deleteRowByIndex = async function (btn) {
        if (!canMutate()) {
            alert("Bạn không có quyền xóa dữ liệu!");
            return;
        }
        const idx = parseInt(btn.getAttribute('data-row-index'));
        const rowData = dataToRenderRef[idx];
        if (!rowData) {
            alert("Không tìm thấy dữ liệu để xóa!");
            return;
        }
        const sheetRow = rowData._sheetRowNumber;
        if (!sheetRow) {
            alert("Dòng này chưa có số thứ tự Sheet — hãy đồng bộ lại dữ liệu từ Google Sheets.");
            return;
        }
        if (!confirm(`Xóa dòng ${sheetRow} trên Google Sheets?`)) return;

        try {
            if (CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
                farmData.splice(farmData.indexOf(rowData), 1);
                applyFiltersAndRender();
                return;
            }
            document.body.style.cursor = 'wait';
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "deleteByRow", rowNumber: sheetRow, token: getToken() }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const result = await response.json();
            if (result.status === "success") {
                showToast("Xóa thành công!", "success");
                const syncBtn = document.getElementById('sync-gsheet-btn');
                if (syncBtn) syncBtn.click();
            } else {
                alert("Lỗi khi xóa: " + result.message);
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối khi xóa.");
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    window.deleteRow = async function () {
        alert("Phiên bản xóa cũ không còn được hỗ trợ. Vui lòng tải lại trang.");
    };

    window.switchToInlineEdit = function (btn) {
        const idx = parseInt(btn.getAttribute('data-row-index'));
        const rowData = dataToRenderRef[idx];
        const tr = btn.closest('tr');
        if (!rowData || !tr) return;

        // Save original HTML for cancel
        tr.dataset.originalHtml = tr.innerHTML;
        tr.classList.add('editing-row');

        if (currentTableTab === 'expense') {
            const amount = parseFloat(String(rowData["Chi Phí"] || "0").replace(/[^\d]/g, ''));
            tr.innerHTML = `
                <td></td>
                <td>${formatDateVietnamese(rowData.parsedDate)}</td>
                <td>
                    <select class="inline-edit-input" id="edit-exp-type">
                        <option value="${rowData["Loại CP"]}">${rowData["Loại CP"]}</option>
                        <option value="Chi Phí Khác">Chi Phí Khác</option>
                        <option value="Thuốc">Thuốc</option>
                        <option value="Phân">Phân</option>
                        <option value="Lãi">Lãi</option>
                        <option value="Công">Công</option>
                        <option value="Mua Bông">Mua Bông</option>
                        <option value="Vật Tư KD">Vật Tư KD</option>
                        <option value="Vận Chuyển">Vận Chuyển</option>
                    </select>
                </td>
                <td><input type="text" class="inline-edit-input" id="edit-exp-note" value="${rowData["Ghi Chú Chi Phí"] || ""}"></td>
                <td><input type="text" class="inline-edit-input money-input" id="edit-exp-amount" value="${formatMoneyStr(amount)}"></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button onclick="saveInlineEdit(${idx}, this)" class="btn-primary" style="padding:4px 8px; font-size:12px; background:var(--success); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                        <button onclick="cancelInlineEdit(this)" class="btn-primary" style="padding:4px 8px; font-size:12px; background:var(--danger); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </td>
            `;
        } else if (currentTableTab === 'vua') {
            tr.innerHTML = `
                <td></td>
                <td>${formatDateVietnamese(rowData.parsedDate)}</td>
                <td><input type="text" class="inline-edit-input" id="edit-buyer" value="${rowData["Người Mua"] || ""}"></td>
                <td><input type="text" class="inline-edit-input" id="edit-flower-type" value="${rowData["Phân Loại Bông"] || ""}"></td>
                <td><input type="number" class="inline-edit-input" id="edit-qty" value="${rowData["Số lượng"] || 0}"></td>
                <td>-</td>
                <td>-</td>
                <td>
                    <select class="inline-edit-input" id="edit-status">
                        <option value="Chưa Xong" ${rowData["Status"] === "Chưa Xong" ? "selected" : ""}>Chưa Xong</option>
                        <option value="Xong" ${rowData["Status"] === "Xong" ? "selected" : ""}>Xong</option>
                    </select>
                </td>
                <td><input type="text" class="inline-edit-input" id="edit-note" value="${rowData["Ghi Chú"] || ""}"></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button onclick="saveInlineEdit(${idx}, this)" class="btn-primary" style="padding:5px; background:var(--success); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                        <button onclick="cancelInlineEdit(this)" class="btn-primary" style="padding:5px; background:var(--danger); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </td>
            `;
        } else {
            // Farm Mode
            tr.innerHTML = `
                <td></td>
                <td>${formatDateVietnamese(rowData.parsedDate)}</td>
                <td><input type="text" class="inline-edit-input" id="edit-buyer" value="${rowData["Người Mua"] || ""}"></td>
                <td><input type="text" class="inline-edit-input" id="edit-flower-type" value="${rowData["Phân Loại Bông"] || ""}"></td>
                <td><input type="number" class="inline-edit-input" id="edit-qty" value="${rowData["Số lượng"] || 0}"></td>
                <td><input type="text" class="inline-edit-input money-input" id="edit-price" value="${formatMoneyStr(rowData["Giá"] || 0)}"></td>
                <td>-</td>
                <td>
                    <select class="inline-edit-input" id="edit-status">
                        <option value="Chưa Xong" ${rowData["Status"] === "Chưa Xong" ? "selected" : ""}>Chưa Xong</option>
                        <option value="Xong" ${rowData["Status"] === "Xong" ? "selected" : ""}>Xong</option>
                    </select>
                </td>
                <td><input type="text" class="inline-edit-input" id="edit-note" value="${rowData["Ghi Chú"] || ""}"></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button onclick="saveInlineEdit(${idx}, this)" class="btn-primary" style="padding:5px; background:var(--success); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-check"></i></button>
                        <button onclick="cancelInlineEdit(this)" class="btn-primary" style="padding:5px; background:var(--danger); color:white; border:none; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </td>
            `;
        }
    };

    window.cancelInlineEdit = function (btn) {
        const tr = btn.closest('tr');
        if (tr && tr.dataset.originalHtml) {
            tr.innerHTML = tr.dataset.originalHtml;
            tr.classList.remove('editing-row');
        }
    };

    window.saveInlineEdit = async function (idx, btn) {
        const tr = btn.closest('tr');
        const originalData = dataToRenderRef[idx];
        if (!originalData || !tr) return;

        if (!confirm("Xác nhận cập nhật dòng dữ liệu này?")) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            // 1. Collect Data
            let newRow = { ...originalData };
            const dateStr = formatDateVietnamese(originalData.parsedDate);

            if (currentTableTab === 'expense') {
                newRow["Loại CP"] = document.getElementById('edit-exp-type').value;
                newRow["Ghi Chú Chi Phí"] = document.getElementById('edit-exp-note').value;
                newRow["Chi Phí"] = parseMoney(document.getElementById('edit-exp-amount').value).toString();
                newRow["Status"] = "Xong";
            } else {
                newRow["Người Mua"] = document.getElementById('edit-buyer').value;
                newRow["Phân Loại Bông"] = document.getElementById('edit-flower-type').value;
                newRow["Số lượng"] = document.getElementById('edit-qty').value;
                newRow["Status"] = document.getElementById('edit-status').value;
                newRow["Ghi Chú"] = document.getElementById('edit-note').value;

                if (currentTableTab === 'farm') {
                    const price = parseMoney(document.getElementById('edit-price').value);
                    newRow["Giá"] = price.toString();
                    newRow["Doanh Thu Bông"] = (parseFloat(newRow["Số lượng"]) * price).toString();
                }
            }

            // Clean for sending
            const payloadData = { ...newRow };
            delete payloadData.parsedDate;
            delete payloadData._sheetRowNumber;
            payloadData["Ngày"] = dateStr;

            // 2. Delete old
            const oldSheetRow = originalData._sheetRowNumber;
            const delResp = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "deleteByRow", rowNumber: oldSheetRow, token: getToken() }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const delRes = await delResp.json();
            if (delRes.status !== "success") throw new Error("Lỗi khi xóa dòng cũ: " + delRes.message);

            // 3. Add new
            const addAction = (currentTableTab === 'expense') ? 'add_expense' : 'add';
            const addResp = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: addAction, data: payloadData, token: getToken() }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const addRes = await addResp.json();
            if (addRes.status !== "success") throw new Error("Lỗi khi lưu dòng mới: " + addRes.message);

            showToast("Cập nhật thành công!", "success");
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) syncBtn.click();
        } catch (e) {
            alert(e.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
    };

    // Menu Routing
    const menuData = document.getElementById('menu-data');
    const menuReport = document.getElementById('menu-report');
    const menuDebt = document.getElementById('menu-debt');
    const menuCashFlow = document.getElementById('menu-cashflow'); // NEW
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

    const viewData = document.getElementById('view-data');
    const viewReport = document.getElementById('view-report');
    const viewDebt = document.getElementById('view-debt');
    const viewCashFlow = document.getElementById('view-cashflow'); // NEW

    function hideAllViews() {
        if (menuData) menuData.classList.remove('active');
        if (menuReport) menuReport.classList.remove('active');
        if (menuDebt) menuDebt.classList.remove('active');
        if (menuCashFlow) menuCashFlow.classList.remove('active');

        mobileNavItems.forEach(i => i.classList.remove('active'));

        if (viewData) viewData.style.display = 'none';
        if (viewReport) viewReport.style.display = 'none';
        if (viewDebt) viewDebt.style.display = 'none';
        if (viewCashFlow) viewCashFlow.style.display = 'none';
    }

    function syncMobileNav(viewId) {
        mobileNavItems.forEach(item => {
            if (item.dataset.view === viewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function switchView(viewId) {
        hideAllViews();
        localStorage.setItem("active_app_view", viewId);

        if (viewId === 'data') {
            if (menuData) menuData.classList.add('active');
            syncMobileNav('data');
            if (viewData) viewData.style.display = 'block';
            applyFiltersAndRender();
        } else if (viewId === 'report') {
            if (menuReport) menuReport.classList.add('active');
            syncMobileNav('report');
            if (viewReport) viewReport.style.display = 'block';
            updateDashboard();
        } else if (viewId === 'debt') {
            if (menuDebt) menuDebt.classList.add('active');
            syncMobileNav('debt');
            if (viewDebt) viewDebt.style.display = 'block';
            renderDebtTable();
        } else if (viewId === 'cashflow') {
            if (menuCashFlow) menuCashFlow.classList.add('active');
            syncMobileNav('cashflow');
            if (viewCashFlow) viewCashFlow.style.display = 'block';
            updateCashFlowReport();
        }
    }

    if (menuData) {
        menuData.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('data');
        });
    }

    if (menuReport) {
        menuReport.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('report');
        });
    }

    if (menuDebt) {
        menuDebt.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('debt');
        });
    }

    if (menuCashFlow) {
        menuCashFlow.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('cashflow');
        });
    }

    // Mobile Nav Click Listener
    mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // Debt Filter Listener
    const debtFilter = document.getElementById('debt-filter');
    if (debtFilter) {
        debtFilter.addEventListener('change', renderDebtTable);
    }

    // Debt Table Rendering Logic
    let currentSelectedBuyer = null;

    function renderDebtTable() {
        const masterView = document.getElementById('debt-master-view');
        const detailView = document.getElementById('debt-detail-view');
        const filterVal = document.getElementById('debt-filter') ? document.getElementById('debt-filter').value : 'farm';

        if (masterView) masterView.style.display = 'block';
        if (detailView) detailView.style.display = 'none';

        let debtData = farmData.filter(row => (row["Status"] || "").toLowerCase() !== "xong");

        // The UI filters have been removed, so we always process all data to render both columns at once

        // 1. Group items by Date + Buyer to get the unique transactions
        const transactions = {};
        debtData.forEach(row => {
            if (!row.parsedDate || isNaN(row.parsedDate.getTime())) return;
            const dateStr = formatDateVietnamese(row.parsedDate);
            const buyer = (row["Người Mua"] || "Khách Lẻ").trim();
            const isVua = (row["Loại DT"] || "") === "Vựa";
            const key = `${dateStr}_${buyer}`;

            if (!transactions[key]) {
                transactions[key] = {
                    key: key,
                    dateStr: dateStr,
                    rawDate: row.parsedDate.getTime(),
                    buyer: buyer,
                    lines: [],
                    totalExpected: 0,
                    vuaExpectedAdded: false,
                    paid: 0,
                    totalQty: 0
                };
            }

            const t = transactions[key];
            const qty = parseFloat(row["Số lượng"]) || 0;
            const priceStr = row["Giá"];
            const price = priceStr ? parseFloat(String(priceStr).replace(/[^\d]/g, '')) || 0 : 0;
            const dtBongStr = row["Doanh Thu Bông"];
            const dtBong = dtBongStr ? parseFloat(String(dtBongStr).replace(/[^\d]/g, '')) || 0 : 0;

            const flowerType = row["Phân Loại Bông"] || "Bông";
            const ptStr = row["Tiền Phải Thu"];
            const tPhaiThu = ptStr ? parseFloat(String(ptStr).replace(/[^\d]/g, '')) || 0 : 0;
            const daThuStr = row["Đã Thu"];
            const actualPaid = daThuStr ? parseFloat(String(daThuStr).replace(/[^\d]/g, '')) || 0 : 0;

            t.lines.push({ qty, price, flowerType, dtBong, rawRow: row, isVua });
            t.totalQty += qty;
            t.paid += actualPaid; // This now safely extracts millions from e.g. "1.600.000đ"

            if (isVua) {
                // Remove the 'vuaExpectedAdded' logic completely so multiple batches on the same day sum correctly
                if (tPhaiThu > 0) {
                    t.totalExpected += tPhaiThu;
                }
            } else {
                t.totalExpected += dtBong;
            }
        });

        // 2. Group transactions by Buyer
        const buyers = {};
        Object.values(transactions).forEach(t => {
            if (!buyers[t.buyer]) {
                buyers[t.buyer] = { name: t.buyer, totalDebt: 0, orderCount: 0, transactions: [], isVua: false };
            }
            if (t.lines.length > 0 && t.lines[0].isVua) {
                buyers[t.buyer].isVua = true;
            }
            buyers[t.buyer].totalDebt += (t.totalExpected - t.paid);
            buyers[t.buyer].orderCount += t.lines.length; // Count each sheet row as 1 "đơn"
            buyers[t.buyer].transactions.push(t);
        });

        // 3. Render Master List
        const farmListContainer = document.getElementById('debt-farm-list');
        const vuaListContainer = document.getElementById('debt-vua-list');
        const masterTotalEl = document.getElementById('master-total-debt');
        const farmTotalEl = document.getElementById('farm-total-debt');
        const vuaTotalEl = document.getElementById('vua-total-debt');

        if (!farmListContainer || !vuaListContainer) return;

        farmListContainer.innerHTML = '';
        vuaListContainer.innerHTML = '';

        let globalDebt = 0;
        let farmDebt = 0;
        let vuaDebt = 0;

        let farmCount = 0;
        let vuaCount = 0;

        // Filter out fully paid buyers globally
        const activeBuyers = Object.values(buyers).filter(b => b.totalDebt > 0);
        const sortedBuyers = activeBuyers.sort((a, b) => b.totalDebt - a.totalDebt);

        sortedBuyers.forEach(b => {
            globalDebt += b.totalDebt;
            const btn = document.createElement('button');
            btn.className = 'customer-debt-btn';
            if (b.isVua) btn.classList.add('vua-flavor');

            let debtFormatted = (b.totalDebt / 1000000).toFixed(1) + "tr";
            if (b.totalDebt < 1000000) debtFormatted = (b.totalDebt / 1000).toFixed(0) + "k";

            btn.innerHTML = `
                 <span class="buyer-name-part">👤 <span>${b.name}</span></span>
                 <span class="debt-amount-part">🔴 ${debtFormatted} <span class="order-count-tag">(${b.orderCount} đơn)</span></span>
             `;

            btn.onclick = () => showDebtDetail(b);

            if (b.isVua) {
                vuaListContainer.appendChild(btn);
                vuaDebt += b.totalDebt;
                vuaCount++;
            } else {
                farmListContainer.appendChild(btn);
                farmDebt += b.totalDebt;
                farmCount++;
            }
        });

        if (farmCount === 0) {
            farmListContainer.innerHTML = `<div style="text-align: center; color: var(--text-dark); padding: 10px; background: white; border-radius: 8px;">Hoan hô! Không có công nợ.</div>`;
        }
        if (vuaCount === 0) {
            vuaListContainer.innerHTML = `<div style="text-align: center; color: var(--text-dark); padding: 10px; background: white; border-radius: 8px;">Hoan hô! Không có công nợ.</div>`;
        }

        if (masterTotalEl) masterTotalEl.innerText = formatCurrency(globalDebt);
        if (farmTotalEl) farmTotalEl.innerText = formatCurrency(farmDebt);
        if (vuaTotalEl) vuaTotalEl.innerText = formatCurrency(vuaDebt);

        // Keep detail view open if it was already open and buyer still has debt
        if (currentSelectedBuyer && buyers[currentSelectedBuyer.name]) {
            showDebtDetail(buyers[currentSelectedBuyer.name]);
        } else {
            currentSelectedBuyer = null;
            if (masterView) masterView.style.display = 'block';
            if (detailView) detailView.style.display = 'none';
        }
    }

    // Switch to detail view
    function showDebtDetail(buyerObj) {
        currentSelectedBuyer = buyerObj;
        document.getElementById('debt-master-view').style.display = 'none';
        document.getElementById('debt-detail-view').style.display = 'block';

        document.getElementById('detail-buyer-name').innerHTML = `👤 ${buyerObj.name}`;

        const txList = document.getElementById('detail-transaction-list');
        txList.innerHTML = '';

        let sumQty = 0;
        let sumExpected = 0;
        let sumPaid = 0;

        const sortedTx = buyerObj.transactions.sort((a, b) => b.rawDate - a.rawDate);

        sortedTx.forEach((t, idx) => {
            sumQty += t.totalQty;
            sumExpected += t.totalExpected;
            sumPaid += t.paid;

            const parts = t.dateStr.split('/');
            const shortDate = (parts.length >= 2) ? `${parts[0]}.${parts[1]}` : t.dateStr;

            const invoiceItem = document.createElement('div');
            invoiceItem.className = 'invoice-item-compact';
            invoiceItem.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem;';

            let detailsHtml = '';

            if (t.lines.length > 0 && t.lines[0].isVua) {
                // Vựa Rendering - Siêu gọn
                const combinedFlowers = t.lines.map(l => `${l.qty} ${l.flowerType}`).join(', ');
                detailsHtml = `
                    <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 700; color: #1e293b;">📅 ${shortDate} | <span style="font-weight: 500;">${combinedFlowers}</span></span>
                            ${t.paid > 0 ? `<span style="font-size: 0.75rem; color: #059669;">✅ Đã thu: ${formatCurrency(t.paid)}</span>` : ''}
                        </div>
                        <span style="font-weight: 800; color: var(--primary-color);">${formatCurrency(t.totalExpected)}</span>
                    </div>
                `;
            } else {
                // Farm Rendering - Gọn nhưng đầy đủ
                const linesSummary = t.lines.map(l => {
                    const pK = (l.price / 1000).toFixed(1) + 'k';
                    return `${l.qty} ${l.flowerType} x ${pK}`;
                }).join(' | ');

                detailsHtml = `
                    <div style="flex: 1; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                        <div style="display: flex; flex-direction: column; flex: 1;">
                            <span style="font-weight: 700; color: #1e293b; line-height: 1.4;">
                                📅 ${shortDate} | <span style="font-weight: 500; color: #475569;">${linesSummary}</span>
                            </span>
                            ${t.paid > 0 ? `<span style="font-size: 0.75rem; color: #059669; margin-top: 2px;">✅ Đã thu: ${formatCurrency(t.paid)}</span>` : ''}
                        </div>
                        <span style="font-weight: 800; color: var(--secondary-color); white-space: nowrap; margin-top: 2px;">${formatCurrency(t.totalExpected)}</span>
                    </div>
                `;
            }

            invoiceItem.innerHTML = `
                <input type="checkbox" class="tx-checkbox" data-txkey="${t.key}" style="width: 18px; height: 18px; cursor: pointer; flex-shrink: 0;">
                ${detailsHtml}
            `;
            txList.appendChild(invoiceItem);
        });

        // Add Select All functionality
        const selectAllContainer = document.createElement('div');
        selectAllContainer.style.cssText = 'padding: 10px 15px; border-bottom: 2px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 12px; font-weight: 700;';
        selectAllContainer.innerHTML = `<input type="checkbox" id="detail-select-all" style="width: 20px; height: 20px; cursor: pointer;"> <label for="detail-select-all" style="cursor: pointer;">CHỌN TẤT CẢ ĐƠN</label>`;
        txList.prepend(selectAllContainer);

        const selectAllCb = selectAllContainer.querySelector('#detail-select-all');
        const txCheckboxes = txList.querySelectorAll('.tx-checkbox');

        selectAllCb.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            txCheckboxes.forEach(cb => cb.checked = isChecked);
        });

        document.getElementById('detail-total-qty').innerText = sumQty.toLocaleString('vi-VN') + ' bông';
        document.getElementById('detail-total-amount').innerText = formatCurrency(sumExpected);
        document.getElementById('detail-paid-amount').innerText = formatCurrency(sumPaid);
        document.getElementById('detail-debt-amount').innerText = formatCurrency(sumExpected - sumPaid);
    }

    // Back button listener
    const btnBack = document.getElementById('btn-back-to-master');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            currentSelectedBuyer = null;
            document.getElementById('debt-master-view').style.display = 'block';
            document.getElementById('debt-detail-view').style.display = 'none';
        });
    }

    // Process payment calls
    async function processPayment(isFull) {
        if (!isAuthorizedForDebt()) {
            alert("Bạn không có quyền thực hiện thanh toán!");
            return;
        }
        if (!currentSelectedBuyer) return;
        const totalDebt = currentSelectedBuyer.totalDebt;
        let amountToPay = totalDebt;

        if (!isFull) {
            const rawInput = prompt(`Tổng nợ hiện tại là ${formatCurrency(totalDebt)}.\nNhập số tiền muốn thanh toán (VNĐ):`, "");
            if (!rawInput) return;
            amountToPay = parseFloat(rawInput.replace(/[^\d]/g, ''));
            if (isNaN(amountToPay) || amountToPay <= 0 || amountToPay > totalDebt) {
                alert("Số tiền không hợp lệ hoặc lớn hơn tổng nợ!");
                return;
            }
        } else {
            if (!confirm(`Xác nhận thanh toán HẾT toàn bộ số nợ ${formatCurrency(totalDebt)} của ${currentSelectedBuyer.name}?`)) return;
        }

        if (CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
            alert("Vui lòng cấu hình WEB_APP_URL!");
            return;
        }

        document.body.style.cursor = 'wait';

        // Phân bổ số tiền trả cho các đơn nợ (từ cũ nhất đến mới nhất)
        let remainingPayment = amountToPay;
        const sortedTxAsc = [...currentSelectedBuyer.transactions].sort((a, b) => a.rawDate - b.rawDate);
        const updatesList = [];

        for (let i = 0; i < sortedTxAsc.length; i++) {
            if (remainingPayment <= 0) break;

            const t = sortedTxAsc[i];
            const currentDebt = t.totalExpected - t.paid;
            if (currentDebt <= 0) continue;

            const amountForThisTx = Math.min(currentDebt, remainingPayment);
            const newPaid = t.paid + amountForThisTx;
            remainingPayment -= amountForThisTx;

            // Chuẩn bị payload lấy giao dịch dòng đầu tiên (để gán Đã Thu)
            if (t.lines.length > 0) {
                const firstRow = t.lines[0].rawRow;
                // Cập nhật Cột trạng thái
                let newStatus = firstRow["Status"]; // ""
                if (newPaid >= t.totalExpected) {
                    newStatus = "Xong";
                }

                // Cập nhật Ghi chú
                const now = new Date();
                const dateTimeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                let newGhiChu = `Thanh toán ${isFull ? 'hết' : 'một phần'} ngày ${dateTimeStr}`;
                const existingNote = firstRow["Ghi Chú"] || "";
                if (existingNote.trim() !== '') {
                    newGhiChu = existingNote + " | " + newGhiChu;
                }

                updatesList.push({
                    targetRow: firstRow,
                    updates: {
                        "Đã Thu": newPaid,
                        "Status": newStatus,
                        "Ghi Chú": newGhiChu
                    }
                });

                // Update in memory immediately for snappy UI
                firstRow["Đã Thu"] = newPaid;
                firstRow["Status"] = newStatus;
                firstRow["Ghi Chú"] = newGhiChu;
            }
        }

        try {
            let successC = 0;
            // Send sequentially 
            for (let i = 0; i < updatesList.length; i++) {
                const req = updatesList[i];
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "update", targetRow: req.targetRow, updates: req.updates, token: getToken() }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status === "success") {
                    successC++;
                }
            }
            showToast(`Đã thanh toán thành công ${formatCurrency(amountToPay)}!`, "success");
            // Refresh data visibly right away without waiting for backend
            renderDebtTable();

            // Sync background to ensure google sheet state is downloaded clean
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) {
                syncBtn.click();
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối khi thanh toán.");
        } finally {
            document.body.style.cursor = 'default';
        }
    }

    const btnPayFull = document.getElementById('btn-pay-full');
    const btnPayPartial = document.getElementById('btn-pay-partial');
    const btnPaySelected = document.getElementById('btn-pay-selected');

    if (btnPayFull) btnPayFull.addEventListener('click', () => processPayment(true));
    if (btnPayPartial) btnPayPartial.addEventListener('click', () => processPayment(false));
    if (btnPaySelected) btnPaySelected.addEventListener('click', paySelectedOrders);

    async function paySelectedOrders() {
        if (!currentSelectedBuyer) return;
        const checkedBoxes = document.querySelectorAll('.tx-checkbox:checked');
        if (checkedBoxes.length === 0) {
            alert("Vui lòng chọn ít nhất một đơn hàng để thanh toán.");
            return;
        }

        if (!confirm(`Xác nhận thanh toán ${checkedBoxes.length} đơn hàng đã chọn cho ${currentSelectedBuyer.name}?`)) return;

        if (CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
            alert("Vui lòng cấu hình WEB_APP_URL!");
            return;
        }

        document.body.style.cursor = 'wait';
        const payBtn = document.getElementById('btn-pay-selected');
        const originalHtml = payBtn.innerHTML;
        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

        const selectedKeys = Array.from(checkedBoxes).map(cb => cb.dataset.txkey);
        const transactionsToPay = currentSelectedBuyer.transactions.filter(t => selectedKeys.includes(t.key));

        const updatesList = [];
        const now = new Date();
        const dateTimeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        transactionsToPay.forEach(t => {
            // Xác định tổng tiền của toàn bộ transaction này để gán vào dòng đầu tiên (hoặc phân bổ)
            // Tuy nhiên đơn giản nhất là mark "Xong" cho mọi dòng trong transaction này.
            t.lines.forEach((line, index) => {
                const row = line.rawRow;
                const existingNote = row["Ghi Chú"] || "";
                const newNote = existingNote ? `${existingNote} | Thanh toán đơn lẻ ${dateTimeStr}` : `Thanh toán đơn lẻ ${dateTimeStr}`;

                // Tính toán giá trị thanh toán cho dòng này
                const valToPay = t.isVua ? (parseFloat(String(row["Tiền Phải Thu"] || "0").replace(/[^\d]/g, '')) || 0)
                    : (parseFloat(String(row["Doanh Thu Bông"] || "0").replace(/[^\d]/g, '')) || 0);

                updatesList.push({
                    targetRow: row,
                    updates: {
                        "Status": "Xong",
                        "Ghi Chú": newNote,
                        "Đã Thu": valToPay > 0 ? valToPay : (parseFloat(String(row["Đã Thu"] || "0").replace(/[^\d]/g, '')) || 0)
                    }
                });

                // Update local memory
                row["Status"] = "Xong";
                row["Ghi Chú"] = newNote;
                if (valToPay > 0) row["Đã Thu"] = valToPay;
            });
        });

        try {
            let successC = 0;
            for (let i = 0; i < updatesList.length; i++) {
                const req = updatesList[i];
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "update", targetRow: req.targetRow, updates: req.updates, token: getToken() }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status === "success") successC++;
            }
            alert(`Đã thanh toán thành công ${checkedBoxes.length} đơn hàng!`);
            renderDebtTable();
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) syncBtn.click();
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối khi thanh toán.");
        } finally {
            document.body.style.cursor = 'default';
            payBtn.disabled = false;
            payBtn.innerHTML = originalHtml;
        }
    }

    // Report Setup
    const reportRangeSelect = document.getElementById('report-range');
    const reportMonthSelect = document.getElementById('report-month');
    const monthSelectContainer = document.getElementById('month-select-container');

    const cmpMonth1Select = document.getElementById('cmp-month1');
    const cmpMonth2Select = document.getElementById('cmp-month2');
    const cmpPeriodSelect = document.getElementById('cmp-period');

    if (reportRangeSelect) {
        reportRangeSelect.addEventListener('change', () => {
            const val = reportRangeSelect.value;
            const isMonth = val === 'month';
            const isQuarter = val.startsWith('q');

            monthSelectContainer.style.display = isMonth ? 'block' : 'none';

            // Adjust chart displays
            document.getElementById('yearly-report-charts').style.display = (isMonth || isQuarter) ? 'none' : 'grid';
            document.getElementById('monthly-report-charts').style.display = (isMonth || isQuarter) ? 'grid' : 'none';

            const kpiLabels = document.querySelectorAll('.kpi-cards h3');
            kpiLabels.forEach(label => {
                let context = isMonth ? 'T.Tháng' : (isQuarter ? 'T.Quý' : 'T.Năm');
                label.innerText = label.innerText.replace(/T\.(Tháng|Năm|Quý)/g, context);
            });
            updateDashboard();
            syncMainToComparison();
        });
    }

    if (reportMonthSelect) {
        reportMonthSelect.addEventListener('change', () => {
            updateDashboard();
            syncMainToComparison();
        });
    }

    if (cmpPeriodSelect) {
        cmpPeriodSelect.addEventListener('change', () => {
            const isIndividualMonth = cmpPeriodSelect.value === 'month';
            if (cmpMonth1Select) cmpMonth1Select.style.display = isIndividualMonth ? 'block' : 'none';
            if (cmpMonth2Select) cmpMonth2Select.style.display = isIndividualMonth ? 'block' : 'none';
            updateComparison();
        });
    }
    if (cmpMonth1Select) cmpMonth1Select.addEventListener('change', updateComparison);
    if (cmpMonth2Select) cmpMonth2Select.addEventListener('change', updateComparison);

    // Toggle Comparison Button & Sync logic
    const toggleCmpBtn = document.getElementById('toggle-comparison-btn');
    if (toggleCmpBtn) {
        toggleCmpBtn.addEventListener('click', () => {
            const unifiedControls = document.getElementById('unified-cmp-controls');
            const btnSpan = toggleCmpBtn.querySelector('span');
            const icon = toggleCmpBtn.querySelector('i');

            if (unifiedControls.style.display === 'none' || !unifiedControls.style.display) {
                // OPEN MODE
                unifiedControls.style.display = 'flex';
                toggleCmpBtn.style.backgroundColor = 'var(--primary-color)';
                toggleCmpBtn.style.color = 'white';
                if (btnSpan) btnSpan.innerText = "Đóng so sánh";
                if (icon) { icon.className = "fa-solid fa-xmark"; }

                // Set default comparison year/month if not set
                const mainYear = document.getElementById('report-year').value;
                const mainMonth = document.getElementById('report-month').value;
                const reportYearPrev = document.getElementById('report-year-prev');
                const reportMonthPrev = document.getElementById('report-month-prev');

                if (reportYearPrev && !reportYearPrev.value) reportYearPrev.value = parseInt(mainYear) - 1;
                if (reportMonthPrev && !reportMonthPrev.value) reportMonthPrev.value = mainMonth;
                const reportQuarterPrev = document.getElementById('report-quarter-prev');
                if (reportQuarterPrev && !reportQuarterPrev.value) reportQuarterPrev.value = document.getElementById('report-range').value;

                updateDashboard();
            } else {
                // CLOSE MODE
                unifiedControls.style.display = 'none';
                toggleCmpBtn.style.backgroundColor = '#f1f5f9';
                toggleCmpBtn.style.color = '#475569';
                if (btnSpan) btnSpan.innerText = "So sánh khác";
                if (icon) { icon.className = "fa-solid fa-calendar-days"; }
                updateDashboard();
            }
        });
    }

    // New unified baseline listeners
    const reportYearPrev = document.getElementById('report-year-prev');
    const reportMonthPrev = document.getElementById('report-month-prev');
    const reportQuarterPrev = document.getElementById('report-quarter-prev');
    if (reportYearPrev) reportYearPrev.addEventListener('change', updateDashboard);
    if (reportMonthPrev) reportMonthPrev.addEventListener('change', updateDashboard);
    if (reportQuarterPrev) reportQuarterPrev.addEventListener('change', updateDashboard);
    function populateYears() {
        const yearSelect = document.getElementById('report-year');
        const cmpY1Select = document.getElementById('cmp-year1');
        const cmpY2Select = document.getElementById('cmp-year2');
        const years = new Set();
        farmData.forEach(row => {
            if (row.parsedDate && !isNaN(row.parsedDate.getTime())) {
                years.add(row.parsedDate.getFullYear());
            }
        });

        const sortedYears = Array.from(years).sort((a, b) => b - a);
        const prevYearSelect = document.getElementById('report-year-prev');
        const cfYearSelect = document.getElementById('cashflow-year');
        const cfYearSelect2 = document.getElementById('cashflow-year-2');

        yearSelect.innerHTML = '';
        if (cmpY1Select) cmpY1Select.innerHTML = '';
        if (cmpY2Select) cmpY2Select.innerHTML = '';
        if (prevYearSelect) prevYearSelect.innerHTML = '';
        if (cfYearSelect) cfYearSelect.innerHTML = '';
        if (cfYearSelect2) cfYearSelect2.innerHTML = '';

        sortedYears.forEach(year => {
            const createOpt = (y) => {
                const opt = document.createElement('option');
                opt.value = y; opt.textContent = y;
                return opt;
            };

            yearSelect.appendChild(createOpt(year));
            if (cmpY1Select) cmpY1Select.appendChild(createOpt(year));
            if (cmpY2Select) cmpY2Select.appendChild(createOpt(year));
            if (prevYearSelect) prevYearSelect.appendChild(createOpt(year));
            if (cfYearSelect) cfYearSelect.appendChild(createOpt(year));
            if (cfYearSelect2) cfYearSelect2.appendChild(createOpt(year));
        });

        const currentYear = new Date().getFullYear();
        const currentMonthNum = new Date().getMonth() + 1;
        if (years.has(currentYear)) {
            yearSelect.value = currentYear;
            const monthSelect = document.getElementById('report-month');
            if (monthSelect) monthSelect.value = currentMonthNum;

            if (cmpY2Select) cmpY2Select.value = currentYear;
            const cfYearSelect = document.getElementById('cashflow-year');
            const cfYearSelect2 = document.getElementById('cashflow-year-2');
            const cfMonthSelect = document.getElementById('cashflow-month');
            const cfMonthSelect2 = document.getElementById('cashflow-month-2');

            if (cfYearSelect) cfYearSelect.value = currentYear;
            if (cfMonthSelect) cfMonthSelect.value = currentMonthNum.toString();

            if (cfYearSelect2) cfYearSelect2.value = years.has(currentYear - 1) ? currentYear - 1 : currentYear;
            if (cfMonthSelect2) cfMonthSelect2.value = currentMonthNum.toString();

            // set y1 to previous year if available
            if (cmpY1Select) {
                cmpY1Select.value = years.has(currentYear - 1) ? currentYear - 1 : currentYear;
            }

            // Set Dashboard Baseline (Report Prev) defaults to same period last year
            const reportYearPrev = document.getElementById('report-year-prev');
            const reportMonthPrev = document.getElementById('report-month-prev');
            if (reportYearPrev) {
                reportYearPrev.value = years.has(currentYear - 1) ? currentYear - 1 : currentYear;
            }
            if (reportMonthPrev) {
                reportMonthPrev.value = currentMonthNum;
            }
        }
    }

    // 5. Dashboard & Reports Logic
    function updateDashboard() {
        const yearSelect = document.getElementById('report-year');
        const monthSelect = document.getElementById('report-month');
        const filterSelect = document.getElementById('report-filter');
        const rangeSelect = document.getElementById('report-range');

        if (!yearSelect.options.length) populateYears();

        const selectedYear = parseInt(yearSelect.value) || new Date().getFullYear();
        const selectedMonth = parseInt(monthSelect.value) || (new Date().getMonth() + 1);
        const reportType = filterSelect ? filterSelect.value : "Chung";
        const rangeVal = rangeSelect ? rangeSelect.value : 'month';
        const isMonthlyRange = rangeVal === 'month';
        const isQuarterRange = rangeVal.startsWith('q');

        // Baseline determination (default is same period last year)
        let baselineYear = selectedYear - 1;
        let baselineMonth = selectedMonth;
        let baselineQuarter = isQuarterRange ? rangeVal : null;

        const customCmpBox = document.getElementById('unified-cmp-controls');
        if (customCmpBox && customCmpBox.style.display !== 'none') {
            const yPrev = document.getElementById('report-year-prev');
            const mPrev = document.getElementById('report-month-prev');
            const qPrev = document.getElementById('report-quarter-prev');
            if (yPrev) baselineYear = parseInt(yPrev.value);
            if (mPrev && isMonthlyRange) baselineMonth = parseInt(mPrev.value);
            if (qPrev && isQuarterRange) baselineQuarter = qPrev.value;
        }

        let totalQty = 0, totalRevenue = 0, totalExpense = 0;
        let prevQty = 0, prevRevenue = 0, prevExpense = 0;

        const statement = {
            revFarm: 0, revCompany: 0, revVua: 0,
            expensed: 0, phanBon: 0, thuoc: 0, luong: 0, lai: 0, vatTu: 0, muaBong: 0, vanHanh: 0,
            totalRev: 0, totalExp: 0, netProfit: 0
        };

        const yearlyMonthlyData = Array.from({ length: 12 }, () => ({ qty: 0, revenue: 0, expense: 0 }));
        const dailyData = [];

        farmData.forEach(row => {
            const d = row.parsedDate;
            if (!d || isNaN(d.getTime())) return;

            const rowYear = d.getFullYear();
            const rowMonth = d.getMonth() + 1;

            let isCurr = false;
            let isPrev = false;

            if (isQuarterRange) {
                const qTarget = baselineQuarter || rangeVal;
                let inCurrQ = false;
                if (rangeVal === 'q1' && rowMonth >= 1 && rowMonth <= 3) inCurrQ = true;
                if (rangeVal === 'q2' && rowMonth >= 4 && rowMonth <= 6) inCurrQ = true;
                if (rangeVal === 'q3' && rowMonth >= 7 && rowMonth <= 9) inCurrQ = true;
                if (rangeVal === 'q4' && rowMonth >= 10 && rowMonth <= 12) inCurrQ = true;

                let inPrevQ = false;
                if (qTarget === 'q1' && rowMonth >= 1 && rowMonth <= 3) inPrevQ = true;
                if (qTarget === 'q2' && rowMonth >= 4 && rowMonth <= 6) inPrevQ = true;
                if (qTarget === 'q3' && rowMonth >= 7 && rowMonth <= 9) inPrevQ = true;
                if (qTarget === 'q4' && rowMonth >= 10 && rowMonth <= 12) inPrevQ = true;

                if (inCurrQ && rowYear === selectedYear) isCurr = true;
                if (inPrevQ && rowYear === baselineYear) isPrev = true;
            } else if (isMonthlyRange) {
                if (rowYear === selectedYear && rowMonth === selectedMonth) isCurr = true;
                if (rowYear === baselineYear && rowMonth === baselineMonth) isPrev = true;
            } else { // Yearly
                if (rowYear === selectedYear) isCurr = true;
                if (rowYear === baselineYear) isPrev = true;
            }

            if (!isCurr && !isPrev) return;

            const typeDT = (row["Loại DT"] || "").trim();
            const isCompany = typeDT === "Company";
            const isVua = typeDT.toLowerCase().includes("vựa") || typeDT.toLowerCase().includes("vua");
            const isFarm = typeDT === "Farm" || typeDT === "";
            const loaiCP = (row["Loại CP"] || "").trim();

            const rawQty = parseFloat(row["Số lượng"]) || 0;
            const dtBong = parseFloat(row["Doanh Thu Bông"]) || 0;
            const dtKhac = parseFloat(row["Doanh Thu Khác"]) || 0;
            const chiPhi = parseFloat(row["Chi Phí"]) || 0;

            let rev = 0, exp = 0, q = 0;
            const isExpenseCompany = (loaiCP === "Expensed");
            const isExpenseVua = (loaiCP === "Vật Tư KD" || loaiCP === "Vận Chuyển" || loaiCP === "Mua Bông");
            const isExpenseFarm = (!isExpenseCompany && !isExpenseVua);

            if (reportType === "Company") {
                if (isCompany) rev = dtKhac;
                if (isExpenseCompany) exp = chiPhi;
            } else if (reportType === "Vựa") {
                if (isVua) rev = dtKhac;
                if (isExpenseVua) exp = chiPhi;
            } else if (reportType === "Farm") {
                rev = dtBong + (isFarm ? dtKhac : 0);
                q = rawQty;
                if (isExpenseFarm) exp = chiPhi;
            } else {
                q = rawQty; rev = dtBong + dtKhac; exp = chiPhi;
            }

            if (isCurr) {
                totalQty += q; totalRevenue += rev; totalExpense += exp;

                statement.revFarm += dtBong + (isFarm ? dtKhac : 0);
                statement.revCompany += dtBong + (isCompany ? dtKhac : 0);
                if (isVua) statement.revVua += dtKhac;

                if (loaiCP === "Expensed") statement.expensed += chiPhi;
                else if (loaiCP === "Phân") statement.phanBon += chiPhi;
                else if (loaiCP === "Thuốc") statement.thuoc += chiPhi;
                else if (loaiCP === "Công") statement.luong += chiPhi;
                else if (loaiCP === "Lãi") statement.lai += chiPhi;
                else if (loaiCP === "Vật Tư" || loaiCP === "Vật Tư KD") statement.vatTu += chiPhi;
                else if (loaiCP === "Mua Bông") statement.muaBong += chiPhi;
                else if (loaiCP === "Vận Chuyển" || loaiCP === "Chi Phí Khác") statement.vanHanh += chiPhi;
                else if (chiPhi > 0) statement.vanHanh += chiPhi;

                if (!isMonthlyRange && !isQuarterRange) {
                    yearlyMonthlyData[d.getMonth()].qty += q;
                    yearlyMonthlyData[d.getMonth()].revenue += rev;
                    yearlyMonthlyData[d.getMonth()].expense += exp;
                } else if (isMonthlyRange) {
                    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                    if (dailyData.length === 0) {
                        for (let i = 0; i < daysInMonth; i++) dailyData.push({ qty: 0, revFarm: 0, revVua: 0, expense: 0 });
                    }
                    const dayIdx = d.getDate() - 1;
                    if (dayIdx >= 0 && dayIdx < dailyData.length) {
                        dailyData[dayIdx].qty += q;
                        dailyData[dayIdx].revFarm += dtBong;
                        if (isVua) dailyData[dayIdx].revVua += dtKhac;
                        dailyData[dayIdx].expense += exp;
                    }
                }
            } else if (isPrev) {
                prevQty += q; prevRevenue += rev; prevExpense += exp;
            }
        });

        const totalProfit = totalRevenue - totalExpense;
        const prevProfit = prevRevenue - prevExpense;

        document.getElementById('kpi-qty').innerText = totalQty.toLocaleString('vi-VN');
        document.getElementById('kpi-revenue').innerText = formatCurrency(totalRevenue);
        document.getElementById('kpi-expense').innerText = formatCurrency(totalExpense);
        document.getElementById('kpi-profit').innerText = formatCurrency(totalProfit);

        // Update Growth Indicators
        function updateGrowth(id, curr, prev, compYear, unit = '', inverse = false) {
            const el = document.getElementById(id);
            if (!el) return;
            if (!prev || prev === 0) {
                el.innerHTML = `<span class="na">N/A</span>`;
                return;
            }
            const diffPct = ((curr - prev) / prev) * 100;
            const isPositive = diffPct >= 0;
            const colorClass = inverse ? (isPositive ? 'negative' : 'positive') : (isPositive ? 'positive' : 'negative');
            const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';

            // Format comparison value
            let prevFormatted = '';
            if (unit === '₫') {
                const absPrev = Math.abs(prev);
                if (absPrev >= 1000000) {
                    prevFormatted = (prev / 1000000).toFixed(1) + 'tr';
                } else if (absPrev >= 1000) {
                    prevFormatted = (prev / 1000).toFixed(0) + 'k';
                } else {
                    prevFormatted = prev.toString();
                }
            } else {
                prevFormatted = prev.toLocaleString('vi-VN');
            }

            el.className = `growth-badge ${colorClass}`;
            el.innerHTML = `<i class="fa-solid ${icon}"></i> ${Math.abs(diffPct).toFixed(1)}% <span style="font-size: 0.85em; margin-left: 4px; opacity: 0.9;">(${prevFormatted} vs ${compTitle})</span>`;
        }

        const compTitle = isMonthlyRange ? `T${baselineMonth}/${baselineYear}` : (isQuarterRange ? `Quý ${(baselineQuarter || rangeVal).substring(1).toUpperCase()} ${baselineYear}` : `Năm ${baselineYear}`);
        updateGrowth('growth-qty', totalQty, prevQty, compTitle, '');
        updateGrowth('growth-revenue', totalRevenue, prevRevenue, compTitle, '₫');
        updateGrowth('growth-expense', totalExpense, prevExpense, compTitle, '₫', true);
        updateGrowth('growth-profit', totalProfit, prevProfit, compTitle, '₫');

        renderDetailedStatement(statement, totalRevenue, totalExpense, totalProfit);

        if (!isMonthlyRange && !isQuarterRange) {
            const labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            renderYearlyCharts(labels, yearlyMonthlyData, selectedYear);
        } else if (isMonthlyRange) {
            const filteredDays = [];
            dailyData.forEach((d, i) => {
                if (d.qty > 0 || d.revFarm > 0 || d.revVua > 0 || d.expense > 0) {
                    filteredDays.push({ label: `${i + 1}`, data: d });
                }
            });
            renderMonthlyCombinedChart(filteredDays.map(fd => fd.label), filteredDays.map(fd => fd.data), selectedMonth, selectedYear);
        }
    }

    // Cashflow Filter listeners
    const cfMonth = document.getElementById('cashflow-month');
    const cfYear = document.getElementById('cashflow-year');
    const cfMonth2 = document.getElementById('cashflow-month-2');
    const cfYear2 = document.getElementById('cashflow-year-2');
    const cfCompareToggle = document.getElementById('cashflow-compare-toggle');
    const cfComparisonPicker = document.getElementById('cashflow-comparison-picker');

    if (cfMonth) cfMonth.addEventListener('change', updateCashFlowReport);
    if (cfYear) cfYear.addEventListener('change', updateCashFlowReport);
    if (cfMonth2) cfMonth2.addEventListener('change', updateCashFlowReport);
    if (cfYear2) cfYear2.addEventListener('change', updateCashFlowReport);

    if (cfCompareToggle) {
        cfCompareToggle.addEventListener('change', (e) => {
            if (cfComparisonPicker) {
                cfComparisonPicker.style.display = e.target.checked ? 'block' : 'none';
                if (e.target.checked) {
                    // Tự động chọn cùng kỳ năm trước khi gạt nút so sánh
                    const currentYear = new Date().getFullYear();
                    const currentMonthNum = new Date().getMonth() + 1;
                    const prevYear = currentYear - 1;

                    if (cfYear2) {
                        // Kiểm tra xem năm trước có trong danh sách chọn không
                        const hasPrevYear = Array.from(cfYear2.options).some(opt => opt.value == prevYear);
                        if (hasPrevYear) cfYear2.value = prevYear;
                    }
                    if (cfMonth2) cfMonth2.value = currentMonthNum.toString();
                }
            }
            updateCashFlowReport();
        });
    }

    function updateCashFlowReport() {
        const isComparison = cfCompareToggle && cfCompareToggle.checked;

        function getStatement(yearId, monthId) {
            const yearSelect = document.getElementById(yearId);
            const monthSelect = document.getElementById(monthId);
            const selectedYear = parseInt(yearSelect.value) || new Date().getFullYear();
            const selectedMonthStr = monthSelect.value;

            const statement = {
                period: selectedMonthStr === "all" ? `Năm ${selectedYear}` : `Tháng ${selectedMonthStr}/${selectedYear}`,
                revFarm: 0, revCompany: 0, revVua: 0,
                expensed: 0, phanBon: 0, thuoc: 0, luong: 0, lai: 0, vatTu: 0, muaBong: 0, vanHanh: 0,
                totalRev: 0, totalExp: 0, netProfit: 0
            };

            farmData.forEach(row => {
                const d = row.parsedDate;
                if (!d || isNaN(d.getTime())) return;
                const rowYear = d.getFullYear();
                const rowMonth = d.getMonth() + 1;

                if (rowYear !== selectedYear) return;
                if (selectedMonthStr !== "all" && rowMonth !== parseInt(selectedMonthStr)) return;

                const typeDT = (row["Loại DT"] || "").trim();
                const isCompany = typeDT === "Company";
                const isVua = typeDT.toLowerCase().includes("vựa") || typeDT.toLowerCase().includes("vua");
                const isFarm = typeDT === "Farm" || typeDT === "";

                const loaiCP = (row["Loại CP"] || "").trim().toLowerCase();

                const dtBong = parseFloat(row["Doanh Thu Bông"]) || 0;
                const dtKhac = parseFloat(row["Doanh Thu Khác"]) || 0;
                const chiPhi = parseFloat(row["Chi Phí"]) || 0;

                const rowRevenue = (chiPhi > 0 && dtKhac === chiPhi) ? 0 : dtKhac;

                // Doanh thu Farm chuẩn theo yêu cầu: Tổng cột F (Doanh Thu Bông)
                statement.revFarm += dtBong;

                if (isCompany) statement.revCompany += rowRevenue;
                else if (isVua) statement.revVua += rowRevenue;
                else if (isFarm && rowRevenue > 0) {
                    statement.revCompany += rowRevenue;
                }

                statement.totalRev += (dtBong + rowRevenue);
                statement.totalExp += chiPhi;

                if (loaiCP === "expensed") statement.expensed += chiPhi;
                else if (loaiCP === "phân" || loaiCP === "phan") statement.phanBon += chiPhi;
                else if (loaiCP === "thuốc" || loaiCP === "thuoc") statement.thuoc += chiPhi;
                else if (loaiCP === "công" || loaiCP === "cong") statement.luong += chiPhi;
                else if (loaiCP === "lãi" || loaiCP === "lai") statement.lai += chiPhi;
                else if (loaiCP === "vật tư" || loaiCP === "vat tu" || loaiCP === "vật tư kd") statement.vatTu += chiPhi;
                else if (loaiCP === "mua bông") statement.muaBong += chiPhi;
                else {
                    statement.vanHanh += chiPhi;
                }
            });

            statement.netProfit = statement.totalRev - statement.totalExp;
            return statement;
        }

        const s1 = getStatement('cashflow-year', 'cashflow-month');
        const s2 = isComparison ? getStatement('cashflow-year-2', 'cashflow-month-2') : null;

        renderDetailedStatement(s1, s2);
    }

    function renderDetailedStatement(s1, s2 = null) {
        const container = document.getElementById('statement-content');
        if (!container) return;

        const isCmp = s2 !== null;

        function formatVal(val) {
            return formatCurrency(val);
        }

        function getDiffHtml(v1, v2) {
            if (!isCmp) return '';
            const diff = v1 - v2;
            const pct = v2 !== 0 ? ((diff / Math.abs(v2)) * 100).toFixed(1) : (v1 !== 0 ? 100 : 0);
            const cls = diff > 0 ? 'diff-up' : (diff < 0 ? 'diff-down' : '');
            const sign = diff > 0 ? '+' : '';
            return `<div class="comparison-col ${cls}"><span class="diff-tag">(${sign}${pct}%)</span></div>`;
        }

        function renderRow(label, v1, v2, type = "normal") {
            let rowClass = "statement-row";
            if (type === "title") rowClass += " main-title";
            if (type === "indented") rowClass += " indented";
            if (type === "sub-indented") rowClass += " sub-indented";
            if (type === "total") rowClass += " total-line";
            if (type === "net") rowClass += " net-profit";

            return `
                <div class="${rowClass}">
                    <span class="statement-label">${label}</span>
                    <div class="comparison-col statement-value">${formatVal(v1)}</div>
                    ${isCmp ? `<div class="comparison-col statement-value" style="color: var(--text-light); text-transform:none;">${formatVal(v2)}</div>` : ''}
                    ${getDiffHtml(v1, v2)}
                </div>
            `;
        }

        let html = `
            <div class="statement-title-main">Báo Cáo Dòng Tiền Chi Tiết</div>
            <div class="statement-header-row">
                <span class="statement-label">Diễn giải hạng mục</span>
                <div class="comparison-col" style="text-align: right;">${s1.period}</div>
                ${isCmp ? `<div class="comparison-col" style="text-align: right; color: var(--text-light); text-transform:none;">${s2.period}</div>` : ''}
                ${isCmp ? `<div class="comparison-col" style="text-align: right;">% +/-</div>` : ''}
            </div>
        `;

        html += renderRow("Doanh thu Farm", s1.revFarm, isCmp ? s2.revFarm : 0, "title");
        html += renderRow("Doanh thu khác", s1.revCompany + s1.revVua, isCmp ? (s2.revCompany + s2.revVua) : 0, "title");
        html += renderRow("Company", s1.revCompany, isCmp ? s2.revCompany : 0, "indented");
        html += renderRow("Vựa", s1.revVua, isCmp ? s2.revVua : 0, "indented");

        html += renderRow("Tổng Doanh Thu", s1.totalRev, isCmp ? s2.totalRev : 0, "total");

        html += renderRow("Khấu trừ:", 0, 0, "title");
        html += renderRow("Expensed", s1.expensed, isCmp ? s2.expensed : 0, "indented");

        // Group 1: Chi Phí Vựa
        const totalVua1 = s1.vatTu + s1.muaBong;
        const totalVua2 = isCmp ? (s2.vatTu + s2.muaBong) : 0;
        html += renderRow("Chi Phí Vựa", totalVua1, totalVua2, "indented");
        html += renderRow("Vật Tư", s1.vatTu, isCmp ? s2.vatTu : 0, "sub-indented");
        html += renderRow("Mua Bông", s1.muaBong, isCmp ? s2.muaBong : 0, "sub-indented");

        // Group 2: Chi Phí Vận Hành
        const totalOps1 = s1.vanHanh + s1.phanBon + s1.thuoc + s1.luong + s1.lai;
        const totalOps2 = isCmp ? (s2.vanHanh + s2.phanBon + s2.thuoc + s2.luong + s2.lai) : 0;

        html += renderRow("Chi Phí Vận Hành", totalOps1, totalOps2, "indented");
        html += renderRow("Phân bón", s1.phanBon, isCmp ? s2.phanBon : 0, "sub-indented");
        html += renderRow("Thuốc", s1.thuoc, isCmp ? s2.thuoc : 0, "sub-indented");
        html += renderRow("Lương", s1.luong, isCmp ? s2.luong : 0, "sub-indented");
        html += renderRow("Lãi", s1.lai, isCmp ? s2.lai : 0, "sub-indented");
        html += renderRow("Chi phí khác", s1.vanHanh, isCmp ? s2.vanHanh : 0, "sub-indented");

        html += renderRow("Tổng Chi Phí", s1.totalExp, isCmp ? s2.totalExp : 0, "total");
        html += renderRow("Lợi nhuận ròng", s1.netProfit, isCmp ? s2.netProfit : 0, "net");

        container.innerHTML = isCmp ? `<div class="comparison-table-wrapper">${html}</div>` : html;
    }

    function renderYearlyCharts(labels, data, year) {
        const qtyData = data.map(m => m.qty);
        const revData = data.map(m => m.revenue);
        const expData = data.map(m => m.expense);
        const profitData = data.map(m => m.revenue - m.expense);

        const ctxQty = document.getElementById('annualQtyChart').getContext('2d');
        if (annualQtyChartInstance) annualQtyChartInstance.destroy();
        annualQtyChartInstance = new Chart(ctxQty, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: `Sản Lượng (${year})`, data: qtyData, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderRadius: 4 }]
            },
            options: getChartOptions(),
            plugins: [ChartDataLabels]
        });

        const ctxRP = document.getElementById('annualRevProfitChart').getContext('2d');
        if (annualRevProfitChartInstance) annualRevProfitChartInstance.destroy();
        annualRevProfitChartInstance = new Chart(ctxRP, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Doanh Thu', data: revData, backgroundColor: 'rgba(14, 165, 233, 0.7)', borderRadius: 4 },
                    { label: 'Lợi Nhuận', data: profitData, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 4 }
                ]
            },
            options: getChartOptions(),
            plugins: [ChartDataLabels]
        });

        const ctxExp = document.getElementById('annualExpenseChart').getContext('2d');
        if (annualExpenseChartInstance) annualExpenseChartInstance.destroy();
        annualExpenseChartInstance = new Chart(ctxExp, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: `Chi Phí (${year})`, data: expData, backgroundColor: 'rgba(239, 68, 68, 0.7)', borderRadius: 4 }]
            },
            options: getChartOptions(),
            plugins: [ChartDataLabels]
        });
    }

    function renderMonthlyCombinedChart(labels, data, month, year) {
        const revFarmData = data.map(d => d.revFarm);
        const revVuaData = data.map(d => d.revVua);
        const expData = data.map(d => d.expense);
        const qtyData = data.map(d => d.qty);

        const ctx = document.getElementById('monthlyCombinedChart').getContext('2d');
        if (monthlyCombinedChartInstance) monthlyCombinedChartInstance.destroy();

        monthlyCombinedChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'bar', label: 'Doanh Thu Farm', data: revFarmData,
                        backgroundColor: 'rgba(56, 189, 248, 0.85)', yAxisID: 'y',
                        stack: 'revenue'
                    },
                    {
                        type: 'bar', label: 'Doanh Thu Vựa', data: revVuaData,
                        backgroundColor: 'rgba(59, 130, 246, 0.85)', yAxisID: 'y',
                        stack: 'revenue'
                    },
                    {
                        type: 'bar', label: 'Chi Phí', data: expData,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)', yAxisID: 'y',
                        stack: 'expense'
                    },
                    {
                        type: 'line', label: 'Sản Lượng (Bông)', data: qtyData,
                        borderColor: 'rgb(249, 115, 22)', backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        borderWidth: 4, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#fff',
                        pointBorderColor: 'rgb(249, 115, 22)', yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false }
                    },
                    y: {
                        type: 'linear', display: true, position: 'left',
                        stacked: true,
                        title: { display: true, text: 'Doanh Thu (VNĐ)', font: { weight: 'bold' } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y1: {
                        type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Sản lượng Bông', font: { weight: 'bold' } }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'nearest',
                        intersect: true,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1e293b',
                        bodyColor: '#475569',
                        padding: 12,
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        callbacks: {
                            afterBody: (tooltipItems) => {
                                const label = tooltipItems[0].label;
                                // If multiple items exist (mode: index), we take the first one's dataset label as primary
                                // or we can determine which one is truly being hovered if needed.
                                // For now, pass all to getRichTooltipData to filter accordingly.
                                return getRichTooltipData(label, tooltipItems);
                            }
                        }
                    },
                    legend: { position: 'top', labels: { usePointStyle: true, font: { weight: 'bold' } } },
                    title: { display: true, text: `BIỂU ĐỒ DOANH THU & SẢN LƯỢNG - THÁNG ${month}/${year}`, font: { size: 16, weight: 'bold' }, padding: 20 },
                    datalabels: {
                        display: (context) => (window.innerWidth > 768 && context.dataset.data[context.dataIndex] > 0),
                        formatter: (val, context) => {
                            if (context.dataset.type === 'line') return val.toLocaleString('vi-VN');
                            return val.toLocaleString('vi-VN') + ' ₫';
                        },
                        font: { size: 10, weight: 'bold' },
                        color: '#000',
                        backgroundColor: (context) => {
                            if (context.dataset.type === 'line') return 'rgba(255, 193, 7, 0.9)';
                            return 'rgba(255, 255, 255, 0.7)';
                        },
                        padding: 2,
                        borderRadius: 3,
                        anchor: 'end',
                        align: 'top',
                        offset: 4
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    function getRichTooltipData(label, tooltipItems = []) {
        const year = document.getElementById('report-year').value;
        const reportMonth = document.getElementById('report-month').value;
        const range = document.getElementById('report-range').value;
        const filter = document.getElementById('report-filter').value;

        let filtered = [];

        if (range === 'year' || label.startsWith('T')) {
            const mStr = label.replace('T', '').replace('Tháng ', '');
            const m = parseInt(mStr);
            if (!isNaN(m)) {
                filtered = farmData.filter(d => d.parsedDate.getMonth() + 1 === m && d.parsedDate.getFullYear() == year);
            }
        } else {
            const day = parseInt(label);
            if (!isNaN(day)) {
                const month = parseInt(reportMonth);
                filtered = farmData.filter(dObj =>
                    dObj.parsedDate.getDate() === day &&
                    dObj.parsedDate.getMonth() + 1 === month &&
                    dObj.parsedDate.getFullYear() == year
                );
            }
        }

        if (filter !== "Chung" && filtered.length > 0) {
            filtered = filtered.filter(item => {
                const type = (item["Loại DT"] || "").trim().toLowerCase();
                if (filter === "Farm") return type === "farm" || type === "";
                if (filter === "Vựa") return type === "vựa" || type === "vua";
                if (filter === "Company") return type === "company" || type === "hđkd";
                return true;
            });
        }

        if (filtered.length === 0) return [];

        // Check which dataset is being hovered to show specific details
        // In 'nearest' mode with intersect: true, tooltipItems should typically contain the one specific item.
        const hoveredLabels = tooltipItems.map(ti => ti.dataset.label);

        // 1. If hovering over Expenses, show breakdown
        if (hoveredLabels.some(l => l && l.includes("Chi Phí"))) {
            const expenseDetails = filtered.filter(r => (r["Chi Phí"] || 0) > 0);
            if (expenseDetails.length > 0) {
                let lines = [" [CHI PHÍ CHI TIẾT]"];
                expenseDetails.forEach(r => {
                    const cat = (r["Loại CP"] || "Khác").trim();
                    const note = (r["Ghi chú"] || "").trim();
                    lines.push(`• ${cat}: ${formatCurrency(r["Chi Phí"]).replace('₫', '').trim()} ${note ? '- ' + note : ''}`);
                });
                if (lines.length > 1) return lines;
            }
        }

        // 2. If hovering over Doanh Thu Farm, show Buyers/Production details
        if (hoveredLabels.some(l => l && l.includes("Farm"))) {
            const revItems = filtered.filter(r => {
                const type = (r["Loại DT"] || "").trim().toLowerCase();
                const isFarm = type === "farm" || type === "" || (r["Doanh Thu Bông"] || 0) > 0;
                return isFarm && ((r["Doanh Thu Bông"] || 0) > 0 || (r["Doanh Thu Khác"] || 0) > 0);
            });
            if (revItems.length > 0) {
                let lines = [" [CHI TIẾT FARM]"];
                revItems.forEach(r => {
                    const buyer = (r["Người Mua"] || "").trim();
                    const amount = (r["Doanh Thu Bông"] || 0) + (r["Doanh Thu Khác"] || 0);
                    const note = (r["Ghi chú"] || "").trim();
                    lines.push(`• ${buyer || 'Khách lẻ'}: ${formatCurrency(amount).replace('₫', '').trim()} ${note ? '- ' + note : ''}`);
                });
                return lines;
            }
        }

        // 3. If hovering over Doanh Thu Vựa, show Vựa details
        if (hoveredLabels.some(l => l && l.includes("Vựa"))) {
            const revItems = filtered.filter(r => {
                const type = (r["Loại DT"] || "").trim().toLowerCase();
                return (type === "vựa" || type === "vua") && (r["Doanh Thu Khác"] || 0) > 0;
            });
            if (revItems.length > 0) {
                let lines = [" [CHI TIẾT VỰA]"];
                revItems.forEach(r => {
                    const buyer = (r["Người Mua"] || "").trim();
                    const amount = r["Doanh Thu Khác"] || 0;
                    const note = (r["Ghi chú"] || "").trim();
                    lines.push(`• ${buyer || 'Khách lẻ'}: ${formatCurrency(amount).replace('₫', '').trim()} ${note ? '- ' + note : ''}`);
                });
                return lines;
            }
        }

        // 4. Default: General Summary (for total or point)
        const farmRev = filtered.filter(r => (r["Loại DT"] || "").trim() === "" || (r["Loại DT"] || "").toLowerCase() === "farm")
            .reduce((sum, r) => sum + (r["Doanh Thu Bông"] || 0), 0);
        const vuaRev = filtered.filter(r => (r["Loại DT"] || "").toLowerCase().trim() === "vựa" || (r["Loại DT"] || "").toLowerCase().trim() === "vua")
            .reduce((sum, r) => sum + (r["Doanh Thu Khác"] || 0), 0);
        const expTotal = filtered.reduce((sum, r) => sum + (r["Chi Phí"] || 0), 0);

        let sumLines = [];
        if (farmRev > 0) sumLines.push(`🚜 Farm: ${formatCurrency(farmRev).replace('₫', '').trim()}`);
        if (vuaRev > 0) sumLines.push(`🏘️ Vựa: ${formatCurrency(vuaRev).replace('₫', '').trim()}`);
        if (expTotal > 0) sumLines.push(`💸 Chi phí: ${formatCurrency(expTotal).replace('₫', '').trim()}`);

        const buyers = [...new Set(filtered.map(r => r["Người Mua"]).filter(b => b))];
        if (buyers.length > 0) {
            sumLines.push(`👤 Khách: ${buyers.slice(0, 3).join(', ')}${buyers.length > 3 ? '...' : ''}`);
        }

        return sumLines;
    }

    function getChartOptions() {
        return {
            responsive: true, maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: true
            },
            plugins: {
                tooltip: {
                    mode: 'nearest',
                    intersect: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    bodyFont: { size: 12 },
                    titleFont: { size: 14, weight: 'bold' },
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 4,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) label += formatCurrency(context.parsed.y);
                            return label;
                        },
                        afterBody: (tooltipItems) => {
                            const label = tooltipItems[0].label;
                            // For annual charts, we might want different detail level or just the summary.
                            return getRichTooltipData(label, tooltipItems);
                        }
                    }
                },
                datalabels: {
                    display: () => window.innerWidth > 768,
                    anchor: 'end', align: 'top',
                    formatter: val => (val === 0 ? '' : new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(val)),
                    font: { size: 9, weight: 'bold' }
                }
            }
        };
    }

    // --- YOY COMPARISON FUNCTION ---
    function updateComparison() {
        const y1Select = document.getElementById('cmp-year1');
        const y2Select = document.getElementById('cmp-year2');
        const m1Select = document.getElementById('cmp-month1');
        const m2Select = document.getElementById('cmp-month2');
        const pSelect = document.getElementById('cmp-period');

        if (!y1Select || !y1Select.value) return;

        const y1 = parseInt(y1Select.value);
        const y2 = parseInt(y2Select.value);
        const m1 = m1Select ? parseInt(m1Select.value) : 0;
        const m2 = m2Select ? parseInt(m2Select.value) : 0;
        const period = pSelect.value;
        const reportFilter = document.getElementById('report-filter') ? document.getElementById('report-filter').value : "Chung";

        let dataY1 = { qty: 0, rev: 0, exp: 0 };
        let dataY2 = { qty: 0, rev: 0, exp: 0 };

        farmData.forEach(row => {
            const d = row.parsedDate;
            if (!d || isNaN(d.getTime())) return;
            const year = d.getFullYear();
            const month = d.getMonth();

            // Point 1 Matching
            let isP1 = (year === y1);
            if (isP1) {
                if (period === 'month') {
                    if (month !== m1) isP1 = false;
                } else if (period === 'q1' && (month < 0 || month > 2)) isP1 = false;
                else if (period === 'q2' && (month < 3 || month > 5)) isP1 = false;
                else if (period === 'q3' && (month < 6 || month > 8)) isP1 = false;
                else if (period === 'q4' && (month < 9 || month > 11)) isP1 = false;
            }

            // Point 2 Matching
            let isP2 = (year === y2);
            if (isP2) {
                if (period === 'month') {
                    if (month !== m2) isP2 = false;
                } else if (period === 'q1' && (month < 0 || month > 2)) isP2 = false;
                else if (period === 'q2' && (month < 3 || month > 5)) isP2 = false;
                else if (period === 'q3' && (month < 6 || month > 8)) isP2 = false;
                else if (period === 'q4' && (month < 9 || month > 11)) isP2 = false;
            }

            if (!isP1 && !isP2) return;

            // Reuse existing report-specific logic
            const typeDT = (row["Loại DT"] || "").trim();
            const isCompany = typeDT === "Company";
            const isVua = typeDT === "Vựa" || typeDT === "vựa";
            const isFarm = typeDT === "Farm" || typeDT === "";

            const loaiCP = (row["Loại CP"] || "").trim();

            const rawQty = parseFloat(row["Số lượng"]) || 0;
            const dtBong = parseFloat(row["Doanh Thu Bông"]) || 0;
            const dtKhac = parseFloat(row["Doanh Thu Khác"]) || 0;
            const chiPhi = parseFloat(row["Chi Phí"]) || 0;

            let rev = 0, exp = 0, q = 0;

            const isExpenseCompany = (loaiCP === "Expensed");
            const isExpenseVua = (loaiCP === "Vật Tư KD" || loaiCP === "Vận Chuyển" || loaiCP === "Mua Bông");
            const isExpenseFarm = (!isExpenseCompany && !isExpenseVua);

            if (reportFilter === "Company") {
                rev = dtBong + (isCompany ? dtKhac : 0);
                q = rawQty;
                if (isExpenseCompany) exp = chiPhi;
            } else if (reportFilter === "Vựa") {
                if (isVua) rev = dtKhac;
                if (isExpenseVua) exp = chiPhi;
            } else if (reportFilter === "Farm") {
                rev = dtBong + (isFarm ? dtKhac : 0);
                q = rawQty;
                if (isExpenseFarm) exp = chiPhi;
            } else { // "Chung"
                q = rawQty; rev = dtBong + dtKhac; exp = chiPhi;
            }

            if (isP1) { dataY1.qty += q; dataY1.rev += rev; dataY1.exp += exp; }
            if (isP2) { dataY2.qty += q; dataY2.rev += rev; dataY2.exp += exp; }
        });

        // Set UI
        dataY1.profit = dataY1.rev - dataY1.exp;
        dataY2.profit = dataY2.rev - dataY2.exp;

        const formatCompactStr = (num) => new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(num);

        document.getElementById('cmp-qty-y1').innerText = dataY1.qty.toLocaleString('vi-VN');
        document.getElementById('cmp-qty-y2').innerText = dataY2.qty.toLocaleString('vi-VN');
        document.getElementById('cmp-rev-y1').innerText = formatCompactStr(dataY1.rev) + ' ₫';
        document.getElementById('cmp-rev-y2').innerText = formatCompactStr(dataY2.rev) + ' ₫';
        document.getElementById('cmp-exp-y1').innerText = formatCompactStr(dataY1.exp) + ' ₫';
        document.getElementById('cmp-exp-y2').innerText = formatCompactStr(dataY2.exp) + ' ₫';
        document.getElementById('cmp-profit-y1').innerText = formatCompactStr(dataY1.profit) + ' ₫';
        document.getElementById('cmp-profit-y2').innerText = formatCompactStr(dataY2.profit) + ' ₫';

        const renderPct = (id, v1, v2, inverse = false) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (v1 === 0 && v2 === 0) {
                el.innerHTML = `<span style="display:inline-block; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: var(--text-light); background-color: rgba(0,0,0,0.05); font-size: 0.9rem;">-</span>`;
                return;
            }
            if (v1 === 0 && v2 !== 0) {
                el.innerHTML = `<span style="display:inline-block; padding: 3px 8px; border-radius: 6px; font-weight: 600; color: var(--text-light); background-color: rgba(0,0,0,0.05); font-size: 0.9rem;">N/A</span>`;
                return;
            }

            const pct = ((v2 - v1) / Math.abs(v1)) * 100;
            const sign = pct >= 0 ? '+' : '';
            const isGood = pct > 0 ? !inverse : (pct < 0 ? inverse : true);
            const color = isGood ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)';
            const bgColor = isGood ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

            el.innerHTML = `<span style="display:inline-block; padding: 3px 8px; border-radius: 6px; font-weight: bold; color: ${color}; background-color: ${bgColor}; font-size: 0.95rem;">${sign}${pct.toFixed(1)}%</span>`;
        };

        renderPct('cmp-qty-pct', dataY1.qty, dataY2.qty);
        renderPct('cmp-rev-pct', dataY1.rev, dataY2.rev);
        renderPct('cmp-exp-pct', dataY1.exp, dataY2.exp, true); // lower is better
        renderPct('cmp-profit-pct', dataY1.profit, dataY2.profit);
    }

    // Attach Event Listeners for Report Controls
    document.getElementById('report-year').addEventListener('change', updateDashboard);
    if (document.getElementById('report-filter')) {
        document.getElementById('report-filter').addEventListener('change', updateDashboard);
    }
    if (document.getElementById('report-month')) {
        document.getElementById('report-month').addEventListener('change', updateDashboard);
    }
    if (document.getElementById('report-range')) {
        document.getElementById('report-range').addEventListener('change', () => {
            const range = document.getElementById('report-range').value;
            const cmpMonth = document.getElementById('report-month-prev');
            const cmpQuarter = document.getElementById('report-quarter-prev');

            if (cmpMonth) cmpMonth.style.display = (range === 'month') ? 'inline-block' : 'none';
            if (cmpQuarter) cmpQuarter.style.display = (range.startsWith('q')) ? 'inline-block' : 'none';
            updateDashboard();
        });
    }
    if (document.getElementById('cmp-period')) {
        document.getElementById('cmp-period').addEventListener('change', updateComparison);
        document.getElementById('cmp-year1').addEventListener('change', updateComparison);
        document.getElementById('cmp-year2').addEventListener('change', updateComparison);
    }

    // Call populate once to set options on load
    populateYears();


    // Update Filter And Render logic to include dashboard update
    function applyFiltersAndRender() {
        let filtered = [...farmData];

        // Luôn sắp xếp theo Ngày giảm dần, cùng ngày thì đơn mới nhất (số dòng lớn hơn) lên đầu
        filtered.sort((a, b) => {
            const dateDiff = (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0);
            if (dateDiff !== 0) return dateDiff;
            return (b._sheetRowNumber || 0) - (a._sheetRowNumber || 0); // tie-breaker: đơn mới nhất trên cùng
        });

        // Tab Filter
        let sliceLimit = 20; // Giới hạn 20 hàng gần nhất cho tab "Tất Cả" theo yêu cầu
        if (currentTableTab === 'today') {
            const todayStr = formatDateInput(new Date());
            filtered = filtered.filter(item => {
                const dateStr = formatDateInput(item.parsedDate);
                const type = (item["Loại DT"] || "").trim().toLowerCase();
                const isFarmOrVua = type === "farm" || type === "" || type === "vựa" || type === "vua";
                return dateStr === todayStr && isFarmOrVua;
            });
            sliceLimit = 500; // Hiển thị hết đơn hôm nay
        } else if (currentTableTab === 'farm') {
            filtered = filtered.filter(item => {
                const type = (item["Loại DT"] || "").trim().toLowerCase();
                const isVua = type.includes("vựa") || type.includes("vua");
                const isCmp = type.includes("company") || type.includes("hđkd");

                // Nếu là Vựa hoặc Company thì ẩn khỏi tab Farm
                if (isVua || isCmp) return false;

                // Nếu ròng chi phí (không có doanh thu bông và không có người mua) thì ẩn
                const dtBong = parseFloat(String(item["Doanh Thu Bông"] || "0").replace(/[^\d]/g, '')) || 0;
                const note = (item["Ghi Chú Chi Phí"] || item["Ghi Chú"] || "").toLowerCase();
                if (dtBong === 0 && (note.includes("chi phí") || note.includes("tiền lãi"))) {
                    // Có thể là chi phí ròng
                }

                return true;
            });
            sliceLimit = 15;
        } else if (currentTableTab === 'vua') {
            filtered = filtered.filter(item => {
                const type = (item["Loại DT"] || "").trim().toLowerCase();
                return type === "vựa" || type === "vua";
            });
            sliceLimit = 15;
        } else if (currentTableTab === 'expense') {
            filtered = filtered.filter(item => {
                const cpVal = parseFloat(String(item["Chi Phí"] || "0").replace(/[^\d]/g, '')) || 0;
                return cpVal > 0 || (item["Loại CP"] && item["Loại CP"].trim() !== "");
            });
            sliceLimit = 15;
        }

        // Search Filter
        const searchTerm = searchBuyerInput.value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(item =>
                (item["Người Mua"] || "").toLowerCase().includes(searchTerm) ||
                (item["Ghi Chú"] || "").toLowerCase().includes(searchTerm) ||
                (item["Loại CP"] || "").toLowerCase().includes(searchTerm) ||
                (item["Ngày"] || "").toLowerCase().includes(searchTerm)
            );
        }
        // Status Filter
        const statusTerm = filterStatusSelect.value;
        if (statusTerm !== "all") {
            filtered = filtered.filter(item => item["Status"] === statusTerm);
        }
        // Manual Sorting (overrides default if active)
        if (sortState.column) {
            filtered.sort((a, b) => {
                let valA = a[sortState.column];
                let valB = b[sortState.column];
                if (sortState.column === 'Ngày') {
                    valA = a.parsedDate?.getTime() || 0;
                    valB = b.parsedDate?.getTime() || 0;
                }
                if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
                // Tie-breaker: cùng giá trị thì đơn mới nhất (số dòng lớn hơn) lên trên
                return (b._sheetRowNumber || 0) - (a._sheetRowNumber || 0);
            });
        }

        const baseLimits = { all: 20, farm: 15, vua: 15, expense: 15 };
        const baseLimit = baseLimits[currentTableTab] || 20;
        const limit = Math.max(currentLimit, baseLimit);

        // Update filter count badges
        const countRow = document.getElementById('filter-count-row');
        if (countRow) {
            const total = filtered.length;
            const done = filtered.filter(r => r["Status"] === "Xong").length;
            const pending = total - done;
            const currentStatus = document.getElementById('filter-status')?.value ?? 'all';
            countRow.innerHTML = [
                { label: `Tất cả (${total})`, val: 'all', cls: '' },
                { label: `✅ Xong (${done})`, val: 'Xong', cls: 'badge-done' },
                { label: `⏳ Chưa thu (${pending})`, val: 'Chưa Xong', cls: 'badge-pending' }
            ].map(b => `<span class="filter-count-badge ${b.cls} ${currentStatus === b.val ? 'active' : ''}" data-status="${b.val}">${b.label}</span>`).join('');
            countRow.querySelectorAll('.filter-count-badge').forEach(badge => {
                badge.addEventListener('click', () => {
                    const fs = document.getElementById('filter-status');
                    if (fs) { fs.value = badge.dataset.status; fs.dispatchEvent(new Event('change')); }
                });
            });
        }

        const paginatedData = filtered.slice(0, limit);
        renderTable(paginatedData);

        // Load More button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            if (filtered.length > limit) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.textContent = `⬇ Xem thêm (còn ${filtered.length - limit} dòng)`;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    // --- SKELETON LOADING HELPERS ---
    function showTableSkeleton() {
        const tableBody = document.getElementById('transaction-tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="11">
                    <div class="skeleton" style="height: 45px; width: 100%; opacity: 0.6; margin: 4px 0;"></div>
                </td>
            `;
            tableBody.appendChild(tr);
        }
    }

    function showKPISkeleton() {
        const kpiIds = ['kpi-qty', 'kpi-revenue', 'kpi-expense', 'kpi-profit'];
        kpiIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<div class="skeleton" style="height: 28px; width: 120px; display: inline-block;"></div>`;
        });
        // Also secondary parts of KPIs for comparison
        document.querySelectorAll('.growth-badge').forEach(el => {
            el.innerHTML = `<div class="skeleton" style="height: 16px; width: 60px;"></div>`;
        });
    }

    function showCashflowSkeleton() {
        const container = document.getElementById('statement-content');
        if (!container) return;
        container.innerHTML = `
            <div style="padding: 2rem;">
                <div class="skeleton" style="height: 40px; width: 40%; margin-bottom: 2rem;"></div>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="skeleton" style="height: 25px; width: 100%;"></div>
                    <div class="skeleton" style="height: 25px; width: 90%;"></div>
                    <div class="skeleton" style="height: 25px; width: 100%;"></div>
                    <div class="skeleton" style="height: 25px; width: 85%;"></div>
                </div>
            </div>
        `;
    }

    // --- DATA PROCESSING & CACHING HELPERS ---
    const CACHE_KEY = 'farm_management_data';

    function processRawSheetData(rawData) {
        return rawData.map((item, idx) => {
            let rowDate = new Date();
            if (item["Ngày"]) {
                if (!isNaN(item["Ngày"])) {
                    rowDate = excelToJsDate(parseFloat(item["Ngày"]));
                } else {
                    const parts = item["Ngày"].split(/[-/]/);
                    if (parts.length === 3) {
                        rowDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    } else {
                        rowDate = new Date(item["Ngày"]);
                    }
                }
            }

            const parseSheetNum = (val) => {
                if (!val) return 0;
                let s = String(val).replace(/\./g, '').replace(/,/g, '');
                let n = parseFloat(s);
                return isNaN(n) ? 0 : n;
            };

            return {
                ...item,
                parsedDate: rowDate,
                // Preserve _sheetRowNumber if already set (from gviz), else compute from idx
                _sheetRowNumber: item._sheetRowNumber || (idx + 2),
                "Status": (item["Status"] || "").trim(),
                "Số lượng": parseSheetNum(item["Số lượng"]),
                "Giá": parseSheetNum(item["Giá"]),
                "Doanh Thu Bông": parseSheetNum(item["Doanh Thu Bông"]),
                "Chi Phí": parseSheetNum(item["Chi Phí"]),
                "Tiền Phải Thu": parseSheetNum(item["Tiền Phải Thu"]),
                "Doanh Thu Khác": parseSheetNum(item["Doanh Thu Khác"]),
                "Đã Thu": parseSheetNum(item["Đã Thu"])
            };
        });
    }

    function saveToCache(rawData) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: rawData
            }));
        } catch (e) { console.warn("Caching failed:", e); }
    }

    function loadFromCache() {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return false;
        try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.data)) {
                farmData = processRawSheetData(parsed.data);
                applyFiltersAndRender();
                populateYears();
                if (document.getElementById('view-report').style.display === 'block') updateDashboard();
                if (document.getElementById('view-cashflow').style.display === 'block') updateCashFlowReport();
                return true;
            }
        } catch (e) { console.error("Cache error:", e); }
        return false;
    }

    // 6. Google Sheets Sync Logic
    async function syncData() {
        const syncBtn = document.getElementById('sync-gsheet-btn');
        if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';

        showTableSkeleton();
        showKPISkeleton();
        showCashflowSkeleton();

        const sheetId = '1eOTLVBUOJg9ppOu4tkLUXbzfrOHAGK0bEPSwTbl7v4U';

        // Define global callback for JSONP
        window.handleGvizResponse = function (data) {
            const scriptNode = document.getElementById('gsheet-script');
            if (scriptNode) scriptNode.remove();

            if (data.status === 'error') {
                alert("Lỗi từ Google Sheets: " + data.errors[0].detailed_message);
                if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-sync"></i> Đồng bộ dữ liệu mới';
                return;
            }

            const cols = data.table.cols.map(c => c ? c.label : '');
            const parsedData = data.table.rows.map((row, rowIdx) => {
                const item = {};
                cols.forEach((col, index) => {
                    if (!col) return;
                    const cell = row.c[index];
                    let val = "";
                    if (cell !== null && cell !== undefined) {
                        val = cell.f !== undefined ? cell.f : (cell.v !== null ? cell.v : "");
                    }
                    item[col] = String(val);
                });
                item._sheetRowNumber = rowIdx + 2; // row 1 = header, data starts at row 2
                return item;
            });

            // Cache then Map parsedData
            saveToCache(parsedData);
            farmData = processRawSheetData(parsedData);

            applyFiltersAndRender();
            populateYears();
            if (document.getElementById('view-report').style.display === 'block') {
                updateDashboard();
            }
            if (document.getElementById('view-cashflow').style.display === 'block') {
                updateCashFlowReport();
            }
            if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-sync"></i> Đồng bộ dữ liệu mới';
        };

        // Create script tag for JSONP
        const script = document.createElement('script');
        script.id = 'gsheet-script';
        script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:handleGvizResponse&sheet=Farm`;

        // Handle network errors for script loading
        script.onerror = function () {
            alert("Không thể kết nối đến Google Sheets. Hãy kiểm tra kết nối mạng của bạn.");
            if (syncBtn) syncBtn.innerHTML = '<i class="fa-solid fa-sync"></i> Đồng bộ dữ liệu mới';
            script.remove();
        };

        document.body.appendChild(script);
    }
    // Make it available globally for inline calls if needed
    window.syncData = syncData;

    const syncBtnGlobal = document.getElementById('sync-gsheet-btn');
    if (syncBtnGlobal) {
        syncBtnGlobal.addEventListener('click', () => {
            syncData();
        });
    }

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'expense-item';
            row.innerHTML = `
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Hạng mục</label>
                    <select class="exp-type" style="border-color: #f87171;">
                        <option value="Chi Phí Khác">Chi Phí Khác</option>
                        <option value="Thuốc">Thuốc</option>
                        <option value="Phân">Phân</option>
                        <option value="Lãi">Lãi</option>
                        <option value="Công">Công</option>
                        <option value="Mua Bông">Mua Bông</option>
                        <option value="Vật Tư KD">Vật Tư KD</option>
                        <option value="Vận Chuyển">Vận Chuyển</option>
                        <option value="Expensed">Expensed</option>
                    </select>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Số tiền</label>
                    <input type="text" placeholder="0" class="exp-amount money-input" style="border-color: #f87171; color: #b91c1c; font-weight: bold;">
                </div>
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Ghi chú chi tiết</label>
                    <input type="text" placeholder="Nhập ghi chú..." class="exp-note" style="border-color: #f87171;">
                </div>
                <button type="button" class="del-expense-btn" title="Xoá"><i class="fa-solid fa-trash-can"></i></button>
            `;
            expenseItemsContainer.appendChild(row);
            attachExpenseRowEvents(row);
        });
    }

    function attachExpenseRowEvents(row) {
        const delBtn = row.querySelector('.del-expense-btn');
        if (delBtn) {
            delBtn.addEventListener('click', () => {
                const rows = expenseItemsContainer.querySelectorAll('.expense-item');
                if (rows.length > 1) {
                    row.remove();
                } else {
                    alert("Phải có ít nhất một dòng chi phí.");
                }
            });
        }
    }

    // Initialize events for first row
    if (expenseItemsContainer) {
        expenseItemsContainer.querySelectorAll('.expense-item').forEach(attachExpenseRowEvents);
    }

    // Tabs Logic
    const tabBtns = document.querySelectorAll('.table-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // update tab state
            currentTableTab = btn.dataset.tab;

            // clear search and checkbox implicitly via render
            document.getElementById('select-all-checkbox').checked = false;
            applyFiltersAndRender();
        });
    });

    // Checkbox & Bulk Delete Logic
    const selectAllCb = document.getElementById('select-all-checkbox');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const bulkDeleteCount = document.getElementById('bulk-delete-count');

    window.updateBulkDeleteUI = function () {
        const checkedBoxes = tableBody.querySelectorAll('.row-checkbox:checked');
        const count = checkedBoxes.length;
        if (count > 0) {
            bulkDeleteBtn.style.display = 'block';
            if (bulkDeleteCount) bulkDeleteCount.innerText = count;
        } else {
            bulkDeleteBtn.style.display = 'none';
        }

        const allBoxes = tableBody.querySelectorAll('.row-checkbox:not(:disabled)');
        if (allBoxes.length > 0) {
            selectAllCb.checked = count === allBoxes.length;
        } else {
            selectAllCb.checked = false;
        }
    }

    if (selectAllCb) {
        selectAllCb.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            tableBody.querySelectorAll('.row-checkbox:not(:disabled)').forEach(cb => {
                cb.checked = isChecked;
            });
            updateBulkDeleteUI();
        });
    }

    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
            updateBulkDeleteUI();
        }
    });

    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', async () => {
            const checkedBoxes = tableBody.querySelectorAll('.row-checkbox:checked');
            if (checkedBoxes.length === 0) return;

            if (!confirm(`Bạn có chắc chắn muốn xoá ${checkedBoxes.length} dòng dữ liệu này khỏi Google Sheets?`)) return;

            if (CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
                alert("Vui lòng cấu hình WEB_APP_URL trong app.js!");
                return;
            }

            document.body.style.cursor = 'wait';
            bulkDeleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang Xoá...';
            bulkDeleteBtn.disabled = true;

            let successCount = 0;
            const rowsToDelete = Array.from(checkedBoxes).map(cb => {
                const idx = parseInt(cb.getAttribute('data-row-index'));
                return dataToRenderRef[idx];
            }).filter(Boolean);

            try {
                // Sắp xếp giảm dần theo row number — xóa từ dưới lên để tránh dịch chuyển index
                rowsToDelete.sort((a, b) => (b._sheetRowNumber || 0) - (a._sheetRowNumber || 0));

                for (let i = 0; i < rowsToDelete.length; i++) {
                    const rowData = rowsToDelete[i];
                    const sheetRow = rowData._sheetRowNumber;
                    if (!sheetRow) continue;

                    bulkDeleteBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang Xoá (${i + 1}/${rowsToDelete.length})...`;

                    const response = await fetch(CONFIG.WEB_APP_URL, {
                        method: "POST",
                        body: JSON.stringify({ action: "deleteByRow", rowNumber: sheetRow, token: getToken() }),
                        headers: { "Content-Type": "text/plain;charset=utf-8" }
                    });
                    const result = await response.json();
                    if (result.status === "success") {
                        successCount++;
                        // Adjust _sheetRowNumber for rows below this one
                        farmData.forEach(r => { if (r._sheetRowNumber > sheetRow) r._sheetRowNumber--; });
                        const fidx = farmData.indexOf(rowData);
                        if (fidx >= 0) farmData.splice(fidx, 1);
                    }
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                showToast(`Đã xoá thành công ${successCount}/${rowsToDelete.length} đơn dữ liệu.`, "success");
                const syncBtn = document.getElementById('sync-gsheet-btn');
                if (syncBtn) syncBtn.click();
            } catch (err) {
                console.error(err);
                alert("Lỗi kết nối khi xoá hàng loạt.");
            } finally {
                document.body.style.cursor = 'default';
                bulkDeleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Xoá Các Dòng Đã Chọn (<span id="bulk-delete-count">0</span>)';
                bulkDeleteBtn.disabled = false;
                selectAllCb.checked = false;

                // Sync lại dữ liệu để đảm bảo khớp hoàn toàn với Sheet
                const syncBtn = document.getElementById('sync-gsheet-btn');
                if (syncBtn) {
                    syncBtn.click();
                } else {
                    applyFiltersAndRender();
                }
            }
        });
    }

    searchBuyerInput.addEventListener('input', applyFiltersAndRender);
    filterStatusSelect.addEventListener('change', applyFiltersAndRender);

    headers.forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (sortState.column === column) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.column = column;
                sortState.direction = 'asc';
            }
            applyFiltersAndRender();
        });
    });

    // 5. Data Entry Logic (Auto-calc & Submit)
    // Farm entry no longer has static calculateRevenue because multiple items are supported.

    // Initial Date for Form Setup (Set to Today)
    document.getElementById('date-input').value = formatDateInput(new Date());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isAuthorizedForEntry()) {
            alert("Bạn không có quyền nhập liệu!");
            return;
        }

        if (!confirm("Bạn có chắc chắn muốn lưu các dòng dữ liệu này?")) {
            return;
        }

        const entryMode = entryTypeSelect ? entryTypeSelect.value : 'farm';
        // Shared fields
        const dInput = new Date(document.getElementById('date-input').value);
        const dateStr = formatDateVietnamese(dInput); // Dùng định dạng chuẩn DD/MM/YYYY để khớp với Sheet
        const statusVal = document.getElementById('status-input').value; // Removed default "Chưa Xong"
        const buyerVal = document.getElementById('buyer-input').value;
        const noteVal = ""; // Ghi Chú Cuốc Xe đã bị loại bỏ

        const submitBtn = form.querySelector('button[type="submit"]');

        let payloadRowsStr = [];
        let payloadRowsParsed = [];

        if (entryMode === 'farm') {
            const items = flowerItemsContainer.querySelectorAll('.flower-item');

            if (items.length === 0) {
                alert("Vui lòng thêm ít nhất 1 dòng bông!");
                return;
            }

            items.forEach((item, index) => {
                const typeStr = item.querySelector('.fw-type').value || "Bông";
                const qValue = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const pValue = parseMoney(item.querySelector('.fw-price').value);
                const dtBong = qValue * pValue;

                payloadRowsStr.push({
                    "Ngày": dateStr,
                    "Status": statusVal,
                    "Người Mua": buyerVal,
                    "Số lượng": qValue.toString(),
                    "Giá": pValue.toString(),
                    "Doanh Thu Bông": dtBong.toString(),
                    "Phân Loại Bông": typeStr,
                    "Ghi Chú": noteVal,
                    "Đã Thu": "", "Tiền Phải Thu": "", "Ghi Chú Vựa thu": "", "Doanh Thu Khác": "",
                    "Loại DT": "Farm", "Chi Phí": "", "Loại CP": "", "Ghi Chú Chi Phí": ""
                });

                payloadRowsParsed.push({
                    "Ngày": dateStr, "Status": statusVal, "Người Mua": buyerVal, "Phân Loại Bông": typeStr, "Ghi Chú": noteVal,
                    parsedDate: dInput, "Số lượng": qValue, "Giá": pValue, "Doanh Thu Bông": dtBong, "Chi Phí": 0, "Tiền Phải Thu": 0, "Doanh Thu Khác": 0, "Loại DT": "Farm"
                });
            });
        } else if (entryMode === 'vua') {
            // Vựa Mode
            const shipCost = parseMoney(vuaShipCostInput.value);
            const vattuCost = parseMoney(vuaVattuCostInput.value);
            const packingCost = parseMoney(document.getElementById('vua-packing-cost') ? document.getElementById('vua-packing-cost').value : "0");
            const totalCollect = parseMoney(vuaTotalCollectInput.value);
            const items = flowerItemsContainer.querySelectorAll('.flower-item');

            let sumCost = 0;
            items.forEach((item) => {
                const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const p = parseMoney(item.querySelector('.fw-price').value);
                sumCost += (q * p);
            });
            const expectedRevenue = packingCost; // User wants Profit recorded as Revenue

            items.forEach((item, index) => {
                const typeStr = item.querySelector('.fw-type').value || "Bông";
                const qValue = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const pValue = parseMoney(item.querySelector('.fw-price').value);
                const dtBong = qValue * pValue;

                const tPhaiThuStr = index === 0 ? totalCollect.toString() : "";
                const dtKhacStr = index === 0 ? expectedRevenue.toString() : "";

                let chiPhiStr = "";
                let loaiCPStr = "";

                if (index === 0 && shipCost > 0) {
                    chiPhiStr = shipCost.toString();
                    loaiCPStr = "Vận Chuyển";
                }

                payloadRowsStr.push({
                    "Ngày": dateStr, "Status": statusVal, "Người Mua": buyerVal, "Số lượng": qValue.toString(), "Giá": pValue.toString(), "Doanh Thu Bông": dtBong.toString(), "Phân Loại Bông": typeStr, "Ghi Chú": noteVal,
                    "Đã Thu": "", "Tiền Phải Thu": tPhaiThuStr, "Ghi Chú Vựa thu": "", "Doanh Thu Khác": dtKhacStr, "Loại DT": "Vựa", "Chi Phí": chiPhiStr, "Loại CP": loaiCPStr, "Ghi Chú Chi Phí": ""
                });

                payloadRowsParsed.push({
                    "Ngày": dateStr, "Status": statusVal, "Người Mua": buyerVal, "Phân Loại Bông": typeStr, "Ghi Chú": noteVal, "Loại DT": "Vựa", "Loại CP": loaiCPStr,
                    parsedDate: dInput, "Số lượng": qValue, "Giá": pValue, "Doanh Thu Bông": dtBong, "Tiền Phải Thu": index === 0 ? totalCollect : 0, "Chi Phí": index === 0 ? shipCost : 0, "Doanh Thu Khác": index === 0 ? expectedRevenue : 0
                });
            });
        } else if (entryMode === 'expense') {
            const expItems = expenseItemsContainer.querySelectorAll('.expense-item');

            expItems.forEach(item => {
                const expType = item.querySelector('.exp-type').value;
                const expAmount = parseMoney(item.querySelector('.exp-amount').value);
                const expNote = item.querySelector('.exp-note').value;

                if (expAmount > 0) {
                    payloadRowsStr.push({
                        "action": "add_expense",
                        "data": {
                            "Ngày": dateStr,
                            "Status": "Xong",
                            "Người Mua": buyerVal,
                            "Chi Phí": expAmount.toString(),
                            "Loại CP": expType,
                            "Ghi Chú Chi Phí": expNote
                        }
                    });

                    payloadRowsParsed.push({
                        "Ngày": dateStr, "Status": "Xong", "Người Mua": buyerVal, "Chi Phí": expAmount, "Loại CP": expType, "Ghi Chú Chi Phí": expNote,
                        parsedDate: dInput, "Số lượng": 0, "Giá": 0, "Doanh Thu Bông": 0, "Tiền Phải Thu": 0, "Doanh Thu Khác": 0
                    });
                }
            });
        }

        // Final check for Vua/Farm mode to add action if missing
        if (entryMode !== 'expense') {
            payloadRowsStr = payloadRowsStr.map(row => ({
                "action": "add",
                "data": row
            }));
        }

        if (CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
            alert("Vui lòng cấu hình WEB_APP_URL! Dữ liệu hiện tại chỉ lưu tạm.");
            payloadRowsParsed.forEach(p => farmData.unshift(p));
            applyFiltersAndRender();
            return;
        }

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
        submitBtn.disabled = true;

        try {
            // IF EDIT MODE: Delete old row first
            if (currentEditRowData) {
                const sheetRow = currentEditRowData._sheetRowNumber;
                if (sheetRow) {
                    const delResp = await fetch(CONFIG.WEB_APP_URL, {
                        method: "POST",
                        body: JSON.stringify({ action: "deleteByRow", rowNumber: sheetRow, token: getToken() }),
                        headers: { "Content-Type": "text/plain;charset=utf-8" }
                    });
                    const delRes = await delResp.json();
                    if (delRes.status !== "success") {
                        throw new Error("Lỗi khi xóa dòng cũ: " + delRes.message);
                    }
                }
            }

            for (let i = 0; i < payloadRowsStr.length; i++) {
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ ...payloadRowsStr[i], token: getToken() }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status !== "success") throw new Error(result.message || "Lỗi cập nhật G-Sheet.");
            }

            showToast("Lưu dữ liệu thành công!", "success");
            currentEditRowData = null; // Clear edit mode
            const cancelBtn = document.getElementById('cancel-edit-btn');
            if (cancelBtn) cancelBtn.remove();

            submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Lưu Dữ Liệu';
            submitBtn.style.backgroundColor = '';

            // Re-fetch everything to ensure proper sync if possible
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) {
                syncBtn.click();
            } else {
                payloadRowsParsed.forEach(p => farmData.unshift(p));
                applyFiltersAndRender();
                populateYears();
                if (document.getElementById('view-report').style.display === 'block') updateDashboard();
            }

            form.reset();
            document.getElementById('date-input').value = formatDateInput(new Date());


            // Trigger mode toggle to restore UI state (label, required fields, visibility)
            if (entryTypeSelect) {
                entryTypeSelect.dispatchEvent(new Event('change'));
            }

            // Khôi phục lại một dòng chuẩn cho Bông
            if (flowerItemsContainer) {
                flowerItemsContainer.innerHTML = `
                    <div class="flower-item">
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Loại mặt hàng</label>
                            <select class="fw-type" required>
                                <option value="Xô ngoại">Xô ngoại</option>
                                <option value="Xô nội">Xô nội</option>
                                <option value="Ecuador">Ecuador</option>
                                <option value="Pháp">Pháp</option>
                                <option value="Trắng ù">Trắng ù</option>
                                <option value="Ô Hồng">Ô Hồng</option>
                                <option value="Ô Trắng">Ô Trắng</option>
                                <option value="Simmo">Simmo</option>
                                <option value="Cam Cháy">Cam Cháy</option>
                                <option value="Vitto">Vitto</option>
                                <option value="Lạc Thần">Lạc Thần</option>
                                <option value="Hỷ Trứng">Hỷ Trứng</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">SL</label>
                            <input type="number" placeholder="0" class="fw-qty" min="0" required>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Đơn Giá</label>
                            <input type="text" placeholder="0" class="fw-price money-input" required>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Thành tiền</label>
                            <input type="text" placeholder="0" class="fw-total" readonly style="background: #f1f5f9; color: #0f172a; font-weight: 800; border: 1.5px solid #cbd5e1 !important;">
                        </div>
                        <button type="button" class="del-flower-btn" title="Xoá"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                `;
                attachFlowerRowEvents(flowerItemsContainer.querySelector('.flower-item'));
            }

            if (entryTypeSelect && entryTypeSelect.value === 'vua') calculateVuaTotals();

            // Khôi phục lại một dòng chuẩn cho Chi phí
            if (expenseItemsContainer) {
                expenseItemsContainer.innerHTML = `
                    <div class="expense-item">
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Hạng mục</label>
                            <select class="exp-type" style="border-color: #f87171;">
                                <option value="Chi Phí Khác">Chi Phí Khác</option>
                                <option value="Thuốc">Thuốc</option>
                                <option value="Phân">Phân</option>
                                <option value="Lãi">Lãi</option>
                                <option value="Công">Công</option>
                                <option value="Mua Bông">Mua Bông</option>
                                <option value="Vật Tư KD">Vật Tư KD</option>
                                <option value="Vận Chuyển">Vận Chuyển</option>
                                <option value="Expensed">Expensed</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Số tiền</label>
                            <input type="text" placeholder="0" class="exp-amount money-input" style="border-color: #f87171; color: #b91c1c; font-weight: bold;">
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.7rem; color: #64748b; font-weight: 700;">Ghi chú chi tiết</label>
                            <input type="text" placeholder="Nhập ghi chú..." class="exp-note" style="border-color: #f87171;">
                        </div>
                        <button type="button" class="del-expense-btn" title="Xoá"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                `;
                attachExpenseRowEvents(expenseItemsContainer.querySelector('.expense-item'));
            }

            showToast(`✅ Đã lưu thành công ${payloadRowsStr.length} dòng dữ liệu!`, 'success');

        } catch (error) {
            console.error(error);
            alert("Lỗi khi ghi dữ liệu lên Sheets: " + error.message);
        } finally {
            submitBtn.innerHTML = 'Lưu Dữ Liệu';
            submitBtn.disabled = false;
        }
    });

    // Load More
    const loadMoreBtnEl = document.getElementById('load-more-btn');
    if (loadMoreBtnEl) {
        loadMoreBtnEl.addEventListener('click', () => {
            currentLimit += 20;
            applyFiltersAndRender();
        });
    }
    document.querySelectorAll('.table-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLimit = 20;
        });
    });

    // Toast System
    window.showToast = function (message, type, duration) {
        type = type || 'info';
        duration = duration || 3000;
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        toast.className = 'toast toast-' + type;
        toast.innerHTML = (icons[type] || 'ℹ️') + ' ' + message;
        container.appendChild(toast);
        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, duration);
    };

    // Swipe-to-Delete
    (function () {
        const tb = document.getElementById('table-body');
        if (!tb) return;
        let sx = 0, sy = 0;
        const THRESH = 80;
        tb.addEventListener('touchstart', function (e) {
            const row = e.target.closest('tr');
            if (!row) return;
            sx = e.touches[0].clientX;
            sy = e.touches[0].clientY;
            row._sx = sx;
        }, { passive: true });
        tb.addEventListener('touchmove', function (e) {
            const row = e.target.closest('tr');
            if (!row || !row._sx) return;
            const dx = e.touches[0].clientX - row._sx;
            const dy = e.touches[0].clientY - sy;
            if (Math.abs(dy) > Math.abs(dx)) return;
            if (dx < -10) {
                const p = Math.min(Math.abs(dx) / THRESH, 1);
                row.style.opacity = String(1 - p * 0.4);
                row.style.transform = 'translateX(' + dx + 'px)';
            }
        }, { passive: true });
        tb.addEventListener('touchend', function (e) {
            const row = e.target.closest('tr');
            if (!row || !row._sx) return;
            const dx = e.changedTouches[0].clientX - row._sx;
            row._sx = 0;
            if (dx < -THRESH) {
                const btn = row.querySelector('.action-btn[data-row-index]');
                if (btn) {
                    row.style.transition = 'transform 0.25s, opacity 0.25s';
                    row.style.transform = 'translateX(-100%)';
                    row.style.opacity = '0';
                    setTimeout(() => btn.click(), 200);
                    setTimeout(() => { row.style.transition = ''; row.style.transform = ''; row.style.opacity = ''; }, 500);
                    return;
                }
            }
            row.style.transition = 'transform 0.2s, opacity 0.2s';
            row.style.transform = '';
            row.style.opacity = '';
            setTimeout(() => { row.style.transition = ''; }, 220);
        }, { passive: true });
    })();

    // --- FINAL INITIALIZATION ---
    loadFromCache();
    currentLimit = 20;

    // Restore saved view on load (Centralized initialization)
    const savedView = localStorage.getItem("active_app_view") || 'data';
    switchView(savedView);

    if (entryTypeSelect) {
        entryTypeSelect.dispatchEvent(new Event("change"));
    }

    const syncBtn = document.getElementById('sync-gsheet-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            if (!isAuthorizedForSync()) {
                console.log("Sync skipped: Read-only access");
                return;
            }
            syncData();
        });
    }

    // --- AUTO-SYNC ON STARTUP ---
    if (getRole() && syncBtn) {
        setTimeout(() => {
            console.log("Auto-syncing data on startup...");
            syncBtn.click();
        }, 800); // Đợi một chút để UI ổn định rồi mới sync
    }
});
