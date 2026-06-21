/**
 * HARVEST ASSISTANT - chatbot.js
 * AI-powered data entry for theHarvest7 App
 */

document.addEventListener("DOMContentLoaded", () => {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const closeChatbot = document.getElementById('close-chatbot');
    const chatMessages = document.getElementById('chatbot-messages');
    const chatInput = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('send-chatbot-btn');

    // UI State
    let isWindowOpen = false;
    let pendingData = null;
    let isProcessing = false;

    // Toggle Chatbot
    const toggleChat = (forceState) => {
        isWindowOpen = forceState !== undefined ? forceState : !isWindowOpen;
        chatbotWindow.classList.toggle('active', isWindowOpen);
        if (isWindowOpen) {
            chatInput.focus();
            // Clear notification dot
            const dot = document.querySelector('.notification-dot');
            if (dot) dot.style.display = 'none';
        }
    };

    chatbotToggle.addEventListener('click', () => toggleChat());
    closeChatbot.addEventListener('click', () => toggleChat(false));
    
    const helpBtn = document.getElementById('help-chatbot-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showQueryHelp();
        });
    }
    
    // Bot Status Helper
    const setBotBusy = (busy) => {
        isProcessing = busy;
        chatInput.readOnly = busy;
        sendBtn.disabled = busy;
        chatInput.style.opacity = busy ? "0.6" : "1";
        if (busy) {
            chatbotWindow.classList.add('bot-busy');
        } else {
            chatbotWindow.classList.remove('bot-busy');
        }
    };

    // Handle Input
    const addMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender === 'ai' ? 'ai-message' : 'user-message'}`;
        // Preserve line breaks for multi-line inputs
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    };

    // Auto-grow textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });

    const handleSend = () => {
        if (isProcessing || pendingData) return;

        // Bậc 2 restriction
        if (typeof window.getRole === 'function' && window.getRole() === 'EMP_LV2') {
            addMessage("Tài khoản của bạn là tài khoản bậc 2, vui lòng liên hệ admin để nâng cấp hạng tài khoản", 'ai');
            chatInput.value = '';
            chatInput.style.height = 'auto';
            return;
        }

        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';
        chatInput.style.height = 'auto'; // Reset height

        setBotBusy(true);

        // Processing
        setTimeout(() => {
            if (processQuery(text)) {
                setBotBusy(false);
                return;
            }
            processInput(text);
            // If parsing didn't result in a pending confirmation, release the lock
            if (!pendingData) setBotBusy(false);
        }, 500);
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line on Enter (unless Shift is pressed)
            handleSend();
        }
    });


    // --- QUERY ASSISTANT LOGIC ---
    function removeVietnameseTones(str) {
        if (!str) return "";
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y");
        str = str.replace(/đ/g,"d");
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        str = str.replace(/Đ/g, "D");
        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); 
        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); 
        return str;
    }

    function filterDataByPeriod(data, period) {
        const now = new Date();
        let startOfPeriod, endOfPeriod;
        
        if (period === 'today') {
            startOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (period === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            startOfPeriod = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            endOfPeriod = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        } else if (period === 'this-week') {
            const day = now.getDay() || 7; 
            const diff = now.getDate() - day + 1;
            startOfPeriod = new Date(now.getFullYear(), now.getMonth(), diff);
            endOfPeriod = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59, 999);
        } else if (period === 'this-month') {
            startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
            endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (period === 'last-month') {
            startOfPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endOfPeriod = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (period === 'this-year') {
            startOfPeriod = new Date(now.getFullYear(), 0, 1);
            endOfPeriod = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (period.startsWith('month-')) {
            const m = parseInt(period.split('-')[1]);
            startOfPeriod = new Date(now.getFullYear(), m - 1, 1);
            endOfPeriod = new Date(now.getFullYear(), m, 0, 23, 59, 59, 999);
        }
        
        return data.filter(row => {
            const d = row.parsedDate;
            if (!d || isNaN(d.getTime())) return false;
            return d >= startOfPeriod && d <= endOfPeriod;
        });
    }

    function processQuery(text) {
        const lower = text.toLowerCase().trim();
        
        // 1. HELP query
        if (["hướng dẫn", "giúp", "help", "cú pháp", "câu lệnh"].includes(lower)) {
            showQueryHelp();
            return true;
        }

        // 1.5. AGRICULTURAL SCHEDULER query
        const schedKeywords = ["cắt cành", "cắt bông", "ngày cắt", "lập lịch", "rộ"];
        if (schedKeywords.some(kw => lower.includes(kw))) {
            return showCropSchedulerQuery(lower);
        }

        // 2. INVESTMENT query
        const portfolioKeywords = ["danh mục", "đầu tư", "portfolio", "tài sản", "cổ phiếu", "mã chứng khoán"];
        if (portfolioKeywords.some(kw => lower === kw || lower === kw + " đầu tư" || lower === "xem " + kw)) {
            showInvPortfolioQuery();
            return true;
        }
        
        const stockMatch = lower.match(/^(?:cổ phiếu|mã|xem mã)\s+([a-z0-9]+)$/i) || 
                           (lower.length <= 4 && /^[a-z]{3,4}$/i.test(lower) && ["fpt", "hpg", "vcb", "vic", "mwg"].includes(lower));
        if (stockMatch) {
            const symbol = stockMatch[1] || lower;
            showSpecificStockQuery(symbol.toUpperCase());
            return true;
        }

        // 3. DEBT query
        const debtKeywords = ["nợ", "công nợ", "nợ nần"];
        const isDebtQuery = debtKeywords.some(kw => lower.includes(kw));
        if (isDebtQuery) {
            const customerMatch = lower.match(/^(?:nợ|công nợ|xem nợ)(?:\s+của)?\s+([a-zà-ỹ\s]+)$/i);
            const isGeneralList = ["ai nợ", "danh sách nợ", "xem nợ", "nợ nần", "tổng nợ"].includes(lower);
            
            if (customerMatch && !isGeneralList) {
                const customerName = customerMatch[1].trim();
                showCustomerDebtQuery(customerName);
                return true;
            } else if (isGeneralList || lower === "nợ") {
                showGeneralDebtQuery();
                return true;
            }
        }

        // 4. FINANCIAL STATS query
        const statsKeywords = ["doanh thu", "thu", "chi phí", "chi", "lợi nhuận", "lời", "lãi"];
        const timeKeywords = ["hôm nay", "tháng này", "năm nay", "tuần này", "hôm qua", "tháng trước"];
        
        const isStatsQuery = statsKeywords.some(kw => lower.includes(kw));
        const isTimeQuery = timeKeywords.some(kw => lower.includes(kw)) || lower.match(/tháng\s+\d+/);
        
        if (isStatsQuery && isTimeQuery) {
            let period = "this-month";
            if (lower.includes("hôm nay")) period = "today";
            else if (lower.includes("hôm qua")) period = "yesterday";
            else if (lower.includes("tuần này")) period = "this-week";
            else if (lower.includes("tháng này")) period = "this-month";
            else if (lower.includes("tháng trước")) period = "last-month";
            else if (lower.includes("năm nay")) period = "this-year";
            else {
                const monthMatch = lower.match(/tháng\s+(\d+)/);
                if (monthMatch) {
                    period = `month-${monthMatch[1]}`;
                }
            }
            showFinancialStatsQuery(period);
            return true;
        }

        return false;
    }

    function showQueryHelp() {
        const helpHtml = `
            <div style="background: #f8fafc; border-radius: 8px; padding: 10px; border-left: 4px solid #6366f1; line-height: 1.5;">
                💡 <b>Trợ lý Truy Vấn Dữ Liệu:</b> Bạn có thể hỏi tôi các câu lệnh dưới đây (nhấp vào thẻ để hỏi nhanh):
                <br><br>
                <b>🌸 Lập Lịch Cắt Cành AI:</b><br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='ngày cắt cành đỏ ecuador và đỏ pháp cho lễ 20/10'; document.getElementById('send-chatbot-btn').click();">ngày cắt cành đỏ ecuador lễ 20/10</span><br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='lập lịch tết giống pháp'; document.getElementById('send-chatbot-btn').click();">lập lịch tết giống pháp</span>
                <br><br>
                <b>💵 Công nợ:</b><br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='nợ'; document.getElementById('send-chatbot-btn').click();">nợ</span> (Danh sách nợ chung)<br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='nợ Vy'; document.getElementById('send-chatbot-btn').click();">nợ Vy</span> (Chi tiết nợ của Vy)<br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='nợ Thơm'; document.getElementById('send-chatbot-btn').click();">nợ Thơm</span>
                <br><br>
                <b>📊 Thu chi nông trại:</b><br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='doanh thu hôm nay'; document.getElementById('send-chatbot-btn').click();">doanh thu hôm nay</span><br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='chi phí tháng này'; document.getElementById('send-chatbot-btn').click();">chi phí tháng này</span><br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='lợi nhuận tháng này'; document.getElementById('send-chatbot-btn').click();">lợi nhuận tháng này</span><br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='lợi nhuận hôm nay'; document.getElementById('send-chatbot-btn').click();">lợi nhuận hôm nay</span>
                <br><br>
                <b>📈 Đầu tư (Warren Buffett):</b><br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='danh mục đầu tư'; document.getElementById('send-chatbot-btn').click();">danh mục đầu tư</span> (Xem tổng quan tài sản)<br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='cổ phiếu FPT'; document.getElementById('send-chatbot-btn').click();">cổ phiếu FPT</span> (Xem chi tiết mã FPT)<br>
                - <span class="suggestion-tag" style="cursor:pointer; display:inline-block; margin: 2px;" onclick="document.getElementById('chatbot-input').value='cổ phiếu HPG'; document.getElementById('send-chatbot-btn').click();">cổ phiếu HPG</span>
            </div>
        `;
        addMessage(helpHtml, "ai");
    }

    function showInvPortfolioQuery() {
        const getPortfolio = window.getInvPortfolioData;
        const portfolio = getPortfolio ? getPortfolio() : [];
        
        if (!portfolio || portfolio.length === 0) {
            addMessage("Không có dữ liệu danh mục đầu tư chứng khoán. Hãy truy cập tab Đầu tư hoặc tải dữ liệu.", "ai");
            return;
        }
        
        let totalCapital = 0;
        let totalCurrent = 0;
        let totalDivs = 0;
        
        let rowsHtml = "";
        portfolio.forEach(item => {
            const rawPrice = item["Giá Hiện Tại"];
            const unitPrice = typeof rawPrice === 'number' ? rawPrice :
                parseFloat(String(rawPrice || 0).replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')) || 0;
            const totalQty = item.totalQty || 0;
            const currentVal = unitPrice * totalQty;
            const capital = item.capital || 0;
            const divs = parseFloat(item["Dòng Tiền Đã Nhận"]) || item.divs || 0;
            
            totalCapital += capital;
            totalCurrent += currentVal;
            totalDivs += divs;
            
            const profit = (currentVal + divs) - capital;
            const roi = capital > 0 ? (profit / capital) * 100 : 0;
            const roiColor = profit >= 0 ? '#10b981' : '#ef4444';
            const roiSign = profit >= 0 ? '+' : '';
            
            rowsHtml += `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; font-size: 0.88em;">
                    <div><b>${item["Mã/Tên"]}</b> <span style="font-size: 0.8em; color: #64748b;">(${item["Phân Loại"]})</span></div>
                    <div style="font-weight: 700; color: ${roiColor};">${roiSign}${roi.toFixed(1)}%</div>
                </div>
            `;
        });
        
        const totalProfit = totalCurrent + totalDivs - totalCapital;
        const totalRoi = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;
        const totalRoiColor = totalProfit >= 0 ? '#10b981' : '#ef4444';
        const totalRoiSign = totalProfit >= 0 ? '+' : '';
        
        const summaryHtml = `
            <div style="background: #f8fafc; border-radius: 8px; padding: 12px; border-left: 4px solid #6366f1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-weight: 700; color: #1e293b; margin-bottom: 8px; font-size: 1.05em; display:flex; align-items:center; gap:6px;">📈 DANH MỤC ĐẦU TƯ</div>
                <div style="font-size: 0.9em; margin-bottom: 4px; display:flex; justify-content:space-between;"><span>Vốn đầu tư:</span> <b>${window.utils.formatCurrency(totalCapital)}</b></div>
                <div style="font-size: 0.9em; margin-bottom: 4px; display:flex; justify-content:space-between;"><span>Giá trị hiện tại:</span> <b>${window.utils.formatCurrency(totalCurrent)}</b></div>
                <div style="font-size: 0.9em; margin-bottom: 8px; display:flex; justify-content:space-between;"><span>Cổ tức đã nhận:</span> <b style="color:#10b981;">${window.utils.formatCurrency(totalDivs)}</b></div>
                <div style="font-size: 0.98em; font-weight: 700; border-top: 1px solid #e2e8f0; padding-top: 6px; display:flex; justify-content:space-between; color: ${totalRoiColor};">
                    <span>Lãi/Lỗ tổng:</span> <span>${totalRoiSign}${window.utils.formatCurrency(totalProfit)} (${totalRoiSign}${totalRoi.toFixed(2)}%)</span>
                </div>
                <div style="margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; max-height: 120px; overflow-y: auto;">
                    ${rowsHtml}
                </div>
                <button class="btn-confirm-yes" style="width: 100%; border: none; padding: 6px; margin-top: 10px; background: #6366f1;" onclick="if(window.switchView) window.switchView('investment');">Mở trang Đầu Tư 📈</button>
            </div>
        `;
        addMessage(summaryHtml, "ai");
    }

    function showSpecificStockQuery(symbol) {
        const getPortfolio = window.getInvPortfolioData;
        const portfolio = getPortfolio ? getPortfolio() : [];
        const item = portfolio.find(p => p["Mã/Tên"] === symbol);
        
        if (!item) {
            addMessage(`Không tìm thấy cổ phiếu <b>${symbol}</b> trong danh mục hiện tại.`, "ai");
            return;
        }
        
        const rawPrice = item["Giá Hiện Tại"];
        const unitPrice = typeof rawPrice === 'number' ? rawPrice :
            parseFloat(String(rawPrice || 0).replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')) || 0;
        const totalQty = item.totalQty || 0;
        const currentVal = unitPrice * totalQty;
        const capital = item.capital || 0;
        const divs = parseFloat(item["Dòng Tiền Đã Nhận"]) || item.divs || 0;
        
        const profit = (currentVal + divs) - capital;
        const roi = capital > 0 ? (profit / capital) * 100 : 0;
        const roiColor = profit >= 0 ? '#10b981' : '#ef4444';
        const roiSign = profit >= 0 ? '+' : '';
        
        const rawIntrinsic = item["Định Giá Lý Thuyết"];
        const unitIntrinsic = typeof rawIntrinsic === 'number' ? rawIntrinsic :
            parseFloat(String(rawIntrinsic || 0).replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')) || 0;
        const mos = unitIntrinsic > 0 ? ((unitIntrinsic - unitPrice) / unitIntrinsic) * 100 : 0;
        
        const detailsHtml = `
            <div style="background: #f8fafc; border-radius: 8px; padding: 12px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-weight: 700; color: #1e293b; margin-bottom: 8px; font-size: 1.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">🔍 CHI TIẾT MÃ: ${symbol}</div>
                <div style="font-size: 0.88em; margin-bottom: 4px; display:flex; justify-content:space-between;"><span>Phân loại:</span> <b>${item["Phân Loại"] || "Cổ phiếu"}</b></div>
                <div style="font-size: 0.88em; margin-bottom: 4px; display:flex; justify-content:space-between;"><span>Số lượng:</span> <b>${new Intl.NumberFormat('vi-VN').format(totalQty)} CP</b></div>
                <div style="font-size: 0.88em; margin-bottom: 4px; display:flex; justify-content:space-between;"><span>Giá mua trung bình:</span> <b>${window.utils.formatCurrency(totalQty > 0 ? capital / totalQty : 0)}</b></div>
                <div style="font-size: 0.88em; margin-bottom: 4px; display:flex; justify-content:space-between;"><span>Giá hiện tại:</span> <b>${window.utils.formatCurrency(unitPrice)}</b></div>
                <div style="font-size: 0.88em; margin-bottom: 4px; display:flex; justify-content:space-between;"><span>Giá trị nội tại:</span> <b>${window.utils.formatCurrency(unitIntrinsic)}</b></div>
                <div style="font-size: 0.88em; margin-bottom: 6px; display:flex; justify-content:space-between;"><span>Biên an toàn (MoS):</span> <b style="color: ${mos >= 0 ? '#10b981' : '#ef4444'};">${mos.toFixed(1)}%</b></div>
                <div style="font-size: 0.88em; margin-bottom: 6px; display:flex; justify-content:space-between;"><span>Tổng vốn giải ngân:</span> <b>${window.utils.formatCurrency(capital)}</b></div>
                <div style="font-size: 0.98em; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 6px; display:flex; justify-content:space-between; color: ${roiColor};">
                    <span>Lãi/Lỗ (ROI):</span> <span>${roiSign}${window.utils.formatCurrency(profit)} (${roiSign}${roi.toFixed(2)}%)</span>
                </div>
                ${item["Luận Điểm Đầu Tư"] ? `<div style="margin-top: 8px; font-size: 0.82em; color: #475569; background: #f1f5f9; padding: 8px; border-radius: 4px; border-left: 2px solid #cbd5e1;">💡 <b>Luận điểm:</b> ${item["Luận Điểm Đầu Tư"]}</div>` : ''}
            </div>
        `;
        addMessage(detailsHtml, "ai");
    }

    function showCustomerDebtQuery(customerName) {
        const getFarmData = window.getFarmData;
        const data = getFarmData ? getFarmData() : [];
        if (!data || data.length === 0) {
            addMessage("Không có dữ liệu bán hàng. Hãy đồng bộ dữ liệu trước.", "ai");
            return;
        }
        
        const cleanQuery = removeVietnameseTones(customerName).toLowerCase().trim();
        if (!cleanQuery) return;
        
        const buyersMap = {};
        data.forEach(row => {
            const buyer = (row["Người Mua"] || "").trim();
            if (!buyer || buyer.toLowerCase() === "null") return;
            
            const cleanBuyer = removeVietnameseTones(buyer).toLowerCase();
            if (cleanBuyer.includes(cleanQuery)) {
                buyersMap[buyer] = true;
            }
        });
        
        const matchedBuyers = Object.keys(buyersMap);
        
        if (matchedBuyers.length === 0) {
            addMessage(`Không tìm thấy khách hàng nào khớp với tên <b>"${customerName}"</b>.`, "ai");
            return;
        }
        
        if (matchedBuyers.length > 1) {
            let suggestions = matchedBuyers.map(b => `<span class="suggestion-tag" style="cursor:pointer; margin:2px; display:inline-block;">nợ ${b}</span>`).join(" ");
            addMessage(`Tìm thấy nhiều khách hàng khớp. Vui lòng chọn cụ thể:<br>${suggestions}`, "ai");
            return;
        }
        
        const targetBuyer = matchedBuyers[0];
        let totalDebt = 0;
        let orderLines = [];
        
        data.forEach(row => {
            const buyer = (row["Người Mua"] || "").trim();
            if (buyer.toLowerCase() !== targetBuyer.toLowerCase()) return;
            
            const status = (row["Status"] || "").trim().toLowerCase();
            if (status === "xong") return; 
            
            const isVua = (row["Loại DT"] || "") === "Vựa";
            const expected = isVua ? (row["Tiền Phải Thu"] || 0) : (row["Doanh Thu Bông"] || 0);
            const paid = row["Đã Thu"] || 0;
            const remaining = expected - paid;
            
            if (remaining > 0) {
                totalDebt += remaining;
                orderLines.push({
                    date: row["Ngày"] || "N/A",
                    qty: row["Số lượng"] || 0,
                    flower: row["Phân Loại Bông"] || "Bông",
                    expected: expected,
                    paid: paid,
                    remaining: remaining
                });
            }
        });
        
        if (totalDebt === 0) {
            addMessage(`🎉 Tuyệt vời! Khách hàng <b>${targetBuyer.toUpperCase()}</b> hiện tại <b>không có nợ</b> (hoặc đã hoàn thành tất cả hóa đơn).`, "ai");
            return;
        }
        
        let linesHtml = "";
        orderLines.forEach(line => {
            const formattedDate = typeof line.date === 'string' ? line.date : 
                (line.date instanceof Date ? window.utils.formatDateVietnamese(line.date) : line.date);
            linesHtml += `
                <div style="font-size: 0.85em; padding: 6px 0; border-bottom: 1px dashed #fee2e2;">
                    📅 <b>${formattedDate}</b>: ${line.qty} ${line.flower}<br>
                    Cần thu: <b>${window.utils.formatCurrency(line.expected)}</b> | Đã thu: <b>${window.utils.formatCurrency(line.paid)}</b><br>
                    Nợ: <span style="color:#ef4444; font-weight:700;">${window.utils.formatCurrency(line.remaining)}</span>
                </div>
            `;
        });
        
        const cardHtml = `
            <div style="background: #fff5f5; border-radius: 8px; padding: 12px; border-left: 4px solid #ef4444; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-weight: 700; color: #991b1b; margin-bottom: 6px; font-size: 1.05em; border-bottom: 1px solid #fee2e2; padding-bottom: 6px;">👤 CHI TIẾT NỢ: ${targetBuyer.toUpperCase()}</div>
                <div style="font-size: 1.05em; font-weight: 800; color: #ef4444; margin-bottom: 8px;">
                    Tổng dư nợ: ${window.utils.formatCurrency(totalDebt)}
                </div>
                <div style="max-height: 150px; overflow-y: auto; margin-bottom: 8px; padding-right: 4px;">
                    ${linesHtml}
                </div>
                <button class="btn-confirm-yes" style="width: 100%; border: none; padding: 6px; background: #ef4444;" onclick="if(window.switchView) window.switchView('debt');">Mở trang Chi Tiết Nợ 💳</button>
            </div>
        `;
        addMessage(cardHtml, "ai");
    }

    function showGeneralDebtQuery() {
        const getFarmData = window.getFarmData;
        const data = getFarmData ? getFarmData() : [];
        if (!data || data.length === 0) {
            addMessage("Không có dữ liệu bán hàng. Hãy đồng bộ dữ liệu trước.", "ai");
            return;
        }
        
        const debts = {}; 
        data.forEach(row => {
            const buyer = (row["Người Mua"] || "").trim();
            if (!buyer || buyer.toLowerCase() === "null") return;
            
            const status = (row["Status"] || "").trim().toLowerCase();
            if (status === "xong") return;
            
            const isVua = (row["Loại DT"] || "") === "Vựa";
            const expected = isVua ? (row["Tiền Phải Thu"] || 0) : (row["Doanh Thu Bông"] || 0);
            const paid = row["Đã Thu"] || 0;
            const remaining = expected - paid;
            
            if (remaining > 0) {
                debts[buyer] = (debts[buyer] || 0) + remaining;
            }
        });
        
        const sortedDebts = Object.entries(debts)
            .filter(([_, amt]) => amt > 100)
            .sort((a, b) => b[1] - a[1]);
            
        if (sortedDebts.length === 0) {
            addMessage("🎉 Tuyệt vời! Hiện không có khách hàng nào nợ.", "ai");
            return;
        }
        
        let listHtml = "";
        let grandTotal = 0;
        sortedDebts.forEach(([buyer, amt], idx) => {
            grandTotal += amt;
            listHtml += `
                <div style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dashed #fee2e2; font-size: 0.88em; align-items:center;">
                    <div><b>${idx + 1}. ${buyer}</b></div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:700; color:#ef4444;">${window.utils.formatCurrency(amt)}</span>
                        <span class="suggestion-tag" style="font-size: 0.75em; padding: 2px 6px; cursor:pointer; margin:0;" onclick="document.getElementById('chatbot-input').value='nợ ${buyer}'; document.getElementById('send-chatbot-btn').click();">Chi tiết</span>
                    </div>
                </div>
            `;
        });
        
        const cardHtml = `
            <div style="background: #fff5f5; border-radius: 8px; padding: 12px; border-left: 4px solid #ef4444; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-weight: 700; color: #991b1b; margin-bottom: 6px; font-size: 1.05em; border-bottom: 1px solid #fee2e2; padding-bottom: 6px;">💳 DANH SÁCH KHÁCH NỢ</div>
                <div style="font-size: 1.05em; font-weight: 800; color: #ef4444; margin-bottom: 10px;">
                    Tổng nợ vựa + farm: ${window.utils.formatCurrency(grandTotal)}
                </div>
                <div style="max-height: 180px; overflow-y: auto; margin-bottom: 8px; padding-right: 4px;">
                    ${listHtml}
                </div>
                <button class="btn-confirm-yes" style="width: 100%; border: none; padding: 6px; background: #ef4444;" onclick="if(window.switchView) window.switchView('debt');">Mở trang Chi Tiết Nợ 💳</button>
            </div>
        `;
        addMessage(cardHtml, "ai");
    }

    function showFinancialStatsQuery(period) {
        const getFarmData = window.getFarmData;
        const data = getFarmData ? getFarmData() : [];
        if (!data || data.length === 0) {
            addMessage("Không có dữ liệu bán hàng. Hãy đồng bộ dữ liệu trước.", "ai");
            return;
        }
        
        const filteredData = filterDataByPeriod(data, period);
        
        let revFarm = 0;
        let revCompany = 0;
        let revVua = 0;
        let totalRev = 0;
        
        let expensed = 0;
        let phanBon = 0;
        let thuoc = 0;
        let luong = 0;
        let lai = 0;
        let vatTu = 0;
        let muaBong = 0;
        let vanChuyen = 0;
        let vanHanh = 0;
        let totalExp = 0;
        
        filteredData.forEach(row => {
            const typeDT = (row["Loại DT"] || "").trim();
            const isCompany = typeDT === "Company";
            const isVua = typeDT.toLowerCase().includes("vựa") || typeDT.toLowerCase().includes("vua");
            const isFarm = typeDT === "Farm" || typeDT === "";
            
            const loaiCP = (row["Loại CP"] || "").trim().toLowerCase();
            
            const dtBong = row["Doanh Thu Bông"] || 0;
            const dtKhac = row["Doanh Thu Khác"] || 0;
            const chiPhi = row["Chi Phí"] || 0;
            
            const rowRevenue = (chiPhi > 0 && dtKhac === chiPhi) ? 0 : dtKhac;
            
            revFarm += dtBong;
            if (isCompany) revCompany += rowRevenue;
            else if (isVua) revVua += rowRevenue;
            else if (isFarm && rowRevenue > 0) revCompany += rowRevenue;
            
            totalRev += (dtBong + rowRevenue);
            totalExp += chiPhi;
            
            if (loaiCP === "expensed") expensed += chiPhi;
            else if (loaiCP === "phân" || loaiCP === "phan") phanBon += chiPhi;
            else if (loaiCP === "thuốc" || loaiCP === "thuoc") thuoc += chiPhi;
            else if (loaiCP === "công" || loaiCP === "cong") luong += chiPhi;
            else if (loaiCP === "lãi" || loaiCP === "lai") lai += chiPhi;
            else if (loaiCP === "vật tư" || loaiCP === "vat tu" || loaiCP === "vật tư kd") vatTu += chiPhi;
            else if (loaiCP === "mua bông") muaBong += chiPhi;
            else if (loaiCP === "vận chuyển" || loaiCP === "van chuyen") vanChuyen += chiPhi;
            else if (loaiCP === "chi phí khác" || loaiCP === "chi phi khac") vanHanh += chiPhi;
            else if (chiPhi > 0) vanHanh += chiPhi;
        });
        
        const netProfit = totalRev - totalExp;
        
        const periodNames = {
            'today': 'HÔM NAY',
            'yesterday': 'HÔM QUA',
            'this-week': 'TUẦN NÀY',
            'this-month': 'THÁNG NÀY',
            'last-month': 'THÁNG TRƯỚC',
            'this-year': 'NĂM NAY'
        };
        const periodTitle = periodNames[period] || `THÁNG ${period.replace('month-', '')}`;
        
        const cardHtml = `
            <div style="background: #f0fdf4; border-radius: 8px; padding: 12px; border-left: 4px solid #10b981; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-weight: 700; color: #166534; margin-bottom: 8px; font-size: 1.05em; border-bottom: 1px solid #dcfce7; padding-bottom: 6px;">📊 BÁO CÁO: ${periodTitle}</div>
                
                <div style="font-size: 0.9em; margin-bottom: 4px; display:flex; justify-content:space-between; align-items:center;">
                    <span>🟢 Doanh thu:</span> 
                    <b style="color:#10b981;">+${window.utils.formatCurrency(totalRev)}</b>
                </div>
                <div style="font-size:0.8em; color: #475569; padding-left: 10px; margin-bottom: 6px; border-left: 1px solid #dcfce7;">
                    • Farm (Hoa): ${window.utils.formatCurrency(revFarm)}<br>
                    • Vựa: ${window.utils.formatCurrency(revVua)}<br>
                    • Khác (Company): ${window.utils.formatCurrency(revCompany)}
                </div>
                
                <div style="font-size: 0.9em; margin-bottom: 4px; display:flex; justify-content:space-between; align-items:center;">
                    <span>🔴 Chi phí:</span> 
                    <b style="color:#ef4444;">-${window.utils.formatCurrency(totalExp)}</b>
                </div>
                <div style="font-size:0.8em; color: #475569; padding-left: 10px; margin-bottom: 8px; border-left: 1px solid #fee2e2; max-height: 80px; overflow-y: auto;">
                    ${phanBon > 0 ? `• Phân bón: ${window.utils.formatCurrency(phanBon)}<br>` : ''}
                    ${thuoc > 0 ? `• Thuốc: ${window.utils.formatCurrency(thuoc)}<br>` : ''}
                    ${luong > 0 ? `• Nhân công: ${window.utils.formatCurrency(luong)}<br>` : ''}
                    ${vanChuyen > 0 ? `• Vận chuyển: ${window.utils.formatCurrency(vanChuyen)}<br>` : ''}
                    ${muaBong > 0 ? `• Mua bông: ${window.utils.formatCurrency(muaBong)}<br>` : ''}
                    ${lai > 0 ? `• Lãi vay: ${window.utils.formatCurrency(lai)}<br>` : ''}
                    ${vatTu > 0 ? `• Vật tư KD: ${window.utils.formatCurrency(vatTu)}<br>` : ''}
                    ${expensed > 0 ? `• Chi tiêu tiêu dùng (Exp): ${window.utils.formatCurrency(expensed)}<br>` : ''}
                    ${vanHanh > 0 ? `• Khác/Vận hành: ${window.utils.formatCurrency(vanHanh)}<br>` : ''}
                </div>
                
                <div style="font-size: 0.98em; font-weight: 800; border-top: 1px solid #bbf7d0; padding-top: 6px; display:flex; justify-content:space-between; color: ${netProfit >= 0 ? '#10b981' : '#ef4444'};">
                    <span>Lợi nhuận ròng:</span> 
                    <span>${netProfit >= 0 ? '+' : ''}${window.utils.formatCurrency(netProfit)}</span>
                </div>
                <button class="btn-confirm-yes" style="width: 100%; border: none; padding: 6px; margin-top: 10px; background: #10b981;" onclick="if(window.switchView) window.switchView('cashflow');">Mở Báo Cáo Dòng Tiền 📈</button>
            </div>
        `;
        addMessage(cardHtml, "ai");
    }

    // Handle Suggestions
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-tag')) {
            const text = e.target.innerText.replace(/"/g, '');
            chatInput.value = text;
            handleSend();
        }
    });

    // PARSING LOGIC
    function processInput(text) {
        const lowerText = text.toLowerCase().trim();
        
        // Check for multi-line or comma-separated batch input
        const isBatch = (text.includes('\n') && text.trim().split('\n').length > 1) || 
                        (text.includes(',') && text.split(',').length > 1);

        if (isBatch && !lowerText.startsWith('chi') && !lowerText.startsWith('trả')) {
            parseMultiLineFarmEntry(text);
            return;
        }

        // 1. Detect Entry Type
        if (lowerText.startsWith('chi') || lowerText.startsWith('trả') || lowerText.startsWith('tra') || 
            lowerText.startsWith('exp') ||
            lowerText.includes('phân') || lowerText.includes('thuốc') || lowerText.includes('lãi') || 
            lowerText.includes('công') || lowerText.includes('lương')) {
            parseExpenseEntry(text);
        } else if (lowerText.startsWith('vựa') || lowerText.includes('đối soát')) {
            parseVuaEntry(text);
        } else if (lowerText.startsWith('company')) {
            parseCompanyEntry(text);
        } else {
            // Default: Attempt to parse as Farm Entry (Sale)
            // This covers "Bán...", "100 hoa...", "Quân 100 hoa..."
            parseFarmEntry(text);
        }
    }

    // UTILS for Parsing
    function extractMoney(val) {
        if (!val) return 0;
        let clean = val.toLowerCase().trim().replace(',', '.');
        
        // Handle XkY pattern (e.g. 1k6 -> 1.6 * 1000)
        if (clean.includes('k')) {
            return parseFloat(clean.replace('k', '.')) * 1000;
        }
        // Handle XtrY pattern (e.g. 1tr2 -> 1.2 * 1000000)
        if (clean.includes('tr')) {
            return parseFloat(clean.replace('tr', '.')) * 1000000;
        }
        
        clean = clean.replace(/[^0-9.]/g, '');
        return parseFloat(clean) || 0;
    }

    function toTitleCase(str) {
        if (!str) return "";
        return str.trim()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // MULTI-LINE & BATCH FARM ENTRY PARSER
    function parseMultiLineFarmEntry(text) {
        // Detect delimiter: newline or comma
        const delimiter = text.includes('\n') ? /\n/ : /,/;
        const parts = text.split(delimiter).map(p => p.trim()).filter(p => p !== "");
        
        if (parts.length === 0) return;

        let buyer = "";
        const items = [];
        
        // Item Regex: (Optional Name?) (Qty) (Flower) (Sep) (Price)
        // Group 1: Possible Buyer Name, Group 2: Qty, Group 3: Flower, Group 4: Price
        const itemRegex = /^(.*?)\s*(\d+)\s+([a-zà-ỹ\s]+?)\s*(?:x|\s)\s*(\d+(?:[.,]\d+)?[ktr]*)$/i;

        parts.forEach((part, index) => {
            const match = part.match(itemRegex);
            if (match) {
                const possibleBuyer = match[1].trim();
                const qty = parseInt(match[2]);
                const flower = toTitleCase(match[3]);
                const price = extractMoney(match[4]);
                
                if (index === 0 && possibleBuyer) {
                    buyer = toTitleCase(possibleBuyer);
                }
                
                if (qty > 0 && flower && price > 0) {
                    items.push({
                        "Ngày": window.utils.formatDateVietnamese(new Date()),
                        "Người Mua": "", // Will fill later
                        "Phân Loại Bông": flower,
                        "Số lượng": qty,
                        "Giá": price,
                        "Doanh Thu Bông": qty * price,
                        "Status": "Chưa Xong",
                        "Loại DT": "Farm"
                    });
                }
            } else if (index === 0) {
                // If first part didn't match an item, it's the Buyer name (e.g., "Thơm \n ...")
                buyer = toTitleCase(part);
            }
        });

        if (items.length === 0) {
            addMessage("Cú pháp chưa đúng. Thử: <i>'Thơm 200 ecu x 5k, 300 pháp 4500'</i>", "ai");
            return;
        }

        // Apply buyer to all items
        items.forEach(it => it["Người Mua"] = buyer || "Khách vãng lai");

        pendingData = {
            type: 'farm_batch',
            data: items,
            buyer: buyer || "Khách vãng lai"
        };

        let summaryHtml = `Nhập cho <b>${pendingData.buyer}</b> (${items.length} đơn):<br>`;
        items.forEach(it => {
            summaryHtml += `• ${it["Số lượng"]} ${it["Phân Loại Bông"]} x ${window.utils.formatMoneyStr(it["Giá"])}đ<br>`;
        });
        
        pendingData.summaryHtml = summaryHtml;
        showConfirmationCard(summaryHtml);
    }


    // FARM ENTRY PARSER
    // Pattern: "Bán [SL] [Hoa] [Khách] [Giá]"
    function parseFarmEntry(text) {
        const t = text.trim();
        
        // Pattern 1: [Bán/Ban] [SL] [Hoa] [Khách] [Giá]
        const reg1 = /^(?:bán|ban)\s+(\d+)\s+([a-zà-ỹ\s]+?)\s+(?:cho\s+)?([a-zà-ỹ\s]+?)\s+(?:giá|x|\s)\s*(\d+(?:[.,]\d+)?[ktr]*)$/i;
        
        // Pattern 2: [Khách] [SL] [Hoa] [Giá] (User's request)
        const reg2 = /^([a-zà-ỹ\s]+?)\s+(\d+)\s+([a-zà-ỹ\s]+?)\s*(?:giá|x|\s)\s*(\d+(?:[.,]\d+)?[ktr]*)$/i;
        
        // Pattern 3: [SL] [Hoa] [Giá] (Implicit buyer)
        const reg3 = /^(\d+)\s+([a-zà-ỹ\s]+?)\s*(?:giá|x|\s)\s*(\d+(?:[.,]\d+)?[ktr]*)$/i;

        let match, qty, flower, buyer, price;

        if (match = t.match(reg1)) {
            qty = parseInt(match[1]);
            flower = toTitleCase(match[2]);
            buyer = toTitleCase(match[3]);
            price = extractMoney(match[4]);
        } else if (match = t.match(reg2)) {
            buyer = toTitleCase(match[1]);
            qty = parseInt(match[2]);
            flower = toTitleCase(match[3]);
            price = extractMoney(match[4]);
        } else if (match = t.match(reg3)) {
            qty = parseInt(match[1]);
            flower = toTitleCase(match[2]);
            buyer = "Khách vãng lai";
            price = extractMoney(match[3]);
        }

        if (qty > 0 && flower && price > 0) {
            const revenue = qty * price;

            pendingData = {
                type: 'farm',
                data: {
                    "Ngày": window.utils.formatDateVietnamese(new Date()),
                    "Người Mua": buyer,
                    "Phân Loại Bông": flower,
                    "Số lượng": qty,
                    "Giá": price,
                    "Doanh Thu Bông": revenue,
                    "Status": "Chưa Xong",
                    "Loại DT": "Farm"
                }
            };

            const summaryHtml = `Bán cho <b>${buyer}</b><br>📦 <b>${qty} ${flower}</b> x <b>${window.utils.formatMoneyStr(price)}đ</b><br>💰 Tổng: <b>${window.utils.formatCurrency(revenue)}</b>`;
            pendingData.summaryHtml = summaryHtml;
            showConfirmationCard(summaryHtml);
        } else {
            addMessage("Cấu trúc chưa đúng. Thử: <i>'Quân 150 ô hồng x 1k6'</i> hoặc <i>'Bán 50 hồng 10k'</i>", 'ai');
        }
    }

    // EXPENSE ENTRY PARSER
    // Pattern: "Chi [Số tiền] [Ghi chú]"
    function parseExpenseEntry(text) {
        const lowerText = text.toLowerCase();
        // Match: (Optional Chi/Trả/Exp) [Amount] (Optional Tiền) [Note]
        // OR: [Note] [Amount] (e.g., "Phân 500k")
        const regexWithPrefix = /(?:chi|trả|tra|exp)\s+(\d+(?:[.,]\d+)?[ktr]*)\s+(?:tiền\s+)?(.+)/i;
        const regexSimple = /^([a-zà-ỹ\s]+?)\s+(\d+(?:[.,]\d+)?[ktr]*)$/i; // e.g. "Phân 500k"

        
        let amount, note;
        let match = text.match(regexWithPrefix);
        
        if (match) {
            amount = extractMoney(match[1]);
            note = toTitleCase(match[2].trim());
        } else {
            match = text.match(regexSimple);
            if (match) {
                note = toTitleCase(match[1].trim());
                amount = extractMoney(match[2]);
            }
        }

        if (amount && note) {
            
            let category = "Chi Phí Khác";
            const noteLower = note.toLowerCase();

            // 1. High Priority Keywords (Overrides prefixes)
            if (noteLower.includes("phân")) category = "Phân";
            else if (noteLower.includes("thuốc")) category = "Thuốc";
            else if (noteLower.includes("lãi")) category = "Lãi";
            else if (noteLower.includes("công") || noteLower.includes("lương")) category = "Công";
            else if (noteLower.includes("vận chuyển") || noteLower.includes("ship")) category = "Vận Chuyển";
            else if (noteLower.includes("vật tư kd")) category = "Vật tư KD";
            // 2. Prefix-based Priority (If no high-priority keywords match)
            else if (lowerText.startsWith("exp")) category = "Expensed";
            else if (lowerText.startsWith("chi") || lowerText.startsWith("trả") || lowerText.startsWith("tra")) category = "Chi Phí Khác";
            
            // 3. Automated Personal Keywords (Fallback)
            const personalKeywords = ["kem", "chống nắng", "bàn phím", "chuột", "phím", "tai nghe", "màn hình", "ốp lưng", "cá nhân"];
            if (category === "Chi Phí Khác" && personalKeywords.some(kw => noteLower.includes(kw))) {
                category = "Expensed";
            }

            pendingData = {
                type: 'expense',
                data: {
                    "Ngày": window.utils.formatDateVietnamese(new Date()),
                    "Loại CP": category,
                    "Chi Phí": amount,
                    "Ghi Chú Chi Phí": note,
                    "Status": "Xong"
                }
            };

            const summaryHtml = `Ghi nhận chi phí:<br>💸 <b>${window.utils.formatCurrency(amount)}</b><br>📂 Loại: <b>${category}</b><br>📝 Ghi chú: <b>${note}</b>`;
            pendingData.summaryHtml = summaryHtml;
            showConfirmationCard(summaryHtml);
        } else {
            addMessage("Thử gõ: <i>'Chi 500k tiền điện'</i>", 'ai');
        }
    }

    // VỰA ENTRY PARSER (Experimental)
    function parseVuaEntry(text) {
         addMessage("Vựa hiện tại phải nhập thủ công vì có nhiều chi phí đối soát phức tạp.", 'ai');
    }

    // COMPANY ENTRY PARSER
    // Pattern: "Company [Số tiền]"
    function parseCompanyEntry(text) {
        const match = text.match(/^company\s+(\d+(?:[.,]\d+)?[ktr]*)$/i);
        if (match) {
            const amount = extractMoney(match[1]);
            if (amount > 0) {
                pendingData = {
                    type: 'company',
                    data: {
                        "Ngày": window.utils.formatDateVietnamese(new Date()),
                        "Doanh Thu Khác": amount,
                        "Loại DT": "Company",
                        "Status": "Xong"
                    }
                };

                const summaryHtml = `Ghi nhận doanh thu <b>Company</b>:<br>💰 <b>${window.utils.formatCurrency(amount)}</b><br>📂 Loại: <b>Company</b><br>✅ Trạng thái: <b>Xong</b>`;
                pendingData.summaryHtml = summaryHtml;
                showConfirmationCard(summaryHtml);
            } else {
                addMessage("Số tiền không hợp lệ. Thử lại: <i>'Company 18tr'</i>", 'ai');
            }
        } else {
            addMessage("Cấu trúc chưa đúng. Thử: <i>'Company 18tr'</i>", 'ai');
        }
    }

    function showConfirmationCard(html) {
        const cardHtml = `
            <div class="parse-confirm-card">
                <div style="margin-bottom: 10px;">${html}</div>
                <div class="confirm-actions">
                    <button class="btn-confirm-yes" id="confirm-yes">Xác nhận Lưu ✅</button>
                    <button class="btn-confirm-no" id="confirm-no">Hủy</button>
                </div>
            </div>
        `;
        const cardDiv = addMessage(cardHtml, 'ai');

        cardDiv.querySelector('#confirm-yes').onclick = () => savePendingData(cardDiv);
        cardDiv.querySelector('#confirm-no').onclick = () => {
            pendingData = null;
            cardDiv.innerHTML = "Đã hủy bỏ. ❌";
            setBotBusy(false);
        };
    }

    async function savePendingData(cardDiv) {
        if (!pendingData) return;
        
        if (typeof CONFIG === 'undefined' || !CONFIG.WEB_APP_URL || CONFIG.WEB_APP_URL === "NOT_CONFIGURED" || CONFIG.WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
            cardDiv.innerHTML = "Lỗi: CONFIG.WEB_APP_URL chưa được cấu hình. Không thể lưu dữ liệu lên cloud.";
            pendingData = null;
            setBotBusy(false);
            return;
        }
        
        setBotBusy(true);

        const originalHtml = cardDiv.innerHTML;
        cardDiv.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Đang lưu lên Cloud...";

        try {
            const token = window.utils.getToken();
            
            if (pendingData.type === 'farm_batch') {
                const results = [];
                for (let i = 0; i < pendingData.data.length; i++) {
                    cardDiv.innerText = `Đang lưu item ${i+1}/${pendingData.data.length}...`;
                    const resp = await fetch(CONFIG.WEB_APP_URL, {
                        method: "POST",
                        body: JSON.stringify({ action: 'add', data: pendingData.data[i], token: token }),
                        headers: { "Content-Type": "text/plain;charset=utf-8" }
                    });
                    results.push(await resp.json());
                }
                
                const fail = results.find(r => r.status !== 'success');
                if (fail) throw new Error(fail.message);
                
                cardDiv.innerHTML = `<div style="opacity: 0.8; font-size: 0.9em;">${pendingData.summaryHtml}</div><hr style="margin: 8px 0; border: none; border-top: 1px dashed #ccc;">✅ Đã lưu thành công ${results.length} đơn cho ${pendingData.buyer}! 🚀`;
            } else {
                const action = pendingData.type === 'expense' ? 'add_expense' : 'add';
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: action, data: pendingData.data, token: token }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status !== "success") throw new Error(result.message);
                cardDiv.innerHTML = `<div style="opacity: 0.8; font-size: 0.9em;">${pendingData.summaryHtml}</div><hr style="margin: 8px 0; border: none; border-top: 1px dashed #ccc;">✅ Đã lưu thành công! 🚀`;
            }

            window.showToast("Dữ liệu đã được lưu qua Trợ lý Harvest!", "success");
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) syncBtn.click();
            pendingData = null;

        } catch (err) {
            cardDiv.innerHTML = `Lỗi: ${err.message}. Thử lại?`;
            console.error(err);
        } finally {
            setBotBusy(false);
        }
    }

    function showCropSchedulerQuery(lower) {
        let holidayDate = null;
        let holidayLabel = "Mục tiêu";
        let presetKey = "custom";
        
        const now = new Date();
        
        function getHolidayDate(m, d) {
            let year = now.getFullYear();
            let target = new Date(year, m, d);
            const todayNoTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (target < todayNoTime) {
                year += 1;
                target = new Date(year, m, d);
            }
            return target;
        }
        
        const presets = [
            { key: "valentine", m: 1, d: 14, label: "Valentine 14/02" },
            { key: "womensday_intl", m: 2, d: 8, label: "Quốc tế Phụ nữ 08/03" },
            { key: "womensday_vn", m: 9, d: 20, label: "Phụ nữ Việt Nam 20/10" },
            { key: "teachersday_vn", m: 10, d: 20, label: "Nhà giáo Việt Nam 20/11" },
            { key: "christmas", m: 11, d: 25, label: "Giáng Sinh 25/12" }
        ];
        
        let matchedPreset = null;
        if (lower.includes("20/10") || lower.includes("20-10") || lower.includes("phụ nữ việt nam")) {
            matchedPreset = presets.find(p => p.key === "womensday_vn");
        } else if (lower.includes("8/3") || lower.includes("8-3") || lower.includes("08/03") || lower.includes("quốc tế phụ nữ")) {
            matchedPreset = presets.find(p => p.key === "womensday_intl");
        } else if (lower.includes("14/2") || lower.includes("14-2") || lower.includes("14/02") || lower.includes("valentine")) {
            matchedPreset = presets.find(p => p.key === "valentine");
        } else if (lower.includes("20/11") || lower.includes("20-11") || lower.includes("nhà giáo")) {
            matchedPreset = presets.find(p => p.key === "teachersday_vn");
        } else if (lower.includes("noel") || lower.includes("giáng sinh") || lower.includes("christmas") || lower.includes("25/12") || lower.includes("25-12")) {
            matchedPreset = presets.find(p => p.key === "christmas");
        }
        
        if (matchedPreset) {
            holidayLabel = matchedPreset.label;
            presetKey = matchedPreset.key;
            holidayDate = getHolidayDate(matchedPreset.m, matchedPreset.d);
        } else {
            const customMatch = lower.match(/(\d{1,2})[\/\-](\d{1,2})/);
            if (customMatch) {
                const d = parseInt(customMatch[1]);
                const m = parseInt(customMatch[2]) - 1;
                holidayLabel = `Ngày ${d}/${m + 1}`;
                holidayDate = getHolidayDate(m, d);
            } else {
                let closestPreset = presets[0];
                let minDiff = Infinity;
                presets.forEach(p => {
                    const pDate = getHolidayDate(p.m, p.d);
                    const diff = pDate - now;
                    if (diff < minDiff && diff > 0) {
                        minDiff = diff;
                        closestPreset = p;
                    }
                });
                holidayLabel = closestPreset.label;
                presetKey = closestPreset.key;
                holidayDate = getHolidayDate(closestPreset.m, closestPreset.d);
            }
        }
        
        const varietyMap = {
            "ecuador": "Ecuador",
            "pháp": "Pháp",
            "xô đỏ": "Xô Đỏ",
            "xô ngoại": "Xô ngoại",
            "xô nội": "Xô nội",
            "trắng ù": "Trắng ù",
            "quốc vương": "Quốc Vương",
            "ô hồng": "Ô Hồng",
            "hà lan": "Vàng Hà Lan",
            "vàng hà lan": "Vàng Hà Lan",
            "kem": "Kem",
            "simmo": "Simmo",
            "vitto": "Victor Vàng",
            "victor vàng": "Victor Vàng",
            "victor": "Victor Vàng",
            "lạc thần": "Lạc Thần",
            "hỷ trứng": "Hỷ Trứng",
            "capu": "Capu"
        };
        
        const detected = [];
        for (const [key, val] of Object.entries(varietyMap)) {
            if (lower.includes(key)) {
                detected.push(val);
            }
        }
        
        if (detected.length === 0) {
            detected.push("Ecuador", "Pháp");
        }
        
        const FLOWER_CYCLES = {
            "Ecuador": { base: 68, winter: 7, summer: -5 },
            "Pháp": { base: 62, winter: 6, summer: -4 },
            "Xô Đỏ": { base: 53, winter: 5, summer: -3 },
            "Xô ngoại": { base: 56, winter: 5, summer: -3 },
            "Xô nội": { base: 53, winter: 5, summer: -3 },
            "Trắng ù": { base: 60, winter: 6, summer: -4 },
            "Quốc Vương": { base: 64, winter: 6, summer: -4 },
            "Ô Hồng": { base: 63, winter: 6, summer: -4 },
            "Vàng Hà Lan": { base: 60, winter: 6, summer: -4 },
            "Kem": { base: 58, winter: 5, summer: -3 },
            "Simmo": { base: 55, winter: 5, summer: -3 },
            "Victor Vàng": { base: 57, winter: 5, summer: -3 },
            "Lạc Thần": { base: 59, winter: 5, summer: -3 },
            "Hỷ Trứng": { base: 54, winter: 5, summer: -3 },
            "Capu": { base: 61, winter: 6, summer: -4 }
        };
        
        const daysBefore = 7;
        const peakDate = new Date(holidayDate.getTime() - (daysBefore * 24 * 60 * 60 * 1000));
        
        function getCycleDays(varName, targetPeakDate) {
            const info = FLOWER_CYCLES[varName] || { base: 60, winter: 6, summer: -4 };
            const peakMonth = targetPeakDate.getMonth();
            let mod = 0;
            if ([10, 11, 0, 1].includes(peakMonth)) mod = info.winter;
            else if ([5, 6, 7].includes(peakMonth)) mod = info.summer;
            return info.base + mod;
        }
        
        function getFormattedDate(d) {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        }
        
        let comparisonHtml = "";
        detected.forEach(v => {
            const cycle = getCycleDays(v, peakDate);
            const cutD = new Date(peakDate.getTime() - (cycle * 24 * 60 * 60 * 1000));
            comparisonHtml += `
                <tr style="border-bottom:1px solid rgba(124, 58, 237, 0.15); font-size:0.85rem;">
                    <td style="padding:10px 8px; font-weight:700; color:#1e293b;">${v}</td>
                    <td style="padding:10px 8px; font-weight:800; color:#6366f1;">${getFormattedDate(cutD)}</td>
                    <td style="padding:10px 8px; font-weight:700; color:#10b981;">${getFormattedDate(peakDate)}</td>
                    <td style="padding:10px 8px; text-align:center;"><span style="background:rgba(99, 102, 241, 0.1); color:#4f46e5; font-weight:800; padding:2px 6px; border-radius:4px; font-size:0.75rem;">${cycle} ngày</span></td>
                </tr>
            `;
        });
        
        const peakMonthName = peakDate.getMonth() + 1;
        let weatherWarning = "";
        if ([11, 12, 1, 2].includes(peakMonthName)) {
            weatherWarning = `⚠️ <b>Lưu ý khí hậu:</b> Tháng ${peakMonthName} là mùa đông lạnh Đà Lạt nên thời gian sinh trưởng bị kéo dài thêm từ 5-7 ngày. Lịch trên đã tự động bù trừ ngày lạnh.`;
        } else if ([6, 7, 8].includes(peakMonthName)) {
            weatherWarning = `☀️ <b>Lưu ý khí hậu:</b> Tháng ${peakMonthName} thời tiết hè ấm giúp hoa lớn nhanh hơn từ 3-5 ngày. Lịch trên đã tự động rút ngắn chu kỳ.`;
        }
        
        const holidayDateVal = `${holidayDate.getFullYear()}-${String(holidayDate.getMonth() + 1).padStart(2, '0')}-${String(holidayDate.getDate()).padStart(2, '0')}`;
        
        const cardHtml = `
            <div style="background:linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border:1.5px solid #d8b4fe; border-radius:18px; padding:1.25rem; box-shadow:0 8px 24px rgba(124, 58, 237, 0.1); font-family:'Inter', sans-serif; max-width:480px; display:flex; flex-direction:column; gap:10px; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="background:#7c3aed; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(124,58,237,0.3);">
                        <i class="fa-solid fa-wand-magic-sparkles" style="font-size:0.85rem;"></i>
                    </div>
                    <div style="display:flex; flex-direction:column;">
                        <b style="color:#6b21a8; font-size:0.95rem; text-transform:uppercase; letter-spacing:0.5px;">Phân tích Cắt Bông AI</b>
                        <span style="font-size:0.75rem; color:#701a75; font-weight:600;">Lễ mục tiêu: ${holidayLabel} (Rộ rực rỡ ngày: ${getFormattedDate(peakDate)})</span>
                    </div>
                </div>
                
                <p style="margin:0; font-size:0.85rem; color:#4a044e; line-height:1.45;">Trợ lý nông nghiệp AI khuyến nghị ngày cắt cành tối ưu rộ trước lễ <b>1 tuần</b> để đóng gói & vận chuyển hàng đi các tỉnh:</p>
                
                <div style="overflow-x:auto; margin:4px 0; background:white; border-radius:12px; border:1px solid #e9d5ff;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead>
                            <tr style="background:#f3e8ff; font-weight:700; color:#6b21a8; font-size:0.78rem; border-bottom:1.5px solid #d8b4fe;">
                                <th style="padding:8px;">Màu / Giống</th>
                                <th style="padding:8px;">Ngày cắt cành</th>
                                <th style="padding:8px;">Ngày rộ hoa</th>
                                <th style="padding:8px; text-align:center;">Chu kỳ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${comparisonHtml}
                        </tbody>
                    </table>
                </div>
                
                ${weatherWarning ? `<p style="margin:0; font-size:0.78rem; color:#7e22ce; line-height:1.4;">${weatherWarning}</p>` : ''}
                
                <button class="suggestion-tag" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; border: none; font-weight: 800; padding: 10px; border-radius: 8px; text-align: center; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 10px rgba(124,58,237,0.2); font-size:0.82rem; margin-top:4px;" 
                    onclick="window.openAISchedulerPreset('${presetKey}', '${holidayDateVal}', '${detected[0]}')">
                    <i class="fa-solid fa-calendar-plus"></i> Mở Lập Lịch AI để lưu lịch trình
                </button>
            </div>
        `;
        
        addMessage(cardHtml, "ai");
        return true;
    }

});
