const socket = io();

// Gia nhập phòng nhân viên ngay khi kết nối
socket.on('connect', () => {
    socket.emit('join-room', 'staff');
});

let orders = [];
let activeOrderId = null; // Lưu ID đơn hàng đang được Sale xác nhận để báo giờ giao

// Fetch initial orders from server
fetch('/api/orders')
    .then(res => res.json())
    .then(data => {
        orders = data;
        renderOrders();
    })
    .catch(err => console.error('Error fetching orders:', err));

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
                <span><b>${item.qty}x</b> ${item.name} <small style="color: #888;">(${item.unit})</small></span>
                <span>${formatMoney(item.price * item.qty)}</span>
            </div>
        `).join('');

        // Hiển thị thêm thông tin thời gian giao dự kiến nếu có
        let deliveryTimeHtml = '';
        if (order.deliveryTime) {
            deliveryTimeHtml = `
                <div class="order-item-row" style="margin-top: 5px; color: #e67e22; font-size: 0.85rem; font-weight: 600;">
                    <span>📅 Dự kiến giao:</span>
                    <span>${order.deliveryTime}</span>
                </div>
            `;
        }

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
                ${deliveryTimeHtml}
                <div class="order-item-row" style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
                    <b>Tổng cộng:</b>
                    <b style="color: var(--primary-color);">${formatMoney(order.total)}</b>
                </div>
            </div>
            <div class="status-actions">
                ${order.status === 'pending' ? `<button class="status-btn btn-preparing" onclick="openDeliveryModal('${order.id}')">Xác nhận đơn & Báo giờ giao</button>` : ''}
                ${order.status === 'preparing' ? `<button class="status-btn btn-done" onclick="completeOrder('${order.id}')">Đã giao hàng (READY)</button>` : ''}
                ${order.status === 'READY' ? `<button class="status-btn" style="background: #ccc; cursor: not-allowed;" disabled>Hoàn thành (Đã giao & TT)</button>` : ''}
            </div>
        `;
        container.appendChild(orderEl);
    });
};

const getStatusText = (status) => {
    switch(status) {
        case 'pending': return 'Mới';
        case 'preparing': return 'Chuẩn bị giao';
        case 'READY': return 'Đã xong';
        default: return 'Không rõ';
    }
}

// Lắng nghe đơn hàng mới
socket.on('receive-new-order', (orderData) => {
    console.log('Đơn hàng mới nhận được:', orderData);
    orders.unshift(orderData);
    renderOrders();
    playNotificationSound();
    showToast(`Có đơn hàng mới từ ${orderData.tableName}!`);
});

// Modal điều khiển thời gian giao hàng
window.openDeliveryModal = (orderId) => {
    activeOrderId = orderId;
    document.getElementById('custom-time-input').value = '';
    document.getElementById('delivery-modal').style.display = 'flex';
};

window.closeDeliveryModal = () => {
    document.getElementById('delivery-modal').style.display = 'none';
    activeOrderId = null;
};

// Xác nhận thời gian giao hàng (khi click nút có sẵn)
window.confirmDeliveryTime = (deliveryTime) => {
    if (activeOrderId) {
        updateOrderStatus(activeOrderId, 'preparing', deliveryTime);
        closeDeliveryModal();
    }
};

// Xác nhận thời gian giao hàng tự nhập
window.submitCustomDeliveryTime = () => {
    const inputVal = document.getElementById('custom-time-input').value.trim();
    if (!inputVal) {
        alert('Vui lòng nhập thời gian giao dự kiến!');
        return;
    }
    if (activeOrderId) {
        updateOrderStatus(activeOrderId, 'preparing', inputVal);
        closeDeliveryModal();
    }
};

window.updateOrderStatus = (orderId, newStatus, deliveryTime = null) => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders[orderIndex].status = newStatus;
        if (deliveryTime) {
            orders[orderIndex].deliveryTime = deliveryTime;
        }
        
        // Gửi thông báo cập nhật lên server, truyền kèm deliveryTime
        socket.emit('update-status', {
            customerSocketId: orders[orderIndex].customerSocketId,
            orderId: orderId,
            status: newStatus,
            deliveryTime: deliveryTime
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
            status: "READY",
            deliveryTime: orders[orderIndex].deliveryTime // Giữ nguyên thời gian giao đã báo
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
