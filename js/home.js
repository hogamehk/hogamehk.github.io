// ========== 首頁初始化 ==========
async function initHomepage() {
  try {
    // 同時載入 cards.json 與 games.json（結構需一致）
    const [cardsRes, gamesRes, carouselRes] = await Promise.all([
      fetch('/data/cards.json'),
      fetch('/data/games.json'),
      fetch('/data/carousel.json')
    ]);

    if (!cardsRes.ok || !gamesRes.ok || !carouselRes.ok) {
      console.warn('⚠️ 某些 JSON 檔案載入失敗，但繼續執行');
    }

    // 解析 JSON，若失敗則設為空陣列（避免整個崩潰）
    const cards = cardsRes.ok ? await cardsRes.json() : [];
    const games = gamesRes.ok ? await gamesRes.json() : [];
    const carouselItems = carouselRes.ok ? await carouselRes.json() : [];

    // 合併所有商品（順序：點卡在前，遊戲在後）
    const allSearchItems = [...cards, ...games];

    // 初始化功能
    setupSearch(allSearchItems);
    renderCarousel(carouselItems);
  } catch (error) {
    console.error('❌ 首頁初始化發生錯誤:', error);
  }
}

// ========== 搜尋功能 ==========
function setupSearch(items) {
  const searchInput = document.querySelector('.search-input');
  const searchDropdown = document.getElementById('searchDropdown');
  if (!searchInput || !searchDropdown) return;

  // 點擊外部關閉下拉
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.remove('show');
    }
  });

  // 輸入搜尋
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();
    if (keyword === '') {
      searchDropdown.classList.remove('show');
      return;
    }

    const filtered = items.filter(item =>
      (typeof item.name === 'string' && item.name.toLowerCase().includes(keyword)) ||
      (typeof item.desc === 'string' && item.desc.toLowerCase().includes(keyword))
    );

    if (filtered.length > 0) {
      searchDropdown.innerHTML = filtered
        .map(item => `<a href="${item.link}" class="search-result-item">${item.name}</a>`)
        .join('');
    } else {
      searchDropdown.innerHTML = '<div class="search-result-item" style="color:#999;text-align:center;">無相關商品</div>';
    }
    searchDropdown.classList.add('show');
  });

  // Enter 鍵跳轉
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const firstLink = searchDropdown.querySelector('a.search-result-item');
      if (firstLink) {
        window.location.href = firstLink.href;
      }
    }
  });
}

// ========== 輪播圖 ==========
function renderCarousel(images) {
  const inner = document.getElementById('carouselInner');
  const indicators = document.getElementById('carouselIndicators');
  if (!inner || !indicators) return;

  // 按 order 排序（若無 order 則按原始順序）
  images.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  inner.innerHTML = images.map((img, i) =>
    `<div class="carousel-item${i === 0 ? ' active' : ''}">
      <img src="${img.imageUrl}" alt="${img.alt || ''}" loading="lazy"
           onerror="this.src='images/placeholder-banner.jpg';">
    </div>`
  ).join('');

  indicators.innerHTML = images.map((_, i) =>
    `<div class="carousel-indicator${i === 0 ? ' active' : ''}"></div>`
  ).join();

  // 自動輪播邏輯
  let currentIndex = 0;
  const items = inner.querySelectorAll('.carousel-item');
  const dots = indicators.querySelectorAll('.carousel-indicator');

  function showSlide(index) {
    items.forEach(item => item.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    items[index].classList.add('active');
    dots[index].classList.add('active');
    currentIndex = index;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => showSlide(i));
  });

  // 每 5 秒自動切換
  if (items.length > 1) {
    setInterval(() => {
      const next = (currentIndex + 1) % items.length;
      showSlide(next);
    }, 5000);
  }
}

// ========== 啟動 ==========
document.addEventListener('DOMContentLoaded', initHomepage);