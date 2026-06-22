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

const content = `const CONFIG = ${JSON.stringify(configObj, null, 4)};`;

try {
    fs.writeFileSync('config.js', content);
    console.log('Successfully created config.js.');
    console.log('Total users mapped:', Object.keys(usersData).length);
} catch (err) {
    console.error('CRITICAL: Error writing config.js:', err);
    process.exit(1);
}
