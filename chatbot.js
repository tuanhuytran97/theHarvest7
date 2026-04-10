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
        msgDiv.innerHTML = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    };

    const handleSend = () => {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        // Processing
        setTimeout(() => {
            processInput(text);
        }, 500);
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
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
        
        // 1. Detect Entry Type
        if (lowerText.startsWith('bán') || lowerText.startsWith('ban')) {
            parseFarmEntry(text);
        } else if (lowerText.startsWith('chi') || lowerText.startsWith('trả') || lowerText.startsWith('tra')) {
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
        let clean = val.toLowerCase().replace(/,/g, '').replace(/\./g, '');
        if (clean.endsWith('k')) {
            return parseFloat(clean) * 1000;
        }
        if (clean.endsWith('tr')) {
            return parseFloat(clean) * 1000000;
        }
        return parseFloat(clean) || 0;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // FARM ENTRY PARSER
    // Pattern: "Bán [SL] [Hoa] [Khách] [Giá]"
    function parseFarmEntry(text) {
        // Regex to match "Ban 100 bong cuc cho Anh Nam gia 5k"
        // Groups: 1: SL, 2: Flower, 3: Buyer, 4: Price
        const regex = /(?:bán|ban)\s+(\d+)\s+([a-zà-ỹ\s]+?)\s+(?:cho\s+)?([a-zà-ỹ\s]+?)\s+(?:giá\s+)?(\d+k?|[\d.]+)/i;
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
                    "Ngày": window.utils.formatDateInput(new Date()),
                    "Người Mua": buyer,
                    "Phân Loại Bông": flower,
                    "Số lượng": qty,
                    "Giá": price,
                    "Doanh Thu Bông": revenue,
                    "Status": "Chưa Xong"
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
        const regex = /(?:chi|trả|tra)\s+(\d+k?|[\d.]+)\s+(?:tiền\s+)?(.+)/i;
        const match = text.match(regex);

        if (match) {
            const amount = extractMoney(match[1]);
            const note = capitalizeFirstLetter(match[2].trim());
            
            // Map common keywords to categories
            let category = "Chi Phí Khác";
            if (note.includes("thuốc")) category = "Thuốc";
            if (note.includes("phân")) category = "Phân";
            if (note.includes("công")) category = "Công";
            if (note.includes("vận chuyển") || note.includes("ship")) category = "Vận Chuyển";

            pendingData = {
                type: 'expense',
                data: {
                    "Ngày": window.utils.formatDateInput(new Date()),
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
         addMessage("Tính năng nhập Vựa qua chat đang được tối ưu. Vui lòng dùng Form nhập liệu truyền thống để đảm bảo độ chính xác của các cột đối soát phức tạp.", 'ai');
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
            const action = pendingData.type === 'expense' ? 'add_expense' : 'add';
            const response = await fetch(CONFIG.WEB_APP_URL, {
                method: "POST",
                body: JSON.stringify({ 
                    action: action, 
                    data: pendingData.data, 
                    token: window.utils.getToken() 
                }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });
            const result = await response.json();

            if (result.status === "success") {
                cardDiv.innerHTML = "Đã lưu thành công! 🚀";
                window.showToast("Dữ liệu đã được lưu qua Trợ lý Harvest!", "success");
                
                // Refresh data
                const syncBtn = document.getElementById('sync-gsheet-btn');
                if (syncBtn) syncBtn.click();
                
                pendingData = null;
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            cardDiv.innerHTML = `Lỗi: ${err.message}. Thử lại?`;
            console.error(err);
        }
    }
});
