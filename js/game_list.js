let allProducts = [];

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
    const link = card.link || '#';

    const el = document.createElement('a');
    el.href = link;
    el.target = '_blank';
    el.className = 'card-item';

    let badgeHTML = hot ? '<div class="hot-badge">熱銷</div>' : '';

    el.innerHTML = `
      <div class="card-image">
        <img src="${image}" alt="${name}" loading="lazy"
             onerror="this.onerror=null; this.src='images/placeholder-card.png';" />
      </div>
      <div class="card-info"><span class="card-name">${name}</span></div>
      ${badgeHTML}
    `;
    container.appendChild(el);
  });
}

async function loadProducts() {
  const container = document.getElementById('cardsGrid');
  try {
    const res = await fetch('/data/games.json');
    if (!res.ok) throw new Error('載入失敗');
    allProducts = await res.json();
    allProducts.sort((a, b) => (a.order || 0) - (b.order || 0));
    renderCards(allProducts);
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="text-align:center; color:red; padding:20px;">商品載入失敗</p>';
  }
}

function filterCards() {
  const keyword = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const region = document.getElementById('regionFilter')?.value || '';
  const filtered = allProducts.filter(c =>
    (c.name?.toLowerCase().includes(keyword)) && (!region || c.region === region)
  );
  renderCards(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  document.getElementById('searchInput')?.addEventListener('input', filterCards);
  document.getElementById('regionFilter')?.addEventListener('change', filterCards);

  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('show', window.scrollY > 300);
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
});