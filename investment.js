/**
 * INVESTMENT MODULE (BUFFETT STYLE)
 * Tách biệt logic quản lý danh mục đầu tư
 */

// --- Global State ---
let invHistoryData = []; 
let invPortfolioData = []; 
let invEquityChart = null;
let invRoiChart = null;

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
            
            const actionButtons = `
                    <button class="action-btn" title="Giao Dịch" onclick="window.openInvTxModal('${item["Mã/Tên"]}')" style="background: #10b981; color: white;"><i class="fa-solid fa-money-bill-transfer"></i></button>
                    <button class="action-btn" title="Chỉnh sửa" onclick="if(getRole()!=='ADMIN') { if(window.showToast) window.showToast('Bạn không có quyền chỉnh sửa', 'error'); else alert('Bạn không có quyền chỉnh sửa'); } else { alert('Tính năng chỉnh sửa đang được phát triển'); }"><i class="fa-solid fa-pen-to-square"></i></button>
            `;

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
                    ${actionButtons}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // UPDATE KPIs
    const kpiNav = document.getElementById('inv-kpi-nav');
    const kpiProfit = document.getElementById('inv-kpi-profit');
    const kpiRoi = document.getElementById('inv-kpi-roi');
    const kpiMos = document.getElementById('inv-kpi-mos');
    const kpiDivs = document.getElementById('inv-kpi-dividends');
    const kpiCapital = document.getElementById('inv-kpi-capital');

    if (kpiNav && window.formatCurrency) kpiNav.innerText = window.formatCurrency(totalCurrent);
    if (kpiDivs && window.formatCurrency) kpiDivs.innerText = window.formatCurrency(totalDivs);
    if (kpiCapital && window.formatCurrency) kpiCapital.innerText = window.formatCurrency(totalCapital);

    const totalAbsProfit = totalCurrent + totalDivs - totalCapital;
    if (kpiProfit && window.formatCurrency) {
        kpiProfit.innerText = window.formatCurrency(totalAbsProfit);
    }

    if (kpiRoi && totalCapital > 0) {
        const roi = (totalAbsProfit / totalCapital) * 100;
        kpiRoi.innerText = roi >= 0 ? `+${roi.toFixed(1)}%` : `${roi.toFixed(1)}%`;
    }

    if (kpiMos && totalIntrinsic > 0) {
        const mos = ((totalIntrinsic - totalCurrent) / totalIntrinsic) * 100;
        kpiMos.innerText = mos > 0 ? `${mos.toFixed(1)}%` : "0%";
    }

    // Update charts if data exists
    if (invHistoryData.length > 0) {
        updateInvestmentCharts();
    }
}
window.renderInvestmentPortfolio = renderInvestmentPortfolio;

