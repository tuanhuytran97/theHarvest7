const fs = require('fs');

// Lấy dữ liệu từ Environment Variables của Vercel
const webAppUrl = (process.env.WEB_APP_URL || "").trim();
let usersJsonStr = (process.env.USERS_JSON || "{}").trim();

// Kiểm tra nếu chuỗi JSON không hợp lệ hoặc rỗng
if (!usersJsonStr || usersJsonStr === "") {
    usersJsonStr = "{}";
}

const content = `const CONFIG = {
    // Tự động tạo bởi build script
    WEB_APP_URL: "${webAppUrl}",
    USERS: ${usersJsonStr}
};
`;

try {
    fs.writeFileSync('config.js', content);
    console.log('Successfully created config.js from environment variables.');
    // In ra độ dài để debug nếu cần
    console.log('USERS_JSON Length:', usersJsonStr.length);
} catch (err) {
    console.error('CRITICAL: Error creating config.js:', err);
    process.exit(1);
}
