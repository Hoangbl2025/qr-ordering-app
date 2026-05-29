const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const axios = require('axios');
const fs = require('fs');


// Đọc danh sách khách hàng từ file
let customersData = {};
try {
  const rawData = fs.readFileSync(path.join(__dirname, 'customers.json'));
  customersData = JSON.parse(rawData);
  console.log(`Đã tải thành công CSDL gồm ${Object.keys(customersData).length} khách hàng.`);
} catch (e) {
  console.error("Không thể đọc file customers.json", e);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Để server có thể đọc JSON body

// Biến lưu trữ đơn hàng tạm thời trong bộ nhớ server
let currentOrders = [];

function generateOrderId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// API lấy danh sách đơn hàng hiện tại
app.get('/api/orders', (req, res) => {
  res.json(currentOrders);
});

// API lấy đơn hàng đang hoạt động của 1 khách hàng (để tự động khôi phục giao diện)
app.get('/api/active-order/:code', (req, res) => {
  const code = req.params.code;
  const activeOrder = currentOrders.find(o => o.customerCode === code && !o.dismissed);
  if (activeOrder) {
    res.json({ success: true, order: activeOrder });
  } else {
    res.json({ success: false });
  }
});

io.on('connection', (socket) => {
  console.log('Có người kết nối:', socket.id);

  // 1. Phân loại người dùng vào "phòng" (Room)
  socket.on('join-room', (role) => {
    if (role === 'staff') {
      socket.join('barista-room'); // Nhân viên vào phòng pha chế
      console.log('Nhân viên đã vào phòng trực:', socket.id);
    }
  });

  // 2. Lắng nghe đơn hàng từ Khách hàng
  socket.on('send-order', (orderData) => {
    console.log('Đơn hàng mới:', orderData);
    
    // Tự động tra cứu tên và địa chỉ từ CSDL dựa trên customerCode
    const cCode = orderData.customerCode || 'UNKNOWN';
    const cInfo = customersData[cCode] || { name: 'Đại lý mới / Chưa có tên', address: 'Chưa cập nhật địa chỉ' };

    const enrichedOrderData = {
      ...orderData,
      id: generateOrderId(),
      timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      status: 'pending', // pending, preparing, done
      customerName: cInfo.name,
      customerAddress: cInfo.address,
      dismissed: false // Cờ đánh dấu khách đã bấm hoàn tất đơn
    };

    // Lưu vào bộ nhớ tạm
    currentOrders.unshift(enrichedOrderData);

    // Gửi lên Google Form
    const itemsString = enrichedOrderData.items.map(i => `${i.qty}x ${i.name}`).join(', ');
    
    // Cấu hình ID các trường của Google Form mới
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdzegmy1nPDakr8DbX1TYFiEVOjjLkchu0wYpKVk9NSMrZKQg/formResponse';
    const formData = new URLSearchParams();
    formData.append('entry.1221722327', enrichedOrderData.customerCode); // Mã KH
    formData.append('entry.1691237577', itemsString); // Mô tả đơn hàng
    formData.append('entry.351321341', enrichedOrderData.total.toString()); // Tổng Tiền
    formData.append('entry.811081803', 'Chưa thanh toán'); // Phương Thức Thanh Toán
    formData.append('entry.772978177', enrichedOrderData.timestamp); // Thời Gian

    axios.post(formUrl, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(res => console.log('Đã lưu đơn hàng lên Google Form thành công!'))
    .catch(err => console.error('Lỗi lưu đơn lên Google Form:', err.message));

    // Gửi đơn hàng này tới TẤT CẢ nhân viên trong phòng pha chế
    io.to('barista-room').emit('receive-new-order', enrichedOrderData);
  });

  // 3. Lắng nghe cập nhật trạng thái từ Sale
  socket.on('update-status', (data) => {
    // Cập nhật trạng thái trong bộ nhớ
    const orderIndex = currentOrders.findIndex(o => o.id === data.orderId);
    if (orderIndex > -1) {
      currentOrders[orderIndex].status = data.status;
      if (data.deliveryTime) {
          currentOrders[orderIndex].deliveryTime = data.deliveryTime;
      }

      // Lấy socketId MỚI NHẤT của khách hàng từ máy chủ
      const currentSocketId = currentOrders[orderIndex].customerSocketId;

      io.to(currentSocketId).emit('order-status-changed', {
        orderId: data.orderId,
        status: data.status,
        deliveryTime: data.deliveryTime
      });
    }
  });

  // Lắng nghe khi khách hàng F5 hoặc load lại trang
  socket.on('register-customer', (customerCode) => {
    const activeOrder = currentOrders.find(o => o.customerCode === customerCode && !o.dismissed);
    if (activeOrder) {
      activeOrder.customerSocketId = socket.id; // Cập nhật lại đường dây liên lạc
      console.log(`Đã kết nối lại khách hàng ${customerCode} với đơn hàng ${activeOrder.id}`);
    }
  });

  // Khách hàng bấm Hoàn tất & Đặt đơn mới
  socket.on('dismiss-order', (customerCode) => {
    const activeOrder = currentOrders.find(o => o.customerCode === customerCode && !o.dismissed);
    if (activeOrder) {
      activeOrder.dismissed = true;
      console.log(`Khách hàng ${customerCode} đã đóng đơn hàng ${activeOrder.id}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server đang chạy tại http://localhost:${PORT}`));