// --- Analytics & Charts Logic ---
function updateInvestmentCharts() {
    if (typeof Chart === 'undefined') return;

    // 1. Process Data for Capital Fluctuation (Equity over time)
    // Sort transactions by date
    const sortedTx = [...invHistoryData].sort((a, b) => {
        const dateA = parseDate(a["Ngày Giao Dịch"] || a["Ngày"]);
        const dateB = parseDate(b["Ngày Giao Dịch"] || b["Ngày"]);
        return dateA - dateB;
    });

    let cumulativeCapital = 0;
    const timelineData = [];
    
    sortedTx.forEach(tx => {
        const type = String(tx["Loại Sự Kiện"] || tx["Loại Giao Dịch"] || "");
        const amt = parseFloat(tx["Số Tiền"]) || 0;
        
        if (type === "Mua") {
            cumulativeCapital += amt;
        } else if (type === "Bán") {
            cumulativeCapital -= amt;
        }
        // Dividends are not capital inflow (they are returns), so we don't add them to capital line
        
        const dateObj = parseDate(tx["Ngày Giao Dịch"] || tx["Ngày"]);
        const displayDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        
        timelineData.push({ x: displayDate, y: cumulativeCapital });
    });

    // To add the "Current State" point
    const currentNAV = invPortfolioData.reduce((sum, p) => {
        const price = parseFloat(String(p["Giá Hiện Tại"] || 0).replace(/[^\d]/g, '')) || 0;
        return sum + (price * (p.totalQty || 0));
    }, 0);
    
    // 2. Process Data for Annual ROI (Upgraded)
    const currentPriceMap = {};
    const avgBuyPriceMap = {};
    invPortfolioData.forEach(p => {
        const symbol = p["Mã/Tên"];
        const price = parseFloat(String(p["Giá Hiện Tại"] || 0).replace(/[^\d]/g, '')) || 0;
        currentPriceMap[symbol] = price;
        
        // Average Buy Price = Total Capital / Total Qty
        const totalCap = p.capital || 0;
        const totalQty = p.totalQty || 1; // avoid div by zero
        avgBuyPriceMap[symbol] = totalCap / totalQty;
    });

    const yearlyData = {};
    sortedTx.forEach(tx => {
        const date = parseDate(tx["Ngày Giao Dịch"] || tx["Ngày"]);
        const year = date.getFullYear();
        if (!yearlyData[year]) yearlyData[year] = { profit: 0, capitalBase: 0 };
        
        const symbol = tx["Mã/Tên"];
        const type = String(tx["Loại Sự Kiện"] || tx["Loại Giao Dịch"] || "");
        const amt = parseFloat(tx["Số Tiền"]) || 0;
        const qty = parseFloat(tx["Số Lượng"]) || 0;
        const currentPrice = currentPriceMap[symbol] || 0;
        
        if (type === "Mua") {
            yearlyData[year].capitalBase += amt;
            // Contribution to wealth: Current Market Value minus Cost
            const paperProfit = (qty * currentPrice) - amt;
            yearlyData[year].profit += paperProfit;
        } 
        else if (type === "Bán") {
            // Realized gain relative to average cost
            const avgCost = avgBuyPriceMap[symbol] || 0;
            const realizedGain = amt - (qty * avgCost);
            yearlyData[year].profit += realizedGain;
        } 
        else if (type.includes("Cổ Tức") && type.includes("Tiền")) {
            yearlyData[year].profit += amt;
        }
    });

    const years = Object.keys(yearlyData).sort();
    const roiData = years.map(y => {
        const d = yearlyData[y];
        // Calculate ROI % relative to capital basis in that year
        // If capitalBase is 0 (only sells or dividends), use 0% or handle accordingly
        const roi = d.capitalBase > 0 ? (d.profit / d.capitalBase) * 100 : 0;
        return roi.toFixed(1);
    });

    // 3. Render Capital Chart
    const ctxEquity = document.getElementById('chart-inv-equity');
    if (ctxEquity) {
        if (invEquityChart) invEquityChart.destroy();
        invEquityChart = new Chart(ctxEquity, {
            type: 'line',
            data: {
                labels: timelineData.map(d => d.x),
                datasets: [{
                    label: 'Vốn Đầu Tư Lũy Kế',
                    data: timelineData.map(d => d.y),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { callback: value => (value / 1000000).toFixed(0) + 'M' }
                    }
                }
            }
        });
    }

    // 4. Render ROI Chart
    const ctxRoi = document.getElementById('chart-inv-annual-roi');
    if (ctxRoi) {
        if (invRoiChart) invRoiChart.destroy();
        invRoiChart = new Chart(ctxRoi, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'ROI %',
                    data: roiData,
                    backgroundColor: roiData.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(244, 63, 94, 0.8)'),
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        formatter: (v) => v + '%',
                        font: { weight: 'bold' }
                    }
                },
                scales: {
                    y: { ticks: { callback: v => v + '%' } }
                }
            }
        });
    }
}

function parseDate(dateStr) {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
}

window.loadInvestmentDemoData = function() {
    const symbols = ["FPT", "HPG", "VCB", "VIC", "MWG"];
    const demoCashFlow = [];
    const years = [2022, 2023, 2024, 2025];
    
    years.forEach(year => {
        for (let i = 0; i < 10; i++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const month = Math.floor(Math.random() * 12) + 1;
            const dateStr = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const type = i < 6 ? "Mua" : (i < 9 ? "Bán" : "Cổ Tức (Tiền)");
            const qty = Math.floor(Math.random() * 500) + 100;
            const priceBase = { "FPT": 90, "HPG": 25, "VCB": 85, "VIC": 45, "MWG": 40 }[symbol];
            const price = priceBase + (Math.random() * 10 - 5); 
            const total = qty * price * 1000;
            
            demoCashFlow.push({
                "Ngày Giao Dịch": dateStr,
                "Mã/Tên": symbol,
                "Loại Giao Dịch": type,
                "Số Lượng": qty,
                "Số Tiền": total,
                "Đơn Giá": (price * 1000).toLocaleString('vi-VN'),
                "Ghi Chú": "Dữ liệu Demo " + year
            });
        }
    });

    const demoPortfolio = symbols.map(s => ({
        "Mã/Tên": s,
        "Giá Hiện Tại": ({ "FPT": "95.000", "HPG": "28.500", "VCB": "92.000", "VIC": "42.000", "MWG": "46.000" }[s]),
        "Định Giá Lý Thuyết": ({ "FPT": "120.000", "HPG": "35.000", "VCB": "110.000", "VIC": "65.000", "MWG": "60.000" }[s]),
        "Trạng Thái": "Nắm Giữ",
        "Ghi Chú": "Tài sản Demo"
    }));

    localStorage.setItem('cached_inv_history', JSON.stringify(demoCashFlow));
    localStorage.setItem('inv_demo_mode', 'true');
    
    if (confirm("Đã tạo 40 bản ghi demo (2022-2025). Hệ thống đã tạm dừng đồng bộ dữ liệu thật để bạn xem demo. Tải lại trang?")) {
        location.reload();
    }
};

