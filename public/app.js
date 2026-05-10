const socket = io();

// Lấy tham số bàn từ URL, mặc định là Bàn 01 nếu không có
const urlParams = new URLSearchParams(window.location.search);
const tableName = urlParams.get('table') ? `Bàn ${urlParams.get('table')}` : 'Bàn 01';

document.getElementById('table-display').innerText = tableName;

// Menu mẫu theo yêu cầu
const menuData = [
    { id: 'm1', name: "Xôi Mặn Hải Phòng", price: 45000 },
    { id: 'm2', name: "Cà Phê Muối", price: 30000 },
    { id: 'm3', name: "Trà Đào Cam Sả", price: 35000 },
    { id: 'm4', name: "Bánh Mì Chảo", price: 55000 }
];

let cart = {};
let currentOrderTotal = 0;

const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const renderMenu = () => {
    const menuContainer = document.getElementById('menu-list');
    menuContainer.innerHTML = '';

    menuData.forEach(item => {
        const qty = cart[item.id] || 0;
        const itemEl = document.createElement('div');
        itemEl.className = 'menu-item';
        itemEl.innerHTML = `
            <div class="item-info">
                <h3>${item.name}</h3>
                <div class="item-price">${formatMoney(item.price)}</div>
            </div>
            <div class="item-actions">
                <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                <div class="qty-display">${qty}</div>
                <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
            </div>
        `;
        menuContainer.appendChild(itemEl);
    });
};

window.updateQty = (id, change) => {
    if (!cart[id]) cart[id] = 0;
    cart[id] += change;
    if (cart[id] < 0) cart[id] = 0;
    
    renderMenu();
    updateCartSummary();
};

const updateCartSummary = () => {
    let total = 0;
    let totalItems = 0;

    menuData.forEach(item => {
        if (cart[item.id]) {
            total += item.price * cart[item.id];
            totalItems += cart[item.id];
        }
    });

    document.getElementById('total-price').innerText = formatMoney(total);
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = totalItems === 0;
};

// Gửi đơn hàng
document.getElementById('checkout-btn').addEventListener('click', () => {
    const items = [];
    let total = 0;

    menuData.forEach(item => {
        if (cart[item.id] && cart[item.id] > 0) {
            items.push({ name: item.name, price: item.price, qty: cart[item.id] });
            total += item.price * cart[item.id];
        }
    });

    currentOrderTotal = total;

    const orderData = {
        tableName: tableName,
        items: items,
        total: total,
        customerSocketId: socket.id 
    };

    socket.emit('send-order', orderData);
    
    // Hiển thị màn hình chờ
    showStatusOverlay('pending');
});

// Nghe phản hồi trạng thái từ pha chế
socket.on('order-status-changed', (data) => {
    console.log(`Thông báo: Món của bạn hiện đang ở trạng thái: ${data.status}`);
    showStatusOverlay(data.status);
    showToast(`Đơn hàng của bạn đã chuyển sang trạng thái: ${getStatusText(data.status)}`);
});

const getStatusText = (status) => {
    switch(status) {
        case 'pending': return 'Đang chờ xác nhận';
        case 'preparing': return 'Đang chuẩn bị';
        case 'READY': return 'Đã hoàn thành';
        default: return 'Không xác định';
    }
}

const showStatusOverlay = (status) => {
    const overlay = document.getElementById('status-overlay');
    const icon = document.getElementById('status-icon');
    const text = document.getElementById('status-text');
    const subtext = document.getElementById('status-subtext');
    const newBtn = document.getElementById('new-order-btn');
    const qrContainer = document.getElementById('qr-container');

    overlay.classList.add('active');
    newBtn.style.display = 'none';
    qrContainer.style.display = 'none';

    if (status === 'pending') {
        icon.innerText = '🕒';
        text.innerText = 'Đã gửi đơn hàng';
        subtext.innerText = 'Đang chờ bếp xác nhận...';
    } else if (status === 'preparing') {
        icon.innerText = '👨‍🍳';
        text.innerText = 'Đang chuẩn bị';
        subtext.innerText = 'Món ngon sắp sẵn sàng rồi!';
    } else if (status === 'READY') {
        icon.innerText = '✨';
        text.innerText = 'Đã hoàn thành';
        subtext.innerText = 'Vui lòng thanh toán và nhận món!';
        newBtn.style.display = 'inline-block';
        
        // Hiển thị VietQR
        qrContainer.style.display = 'block';
        // Sử dụng API vietqr.io (cần thay thế STK và Ngân hàng thực tế)
        const bankId = 'MB'; // Tên ngân hàng
        const accountNo = '0918816227'; // Số tài khoản
        const accountName = 'HOANG THI THU HUYEN'; // Tên chủ tài khoản
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${currentOrderTotal}&addInfo=Thanh toan don hang ${tableName}&accountName=${encodeURIComponent(accountName)}`;
        document.getElementById('vietqr-img').src = qrUrl;
    }
};

document.getElementById('new-order-btn').addEventListener('click', () => {
    // Reset cart and hide overlay
    cart = {};
    renderMenu();
    updateCartSummary();
    document.getElementById('status-overlay').classList.remove('active');
});

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

// Init
renderMenu();
