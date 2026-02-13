// ========== 首頁熱賣區鏈接 ==========
const productRoutes = {
    'mycard': 'mycard.html',
    'steam': 'hksteam.html',
    'psn': 'hkpsn.html',
    '日本 iTunes Gift Card': 'jpitunes.html',
    '王者榮燿': 'wzry.html',
    'Ro仙境傳說世界之旅': 'rosjzl.html',
    '燕雲十六聲': 'wherewindsmeetgame.html',
    '傳説對決': 'garena.html',
};

// 商品卡片點擊跳轉（依順序對應）
const productCards = document.querySelectorAll('.product-card');
productCards.forEach((card) => {
    card.addEventListener('click', function () {
        let key = card.getAttribute('data-key');
        if (key && productRoutes[key]) {
            window.location.href = productRoutes[key];
        } else if (key) {
            window.location.href = key + '.html';
        }
    });
});

// 如果在 HTML 中给 `.product-card` 添加了 `data-img`，则替换默认表情为图片
productCards.forEach((card) => {
    const imgPath = card.dataset.img; // e.g. data-img="images/mycard.jpg"
    if (imgPath) {
        const imgContainer = card.querySelector('.product-card-img');
        if (imgContainer) {
            imgContainer.innerHTML = '';
            const imgEl = document.createElement('img');
            imgEl.src = imgPath;
            imgEl.alt = card.querySelector('.product-card-name')?.textContent || '';
            imgEl.loading = 'lazy';
            imgContainer.appendChild(imgEl);
        }
    }
});