window.exitInvestmentDemoMode = function() {
    localStorage.removeItem('inv_demo_mode');
    alert("Đã thoát chế độ demo. Hệ thống sẽ tải lại dữ liệu thật.");
    window.fetchInvestmentData();
};

    function derivePortfolioFromHistory() {
        if (!invHistoryData || invHistoryData.length === 0) return;
        const grouped = {};
        invHistoryData.forEach(row => {
            const symbol = String(row["Mã/Tên"] || "").trim();
            if (!symbol) return;
            if (!grouped[symbol]) {
                grouped[symbol] = {
                    "Mã/Tên": symbol,
                    totalQty: 0,
                    capital: 0,
                    divs: 0,
                    "Phân Loại": "",
                    "Định Giá Lý Thuyết": 0,
                    "Giá Hiện Tại": 0,
                    "Luận Điểm Đầu Tư": "",
                    "Ngày Bắt Đầu": row["Ngày"]
                };
            }
            const g = grouped[symbol];
            const type = String(row["Loại Sự Kiện"] || row["Loại Giao Dịch"] || "");
            const qty = parseFloat(row["Số Lượng"]) || 0;
            const amt = parseFloat(row["Số Tiền"]) || 0;

            if (type === "Mua") {
                g.totalQty += qty;
                g.capital += amt;
            } else if (type === "Bán") {
                g.totalQty -= qty;
                g.capital -= amt;
            } else if (type.includes("Cổ Tức")) {
                if (type.includes("Tiền")) g.divs += amt;
                if (type.includes("CP") || type.includes("Cổ Phiếu")) g.totalQty += qty;
            }

            // Metadata: Take latest non-empty values
            if (row["Phân Loại"]) g["Phân Loại"] = row["Phân Loại"];
            if (row["Định Giá Lý Thuyết"]) g["Định Giá Lý Thuyết"] = row["Định Giá Lý Thuyết"];
            if (row["Giá Hiện Tại"]) g["Giá Hiện Tại"] = row["Giá Hiện Tại"];
            if (row["Luận Điểm Đầu Tư"]) g["Luận Điểm Đầu Tư"] = row["Luận Điểm Đầu Tư"];
        });
        invPortfolioData = Object.values(grouped).filter(p => p.totalQty !== 0 || p.capital !== 0);
    }

