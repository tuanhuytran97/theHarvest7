/**
 * INVESTMENT MODULE (BUFFETT STYLE)
 * Tách biệt logic quản lý danh mục đầu tư
 */

// --- Global State ---
let invHistoryData = [];
let invPortfolioData = [];
let invEquityChart = null;
let invRoiChart = null;
let usdExchangeRate = 25000; // Default fallback rate (VND per USD)
let currentInvTimeframe = 'ALL'; // '1M', '3M', '6M', 'YTD', '1Y', 'ALL'
let currentInvAssetFilter = 'ALL'; // 'ALL' or specific symbol
let currentInvCurrency = 'VND'; // 'VND' or 'USD'
let invCustomPrices = JSON.parse(localStorage.getItem('inv_custom_prices') || '{}');
let invCustomMeta = JSON.parse(localStorage.getItem('inv_custom_meta') || '{}');
window.getInvHistoryData = () => invHistoryData;
window.getInvPortfolioData = () => invPortfolioData;

// Fetch latest USD/VND exchange rate from open API
async function fetchUsdExchangeRate() {
    try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        if (response.ok) {
            const data = await response.json();
            if (data && data.rates && data.rates.VND) {
                usdExchangeRate = data.rates.VND;
                console.log("Dynamically loaded USD exchange rate:", usdExchangeRate);
                // Update subtitle if element exists
                const subtitleEl = document.getElementById('inv-chart-subtitle');
                if (subtitleEl) {
                    const formattedRate = window.formatNumber ? window.formatNumber(usdExchangeRate) : usdExchangeRate.toLocaleString('vi-VN');
                    subtitleEl.innerText = `Lũy kế theo thời gian (Tỷ giá: 1 USD = ${formattedRate} VND)`;
                }
                // Re-render charts
                if (invEquityChart) {
                    updateInvestmentCharts();
                }
            }
        }
    } catch (error) {
        console.error("Failed to fetch USD exchange rate, using fallback:", error);
    }
}
fetchUsdExchangeRate();

// Helper chuẩn hóa số từ Google Sheet (xử lý cả số thập phân 10.38 / 10,38 và dấu chấm hàng nghìn 100.000 / 999.033)
function parseInvNumber(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).trim();
    if (str.includes('.') && str.includes(',')) {
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
            return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
        } else {
            return parseFloat(str.replace(/,/g, '')) || 0;
        }
    } else if (str.includes('.')) {
        const parts = str.split('.');
        if (parts.length > 2) {
            return parseFloat(str.replace(/\./g, '')) || 0;
        } else if (parts[1].length === 3 && parseInt(parts[0], 10) > 0) {
            return parseFloat(str.replace(/\./g, '')) || 0;
        } else {
            return parseFloat(str) || 0;
        }
    } else if (str.includes(',')) {
        const parts = str.split(',');
        if (parts.length > 2) {
            return parseFloat(str.replace(/,/g, '')) || 0;
        } else if (parts[1].length === 3 && parseInt(parts[0], 10) >= 10) {
            return parseFloat(str.replace(/,/g, '')) || 0;
        } else {
            return parseFloat(str.replace(',', '.')) || 0;
        }
    }
    return parseFloat(str) || 0;
}
window.parseInvNumber = parseInvNumber;

// --- 0. Rendering & Shorthand Logic (Hoisted) ---
function renderInvestmentPortfolio() {
    if (window.getRole && window.getRole() === 'EMP_LV2') {
        const tbody = document.getElementById('inv-portfolio-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #ef4444; font-weight: 700;">Bạn không có quyền truy cập mục này.</td></tr>`;
        }
        return;
    }
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
            // Robust parsing: handle strings with dots/commas and fall back to 0
            const rawPrice = item["Giá Hiện Tại"];
            const unitPrice = parseInvNumber(rawPrice);

            const totalQty = item.totalQty || 1;
            const currentVal = unitPrice * totalQty;

            const rawIntrinsic = item["Định Giá Lý Thuyết"];
            const unitIntrinsic = parseInvNumber(rawIntrinsic);
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
                    <button class="action-btn" title="Chỉnh sửa" onclick="if(window.getRole && window.getRole()!=='ADMIN') { if(window.showToast) window.showToast('Bạn không có quyền chỉnh sửa', 'error'); else alert('Bạn không có quyền chỉnh sửa'); } else { window.openEditAssetModal('${item["Mã/Tên"]}'); }" style="background: #3b82f6; color: white;"><i class="fa-solid fa-pen-to-square"></i></button>
            `;

            tr.innerHTML = `
                <td style="font-weight: 700; color: #0f172a;">${item["Mã/Tên"]} <br> <span style="font-size: 0.75rem; color: #64748b; font-weight: normal;">${item["Phân Loại"]}</span></td>
                <td style="font-weight: 700; color: #3b82f6;">${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(totalQty)}</td>
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
        kpiRoi.innerText = roi >= 0 ? `+${roi.toFixed(2)}%` : `${roi.toFixed(2)}%`;
    }

    if (kpiMos && totalIntrinsic > 0) {
        const mos = ((totalIntrinsic - totalCurrent) / totalIntrinsic) * 100;
        kpiMos.innerText = mos > 0 ? `${mos.toFixed(1)}%` : "0%";
    }

    const isDemo = localStorage.getItem('inv_demo_mode') === 'true';

    // Update Last Updated Timestamp UI
    const lastUpdatedEl = document.getElementById('inv-last-updated');
    if (lastUpdatedEl) {
        const lastFetched = localStorage.getItem('inv_last_fetch_time');
        if (lastFetched && !isDemo) {
            lastUpdatedEl.innerText = `Cập nhật: ${lastFetched}`;
            lastUpdatedEl.style.display = 'inline-block';
        } else {
            lastUpdatedEl.style.display = 'none';
        }
    }

    // Update Demo UI Toggle
    if (typeof updateInvestmentDemoUI === 'function') {
        updateInvestmentDemoUI();
    }

    // Populate or sync asset filter dropdown for chart
    const assetFilterSelect = document.getElementById('inv-chart-asset-filter');
    if (assetFilterSelect) {
        const savedVal = currentInvAssetFilter || 'ALL';
        let optionsHtml = '<option value="ALL">🌐 Toàn Bộ Danh Mục</option>';
        invPortfolioData.forEach(p => {
            const sym = p["Mã/Tên"];
            if (sym) {
                optionsHtml += `<option value="${sym}" ${savedVal === sym ? 'selected' : ''}>📈 ${sym} (${p["Phân Loại"] || 'CP'})</option>`;
            }
        });
        assetFilterSelect.innerHTML = optionsHtml;
        assetFilterSelect.value = savedVal;
    }

    // Update charts if data exists
    if (invHistoryData.length > 0) {
        updateInvestmentCharts();
    }

    // Đồng bộ trạng thái hiển thị (mặc định luôn ẨN khi chưa mở khóa)
    applyUnifiedInvestmentVisibility(isInvPrivacyUnlocked);
}
window.renderInvestmentPortfolio = renderInvestmentPortfolio;

