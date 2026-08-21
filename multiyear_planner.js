/**
 * Multi-Year Financial Planner & Projection Engine
 * Tác giả: Antigravity AI
 * Mô tả: Tính toán doanh thu, chi phí, lịch nợ vay, lợi nhuận ròng, phân bổ tái đầu tư và quỹ dự phòng qua nhiều năm.
 */

(function () {
    // Kịch bản mặc định (Bull, Base, Bear)
    const SCENARIOS = {
        base: {
            name: "Cơ sở (Base Case)",
            revGrowth: 15, // % tăng trưởng doanh thu/năm
            opexRatio: 60, // % chi phí vận hành/doanh thu
            reinvestRate: 40, // % tái đầu tư từ lợi nhuận ròng
            reserveRate: 20, // % trích lập dự phòng
            debtInterest: 9.5, // % lãi suất nợ vay/năm
        },
        bull: {
            name: "Tích cực (Bull Case)",
            revGrowth: 25,
            opexRatio: 50,
            reinvestRate: 50,
            reserveRate: 15,
            debtInterest: 8.5,
        },
        bear: {
            name: "Thận trọng (Bear Case)",
            revGrowth: 5,
            opexRatio: 72,
            reinvestRate: 30,
            reserveRate: 30,
            debtInterest: 11.5,
        }
    };

    let chartRevenueProfit = null;
    let chartAssetDebt = null;

    // Format tiền tệ VND
    function formatVND(amount) {
        if (isNaN(amount) || amount === null) return '0 ₫';
        if (Math.abs(amount) >= 1e9) {
            return (amount / 1e9).toFixed(2) + ' tỷ';
        }
        if (Math.abs(amount) >= 1e6) {
            return (amount / 1e6).toFixed(1) + ' tr';
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    // Khởi tạo các sự kiện giao diện
    function initMultiYearPlanner() {
        const scenarioSelect = document.getElementById('myp-scenario');
        const btnCalculate = document.getElementById('myp-btn-calculate');
        const btnReset = document.getElementById('myp-btn-reset');

        if (!btnCalculate) return;

        // Xử lý đổi kịch bản
        if (scenarioSelect) {
            scenarioSelect.addEventListener('change', (e) => {
                const key = e.target.value;
                if (SCENARIOS[key]) {
                    applyScenarioConfig(SCENARIOS[key]);
                    calculateProjections();
                }
            });
        }

        btnCalculate.addEventListener('click', () => {
            calculateProjections();
        });

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                document.getElementById('myp-initial-capital').value = 1000000000;
                document.getElementById('myp-initial-revenue').value = 500000000;
                document.getElementById('myp-years').value = 5;
                document.getElementById('myp-rev-growth').value = 15;
                document.getElementById('myp-opex-ratio').value = 60;
                document.getElementById('myp-debt-amount').value = 300000000;
                document.getElementById('myp-debt-interest').value = 9.5;
                document.getElementById('myp-debt-term').value = 5;
                document.getElementById('myp-reinvest-rate').value = 40;
                document.getElementById('myp-reserve-rate').value = 20;
                document.getElementById('myp-tax-rate').value = 10;
                if (scenarioSelect) scenarioSelect.value = 'base';
                calculateProjections();
            });
        }

        // Đăng ký tự động tính khi thay đổi slider/input
        const inputs = document.querySelectorAll('.myp-input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const badge = document.getElementById(input.id + '-val');
                if (badge) badge.innerText = input.value + (input.dataset.suffix || '');
                calculateProjections();
            });
        });

        // Tính toán lần đầu tiên
        calculateProjections();
    }

    function applyScenarioConfig(sc) {
        document.getElementById('myp-rev-growth').value = sc.revGrowth;
        document.getElementById('myp-opex-ratio').value = sc.opexRatio;
        document.getElementById('myp-reinvest-rate').value = sc.reinvestRate;
        document.getElementById('myp-reserve-rate').value = sc.reserveRate;
        document.getElementById('myp-debt-interest').value = sc.debtInterest;

        // Cập nhật badges
        ['myp-rev-growth', 'myp-opex-ratio', 'myp-reinvest-rate', 'myp-reserve-rate', 'myp-debt-interest'].forEach(id => {
            const el = document.getElementById(id);
            const badge = document.getElementById(id + '-val');
            if (el && badge) badge.innerText = el.value + (el.dataset.suffix || '');
        });
    }

    // Logic tính toán mô hình tài chính đa năm
    function calculateProjections() {
        const initialCapital = parseFloat(document.getElementById('myp-initial-capital').value) || 0;
        const initialRevenue = parseFloat(document.getElementById('myp-initial-revenue').value) || 0;
        const yearsCount = parseInt(document.getElementById('myp-years').value) || 5;

        const revGrowth = (parseFloat(document.getElementById('myp-rev-growth').value) || 0) / 100;
        const opexRatio = (parseFloat(document.getElementById('myp-opex-ratio').value) || 0) / 100;

        const debtAmount = parseFloat(document.getElementById('myp-debt-amount').value) || 0;
        const debtInterestRate = (parseFloat(document.getElementById('myp-debt-interest').value) || 0) / 100;
        const debtTerm = parseInt(document.getElementById('myp-debt-term').value) || 5;

        const reinvestRate = (parseFloat(document.getElementById('myp-reinvest-rate').value) || 0) / 100;
        const reserveRate = (parseFloat(document.getElementById('myp-reserve-rate').value) || 0) / 100;
        const taxRate = (parseFloat(document.getElementById('myp-tax-rate').value) || 0) / 100;

        // Lịch trả nợ gốc đều (Principal = Debt / Term)
        const annualPrincipalPayment = debtTerm > 0 ? debtAmount / debtTerm : 0;

        let currentDebtBalance = debtAmount;
        let accumulatedReserve = 0;
        let accumulatedReinvest = 0;

        const yearData = [];

        let currentRevenue = initialRevenue;

        let totalRevenueSum = 0;
        let totalNetProfitSum = 0;
        let totalInterestPaidSum = 0;

        for (let y = 1; y <= yearsCount; y++) {
            // Doanh thu năm y
            if (y > 1) {
                currentRevenue = currentRevenue * (1 + revGrowth);
            }

            // Chi phí vận hành
            const opex = currentRevenue * opexRatio;
            const grossProfit = currentRevenue - opex;

            // Tính lãi vay năm y
            let interestExpense = 0;
            let principalPaid = 0;

            if (currentDebtBalance > 0 && y <= debtTerm) {
                interestExpense = currentDebtBalance * debtInterestRate;
                principalPaid = Math.min(annualPrincipalPayment, currentDebtBalance);
            }

            // EBT (Lợi nhuận trước thuế)
            const ebt = Math.max(0, grossProfit - interestExpense);
            const tax = ebt * taxRate;
            const netProfit = ebt - tax;

            // Phân bổ lợi nhuận
            const reinvestAmount = netProfit * reinvestRate;
            const reserveAmount = netProfit * reserveRate;
            const ownerPayout = netProfit - reinvestAmount - reserveAmount;

            // Cập nhật nợ
            currentDebtBalance = Math.max(0, currentDebtBalance - principalPaid);

            // Cập nhật lũy kế
            accumulatedReinvest += reinvestAmount;
            accumulatedReserve += reserveAmount;

            // Tổng tài sản = Vốn ban đầu + Tích lũy tái đầu tư + Quỹ dự phòng - Nợ còn lại
            const accumulatedAssets = initialCapital + accumulatedReinvest + accumulatedReserve;

            totalRevenueSum += currentRevenue;
            totalNetProfitSum += netProfit;
            totalInterestPaidSum += interestExpense;

            yearData.push({
                year: y,
                revenue: currentRevenue,
                opex: opex,
                grossProfit: grossProfit,
                interestExpense: interestExpense,
                principalPaid: principalPaid,
                netProfit: netProfit,
                reinvestAmount: reinvestAmount,
                reserveAmount: reserveAmount,
                ownerPayout: ownerPayout,
                remainingDebt: currentDebtBalance,
                totalAssets: accumulatedAssets
            });
        }

        // Update KPI Summary Cards
        const elProfit = document.getElementById('myp-kpi-total-profit');
        const elAsset = document.getElementById('myp-kpi-final-asset');
        const elInterest = document.getElementById('myp-kpi-total-interest');
        const elReinvest = document.getElementById('myp-kpi-total-reinvest');

        if (elProfit) elProfit.innerText = formatVND(totalNetProfitSum);
        if (elAsset) elAsset.innerText = formatVND(yearData[yearsCount - 1].totalAssets);
        if (elInterest) elInterest.innerText = formatVND(totalInterestPaidSum);
        if (elReinvest) elReinvest.innerText = formatVND(accumulatedReinvest);

        // Render Table & Charts
        renderTable(yearData);
        renderCharts(yearData);
    }

    function renderTable(data) {
        const tbody = document.getElementById('myp-table-body');
        if (!tbody) return;

        let html = '';
        data.forEach(item => {
            html += `
                <tr>
                    <td class="fw-bold text-center">Năm ${item.year}</td>
                    <td class="text-end font-monospace text-success fw-bold">${formatVND(item.revenue)}</td>
                    <td class="text-end font-monospace text-danger">${formatVND(item.opex)}</td>
                    <td class="text-end font-monospace text-warning">${formatVND(item.interestExpense)}</td>
                    <td class="text-end font-monospace text-info">${formatVND(item.principalPaid)}</td>
                    <td class="text-end font-monospace fw-bold ${item.netProfit >= 0 ? 'text-primary' : 'text-danger'}">${formatVND(item.netProfit)}</td>
                    <td class="text-end font-monospace">${formatVND(item.reinvestAmount)}</td>
                    <td class="text-end font-monospace text-muted">${formatVND(item.remainingDebt)}</td>
                    <td class="text-end font-monospace fw-bold text-dark">${formatVND(item.totalAssets)}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    function renderCharts(data) {
        const labels = data.map(d => `Năm ${d.year}`);
        const revenues = data.map(d => Math.round(d.revenue / 1e6)); // triệu VNĐ
        const opexs = data.map(d => Math.round(d.opex / 1e6));
        const netProfits = data.map(d => Math.round(d.netProfit / 1e6));
        const assets = data.map(d => Math.round(d.totalAssets / 1e6));
        const debts = data.map(d => Math.round(d.remainingDebt / 1e6));

        // Biểu đồ 1: Doanh Thu - Chi Phí - Lợi Nhuận
        const ctx1 = document.getElementById('myp-chart-rev-profit');
        if (ctx1 && typeof Chart !== 'undefined') {
            if (chartRevenueProfit) chartRevenueProfit.destroy();

            chartRevenueProfit = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Doanh Thu (Triệu ₫)',
                            data: revenues,
                            backgroundColor: 'rgba(16, 185, 129, 0.75)',
                            borderColor: '#10b981',
                            borderWidth: 1
                        },
                        {
                            label: 'Chi Phí Vận Hành (Triệu ₫)',
                            data: opexs,
                            backgroundColor: 'rgba(239, 68, 68, 0.65)',
                            borderColor: '#ef4444',
                            borderWidth: 1
                        },
                        {
                            label: 'Lợi Nhuận Ròng (Triệu ₫)',
                            data: netProfits,
                            type: 'line',
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + new Intl.NumberFormat('vi-VN').format(context.raw) + ' triệu ₫';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) { return value + ' tr'; }
                            }
                        }
                    }
                }
            });
        }

        // Biểu đồ 2: Tổng Tài Sản vs Nợ
        const ctx2 = document.getElementById('myp-chart-asset-debt');
        if (ctx2 && typeof Chart !== 'undefined') {
            if (chartAssetDebt) chartAssetDebt.destroy();

            chartAssetDebt = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Tổng Tài Sản (Triệu ₫)',
                            data: assets,
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 3
                        },
                        {
                            label: 'Dư Nợ Còn Lại (Triệu ₫)',
                            data: debts,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2,
                            borderDash: [5, 5]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + new Intl.NumberFormat('vi-VN').format(context.raw) + ' triệu ₫';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) { return value + ' tr'; }
                            }
                        }
                    }
                }
            });
        }
    }

    // Xuất hàm khởi tạo toàn cục
    window.initMultiYearPlanner = initMultiYearPlanner;
    window.calculateProjections = calculateProjections;
})();