// 側邊欄開關
const menuBtn = document.querySelector('.menu-btn');
const sidebar = document.querySelector('.sidebar');
const overlay = document.createElement('div');
overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 999; display: none;
`;
document.body.appendChild(overlay);

menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.style.display = 'block';
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.style.display = 'none';
});

// 輪播圖邏輯（支援 3 張圖）
let currentSlide = 0;
const carouselInner = document.querySelector('.carousel-inner');
const indicators = document.querySelectorAll('.carousel-indicator');
const totalSlides = 3;

function updateCarousel() {
    const percent = (currentSlide * 100) / totalSlides; 
    carouselInner.style.transform = `translateX(-${percent}%)`;
    indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === currentSlide);
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
}

let slideInterval = setInterval(nextSlide, 4000);

indicators.forEach((ind, i) => {
    ind.addEventListener('click', () => {
        clearInterval(slideInterval);
        currentSlide = i;
        updateCarousel();
        slideInterval = setInterval(nextSlide, 4000);
    });
});

// 回到頂部
const backToTop = document.querySelector('.back-to-top');
window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 300);
});
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 支付彈窗觸發（攔截 payment.html）
const paymentLink = document.getElementById('payment-link');
const modalOverlay = document.querySelector('.modal-overlay');
const closeModal = document.querySelector('.close-modal');

paymentLink.addEventListener('click', (e) => {
    e.preventDefault();
    modalOverlay.classList.add('show');
});

closeModal.addEventListener('click', () => {
    modalOverlay.classList.remove('show');
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('show');
    }
});

// ========== 商品資料庫 ==========
const allProducts = [
    { id: '香港MyCard', name: 'MyCard', desc: '適用於香港MyCard合作遊戲，官方正品', link: 'mycard.html' },
    { id: '英雄聯盟', name: '英雄聯盟', desc: '適用於英雄聯盟遊戲，官方正品', link: 'yxlm.html' },
    { id: 'steam', name: 'Steam 充值卡', desc: '全球通用，支援多幣別，即時發碼', link: 'hkteam.html' },
    { id: 'psn', name: 'PSN日本兌換碼1000點', desc: 'PlayStation Network日服專用，官方正版卡密', link: 'hkpsn.html' },
    { id: '日本DMM Point Code', name: '日本DMM兌換碼（序號）', desc: '適用於 DMM.com 平台，可用於遊戲、影片、電子書等數位內容購買戲付款後會收到10位或16位數字/字母的兌換碼前往DMM官方網站，登入你的日本DMM帳號在儲值頁面，找到輸入框（10位或16位）即可充值完成', link: 'dmm.html' },
    { id: 'Ro仙境傳說世界之旅', name: 'Ro仙境傳說世界之旅', desc: 'Ro仙境傳說世界之旅官方Mycard大額扣點，秒充到賬，支持所有伺服器', link: 'rosjzl.html' },
    { id: '王者榮耀', name: '王者榮耀點券', desc: '秒充到賬，官方充值，支持所有伺服器', link: 'wzry.html' },
    { id: '貝殼幣Garena', name: '貝殼幣Garena', desc: '秒充到賬，官方充值，支持所有伺服器', link: 'garena.html' },
    { id: 'roblox', name: 'roblox', desc: '官方卡密，全球通用，支持所有roblox賬戶', link: 'roblox.html' },
    { id: '香港iTunes Gift Card ', name: '香港iTunes Gift Card', desc: '適用於香港 Apple ID，可用於 App Store、iTunes、Apple Music 等服務', link: 'hkitunes.html' },
    { id: '日本BitCash點卡 ', name: '日本BitCash點卡', desc: '適用於日本BitCash點卡充值服務', link: 'bitcash.html' },
    { id: '日本任天堂ホームページ ', name: '日本任天堂Nintendo Switch', desc: '適用於日本任天堂ホームページ點卡充值服務', link: 'jpnintendo.html' },
    { id: 'aion2', name: 'aion2 / 永恆之塔', desc: '秒充到賬，穩定可靠，支持所有伺服器', link: 'aion2.html' },
    { id: 'GASH卡', name: 'GASH卡', desc: '秒充到賬，穩定可靠，支持所有伺服器', link: 'gash.html' },
    { id: '日本 iTunes Gift Card', name: '日本 iTunes Gift Card', desc: '官方卡密，穩定可靠，支持所有appleid戶口', link: 'jpitunes.html' },
    { id: '中國 iTunes Gift Card', name: '中國 iTunes Gift Card', desc: '官方卡密，穩定可靠，支持所有中國appleid戶口', link: 'cnitunes.html' },
    { id: 'SEGA 新創造球會 2026', name: 'SEGA 新創造球會 2026', desc: '官方渠道，超值優惠，支持所有玩家賬戶儲值', link: 'SEGAFootballClubChampions2026.html' },
    { id: '寒霜啟示錄 Whiteout Survival', name: '寒霜啟示錄 Whiteout Survival', desc: '官方渠道，超值優惠，支持所有玩家賬戶儲值', link: 'WhiteoutSurvival.html' },
    { id: '傳説對決', name: '傳説對決', desc: '官方渠道，超值優惠，支持所有玩家賬戶儲值', link: 'garena.html' },
    { id: 'honkai-100', name: '崩壞：星穹鐵道 100星瓊', desc: '秒充到賬，穩定可靠，支持所有伺服器', link: 'product-detail.html' },
];

// ========== 搜尋功能（全新下拉式）==========
const searchInput = document.querySelector('.search-input');
const searchDropdown = document.getElementById('searchDropdown');

// 點擊其他地方關閉下拉
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('show');
    }
});

// 搜尋邏輯
searchInput.addEventListener('input', function () {
    const keyword = this.value.trim().toLowerCase();
    
    if (keyword === '') {
        searchDropdown.classList.remove('show');
        return;
    }

    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.desc.toLowerCase().includes(keyword)
    );

    if (filtered.length > 0) {
        searchDropdown.innerHTML = filtered
            .map(p => 
                `<a href="${p.link}" class="search-result-item">${p.name}</a>`
            )
            .join('');
        searchDropdown.classList.add('show');
    } else {
        searchDropdown.innerHTML = '<div class="search-result-item" style="color:#999;text-align:center;">無相關商品</div>';
        searchDropdown.classList.add('show');
    }
});

// Enter 鍵跳轉第一個結果
searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const firstLink = searchDropdown.querySelector('.search-result-item');
        if (firstLink && firstLink.tagName === 'A') {
            window.location.href = firstLink.href;
        }
    }
});

// ========== 登入/註冊功能 ==========
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginClose = document.getElementById('loginClose');
const registerClose = document.getElementById('registerClose');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// 打開登入彈窗
loginBtn.addEventListener('click', () => {
    loginModal.classList.add('show');
});

// 打開註冊彈窗
registerBtn.addEventListener('click', () => {
    registerModal.classList.add('show');
});

// 關閉登入彈窗
loginClose.addEventListener('click', () => {
    loginModal.classList.remove('show');
});

// 關閉註冊彈窗
registerClose.addEventListener('click', () => {
    registerModal.classList.remove('show');
});

// 切換到註冊
switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('show');
    registerModal.classList.add('show');
});

// 切換到登入
switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.classList.remove('show');
    loginModal.classList.add('show');
});

// 點擊彈窗外部關閉
loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('show');
    }
});

registerModal.addEventListener('click', (e) => {
    if (e.target === registerModal) {
        registerModal.classList.remove('show');
    }
});

// 登入表單提交
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // 這裡可以添加實際的登入邏輯（例如 Firebase Authentication）
    console.log('登入:', { email, password });
    alert('登入成功！\n郵箱：' + email);
    loginModal.classList.remove('show');
    loginForm.reset();
});

// 註冊表單提交
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerPasswordConfirm').value;
    
    // 驗證密碼
    if (password !== confirmPassword) {
        alert('兩次輸入的密碼不一致，請重新輸入！');
        return;
    }
    
    if (password.length < 6) {
        alert('密碼長度至少需要6位！');
        return;
    }
    
    // 這裡可以添加實際的註冊邏輯（例如 Firebase Authentication）
    console.log('註冊:', { email, password });
    alert('註冊成功！\n郵箱：' + email);
    registerModal.classList.remove('show');
    registerForm.reset();
});