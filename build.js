const fs = require('fs');

// Nếu file config.js đã tồn tại và không có biến môi trường nào được cấu hình (chạy ở máy local),
// ta sẽ không ghi đè để tránh làm mất các cài đặt thủ công của người dùng.
const hasEnv = process.env.WEB_APP_URL || process.env.USERS_JSON || process.env.GEMINI_API_KEY;
if (fs.existsSync('config.js') && !hasEnv) {
    console.log('File config.js đã tồn tại và không có biến môi trường nào được thiết lập. Bỏ qua ghi đè để bảo toàn cấu hình.');
    process.exit(0);
}

// Lấy dữ liệu từ Environment Variables của Vercel
let webAppUrl = (process.env.WEB_APP_URL || "").trim();
let usersJsonStr = (process.env.USERS_JSON || "{}").trim();
let geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();

// Tự động làm sạch URL và JSON (xóa dấu ngoặc thừa, khoảng trắng lạ)
webAppUrl = webAppUrl.replace(/^["']|["']$/g, '');
geminiApiKey = geminiApiKey.replace(/^["']|["']$/g, '');
// Xóa các ký tự điều khiển/ẩn nếu có trong JSON string
usersJsonStr = usersJsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

let usersData = {};
try {
    // Thử parse JSON
    usersData = JSON.parse(usersJsonStr);
} catch (e) {
    console.error("WARNING: USERS_JSON is invalid JSON format. Data:", usersJsonStr);
    usersData = {};
}

const configObj = {
    WEB_APP_URL: webAppUrl,
    GEMINI_API_KEY: geminiApiKey,
    USERS: usersData
};

const content = `const CONFIG = ${JSON.stringify(configObj, null, 4)};

/**
 * Generic robust Gemini API caller with automatic model fallbacks and fast-timeout cascade.
 */
async function callGeminiAPI(payload, overrideApiKey) {
    const apiKey = overrideApiKey || (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : '') || '';
    if (!apiKey) {
        throw new Error("Chưa cấu hình GEMINI_API_KEY trong file config.js!");
    }

    const modelsToTry = [
        "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3-flash-preview",
        "gemini-flash-latest",
        "gemini-3.7-flash",
        "gemini-2.5-pro"
    ];
    let lastError = null;

    for (const model of modelsToTry) {
        const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`;
        
        // Fast timeout (5s) for heavy/preview models (3.8, 3.7) to never freeze the UI,
        // generous timeout (15s) for production workhorse models
        const timeoutMs = (model === "gemini-3.8-flash" || model === "gemini-3.7-flash") ? 5000 : 15000;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timer);

            if (response.ok) {
                const data = await response.json();
                // Ensure legacy code accessing parts[0].text gets the actual content text (bypassing any thought parts)
                if (data?.candidates?.[0]?.content?.parts) {
                    const parts = data.candidates[0].content.parts;
                    const mainTextPart = parts.find(p => !p.thought && p.text) || parts[0];
                    if (mainTextPart && mainTextPart !== parts[0]) {
                        data.candidates[0].content.parts = [mainTextPart, ...parts.filter(p => p !== mainTextPart)];
                    }
                }
                console.log(\`%c[Gemini AI] Phân tích thành công bằng model: \${model}\`, 'color: #10b981; font-weight: bold;');
                return data;
            }

            const status = response.status;
            let errorMsg = \`HTTP \${status}\`;
            try {
                const errData = await response.json();
                if (errData?.error?.message) {
                    errorMsg = errData.error.message;
                }
            } catch (_) {}

            console.warn(\`[Gemini AI] Model [\${model}] trả về mã \${status}: \${errorMsg}. Đang chuyển tiếp sang model kế tiếp...\`);
            lastError = new Error(\`Lỗi máy chủ Gemini (\${model}): \${errorMsg}\`);
        } catch (networkErr) {
            clearTimeout(timer);
            const isTimeout = networkErr.name === 'AbortError' || networkErr.message?.includes('aborted');
            console.warn(\`[Gemini AI] Model [\${model}] \${isTimeout ? 'quá thời gian phản hồi (timeout)' : 'lỗi kết nối'}. Đang chuyển sang model tiếp theo...\`);
            lastError = networkErr;
        }
    }

    throw lastError || new Error("Không thể kết nối tới dịch vụ Gemini AI (đã thử tất cả các model). Vui lòng thử lại sau giây lát.");
}
`;

try {
    fs.writeFileSync('config.js', content);
    console.log('Successfully created config.js.');
    console.log('Total users mapped:', Object.keys(usersData).length);
} catch (err) {
    console.error('CRITICAL: Error writing config.js:', err);
    process.exit(1);
}
