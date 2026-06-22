const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

http.createServer((req, res) => {
    // Clean URL query params
    let filePath = '.' + req.url.split('?')[0];
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.manifest': 'text/cache-manifest',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Không Tìm Thấy</h1><p>File không tồn tại trên hệ thống.</p>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Lỗi máy chủ: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content, 'utf-8');
        }
    });
}).listen(PORT, () => {
    console.log('===================================================');
    console.log(` Server dang chay tai: http://localhost:${PORT}/`);
    console.log('===================================================');
});
