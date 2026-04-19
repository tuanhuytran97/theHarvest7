/**
 * INVESTMENT MODULE (BUFFETT STYLE)
 * Tách biệt logic quản lý danh mục đầu tư
 */

// --- Global State ---
let invPortfolioData = []; 
let invCashFlowData = [];  

// --- 0. Rendering & Shorthand Logic (Hoisted) ---
function renderInvestmentPortfolio() {
    const tbody = document.getElementById('inv-portfolio-body');
    let totalCapital = 0, totalCurrent = 0, totalDivs = 0, totalIntrinsic = 0;

    if (!tbody) {
        console.warn("Investment table body not found in DOM yet.");
        return;
    }

    tbody.innerHTML = '';
    if (invPortfolioData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;">Chưa có danh mục đầu tư nào.</td></tr>`;
    } else {
        invPortfolioData.forEach(item => {
            const unitPrice = parseFloat(item["Giá Hiện Tại"]) || 0;
            const totalQty = item.totalQty || 1; 
            const currentVal = unitPrice * totalQty;
            
            const unitIntrinsic = parseFloat(item["Định Giá Lý Thuyết"]) || 0;
            const intrinsicVal = unitIntrinsic * totalQty; 

            totalCapital += item.capital || 0;
            totalCurrent += currentVal;
            totalDivs += parseFloat(item["Dòng Tiền Đã Nhận"]) || item.divs || 0;
            totalIntrinsic += intrinsicVal;

            let startDate = new Date();
            const rawDate = item["Ngày Bắt Đầu"];
            if (rawDate) {
                const dateStr = String(rawDate);
                if (!isNaN(rawDate) && rawDate > 20000) { 
                     startDate = window.utils && window.utils.excelToJsDate ? 
                                 window.utils.excelToJsDate(parseFloat(rawDate)) : 
                                 new Date(new Date(1899, 11, 30).getTime() + parseFloat(rawDate) * 86400000);
                } else if (dateStr.includes("T")) { 
                     startDate = new Date(dateStr);
                } else { 
                     const parts = dateStr.split("/");
                     if (parts.length === 3) startDate = new Date(parts[2], parts[1] - 1, parts[0]);
                     else startDate = new Date(dateStr);
                }
            }

            const diffDays = Math.floor(Math.abs(new Date() - startDate) / (1000 * 60 * 60 * 24));
            const months = Math.floor(diffDays / 30);
            const timeStr = months > 11 ? `${Math.floor(months / 12)} năm ${months % 12} tháng` : `${months} tháng`;

            const profitVal = (currentVal + (item.divs || 0)) - (item.capital || 0);
            const profitStr = window.formatShorthandCurrency ? window.formatShorthandCurrency(profitVal, true) : profitVal;

            const typeStr = String(item["Phân Loại"] || "").trim().toLowerCase();
            let displayUnitPrice = "-";
            if (typeStr === "cổ phiếu" || typeStr === "etf") {
                displayUnitPrice = window.formatCurrency ? window.formatCurrency(unitPrice) : unitPrice;
            }

            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.title = `Luận điểm Mua: ${item["Luận Điểm Đầu Tư"]}`;
            tr.innerHTML = `
                <td style="font-weight: 700; color: #0f172a;">${item["Mã/Tên"]} <br> <span style="font-size: 0.75rem; color: #64748b; font-weight: normal;">${item["Phân Loại"]}</span></td>
                <td style="font-weight: 700; color: #3b82f6;">${new Intl.NumberFormat('vi-VN').format(totalQty)}</td>
                <td style="color: #eab308; font-weight: 700;">${displayUnitPrice}</td>
                <td style="font-weight: 600;">${window.formatShorthandCurrency ? window.formatShorthandCurrency(item.capital) : item.capital}</td>
                <td style="color: #0f172a; font-weight: 700;">${window.formatShorthandCurrency ? window.formatShorthandCurrency(currentVal) : currentVal}</td>
                <td style="font-weight: bold;"><span style="color: ${profitVal >= 0 ? '#10b981' : '#ef4444'}">${profitStr}</span></td>
                <td>${timeStr}</td>
                <td>${window.formatShorthandCurrency ? window.formatShorthandCurrency(item["Định Giá Lý Thuyết"]) : item["Định Giá Lý Thuyết"]}</td>
                <td><span class="status-badge status-pending" style="background:#f1f5f9; color:#475569;">Đang nắm giữ</span></td>
                <td style="display: flex; gap: 8px;">
                    <button class="action-btn" title="Giao Dịch" onclick="window.openInvTxModal('${item["Mã/Tên"]}')" style="background: #10b981; color: white;"><i class="fa-solid fa-money-bill-transfer"></i></button>
                    <button class="action-btn" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // UPDATE KPIs
    const kpiNav = document.getElementById('inv-kpi-nav');
    const kpiCagr = document.getElementById('inv-kpi-cagr');
    const kpiMos = document.getElementById('inv-kpi-mos');
    const kpiDivs = document.getElementById('inv-kpi-dividends');

    if (kpiNav && window.formatCurrency) kpiNav.innerText = window.formatCurrency(totalCurrent);
    if (kpiDivs && window.formatCurrency) kpiDivs.innerText = window.formatCurrency(totalDivs);

    if (kpiMos && totalIntrinsic > 0) {
        const mos = ((totalIntrinsic - totalCurrent) / totalIntrinsic) * 100;
        kpiMos.innerText = mos > 0 ? `${mos.toFixed(1)}%` : "0%";
    }
    if (kpiCagr && totalCapital > 0) {
        const returnPct = ((totalCurrent + totalDivs - totalCapital) / totalCapital) * 100;
        kpiCagr.innerText = returnPct >= 0 ? `+${returnPct.toFixed(1)}%` : `${returnPct.toFixed(1)}%`;
    }
}
window.renderInvestmentPortfolio = renderInvestmentPortfolio;

// --- 1. Load Cache IMMEDIATELY (Instant Load) ---
function loadInvCache() {
    const cachedPortfolio = localStorage.getItem('cached_inv_portfolio');
    const cachedCashFlow = localStorage.getItem('cached_inv_cashflow');
    if (cachedPortfolio && cachedCashFlow) {
        try {
            invPortfolioData = JSON.parse(cachedPortfolio);
            invCashFlowData = JSON.parse(cachedCashFlow);
            console.log("Instant Cache Loaded:", invPortfolioData.length);
            // Attempt to render immediately. Since script is loaded at </body>, 
            // the DOM elements should be available even without DOMContentLoaded.
            renderInvestmentPortfolio();
        } catch (e) {
            console.error("Cache Parse Error:", e);
        }
    }
}
loadInvCache();

// --- 2. Heavy Logic & Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. DOM Elements
    const modalInvest = document.getElementById('modal-invest-checklist');
    const btnAddInv = document.getElementById('btn-add-investment');
    const btnCancelInv = document.getElementById('btn-cancel-inv');
    const btnSaveInv = document.getElementById('btn-save-inv');
    const chkRules = document.querySelectorAll('.inv-rule-chk');
    const invInputName = document.getElementById('inv-input-name');
    const invInputType = document.getElementById('inv-input-type');
    const invInputCapital = document.getElementById('inv-input-capital');
    const invInputQty = document.getElementById('inv-input-qty');
    const invInputIntrinsic = document.getElementById('inv-input-intrinsic');
    const invInputNote = document.getElementById('inv-input-note');
    const btnSyncPrices = document.getElementById('btn-sync-prices');

    // Ensure cache has rendered when DOM is fully ready
    renderInvestmentPortfolio();

    // 2. Data Sync Logic (Background Fetch)
    window.fetchInvestmentData = async function () {
        const savedView = localStorage.getItem("active_app_view");
        // Chỉ fetch nếu đang ở tab đầu tư để tiết kiệm tài nguyên
        if (savedView !== 'investment') return;

        try {
            const token = window.getToken ? window.getToken() : null;
            if (!token) return;

            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "get_investment_data",
                    token: token
                }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const res = await response.json();

            if (res.status === "success") {
                // Parse Portfolio
                const rowsDM = res.portfolio || [];
                if (rowsDM.length > 1) {
                    const headers = rowsDM[0];
                    invPortfolioData = rowsDM.slice(1).map(row => {
                        let obj = {};
                        headers.forEach((h, i) => obj[h] = row[i]);
                        obj.capital = 0; 
                        return obj;
                    });
                }

                // Parse Cash Flow
                const rowsDT = res.cashflow || [];
                if (rowsDT.length > 1) {
                    const headers = rowsDT[0];
                    invCashFlowData = rowsDT.slice(1).map(row => {
                        let obj = {};
                        headers.forEach((h, i) => obj[h] = row[i]);
                        return obj;
                    });
                }

                // Aggregation
                invPortfolioData.forEach(p => {
                    const related = invCashFlowData.filter(cf => cf["Mã/Tên"] === p["Mã/Tên"]);
                    let qty = 0;
                    let totalDivCash = 0;
                    p.capital = related.reduce((sum, cf) => {
                        const type = String(cf["Loại Giao Dịch"] || "");
                        const amt = parseFloat(cf["Số Tiền"]) || 0;
                        const sl = parseFloat(cf["Số Lượng"]) || 0;
                        
                        if (type === "Mua") {
                            qty += sl;
                            return sum + amt;
                        } else if (type === "Bán") {
                            qty -= sl;
                            return sum - amt;
                        } else if (type.includes("Cổ Tức")) {
                            if (type.includes("Cổ Phiếu") || type.includes("Tiền & CP") || type === "Cổ Tức (Cổ Phiếu)") {
                                qty += sl;
                            }
                            if (type.includes("Tiền") || type === "Cổ Tức (Tiền)") {
                                totalDivCash += amt;
                            }
                        }
                        return sum;
                    }, 0);
                    p.totalQty = qty;
                    p.divs = totalDivCash;
                });

                // Update Cache
                localStorage.setItem('cached_inv_portfolio', JSON.stringify(invPortfolioData));
                localStorage.setItem('cached_inv_cashflow', JSON.stringify(invCashFlowData));

                renderInvestmentPortfolio();
            }
        } catch (e) {
            console.error("Investment Fetch Error:", e);
        }
    };

    // Initialize Auto-load if in correct view
    const currentView = localStorage.getItem("active_app_view");
    if (currentView === 'investment') {
        window.fetchInvestmentData();
    }

    // 3. UI Handlers (Shortened for brevity)
    if (btnAddInv) btnAddInv.addEventListener('click', () => {
        if (modalInvest) modalInvest.style.display = 'flex';
        chkRules.forEach(chk => chk.checked = false);
        if (btnSaveInv) btnSaveInv.disabled = true;
    });

    if (btnCancelInv) btnCancelInv.addEventListener('click', () => {
        if (modalInvest) modalInvest.style.display = 'none';
    });

    chkRules.forEach(chk => {
        chk.addEventListener('change', () => {
            const allChecked = Array.from(chkRules).every(c => c.checked);
            if (btnSaveInv) {
                btnSaveInv.disabled = !allChecked;
                btnSaveInv.style.opacity = allChecked ? '1' : '0.5';
            }
        });
    });

    if (btnSaveInv) {
        btnSaveInv.addEventListener('click', async () => {
            const name = invInputName.value.trim();
            const amount = window.parseMoney ? window.parseMoney(invInputCapital.value) : 0;
            const quantity = parseFloat(invInputQty.value) || 1;
            const intrinsic = window.parseMoney ? window.parseMoney(invInputIntrinsic.value) : 0;
            const note = invInputNote.value.trim();

            if (!name || amount <= 0) { alert("Vui lòng nhập Tên tài sản và Mức vốn hợp lệ!"); return; }

            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "save_investment_entry",
                    token: window.getToken(),
                    dataDM: { "Mã/Tên": name, "Phân Loại": invInputType.value, "Định Giá Lý Thuyết": intrinsic, "Giá Hiện Tại": amount/quantity, "Luận Điểm Đầu Tư": note, "Ngày Bắt Đầu": window.getTodayStr() },
                    dataDT: { "Ngày": window.getTodayStr(), "Mã/Tên": name, "Loại Giao Dịch": "Mua", "Số Tiền": amount, "Số Lượng": quantity, "Đơn Giá": amount/quantity, "Ghi Chú": note }
                }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const res = await response.json();
            if (res.status === "success") {
                if (window.showToast) window.showToast("Đã rót vốn thành công!", "success");
                if (modalInvest) modalInvest.style.display = 'none';
                window.fetchInvestmentData();
            }
        });
    }

    // Manual Sync Button
    if (btnSyncPrices) {
        btnSyncPrices.addEventListener('click', async () => {
             const originalText = btnSyncPrices.innerHTML;
             btnSyncPrices.disabled = true;
             btnSyncPrices.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>...';
             await window.fetchInvestmentData(); // Simple way to refresh from GS
             btnSyncPrices.disabled = false;
             btnSyncPrices.innerHTML = originalText;
        });
    }

    // Giao Dịch Logic
    window.openInvTxModal = function(symbol) {
        document.getElementById('inv-tx-symbol').value = symbol;
        document.getElementById('inv-tx-title').innerText = `Giao Dịch: ${symbol}`;
        document.getElementById('modal-invest-transaction').style.display = 'flex';
    };

    const btnSaveTx = document.getElementById('btn-save-inv-tx');
    if (btnSaveTx) {
        btnSaveTx.addEventListener('click', async () => {
            const dataDT = {
                "Ngày": window.getTodayStr(),
                "Mã/Tên": document.getElementById('inv-tx-symbol').value,
                "Loại Giao Dịch": document.querySelector('input[name="inv-tx-type"]:checked').value,
                "Số Tiền": window.parseMoney(document.getElementById('inv-tx-total').value),
                "Số Lượng": parseFloat(document.getElementById('inv-tx-qty').value) || 0,
                "Đơn Giá": window.parseMoney(document.getElementById('inv-tx-price').value),
                "Ghi Chú": document.getElementById('inv-tx-note').value
            };
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "save_investment_transaction", token: window.getToken(), dataDT: dataDT }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const res = await response.json();
            if (res.status === "success") {
                document.getElementById('modal-invest-transaction').style.display = 'none';
                window.fetchInvestmentData();
            }
        });
    }
});
