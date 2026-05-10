const socket = io();

// Gia nhập phòng nhân viên ngay khi kết nối
socket.on('connect', () => {
    socket.emit('join-room', 'staff');
});

let orders = [];

const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const playNotificationSound = () => {
    const audio = document.getElementById('notification-sound');
    if (audio) {
        audio.play().catch(e => console.log('Autoplay prevented by browser:', e));
    }
};

const renderOrders = () => {
    const container = document.getElementById('order-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">Chưa có đơn hàng nào.</div>';
        return;
    }

    container.innerHTML = '';
    
    orders.forEach(order => {
        let itemsHtml = order.items.map(item => `
            <div class="order-item-row">
                <span><b>${item.qty}x</b> ${item.name}</span>
                <span>${formatMoney(item.price * item.qty)}</span>
            </div>
        `).join('');

        const orderEl = document.createElement('div');
        orderEl.className = 'order-card';
        orderEl.innerHTML = `
            <div class="order-header">
                <h3>${order.tableName}</h3>
                <div>
                    <span class="status-badge badge-${order.status === 'READY' ? 'done' : order.status}">${getStatusText(order.status)}</span>
                    <span style="font-size: 0.8rem; color: #666; margin-left: 10px;">${order.timestamp}</span>
                </div>
            </div>
            <div class="order-items">
                ${itemsHtml}
                <div class="order-item-row" style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
                    <b>Tổng cộng:</b>
                    <b style="color: var(--primary-color);">${formatMoney(order.total)}</b>
                </div>
            </div>
            <div class="status-actions">
                ${order.status === 'pending' ? `<button class="status-btn btn-preparing" onclick="updateOrderStatus('${order.id}', 'preparing')">Bắt đầu làm</button>` : ''}
                ${order.status === 'preparing' ? `<button class="status-btn btn-done" onclick="completeOrder('${order.id}')">Xong (READY)</button>` : ''}
                ${order.status === 'READY' ? `<button class="status-btn" style="background: #ccc;" disabled>Đã giao & Chờ TT</button>` : ''}
            </div>
        `;
        container.appendChild(orderEl);
    });
};

const getStatusText = (status) => {
    switch(status) {
        case 'pending': return 'Mới';
        case 'preparing': return 'Đang làm';
        case 'READY': return 'Đã xong';
        default: return 'Không rõ';
    }
}

// Lắng nghe đơn hàng mới
socket.on('receive-new-order', (orderData) => {
    console.log('Đơn hàng mới nhận được:', orderData);
    // Thêm vào đầu danh sách
    orders.unshift(orderData);
    renderOrders(); // Hàm hiển thị đơn hàng lên màn hình
    playNotificationSound(); // Phát tiếng chuông báo đơn mới
    showToast(`Có đơn hàng mới từ ${orderData.tableName}!`);
});

window.updateOrderStatus = (orderId, newStatus) => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders[orderIndex].status = newStatus;
        
        // Gửi thông báo cập nhật lên server
        socket.emit('update-status', {
            customerSocketId: orders[orderIndex].customerSocketId,
            orderId: orderId,
            status: newStatus
        });

        renderOrders();
    }
};

window.completeOrder = (orderId) => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders[orderIndex].status = "READY";
        
        socket.emit('update-status', {
            customerSocketId: orders[orderIndex].customerSocketId,
            orderId: orderId,
            status: "READY"
        });

        renderOrders();
    }
};

const showToast = (message) => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🔔</span> <div>${message}</div>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

// Initial render
renderOrders();
