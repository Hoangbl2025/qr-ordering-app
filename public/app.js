const socket = io();

// Lấy tham số mã khách hàng từ URL (chấp nhận cả 'code' và 'table' để tương thích ngược), mặc định là KH01
const urlParams = new URLSearchParams(window.location.search);
const customerCode = urlParams.get('code') || urlParams.get('table') || 'KH01';

// Lấy tham số tên và địa chỉ điền sẵn (nếu có)
const prefillName = urlParams.get('name');
const prefillAddress = urlParams.get('address');

const formattedCustomerName = `Mã Khách: ${customerCode}`;

document.getElementById('table-display').innerText = formattedCustomerName;

// Load thông tin từ localStorage HOẶC từ URL (Ưu tiên URL đè lên)
const savedName = prefillName || localStorage.getItem('thanhha_customer_name') || '';
const savedAddress = prefillAddress || localStorage.getItem('thanhha_customer_address') || '';

if (document.getElementById('customer-name')) {
    document.getElementById('customer-name').value = savedName;
}
if (document.getElementById('customer-address')) {
    document.getElementById('customer-address').value = savedAddress;
}

// Nếu URL có truyền tham số, tự động lưu luôn vào máy khách hàng
if (prefillName) localStorage.setItem('thanhha_customer_name', prefillName);
if (prefillAddress) localStorage.setItem('thanhha_customer_address', prefillAddress);

// Danh sách 20 sản phẩm thực tế từ bảng báo giá Giấy Thanh Hà
const menuData = [
    { id: 'sp1', name: "Giấy vệ sinh Thanh Hà 20 cuộn", price: 530000, category: 'giay-ve-sinh', unit: 'Cây', note: '10 xách/Cây (20 cuộn 1 xách)', image: 'images/sp1.png' },
    { id: 'sp2', name: "Giấy vệ sinh Thanh Hà 15 cuộn", price: 570000, category: 'giay-ve-sinh', unit: 'Cây', note: '10 xách/Cây (15 cuộn 1 xách)', image: 'images/sp2.png' },
    { id: 'sp3', name: "Giấy vệ sinh Gấu Thanh Hà", price: 660000, category: 'giay-ve-sinh', unit: 'Cây', note: '10 xách/Cây (12 cuộn 1 xách)', image: 'images/sp3.png' },
    { id: 'sp4', name: "Giấy vệ sinh Mèo Vàng", price: 570000, category: 'giay-ve-sinh', unit: 'Cây', note: '10 xách/Cây (12 cuộn 1 xách)', image: 'images/sp4.png' },
    { id: 'sp5', name: "Giấy vệ sinh Supper Thanh Hà", price: 420000, category: 'giay-ve-sinh', unit: 'Cây', note: '10 xách/Cây (10 cuộn 1 xách)', image: 'images/sp5.png' },
    { id: 'sp6', name: "Giấy vệ sinh Bản Đồ Thanh Hà", price: 680000, category: 'giay-ve-sinh', unit: 'Cây', note: '10 xách/Cây (10 cuộn 1 xách)', image: 'images/sp6.png' },
    { id: 'sp7', name: "Giấy vệ sinh 6 Cuộn Hoa Sen", price: 520000, category: 'giay-ve-sinh', unit: 'Cây', note: '12 xách/Cây (6 cuộn 1 xách)', image: 'images/sp7.png' },
    { id: 'sp8', name: "Khăn rút mèo to Thanh Hà", price: 600000, category: 'khan-giay-rut', unit: 'Cây', note: '10 xách/Cây (4 gói 1 xách)', image: 'images/sp8.png' },
    { id: 'sp9', name: "Khăn rút Đa Năng Thanh Hà", price: 500000, category: 'khan-giay-rut', unit: 'Cây', note: '10 xách/Cây (5 gói 1 xách)', image: 'images/sp9.png' },
    { id: 'sp10', name: "Khăn rút mèo bé Thanh Hà", price: 650000, category: 'khan-giay-rut', unit: 'Cây', note: '10 xách/Cây (10 gói 1 xách)', image: 'images/sp10.png' },
    { id: 'sp11', name: "Khăn rút Angel Xanh", price: 400000, category: 'khan-giay-rut', unit: 'Cây', note: '10 xách/Cây (10 gói/Xách)', image: 'images/sp11.png' },
    { id: 'sp12', name: "Giấy Rút Treo Tường Hổ", price: 170000, category: 'khan-giay-rut', unit: 'Thùng', note: '6 xách/thùng (Tặng 2 móc dán)', image: 'images/sp12.png' },
    { id: 'sp13', name: "Khăn giấy Thỏ Nâu", price: 130000, category: 'khan-giay-rut', unit: 'Thùng', note: '6 xách/thùng (Tặng 2 móc dán)', image: 'images/sp13.png' },
    { id: 'sp14', name: "Giấy vệ sinh Công Nghiệp", price: 800000, category: 'giay-ve-sinh', unit: 'Cây', note: '10 xách/Cây', image: 'images/sp14.png' },
    { id: 'sp15', name: "Khăn rút xanh cao cấp Thanh Hà", price: 500000, category: 'khan-giay-rut', unit: 'Cây', note: '10 xách/Cây (6 gói 1 xách)', image: 'images/sp15.png' },
    { id: 'sp16', name: "Giấy Phở Vàng Thanh Hà", price: 320000, category: 'giay-pho-khac', unit: 'Cây', note: '10 xách/Cây', image: 'images/sp16.png' },
    { id: 'sp17', name: "Giấy Phở Xanh Thanh Hà", price: 320000, category: 'giay-pho-khac', unit: 'Cây', note: '10 xách/Cây', image: 'images/sp17.png' },
    { id: 'sp18', name: "Giấy Phở Rút Thanh Hà", price: 330000, category: 'giay-pho-khac', unit: 'Cây', note: '10 xách/Cây', image: 'images/sp18.png' },
    { id: 'sp19', name: "Khăn rút học sinh Thanh Hà", price: 130000, category: 'khan-giay-rut', unit: 'Thùng', note: '30 Gói/Thùng (Nhiều màu)', image: 'images/sp19.png' },
    { id: 'sp20', name: "Giấy vệ sinh cuộn công nghiệp", price: 300000, category: 'giay-ve-sinh', unit: 'Cây', note: '10 cuộn / Cây', image: 'images/sp20.png' }
];

