const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PORT = 8000;
let pythonStockProcess = null;

// Kiểm tra xem stock_service (port 8001) đã chạy chưa
function checkStockServiceRunning(callback) {
    const req = http.get('http://127.0.0.1:8001/health', { timeout: 1000 }, (res) => {
        if (res.statusCode === 200) {
            callback(true);
        } else {
            callback(false);
        }
    });
    req.on('error', () => callback(false));
    req.on('timeout', () => {
        req.destroy();
        callback(false);
    });
}

// Tự động khởi động stock_service.py nếu chưa chạy
function startStockService(callback) {
    checkStockServiceRunning((isRunning) => {
        if (isRunning) {
            if (callback) callback(true);
            return;
        }

        console.log('[Auto-Start] Đang tự động khởi động stock_service.py (Port 8001)...');
        try {
            pythonStockProcess = spawn('py', ['-3.11', 'stock_service.py'], {
                cwd: __dirname,
                stdio: 'ignore',
                windowsHide: true
            });
        } catch (e) {
            try {
                pythonStockProcess = spawn('python', ['stock_service.py'], {
                    cwd: __dirname,
                    stdio: 'ignore',
                    windowsHide: true
                });
            } catch (err) {
                console.error('[Auto-Start] Không thể khởi động stock_service:', err);
                if (callback) callback(false);
                return;
            }
        }

        pythonStockProcess.on('error', (err) => {
            console.log('[Auto-Start] py -3.11 gặp lỗi, thử lại bằng lệnh python:', err.message);
            try {
                pythonStockProcess = spawn('python', ['stock_service.py'], {
                    cwd: __dirname,
                    stdio: 'ignore',
                    windowsHide: true
                });
            } catch (e) {
                console.error('[Auto-Start] Khởi động thất bại:', e);
            }
        });

        pythonStockProcess.on('exit', (code) => {
            console.log(`[Stock Service] Đã kết thúc (code: ${code})`);
            pythonStockProcess = null;
        });

        if (callback) callback(true);
    });
}

// Dọn dẹp process khi server.js tắt
function cleanup() {
    if (pythonStockProcess && pythonStockProcess.pid) {
        try {
            if (process.platform === 'win32') {
                execSync(`taskkill /pid ${pythonStockProcess.pid} /T /F`, { stdio: 'ignore' });
            } else {
                pythonStockProcess.kill('SIGTERM');
            }
        } catch (e) {}
    }
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('SIGTERM', () => { cleanup(); process.exit(); });

http.createServer((req, res) => {
    // Clean URL query params
    let rawPath = req.url.split('?')[0];

    // API endpoint: kích hoạt bật stock_service khi frontend yêu cầu
    if (rawPath === '/api/start-stock-service') {
        startStockService((ok) => {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ success: ok, message: 'Stock service kích hoạt thành công.' }));
        });
        return;
    }

    // Tự động bật stock_service nếu người dùng truy cập trang định giá cổ phiếu
    if (rawPath.includes('dcf-screener')) {
        startStockService();
    }

    let filePath = '.' + rawPath;
    if (filePath === './') filePath = './index.html';
    if (!fs.existsSync(filePath) && fs.existsSync('./assets' + rawPath)) {
        filePath = './assets' + rawPath;
    }

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
    console.log(` Server đang chạy tại: http://localhost:${PORT}/`);
    console.log(' Tự động kích hoạt Stock Service (Port 8001)...');
    console.log('===================================================');
    startStockService();
});
