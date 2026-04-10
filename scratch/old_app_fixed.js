const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxS7z1duOFpG90jZF0FgoVOVgQsoiSKBF4NVm-3wMyfUA1TXvgi_5PDk9Ty4D6z3nUFUg/exec";

document.addEventListener("DOMContentLoaded", () => {
    // 0. Internal Access Control
    const ADMIN_PASSWORD = "REDACTED_USER1";
    const loginOverlay = document.getElementById("login-overlay");
    const loginForm = document.getElementById("login-form");
    const appContainer = document.querySelector(".app-container");
    const passwordInput = document.getElementById("admin-password");
    const loginError = document.getElementById("login-error");

    const checkAuth = () => {
        if (sessionStorage.getItem("admin_auth") === "true") {
            loginOverlay.style.display = "none";
            appContainer.style.display = "flex";
            return true;
        }
        return false;
    };

    if (!checkAuth()) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (passwordInput.value === ADMIN_PASSWORD) {
                sessionStorage.setItem("admin_auth", "true");
                loginOverlay.style.display = "none";
                appContainer.style.display = "flex";
                // Trigger any initial data loading if needed
                if (typeof initDashboard === "function") initDashboard();
            } else {
                loginError.style.display = "block";
                passwordInput.value = "";
                passwordInput.focus();
            }
        });
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("admin_auth");
            location.reload();
        });
    }

    // 1. Data Initialization & Utility Functions
    let farmData = window.farmData || [];
    let sortState = { column: 'Ng+·y', direction: 'desc' };
    let currentTableTab = 'all';

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
        if (!number) return "0 GÈΩ";
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
    }

    // Process initial data: normalize dates
    farmData = farmData.map(item => {
        return {
            ...item,
            parsedDate: excelToJsDate(item["Ng+·y"]),
            "Status": (item["Status"] || "").trim()
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
    const vuaExpectedRevenueInput = document.getElementById('vua-expected-revenue');

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
                if (labelBuyerInput) labelBuyerInput.innerText = "Kh+Ìch H+·ng (T+¨n Kh+Ìch)";
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
                if (labelBuyerInput) labelBuyerInput.innerText = "-…ﬂ+Êi So+Ìt Vﬂ+¶a (T+¨n Vﬂ+¶a)";
                if (buyerInput) { buyerInput.value = "-…oan CR"; buyerInput.required = true; }
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

            // --- AUTO-SWITCH TABLE TAB ---
            let targetTab = 'all';
            if (type === "farm") targetTab = 'farm';
            else if (type === "vua") targetTab = 'vua';
            else if (type === "expense") targetTab = 'expense';

            const tabBtns = document.querySelectorAll('.table-tab-btn');
            tabBtns.forEach(btn => {
                if (btn.dataset.tab === targetTab) {
                    // Cﬂ¶°p nhﬂ¶°t class active
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    // Cﬂ¶°p nhﬂ¶°t state v+· render lﬂ¶Ìi
                    currentTableTab = targetTab;
                    applyFiltersAndRender();
                }
            });
        });
        entryTypeSelect.dispatchEvent(new Event("change"));
    }

    function calculateVuaTotals() {
        let totalCost = 0;
        if (flowerItemsContainer) {
            flowerItemsContainer.querySelectorAll('.flower-item').forEach(item => {
                const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const p = parseMoney(item.querySelector('.fw-price').value);
                totalCost += (q * p);
            });
        }
        if (vuaTotalCostInput) vuaTotalCostInput.value = formatCurrency(totalCost);

        const shipping = parseMoney(vuaShipCostInput ? vuaShipCostInput.value : "0");
        const vattu = parseMoney(vuaVattuCostInput ? vuaVattuCostInput.value : "0");
        const packing = parseMoney(vuaPackCostInput ? vuaPackCostInput.value : "0");

        let totalCollect = totalCost + shipping + vattu + packing;

        // Automatically update the advised total collect ONLY if user hasn't explicitly typed something else
        // Wait, for simplicity, we just forcefully update it, or let user edit it but if costs change we re-advise?
        // Let's forcefully update it because it's a sum.
        if (vuaTotalCollectInput) {
            vuaTotalCollectInput.value = formatMoneyStr(totalCollect);
        }

        // Expected Revenue = Total Collect - Total Cost (Wait, the user said Doanh Thu Dﬂ+¶ Kiﬂ¶+n = Sﬂ+Ê Tiﬂ+¸n Phﬂ¶˙i Thu Kh+Ìch - Tﬂ+Úng Gi+Ì Vﬂ+Ên).
        // Actually Doanh thu dﬂ+¶ kiﬂ¶+n = (Tiﬂ+¸n phﬂ¶˙i thu) - (Tﬂ+Úng Gi+Ì Vﬂ+Ên) - Ph+° (nﬂ¶+u c+¶)?
        // User explicitly said: Doanh Thu dﬂ+¶ kiﬂ+Án = Sﬂ+Ê Tiﬂ+¸n Phﬂ¶˙i Thu Kh+Ìch (VN-…) - Tﬂ+Úng Gi+Ì Vﬂ+Ên (Tﬂ¶Ìm t+°nh)
        if (vuaExpectedRevenueInput) {
            const userCollect = parseMoney(vuaTotalCollectInput.value);
            const expected = userCollect - totalCost;
            vuaExpectedRevenueInput.value = formatCurrency(expected);
        }

        if (vuaTotalCollectInput) {
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

            // Suggest rounding to nearest 5000 (VND 5k)
            const roundedPrice = Math.round(pricePerBundle / 5000) * 5000;

            // Check if it's already perfectly rounded or diff is extremely small
            if (Math.abs(roundedPrice - pricePerBundle) < 10) {
                if (suggestBox) suggestBox.style.display = 'none';
            } else {
                const targetCollect = roundedPrice * totalBundles;
                const shipping = parseMoney(vuaShipCostInput ? vuaShipCostInput.value : "0");
                const vattu = parseMoney(vuaVattuCostInput ? vuaVattuCostInput.value : "0");
                const newPacking = targetCollect - (sumCost + shipping + vattu);

                if (suggestBox && suggestBtn && newPacking >= 0) {
                    suggestBox.style.display = 'block';
                    suggestBtn.innerHTML = `=ÉÓÉ Gﬂ+˙i ++ -…+¶ng G+¶i: ${formatCurrency(newPacking)} => Gi+Ì b+¶ chﬂ¶¶n: ${formatCurrency(roundedPrice)}`;
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
            if (vuaPricePerBundleEl) vuaPricePerBundleEl.value = "0 GÈΩ";
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
                    alert('Phﬂ¶˙i c+¶ +°t nhﬂ¶—t 1 d+¶ng B+¶ng!');
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
            item.style = 'display: grid; grid-template-columns: 1.2fr 0.6fr 1.2fr 1.5fr 30px; gap: 10px; align-items: center;';
            item.innerHTML = `
                <div class="form-group" style="margin: 0;">
                    <select class="fw-type" style="width: 100%; border: 1px solid var(--border-color); border-radius: 4px; padding: 6px;" required>
                        <option value="X+¶ ngoﬂ¶Ìi">X+¶ ngoﬂ¶Ìi</option>
                        <option value="X+¶ nﬂ+÷i">X+¶ nﬂ+÷i</option>
                        <option value="Ecuador">Ecuador</option>
                        <option value="Ph+Ìp">Ph+Ìp</option>
                        <option value="Trﬂ¶ªng +¶">Trﬂ¶ªng +¶</option>
                        <option value="+ˆ Hﬂ+Ùng">+ˆ Hﬂ+Ùng</option>
                        <option value="+ˆ Trﬂ¶ªng">+ˆ Trﬂ¶ªng</option>
                        <option value="Simmo">Simmo</option>
                        <option value="Cam Ch+Ìy">Cam Ch+Ìy</option>
                        <option value="Vitto">Vitto</option>
                        <option value="Lﬂ¶Ìc Thﬂ¶∫n">Lﬂ¶Ìc Thﬂ¶∫n</option>
                        <option value="Hﬂ++ Trﬂ+¨ng">Hﬂ++ Trﬂ+¨ng</option>
                        <option value="Kh+Ìc">Kh+Ìc</option>
                    </select>
                </div>
                <div class="form-group" style="margin: 0;"><input type="number" placeholder="SL" class="fw-qty" min="0" required></div>
                <div class="form-group" style="margin: 0;"><input type="text" placeholder="Gi+Ì" class="fw-price money-input" required></div>
                <div class="form-group" style="margin: 0;"><input type="text" placeholder="Th+·nh tiﬂ+¸n" class="fw-total" readonly style="background: #f9fafb; color: #374151; font-weight: bold; border: 1px solid var(--border-color); border-radius: 4px; padding: 6px; width: 100%;"></div>
                <button type="button" class="del-flower-btn" style="background: none; border: none; color: var(--danger); font-size: 1.2rem; cursor: pointer; padding: 0;" title="Xo+Ì"><i class="fa-solid fa-circle-xmark"></i></button>
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

        // Auto update Expected Revenue when user edits the collect amount
        const expected = userCollect - sumCost;
        if (vuaExpectedRevenueInput) vuaExpectedRevenueInput.value = formatCurrency(expected);

        calculateBundlesAndPrice(vuaTotalCollectInput.value);
    });


    // 3. Table Rendering Logic
    function renderTable(dataToRender) {
        tableBody.innerHTML = '';

        // Cﬂ¶°p nhﬂ¶°t Header ti+¨u -Êﬂ+¸ cﬂ+÷t dﬂ+¶a tr+¨n Tab
        const thead = document.querySelector('#farm-data-table thead tr');
        if (thead) {
            if (currentTableTab === 'expense') {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ng+·y">Ng+·y <i class="fa-solid fa-sort"></i></th>
                    <th>Ph+Ûn Loﬂ¶Ìi CP</th>
                    <th>Ghi Ch+¶ Chi Ph+°</th>
                    <th>Sﬂ+Ê tiﬂ+¸n</th>
                    <th>Thao T+Ìc</th>
                `;
            } else if (currentTableTab === 'vua') {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ng+·y">Ng+·y <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Ng¶¶ﬂ+•i Mua">T+¨n Vﬂ+¶a <i class="fa-solid fa-sort"></i></th>
                    <th>Ph+Ûn Loﬂ¶Ìi</th>
                    <th data-sort="Sﬂ+Ê l¶¶ﬂ+˙ng">SL <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Tiﬂ+¸n Phﬂ¶˙i Thu">Phﬂ¶˙i Thu <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Doanh Thu Kh+Ìc">Doanh Thu <i class="fa-solid fa-sort"></i></th>
                    <th>Status</th>
                    <th>Ghi Ch+¶</th>
                    <th>Thao T+Ìc</th>
                `;
            } else {
                thead.innerHTML = `
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th data-sort="Ng+·y">Ng+·y <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Ng¶¶ﬂ+•i Mua">Ng¶¶ﬂ+•i Mua <i class="fa-solid fa-sort"></i></th>
                    <th>Ph+Ûn Loﬂ¶Ìi</th>
                    <th data-sort="Sﬂ+Ê l¶¶ﬂ+˙ng">Sﬂ+Ê L¶¶ﬂ+˙ng <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Gi+Ì">Gi+Ì <i class="fa-solid fa-sort"></i></th>
                    <th data-sort="Doanh Thu B+¶ng">Doanh Thu B+¶ng <i class="fa-solid fa-sort"></i></th>
                    <th>Trﬂ¶Ìng Th+Ìi</th>
                    <th>Ghi Ch+¶</th>
                    <th>Thao T+Ìc</th>
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
            tableBody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;color:var(--text-light)">Kh+¶ng t+ºm thﬂ¶—y giao dﬂ+Ôch n+·o.</td></tr>`;
            return;
        }

        const todayStr = formatDateInput(new Date());

        dataToRender.forEach((row, index) => {
            const tr = document.createElement('tr');
            const isDone = row["Status"] === "Xong";
            const statusClass = isDone ? "status-badge status-done" : "status-badge status-pending";

            const rowDateStr = formatDateInput(row.parsedDate);
            const isToday = rowDateStr === todayStr;
            const rowJson = JSON.stringify(row).replace(/'/g, "&apos;").replace(/"/g, "&quot;");

            if (currentTableTab === 'expense') {
                const amount = parseFloat(String(row["Chi Ph+°"] || "0").replace(/,/g, ''));
                tr.innerHTML = `
                    <td style="text-align: center;">
                        ${isToday ? `<input type="checkbox" class="row-checkbox" style="cursor:pointer;" value='${rowJson}'>` : `<input type="checkbox" disabled>`}
                    </td>
                    <td>${formatDateVietnamese(row.parsedDate)}</td>
                    <td style="font-weight:600;">${row["Loﬂ¶Ìi CP"] || 'Chi ph+°'}</td>
                    <td title="${row["Ghi Ch+¶ Chi Ph+°"] || row["Ghi Ch+¶"] || ''}">${(row["Ghi Ch+¶ Chi Ph+°"] || row["Ghi Ch+¶"] || '').substring(0, 30)}</td>
                    <td style="color:#ef4444; font-weight:700;">${formatCurrency(amount)}</td>
                    <td>
                        ${isToday ? `
                        <button class="action-btn" onclick="deleteRow('${rowJson}')" title="Xo+Ì">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        ` : `<span style="color:var(--text-light);font-size:12px">Kh+¶a</span>`}
                    </td>
                `;
            } else if (currentTableTab === 'vua') {
                const pt = parseFloat(String(row["Tiﬂ+¸n Phﬂ¶˙i Thu"] || "0").replace(/[^\d]/g, '')) || 0;
                const dt = parseFloat(String(row["Doanh Thu Kh+Ìc"] || "0").replace(/[^\d]/g, '')) || 0;
                tr.innerHTML = `
                    <td style="text-align: center;">
                        ${isToday ? `<input type="checkbox" class="row-checkbox" style="cursor:pointer;" value='${rowJson}'>` : `<input type="checkbox" disabled>`}
                    </td>
                    <td>${formatDateVietnamese(row.parsedDate)}</td>
                    <td style="font-weight:600;">${row["Ng¶¶ﬂ+•i Mua"] || ''}</td>
                    <td>${row["Ph+Ûn Loﬂ¶Ìi B+¶ng"] || ''}</td>
                    <td>${row["Sﬂ+Ê l¶¶ﬂ+˙ng"] ? row["Sﬂ+Ê l¶¶ﬂ+˙ng"].toLocaleString('vi-VN') : 0}</td>
                    <td style="color:var(--primary-color); font-weight:600;">${formatCurrency(pt)}</td>
                    <td style="color:#ec4899; font-weight:700;">${formatCurrency(dt)}</td>
                    <td>${row["Status"] ? `<span class="${statusClass}">${row["Status"]}</span>` : ''}</td>
                    <td title="${row["Ghi Ch+¶"] || ''}">${(row["Ghi Ch+¶"] || '').substring(0, 15)}${(row["Ghi Ch+¶"] || '').length > 15 ? '...' : ''}</td>
                    <td>
                        ${isToday ? `
                        <button class="action-btn" onclick="deleteRow('${rowJson}')" title="Xo+Ì">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        ` : `<span style="color:var(--text-light);font-size:12px">Kh+¶a</span>`}
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td style="text-align: center;">
                        ${isToday ? `<input type="checkbox" class="row-checkbox" style="cursor:pointer;" value='${rowJson}'>` : `<input type="checkbox" disabled>`}
                    </td>
                    <td>${formatDateVietnamese(row.parsedDate)}</td>
                    <td style="font-weight:600;">${row["Ng¶¶ﬂ+•i Mua"] || ''}</td>
                    <td>${row["Ph+Ûn Loﬂ¶Ìi B+¶ng"] || ''}</td>
                    <td>${row["Sﬂ+Ê l¶¶ﬂ+˙ng"] ? row["Sﬂ+Ê l¶¶ﬂ+˙ng"].toLocaleString('vi-VN') : 0}</td>
                    <td>${formatCurrency(row["Gi+Ì"])}</td>
                    <td style="color:var(--secondary-color); font-weight:600;">${formatCurrency(row["Doanh Thu B+¶ng"])}</td>
                    <td>${row["Status"] ? `<span class="status-badge ${statusClass}">${row["Status"]}</span>` : ''}</td>
                    <td title="${row["Ghi Ch+¶"] || ''}">${(row["Ghi Ch+¶"] || '').substring(0, 20)}${row["Ghi Ch+¶"] && row["Ghi Ch+¶"].length > 20 ? '...' : ''}</td>
                    <td>
                        ${isToday ? `
                        <button class="action-btn" onclick="deleteRow('${rowJson}')" title="Xo+Ì">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        ` : `<span style="color:var(--text-light);font-size:12px">Kh+¶a</span>`}
                    </td>
                `;
            }
            tableBody.appendChild(tr);
        });

        if (typeof updateBulkDeleteUI === 'function') updateBulkDeleteUI();
    }

    // Expose delete to global scope for row buttons
    window.deleteRow = async function (rowJsonStr) {
        if (!confirm("Bﬂ¶Ìn c+¶ chﬂ¶ªc chﬂ¶ªn muﬂ+Ên x+¶a bﬂ¶˙n ghi n+·y tr+¨n Google Sheets?")) return;

        try {
            const rowData = JSON.parse(rowJsonStr);
            if (WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
                alert("Vui l+¶ng cﬂ¶—u h+ºnh WEB_APP_URL trong app.js tr¶¶ﬂ+¢c khi xo+Ì dﬂ+ª liﬂ+Áu.");
                // Fallback delete locally
                const indexToRemove = farmData.findIndex(r =>
                    r["Ng+·y"] === rowData["Ng+·y"] &&
                    r["Ng¶¶ﬂ+•i Mua"] === rowData["Ng¶¶ﬂ+•i Mua"] &&
                    r["Sﬂ+Ê l¶¶ﬂ+˙ng"] == rowData["Sﬂ+Ê l¶¶ﬂ+˙ng"]
                );
                if (indexToRemove >= 0) farmData.splice(indexToRemove, 1);
                applyFiltersAndRender();
                return;
            }

            // Gﬂ¶ªn loading
            document.body.style.cursor = 'wait';

            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "delete",
                    data: rowData
                }),
                headers: {
                    "Content-Type": "text/plain;charset=utf-8" // bypass CORS preflight
                }
            });
            const result = await response.json();
            if (result.status === "success") {
                alert("X+¶a th+·nh c+¶ng khﬂ+≈i Google Sheets!");
                // Optionally reload data via existing sync logic, or remote local
                const indexToRemove = farmData.findIndex(r =>
                    r["Ng+·y"] === rowData["Ng+·y"] &&
                    r["Ng¶¶ﬂ+•i Mua"] === rowData["Ng¶¶ﬂ+•i Mua"] &&
                    r["Sﬂ+Ê l¶¶ﬂ+˙ng"] == rowData["Sﬂ+Ê l¶¶ﬂ+˙ng"]
                );
                if (indexToRemove >= 0) farmData.splice(indexToRemove, 1);
                applyFiltersAndRender();
            } else {
                alert("Lﬂ+˘i khi x+¶a: " + result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Lﬂ+˘i kﬂ¶+t nﬂ+Êi khi x+¶a.");
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    // Menu Routing
    const menuData = document.getElementById('menu-data');
    const menuReport = document.getElementById('menu-report');
    const menuDebt = document.getElementById('menu-debt');
    const menuCashFlow = document.getElementById('menu-cashflow'); // NEW

    const viewData = document.getElementById('view-data');
    const viewReport = document.getElementById('view-report');
    const viewDebt = document.getElementById('view-debt');
    const viewCashFlow = document.getElementById('view-cashflow'); // NEW

    function hideAllViews() {
        if (menuData) menuData.classList.remove('active');
        if (menuReport) menuReport.classList.remove('active');
        if (menuDebt) menuDebt.classList.remove('active');
        if (menuCashFlow) menuCashFlow.classList.remove('active');

        if (viewData) viewData.style.display = 'none';
        if (viewReport) viewReport.style.display = 'none';
        if (viewDebt) viewDebt.style.display = 'none';
        if (viewCashFlow) viewCashFlow.style.display = 'none';
    }

    if (menuData) {
        menuData.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            menuData.classList.add('active');
            viewData.style.display = 'block';
            applyFiltersAndRender();
        });
    }

    if (menuReport) {
        menuReport.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            menuReport.classList.add('active');
            viewReport.style.display = 'block';
            updateDashboard();
        });
    }

    if (menuDebt) {
        menuDebt.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            menuDebt.classList.add('active');
            viewDebt.style.display = 'block';
            renderDebtTable();
        });
    }

    if (menuCashFlow) {
        menuCashFlow.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllViews();
            menuCashFlow.classList.add('active');
            viewCashFlow.style.display = 'block';
            updateCashFlowReport();
        });
    }

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
            const buyer = (row["Ng¶¶ﬂ+•i Mua"] || "Kh+Ìch Lﬂ¶+").trim();
            const isVua = (row["Loﬂ¶Ìi DT"] || "") === "Vﬂ+¶a";
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
            const qty = parseFloat(row["Sﬂ+Ê l¶¶ﬂ+˙ng"]) || 0;
            const priceStr = row["Gi+Ì"];
            const price = priceStr ? parseFloat(String(priceStr).replace(/[^\d]/g, '')) || 0 : 0;
            const dtBongStr = row["Doanh Thu B+¶ng"];
            const dtBong = dtBongStr ? parseFloat(String(dtBongStr).replace(/[^\d]/g, '')) || 0 : 0;

            const flowerType = row["Ph+Ûn Loﬂ¶Ìi B+¶ng"] || "B+¶ng";
            const ptStr = row["Tiﬂ+¸n Phﬂ¶˙i Thu"];
            const tPhaiThu = ptStr ? parseFloat(String(ptStr).replace(/[^\d]/g, '')) || 0 : 0;
            const daThuStr = row["-…+˙ Thu"];
            const actualPaid = daThuStr ? parseFloat(String(daThuStr).replace(/[^\d]/g, '')) || 0 : 0;

            t.lines.push({ qty, price, flowerType, dtBong, rawRow: row, isVua });
            t.totalQty += qty;
            t.paid += actualPaid; // This now safely extracts millions from e.g. "1.600.000-Ê"

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
            buyers[t.buyer].orderCount += t.lines.length; // Count each sheet row as 1 "-Ê¶Ìn"
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
                 <span class="buyer-name-part">=ÉÊÒ <span>${b.name}</span></span>
                 <span class="debt-amount-part">=Éˆ¶ ${debtFormatted} <span class="order-count-tag">(${b.orderCount} -Ê¶Ìn)</span></span>
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
            farmListContainer.innerHTML = `<div style="text-align: center; color: var(--text-dark); padding: 10px; background: white; border-radius: 8px;">Hoan h+¶! Kh+¶ng c+¶ c+¶ng nﬂ+˙.</div>`;
        }
        if (vuaCount === 0) {
            vuaListContainer.innerHTML = `<div style="text-align: center; color: var(--text-dark); padding: 10px; background: white; border-radius: 8px;">Hoan h+¶! Kh+¶ng c+¶ c+¶ng nﬂ+˙.</div>`;
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

        document.getElementById('detail-buyer-name').innerHTML = `=ÉÊÒ ${buyerObj.name}`;

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
            invoiceItem.className = 'invoice-item';
            invoiceItem.style.display = 'flex';
            invoiceItem.style.alignItems = 'flex-start';
            invoiceItem.style.gap = '12px';
            invoiceItem.style.padding = '15px';

            let itemHtml = `
                <div class="invoice-header-row">
                    <span class="invoice-date-tag"><i class="fa-regular fa-calendar-days"></i> ${shortDate}</span>
                    <span class="invoice-amount">${formatCurrency(t.totalExpected)}</span>
                </div>
            `;

            if (t.lines.length > 0 && t.lines[0].isVua) {
                // Vﬂ+¶a Rendering
                const combinedFlowers = t.lines.map(l => `${l.qty} ${l.flowerType}`).join(', ');
                let phiVC = 150000;
                let giaBong = t.totalExpected - phiVC;
                if (giaBong < 0) { giaBong = t.totalExpected; phiVC = 0; }

                itemHtml += `
                    <div class="invoice-details-row">
                        <span class="invoice-desc">${combinedFlowers}</span>
                    </div>
                    <div class="invoice-sub-row">
                        <span class="invoice-badge-fee"><i class="fa-solid fa-truck-fast"></i> Vﬂ¶°n chuyﬂ+‚n: ${formatCurrency(phiVC)}</span>
                        ${t.paid > 0 ? `<span class="invoice-badge-paid"><i class="fa-solid fa-circle-check"></i> -…+˙ thu: ${formatCurrency(t.paid)}</span>` : ''}
                    </div>
                `;
            } else {
                // Farm Rendering
                t.lines.forEach(l => {
                    const priceK = (l.price / 1000).toFixed(1) + 'k';
                    itemHtml += `
                        <div class="invoice-details-row">
                            <span class="invoice-desc">${l.qty} ${l.flowerType} x ${priceK}</span>
                            <span style="color: #64748b;">${formatCurrency(l.dtBong)}</span>
                        </div>
                    `;
                });

                const sumDtBong = t.lines.reduce((acc, cur) => acc + cur.dtBong, 0);
                const diff = t.totalExpected - sumDtBong;

                itemHtml += `<div class="invoice-sub-row">`;
                if (diff > 0) {
                    itemHtml += `<span class="invoice-badge-fee"><i class="fa-solid fa-box"></i> Ph+° kh+Ìc: ${formatCurrency(diff)}</span>`;
                } else {
                    itemHtml += `<span></span>`;
                }

                if (t.paid > 0) {
                    itemHtml += `<span class="invoice-badge-paid"><i class="fa-solid fa-circle-check"></i> -…+˙ thu: ${formatCurrency(t.paid)}</span>`;
                }
                itemHtml += `</div>`;
            }

            invoiceItem.innerHTML = `
                <input type="checkbox" class="tx-checkbox" data-txkey="${t.key}" style="width: 20px; height: 20px; margin-top: 5px; cursor: pointer; flex-shrink: 0;">
                <div style="flex: 1;">
                    ${itemHtml}
                </div>
            `;
            txList.appendChild(invoiceItem);
        });

        // Add Select All functionality
        const selectAllContainer = document.createElement('div');
        selectAllContainer.style.cssText = 'padding: 10px 15px; border-bottom: 2px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 12px; font-weight: 700;';
        selectAllContainer.innerHTML = `<input type="checkbox" id="detail-select-all" style="width: 20px; height: 20px; cursor: pointer;"> <label for="detail-select-all" style="cursor: pointer;">CHﬂ+ÓN Tﬂ¶ÒT Cﬂ¶Û -…¶·N</label>`;
        txList.prepend(selectAllContainer);

        const selectAllCb = selectAllContainer.querySelector('#detail-select-all');
        const txCheckboxes = txList.querySelectorAll('.tx-checkbox');

        selectAllCb.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            txCheckboxes.forEach(cb => cb.checked = isChecked);
        });

        document.getElementById('detail-total-qty').innerText = sumQty.toLocaleString('vi-VN') + ' b+¶ng';
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
        if (!currentSelectedBuyer) return;
        const totalDebt = currentSelectedBuyer.totalDebt;
        let amountToPay = totalDebt;

        if (!isFull) {
            const rawInput = prompt(`Tﬂ+Úng nﬂ+˙ hiﬂ+Án tﬂ¶Ìi l+· ${formatCurrency(totalDebt)}.\nNhﬂ¶°p sﬂ+Ê tiﬂ+¸n muﬂ+Ên thanh to+Ìn (VN-…):`, "");
            if (!rawInput) return;
            amountToPay = parseFloat(rawInput.replace(/[^\d]/g, ''));
            if (isNaN(amountToPay) || amountToPay <= 0 || amountToPay > totalDebt) {
                alert("Sﬂ+Ê tiﬂ+¸n kh+¶ng hﬂ+˙p lﬂ+Á hoﬂ¶+c lﬂ+¢n h¶Ìn tﬂ+Úng nﬂ+˙!");
                return;
            }
        } else {
            if (!confirm(`X+Ìc nhﬂ¶°n thanh to+Ìn Hﬂ¶+T to+·n bﬂ+÷ sﬂ+Ê nﬂ+˙ ${formatCurrency(totalDebt)} cﬂ+∫a ${currentSelectedBuyer.name}?`)) return;
        }

        if (WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
            alert("Vui l+¶ng cﬂ¶—u h+ºnh WEB_APP_URL!");
            return;
        }

        document.body.style.cursor = 'wait';

        // Ph+Ûn bﬂ+Ú sﬂ+Ê tiﬂ+¸n trﬂ¶˙ cho c+Ìc -Ê¶Ìn nﬂ+˙ (tﬂ+Ω c+¨ nhﬂ¶—t -Êﬂ¶+n mﬂ+¢i nhﬂ¶—t)
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

            // Chuﬂ¶¨n bﬂ+Ô payload lﬂ¶—y giao dﬂ+Ôch d+¶ng -Êﬂ¶∫u ti+¨n (-Êﬂ+‚ g+Ìn -…+˙ Thu)
            if (t.lines.length > 0) {
                const firstRow = t.lines[0].rawRow;
                // Cﬂ¶°p nhﬂ¶°t Cﬂ+÷t trﬂ¶Ìng th+Ìi
                let newStatus = firstRow["Status"]; // ""
                if (newPaid >= t.totalExpected) {
                    newStatus = "Xong";
                }

                // Cﬂ¶°p nhﬂ¶°t Ghi ch+¶
                const now = new Date();
                const dateTimeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                let newGhiChu = `Thanh to+Ìn ${isFull ? 'hﬂ¶+t' : 'mﬂ+÷t phﬂ¶∫n'} ng+·y ${dateTimeStr}`;
                const existingNote = firstRow["Ghi Ch+¶"] || "";
                if (existingNote.trim() !== '') {
                    newGhiChu = existingNote + " | " + newGhiChu;
                }

                updatesList.push({
                    targetRow: firstRow,
                    updates: {
                        "-…+˙ Thu": newPaid,
                        "Status": newStatus,
                        "Ghi Ch+¶": newGhiChu
                    }
                });

                // Update in memory immediately for snappy UI
                firstRow["-…+˙ Thu"] = newPaid;
                firstRow["Status"] = newStatus;
                firstRow["Ghi Ch+¶"] = newGhiChu;
            }
        }

        try {
            let successC = 0;
            // Send sequentially 
            for (let i = 0; i < updatesList.length; i++) {
                const req = updatesList[i];
                const response = await fetch(WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "update", targetRow: req.targetRow, updates: req.updates }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status === "success") {
                    successC++;
                }
            }
            alert(`-…+˙ thanh to+Ìn th+·nh c+¶ng ${formatCurrency(amountToPay)}!`);
            // Refresh data visibly right away without waiting for backend
            renderDebtTable();

            // Sync background to ensure google sheet state is downloaded clean
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) {
                syncBtn.click();
            }
        } catch (err) {
            console.error(err);
            alert("Lﬂ+˘i kﬂ¶+t nﬂ+Êi khi thanh to+Ìn.");
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
            alert("Vui l+¶ng chﬂ+Ïn +°t nhﬂ¶—t mﬂ+÷t -Ê¶Ìn h+·ng -Êﬂ+‚ thanh to+Ìn.");
            return;
        }

        if (!confirm(`X+Ìc nhﬂ¶°n thanh to+Ìn ${checkedBoxes.length} -Ê¶Ìn h+·ng -Ê+˙ chﬂ+Ïn cho ${currentSelectedBuyer.name}?`)) return;

        if (WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
            alert("Vui l+¶ng cﬂ¶—u h+ºnh WEB_APP_URL!");
            return;
        }

        document.body.style.cursor = 'wait';
        const payBtn = document.getElementById('btn-pay-selected');
        const originalHtml = payBtn.innerHTML;
        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> -…ang xﬂ+° l++...';

        const selectedKeys = Array.from(checkedBoxes).map(cb => cb.dataset.txkey);
        const transactionsToPay = currentSelectedBuyer.transactions.filter(t => selectedKeys.includes(t.key));

        const updatesList = [];
        const now = new Date();
        const dateTimeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        transactionsToPay.forEach(t => {
            // X+Ìc -Êﬂ+Ônh tﬂ+Úng tiﬂ+¸n cﬂ+∫a to+·n bﬂ+÷ transaction n+·y -Êﬂ+‚ g+Ìn v+·o d+¶ng -Êﬂ¶∫u ti+¨n (hoﬂ¶+c ph+Ûn bﬂ+Ú)
            // Tuy nhi+¨n -Ê¶Ìn giﬂ¶˙n nhﬂ¶—t l+· mark "Xong" cho mﬂ+Ïi d+¶ng trong transaction n+·y.
            t.lines.forEach((line, index) => {
                const row = line.rawRow;
                const existingNote = row["Ghi Ch+¶"] || "";
                const newNote = existingNote ? `${existingNote} | Thanh to+Ìn -Ê¶Ìn lﬂ¶+ ${dateTimeStr}` : `Thanh to+Ìn -Ê¶Ìn lﬂ¶+ ${dateTimeStr}`;

                // T+°nh to+Ìn gi+Ì trﬂ+Ô thanh to+Ìn cho d+¶ng n+·y
                const valToPay = t.isVua ? (parseFloat(String(row["Tiﬂ+¸n Phﬂ¶˙i Thu"] || "0").replace(/[^\d]/g, '')) || 0)
                    : (parseFloat(String(row["Doanh Thu B+¶ng"] || "0").replace(/[^\d]/g, '')) || 0);

                updatesList.push({
                    targetRow: row,
                    updates: {
                        "Status": "Xong",
                        "Ghi Ch+¶": newNote,
                        "-…+˙ Thu": valToPay > 0 ? valToPay : (parseFloat(String(row["-…+˙ Thu"] || "0").replace(/[^\d]/g, '')) || 0)
                    }
                });

                // Update local memory
                row["Status"] = "Xong";
                row["Ghi Ch+¶"] = newNote;
                if (valToPay > 0) row["-…+˙ Thu"] = valToPay;
            });
        });

        try {
            let successC = 0;
            for (let i = 0; i < updatesList.length; i++) {
                const req = updatesList[i];
                const response = await fetch(WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "update", targetRow: req.targetRow, updates: req.updates }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status === "success") successC++;
            }
            alert(`-…+˙ thanh to+Ìn th+·nh c+¶ng ${checkedBoxes.length} -Ê¶Ìn h+·ng!`);
            renderDebtTable();
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) syncBtn.click();
        } catch (err) {
            console.error(err);
            alert("Lﬂ+˘i kﬂ¶+t nﬂ+Êi khi thanh to+Ìn.");
        } finally {
            document.body.style.cursor = 'default';
            payBtn.disabled = false;
            payBtn.innerHTML = originalHtml;
        }
    }

    let annualQtyChartInstance = null;
    let annualRevProfitChartInstance = null;
    let annualExpenseChartInstance = null;
    let monthlyCombinedChartInstance = null;

    // Report Setup
    const reportRangeSelect = document.getElementById('report-range');
    const reportMonthSelect = document.getElementById('report-month');
    const monthSelectContainer = document.getElementById('month-select-container');

    const cmpMonth1Select = document.getElementById('cmp-month1');
    const cmpMonth2Select = document.getElementById('cmp-month2');
    const cmpPeriodSelect = document.getElementById('cmp-period');

    if (reportRangeSelect) {
        reportRangeSelect.addEventListener('change', () => {
            const isMonth = reportRangeSelect.value === 'month';
            monthSelectContainer.style.display = isMonth ? 'block' : 'none';
            document.getElementById('yearly-report-charts').style.display = isMonth ? 'none' : 'grid';
            document.getElementById('monthly-report-charts').style.display = isMonth ? 'grid' : 'none';

            const kpiLabels = document.querySelectorAll('.kpi-cards h3');
            kpiLabels.forEach(label => {
                if (label.innerText.includes('T.N-‚m')) {
                    label.innerText = label.innerText.replace('T.N-‚m', isMonth ? 'T.Th+Ìng' : 'T.N-‚m');
                } else if (label.innerText.includes('T.Th+Ìng')) {
                    label.innerText = label.innerText.replace('T.Th+Ìng', isMonth ? 'T.Th+Ìng' : 'T.N-‚m');
                }
            });
            updateDashboard();
        });
    }

    if (reportMonthSelect) reportMonthSelect.addEventListener('change', updateDashboard);

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
        yearSelect.innerHTML = '';
        if (cmpY1Select) cmpY1Select.innerHTML = '';
        if (cmpY2Select) cmpY2Select.innerHTML = '';

        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year; option.textContent = year;
            yearSelect.appendChild(option);

            if (cmpY1Select) {
                const opt1 = document.createElement('option'); opt1.value = year; opt1.textContent = year;
                cmpY1Select.appendChild(opt1);
            }
            if (cmpY2Select) {
                const opt2 = document.createElement('option'); opt2.value = year; opt2.textContent = year;
                cmpY2Select.appendChild(opt2);
            }
            const cfYearSelect = document.getElementById('cashflow-year');
            const cfYearSelect2 = document.getElementById('cashflow-year-2');
            if (cfYearSelect) {
                const opt3 = document.createElement('option'); opt3.value = year; opt3.textContent = year;
                cfYearSelect.appendChild(opt3);
            }
            if (cfYearSelect2) {
                const opt4 = document.createElement('option'); opt4.value = year; opt4.textContent = year;
                cfYearSelect2.appendChild(opt4);
            }
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
        const isMonthlyRange = rangeSelect ? rangeSelect.value === 'month' : false;

        let totalQty = 0, totalRevenue = 0, totalExpense = 0;
        let prevQty = 0, prevRevenue = 0, prevExpense = 0;

        // Detailed statement stats
        const statement = {
            revFarm: 0, revCompany: 0, revVua: 0,
            expensed: 0, phanBon: 0, thuoc: 0, luong: 0, lai: 0, vatTu: 0, muaBong: 0, vanHanh: 0
        };

        const yearlyMonthlyData = Array.from({ length: 12 }, () => ({ qty: 0, revenue: 0, expense: 0 }));
        const dailyData = [];

        farmData.forEach(row => {
            const d = row.parsedDate;
            if (!d || isNaN(d.getTime())) return;

            const rowYear = d.getFullYear();
            const rowMonth = d.getMonth() + 1;
            const isPrevYear = (rowYear === selectedYear - 1);
            const isCurrYear = (rowYear === selectedYear);

            if (isMonthlyRange && rowMonth !== selectedMonth) return;
            if (!isCurrYear && !isPrevYear) return;

            const typeDT = (row["Loﬂ¶Ìi DT"] || "").trim();
            const isCompany = typeDT === "Company";
            const isVua = typeDT === "Vﬂ+¶a" || typeDT === "vﬂ+¶a";
            const isFarm = typeDT === "Farm" || typeDT === "";
            const loaiCP = (row["Loﬂ¶Ìi CP"] || "").trim();

            const rawQty = parseFloat(row["Sﬂ+Ê l¶¶ﬂ+˙ng"]) || 0;
            const dtBong = parseFloat(row["Doanh Thu B+¶ng"]) || 0;
            const dtKhac = parseFloat(row["Doanh Thu Kh+Ìc"]) || 0;
            const chiPhi = parseFloat(row["Chi Ph+°"]) || 0;

            let rev = 0, exp = 0, q = 0;
            const isExpenseCompany = (loaiCP === "Expensed");
            const isExpenseVua = (loaiCP === "Vﬂ¶°t T¶¶ KD" || loaiCP === "Vﬂ¶°n Chuyﬂ+‚n" || loaiCP === "Mua B+¶ng");
            const isExpenseFarm = (!isExpenseCompany && !isExpenseVua);

            if (reportType === "Company") {
                if (isCompany) rev = dtKhac;
                if (isExpenseCompany) exp = chiPhi;
            } else if (reportType === "Vﬂ+¶a") {
                if (isVua) rev = dtKhac;
                if (isExpenseVua) exp = chiPhi;
            } else if (reportType === "Farm") {
                rev = dtBong + (isFarm ? dtKhac : 0); // All dtBong is Farm production rev
                q = rawQty;
                if (isExpenseFarm) exp = chiPhi;
            } else { // "Chung"
                q = rawQty; rev = dtBong + dtKhac; exp = chiPhi;
            }

            if (isCurrYear) {
                totalQty += q;
                totalRevenue += rev;
                totalExpense += exp;

                // Detail aggregation for current year
                statement.revFarm += dtBong + (isFarm ? dtKhac : 0);
                statement.revCompany += dtBong + (isCompany ? dtKhac : 0);
                if (isVua) statement.revVua += dtKhac;

                // Match exact backend categories provided by user
                if (loaiCP === "Expensed") statement.expensed += chiPhi;
                else if (loaiCP === "Ph+Ûn") statement.phanBon += chiPhi;
                else if (loaiCP === "Thuﬂ+Êc") statement.thuoc += chiPhi;
                else if (loaiCP === "C+¶ng") statement.luong += chiPhi;
                else if (loaiCP === "L+˙i") statement.lai += chiPhi;
                else if (loaiCP === "Vﬂ¶°t T¶¶" || loaiCP === "Vﬂ¶°t T¶¶ KD") statement.vatTu += chiPhi;
                else if (loaiCP === "Mua B+¶ng") statement.muaBong += chiPhi;
                else if (loaiCP === "Vﬂ¶°n Chuyﬂ+‚n" || loaiCP === "Chi Ph+° Kh+Ìc") statement.vanHanh += chiPhi;
                else if (chiPhi > 0) statement.vanHanh += chiPhi;

                if (!isMonthlyRange) {
                    yearlyMonthlyData[d.getMonth()].qty += q;
                    yearlyMonthlyData[d.getMonth()].revenue += rev;
                    yearlyMonthlyData[d.getMonth()].expense += exp;
                } else {
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
            } else if (isPrevYear) {
                prevQty += q;
                prevRevenue += rev;
                prevExpense += exp;
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
            const diffVal = curr - prev;
            const isPositive = diffPct >= 0;
            const colorClass = inverse ? (isPositive ? 'negative' : 'positive') : (isPositive ? 'positive' : 'negative');
            const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';

            // Format absolute difference
            let diffFormatted = '';
            if (unit === 'GÈΩ') {
                const absDiff = Math.abs(diffVal);
                if (absDiff >= 1000000) {
                    diffFormatted = (diffVal / 1000000).toFixed(1) + 'tr';
                } else if (absDiff >= 1000) {
                    diffFormatted = (diffVal / 1000).toFixed(0) + 'k';
                } else {
                    diffFormatted = diffVal.toString();
                }
                if (diffVal > 0) diffFormatted = '+' + diffFormatted;
            } else {
                diffFormatted = (diffVal > 0 ? '+' : '') + diffVal.toLocaleString('vi-VN');
            }

            el.className = `growth-badge ${colorClass}`;
            el.innerHTML = `
                <i class="fa-solid ${icon}"></i> 
                ${Math.abs(diffPct).toFixed(1)}%
                <span style="font-size: 0.85em; font-weight: 500; margin-left: 4px; opacity: 0.9;">
                    (${diffFormatted} vs ${compYear})
                </span>
            `;
        }

        const compYear = selectedYear - 1;
        updateGrowth('growth-qty', totalQty, prevQty, compYear, '');
        updateGrowth('growth-revenue', totalRevenue, prevRevenue, compYear, 'GÈΩ');
        updateGrowth('growth-expense', totalExpense, prevExpense, compYear, 'GÈΩ', true);
        updateGrowth('growth-profit', totalProfit, prevProfit, compYear, 'GÈΩ');

        // Render Detailed Statement (Update logic: only render here if we are technically in dashboard report mode, 
        // but now we've moved it to its own tab, so we might want to consolidate or handle both).
        renderDetailedStatement(statement, totalRevenue, totalExpense, totalProfit);

        if (!isMonthlyRange) {
            const labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            renderYearlyCharts(labels, yearlyMonthlyData, selectedYear);
        } else {
            // Filter out days with no data
            const filteredDays = [];
            dailyData.forEach((d, i) => {
                if (d.qty > 0 || d.revFarm > 0 || d.revVua > 0 || d.expense > 0) {
                    filteredDays.push({
                        label: `${i + 1}`,
                        data: d
                    });
                }
            });

            const labels = filteredDays.map(fd => fd.label);
            const filteredData = filteredDays.map(fd => fd.data);

            renderMonthlyCombinedChart(labels, filteredData, selectedMonth, selectedYear);
        }
        updateComparison();
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
                    // Tﬂ+¶ -Êﬂ+÷ng chﬂ+Ïn c+¶ng kﬂ+¶ n-‚m tr¶¶ﬂ+¢c khi gﬂ¶Ìt n+¶t so s+Ình
                    const currentYear = new Date().getFullYear();
                    const currentMonthNum = new Date().getMonth() + 1;
                    const prevYear = currentYear - 1;

                    if (cfYear2) {
                        // Kiﬂ+‚m tra xem n-‚m tr¶¶ﬂ+¢c c+¶ trong danh s+Ìch chﬂ+Ïn kh+¶ng
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
                period: selectedMonthStr === "all" ? `N-‚m ${selectedYear}` : `Th+Ìng ${selectedMonthStr}/${selectedYear}`,
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

                const typeDT = (row["Loﬂ¶Ìi DT"] || "").trim();
                const isCompany = typeDT === "Company";
                const isVua = typeDT.toLowerCase().includes("vﬂ+¶a") || typeDT.toLowerCase().includes("vua");
                const isFarm = typeDT === "Farm" || typeDT === "";

                const loaiCP = (row["Loﬂ¶Ìi CP"] || "").trim().toLowerCase();

                const dtBong = parseFloat(row["Doanh Thu B+¶ng"]) || 0;
                const dtKhac = parseFloat(row["Doanh Thu Kh+Ìc"]) || 0;
                const chiPhi = parseFloat(row["Chi Ph+°"]) || 0;

                const rowRevenue = (chiPhi > 0 && dtKhac === chiPhi) ? 0 : dtKhac;

                if (isFarm) statement.revFarm += (dtBong + rowRevenue);
                else if (isCompany) statement.revCompany += rowRevenue;
                else if (isVua) statement.revVua += rowRevenue;

                statement.totalRev += (dtBong + rowRevenue);
                statement.totalExp += chiPhi;

                if (loaiCP === "expensed") statement.expensed += chiPhi;
                else if (loaiCP === "ph+Ûn" || loaiCP === "phan") statement.phanBon += chiPhi;
                else if (loaiCP === "thuﬂ+Êc" || loaiCP === "thuoc") statement.thuoc += chiPhi;
                else if (loaiCP === "c+¶ng" || loaiCP === "cong") statement.luong += chiPhi;
                else if (loaiCP === "l+˙i" || loaiCP === "lai") statement.lai += chiPhi;
                else if (loaiCP === "vﬂ¶°t t¶¶" || loaiCP === "vat tu" || loaiCP === "vﬂ¶°t t¶¶ kd") statement.vatTu += chiPhi;
                else if (loaiCP === "mua b+¶ng") statement.muaBong += chiPhi;
                else if (loaiCP === "vﬂ¶°n chuyﬂ+‚n" || loaiCP === "chi ph+° kh+Ìc" || loaiCP === "van chuyen" || loaiCP === "chi phi khac") statement.vanHanh += chiPhi;
                else if (chiPhi > 0) statement.vanHanh += chiPhi;
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
            return `<div class="comparison-col ${cls}"><span class="diff-tag">${sign}${formatCurrency(diff)} (${sign}${pct}%)</span></div>`;
        }

        function renderRow(label, v1, v2, type = "normal") {
            let rowClass = "statement-row";
            if (type === "title") rowClass += " main-title";
            if (type === "indented") rowClass += " indented";
            if (type === "total") rowClass += " total-line";
            if (type === "net") rowClass += " net-profit";

            return `
                <div class="${rowClass}">
                    <span class="statement-label">${label}</span>
                    <div class="comparison-col statement-value">${formatVal(v1)}</div>
                    ${isCmp ? `<div class="comparison-col statement-value" style="color: var(--text-light);">${formatVal(v2)}</div>` : ''}
                    ${getDiffHtml(v1, v2)}
                </div>
            `;
        }

        let html = '';

        if (isCmp) {
            html += `
                <div class="statement-row comparison-header">
                    <span class="statement-label">Hﬂ¶Ìng mﬂ+—c</span>
                    <div class="comparison-col">${s1.period}</div>
                    <div class="comparison-col">${s2.period}</div>
                    <div class="comparison-col">T-‚ng/Giﬂ¶˙m</div>
                </div>
            `;
        }

        html += renderRow("Doanh thu Farm", s1.revFarm, isCmp ? s2.revFarm : 0, "title");
        html += renderRow("Doanh thu kh+Ìc", s1.revCompany + s1.revVua, isCmp ? (s2.revCompany + s2.revVua) : 0, "title");
        html += renderRow("Company", s1.revCompany, isCmp ? s2.revCompany : 0, "indented");
        html += renderRow("Vﬂ+¶a", s1.revVua, isCmp ? s2.revVua : 0, "indented");

        html += renderRow("Tﬂ+Úng Doanh Thu", s1.totalRev, isCmp ? s2.totalRev : 0, "total");

        html += renderRow("Khﬂ¶—u trﬂ+Ω:", 0, 0, "title");
        html += renderRow("Expensed", s1.expensed, isCmp ? s2.expensed : 0, "indented");
        html += renderRow("Ph+Ûn b+¶n", s1.phanBon, isCmp ? s2.phanBon : 0, "indented");
        html += renderRow("Thuﬂ+Êc", s1.thuoc, isCmp ? s2.thuoc : 0, "indented");
        html += renderRow("L¶¶¶Ìng", s1.luong, isCmp ? s2.luong : 0, "indented");
        html += renderRow("L+˙i", s1.lai, isCmp ? s2.lai : 0, "indented");
        html += renderRow("Vﬂ¶°t T¶¶", s1.vatTu, isCmp ? s2.vatTu : 0, "indented");
        html += renderRow("Mua B+¶ng", s1.muaBong, isCmp ? s2.muaBong : 0, "indented");
        html += renderRow("Chi Ph+° Vﬂ¶°n H+·nh", s1.vanHanh, isCmp ? s2.vanHanh : 0, "indented");

        html += renderRow("Tﬂ+Úng Chi Ph+°", s1.totalExp, isCmp ? s2.totalExp : 0, "total");
        html += renderRow("Lﬂ+˙i nhuﬂ¶°n r+¶ng", s1.netProfit, isCmp ? s2.netProfit : 0, "net");

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
                datasets: [{ label: `Sﬂ¶˙n L¶¶ﬂ+˙ng (${year})`, data: qtyData, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderRadius: 4 }]
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
                    { label: 'Lﬂ+˙i Nhuﬂ¶°n', data: profitData, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 4 }
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
                datasets: [{ label: `Chi Ph+° (${year})`, data: expData, backgroundColor: 'rgba(239, 68, 68, 0.7)', borderRadius: 4 }]
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
                        type: 'bar', label: 'Doanh Thu Vﬂ+¶a', data: revVuaData,
                        backgroundColor: 'rgba(59, 130, 246, 0.85)', yAxisID: 'y',
                        stack: 'revenue'
                    },
                    {
                        type: 'bar', label: 'Chi Ph+°', data: expData,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)', yAxisID: 'y',
                        stack: 'expense'
                    },
                    {
                        type: 'line', label: 'Sﬂ¶˙n L¶¶ﬂ+˙ng (B+¶ng)', data: qtyData,
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
                        title: { display: true, text: 'Doanh Thu (VN-…)', font: { weight: 'bold' } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    y1: {
                        type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Sﬂ¶˙n l¶¶ﬂ+˙ng B+¶ng', font: { weight: 'bold' } }
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
                    title: { display: true, text: `BIﬂ+ÈU -…ﬂ+∆ DOANH THU & Sﬂ¶ÛN L¶ªﬂ+ÛNG - TH+¸NG ${month}/${year}`, font: { size: 16, weight: 'bold' }, padding: 20 },
                    datalabels: {
                        display: (context) => context.dataset.data[context.dataIndex] > 0,
                        formatter: (val, context) => {
                            if (context.dataset.type === 'line') return val.toLocaleString('vi-VN');
                            return val.toLocaleString('vi-VN') + ' GÈΩ';
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
            const mStr = label.replace('T', '').replace('Th+Ìng ', '');
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
                const type = (item["Loﬂ¶Ìi DT"] || "").trim().toLowerCase();
                if (filter === "Farm") return type === "farm" || type === "";
                if (filter === "Vﬂ+¶a") return type === "vﬂ+¶a" || type === "vua";
                if (filter === "Company") return type === "company" || type === "h-Êkd";
                return true;
            });
        }

        if (filtered.length === 0) return [];

        // Check which dataset is being hovered to show specific details
        // In 'nearest' mode with intersect: true, tooltipItems should typically contain the one specific item.
        const hoveredLabels = tooltipItems.map(ti => ti.dataset.label);
        
        // 1. If hovering over Expenses, show breakdown
        if (hoveredLabels.some(l => l && l.includes("Chi Ph+°"))) {
            const expenseDetails = filtered.filter(r => (r["Chi Ph+°"] || 0) > 0);
            if (expenseDetails.length > 0) {
                let lines = [" [CHI PH+Ï CHI TIﬂ¶+T]"];
                expenseDetails.forEach(r => {
                    const cat = (r["Loﬂ¶Ìi CP"] || "Kh+Ìc").trim();
                    const note = (r["Ghi ch+¶"] || "").trim();
                    lines.push(`G«Û ${cat}: ${formatCurrency(r["Chi Ph+°"]).replace('GÈΩ', '').trim()} ${note ? '- ' + note : ''}`);
                });
                if (lines.length > 1) return lines;
            }
        }

        // 2. If hovering over Doanh Thu Farm, show Buyers/Production details
        if (hoveredLabels.some(l => l && l.includes("Farm"))) {
            const revItems = filtered.filter(r => {
                const type = (r["Loﬂ¶Ìi DT"] || "").trim().toLowerCase();
                const isFarm = type === "farm" || type === "" || (r["Doanh Thu B+¶ng"] || 0) > 0;
                return isFarm && ((r["Doanh Thu B+¶ng"] || 0) > 0 || (r["Doanh Thu Kh+Ìc"] || 0) > 0);
            });
            if (revItems.length > 0) {
                let lines = [" [CHI TIﬂ¶+T FARM]"];
                revItems.forEach(r => {
                    const buyer = (r["Ng¶¶ﬂ+•i Mua"] || "").trim();
                    const amount = (r["Doanh Thu B+¶ng"] || 0) + (r["Doanh Thu Kh+Ìc"] || 0);
                    const note = (r["Ghi ch+¶"] || "").trim();
                    lines.push(`G«Û ${buyer || 'Kh+Ìch lﬂ¶+'}: ${formatCurrency(amount).replace('GÈΩ', '').trim()} ${note ? '- ' + note : ''}`);
                });
                return lines;
            }
        }

        // 3. If hovering over Doanh Thu Vﬂ+¶a, show Vﬂ+¶a details
        if (hoveredLabels.some(l => l && l.includes("Vﬂ+¶a"))) {
            const revItems = filtered.filter(r => {
                const type = (r["Loﬂ¶Ìi DT"] || "").trim().toLowerCase();
                return (type === "vﬂ+¶a" || type === "vua") && (r["Doanh Thu Kh+Ìc"] || 0) > 0;
            });
            if (revItems.length > 0) {
                let lines = [" [CHI TIﬂ¶+T Vﬂ+¶A]"];
                revItems.forEach(r => {
                    const buyer = (r["Ng¶¶ﬂ+•i Mua"] || "").trim();
                    const amount = r["Doanh Thu Kh+Ìc"] || 0;
                    const note = (r["Ghi ch+¶"] || "").trim();
                    lines.push(`G«Û ${buyer || 'Kh+Ìch lﬂ¶+'}: ${formatCurrency(amount).replace('GÈΩ', '').trim()} ${note ? '- ' + note : ''}`);
                });
                return lines;
            }
        }

        // 4. Default: General Summary (for total or point)
        const farmRev = filtered.filter(r => (r["Loﬂ¶Ìi DT"] || "").trim() === "" || (r["Loﬂ¶Ìi DT"] || "").toLowerCase() === "farm")
                               .reduce((sum, r) => sum + (r["Doanh Thu B+¶ng"] || 0), 0);
        const vuaRev = filtered.filter(r => (r["Loﬂ¶Ìi DT"] || "").toLowerCase().trim() === "vﬂ+¶a" || (r["Loﬂ¶Ìi DT"] || "").toLowerCase().trim() === "vua")
                              .reduce((sum, r) => sum + (r["Doanh Thu Kh+Ìc"] || 0), 0);
        const expTotal = filtered.reduce((sum, r) => sum + (r["Chi Ph+°"] || 0), 0);

        let sumLines = [];
        if (farmRev > 0) sumLines.push(`=É‹£ Farm: ${formatCurrency(farmRev).replace('GÈΩ', '').trim()}`);
        if (vuaRev > 0) sumLines.push(`=É≈ˇn+≈ Vﬂ+¶a: ${formatCurrency(vuaRev).replace('GÈΩ', '').trim()}`);
        if (expTotal > 0) sumLines.push(`=É∆+ Chi ph+°: ${formatCurrency(expTotal).replace('GÈΩ', '').trim()}`);

        const buyers = [...new Set(filtered.map(r => r["Ng¶¶ﬂ+•i Mua"]).filter(b => b))];
        if (buyers.length > 0) {
            sumLines.push(`=ÉÊÒ Kh+Ìch: ${buyers.slice(0, 3).join(', ')}${buyers.length > 3 ? '...' : ''}`);
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
            const typeDT = (row["Loﬂ¶Ìi DT"] || "").trim();
            const isCompany = typeDT === "Company";
            const isVua = typeDT === "Vﬂ+¶a" || typeDT === "vﬂ+¶a";
            const isFarm = typeDT === "Farm" || typeDT === "";

            const loaiCP = (row["Loﬂ¶Ìi CP"] || "").trim();

            const rawQty = parseFloat(row["Sﬂ+Ê l¶¶ﬂ+˙ng"]) || 0;
            const dtBong = parseFloat(row["Doanh Thu B+¶ng"]) || 0;
            const dtKhac = parseFloat(row["Doanh Thu Kh+Ìc"]) || 0;
            const chiPhi = parseFloat(row["Chi Ph+°"]) || 0;

            let rev = 0, exp = 0, q = 0;

            const isExpenseCompany = (loaiCP === "Expensed");
            const isExpenseVua = (loaiCP === "Vﬂ¶°t T¶¶ KD" || loaiCP === "Vﬂ¶°n Chuyﬂ+‚n" || loaiCP === "Mua B+¶ng");
            const isExpenseFarm = (!isExpenseCompany && !isExpenseVua);

            if (reportFilter === "Company") {
                rev = dtBong + (isCompany ? dtKhac : 0);
                q = rawQty;
                if (isExpenseCompany) exp = chiPhi;
            } else if (reportFilter === "Vﬂ+¶a") {
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
        document.getElementById('cmp-rev-y1').innerText = formatCompactStr(dataY1.rev) + ' GÈΩ';
        document.getElementById('cmp-rev-y2').innerText = formatCompactStr(dataY2.rev) + ' GÈΩ';
        document.getElementById('cmp-exp-y1').innerText = formatCompactStr(dataY1.exp) + ' GÈΩ';
        document.getElementById('cmp-exp-y2').innerText = formatCompactStr(dataY2.exp) + ' GÈΩ';
        document.getElementById('cmp-profit-y1').innerText = formatCompactStr(dataY1.profit) + ' GÈΩ';
        document.getElementById('cmp-profit-y2').innerText = formatCompactStr(dataY2.profit) + ' GÈΩ';

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

        // Lu+¶n sﬂ¶ªp xﬂ¶+p theo Ng+·y giﬂ¶˙m dﬂ¶∫n (-Ê¶Ìn mﬂ+¢i nhﬂ¶—t l+¨n -Êﬂ¶∫u) l+·m mﬂ¶+c -Êﬂ+Ônh
        filtered.sort((a, b) => (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0));

        // Tab Filter
        let sliceLimit = 20; // Giﬂ+¢i hﬂ¶Ìn 20 h+·ng gﬂ¶∫n nhﬂ¶—t cho tab "Tﬂ¶—t Cﬂ¶˙" theo y+¨u cﬂ¶∫u
        if (currentTableTab === 'farm') {
            filtered = filtered.filter(item => {
                const type = (item["Loﬂ¶Ìi DT"] || "").trim().toLowerCase();
                const isVua = type.includes("vﬂ+¶a") || type.includes("vua");
                const isCmp = type.includes("company") || type.includes("h-Êkd");

                // Nﬂ¶+u l+· Vﬂ+¶a hoﬂ¶+c Company th+º ﬂ¶¨n khﬂ+≈i tab Farm
                if (isVua || isCmp) return false;

                // Nﬂ¶+u r+¶ng chi ph+° (kh+¶ng c+¶ doanh thu b+¶ng v+· kh+¶ng c+¶ ng¶¶ﬂ+•i mua) th+º ﬂ¶¨n
                const dtBong = parseFloat(String(item["Doanh Thu B+¶ng"] || "0").replace(/[^\d]/g, '')) || 0;
                const note = (item["Ghi Ch+¶ Chi Ph+°"] || item["Ghi Ch+¶"] || "").toLowerCase();
                if (dtBong === 0 && (note.includes("chi ph+°") || note.includes("tiﬂ+¸n l+˙i"))) {
                    // C+¶ thﬂ+‚ l+· chi ph+° r+¶ng
                }

                return true;
            });
            sliceLimit = 15;
        } else if (currentTableTab === 'vua') {
            filtered = filtered.filter(item => {
                const type = (item["Loﬂ¶Ìi DT"] || "").trim().toLowerCase();
                return type === "vﬂ+¶a" || type === "vua";
            });
            sliceLimit = 15;
        } else if (currentTableTab === 'expense') {
            filtered = filtered.filter(item => {
                const cpVal = parseFloat(String(item["Chi Ph+°"] || "0").replace(/[^\d]/g, '')) || 0;
                return cpVal > 0 || (item["Loﬂ¶Ìi CP"] && item["Loﬂ¶Ìi CP"].trim() !== "");
            });
            sliceLimit = 15;
        }

        // Search Filter
        const searchTerm = searchBuyerInput.value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(item =>
                (item["Ng¶¶ﬂ+•i Mua"] || "").toLowerCase().includes(searchTerm) ||
                (item["Ghi Ch+¶"] || "").toLowerCase().includes(searchTerm) ||
                (item["Loﬂ¶Ìi CP"] || "").toLowerCase().includes(searchTerm) ||
                (item["Ng+·y"] || "").toLowerCase().includes(searchTerm)
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
                if (sortState.column === 'Ng+·y') {
                    valA = a.parsedDate.getTime();
                    valB = b.parsedDate.getTime();
                }
                if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const paginatedData = filtered.slice(0, sliceLimit);
        renderTable(paginatedData);
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
        return rawData.map(item => {
            let rowDate = new Date(); // Default if invalid
            if (item["Ng+·y"]) {
                if (!isNaN(item["Ng+·y"])) {
                    rowDate = excelToJsDate(parseFloat(item["Ng+·y"]));
                } else {
                    const parts = item["Ng+·y"].split(/[-/]/);
                    if (parts.length === 3) {
                        rowDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    } else {
                        rowDate = new Date(item["Ng+·y"]);
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
                "Status": (item["Status"] || "").trim(),
                "Sﬂ+Ê l¶¶ﬂ+˙ng": parseSheetNum(item["Sﬂ+Ê l¶¶ﬂ+˙ng"]),
                "Gi+Ì": parseSheetNum(item["Gi+Ì"]),
                "Doanh Thu B+¶ng": parseSheetNum(item["Doanh Thu B+¶ng"]),
                "Chi Ph+°": parseSheetNum(item["Chi Ph+°"]),
                "Tiﬂ+¸n Phﬂ¶˙i Thu": parseSheetNum(item["Tiﬂ+¸n Phﬂ¶˙i Thu"]),
                "Doanh Thu Kh+Ìc": parseSheetNum(item["Doanh Thu Kh+Ìc"]),
                "-…+˙ Thu": parseSheetNum(item["-…+˙ Thu"])
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
    document.getElementById('sync-gsheet-btn').addEventListener('click', () => {
        document.getElementById('sync-gsheet-btn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> -…ang tﬂ¶˙i...';

        showTableSkeleton();
        showKPISkeleton();
        showCashflowSkeleton();

        const sheetId = '1eOTLVBUOJg9ppOu4tkLUXbzfrOHAGK0bEPSwTbl7v4U';

        // Define global callback for JSONP
        window.handleGvizResponse = function (data) {
            const scriptNode = document.getElementById('gsheet-script');
            if (scriptNode) scriptNode.remove();

            if (data.status === 'error') {
                alert("Lﬂ+˘i tﬂ+Ω Google Sheets: " + data.errors[0].detailed_message);
                document.getElementById('sync-gsheet-btn').innerHTML = '<i class="fa-solid fa-sync"></i> -…ﬂ+Ùng bﬂ+÷ dﬂ+ª liﬂ+Áu mﬂ+¢i';
                return;
            }

            const cols = data.table.cols.map(c => c ? c.label : '');
            const parsedData = data.table.rows.map(row => {
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
            document.getElementById('sync-gsheet-btn').innerHTML = '<i class="fa-solid fa-sync"></i> -…ﬂ+Ùng bﬂ+÷ dﬂ+ª liﬂ+Áu mﬂ+¢i';
        };

        // Create script tag for JSONP
        const script = document.createElement('script');
        script.id = 'gsheet-script';
        script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:handleGvizResponse&sheet=Farm`;

        // Handle network errors for script loading
        script.onerror = function () {
            alert("Kh+¶ng thﬂ+‚ kﬂ¶+t nﬂ+Êi -Êﬂ¶+n Google Sheets. H+˙y kiﬂ+‚m tra kﬂ¶+t nﬂ+Êi mﬂ¶Ìng cﬂ+∫a bﬂ¶Ìn.");
            document.getElementById('sync-gsheet-btn').innerHTML = '<i class="fa-solid fa-sync"></i> -…ﬂ+Ùng bﬂ+÷ dﬂ+ª liﬂ+Áu mﬂ+¢i';
            script.remove();
        };

        document.body.appendChild(script);
    });

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'expense-item';
            row.style.cssText = 'display: grid; grid-template-columns: 1.5fr 1.5fr 2fr 35px; gap: 10px; align-items: center;';
            row.innerHTML = `
                <div class="form-group" style="margin: 0;">
                    <select class="exp-type" style="width: 100%; border: 1px solid #f87171;">
                        <option value="Chi Ph+° Kh+Ìc">Chi Ph+° Kh+Ìc</option>
                        <option value="Thuﬂ+Êc">Thuﬂ+Êc</option>
                        <option value="Ph+Ûn">Ph+Ûn</option>
                        <option value="L+˙i">L+˙i</option>
                        <option value="C+¶ng">C+¶ng</option>
                        <option value="Mua B+¶ng">Mua B+¶ng</option>
                        <option value="Vﬂ¶°t T¶¶ KD">Vﬂ¶°t T¶¶ KD</option>
                        <option value="Vﬂ¶°n Chuyﬂ+‚n">Vﬂ¶°n Chuyﬂ+‚n</option>
                        <option value="Expensed">Expensed</option>
                    </select>
                </div>
                <div class="form-group" style="margin: 0;"><input type="text" placeholder="Sﬂ+Ê tiﬂ+¸n" class="exp-amount money-input" style="border: 1px solid #f87171; color: #b91c1c; font-weight: bold;"></div>
                <div class="form-group" style="margin: 0;"><input type="text" placeholder="Ghi ch+¶ chi ph+°" class="exp-note" style="border: 1px solid #f87171;"></div>
                <button type="button" class="del-expense-btn" style="background: none; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer; padding: 0;" title="Xo+Ì"><i class="fa-solid fa-circle-xmark"></i></button>
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
                    alert("Phﬂ¶˙i c+¶ +°t nhﬂ¶—t mﬂ+÷t d+¶ng chi ph+°.");
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
            e.target.classList.add('active');
            // update tab state
            currentTableTab = e.currentTarget.dataset.tab;

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

            if (!confirm(`Bﬂ¶Ìn c+¶ chﬂ¶ªc chﬂ¶ªn muﬂ+Ên xo+Ì ${checkedBoxes.length} d+¶ng dﬂ+ª liﬂ+Áu n+·y khﬂ+≈i Google Sheets?`)) return;

            if (WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
                alert("Vui l+¶ng cﬂ¶—u h+ºnh WEB_APP_URL trong app.js!");
                return;
            }

            document.body.style.cursor = 'wait';
            bulkDeleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> -…ang Xo+Ì...';
            bulkDeleteBtn.disabled = true;

            let successCount = 0;
            const rowsToDelete = Array.from(checkedBoxes).map(cb => JSON.parse(cb.value));

            try {
                // Sﬂ¶ªp xﬂ¶+p ng¶¶ﬂ+˙c -Êﬂ+‚ tr+Ình vﬂ¶—n -Êﬂ+¸ index nﬂ¶+u c+¶ (nh¶¶ng ﬂ+É -Ê+Ûy m+ºnh d+¶ng findIndex n+¨n ko sao)
                for (let i = 0; i < rowsToDelete.length; i++) {
                    const rowData = rowsToDelete[i];
                    bulkDeleteBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> -…ang Xo+Ì (${i + 1}/${rowsToDelete.length})...`;

                    const response = await fetch(WEB_APP_URL, {
                        method: "POST",
                        body: JSON.stringify({ action: "delete", data: rowData }),
                        headers: { "Content-Type": "text/plain;charset=utf-8" }
                    });
                    const result = await response.json();
                    if (result.status === "success") {
                        successCount++;
                        // T+ºm v+· x+¶a khﬂ+≈i bﬂ+÷ nhﬂ+¢ -Êﬂ+Ám local
                        const idx = farmData.findIndex(r => {
                            const matchNgay = r["Ng+·y"] === rowData["Ng+·y"];
                            const matchNguoiMua = (r["Ng¶¶ﬂ+•i Mua"] || "") === (rowData["Ng¶¶ﬂ+•i Mua"] || "");
                            const matchSL = String(r["Sﬂ+Ê l¶¶ﬂ+˙ng"] || "0") === String(rowData["Sﬂ+Ê l¶¶ﬂ+˙ng"] || "0");
                            const matchLoai = (r["Ph+Ûn Loﬂ¶Ìi B+¶ng"] || "") === (rowData["Ph+Ûn Loﬂ¶Ìi B+¶ng"] || "");
                            const matchCP = String(r["Chi Ph+°"] || "0") === String(rowData["Chi Ph+°"] || "0");
                            const matchLoaiCP = (r["Loﬂ¶Ìi CP"] || "") === (rowData["Loﬂ¶Ìi CP"] || "");

                            return matchNgay && matchNguoiMua && matchSL && matchLoai && matchCP && matchLoaiCP;
                        });
                        if (idx >= 0) farmData.splice(idx, 1);
                    }
                    // -…ﬂ+˙i 200ms giﬂ+ªa c+Ìc y+¨u cﬂ¶∫u -Êﬂ+‚ -Êﬂ¶˙m bﬂ¶˙o t+°nh ﬂ+Ún -Êﬂ+Ônh cﬂ+∫a Apps Script
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                alert(`-…+˙ xo+Ì th+·nh c+¶ng ${successCount}/${rowsToDelete.length} -Ê¶Ìn dﬂ+ª liﬂ+Áu.`);
            } catch (err) {
                console.error(err);
                alert("Lﬂ+˘i kﬂ¶+t nﬂ+Êi khi xo+Ì h+·ng loﬂ¶Ìt.");
            } finally {
                document.body.style.cursor = 'default';
                bulkDeleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Xo+Ì C+Ìc D+¶ng -…+˙ Chﬂ+Ïn (<span id="bulk-delete-count">0</span>)';
                bulkDeleteBtn.disabled = false;
                selectAllCb.checked = false;

                // Sync lﬂ¶Ìi dﬂ+ª liﬂ+Áu -Êﬂ+‚ -Êﬂ¶˙m bﬂ¶˙o khﬂ+¢p ho+·n to+·n vﬂ+¢i Sheet
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

        if (!confirm("Bﬂ¶Ìn c+¶ chﬂ¶ªc chﬂ¶ªn muﬂ+Ên l¶¶u c+Ìc d+¶ng dﬂ+ª liﬂ+Áu n+·y?")) {
            return;
        }

        const entryMode = entryTypeSelect ? entryTypeSelect.value : 'farm';
        // Shared fields
        const dInput = new Date(document.getElementById('date-input').value);
        const dateStr = formatDateVietnamese(dInput); // D+¶ng -Êﬂ+Ônh dﬂ¶Ìng chuﬂ¶¨n DD/MM/YYYY -Êﬂ+‚ khﬂ+¢p vﬂ+¢i Sheet
        const statusVal = document.getElementById('status-input').value; // Removed default "Ch¶¶a Xong"
        const buyerVal = document.getElementById('buyer-input').value;
        const noteVal = ""; // Ghi Ch+¶ Cuﬂ+Êc Xe -Ê+˙ bﬂ+Ô loﬂ¶Ìi bﬂ+≈

        const submitBtn = form.querySelector('button[type="submit"]');

        let payloadRowsStr = [];
        let payloadRowsParsed = [];

        if (entryMode === 'farm') {
            const items = flowerItemsContainer.querySelectorAll('.flower-item');

            if (items.length === 0) {
                alert("Vui l+¶ng th+¨m +°t nhﬂ¶—t 1 d+¶ng b+¶ng!");
                return;
            }

            items.forEach((item, index) => {
                const typeStr = item.querySelector('.fw-type').value || "B+¶ng";
                const qValue = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const pValue = parseMoney(item.querySelector('.fw-price').value);
                const dtBong = qValue * pValue;

                payloadRowsStr.push({
                    "Ng+·y": dateStr,
                    "Status": statusVal,
                    "Ng¶¶ﬂ+•i Mua": buyerVal,
                    "Sﬂ+Ê l¶¶ﬂ+˙ng": qValue.toString(),
                    "Gi+Ì": pValue.toString(),
                    "Doanh Thu B+¶ng": dtBong.toString(),
                    "Ph+Ûn Loﬂ¶Ìi B+¶ng": typeStr,
                    "Ghi Ch+¶": noteVal,
                    "-…+˙ Thu": "", "Tiﬂ+¸n Phﬂ¶˙i Thu": "", "Ghi Ch+¶ Vﬂ+¶a thu": "", "Doanh Thu Kh+Ìc": "",
                    "Loﬂ¶Ìi DT": "Farm", "Chi Ph+°": "", "Loﬂ¶Ìi CP": "", "Ghi Ch+¶ Chi Ph+°": ""
                });

                payloadRowsParsed.push({
                    "Ng+·y": dateStr, "Status": statusVal, "Ng¶¶ﬂ+•i Mua": buyerVal, "Ph+Ûn Loﬂ¶Ìi B+¶ng": typeStr, "Ghi Ch+¶": noteVal,
                    parsedDate: dInput, "Sﬂ+Ê l¶¶ﬂ+˙ng": qValue, "Gi+Ì": pValue, "Doanh Thu B+¶ng": dtBong, "Chi Ph+°": 0, "Tiﬂ+¸n Phﬂ¶˙i Thu": 0, "Doanh Thu Kh+Ìc": 0, "Loﬂ¶Ìi DT": "Farm"
                });
            });
        } else if (entryMode === 'vua') {
            // Vﬂ+¶a Mode
            const shipCost = parseMoney(vuaShipCostInput.value);
            const vattuCost = parseMoney(vuaVattuCostInput.value);
            const totalCollect = parseMoney(vuaTotalCollectInput.value);
            const items = flowerItemsContainer.querySelectorAll('.flower-item');

            let sumCost = 0;
            items.forEach((item) => {
                const q = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const p = parseMoney(item.querySelector('.fw-price').value);
                sumCost += (q * p);
            });
            const expectedRevenue = totalCollect - sumCost;

            items.forEach((item, index) => {
                const typeStr = item.querySelector('.fw-type').value || "B+¶ng";
                const qValue = parseFloat(item.querySelector('.fw-qty').value) || 0;
                const pValue = parseMoney(item.querySelector('.fw-price').value);
                const dtBong = qValue * pValue;

                const tPhaiThuStr = index === 0 ? totalCollect.toString() : "";
                const dtKhacStr = index === 0 ? expectedRevenue.toString() : "";

                let chiPhiStr = "";
                let loaiCPStr = "";

                if (index === 0 && shipCost > 0) {
                    chiPhiStr = shipCost.toString();
                    loaiCPStr = "Vﬂ¶°n Chuyﬂ+‚n";
                }

                payloadRowsStr.push({
                    "Ng+·y": dateStr, "Status": statusVal, "Ng¶¶ﬂ+•i Mua": buyerVal, "Sﬂ+Ê l¶¶ﬂ+˙ng": qValue.toString(), "Gi+Ì": pValue.toString(), "Doanh Thu B+¶ng": dtBong.toString(), "Ph+Ûn Loﬂ¶Ìi B+¶ng": typeStr, "Ghi Ch+¶": noteVal,
                    "-…+˙ Thu": "", "Tiﬂ+¸n Phﬂ¶˙i Thu": tPhaiThuStr, "Ghi Ch+¶ Vﬂ+¶a thu": "", "Doanh Thu Kh+Ìc": dtKhacStr, "Loﬂ¶Ìi DT": "Vﬂ+¶a", "Chi Ph+°": chiPhiStr, "Loﬂ¶Ìi CP": loaiCPStr, "Ghi Ch+¶ Chi Ph+°": ""
                });

                payloadRowsParsed.push({
                    "Ng+·y": dateStr, "Status": statusVal, "Ng¶¶ﬂ+•i Mua": buyerVal, "Ph+Ûn Loﬂ¶Ìi B+¶ng": typeStr, "Ghi Ch+¶": noteVal, "Loﬂ¶Ìi DT": "Vﬂ+¶a", "Loﬂ¶Ìi CP": loaiCPStr,
                    parsedDate: dInput, "Sﬂ+Ê l¶¶ﬂ+˙ng": qValue, "Gi+Ì": pValue, "Doanh Thu B+¶ng": dtBong, "Tiﬂ+¸n Phﬂ¶˙i Thu": index === 0 ? totalCollect : 0, "Chi Ph+°": index === 0 ? shipCost : 0, "Doanh Thu Kh+Ìc": index === 0 ? expectedRevenue : 0
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
                            "Ng+·y": dateStr,
                            "Status": "Xong",
                            "Ng¶¶ﬂ+•i Mua": buyerVal,
                            "Chi Ph+°": expAmount.toString(),
                            "Loﬂ¶Ìi CP": expType,
                            "Ghi Ch+¶ Chi Ph+°": expNote
                        }
                    });

                    payloadRowsParsed.push({
                        "Ng+·y": dateStr, "Status": "Xong", "Ng¶¶ﬂ+•i Mua": buyerVal, "Chi Ph+°": expAmount, "Loﬂ¶Ìi CP": expType, "Ghi Ch+¶ Chi Ph+°": expNote,
                        parsedDate: dInput, "Sﬂ+Ê l¶¶ﬂ+˙ng": 0, "Gi+Ì": 0, "Doanh Thu B+¶ng": 0, "Tiﬂ+¸n Phﬂ¶˙i Thu": 0, "Doanh Thu Kh+Ìc": 0
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

        if (WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
            alert("Vui l+¶ng cﬂ¶—u h+ºnh WEB_APP_URL! Dﬂ+ª liﬂ+Áu hiﬂ+Án tﬂ¶Ìi chﬂ+Î l¶¶u tﬂ¶Ìm.");
            payloadRowsParsed.forEach(p => farmData.unshift(p));
            applyFiltersAndRender();
            return;
        }

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> -…ang l¶¶u...';
        submitBtn.disabled = true;

        try {
            for (let i = 0; i < payloadRowsStr.length; i++) {
                const response = await fetch(WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify(payloadRowsStr[i]),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status !== "success") throw new Error(result.message || "Lﬂ+˘i cﬂ¶°p nhﬂ¶°t G-Sheet.");
            }

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

            // Kh+¶i phﬂ+—c lﬂ¶Ìi mﬂ+÷t d+¶ng chuﬂ¶¨n cho B+¶ng
            if (flowerItemsContainer) {
                flowerItemsContainer.innerHTML = `
                    <div class="flower-item" style="display: grid; grid-template-columns: 1.2fr 0.6fr 1.2fr 1.5fr 30px; gap: 10px; align-items: center;">
                        <div class="form-group" style="margin: 0;">
                            <select class="fw-type" style="width: 100%; border: 1px solid var(--border-color); border-radius: 4px; padding: 6px;" required>
                                <option value="X+¶ ngoﬂ¶Ìi">X+¶ ngoﬂ¶Ìi</option>
                                <option value="X+¶ nﬂ+÷i">X+¶ nﬂ+÷i</option>
                                <option value="Ecuador">Ecuador</option>
                                <option value="Ph+Ìp">Ph+Ìp</option>
                                <option value="Trﬂ¶ªng +¶">Trﬂ¶ªng +¶</option>
                                <option value="+ˆ Hﬂ+Ùng">+ˆ Hﬂ+Ùng</option>
                                <option value="+ˆ Trﬂ¶ªng">+ˆ Trﬂ¶ªng</option>
                                <option value="Simmo">Simmo</option>
                                <option value="Cam Ch+Ìy">Cam Ch+Ìy</option>
                                <option value="Vitto">Vitto</option>
                                <option value="Lﬂ¶Ìc Thﬂ¶∫n">Lﬂ¶Ìc Thﬂ¶∫n</option>
                                <option value="Hﬂ++ Trﬂ+¨ng">Hﬂ++ Trﬂ+¨ng</option>
                                <option value="Kh+Ìc">Kh+Ìc</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;"><input type="number" placeholder="SL" class="fw-qty" min="0" required></div>
                        <div class="form-group" style="margin: 0;"><input type="text" placeholder="Gi+Ì" class="fw-price money-input" required></div>
                        <div class="form-group" style="margin: 0;"><input type="text" placeholder="Th+·nh tiﬂ+¸n" class="fw-total" readonly style="background: #f9fafb; color: #374151; font-weight: bold; border: 1px solid var(--border-color); border-radius: 4px; padding: 6px; width: 100%;"></div>
                        <button type="button" class="del-flower-btn" style="background: none; border: none; color: var(--danger); font-size: 1.2rem; cursor: pointer; padding: 0;" title="Xo+Ì"><i class="fa-solid fa-circle-xmark"></i></button>
                    </div>
                `;
                attachFlowerRowEvents(flowerItemsContainer.querySelector('.flower-item'));
            }

            if (entryTypeSelect && entryTypeSelect.value === 'vua') calculateVuaTotals();

            // Kh+¶i phﬂ+—c lﬂ¶Ìi mﬂ+÷t d+¶ng chuﬂ¶¨n cho Chi ph+°
            if (expenseItemsContainer) {
                expenseItemsContainer.innerHTML = `
                    <div class="expense-item" style="display: grid; grid-template-columns: 1.5fr 1.5fr 2fr 35px; gap: 10px; align-items: center;">
                        <div class="form-group" style="margin: 0;">
                            <select class="exp-type" style="width: 100%; border: 1px solid #f87171;">
                                <option value="Chi Ph+° Kh+Ìc">Chi Ph+° Kh+Ìc</option>
                                <option value="Thuﬂ+Êc">Thuﬂ+Êc</option>
                                <option value="Ph+Ûn">Ph+Ûn</option>
                                <option value="L+˙i">L+˙i</option>
                                <option value="C+¶ng">C+¶ng</option>
                                <option value="Mua B+¶ng">Mua B+¶ng</option>
                                <option value="Vﬂ¶°t T¶¶ KD">Vﬂ¶°t T¶¶ KD</option>
                                <option value="Vﬂ¶°n Chuyﬂ+‚n">Vﬂ¶°n Chuyﬂ+‚n</option>
                                <option value="Expensed">Expensed</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;"><input type="text" placeholder="Sﬂ+Ê tiﬂ+¸n" class="exp-amount money-input" style="border: 1px solid #f87171; color: #b91c1c; font-weight: bold;"></div>
                        <div class="form-group" style="margin: 0;"><input type="text" placeholder="Ghi ch+¶ chi ph+°" class="exp-note" style="border: 1px solid #f87171;"></div>
                        <button type="button" class="del-expense-btn" style="background: none; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer; padding: 0;" title="Xo+Ì"><i class="fa-solid fa-circle-xmark"></i></button>
                    </div>
                `;
                attachExpenseRowEvents(expenseItemsContainer.querySelector('.expense-item'));
            }

            alert("-…+˙ l¶¶u th+·nh c+¶ng " + payloadRowsStr.length + " d+¶ng dﬂ+ª liﬂ+Áu!");

        } catch (error) {
            console.error(error);
            alert("Lﬂ+˘i khi ghi dﬂ+ª liﬂ+Áu l+¨n Sheets: " + error.message);
        } finally {
            submitBtn.innerHTML = 'L¶¶u Dﬂ+ª Liﬂ+Áu';
            submitBtn.disabled = false;
        }
    });

    // Initial render attempt: first from cache, then sync in background
    loadFromCache();
    applyFiltersAndRender();

    // Auto-sync data from Google Sheets on page load
    const syncBtn = document.getElementById('sync-gsheet-btn');
    if (syncBtn) syncBtn.click();
});