// --- 1. Load Cache IMMEDIATELY (Instant Load) ---
function loadInvCache() {
    const cachedHistory = localStorage.getItem('cached_inv_history');
    if (cachedHistory) {
        try {
            invHistoryData = JSON.parse(cachedHistory);
            derivePortfolioFromHistory();
            console.log("Instant Cache Loaded:", invHistoryData.length);
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


    // Ensure cache has rendered when DOM is fully ready
    renderInvestmentPortfolio();

    // 2. Data Sync Logic (Background Fetch)
    window.fetchInvestmentData = async function () {
        const savedView = localStorage.getItem("active_app_view");
        // Chỉ fetch nếu đang ở tab đầu tư để tiết kiệm tài nguyên
        if (savedView !== 'investment') return;
        
        // Ngăn chặn ghi đè nếu đang ở chế độ Demo
        if (localStorage.getItem('inv_demo_mode') === 'true') {
            console.log("Investment Demo Mode is ON: Skipping data fetch.");
            return;
        }

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
                const rows = res.history || [];
                if (rows.length > 1) {
                    const headers = rows[0];
                    invHistoryData = rows.slice(1).map(row => {
                        let obj = {};
                        headers.forEach((h, i) => obj[h] = row[i]);
                        return obj;
                    });
                }

                derivePortfolioFromHistory();

                // Update Cache
                localStorage.setItem('cached_inv_history', JSON.stringify(invHistoryData));

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
        if (getRole() !== 'ADMIN') {
            if (window.showToast) window.showToast("Bạn không có quyền thực hiện thao tác này", "error");
            else alert("Bạn không có quyền thực hiện thao tác này");
            return;
        }
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

            if (!confirm(`Xác nhận Rót vốn ${window.formatCurrency(amount)} vào mã ${name}?`)) return;

            // Hiệu ứng Loading
            const originalHTML = btnSaveInv.innerHTML;
            btnSaveInv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            btnSaveInv.disabled = true;

            try {
                const eventData = {
                    "Ngày": window.getTodayStr(),
                    "Mã/Tên": name,
                    "Loại Sự Kiện": "Mua",
                    "Số Tiền": amount,
                    "Số Lượng": quantity,
                    "Đơn Giá": amount/quantity,
                    "Phân Loại": invInputType.value,
                    "Định Giá Lý Thuyết": intrinsic,
                    "Giá Hiện Tại": amount/quantity,
                    "Luận Điểm Đầu Tư": note,
                    "Ghi Chú": note
                };

                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "save_investment_event",
                        token: window.getToken(),
                        data: eventData
                    }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const res = await response.json();
                if (res.status === "success") {
                    if (window.showToast) window.showToast("Đã rót vốn thành công!", "success");
                    if (modalInvest) modalInvest.style.display = 'none';
                    window.fetchInvestmentData();
                }
            } catch (err) {
                console.error(err);
                alert("Lỗi khi lưu dữ liệu!");
            } finally {
                btnSaveInv.innerHTML = originalHTML;
                btnSaveInv.disabled = false;
            }
        });
    }

    // Logic Tự động tính Tổng tiền = Số lượng * Đơn giá
    const itxQty = document.getElementById('inv-tx-qty');
    const itxPrice = document.getElementById('inv-tx-price');
    const itxTotal = document.getElementById('inv-tx-total');

    const calculateInvTotal = () => {
        const qty = parseFloat(itxQty.value) || 0;
        const price = window.parseMoney ? window.parseMoney(itxPrice.value) : 0;
        const total = qty * price;
        if (total > 0 && itxTotal) {
            // Hiển thị giá trị được format vào ô Tổng tiền
            itxTotal.value = window.formatCurrency ? window.formatCurrency(total).replace(' ₫', '').trim() : total;
        }
    };

    if (itxQty) itxQty.addEventListener('input', calculateInvTotal);
    if (itxPrice) itxPrice.addEventListener('input', calculateInvTotal);



    // Giao Dịch Logic
    window.openInvTxModal = function(symbol) {
        if (getRole() !== 'ADMIN') {
            if (window.showToast) window.showToast("Bạn không có quyền thực hiện giao dịch", "error");
            else alert("Bạn không có quyền thực hiện giao dịch");
            return;
        }
        document.getElementById('inv-tx-symbol').value = symbol;
        document.getElementById('inv-tx-title').innerText = `Giao Dịch: ${symbol}`;
        
        // Cập nhật thông tin vị thế hiện tại vào Modal
        const asset = invPortfolioData.find(p => p["Mã/Tên"] === symbol);
        if (asset) {
            const qty = asset.totalQty || 0;
            const price = parseFloat(String(asset["Giá Hiện Tại"] || 0).replace(/[^\d]/g, '')) || 0;
            const equity = asset.capital || 0;
            
            document.getElementById('inv-tx-info-qty').innerText = new Intl.NumberFormat('vi-VN').format(qty);
            document.getElementById('inv-tx-info-price').innerText = window.formatCurrency ? window.formatCurrency(price) : price;
            document.getElementById('inv-tx-info-equity').innerText = window.formatShorthandCurrency ? window.formatShorthandCurrency(equity) : equity;
        }

        document.getElementById('modal-invest-transaction').style.display = 'flex';
    };

    // Toggling Dividend Options & Field States
    const txTypeRadios = document.querySelectorAll('input[name="inv-tx-type"]');
    const divTypeRadios = document.querySelectorAll('input[name="inv-div-type"]');
    const divOptions = document.getElementById('inv-dividend-options');
    
    const itxQtyInput = document.getElementById('inv-tx-qty');
    const itxPriceInput = document.getElementById('inv-tx-price');
    const itxTotalInput = document.getElementById('inv-tx-total');

    function applyInvTxFieldStates() {
        const type = document.querySelector('input[name="inv-tx-type"]:checked').value;
        const subType = document.querySelector('input[name="inv-div-type"]:checked')?.value || 'Tiền';

        // Reset all
        [itxQtyInput, itxPriceInput, itxTotalInput].forEach(inp => {
            if (inp) {
                inp.disabled = false;
                inp.parentElement.style.opacity = "1";
            }
        });

        if (type === 'Cổ Tức') {
            if (subType === 'Tiền') {
                if (itxQtyInput) { itxQtyInput.disabled = true; itxQtyInput.parentElement.style.opacity = "0.4"; }
                if (itxPriceInput) { itxPriceInput.disabled = true; itxPriceInput.parentElement.style.opacity = "0.4"; }
            } else if (subType === 'Cổ Phiếu') {
                if (itxPriceInput) { itxPriceInput.disabled = true; itxPriceInput.parentElement.style.opacity = "0.4"; }
                if (itxTotalInput) { itxTotalInput.disabled = true; itxTotalInput.parentElement.style.opacity = "0.4"; }
            } else if (subType === 'Cả Hai') {
                if (itxPriceInput) { itxPriceInput.disabled = true; itxPriceInput.parentElement.style.opacity = "0.4"; }
            }
        }
    }

    txTypeRadios.forEach(r => {
        r.addEventListener('change', () => {
            if (divOptions) divOptions.style.display = r.value === 'Cổ Tức' ? 'block' : 'none';
            applyInvTxFieldStates();
        });
    });
    divTypeRadios.forEach(r => {
        r.addEventListener('change', applyInvTxFieldStates);
    });

    // Also call on modal open
    const originalOpenInvTxModal = window.openInvTxModal;
    window.openInvTxModal = function(symbol) {
        originalOpenInvTxModal(symbol);
        // Reset radio to Mua
        const muaRadio = document.querySelector('input[name="inv-tx-type"][value="Mua"]');
        if (muaRadio) {
            muaRadio.checked = true;
            muaRadio.dispatchEvent(new Event('change'));
        }
    };

    const btnSaveTx = document.getElementById('btn-save-inv-tx');
    if (btnSaveTx) {
        btnSaveTx.addEventListener('click', async () => {
            let txType = document.querySelector('input[name="inv-tx-type"]:checked').value;
            if (txType === 'Cổ Tức') {
                const subType = document.querySelector('input[name="inv-div-type"]:checked').value;
                if (subType === 'Tiền') txType = "Cổ Tức Tiền";
                else if (subType === 'Cổ Phiếu') txType = "Cổ Tức CP";
                else txType = "Cổ Tức"; // Cả hai or general
            }

            const eventData = {
                "Ngày": window.getTodayStr(),
                "Mã/Tên": document.getElementById('inv-tx-symbol').value,
                "Loại Sự Kiện": txType,
                "Số Tiền": window.parseMoney(document.getElementById('inv-tx-total').value),
                "Số Lượng": parseFloat(document.getElementById('inv-tx-qty').value) || 0,
                "Đơn Giá": window.parseMoney(document.getElementById('inv-tx-price').value),
                "Ghi Chú": document.getElementById('inv-tx-note').value
            };

            // Inherit current metadata
            const currentAsset = invPortfolioData.find(p => p["Mã/Tên"] === eventData["Mã/Tên"]);
            if (currentAsset) {
                eventData["Phân Loại"] = currentAsset["Phân Loại"];
                eventData["Định Giá Lý Thuyết"] = currentAsset["Định Giá Lý Thuyết"];
                eventData["Giá Hiện Tại"] = currentAsset["Giá Hiện Tại"];
                eventData["Luận Điểm Đầu Tư"] = currentAsset["Luận Điểm Đầu Tư"];
            }

            if (!confirm(`Xác nhận Lưu giao dịch ${eventData["Loại Sự Kiện"]} cho mã ${eventData["Mã/Tên"]}?`)) return;

            // Hiệu ứng Loading
            const originalHTML = btnSaveTx.innerHTML;
            btnSaveTx.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            btnSaveTx.disabled = true;

            try {
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "save_investment_event", token: window.getToken(), data: eventData }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const res = await response.json();
                if (res.status === "success") {
                    if (window.showToast) window.showToast("Đã lưu giao dịch thành công!", "success");
                    document.getElementById('modal-invest-transaction').style.display = 'none';
                    window.fetchInvestmentData();
                }
            } catch (err) {
                console.error(err);
                alert("Lỗi khi lưu giao dịch!");
            } finally {
                btnSaveTx.innerHTML = originalHTML;
                btnSaveTx.disabled = false;
            }
        });
    }
});
