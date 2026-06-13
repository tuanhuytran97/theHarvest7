/**
 * formulas.js - Thư viện định giá & tính toán tài chính (theHarvest7)
 * Quản lý các công thức định giá cổ phiếu và tính toán chỉ số tài chính.
 */

// Hàm định dạng số khi gõ tiền tệ (60.000)
function formatInputCurrency(val) {
    const digits = String(val).replace(/[^\d]/g, '');
    if (!digits) return "";
    const num = parseInt(digits, 10) || 0;
    return new Intl.NumberFormat('vi-VN').format(num);
}

// Hàm phân tích chuỗi tiền tệ thành số thực
function parseMoneyVal(val) {
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^\d]/g, '')) || 0;
}

// Cấu hình các công thức và trình máy tính
const FORMULAS_CONFIG = {
    pe: {
        title: "Định giá Cổ phiếu theo P/E",
        category: "Định giá Cổ phiếu",
        description: "Phương pháp định giá phổ biến nhất, xác định giá trị cổ phiếu bằng cách nhân thu nhập trên mỗi cổ phần (EPS) dự phóng với chỉ số P/E mục tiêu hợp lý.",
        formulaHtml: "Giá trị Cổ phiếu (P) = EPS &times; P/E",
        inputs: [
            { id: "pe-eps", label: "EPS gần nhất (đ/cổ phiếu)", type: "text", isCurrency: true, value: "5.000", placeholder: "Ví dụ: 5.000" },
            { id: "pe-ratio", label: "P/E Mục tiêu (lần)", type: "number", value: 12, step: "0.1", placeholder: "Ví dụ: 12" }
        ],
        calculate: (inputs) => {
            const eps = parseMoneyVal(inputs["pe-eps"]);
            const pe = parseFloat(inputs["pe-ratio"]) || 0;
            const valuation = eps * pe;

            return {
                value: window.formatCurrency ? window.formatCurrency(valuation) : valuation.toLocaleString("vi-VN") + " ₫",
                details: `
                    <p><strong>Bước tính toán:</strong></p>
                    <ul>
                        <li>Thu nhập trên mỗi cổ phiếu (EPS) = <strong>${eps.toLocaleString("vi-VN")} đ</strong></li>
                        <li>Chỉ số định giá P/E mục tiêu = <strong>${pe} lần</strong></li>
                        <li>Tính toán: ${eps.toLocaleString("vi-VN")} &times; ${pe} = <strong>${valuation.toLocaleString("vi-VN")} đ</strong></li>
                    </ul>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-light); font-style: italic;">
                        * Mẹo: Bạn nên lấy EPS dự báo của năm tới và P/E trung bình 3-5 năm của cổ phiếu hoặc của ngành để có định giá sát thực tế hơn.
                    </p>
                `
            };
        }
    },
    dcf: {
        title: "Chiết khấu Dòng tiền (DCF - 2 Giai đoạn)",
        category: "Định giá Cổ phiếu",
        description: "Ước tính giá trị nội tại dựa trên các dòng tiền tự do (FCF) dự phóng trong tương lai được chiết khấu về giá trị hiện tại bằng tỷ lệ chiết khấu (WACC).",
        formulaHtml: "V<sub>0</sub> = &sum; [FCF<sub>t</sub> / (1 + WACC)<sup>t</sup>] + [TV / (1 + WACC)<sup>n</sup>]",
        inputs: [
            { id: "dcf-fcf", label: "Dòng tiền tự do năm gần nhất (FCF)", type: "text", isCurrency: true, value: "10.000.000.000", placeholder: "Ví dụ: 10.000.000.000" },
            { id: "dcf-g1", label: "Tăng trưởng 5 năm đầu (%)", type: "number", value: 15, step: "0.1", placeholder: "Ví dụ: 15" },
            { id: "dcf-g2", label: "Tăng trưởng 5 năm sau (%)", type: "number", value: 8, step: "0.1", placeholder: "Ví dụ: 8" },
            { id: "dcf-wacc", label: "Tỷ lệ chiết khấu - WACC (%)", type: "number", value: 10, step: "0.1", placeholder: "Ví dụ: 10" },
            { id: "dcf-tg", label: "Tăng trưởng vĩnh viễn (%)", type: "number", value: 3, step: "0.1", placeholder: "Ví dụ: 3" },
            { id: "dcf-shares", label: "Số cổ phiếu lưu hành", type: "text", isCurrency: true, value: "10.000.000", placeholder: "Ví dụ: 10.000.000" },
            { id: "dcf-cash", label: "Tiền mặt ròng (Tiền - Nợ) (Tùy chọn)", type: "text", isCurrency: true, value: "20.000.000.000", placeholder: "Ví dụ: 20.000.000.000" }
        ],
        calculate: (inputs) => {
            const fcf0 = parseMoneyVal(inputs["dcf-fcf"]);
            const g1 = (parseFloat(inputs["dcf-g1"]) || 0) / 100;
            const g2 = (parseFloat(inputs["dcf-g2"]) || 0) / 100;
            const wacc = (parseFloat(inputs["dcf-wacc"]) || 0) / 100;
            const tg = (parseFloat(inputs["dcf-tg"]) || 0) / 100;
            const shares = parseMoneyVal(inputs["dcf-shares"]) || 1;
            const cash = parseMoneyVal(inputs["dcf-cash"]);

            if (wacc <= tg) {
                return {
                    value: "Lỗi dữ liệu",
                    details: "<span style='color: var(--danger); font-weight: 700;'>Lỗi: Tỷ lệ chiết khấu (WACC) phải lớn hơn tốc độ tăng trưởng vĩnh viễn.</span>"
                };
            }

            let projectedFCF = [];
            let pvFCF = [];
            let sumPV = 0;
            let currentFCF = fcf0;

            // Năm 1 - 5
            for (let t = 1; t <= 5; t++) {
                currentFCF = currentFCF * (1 + g1);
                const pv = currentFCF / Math.pow(1 + wacc, t);
                projectedFCF.push(currentFCF);
                pvFCF.push(pv);
                sumPV += pv;
            }

            // Năm 6 - 10
            for (let t = 6; t <= 10; t++) {
                currentFCF = currentFCF * (1 + g2);
                const pv = currentFCF / Math.pow(1 + wacc, t);
                projectedFCF.push(currentFCF);
                pvFCF.push(pv);
                sumPV += pv;
            }

            // Terminal Value ở năm thứ 10
            const fcf10 = projectedFCF[9];
            const terminalValue = (fcf10 * (1 + tg)) / (wacc - tg);
            const pvTerminalValue = terminalValue / Math.pow(1 + wacc, 10);

            // Enterprise Value
            const enterpriseValue = sumPV + pvTerminalValue;
            // Equity Value
            const equityValue = enterpriseValue + cash;
            // Giá trị mỗi cổ phần
            const shareValue = equityValue / shares;

            const format = (num) => window.formatCurrency ? window.formatCurrency(num) : num.toLocaleString("vi-VN") + " ₫";
            const formatShort = (num) => {
                if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + " tỷ";
                if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + " triệu";
                return num.toLocaleString("vi-VN");
            };

            return {
                value: format(shareValue),
                details: `
                    <p><strong>Tóm tắt dự phóng dòng tiền (10 năm):</strong></p>
                    <table class="financial-table" style="width: 100%; font-size: 0.8rem; margin: 10px 0; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f1f5f9;">
                                <th style="padding: 6px; text-align: left;">Năm</th>
                                <th style="padding: 6px; text-align: right;">Dự phóng FCF</th>
                                <th style="padding: 6px; text-align: right;">PV của FCF</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projectedFCF.map((fcf, idx) => `
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 6px; text-align: left;">Năm ${idx + 1} (${idx < 5 ? (g1 * 100).toFixed(0) : (g2 * 100).toFixed(0)}%)</td>
                                    <td style="padding: 6px; text-align: right;">${formatShort(fcf)}</td>
                                    <td style="padding: 6px; text-align: right;">${formatShort(pvFCF[idx])}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <ul style="margin-top: 15px;">
                        <li>Tổng giá trị hiện tại dòng tiền 10 năm: <strong>${formatShort(sumPV)}</strong></li>
                        <li>Giá trị vĩnh viễn (Terminal Value): <strong>${formatShort(terminalValue)}</strong></li>
                        <li>Giá trị hiện tại của Terminal Value: <strong>${formatShort(pvTerminalValue)}</strong></li>
                        <li>Giá trị Doanh nghiệp (Enterprise Value): <strong>${formatShort(enterpriseValue)}</strong></li>
                        <li>Giá trị Vốn chủ sở hữu (cộng tiền ròng): <strong>${formatShort(equityValue)}</strong></li>
                        <li>Định giá một cổ phiếu: <strong>${formatShort(equityValue)} / ${shares.toLocaleString("vi-VN")} cổ phiếu = ${format(shareValue)}</strong></li>
                    </ul>
                `
            };
        }
    },
    graham: {
        title: "Định giá Benjamin Graham (Sửa đổi)",
        category: "Định giá Cổ phiếu",
        description: "Công thức cổ điển được cập nhật bởi Benjamin Graham để tìm giá trị nội tại hợp lý của một cổ phiếu tăng trưởng dựa trên EPS và lợi suất trái phiếu.",
        formulaHtml: "V = [EPS &times; (8.5 + 2g) &times; 4.4] / Y",
        inputs: [
            { id: "graham-eps", label: "EPS gần nhất (đ/cổ phiếu)", type: "text", isCurrency: true, value: "4.000", placeholder: "Ví dụ: 4.000" },
            { id: "graham-growth", label: "Tốc độ tăng trưởng kỳ vọng dài hạn g (%)", type: "number", value: 10, step: "0.1", placeholder: "Ví dụ: 10" },
            { id: "graham-y", label: "Lợi suất Trái phiếu doanh nghiệp AAA hiện tại Y (%)", type: "number", value: 6.5, step: "0.1", placeholder: "Ví dụ: 6.5" }
        ],
        calculate: (inputs) => {
            const eps = parseMoneyVal(inputs["graham-eps"]);
            const g = parseFloat(inputs["graham-growth"]) || 0;
            const y = parseFloat(inputs["graham-y"]) || 1; // avoid divide by zero

            const value = (eps * (8.5 + 2 * g) * 4.4) / y;

            const format = (num) => window.formatCurrency ? window.formatCurrency(num) : num.toLocaleString("vi-VN") + " ₫";

            return {
                value: format(value),
                details: `
                    <p><strong>Bước tính toán:</strong></p>
                    <ul>
                        <li>EPS của doanh nghiệp = <strong>${eps.toLocaleString("vi-VN")} đ</strong></li>
                        <li>Hệ số tăng trưởng kỳ vọng g = <strong>${g}%</strong></li>
                        <li>Lợi suất trái phiếu tham chiếu Y = <strong>${y}%</strong></li>
                        <li>Mẫu số Graham: 8.5 + 2 &times; ${g} = <strong>${8.5 + 2 * g}</strong></li>
                        <li>Tính toán: [${eps.toLocaleString("vi-VN")} &times; ${(8.5 + 2 * g).toFixed(2)} &times; 4.4] / ${y} = <strong>${format(value)}</strong></li>
                    </ul>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-light); font-style: italic;">
                        * Mẹo: Hằng số 8.5 đại diện cho P/E của một công ty không tăng trưởng. Con số 4.4 là lợi suất chiết khấu tối thiểu để Graham đầu tư vào thời kỳ đó. Hãy thận trọng với tham số tăng trưởng (g) để tránh định giá quá ảo.
                    </p>
                `
            };
        }
    },
    compound: {
        title: "Công thức Tính Lãi Kép",
        category: "Tính toán Tài chính",
        description: "Tính toán giá trị tương lai của một khoản đầu tư với lãi suất kép tích lũy định kỳ và số tiền gửi định kỳ hàng tháng.",
        formulaHtml: "A = P(1 + r/n)<sup>nt</sup> + PMT &times; [((1 + r/n)<sup>nt</sup> - 1) / (r/n)] &times; (1 + r/n)",
        inputs: [
            { id: "comp-principal", label: "Số tiền gốc ban đầu (P)", type: "text", isCurrency: true, value: "50.000.000", placeholder: "Ví dụ: 50.000.000" },
            { id: "comp-monthly", label: "Tiền gửi thêm hàng tháng (PMT)", type: "text", isCurrency: true, value: "3.000.000", placeholder: "Ví dụ: 3.000.000" },
            { id: "comp-rate", label: "Lãi suất hàng năm (%)", type: "number", value: 8, step: "0.1", placeholder: "Ví dụ: 8" },
            { id: "comp-years", label: "Số năm đầu tư (t)", type: "number", value: 10, placeholder: "Ví dụ: 10" },
            { id: "comp-freq", label: "Tần suất ghép lãi", type: "select", options: [
                { value: "12", label: "Hàng tháng (12 lần/năm)" },
                { value: "4", label: "Hàng quý (4 lần/năm)" },
                { value: "1", label: "Hàng năm (1 lần/năm)" }
            ], value: "12" }
        ],
        calculate: (inputs) => {
            const P = parseMoneyVal(inputs["comp-principal"]);
            const PMT = parseMoneyVal(inputs["comp-monthly"]);
            const r = (parseFloat(inputs["comp-rate"]) || 0) / 100;
            const t = parseFloat(inputs["comp-years"]) || 0;
            const n = parseInt(inputs["comp-freq"]) || 12;

            // Tính lãi kép theo tháng
            const totalMonths = t * 12;
            const ratePerMonth = r / 12;
            let balance = P;
            let totalInvested = P;

            // Để hiển thị mô phỏng từng năm
            let yearlySim = [];

            for (let month = 1; month <= totalMonths; month++) {
                // Tiền lãi phát sinh trong tháng
                const interest = balance * ratePerMonth;
                balance += interest;
                
                // Gửi thêm tiền vào đầu/cuối tháng (ở đây giả định gửi thêm ở cuối tháng)
                balance += PMT;
                totalInvested += PMT;

                if (month % 12 === 0) {
                    yearlySim.push({
                        year: month / 12,
                        invested: totalInvested,
                        balance: balance,
                        interestEarned: balance - totalInvested
                    });
                }
            }

            const format = (num) => window.formatCurrency ? window.formatCurrency(num) : num.toLocaleString("vi-VN") + " ₫";
            const totalInterest = balance - totalInvested;

            return {
                value: format(balance),
                details: `
                    <p><strong>Kết quả sau ${t} năm tích lũy:</strong></p>
                    <ul>
                        <li>Tổng số vốn tự bỏ ra: <strong>${format(totalInvested)}</strong></li>
                        <li>Tổng tiền lãi nhận được: <strong style="color: var(--secondary-color);">${format(totalInterest)}</strong></li>
                        <li>Tổng tài sản tích lũy (gốc + lãi): <strong style="color: #6366f1; font-size: 1.1rem;">${format(balance)}</strong></li>
                        <li>Hiệu suất tăng trưởng tài sản: <strong>+${((totalInterest / totalInvested) * 100).toFixed(1)}%</strong> so với gốc</li>
                    </ul>

                    <p style="margin-top: 15px;"><strong>Mô phỏng tăng trưởng theo từng năm:</strong></p>
                    <table class="financial-table" style="width: 100%; font-size: 0.8rem; margin: 10px 0; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f1f5f9;">
                                <th style="padding: 6px; text-align: left;">Năm</th>
                                <th style="padding: 6px; text-align: right;">Vốn đã nộp</th>
                                <th style="padding: 6px; text-align: right;">Số dư tích lũy</th>
                                <th style="padding: 6px; text-align: right;">Tiền lãi dồn tích</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${yearlySim.map(row => `
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 6px; text-align: left;">Năm ${row.year}</td>
                                    <td style="padding: 6px; text-align: right;">${format(row.invested)}</td>
                                    <td style="padding: 6px; text-align: right; font-weight: 700; color: #4f46e5;">${format(row.balance)}</td>
                                    <td style="padding: 6px; text-align: right; color: var(--secondary-color);">${format(row.interestEarned)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `
            };
        }
    },
    pv: {
        title: "Chiết khấu Dòng tiền Đơn lẻ (Present Value)",
        category: "Tính toán Tài chính",
        description: "Tính giá trị hiện tại của một khoản tiền hoặc dòng tiền cụ thể sẽ nhận được trong tương lai dựa trên tỷ lệ chiết khấu mong muốn.",
        formulaHtml: "PV = FV / (1 + r)<sup>t</sup>",
        inputs: [
            { id: "pv-fv", label: "Giá trị trong tương lai (FV)", type: "text", isCurrency: true, value: "100.000.000", placeholder: "Ví dụ: 100.000.000" },
            { id: "pv-rate", label: "Lãi suất / Tỷ lệ chiết khấu (%)", type: "number", value: 8, step: "0.1", placeholder: "Ví dụ: 8" },
            { id: "pv-years", label: "Số năm chiết khấu (t)", type: "number", value: 5, placeholder: "Ví dụ: 5" }
        ],
        calculate: (inputs) => {
            const fv = parseMoneyVal(inputs["pv-fv"]);
            const r = (parseFloat(inputs["pv-rate"]) || 0) / 100;
            const t = parseFloat(inputs["pv-years"]) || 0;

            const pv = fv / Math.pow(1 + r, t);

            const format = (num) => window.formatCurrency ? window.formatCurrency(num) : num.toLocaleString("vi-VN") + " ₫";

            return {
                value: format(pv),
                details: `
                    <p><strong>Bước tính toán:</strong></p>
                    <ul>
                        <li>Giá trị tương lai nhận được (FV) = <strong>${format(fv)}</strong></li>
                        <li>Lãi suất chiết khấu mong muốn = <strong>${(r * 100).toFixed(1)}% / năm</strong></li>
                        <li>Thời gian chờ đợi = <strong>${t} năm</strong></li>
                        <li>Hệ số chiết khấu: (1 + ${r})<sup>${t}</sup> = <strong>${Math.pow(1 + r, t).toFixed(4)}</strong></li>
                        <li>Tính toán: ${format(fv)} / ${Math.pow(1 + r, t).toFixed(4)} = <strong>${format(pv)}</strong></li>
                    </ul>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-light); font-style: italic;">
                        * Ý nghĩa: Để có được ${format(fv)} sau ${t} năm với lãi suất đầu tư ổn định là ${(r * 100).toFixed(1)}%, hôm nay bạn cần bỏ ra số tiền tối thiểu là ${format(pv)}.
                    </p>
                `
            };
        }
    },
    roi: {
        title: "Tỷ suất Sinh lời Đầu tư (ROI)",
        category: "Tính toán Tài chính",
        description: "Chỉ số đo lường hiệu quả hoặc lợi nhuận của một khoản đầu tư so với chi phí ban đầu của nó.",
        formulaHtml: "ROI (%) = (Lợi nhuận ròng / Chi phí đầu tư) &times; 100%",
        inputs: [
            { id: "roi-cost", label: "Chi phí đầu tư ban đầu (đ)", type: "text", isCurrency: true, value: "100.000.000", placeholder: "Ví dụ: 100.000.000" },
            { id: "roi-revenue", label: "Tổng doanh thu / Giá trị hiện tại (đ)", type: "text", isCurrency: true, value: "150.000.000", placeholder: "Ví dụ: 150.000.000" }
        ],
        calculate: (inputs) => {
            const cost = parseMoneyVal(inputs["roi-cost"]);
            const revenue = parseMoneyVal(inputs["roi-revenue"]);

            if (cost <= 0) {
                return {
                    value: "Lỗi dữ liệu",
                    details: "<span style='color: var(--danger); font-weight: 700;'>Lỗi: Chi phí đầu tư phải lớn hơn 0.</span>"
                };
            }

            const netProfit = revenue - cost;
            const roi = (netProfit / cost) * 100;

            const format = (num) => window.formatCurrency ? window.formatCurrency(num) : num.toLocaleString("vi-VN") + " ₫";

            return {
                value: roi.toFixed(2) + "%",
                details: `
                    <p><strong>Bước tính toán:</strong></p>
                    <ul>
                        <li>Chi phí đầu tư = <strong>${format(cost)}</strong></li>
                        <li>Doanh thu thu về = <strong>${format(revenue)}</strong></li>
                        <li>Lợi nhuận ròng thu về: ${format(revenue)} - ${format(cost)} = <strong>${format(netProfit)}</strong></li>
                        <li>Tính toán: (${format(netProfit)} / ${format(cost)}) &times; 100% = <strong>${roi.toFixed(2)}%</strong></li>
                    </ul>
                `
            };
        }
    },
    roa: {
        title: "Tỷ suất Lợi nhuận trên Tài sản (ROA)",
        category: "Tính toán Tài chính",
        description: "Chỉ số tài chính đo lường khả năng sinh lời của doanh nghiệp so với tổng tài sản sở hữu.",
        formulaHtml: "ROA (%) = (Lợi nhuận sau thuế / Tổng tài sản) &times; 100%",
        inputs: [
            { id: "roa-netincome", label: "Lợi nhuận sau thuế (Net Income) (đ)", type: "text", isCurrency: true, value: "15.000.000", placeholder: "Ví dụ: 15.000.000" },
            { id: "roa-assets", label: "Tổng tài sản bình quân (Total Assets) (đ)", type: "text", isCurrency: true, value: "100.000.000", placeholder: "Ví dụ: 100.000.000" }
        ],
        calculate: (inputs) => {
            const netIncome = parseMoneyVal(inputs["roa-netincome"]);
            const assets = parseMoneyVal(inputs["roa-assets"]);

            if (assets <= 0) {
                return {
                    value: "Lỗi dữ liệu",
                    details: "<span style='color: var(--danger); font-weight: 700;'>Lỗi: Tổng tài sản phải lớn hơn 0.</span>"
                };
            }

            const roa = (netIncome / assets) * 100;
            const format = (num) => window.formatCurrency ? window.formatCurrency(num) : num.toLocaleString("vi-VN") + " ₫";

            return {
                value: roa.toFixed(2) + "%",
                details: `
                    <p><strong>Bước tính toán:</strong></p>
                    <ul>
                        <li>Lợi nhuận ròng sau thuế = <strong>${format(netIncome)}</strong></li>
                        <li>Tổng tài sản doanh nghiệp = <strong>${format(assets)}</strong></li>
                        <li>Tính toán ROA: (${format(netIncome)} / ${format(assets)}) &times; 100% = <strong>${roa.toFixed(2)}%</strong></li>
                    </ul>
                    <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-light); font-style: italic;">
                        * Ý nghĩa: ROA là ${roa.toFixed(2)}% có nghĩa là với mỗi 100 đồng tài sản đầu tư ban đầu, doanh nghiệp này tạo ra được ${roa.toFixed(2)} đồng lợi nhuận ròng sau thuế.
                    </p>
                `
            };
        }
    },
    dupont: {
        title: "Mô Hình Phân Tích DuPont (3 Bước)",
        category: "Tính toán Tài chính",
        description: "Phương pháp phân tích tách biệt tỷ suất sinh lời trên vốn chủ sở hữu (ROE) thành 3 nhân tố: Biên lợi nhuận, Hiệu suất sử dụng tài sản và Đòn bẩy tài chính.",
        formulaHtml: "ROE = Net Profit Margin &times; Asset Turnover &times; Equity Multiplier",
        inputs: [
            { id: "dp-netincome", label: "Lợi nhuận ròng (Net Income) (đ)", type: "text", isCurrency: true, value: "20.000.000", placeholder: "Ví dụ: 20.000.000" },
            { id: "dp-revenue", label: "Doanh thu thuần (Revenue) (đ)", type: "text", isCurrency: true, value: "100.000.000", placeholder: "Ví dụ: 100.000.000" },
            { id: "dp-assets", label: "Tổng tài sản bình quân (Assets) (đ)", type: "text", isCurrency: true, value: "80.000.000", placeholder: "Ví dụ: 80.000.000" },
            { id: "dp-equity", label: "Vốn chủ sở hữu bình quân (Equity) (đ)", type: "text", isCurrency: true, value: "50.000.000", placeholder: "Ví dụ: 50.000.000" }
        ],
        calculate: (inputs) => {
            const netIncome = parseMoneyVal(inputs["dp-netincome"]);
            const revenue = parseMoneyVal(inputs["dp-revenue"]);
            const assets = parseMoneyVal(inputs["dp-assets"]);
            const equity = parseMoneyVal(inputs["dp-equity"]);

            if (revenue <= 0 || assets <= 0 || equity <= 0) {
                return {
                    value: "Lỗi dữ liệu",
                    details: "<span style='color: var(--danger); font-weight: 700;'>Lỗi: Doanh thu, tài sản và vốn chủ sở hữu phải lớn hơn 0.</span>"
                };
            }

            // 1. Biên lợi nhuận ròng
            const netMargin = (netIncome / revenue) * 100;
            // 2. Vòng quay tài sản
            const assetTurnover = revenue / assets;
            // 3. Đòn bẩy tài chính
            const equityMultiplier = assets / equity;

            const roe = (netIncome / equity) * 100;
            const format = (num) => window.formatCurrency ? window.formatCurrency(num) : num.toLocaleString("vi-VN") + " ₫";

            return {
                value: roe.toFixed(2) + "%",
                details: `
                    <p><strong>Kết quả phân tích 3 nhân tố DuPont:</strong></p>
                    <ol>
                        <li>
                            <strong>Biên lợi nhuận ròng (Profit Margin)</strong> = ${format(netIncome)} / ${format(revenue)} = <strong>${netMargin.toFixed(2)}%</strong>
                            <br><span style="font-size: 0.8rem; color: var(--text-light);">Đo lường hiệu quả kiểm soát chi phí.</span>
                        </li>
                        <li style="margin-top: 8px;">
                            <strong>Vòng quay tổng tài sản (Asset Turnover)</strong> = ${format(revenue)} / ${format(assets)} = <strong>${assetTurnover.toFixed(2)} lần</strong>
                            <br><span style="font-size: 0.8rem; color: var(--text-light);">Đo lường hiệu quả sử dụng tài sản để tạo doanh thu.</span>
                        </li>
                        <li style="margin-top: 8px;">
                            <strong>Đòn bẩy tài chính (Equity Multiplier)</strong> = ${format(assets)} / ${format(equity)} = <strong>${equityMultiplier.toFixed(2)} lần</strong>
                            <br><span style="font-size: 0.8rem; color: var(--text-light);">Đo lường mức độ sử dụng nợ vay.</span>
                        </li>
                    </ol>
                    <p style="border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 10px;">
                        <strong>Phép tính kết hợp DuPont:</strong><br>
                        ROE = ${netMargin.toFixed(2)}% (Biên ròng) &times; ${assetTurnover.toFixed(2)} (Vòng quay) &times; ${equityMultiplier.toFixed(2)} (Đòn bẩy) = <strong>${roe.toFixed(2)}%</strong>
                    </p>
                `
            };
        }
    }
};

// Theo dõi công thức hiện tại
let currentFormulaId = localStorage.getItem("active_financial_formula") || "pe";

// Khởi tạo tab công thức
function initFormulasTab() {
    renderFormulaCalculator(currentFormulaId);
    
    // Gắn sự kiện click cho các nút menu công thức ở cột trái
    const tabBtns = document.querySelectorAll(".formula-tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const formulaId = btn.dataset.formula;
            currentFormulaId = formulaId;
            localStorage.setItem("active_financial_formula", formulaId);
            renderFormulaCalculator(formulaId);
        });
    });
}

