const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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
    
    // Gán ID đơn hàng duy nhất để dễ quản lý
    const orderId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const enrichedOrderData = {
      ...orderData,
      id: orderId,
      timestamp: new Date().toLocaleTimeString(),
      status: 'pending' // pending, preparing, done
    };

    // Gửi đơn hàng này tới TẤT CẢ nhân viên trong phòng pha chế
    io.to('barista-room').emit('receive-new-order', enrichedOrderData);
  });

  // 3. Lắng nghe cập nhật trạng thái từ Pha chế
  socket.on('update-status', (statusUpdate) => {
    // statusUpdate = { customerSocketId, orderId, status }
    console.log('Cập nhật trạng thái:', statusUpdate);
    // Gửi thông báo lại cho khách hàng cụ thể dựa trên Socket ID
    if (statusUpdate.customerSocketId) {
       io.to(statusUpdate.customerSocketId).emit('order-status-changed', statusUpdate);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server đang chạy tại http://localhost:${PORT}`));
