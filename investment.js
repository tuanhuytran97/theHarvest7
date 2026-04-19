/**
 * INVESTMENT MODULE (BUFFETT STYLE)
 * Tách biệt logic quản lý danh mục đầu tư
 */

// --- GLOBAL STATE ---
let invPortfolioData = []; // To be loaded from GS
let invCashFlowData = [];  // To be loaded from GS

// --- RENDER LOGIC (Hoisted) ---
function renderInvestmentPortfolio() {
    const tbody = document.getElementById('inv-portfolio-body');
    let totalCapital = 0, totalCurrent = 0, totalDivs = 0, totalIntrinsic = 0;

    if (tbody) {
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

                // Fix Date parsing (handle JS Date or Excel serial)
                let startDate = new Date();
                const rawDate = item["Ngày Bắt Đầu"];
                if (rawDate) {
                    const dateStr = String(rawDate);
                    if (!isNaN(rawDate) && rawDate > 20000) { // Excel Serial
                         startDate = window.utils && window.utils.excelToJsDate ? 
                                     window.utils.excelToJsDate(parseFloat(rawDate)) : 
                                     new Date(new Date(1899, 11, 30).getTime() + parseFloat(rawDate) * 86400000);
                    } else if (dateStr.includes("T")) { // standard date string
                         startDate = new Date(dateStr);
                    } else { // DD/MM/YYYY
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

// --- CACHE LOGIC ---
function loadInvCache() {
    const cachedPortfolio = localStorage.getItem('cached_inv_portfolio');
    const cachedCashFlow = localStorage.getItem('cached_inv_cashflow');
    if (cachedPortfolio && cachedCashFlow) {
        try {
            invPortfolioData = JSON.parse(cachedPortfolio);
            invCashFlowData = JSON.parse(cachedCashFlow);
            console.log("Loaded Investment Cache:", invPortfolioData.length);
            // Render immediately if script is placed after DOM
            renderInvestmentPortfolio();
        } catch (e) {
            console.error("Cache Parse Error:", e);
        }
    }
}
loadInvCache();

document.addEventListener("DOMContentLoaded", () => {
    // 1. DOM Elements (Inside listener to ensure they are available)
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

    // Double check render
    renderInvestmentPortfolio();

    // 2. Data Sync Logic
    window.fetchInvestmentData = async function () {
        const savedView = localStorage.getItem("active_app_view");
        if (savedView !== 'investment') return;

        try {
            const token = window.getToken ? window.getToken() : null;
            if (!token) return;

            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "get_investment_data", token: token }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const res = await response.json();

            if (res.status === "success") {
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

                const rowsDT = res.cashflow || [];
                if (rowsDT.length > 1) {
                    const headers = rowsDT[0];
                    invCashFlowData = rowsDT.slice(1).map(row => {
                        let obj = {};
                        headers.forEach((h, i) => obj[h] = row[i]);
                        return obj;
                    });
                }

                invPortfolioData.forEach(p => {
                    const related = invCashFlowData.filter(cf => cf["Mã/Tên"] === p["Mã/Tên"]);
                    let qty = 0;
                    let totalDivCash = 0;
                    p.capital = related.reduce((sum, cf) => {
                        const type = String(cf["Loại Giao Dịch"] || "");
                        const amt = parseFloat(cf["Số Tiền"]) || 0;
                        const sl = parseFloat(cf["Số Lượng"]) || 0;
                        if (type === "Mua") { qty += sl; return sum + amt; }
                        else if (type === "Bán") { qty -= sl; return sum - amt; }
                        else if (type.includes("Cổ Tức")) {
                            if (type.includes("Cổ Phiếu") || type.includes("Tiền & CP") || type === "Cổ Tức") qty += sl;
                            if (type.includes("Tiền") || type === "Cổ Tức") totalDivCash += amt;
                        }
                        return sum;
                    }, 0);
                    p.totalQty = qty;
                    p.divs = totalDivCash;
                });

                localStorage.setItem('cached_inv_portfolio', JSON.stringify(invPortfolioData));
                localStorage.setItem('cached_inv_cashflow', JSON.stringify(invCashFlowData));
                renderInvestmentPortfolio();
            }
        } catch (e) {
            console.error("Fetch Error:", e);
        }
    };

    // Auto-fetch if active
    const currentView = localStorage.getItem("active_app_view");
    if (currentView === 'investment') {
        window.fetchInvestmentData();
    }

    // Modal UI ...
    // (Additional logic for Save, Modal Open, etc should follow here or stay as is)

    // 3. UI Logic (Modal & Checklist)
    function showInvModal() {
        if (modalInvest) modalInvest.style.display = 'flex';
        chkRules.forEach(chk => chk.checked = false);
        if (btnSaveInv) {
            btnSaveInv.disabled = true;
            btnSaveInv.style.opacity = '0.5';
            btnSaveInv.style.cursor = 'not-allowed';
        }

        if (invInputName) invInputName.value = '';
        if (invInputCapital) invInputCapital.value = '';
        if (invInputQty) invInputQty.value = '';
        if (invInputIntrinsic) invInputIntrinsic.value = '';
        if (invInputNote) invInputNote.value = '';
    }

    function closeInvModal() {
        if (modalInvest) modalInvest.style.display = 'none';
    }

    if (btnAddInv) btnAddInv.addEventListener('click', showInvModal);
    if (btnCancelInv) btnCancelInv.addEventListener('click', closeInvModal);

    chkRules.forEach(chk => {
        chk.addEventListener('change', () => {
            const allChecked = Array.from(chkRules).every(c => c.checked);
            if (btnSaveInv) {
                if (allChecked) {
                    btnSaveInv.disabled = false;
                    btnSaveInv.style.opacity = '1';
                    btnSaveInv.style.cursor = 'pointer';
                    btnSaveInv.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                } else {
                    btnSaveInv.disabled = true;
                    btnSaveInv.style.opacity = '0.5';
                    btnSaveInv.style.cursor = 'not-allowed';
                    btnSaveInv.style.background = '#0f172a';
                }
            }
        });
    });

    if (btnSaveInv) {
        btnSaveInv.addEventListener('click', async () => {
            const btn = btnSaveInv;
            const originalText = btn.innerHTML;

            const name = invInputName.value.trim();
            const type = invInputType.value;
            const amount = window.parseMoney ? window.parseMoney(invInputCapital.value) : 0;
            const qtyStr = invInputQty ? invInputQty.value : "1";
            const quantity = parseFloat(qtyStr.replace(/[^\d.]/g, '')) || 1;
            const intrinsic = window.parseMoney ? window.parseMoney(invInputIntrinsic.value) : 0;
            const note = invInputNote.value.trim();

            if (!name || amount <= 0) { alert("Vui lòng nhập Tên tài sản và Mức vốn hợp lệ!"); return; }
            if (note.length < 10) { alert("Luận điểm đầu tư cần ít nhất 10 ký tự."); return; }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kích hoạt...';

            const todayStr = window.getTodayStr ? window.getTodayStr() : "";
            const unitPrice = amount / quantity; // Đơn giá = Tổng Vốn / Số Lượng

            const dataDM = {
                "Mã/Tên": name, "Phân Loại": type, "Ngày Bắt Đầu": todayStr,
                "Vòng Tròn Năng Lực": "Y", "Lợi Thế Cạnh Tranh": "Checked",
                "Tài Chính Sạch": "Checked", "Biên An Toàn": "Y",
                "Định Giá Lý Thuyết": intrinsic, "Giá Hiện Tại": unitPrice,
                "Luận Điểm Đầu Tư": note
            };

            const dataDT = {
                "Ngày": todayStr, "Mã/Tên": name, "Loại Giao Dịch": "Mua",
                "Số Tiền": amount, "Số Lượng": quantity, "Đơn Giá": unitPrice,
                "Ghi Chú": "Khởi tạo từ Dashboard: " + note
            };

            try {
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "save_investment_entry",
                        token: window.getToken(),
                        dataDM: dataDM,
                        dataDT: dataDT
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const res = await response.json();
                if (res.status === "success") {
                    if (window.showToast) window.showToast("Đã rót vốn thành công!", "success");
                    closeInvModal();
                    fetchInvestmentData();
                } else {
                    alert("Lỗi: " + res.message);
                }
            } catch (e) {
                alert("Lỗi kết nối server!");
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }

    // Handle Manual Price Sync
    if (btnSyncPrices) {
        btnSyncPrices.addEventListener('click', async () => {
            const btn = btnSyncPrices;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lấy giá...';

            try {
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "update_investment_prices",
                        token: window.getToken()
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const res = await response.json();
                if (res.status === "success") {
                    if (window.showToast) window.showToast(res.message, "success");
                    
                    // Refresh data with updated prices
                    if (res.portfolio && res.portfolio.length > 1) {
                        const headers = res.portfolio[0];
                        invPortfolioData = res.portfolio.slice(1).map(row => {
                            let obj = {};
                            headers.forEach((h, i) => obj[h] = row[i]);
                            obj.capital = 0; 
                            return obj;
                        });
                        
                        // Re-run aggregation
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
                                    if (type.includes("Cổ Phiếu") || type.includes("Tiền & CP") || type === "Cổ Tức") {
                                        qty += sl;
                                    }
                                    if (type.includes("Tiền") || type === "Cổ Tức") {
                                        totalDivCash += amt;
                                    }
                                }
                                return sum;
                            }, 0);
                            p.totalQty = qty;
                            p.divs = totalDivCash;
                        });
                        
                        // Update cache
                        localStorage.setItem('cached_inv_portfolio', JSON.stringify(invPortfolioData));
                        localStorage.setItem('cached_inv_cashflow', JSON.stringify(invCashFlowData));

                        renderInvestmentPortfolio();
                    }
                } else {
                    alert("Lỗi: " + res.message);
                }
            } catch (e) {
                alert("Lỗi kết nối server!");
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }

    // Tự động tải dữ liệu nếu đang ở view đầu tư
    const currentView = localStorage.getItem("active_app_view");
    if (currentView === 'investment') {
        window.fetchInvestmentData();
    }
});

    // 5. Giao Dịch Logic
    window.openInvTxModal = function(symbol) {
        document.getElementById('inv-tx-symbol').value = symbol;
        document.getElementById('inv-tx-title').innerText = `Giao Dịch: ${symbol}`;
        document.getElementById('inv-tx-qty').value = '';
        document.getElementById('inv-tx-price').value = '';
        document.getElementById('inv-tx-total').value = '';
        document.getElementById('inv-tx-note').value = '';
        document.getElementById('modal-invest-transaction').style.display = 'flex';
    };

    const inputTxQty = document.getElementById('inv-tx-qty');
    const inputTxPrice = document.getElementById('inv-tx-price');
    const inputTxTotal = document.getElementById('inv-tx-total');
    
    // Auto-disable inputs based on transaction type
    const txRadios = document.querySelectorAll('input[name="inv-tx-type"]');
    const divOptions = document.getElementById('inv-dividend-options');
    const divRadios = document.querySelectorAll('input[name="inv-div-type"]');

    function updateFormLogic() {
        const typeNode = document.querySelector('input[name="inv-tx-type"]:checked');
        const divNode = document.querySelector('input[name="inv-div-type"]:checked');
        if (!typeNode) return;

        const val = typeNode.value;
        inputTxQty.disabled = false;
        inputTxTotal.disabled = false;
        inputTxPrice.disabled = false;

        if (val === "Cổ Tức") {
            divOptions.style.display = 'block';
            const divType = divNode ? divNode.value : "Tiền";
            if (divType === "Tiền") {
                inputTxQty.value = '0';
                inputTxQty.disabled = true;
                inputTxPrice.value = '0';
                inputTxPrice.disabled = true;
            } else if (divType === "Cổ Phiếu") {
                inputTxTotal.value = '0';
                inputTxTotal.disabled = true;
                inputTxPrice.value = '0';
                inputTxPrice.disabled = true;
            } else if (divType === "Cả Hai") {
                // Keep all enabled, do not force 0
            }
        } else {
            divOptions.style.display = 'none';
        }
    }

    txRadios.forEach(radio => radio.addEventListener('change', updateFormLogic));
    divRadios.forEach(radio => radio.addEventListener('change', updateFormLogic));

    if (inputTxPrice) {
        inputTxPrice.addEventListener('input', function(e) {
            let val = e.target.value.replace(/[^\d]/g, '');
            if (val) e.target.value = new Intl.NumberFormat('vi-VN').format(parseInt(val));
        });
    }
    if (inputTxTotal) {
        inputTxTotal.addEventListener('input', function(e) {
            let val = e.target.value.replace(/[^\d]/g, '');
            if (val) e.target.value = new Intl.NumberFormat('vi-VN').format(parseInt(val));
        });
    }

    const btnSaveTx = document.getElementById('btn-save-inv-tx');
    if (btnSaveTx) {
        btnSaveTx.addEventListener('click', async () => {
            const sym = document.getElementById('inv-tx-symbol').value;
            let type = document.querySelector('input[name="inv-tx-type"]:checked').value;
            const divNode = document.querySelector('input[name="inv-div-type"]:checked');
            
            if (type === "Cổ Tức" && divNode) {
                if (divNode.value === "Tiền") type = "Cổ Tức (Tiền)";
                else if (divNode.value === "Cổ Phiếu") type = "Cổ Tức (Cổ Phiếu)";
                else type = "Cổ Tức (Tiền & CP)";
            }

            const qty = document.getElementById('inv-tx-qty').value;
            const price = window.parseMoney ? window.parseMoney(document.getElementById('inv-tx-price').value) : document.getElementById('inv-tx-price').value;
            const total = window.parseMoney ? window.parseMoney(document.getElementById('inv-tx-total').value) : document.getElementById('inv-tx-total').value;
            const note = document.getElementById('inv-tx-note').value;

            const nQty = parseInt(qty) || 0;
            const nTotal = parseInt(total) || 0;

            if (type === "Cổ Tức (Tiền)" && nTotal <= 0) {
                alert("Vui lòng nhập Tổng Tiền nhận được (Cổ tức tiền mặt)!");
                return;
            }
            if (type === "Cổ Tức (Cổ Phiếu)" && nQty <= 0) {
                alert("Vui lòng nhập Số lượng cổ phiếu nhận thêm!");
                return;
            }
            if ((type === "Cổ Tức (Tiền & CP)") && (nQty <= 0 || nTotal <= 0)) {
                alert("Vui lòng nhập cả Số lượng và Tổng tiền giao dịch!");
                return;
            }
            if ((type === "Mua" || type === "Bán") && (nQty <= 0 || nTotal <= 0)) {
                alert("Vui lòng nhập Số lượng và Tổng tiền giao dịch!");
                return;
            }

            const btn = btnSaveTx;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

            const dataDT = {
                "Ngày": window.getTodayStr ? window.getTodayStr() : new Date().toLocaleDateString('vi-VN'),
                "Mã/Tên": sym,
                "Loại Giao Dịch": type,
                "Số Tiền": total,
                "Số Lượng": qty,
                "Đơn Giá": price || 0,
                "Ghi Chú": note
            };

            try {
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "save_investment_transaction",
                        token: window.getToken ? window.getToken() : "",
                        dataDT: dataDT
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const res = await response.json();
                if (res.status === "success") {
                    if (window.showToast) window.showToast("Đã lưu giao dịch thành công!", "success");
                    document.getElementById('modal-invest-transaction').style.display = 'none';
                    window.fetchInvestmentData(); // Refresh table
                } else {
                    alert("Lỗi: " + res.message);
                }
            } catch (e) {
                alert("Lỗi kết nối server!");
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
});
