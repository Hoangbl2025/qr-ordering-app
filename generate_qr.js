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
    console.log(`Đang tạo mã QR cho ${numberOfTables} khách hàng...`);
    
    for (let i = 1; i <= numberOfTables; i++) {
        // Format mã khách hàng dạng KH01, KH02...
        const customerNum = i.toString().padStart(2, '0');
        const customerCode = `KH${customerNum}`;
        const url = `${baseUrl}/?code=${customerCode}`;
        const fileName = path.join(outputDir, `${customerCode}.png`);

        try {
            await QRCode.toFile(fileName, url, {
                color: {
                    dark: '#000000',  // Chấm đen
                    light: '#FFFFFF' // Nền trắng
                },
                width: 500,
                margin: 2
            });
            console.log(`[Thành công] Đã tạo mã QR cho Khách hàng ${customerCode}: ${url}`);
        } catch (err) {
            console.error(`[Lỗi] Không thể tạo mã cho Khách hàng ${customerCode}:`, err);
        }
    }
    console.log(`\nHoàn tất! Các ảnh mã QR đã được lưu trong thư mục: ${outputDir}`);
};

generateQRCodes();
