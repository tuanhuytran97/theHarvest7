const fs = require('fs');

// Lấy dữ liệu từ Environment Variables của Vercel
let webAppUrl = (process.env.WEB_APP_URL || "").trim();
let usersJsonStr = (process.env.USERS_JSON || "{}").trim();

// Tự động dọn dẹp URL nếu bạn vô tình copy cả dấu ngoặc kép
webAppUrl = webAppUrl.replace(/^["']|["']$/g, '');

let usersData = {};
try {
    usersData = JSON.parse(usersJsonStr);
} catch (e) {
    console.error("WARNING: USERS_JSON is not a valid JSON. Falling back to empty object.");
    usersData = {};
}

const configObj = {
    WEB_APP_URL: webAppUrl,
    USERS: usersData
};

const content = `const CONFIG = ${JSON.stringify(configObj, null, 4)};`;

try {
    fs.writeFileSync('config.js', content);
    console.log('Successfully created valid config.js.');
} catch (err) {
    console.error('CRITICAL: Error writing config.js:', err);
    process.exit(1);
}