// Render nội dung máy tính của một công thức cụ thể sang panel bên phải
function renderFormulaCalculator(formulaId) {
    const config = FORMULAS_CONFIG[formulaId];
    if (!config) return;

    const container = document.getElementById("formula-calculator-container");
    if (!container) return;

    // Thiết lập giao diện nhập liệu
    let inputsHtml = "";
    config.inputs.forEach(input => {
        if (input.type === "select") {
            inputsHtml += `
                <div class="form-group">
                    <label for="${input.id}">${input.label}</label>
                    <select id="${input.id}">
                        ${input.options.map(opt => `
                            <option value="${opt.value}" ${opt.value === input.value ? 'selected' : ''}>${opt.label}</option>
                        `).join('')}
                    </select>
                </div>
            `;
        } else {
            inputsHtml += `
                <div class="form-group">
                    <label for="${input.id}">${input.label}</label>
                    <input type="${input.type}" id="${input.id}" value="${input.value}" 
                           ${input.isCurrency ? 'data-currency="true"' : ''}
                           step="${input.step || 'any'}" placeholder="${input.placeholder || ''}" required>
                </div>
            `;
        }
    });

    container.innerHTML = `
        <div class="formula-header">
            <h3 class="formula-title">
                <i class="fa-solid fa-square-root-variable" style="color: #6366f1;"></i>
                ${config.title}
            </h3>
            <p class="formula-description">${config.description}</p>
        </div>

        <div class="formula-math-box">
            <span style="font-weight: 700; color: #4f46e5;"><i class="fa-solid fa-calculator"></i> Công thức:</span>
            <code>${config.formulaHtml}</code>
        </div>

        <div class="formula-calc-grid">
            ${inputsHtml}
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button type="button" class="btn-primary" id="btn-run-formula" style="flex: 3; border-radius: 12px; padding: 14px; font-weight: 800; border: none; cursor: pointer; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                <i class="fa-solid fa-calculator"></i> Tính Kết Quả
            </button>
            <button type="button" id="btn-clear-formula" style="flex: 1; border-radius: 12px; padding: 14px; font-weight: 800; border: none; cursor: pointer; background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s;">
                <i class="fa-solid fa-trash-can"></i> Xóa dữ liệu
            </button>
        </div>

        <!-- Thẻ kết quả -->
        <div class="formula-result-card" id="formula-result-panel">
            <div class="formula-result-title">
                <i class="fa-solid fa-square-poll-vertical"></i> Kết Quả Định Giá / Tính Toán
            </div>
            <div class="formula-result-value" id="formula-result-value">--</div>
            <div class="formula-result-details" id="formula-result-details"></div>
        </div>
    `;

    // Gắn sự kiện định dạng tiền tệ khi người dùng gõ
    const currencyInputs = container.querySelectorAll('input[data-currency="true"]');
    currencyInputs.forEach(inputEl => {
        inputEl.addEventListener("input", (e) => {
            const originalValue = e.target.value;
            const selectionEnd = e.target.selectionEnd;
            const offsetFromEnd = originalValue.length - selectionEnd;
            
            const digits = originalValue.replace(/[^\d]/g, '');
            if (!digits) {
                e.target.value = "";
                return;
            }
            
            const num = parseInt(digits, 10) || 0;
            const formatted = new Intl.NumberFormat('vi-VN').format(num);
            e.target.value = formatted;
            
            const newPos = Math.max(0, formatted.length - offsetFromEnd);
            e.target.setSelectionRange(newPos, newPos);
        });
    });

    // Lưu lại giá trị khi người dùng nhập để giữ nguyên trạng thái khi chuyển tab
    config.inputs.forEach(input => {
        const inputEl = document.getElementById(input.id);
        if (inputEl) {
            inputEl.addEventListener("input", (e) => {
                input.value = e.target.value;
            });
            inputEl.addEventListener("change", (e) => {
                input.value = e.target.value;
            });
        }
    });

    // Gắn sự kiện nút Tính toán
    const runBtn = document.getElementById("btn-run-formula");
    if (runBtn) {
        runBtn.addEventListener("click", runFormulaCalculation);
    }

    // Gắn sự kiện nút Xóa dữ liệu
    const clearBtn = document.getElementById("btn-clear-formula");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            config.inputs.forEach(input => {
                const element = document.getElementById(input.id);
                if (element) {
                    element.value = "";
                }
                input.value = ""; // Xóa dữ liệu lưu trữ
            });
            const resultPanel = document.getElementById("formula-result-panel");
            if (resultPanel) {
                resultPanel.classList.remove("active");
            }
        });
    }
}

// Thu thập tham số đầu vào và thực hiện tính toán
function runFormulaCalculation() {
    const config = FORMULAS_CONFIG[currentFormulaId];
    if (!config) return;

    // Lấy tất cả giá trị input
    const inputsValues = {};
    config.inputs.forEach(input => {
        const element = document.getElementById(input.id);
        if (element) {
            inputsValues[input.id] = element.value;
        }
    });

    // Tính toán
    const result = config.calculate(inputsValues);

    // Hiển thị kết quả lên giao diện
    const resultPanel = document.getElementById("formula-result-panel");
    const resultVal = document.getElementById("formula-result-value");
    const resultDet = document.getElementById("formula-result-details");

    if (resultPanel && resultVal && resultDet) {
        resultVal.innerHTML = result.value;
        resultDet.innerHTML = result.details;
        resultPanel.classList.add("active");
        
        // Cuộn mượt đến bảng kết quả nếu đang ở chế độ xem di động
        resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

// Expose toàn cục để gọi từ app.js
window.initFormulasTab = initFormulasTab;