// --- UNIFIED INVESTMENT PRIVACY SYSTEM (KPIs + Danh Mục Hiện Tại) ---
let isInvPrivacyUnlocked = false;

function applyUnifiedInvestmentVisibility(isUnlocked) {
    isInvPrivacyUnlocked = !!isUnlocked;
    const hidden = !isInvPrivacyUnlocked;

    // 1. Đồng bộ 6 thẻ KPI (NAV, Vốn, Lãi/lỗ, ROI, MOS, Cổ tức)
    const targetIds = ['inv-kpi-nav', 'inv-kpi-capital', 'inv-kpi-profit', 'inv-kpi-roi', 'inv-kpi-mos', 'inv-kpi-dividends'];
    targetIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (hidden) {
                if (!el.dataset.originalText && el.innerText !== '● ● ●') {
                    el.dataset.originalText = el.innerText;
                }
                el.innerText = '● ● ●';
                el.style.letterSpacing = '3px';
                el.style.opacity = '0.7';
            } else {
                if (el.dataset.originalText) {
                    el.innerText = el.dataset.originalText;
                    delete el.dataset.originalText;
                }
                el.style.letterSpacing = '';
                el.style.opacity = '';
            }
        }
    });

    // 2. Đồng bộ các icon mắt trên 6 thẻ KPI
    const cardEyeIcons = document.querySelectorAll('.inv-card-eye-btn i');
    cardEyeIcons.forEach(icon => {
        icon.className = hidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });

    // 3. Đồng bộ Bảng Danh Mục Hiện Tại & Nút mắt tại tiêu đề
    const tableContainer = document.getElementById('inv-portfolio-table-container');
    const placeholder = document.getElementById('inv-portfolio-hidden-placeholder');
    const portBtn = document.getElementById('btn-toggle-portfolio-vis');
    const portIcon = document.getElementById('inv-portfolio-vis-icon');

    if (hidden) {
        if (tableContainer) tableContainer.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
        if (portIcon) portIcon.className = 'fa-solid fa-eye-slash';
        if (portBtn) {
            portBtn.title = 'Hiện danh mục & số liệu (Cần mật khẩu Admin)';
            portBtn.style.background = '#fef2f2';
            portBtn.style.borderColor = '#fecaca';
            portBtn.style.color = '#ef4444';
        }
    } else {
        if (tableContainer) tableContainer.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        if (portIcon) portIcon.className = 'fa-solid fa-eye';
        if (portBtn) {
            portBtn.title = 'Ẩn danh mục & số liệu';
            portBtn.style.background = '#f0fdf4';
            portBtn.style.borderColor = '#bbf7d0';
            portBtn.style.color = '#16a34a';
        }
    }
}
window.applyUnifiedInvestmentVisibility = applyUnifiedInvestmentVisibility;

// Khóa lại toàn bộ (Ẩn ngay lập tức mà không cần mật khẩu)
function lockInvestmentPrivacy() {
    applyUnifiedInvestmentVisibility(false);
    if (window.showToast) {
        window.showToast('🙈 Đã ẩn danh mục và số liệu tài sản', 'info');
    }
}
window.lockInvestmentPrivacy = lockInvestmentPrivacy;

// Yêu cầu chuyển đổi: nếu đang hiện -> ẩn đi; nếu đang ẩn -> mở modal mật khẩu Admin
function requestToggleInvestmentPrivacy() {
    if (isInvPrivacyUnlocked) {
        lockInvestmentPrivacy();
    } else {
        openInvAdminAuthModal();
    }
}
window.requestToggleInvestmentPrivacy = requestToggleInvestmentPrivacy;

// Modal Xác thực Mật khẩu Admin
function openInvAdminAuthModal() {
    const modal = document.getElementById('modal-inv-admin-auth');
    const input = document.getElementById('inv-admin-pw-input');
    const err = document.getElementById('inv-admin-pw-error');
    if (!modal) return;

    if (input) {
        input.value = '';
        input.type = 'password';
    }
    const eyeIcon = document.getElementById('eye-icon-pw-input');
    if (eyeIcon) eyeIcon.className = 'fa-solid fa-eye';

    if (err) err.style.display = 'none';
    modal.style.display = 'flex';
    if (input) setTimeout(() => input.focus(), 100);
}
window.openInvAdminAuthModal = openInvAdminAuthModal;

function closeInvAdminAuthModal() {
    const modal = document.getElementById('modal-inv-admin-auth');
    if (modal) modal.style.display = 'none';
}
window.closeInvAdminAuthModal = closeInvAdminAuthModal;

function toggleAdminPasswordInputVisibility() {
    const input = document.getElementById('inv-admin-pw-input');
    const icon = document.getElementById('eye-icon-pw-input');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        if (icon) icon.className = 'fa-solid fa-eye';
    }
}
window.toggleAdminPasswordInputVisibility = toggleAdminPasswordInputVisibility;

async function verifyAdminPassword(inputPw) {
    if (!inputPw) return false;
    const trimmedPw = inputPw.trim();

    // 1. Kiểm tra theo token đăng nhập hiện tại
    const token = (window.getToken ? window.getToken() : null) || sessionStorage.getItem("user-token") || localStorage.getItem("farm_token") || "";
    if (token) {
        if (token.includes(":")) {
            const [u, p] = token.split(":");
            if ((u === "admin" || (window.getRole && window.getRole() === "ADMIN")) && p === trimmedPw) {
                return true;
            }
        } else if (token === trimmedPw) {
            return true;
        }
    }

    // 2. Kiểm tra users cấu hình cục bộ (custom_users, CONFIG)
    const customUsers = JSON.parse(localStorage.getItem("custom_users") || "{}");
    if (customUsers["admin"] && customUsers["admin"].password === trimmedPw) return true;
    for (let k in customUsers) {
        if (customUsers[k]?.role === "ADMIN" && customUsers[k]?.password === trimmedPw) return true;
    }

    if (typeof CONFIG !== 'undefined' && CONFIG.USERS && CONFIG.USERS["admin"]) {
        if (CONFIG.USERS["admin"].password === trimmedPw) return true;
    }

    // 3. Mật khẩu mặc định hệ thống
    if (trimmedPw === "huytran97") return true;

    // 4. Nếu có kết nối Server Apps Script, xác thực trực tiếp qua action "login"
    if (window.isConfigured && window.isConfigured() && typeof CONFIG !== 'undefined' && CONFIG.WEB_APP_URL) {
        try {
            const resp = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ action: "login", username: "admin", password: trimmedPw }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const data = await resp.json();
            if (data && data.status === "success" && data.role === "ADMIN") {
                return true;
            }
        } catch (e) {
            console.warn("Online admin verification error:", e);
        }
    }

    return false;
}

