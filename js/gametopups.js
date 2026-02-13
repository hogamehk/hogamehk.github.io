// ========== Firebase 初始化 ==========
const firebaseConfig = {
  apiKey: "AIzaSyBycq_jVc6qJj24RR8d_OWfe_EPstfWF_o",
  authDomain: "uiduid-shop.firebaseapp.com",
  projectId: "uiduid-shop",
  storageBucket: "uiduid-shop.firebasestorage.app",
  messagingSenderId: "182307661971",
  appId: "1:182307661971:web:2d558690ca35e537498566",
  measurementId: "G-8QVTN6CE7D"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allProducts = [];

// ========== 渲染商品卡片 ==========
function renderCards(data) {
  const container = document.getElementById('cardsGrid');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">找不到商品</p>';
    return;
  }

  container.innerHTML = '';
  data.forEach(card => {
    const name = card.name || '未知商品';
    const image = card.image || 'images/placeholder-card.png';
    const hot = card.hot === true;

    const el = document.createElement('div');
    el.className = 'card-item';

    let badgeHTML = '';
    if (hot) {
      badgeHTML = '<div class="hot-badge">熱銷</div>';
    }

    // ✅ 修正：移除多餘空格，補齊引號
    el.innerHTML = `
      <div class="card-image">
        <img 
          src="${image}" 
          alt="${name}"
          loading="lazy"
          onerror="this.onerror=null; this.src='images/placeholder-card.png';"
        />
      </div>
      <div class="card-info">
        <span class="card-name">${name}</span>
      </div>
      ${badgeHTML}
    `;
    
    el.addEventListener('click', () => {
      let url = 'product-detail.html?id=' + (card.id || 'unknown');
      if (card.detailPage) {
        url = card.detailPage;
      }
      window.location.href = url;
    });
    
    container.appendChild(el);
  });
}

// ========== 載入商品 ==========
async function loadProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "game_topups"));
    console.log(`✅ 成功載入 ${querySnapshot.size} 筆商品`);
    allProducts = [];
    querySnapshot.forEach(doc => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });
    allProducts.sort((a, b) => (a.order || 999) - (b.order || 999));
    renderCards(allProducts);
  } catch (error) {
    console.error("❌ 讀取商品失敗:", error);
    const container = document.getElementById('cardsGrid');
    if (container) {
      container.innerHTML = 
        '<p style="text-align:center; padding:20px; color:red;">載入失敗，請檢查網路或稍後再試</p>';
    }
  }
}

// ========== 搜尋與篩選 ==========
function filterCards() {
  const keyword = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const region = document.getElementById('regionFilter')?.value || '';

  const filtered = allProducts.filter(card => {
    const matchName = (card.name || '').toLowerCase().includes(keyword);
    const matchRegion = !region || card.region === region;
    return matchName && matchRegion;
  });

  renderCards(filtered);
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  const searchInput = document.getElementById('searchInput');
  const regionFilter = document.getElementById('regionFilter');

  if (searchInput) {
    searchInput.addEventListener('input', filterCards);
  }
  if (regionFilter) {
    regionFilter.addEventListener('change', filterCards);
  }

  // 回到頂部按鈕
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 300);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});