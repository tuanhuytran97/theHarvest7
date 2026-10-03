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
 * Generic robust Gemini API caller with automatic model fallbacks and exponential backoff retry.
 */
async function callGeminiAPI(payload, overrideApiKey) {
    const apiKey = overrideApiKey || (typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : '') || '';
    if (!apiKey) {
        throw new Error("Chưa cấu hình GEMINI_API_KEY trong file config.js!");
    }

    const modelsToTry = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-2.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.6-flash",
        "gemini-2.5-pro"
    ];
    let lastError = null;

    for (const model of modelsToTry) {
        const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`;
        let delay = 1500;

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    return await response.json();
                }

                const status = response.status;
                let errorMsg = \`HTTP \${status}\`;
                try {
                    const errData = await response.json();
                    if (errData && errData.error && errData.error.message) {
                        errorMsg = errData.error.message;
                    }
                } catch (_) {}

                console.warn(\`Gemini API [\${model}] attempt \${attempt} returned status \${status}: \${errorMsg}\`);

                if ((status === 503 || status === 429 || status === 500) && attempt < 2) {
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2;
                    continue;
                }

                lastError = new Error(\`Lỗi máy chủ Gemini (\${model}): \${errorMsg}\`);
                break;
            } catch (networkErr) {
                console.warn(\`Gemini API network error on model \${model} (attempt \${attempt}):\`, networkErr);
                lastError = networkErr;
                if (attempt < 2) {
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2;
                } else {
                    break;
                }
            }
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
