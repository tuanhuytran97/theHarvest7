const fs = require('fs');

// Lấy dữ liệu từ Environment Variables của Vercel
const webAppUrl = process.env.WEB_APP_URL || "";
const usersJson = process.env.USERS_JSON || "{}";

const content = `const CONFIG = {
    // Tự động tạo bởi build script
    WEB_APP_URL: "${webAppUrl}",
    USERS: ${usersJson}
};
`;

try {
    fs.writeFileSync('config.js', content);
    console.log('Successfully created config.js from environment variables.');
} catch (err) {
    console.error('Error creating config.js:', err);
    process.exit(1);
}
