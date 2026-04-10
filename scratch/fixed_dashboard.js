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
        const customCmpBox = document.getElementById('unified-cmp-controls');
        if (customCmpBox && customCmpBox.style.display !== 'none') {
            baselineYear = parseInt(document.getElementById('report-year-prev').value) || (selectedYear - 1);
            baselineMonth = parseInt(document.getElementById('report-month-prev').value) || selectedMonth;
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
                let inQ = false;
                if (rangeVal === 'q1' && rowMonth >= 1 && rowMonth <= 3) inQ = true;
                if (rangeVal === 'q2' && rowMonth >= 4 && rowMonth <= 6) inQ = true;
                if (rangeVal === 'q3' && rowMonth >= 7 && rowMonth <= 9) inQ = true;
                if (rangeVal === 'q4' && rowMonth >= 10 && rowMonth <= 12) inQ = true;
                
                if (inQ) {
                    if (rowYear === selectedYear) isCurr = true;
                    if (rowYear === baselineYear) isPrev = true;
                }
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

        function updateGrowth(id, curr, prev, compTitle, unit = '', inverse = false) {
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

            let prevFormatted = '';
            if (unit === '₫') {
                const absPrev = Math.abs(prev);
                if (absPrev >= 1000000) prevFormatted = (prev / 1000000).toFixed(1) + 'tr';
                else if (absPrev >= 1000) prevFormatted = (prev / 1000).toFixed(0) + 'k';
                else prevFormatted = prev.toString();
            } else {
                prevFormatted = prev.toLocaleString('vi-VN');
            }

            el.className = `growth-badge ${colorClass}`;
            el.innerHTML = `<i class="fa-solid ${icon}"></i> ${Math.abs(diffPct).toFixed(1)}% <span style="font-size: 0.85em; margin-left: 4px; opacity: 0.9;">(${prevFormatted} vs ${compTitle})</span>`;
        }

        const compTitle = isMonthlyRange ? `T${baselineMonth}/${baselineYear}` : `Năm ${baselineYear}`;
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
