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
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';
        chatInput.style.height = 'auto'; // Reset height

        // Processing
        setTimeout(() => {
            processInput(text);
        }, 500);
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line on Enter (unless Shift is pressed)
            handleSend();
        }
    });


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
        const lowerText = text.toLowerCase();
        
        // Check for multi-line or comma-separated batch input
        const isBatch = (text.includes('\n') && text.trim().split('\n').length > 1) || 
                        (text.includes(',') && text.split(',').length > 1);

        if (isBatch && !lowerText.startsWith('chi') && !lowerText.startsWith('trả')) {
            parseMultiLineFarmEntry(text);
            return;
        }

        // 1. Detect Single Entry Type

        if (lowerText.startsWith('bán') || lowerText.startsWith('ban')) {
            parseFarmEntry(text);
        } else if (lowerText.startsWith('chi') || lowerText.startsWith('trả') || lowerText.startsWith('tra') || 
                   lowerText.startsWith('exp') ||
                   lowerText.includes('phân') || lowerText.includes('thuốc') || lowerText.includes('lãi') || 
                   lowerText.includes('công') || lowerText.includes('lương')) {
            parseExpenseEntry(text);
        } else if (lowerText.startsWith('vựa') || lowerText.includes('đối soát')) {
            parseVuaEntry(text);
        } else {
            addMessage("Xin lỗi, tôi chưa hiểu lệnh này. Thử gõ: <b>'Bán 100 cúc Anh Nam 5k'</b>", 'ai');
        }
    }

    // UTILS for Parsing
    function extractMoney(val) {
        if (!val) return 0;
        let clean = val.toLowerCase().trim();
        let multiplier = 1;
        
        if (clean.endsWith('k')) {
            multiplier = 1000;
            clean = clean.slice(0, -1);
        } else if (clean.endsWith('tr')) {
            multiplier = 1000000;
            clean = clean.slice(0, -1);
        }
        
        // Handle Vietnamese decimal comma (e.g., 4,5 -> 4.5)
        // BUT if it's 10.000 (dot as thousands separator), we should remove it
        // A simple rule: if there's a comma, it's likely a decimal in this context (4,5k)
        clean = clean.replace(',', '.');
        
        // Remove any other non-numeric chars except dot
        clean = clean.replace(/[^0-9.]/g, '');
        
        return parseFloat(clean) * multiplier;
    }

    function capitalizeFirstLetter(string) {
        if (!string) return "";
        return string.charAt(0).toUpperCase() + string.slice(1).trim();
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
                const flower = capitalizeFirstLetter(match[3]);
                const price = extractMoney(match[4]);
                
                if (index === 0 && possibleBuyer) {
                    buyer = capitalizeFirstLetter(possibleBuyer);
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
                buyer = capitalizeFirstLetter(part);
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
        
        showConfirmationCard(summaryHtml);
    }


    // FARM ENTRY PARSER
    // Pattern: "Bán [SL] [Hoa] [Khách] [Giá]"
    function parseFarmEntry(text) {
        const regex = /(?:bán|ban)\s+(\d+)\s+([a-zà-ỹ\s]+?)\s+(?:cho\s+)?([a-zà-ỹ\s]+?)\s+(?:giá\s+)?(\d+(?:[.,]\d+)?[ktr]*)/i;

        const match = text.match(regex);

        if (match) {
            const qty = parseInt(match[1]);
            const flower = capitalizeFirstLetter(match[2].trim());
            const buyer = capitalizeFirstLetter(match[3].trim());
            const price = extractMoney(match[4]);
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

            showConfirmationCard(`Bán cho <b>${buyer}</b><br>📦 <b>${qty} ${flower}</b> x <b>${window.utils.formatMoneyStr(price)}đ</b><br>💰 Tổng: <b>${window.utils.formatCurrency(revenue)}</b>`);
        } else {
            addMessage("Cấu trúc hơi lạ. Thử: <i>'Bán 50 hồng Chị Huệ 10k'</i>", 'ai');
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
            note = capitalizeFirstLetter(match[2].trim());
        } else {
            match = text.match(regexSimple);
            if (match) {
                note = capitalizeFirstLetter(match[1].trim());
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

            showConfirmationCard(`Ghi nhận chi phí:<br>💸 <b>${window.utils.formatCurrency(amount)}</b><br>📂 Loại: <b>${category}</b><br>📝 Ghi chú: <b>${note}</b>`);
        } else {
            addMessage("Thử gõ: <i>'Chi 500k tiền điện'</i>", 'ai');
        }
    }

    // VỰA ENTRY PARSER (Experimental)
    function parseVuaEntry(text) {
         addMessage("Vựa hiện tại phải nhập thủ công vì có nhiều chi phí đối soát phức tạp.", 'ai');
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
        };
    }

    async function savePendingData(cardDiv) {
        if (!pendingData) return;

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
                
                cardDiv.innerHTML = `Đã lưu thành công ${results.length} đơn cho ${pendingData.buyer}! 🚀`;
            } else {
                const action = pendingData.type === 'expense' ? 'add_expense' : 'add';
                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: action, data: pendingData.data, token: token }),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });
                const result = await response.json();
                if (result.status !== "success") throw new Error(result.message);
                cardDiv.innerHTML = "Đã lưu thành công! 🚀";
            }

            window.showToast("Dữ liệu đã được lưu qua Trợ lý Harvest!", "success");
            const syncBtn = document.getElementById('sync-gsheet-btn');
            if (syncBtn) syncBtn.click();
            pendingData = null;

        } catch (err) {
            cardDiv.innerHTML = `Lỗi: ${err.message}. Thử lại?`;
            console.error(err);
        }
    }

});