async function submitInvAdminAuth() {
    const input = document.getElementById('inv-admin-pw-input');
    const err = document.getElementById('inv-admin-pw-error');
    const submitBtn = document.getElementById('btn-submit-inv-auth');
    if (!input) return;

    const pw = input.value;
    if (!pw) {
        if (err) {
            err.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Vui lòng nhập mật khẩu Admin!';
            err.style.display = 'block';
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';
    }

    try {
        const isValid = await verifyAdminPassword(pw);
        if (isValid) {
            closeInvAdminAuthModal();
            applyUnifiedInvestmentVisibility(true);
            if (window.showToast) {
                window.showToast('👁️ Đã mở khóa hiển thị danh mục và tài sản', 'success');
            }
        } else {
            if (err) {
                err.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Mật khẩu Admin không chính xác!';
                err.style.display = 'block';
            }
            input.value = '';
            input.focus();
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Mở Khóa';
        }
    }
}
window.submitInvAdminAuth = submitInvAdminAuth;

document.addEventListener('DOMContentLoaded', () => {
    // Áp dụng trạng thái mặc định: Ẩn toàn bộ
    applyUnifiedInvestmentVisibility(isInvPrivacyUnlocked);
});

// --- Analytics & Charts Logic ---
function formatCurrencyChart(val, currency = 'VND') {
    if (currency === 'USD') {
        if (Math.abs(val) >= 1000) return '$' + (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return '$' + Math.round(val).toLocaleString();
    } else {
        if (Math.abs(val) >= 1000000000) return (val / 1000000000).toFixed(2).replace(/\.00$/, '') + ' Tỷ';
        if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + ' Tr';
        if (Math.abs(val) >= 1000) return (val / 1000).toFixed(0) + 'k';
        return Math.round(val).toLocaleString('vi-VN') + ' ₫';
    }
}

function updateInvestmentCharts() {
    if (typeof Chart === 'undefined') return;

    // 1. Chuẩn bị bản đồ giá hiện tại của từng mã
    const currentPriceMap = {};
    invPortfolioData.forEach(p => {
        const symbol = String(p["Mã/Tên"] || "").trim().toUpperCase();
        const rawPrice = p["Giá Hiện Tại"];
        const unitPrice = typeof rawPrice === 'number' ? rawPrice :
            parseFloat(String(rawPrice || 0).replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')) || 0;
        currentPriceMap[symbol] = unitPrice;
    });

    // 2. Lọc giao dịch theo Mã Tài Sản nếu người dùng chọn riêng mã
    const sortedTx = [...invHistoryData].sort((a, b) => {
        const dateA = parseDate(a["Ngày Giao Dịch"] || a["Ngày"]);
        const dateB = parseDate(b["Ngày Giao Dịch"] || b["Ngày"]);
        return dateA - dateB;
    });

    const activeAssetFilter = currentInvAssetFilter || 'ALL';
    const filteredTx = activeAssetFilter === 'ALL' 
        ? sortedTx 
        : sortedTx.filter(t => String(t["Mã/Tên"] || "").trim().toUpperCase() === activeAssetFilter);

    // 3. Xây dựng chuỗi điểm dữ liệu Vốn & NAV theo thời gian
    const positions = {};
    const rawTimelinePoints = [];

    filteredTx.forEach(tx => {
        const sym = String(tx["Mã/Tên"] || "").trim().toUpperCase();
        if (!sym) return;
        if (!positions[sym]) positions[sym] = { qty: 0, capital: 0 };

        const pos = positions[sym];
        const type = String(tx["Loại Sự Kiện"] || tx["Loại Giao Dịch"] || "").trim();
        const amt = parseFloat(tx["Số Tiền"]) || 0;
        const qty = parseFloat(tx["Số Lượng"]) || 0;

        if (type === "Mua") {
            pos.capital += amt;
            pos.qty += qty;
        } else if (type === "Bán") {
            const avgCost = pos.qty > 0 ? (pos.capital / pos.qty) : 0;
            const costBasisSold = Math.min(pos.capital, qty * avgCost);
            pos.capital = Math.max(0, pos.capital - costBasisSold);
            pos.qty = Math.max(0, pos.qty - qty);
        } else if (type.includes("Cổ Tức") && (type.includes("CP") || type.includes("Cổ Phiếu"))) {
            pos.qty += qty;
        }

        // Tính tổng vốn và tổng NAV tại mốc giao dịch này
        let snapCapital = 0;
        let snapNav = 0;
        Object.keys(positions).forEach(s => {
            const p = positions[s];
            snapCapital += p.capital;
            const price = currentPriceMap[s] || (p.qty > 0 ? (p.capital / p.qty) : 0);
            snapNav += p.qty * price;
        });

        const dateObj = parseDate(tx["Ngày Giao Dịch"] || tx["Ngày"]);
        const displayDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

        rawTimelinePoints.push({
            date: dateObj,
            label: displayDate,
            capital: snapCapital,
            nav: snapNav
        });
    });

    // Thêm điểm Hôm nay (Hiện tại)
    let currentTotalCap = 0;
    let currentTotalNav = 0;
    if (activeAssetFilter === 'ALL') {
        invPortfolioData.forEach(p => {
            currentTotalCap += p.capital || 0;
            const rawP = p["Giá Hiện Tại"];
            const uP = typeof rawP === 'number' ? rawP :
                parseFloat(String(rawP || 0).replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')) || 0;
            currentTotalNav += (p.totalQty || 0) * uP;
        });
    } else {
        const p = invPortfolioData.find(item => String(item["Mã/Tên"] || "").trim().toUpperCase() === activeAssetFilter);
        if (p) {
            currentTotalCap = p.capital || 0;
            const rawP = p["Giá Hiện Tại"];
            const uP = typeof rawP === 'number' ? rawP :
                parseFloat(String(rawP || 0).replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')) || 0;
            currentTotalNav = (p.totalQty || 0) * uP;
        }
    }

    const todayDate = new Date();
    const todayLabel = `${todayDate.getDate().toString().padStart(2, '0')}/${(todayDate.getMonth() + 1).toString().padStart(2, '0')}/${todayDate.getFullYear()}`;
    rawTimelinePoints.push({
        date: todayDate,
        label: todayLabel,
        capital: currentTotalCap,
        nav: currentTotalNav
    });

    // 4. Lọc theo Khung Thời Gian (Timeframes: 1M, 3M, 6M, YTD, 1Y, ALL)
    const nowMs = Date.now();
    let cutoffMs = 0;
    if (currentInvTimeframe === '1M') cutoffMs = nowMs - 30 * 86400000;
    else if (currentInvTimeframe === '3M') cutoffMs = nowMs - 90 * 86400000;
    else if (currentInvTimeframe === '6M') cutoffMs = nowMs - 180 * 86400000;
    else if (currentInvTimeframe === 'YTD') cutoffMs = new Date(todayDate.getFullYear(), 0, 1).getTime();
    else if (currentInvTimeframe === '1Y') cutoffMs = nowMs - 365 * 86400000;

    let timelinePoints = rawTimelinePoints.filter(pt => pt.date.getTime() >= cutoffMs);
    if (timelinePoints.length === 0) {
        timelinePoints = rawTimelinePoints.slice(-2);
    }

    // 5. Cập nhật Thống kê Lợi nhuận kỳ (#inv-tf-pnl)
    const endPoint = timelinePoints[timelinePoints.length - 1];
    const periodProfit = endPoint.nav - endPoint.capital;
    const periodRoi = endPoint.capital > 0 ? (periodProfit / endPoint.capital) * 100 : 0;
    const tfPnlEl = document.getElementById('inv-tf-pnl');
    if (tfPnlEl) {
        const sign = periodProfit >= 0 ? '+' : '';
        const color = periodProfit >= 0 ? '#10b981' : '#f43f5e';
        const formattedProf = window.formatCurrency ? window.formatCurrency(periodProfit) : (periodProfit.toLocaleString('vi-VN') + ' ₫');
        tfPnlEl.innerHTML = `<span style="color: ${color};">${sign}${formattedProf} (${sign}${periodRoi.toFixed(1)}%)</span>`;
    }

    // 6. Chuyển đổi đơn vị hiển thị (VNĐ hoặc USD)
    const isUSD = currentInvCurrency === 'USD';
    const divisor = isUSD ? usdExchangeRate : 1;

    const chartLabels = timelinePoints.map(d => d.label);
    const navData = timelinePoints.map(d => d.nav / divisor);
    const capData = timelinePoints.map(d => d.capital / divisor);

    // Cập nhật Subtitle biểu đồ
    const subtitleEl = document.getElementById('inv-chart-subtitle');
    if (subtitleEl) {
        subtitleEl.innerText = isUSD 
            ? `Quy đổi USD (Tỷ giá: 1 USD = ${window.formatNumber ? window.formatNumber(usdExchangeRate) : usdExchangeRate.toLocaleString('vi-VN')} VND)`
            : 'Vốn thực rót vs Giá trị thị trường (NAV)';
    }

    // 7. Vẽ Biểu đồ 1: Biến Động Vốn & NAV (Đa Khung Thời Gian)
    const ctxEquity = document.getElementById('chart-inv-equity');
    if (ctxEquity) {
        if (invEquityChart) invEquityChart.destroy();

        invEquityChart = new Chart(ctxEquity, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Giá Trị Thị Trường (NAV)',
                        data: navData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: timelinePoints.length > 25 ? 0 : 3,
                        pointHoverRadius: 6,
                        borderWidth: 2.5
                    },
                    {
                        label: 'Vốn Đầu Tư Thực Rót',
                        data: capData,
                        borderColor: '#6366f1',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.2,
                        pointRadius: timelinePoints.length > 25 ? 0 : 2,
                        pointHoverRadius: 5,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                layout: { padding: { top: 15, bottom: 5 } },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 12, font: { weight: '600', size: 11 } }
                    },
                    datalabels: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.parsed.y;
                                return `${context.dataset.label}: ${formatCurrencyChart(val, isUSD ? 'USD' : 'VND')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grace: '10%',
                        ticks: {
                            callback: v => formatCurrencyChart(v, isUSD ? 'USD' : 'VND'),
                            font: { size: 10 }
                        }
                    },
                    x: {
                        ticks: {
                            maxTicksLimit: 8,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    // 8. Tính toán Hiệu Suất Từng Năm & Bảng Tổng Kết (Annual ROI)
    const yearlyData = {};
    sortedTx.forEach(tx => {
        const date = parseDate(tx["Ngày Giao Dịch"] || tx["Ngày"]);
        const year = date.getFullYear();
        if (!yearlyData[year]) {
            yearlyData[year] = {
                capitalAdded: 0,
                capitalWithdrawn: 0,
                dividends: 0,
                realizedGain: 0,
                capitalBase: 0,
                yearEndNAV: 0
            };
        }

        const symbol = String(tx["Mã/Tên"] || "").trim().toUpperCase();
        const type = String(tx["Loại Sự Kiện"] || tx["Loại Giao Dịch"] || "").trim();
        const amt = parseFloat(tx["Số Tiền"]) || 0;
        const qty = parseFloat(tx["Số Lượng"]) || 0;
        const currentPrice = currentPriceMap[symbol] || 0;

        if (type === "Mua") {
            yearlyData[year].capitalAdded += amt;
            yearlyData[year].capitalBase += amt;
        } else if (type === "Bán") {
            yearlyData[year].capitalWithdrawn += amt;
            const assetPos = invPortfolioData.find(p => p["Mã/Tên"] === symbol);
            const avgCost = (assetPos && assetPos.totalQty > 0) ? (assetPos.capital / assetPos.totalQty) : 0;
            const costBasis = qty * avgCost;
            yearlyData[year].realizedGain += (amt - costBasis);
        } else if (type.includes("Cổ Tức") && type.includes("Tiền")) {
            yearlyData[year].dividends += amt;
        }
    });

    // Thêm năm hiện tại nếu chưa có
    const currentYear = todayDate.getFullYear();
    if (!yearlyData[currentYear]) {
        yearlyData[currentYear] = { capitalAdded: 0, capitalWithdrawn: 0, dividends: 0, realizedGain: 0, capitalBase: currentTotalCap, yearEndNAV: currentTotalNav };
    }

    const years = Object.keys(yearlyData).sort();
    
    // Tính ROI và tổng lợi nhuận cho từng năm
    const annualTableRows = [];
    const roiData = [];
    const benchmarkData = [];

    years.forEach(y => {
        const d = yearlyData[y];
        const isThisYear = parseInt(y, 10) === currentYear;
        
        // Lợi nhuận năm = Lãi chốt + Cổ tức + (Chênh lệch giá trị chưa chốt nếu là năm hiện tại)
        let totalNetProfit = d.realizedGain + d.dividends;
        if (isThisYear) {
            const paperProfit = currentTotalNav - currentTotalCap;
            totalNetProfit += paperProfit;
        }

        const capBase = d.capitalBase > 0 ? d.capitalBase : currentTotalCap;
        const roi = capBase > 0 ? (totalNetProfit / capBase) * 100 : 0;
        
        roiData.push(roi.toFixed(2));
        benchmarkData.push(6.5); // Benchmark lãi suất tiết kiệm 6.5%/năm

        const roiDiff = roi - 6.5;
        const diffBadge = roiDiff >= 0 
            ? `<span style="color: #10b981; font-weight: 700;">🟢 +${roiDiff.toFixed(1)}%</span>`
            : `<span style="color: #f43f5e; font-weight: 700;">🔴 ${roiDiff.toFixed(1)}%</span>`;

        annualTableRows.push({
            year: isThisYear ? `${y} (YTD)` : y,
            capitalAdded: d.capitalAdded,
            netProfit: totalNetProfit,
            dividends: d.dividends,
            roi: roi,
            diffBadge: diffBadge
        });
    });

    // 9. Tính toán Tỷ lệ Tăng Trưởng Kép CAGR
    let cagrStr = '--%';
    if (years.length >= 2 && currentTotalCap > 0 && currentTotalNav > 0) {
        const numYears = Math.max(1, years.length - 1);
        const totalReturnRatio = currentTotalNav / currentTotalCap;
        if (totalReturnRatio > 0) {
            const cagr = (Math.pow(totalReturnRatio, 1 / numYears) - 1) * 100;
            cagrStr = `CAGR: ${cagr >= 0 ? '+' : ''}${cagr.toFixed(1)}%/năm`;
        }
    } else if (roiData.length > 0) {
        cagrStr = `ROI: +${roiData[roiData.length - 1]}%`;
    }
    const cagrBadge = document.getElementById('inv-cagr-badge');
    if (cagrBadge) cagrBadge.innerText = cagrStr;

    // 10. Vẽ Biểu đồ 2: Hiệu Suất Từng Năm & Benchmark
    const ctxRoi = document.getElementById('chart-inv-annual-roi');
    if (ctxRoi) {
        if (invRoiChart) invRoiChart.destroy();

        invRoiChart = new Chart(ctxRoi, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        type: 'bar',
                        label: 'ROI Thực Tế (%)',
                        data: roiData,
                        backgroundColor: roiData.map(v => parseFloat(v) >= 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(244, 63, 94, 0.85)'),
                        borderRadius: 8,
                        order: 2
                    },
                    {
                        type: 'line',
                        label: 'Benchmark Tiết Kiệm (6.5%)',
                        data: benchmarkData,
                        borderColor: '#f59e0b',
                        borderDash: [4, 4],
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: false,
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 12, font: { weight: '600', size: 11 } }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        formatter: (v, ctx) => ctx.datasetIndex === 0 ? v + '%' : '',
                        font: { weight: 'bold', size: 10 }
                    }
                },
                scales: {
                    y: {
                        grace: '15%',
                        ticks: { callback: v => v + '%', font: { size: 10 } }
                    },
                    x: { ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    // 11. Render Bảng Tổng Kết Dòng Tiền & Tỷ Suất Từng Năm
    const annualTableBody = document.getElementById('inv-annual-table-body');
    if (annualTableBody) {
        annualTableBody.innerHTML = '';
        annualTableRows.forEach(r => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #f1f5f9';
            const profColor = r.netProfit >= 0 ? '#10b981' : '#f43f5e';
            const profSign = r.netProfit >= 0 ? '+' : '';
            const roiSign = r.roi >= 0 ? '+' : '';
            tr.innerHTML = `
                <td style="text-align: left; padding: 8px; font-weight: 700; color: #0f172a;">${r.year}</td>
                <td style="padding: 8px; color: #64748b;">${window.formatShorthandCurrency ? window.formatShorthandCurrency(r.capitalAdded) : r.capitalAdded}</td>
                <td style="padding: 8px; font-weight: 700; color: ${profColor};">${profSign}${window.formatShorthandCurrency ? window.formatShorthandCurrency(r.netProfit) : r.netProfit}</td>
                <td style="padding: 8px; color: #0284c7; font-weight: 600;">${window.formatShorthandCurrency ? window.formatShorthandCurrency(r.dividends) : r.dividends}</td>
                <td style="padding: 8px; font-weight: 700; color: ${profColor};">${roiSign}${r.roi.toFixed(1)}%</td>
                <td style="padding: 8px; text-align: center;">${r.diffBadge}</td>
            `;
            annualTableBody.appendChild(tr);
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

window.loadInvestmentDemoData = function () {
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

    // Sao lưu cache dữ liệu thật nếu chưa ở chế độ demo
    if (localStorage.getItem('inv_demo_mode') !== 'true') {
        const currentCache = localStorage.getItem('cached_inv_history');
        if (currentCache) {
            localStorage.setItem('cached_real_inv_history', currentCache);
        }
    }

    localStorage.setItem('cached_inv_history', JSON.stringify(demoCashFlow));
    localStorage.setItem('inv_demo_mode', 'true');

    if (confirm("Đã tạo 40 bản ghi demo (2022-2025). Hệ thống đã tạm dừng đồng bộ dữ liệu thật để bạn xem demo. Tải lại trang?")) {
        location.reload();
    }
};

window.exitInvestmentDemoMode = async function () {
    localStorage.removeItem('inv_demo_mode');
    localStorage.setItem('inv_demo_mode', 'false');

    // Khôi phục dữ liệu thật từ cache nếu có, hoặc xóa cache demo
    const realCache = localStorage.getItem('cached_real_inv_history');
    if (realCache) {
        localStorage.setItem('cached_inv_history', realCache);
        localStorage.removeItem('cached_real_inv_history');
    } else {
        localStorage.removeItem('cached_inv_history');
    }

    if (window.showToast) {
        window.showToast("Đang thoát chế độ Demo và tải lại dữ liệu thật...", "info");
    }

    if (typeof updateInvestmentDemoUI === 'function') {
        updateInvestmentDemoUI();
    }

    try {
        if (window.fetchInvestmentData) {
            await window.fetchInvestmentData(true);
        }
    } catch (e) {
        console.warn("Lỗi fetch khi thoát demo:", e);
    }

    location.reload();
};

window.updateInvestmentDemoUI = function () {
    const isDemo = localStorage.getItem('inv_demo_mode') === 'true';

    // 1. Top Banner
    const invDemoBanner = document.getElementById('inv-demo-banner');
    if (invDemoBanner) {
        invDemoBanner.style.display = isDemo ? 'flex' : 'none';
    }

    // 2. Table Header Exit Button
    const btnExitDemo = document.getElementById('btn-exit-demo');
    if (btnExitDemo) {
        btnExitDemo.style.display = isDemo ? 'inline-flex' : 'none';
    }

    // 3. Card "Hiệu Suất Đầu Tư (Hàng Năm)" buttons
    const btnAnnualDemo = document.getElementById('btn-inv-annual-demo');
    const btnAnnualExitDemo = document.getElementById('btn-inv-annual-exit-demo');
    if (btnAnnualExitDemo) {
        btnAnnualExitDemo.style.display = isDemo ? 'inline-flex' : 'none';
    }
    if (btnAnnualDemo) {
        btnAnnualDemo.style.display = isDemo ? 'none' : 'inline-flex';
    }
};

function derivePortfolioFromHistory() {
    if (!invHistoryData || invHistoryData.length === 0) return;

    invCustomPrices = JSON.parse(localStorage.getItem('inv_custom_prices') || '{}');
    invCustomMeta = JSON.parse(localStorage.getItem('inv_custom_meta') || '{}');

    // Tự động xóa bỏ các override thủ công về số lượng/vốn cũ để lịch sử Sheet luôn tự động count chính xác
    let metaChanged = false;
    Object.keys(invCustomMeta).forEach(k => {
        if (invCustomMeta[k].totalQty !== undefined) { delete invCustomMeta[k].totalQty; metaChanged = true; }
        if (invCustomMeta[k].capital !== undefined) { delete invCustomMeta[k].capital; metaChanged = true; }
    });
    if (metaChanged) {
        localStorage.setItem('inv_custom_meta', JSON.stringify(invCustomMeta));
    }

    // Sắp xếp giao dịch theo thứ tự thời gian tăng dần để tính toán dòng vốn và khối lượng chính xác
    const sortedHistory = [...invHistoryData].sort((a, b) => {
        const dateA = parseDate(a["Ngày Giao Dịch"] || a["Ngày"]);
        const dateB = parseDate(b["Ngày Giao Dịch"] || b["Ngày"]);
        return dateA - dateB;
    });

    const grouped = {};
    sortedHistory.forEach(row => {
        const symbol = String(row["Mã/Tên"] || "").trim().toUpperCase();
        if (!symbol) return;
        if (!grouped[symbol]) {
            grouped[symbol] = {
                "Mã/Tên": symbol,
                totalQty: 0,
                capital: 0,
                divs: 0,
                realizedPnl: 0,
                "Phân Loại": "",
                "Định Giá Lý Thuyết": 0,
                "Giá Hiện Tại": 0,
                "Luận Điểm Đầu Tư": "",
                "Ngày Bắt Đầu": row["Ngày Giao Dịch"] || row["Ngày"]
            };
        }
        const g = grouped[symbol];
        const type = String(row["Loại Sự Kiện"] || row["Loại Giao Dịch"] || "").trim();
        const qty = parseInvNumber(row["Số Lượng"]);
        const amt = parseInvNumber(row["Số Tiền"]);

        if (type === "Mua") {
            g.totalQty += qty;
            g.capital += amt;
        } else if (type === "Bán") {
            const avgCost = g.totalQty > 0 ? (g.capital / g.totalQty) : 0;
            const costBasisSold = Math.min(g.capital, qty * avgCost);
            g.capital = Math.max(0, g.capital - costBasisSold);
            g.totalQty = Math.max(0, g.totalQty - qty);
            g.realizedPnl += (amt - costBasisSold);
        } else if (type.includes("Cổ Tức")) {
            if (type.includes("Tiền")) g.divs += amt;
            if (type.includes("CP") || type.includes("Cổ Phiếu")) g.totalQty += qty;
        }

        if (row["Phân Loại"]) g["Phân Loại"] = row["Phân Loại"];
        if (row["Định Giá Lý Thuyết"]) g["Định Giá Lý Thuyết"] = parseInvNumber(row["Định Giá Lý Thuyết"]);
        if (row["Giá Hiện Tại"] !== undefined && row["Giá Hiện Tại"] !== null && row["Giá Hiện Tại"] !== "") {
            g["Giá Hiện Tại"] = parseInvNumber(row["Giá Hiện Tại"]);
        }
        if (row["Luận Điểm Đầu Tư"]) g["Luận Điểm Đầu Tư"] = row["Luận Điểm Đầu Tư"];
    });

    // Áp dụng ghi đè thị giá hoặc phân loại tùy chỉnh
    Object.keys(grouped).forEach(sym => {
        if (invCustomPrices[sym] !== undefined && invCustomPrices[sym] !== null && invCustomPrices[sym] !== "") {
            grouped[sym]["Giá Hiện Tại"] = parseInvNumber(invCustomPrices[sym]);
        }
        if (invCustomMeta[sym]) {
            if (invCustomMeta[sym]["Phân Loại"]) grouped[sym]["Phân Loại"] = invCustomMeta[sym]["Phân Loại"];
            if (invCustomMeta[sym]["Định Giá Lý Thuyết"]) grouped[sym]["Định Giá Lý Thuyết"] = parseInvNumber(invCustomMeta[sym]["Định Giá Lý Thuyết"]);
            if (invCustomMeta[sym]["Luận Điểm Đầu Tư"]) grouped[sym]["Luận Điểm Đầu Tư"] = invCustomMeta[sym]["Luận Điểm Đầu Tư"];
        }
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
if (typeof updateInvestmentDemoUI === 'function') updateInvestmentDemoUI();

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
    if (typeof updateInvestmentDemoUI === 'function') updateInvestmentDemoUI();

    // 2. Data Sync Logic (Background Fetch)
    window.fetchInvestmentData = async function (force = false) {
        if (window.getRole && window.getRole() === 'EMP_LV2') return;
        const savedView = localStorage.getItem("active_app_view");
        const viewEl = document.getElementById('view-investment');
        const isInvVisible = viewEl && (viewEl.style.display !== 'none' && getComputedStyle(viewEl).display !== 'none');
        // Cho phép fetch nếu force=true hoặc view-investment đang hiển thị hoặc active_app_view là investment
        if (!force && !isInvVisible && savedView !== 'investment') return;

        // Ngăn chặn ghi đè nếu đang ở chế độ Demo
        if (localStorage.getItem('inv_demo_mode') === 'true') {
            console.log("Investment Demo Mode is ON: Skipping data fetch.");
            return;
        }

        if (typeof CONFIG === 'undefined' || !CONFIG.WEB_APP_URL || CONFIG.WEB_APP_URL === "NOT_CONFIGURED" || CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
            console.warn("Investment CONFIG.WEB_APP_URL not configured. Skipping sync.");
            return;
        }

        try {
            const token = window.getToken ? window.getToken() : null;
            if (!token) return;

            // Cache busting: adding a timestamp
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "get_investment_data",
                    token: token,
                    _cb: Date.now()
                }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const res = await response.json();

            if (res.status === "success") {
                const rows = res.history || [];
                if (rows.length > 1) {
                    const rawHeaders = rows[0];
                    // Standardize headers: Trim and treat nulls gracefully
                    const headers = rawHeaders.map(h => String(h || "").trim());

                    invHistoryData = rows.slice(1).map(row => {
                        let obj = {};
                        headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
                        return obj;
                    });

                    console.log("=== Investment History Data (Raw) ===");
                    console.log(invHistoryData);
                }

                derivePortfolioFromHistory();

                // Update Last Fetch Time
                const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                localStorage.setItem('inv_last_fetch_time', nowStr);

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

    const btnRefresh = document.getElementById('btn-refresh-inv');
    const btnExitDemo = document.getElementById('btn-exit-demo');

    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            btnRefresh.style.transform = 'rotate(360deg)';
            btnRefresh.disabled = true;

            // Tự động tắt Demo Mode nếu người dùng chủ động nhấn Refresh
            if (localStorage.getItem('inv_demo_mode') === 'true') {
                localStorage.setItem('inv_demo_mode', 'false');
                if (window.showToast) window.showToast("Đã tắt Chế độ Demo để đồng bộ dữ liệu thật!", "info");
            }

            if (window.showToast) window.showToast("Đang làm mới dữ liệu đầu tư...", "info");

            await window.fetchInvestmentData(true);

            setTimeout(() => {
                btnRefresh.style.transform = 'rotate(0deg)';
                btnRefresh.disabled = false;
            }, 500);
        });
    }

    if (btnExitDemo) {
        btnExitDemo.addEventListener('click', async () => {
            window.exitInvestmentDemoMode();
        });
    }

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
                    "Đơn Giá": amount / quantity,
                    "Phân Loại": invInputType.value,
                    "Định Giá Lý Thuyết": intrinsic,
                    "Giá Hiện Tại": amount / quantity,
                    "Luận Điểm Đầu Tư": note,
                    "Ghi Chú": note
                };

                if (typeof CONFIG === 'undefined' || !CONFIG.WEB_APP_URL || CONFIG.WEB_APP_URL === "NOT_CONFIGURED" || CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
                    alert("Chưa cấu hình CONFIG.WEB_APP_URL. Không thể lưu giao dịch.");
                    btnSaveInv.innerHTML = originalHTML;
                    btnSaveInv.disabled = false;
                    return;
                }

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
    window.openInvTxModal = function (symbol) {
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
    window.openInvTxModal = function (symbol) {
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

            if (typeof CONFIG === 'undefined' || !CONFIG.WEB_APP_URL || CONFIG.WEB_APP_URL === "NOT_CONFIGURED" || CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
                alert("Chưa cấu hình CONFIG.WEB_APP_URL. Không thể lưu giao dịch.");
                btnSaveTx.innerHTML = originalHTML;
                btnSaveTx.disabled = false;
                return;
            }

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

    // --- 4. Interactive Event Handlers for Timeframe, Asset Filter & Currency ---
    // Timeframe filter buttons
    const tfButtons = document.querySelectorAll('.btn-inv-tf');
    tfButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tfButtons.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#475569';
                b.style.boxShadow = 'none';
            });
            btn.classList.add('active');
            btn.style.background = '#6366f1';
            btn.style.color = 'white';
            btn.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.3)';
            currentInvTimeframe = btn.dataset.tf || 'ALL';
            updateInvestmentCharts();
        });
    });

    // Currency toggle buttons
    const currButtons = document.querySelectorAll('.btn-inv-curr');
    currButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currButtons.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#64748b';
                b.style.boxShadow = 'none';
            });
            btn.classList.add('active');
            btn.style.background = 'white';
            btn.style.color = '#0f172a';
            btn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
            currentInvCurrency = btn.dataset.curr || 'VND';
            updateInvestmentCharts();
        });
    });

    // Asset filter dropdown
    const assetFilterEl = document.getElementById('inv-chart-asset-filter');
    if (assetFilterEl) {
        assetFilterEl.addEventListener('change', (e) => {
            currentInvAssetFilter = e.target.value;
            updateInvestmentCharts();
        });
    }

    // Toggle Annual Performance Table
    const btnToggleAnnual = document.getElementById('btn-toggle-annual-table');
    const annualWrapper = document.getElementById('inv-annual-table-wrapper');
    if (btnToggleAnnual && annualWrapper) {
        btnToggleAnnual.addEventListener('click', () => {
            const isHidden = annualWrapper.style.display === 'none' || !annualWrapper.style.display;
            annualWrapper.style.display = isHidden ? 'block' : 'none';
            btnToggleAnnual.style.background = isHidden ? '#e2e8f0' : '#f1f5f9';
        });
    }

    // --- 5. Quick Price Update Modal Logic ---
    const btnQuickPrice = document.getElementById('btn-quick-update-price');
    const modalQuickPrice = document.getElementById('modal-quick-price-update');
    const quickPriceContainer = document.getElementById('quick-price-items-container');
    const quickSimulatedNav = document.getElementById('quick-price-simulated-nav');
    const btnSaveQuickPrices = document.getElementById('btn-save-quick-prices');

    function updateSimulatedNav() {
        let simNav = 0;
        if (!quickPriceContainer) return;
        const inputs = quickPriceContainer.querySelectorAll('.quick-price-input');
        inputs.forEach(inp => {
            const qty = parseFloat(inp.dataset.qty) || 0;
            const price = window.parseMoney ? window.parseMoney(inp.value) : (parseFloat(inp.value.replace(/\./g, '')) || 0);
            simNav += qty * price;
        });
        if (quickSimulatedNav) {
            quickSimulatedNav.innerText = window.formatCurrency ? window.formatCurrency(simNav) : (simNav.toLocaleString('vi-VN') + ' ₫');
        }
    }

    if (btnQuickPrice) {
        btnQuickPrice.addEventListener('click', () => {
            if (window.getRole && window.getRole() !== 'ADMIN') {
                if (window.showToast) window.showToast('Bạn không có quyền thực hiện thao tác này', 'error');
                else alert('Bạn không có quyền thực hiện thao tác này');
                return;
            }
            if (!quickPriceContainer) return;
            quickPriceContainer.innerHTML = '';

            if (invPortfolioData.length === 0) {
                quickPriceContainer.innerHTML = '<p style="text-align: center; color: #64748b; padding: 1rem;">Chưa có tài sản nào trong danh mục.</p>';
                if (modalQuickPrice) modalQuickPrice.style.display = 'flex';
                return;
            }

            invPortfolioData.forEach(item => {
                const sym = item["Mã/Tên"];
                const rawP = item["Giá Hiện Tại"];
                const unitP = typeof rawP === 'number' ? rawP :
                    parseFloat(String(rawP || 0).replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')) || 0;
                const formattedPrice = window.formatCurrency ? window.formatCurrency(unitP).replace(' ₫', '').trim() : unitP.toLocaleString('vi-VN');

                const row = document.createElement('div');
                row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0;';
                row.innerHTML = `
                    <div>
                        <strong style="color: #0f172a; font-size: 0.95rem;">${sym}</strong>
                        <span style="font-size: 0.78rem; color: #64748b; margin-left: 8px;">(${item["Phân Loại"] || 'CP'} | SL: ${new Intl.NumberFormat('vi-VN').format(item.totalQty)})</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="text" class="quick-price-input" data-symbol="${sym}" data-qty="${item.totalQty}" value="${formattedPrice}"
                            style="width: 140px; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 8px; text-align: right; font-weight: 700; color: #b45309; font-size: 0.95rem; outline: none; background: white;" />
                        <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">₫</span>
                    </div>
                `;
                quickPriceContainer.appendChild(row);
            });

            const inputs = quickPriceContainer.querySelectorAll('.quick-price-input');
            inputs.forEach(inp => {
                inp.addEventListener('input', updateSimulatedNav);
            });

            updateSimulatedNav();
            if (modalQuickPrice) modalQuickPrice.style.display = 'flex';
        });
    }

            if (btnSaveQuickPrices) {
        btnSaveQuickPrices.addEventListener('click', async () => {
            if (!quickPriceContainer) return;
            const inputs = quickPriceContainer.querySelectorAll('.quick-price-input');
            const pricesToUpdate = {};
            inputs.forEach(inp => {
                const sym = inp.dataset.symbol;
                const price = window.parseMoney ? window.parseMoney(inp.value) : parseInvNumber(inp.value);
                if (sym && price >= 0) {
                    pricesToUpdate[sym] = price;
                    invCustomPrices[sym] = price;
                }
            });
            localStorage.setItem('inv_custom_prices', JSON.stringify(invCustomPrices));

            // Hiệu ứng Loading
            const originalHTML = btnSaveQuickPrices.innerHTML;
            btnSaveQuickPrices.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ lên Sheet...';
            btnSaveQuickPrices.disabled = true;

            try {
                if (typeof CONFIG !== 'undefined' && CONFIG.WEB_APP_URL && CONFIG.WEB_APP_URL !== "NOT_CONFIGURED") {
                    const token = window.getToken ? window.getToken() : null;
                    const response = await fetch(CONFIG.WEB_APP_URL, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({
                            action: "update_external_prices",
                            token: token,
                            prices: pricesToUpdate
                        })
                    });
                    const res = await response.json();
                    if (res && res.status === "success") {
                        if (res.history && res.history.length > 1) {
                            const rawHeaders = res.history[0];
                            const headers = rawHeaders.map(h => String(h || "").trim());
                            invHistoryData = res.history.slice(1).map(row => {
                                let obj = {};
                                headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
                                return obj;
                            });
                            localStorage.setItem('cached_inv_history', JSON.stringify(invHistoryData));
                        }
                        if (window.showToast) window.showToast('Đã cập nhật thị giá vào Google Sheet thành công!', 'success');
                    } else {
                        if (window.showToast) window.showToast('Đã lưu cục bộ. Lỗi đồng bộ Sheet: ' + (res.message || ''), 'warning');
                    }
                }
            } catch (err) {
                console.error("Lỗi khi cập nhật giá lên Sheet:", err);
                if (window.showToast) window.showToast('Đã lưu cục bộ. Không thể kết nối tới Google Sheet.', 'warning');
            } finally {
                btnSaveQuickPrices.innerHTML = originalHTML;
                btnSaveQuickPrices.disabled = false;
            }

            derivePortfolioFromHistory();
            renderInvestmentPortfolio();

            if (modalQuickPrice) modalQuickPrice.style.display = 'none';
        });
    }

    // --- 6. Edit Investment Asset Modal Logic ---
    const modalEditInv = document.getElementById('modal-edit-investment');
    const editSymEl = document.getElementById('inv-edit-symbol');
    const editTitleEl = document.getElementById('inv-edit-title');
    const editTypeEl = document.getElementById('inv-edit-type');
    const editQtyEl = document.getElementById('inv-edit-qty');
    const editCapitalEl = document.getElementById('inv-edit-capital');
    const editIntrinsicEl = document.getElementById('inv-edit-intrinsic');
    const editNoteEl = document.getElementById('inv-edit-note');
    const btnSaveEditInv = document.getElementById('btn-save-edit-inv');

    window.openEditAssetModal = function (symbol) {
        const asset = invPortfolioData.find(p => p["Mã/Tên"] === symbol);
        if (!asset) return;

        if (editSymEl) editSymEl.value = symbol;
        if (editTitleEl) editTitleEl.innerText = `Chỉnh Sửa Mã: ${symbol}`;
        if (editTypeEl) editTypeEl.value = asset["Phân Loại"] || 'Cổ Phiếu';
        
        if (editQtyEl) editQtyEl.value = asset.totalQty !== undefined ? asset.totalQty : 1;
        if (editCapitalEl) {
            const capVal = asset.capital || 0;
            editCapitalEl.value = window.formatCurrency ? window.formatCurrency(capVal).replace(' ₫', '').trim() : capVal;
        }

        const rawIntr = asset["Định Giá Lý Thuyết"];
        const intrVal = typeof rawIntr === 'number' ? rawIntr : (parseFloat(String(rawIntr || 0).replace(/[^\d]/g, '')) || 0);
        if (editIntrinsicEl) {
            editIntrinsicEl.value = window.formatCurrency ? window.formatCurrency(intrVal).replace(' ₫', '').trim() : intrVal;
        }
        if (editNoteEl) editNoteEl.value = asset["Luận Điểm Đầu Tư"] || '';

        if (modalEditInv) modalEditInv.style.display = 'flex';
    };

    if (btnSaveEditInv) {
        btnSaveEditInv.addEventListener('click', () => {
            const sym = editSymEl ? editSymEl.value : '';
            if (!sym) return;

            const newType = editTypeEl ? editTypeEl.value : 'Cổ Phiếu';
            const newQty = editQtyEl ? parseFloat(editQtyEl.value) : NaN;
            const newCapital = editCapitalEl && window.parseMoney ? window.parseMoney(editCapitalEl.value) : (parseFloat(editCapitalEl ? editCapitalEl.value.replace(/\./g, '') : 0) || 0);
            const newIntrinsic = window.parseMoney ? window.parseMoney(editIntrinsicEl.value) : 0;
            const newNote = editNoteEl ? editNoteEl.value.trim() : '';

            if (!invCustomMeta[sym]) invCustomMeta[sym] = {};
            invCustomMeta[sym]["Phân Loại"] = newType;
            if (!isNaN(newQty)) invCustomMeta[sym].totalQty = newQty;
            if (!isNaN(newCapital) && newCapital >= 0) invCustomMeta[sym].capital = newCapital;
            invCustomMeta[sym]["Định Giá Lý Thuyết"] = newIntrinsic;
            invCustomMeta[sym]["Luận Điểm Đầu Tư"] = newNote;

            localStorage.setItem('inv_custom_meta', JSON.stringify(invCustomMeta));

            derivePortfolioFromHistory();
            renderInvestmentPortfolio();

            if (modalEditInv) modalEditInv.style.display = 'none';
            if (window.showToast) window.showToast(`Đã lưu thay đổi cho mã ${sym}!`, 'success');
        });
    }
});