let cart = {};
let currentOrderTotal = 0;
let activeCategory = 'all';

const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Hiển thị menu sản phẩm
const renderMenu = () => {
    const menuContainer = document.getElementById('menu-list');
    menuContainer.innerHTML = '';

    // Lọc sản phẩm theo danh mục đang chọn
    const filteredMenu = activeCategory === 'all' 
        ? menuData 
        : menuData.filter(item => item.category === activeCategory);

    if (filteredMenu.length === 0) {
        menuContainer.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">Không tìm thấy sản phẩm nào.</div>';
        return;
    }

    filteredMenu.forEach(item => {
        const qty = cart[item.id] || 0;
        const itemEl = document.createElement('div');
        itemEl.className = 'menu-item';
        
        // Đoạn HTML thẻ sản phẩm có hình ảnh và thông tin chi tiết
        itemEl.innerHTML = `
            <div class="item-img-container">
                <img src="${item.image}" alt="${item.name}" class="item-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 style=%22background:%23eee;%22><text x=%2250%%22 y=%2250%%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22%23999%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22>🧻</text></svg>'">
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <div class="item-meta">
                    <span>Đơn vị: <b>${item.unit}</b></span>
                    <span>Quy cách: ${item.note}</span>
                </div>
                <div class="item-price-row">
                    <span class="item-price">${formatMoney(item.price)}</span>
                    <span class="item-unit">/${item.unit}</span>
                </div>
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
    const customerNameInput = document.getElementById('customer-name').value.trim();
    const customerAddressInput = document.getElementById('customer-address').value.trim();

    if (!customerNameInput || !customerAddressInput) {
        showToast('⚠️ Vui lòng nhập Tên Đại Lý và Địa chỉ giao hàng trước khi đặt!');
        
        // Cuộn lên form nhập liệu
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Đổi màu viền để nhắc nhở
        if (!customerNameInput) document.getElementById('customer-name').style.borderColor = 'red';
        if (!customerAddressInput) document.getElementById('customer-address').style.borderColor = 'red';
        
        // Trả lại màu viền sau 3s
        setTimeout(() => {
            document.getElementById('customer-name').style.borderColor = '#dfe4ea';
            document.getElementById('customer-address').style.borderColor = '#dfe4ea';
        }, 3000);
        return;
    }

    // Lưu lại thông tin cho lần sau
    localStorage.setItem('thanhha_customer_name', customerNameInput);
    localStorage.setItem('thanhha_customer_address', customerAddressInput);

    const items = [];
    let total = 0;

    menuData.forEach(item => {
        if (cart[item.id] && cart[item.id] > 0) {
            items.push({ name: item.name, price: item.price, qty: cart[item.id], unit: item.unit });
            total += item.price * cart[item.id];
        }
    });

    currentOrderTotal = total;

    const orderData = {
        tableName: formattedCustomerName,
        customerName: customerNameInput,
        customerAddress: customerAddressInput,
        items: items,
        total: total,
        customerSocketId: socket.id 
    };

    socket.emit('send-order', orderData);
    
    // Hiển thị màn hình chờ
    showStatusOverlay('pending');
});

// Nghe phản hồi trạng thái từ sale
socket.on('order-status-changed', (data) => {
    console.log(`Thông báo: Đơn hàng của bạn hiện ở trạng thái: ${data.status}`);
    showStatusOverlay(data.status, data.deliveryTime);
    
    let msg = `Đơn hàng của bạn đã chuyển sang: ${getStatusText(data.status)}`;
    if (data.status === 'preparing' && data.deliveryTime) {
        msg += ` (Giao dự kiến: ${data.deliveryTime})`;
    }
    showToast(msg);
});

const getStatusText = (status) => {
    switch(status) {
        case 'pending': return 'Đang chờ xác nhận';
        case 'preparing': return 'Đang chuẩn bị giao';
        case 'READY': return 'Đang giao / Đã hoàn thành';
        default: return 'Không xác định';
    }
}

const showStatusOverlay = (status, deliveryTime = null) => {
    const overlay = document.getElementById('status-overlay');
    const icon = document.getElementById('status-icon');
    const text = document.getElementById('status-text');
    const subtext = document.getElementById('status-subtext');
    const newBtn = document.getElementById('new-order-btn');
    const qrContainer = document.getElementById('qr-container');
    const paymentOptions = document.getElementById('payment-options');
    const cashContainer = document.getElementById('cash-container');
    const deliveryContainer = document.getElementById('delivery-time-container');
    const deliveryVal = document.getElementById('delivery-time-val');

    overlay.classList.add('active');
    newBtn.style.display = 'none';
    qrContainer.style.display = 'none';
    paymentOptions.style.display = 'none';
    cashContainer.style.display = 'none';
    deliveryContainer.style.display = 'none';

    if (status === 'pending') {
        icon.innerText = '🕒';
        text.innerText = 'Đã gửi đơn hàng';
        subtext.innerText = 'Nhân viên Sale đang kiểm tra đơn hàng...';
    } else if (status === 'preparing') {
        icon.innerText = '🚚';
        text.innerText = 'Đã xác nhận đơn';
        subtext.innerText = 'Đơn hàng đang được chuẩn bị và xếp xe giao!';
        
        // Hiển thị thời gian giao dự kiến nếu có
        if (deliveryTime) {
            deliveryVal.innerText = deliveryTime;
            deliveryContainer.style.display = 'flex';
        }
    } else if (status === 'READY') {
        icon.innerText = '✨';
        text.innerText = 'Đã giao / Chờ TT';
        subtext.innerText = 'Vui lòng chọn phương thức thanh toán bên dưới:';
        newBtn.style.display = 'inline-block';
        
        // Hiển thị các nút lựa chọn phương thức thanh toán
        paymentOptions.style.display = 'block';
        
        // Chuẩn bị sẵn link VietQR cho ngân hàng BIDV
        const bankId = 'BIDV'; 
        const accountNo = '8618937888'; 
        const accountName = 'CONG TY TNHH THANH PHAT LD'; 
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${currentOrderTotal}&addInfo=Thanh toan don hang ${customerCode}&accountName=${encodeURIComponent(accountName)}`;
        document.getElementById('vietqr-img').src = qrUrl;
    }
};

document.getElementById('new-order-btn').addEventListener('click', () => {
    cart = {};
    renderMenu();
    updateCartSummary();
    document.getElementById('status-overlay').classList.remove('active');
});

// Sự kiện khi khách chọn thanh toán Tiền mặt
document.getElementById('btn-pay-cash').addEventListener('click', () => {
    document.getElementById('payment-options').style.display = 'none';
    document.getElementById('cash-container').style.display = 'block';
});

// Sự kiện khi khách chọn Chuyển khoản
document.getElementById('btn-pay-transfer').addEventListener('click', () => {
    document.getElementById('payment-options').style.display = 'none';
    document.getElementById('qr-container').style.display = 'block';
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

// Xử lý sự kiện bấm Tab lọc danh mục
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        activeCategory = e.target.getAttribute('data-category');
        renderMenu();
    });
});

// Khởi chạy
renderMenu();
