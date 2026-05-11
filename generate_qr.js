const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Tên miền chính thức của ứng dụng
const baseUrl = 'https://menu.daotaoaibanhang.com';
const numberOfTables = 10;

const outputDir = path.join(__dirname, 'qrcodes');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const generateQRCodes = async () => {
    console.log(`Đang tạo mã QR cho ${numberOfTables} bàn...`);
    
    for (let i = 1; i <= numberOfTables; i++) {
        // Format số bàn thành dạng 01, 02...
        const tableNum = i.toString().padStart(2, '0');
        const url = `${baseUrl}/?table=${tableNum}`;
        const fileName = path.join(outputDir, `Ban_${tableNum}.png`);

        try {
            await QRCode.toFile(fileName, url, {
                color: {
                    dark: '#000000',  // Chấm đen
                    light: '#FFFFFF' // Nền trắng
                },
                width: 500,
                margin: 2
            });
            console.log(`[Thành công] Đã tạo mã QR cho Bàn ${tableNum}: ${url}`);
        } catch (err) {
            console.error(`[Lỗi] Không thể tạo mã cho Bàn ${tableNum}:`, err);
        }
    }
    console.log(`\nHoàn tất! Các ảnh mã QR đã được lưu trong thư mục: ${outputDir}`);
};

generateQRCodes();
