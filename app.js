import { supabase } from "./supabase-config.js";
import { getTenant } from "./tenants.js";

// State
const TENANT_SLUG = new URLSearchParams(location.search).get('tenant');

// Pemetaan brand tenant -> brand produk di DB (karena nilai brand belum
// persis sama, mis. tenant 'Tomoro' -> produk 'Tomoro Coffee').
// Ditaruh di frontend agar tabel DB tidak perlu diubah.
const TENANT_BRAND_ALIAS = {
    'tomoro': 'Tomoro Coffee',
    'fore': 'Fore Coffee',
};

// Pemetaan slug tenant -> brand outlet di outlets.json (nilainya beda
// penulisan dari brand produk), agar saran outlet hanya keluar di
// tenant yang sesuai.
const OUTLET_BRAND_BY_SLUG = {
    'janji-jiwa': 'Janji Jiwa',
    'mcd': "McDonald's",
    'tomoro': 'Tomoro',
    'kopi-kenangan': 'Kopi Kenangan',
    'fore': 'Fore Coffee',
};
let currentTenant = null;
let tenantUnavailable = false;
function cartKey() {
    return 'cart' + (TENANT_SLUG ? '_' + TENANT_SLUG : '');
}

let products = [];
let cart = JSON.parse(localStorage.getItem(cartKey())) || [];
let activeBrand = 'Semua';
let activeCategory = 'Semua';
let searchQuery = '';
let appliedVoucher = JSON.parse(localStorage.getItem('appliedVoucher')) || null;
let brandBanners = [];
let newsTickers = [];

// Elemen DOM
const productGrid = document.getElementById('productGrid');
const brandContainer = document.getElementById('brandContainer');
const categoryContainer = document.getElementById('categoryContainer');
const searchInput = document.getElementById('searchInput');
const cartSidebar = document.getElementById('cartSidebar');
const cartOpenBtn = document.getElementById('cartOpenBtn');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartFooter = document.getElementById('cartFooter');
const cartBadge = document.getElementById('cartBadge');

const cartSubtotalValue = document.getElementById('cartSubtotalValue');
const cartDiscountValue = document.getElementById('cartDiscountValue');
const voucherDiscountLabel = document.getElementById('voucherDiscountLabel');
const cartVoucher = document.getElementById('cartVoucher');
const applyVoucherBtn = document.getElementById('applyVoucherBtn');

const cartTotalValue = document.getElementById('cartTotalValue');
const custName = document.getElementById('custName');
const custOutlet = document.getElementById('custOutlet');
const custNotes = document.getElementById('custNotes');
const checkoutBtn = document.getElementById('checkoutBtn');
const btnPickup = document.getElementById('btnPickup');
const btnDelivery = document.getElementById('btnDelivery');

let orderMethod = '';
let deliveryEnabled = true;

// --- Autocomplete Outlet (data dari tabel Supabase `outlets`) ---
const outletSuggestions = document.getElementById('outletSuggestions');
let outletQueryTimer;
let outletItems = [];
let outletActiveIndex = -1;
const OUTLETS_PAGE_SIZE = 12;
let allOutlets = [];

function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderOutletSuggestions(items) {
    outletItems = items;
    outletActiveIndex = -1;
    if (!items.length) {
        outletSuggestions.innerHTML = '<li class="os-empty">Outlet tidak ditemukan</li>';
        outletSuggestions.classList.add('show');
        return;
    }
    outletSuggestions.innerHTML = items.map((o, i) => `
        <li data-index="${i}">
            <div class="os-name">${escapeHtml(o.name)}</div>
            <div class="os-brand">${escapeHtml(o.brand)}${o.address ? ' • ' + escapeHtml(o.address) : ''}</div>
        </li>
    `).join('');
    outletSuggestions.classList.add('show');
    outletSuggestions.querySelectorAll('li[data-index]').forEach(li => {
        li.addEventListener('click', () => selectOutlet(outletItems[Number(li.dataset.index)]));
    });
}

async function loadOutlets() {
    try {
        const res = await fetch('./outlets.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        allOutlets = await res.json();
    } catch (e) {
        console.error('Gagal memuat outlets.json:', e);
        allOutlets = [];
    }
}

function fetchOutletSuggestions(q) {
    const ql = q.toLowerCase();
    const outletBrand = OUTLET_BRAND_BY_SLUG[TENANT_SLUG] ?? activeBrand;
    const items = allOutlets
        .filter(o => {
            const haystack = `${o.name || ''} ${o.address || ''} ${o.brand || ''} ${o.phone || ''}`.toLowerCase();
            return haystack.includes(ql);
        })
        .filter(o => !outletBrand || o.brand === outletBrand)
        .slice(0, OUTLETS_PAGE_SIZE);
    renderOutletSuggestions(items);
}

function selectOutlet(o) {
    if (!o) return;
    custOutlet.value = o.name;
    outletSuggestions.classList.remove('show');
    updateOrderDetailsState();
    custOutlet.focus();
}

custOutlet.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    clearTimeout(outletQueryTimer);
    if (q.length < 2) { outletSuggestions.classList.remove('show'); return; }
    outletQueryTimer = setTimeout(() => fetchOutletSuggestions(q), 250);
});

custOutlet.addEventListener('focus', () => {
    const q = custOutlet.value.trim();
    if (q.length >= 2) fetchOutletSuggestions(q);
});

custOutlet.addEventListener('keydown', (e) => {
    const items = outletSuggestions.querySelectorAll('li[data-index]');
    if (!outletSuggestions.classList.contains('show') || !items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); outletActiveIndex = Math.min(outletActiveIndex + 1, items.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); outletActiveIndex = Math.max(outletActiveIndex - 1, 0); }
    else if (e.key === 'Enter' && outletActiveIndex >= 0) { e.preventDefault(); selectOutlet(outletItems[outletActiveIndex]); return; }
    else if (e.key === 'Escape') { outletSuggestions.classList.remove('show'); return; }
    items.forEach((li, i) => li.classList.toggle('active', i === outletActiveIndex));
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.outlet-autocomplete')) outletSuggestions.classList.remove('show');
});

const customAlertOverlay = document.getElementById('customAlertOverlay');
const customAlertMessage = document.getElementById('customAlertMessage');
const customAlertCloseBtn = document.getElementById('customAlertCloseBtn');

const checkoutPromptOverlay = document.getElementById('checkoutPromptOverlay');
const promptCancelBtn = document.getElementById('promptCancelBtn');
const promptSubmitBtn = document.getElementById('promptSubmitBtn');
const checkoutRequirementHint = document.getElementById('checkoutRequirementHint');

// Elemen untuk Toast Notifikasi
let toastTimeout;
const toastEl = document.createElement('div');
toastEl.setAttribute('role', 'status');
toastEl.setAttribute('aria-live', 'polite');
document.body.appendChild(toastEl);

// --- Resolusi Tenant dari URL (?tenant=slug) ---
async function resolveTenant() {
    if (!TENANT_SLUG) {
        window.location.replace('index.html');
        return;
    }

    currentTenant = await getTenant(TENANT_SLUG);
    const brandWrapper = document.getElementById('brandWrapper');
    const chip = document.getElementById('tenantChip');

    // Tenant tidak ditemukan atau disembunyikan (is_visible = false)
    if (!currentTenant || !currentTenant.is_visible) {
        tenantUnavailable = true;
        if (chip) chip.style.display = 'none';
        if (brandWrapper) brandWrapper.style.display = 'none';
        const grid = document.getElementById('productGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="tenant-unavailable">
                    <i class="fa-solid fa-store-slash"></i>
                    <p>Brand ini sedang tidak tersedia.</p>
                    <a href="index.html" class="hero-btn primary">Kembali ke Beranda</a>
                </div>`;
        }
        return;
    }

    activeBrand = TENANT_BRAND_ALIAS[TENANT_SLUG] || currentTenant.brand;
    document.title = currentTenant.name + ' - Eramel';
    document.documentElement.style.setProperty('--tenant-accent', currentTenant.accent || '#1B62F1');

    if (chip) {
        chip.textContent = currentTenant.name;
        chip.style.display = 'inline-flex';
    }
    if (brandWrapper) brandWrapper.style.display = 'none';
}

// --- Inisialisasi Aplikasi ---
async function init() {
    renderSkeleton(6);
    await resolveTenant();
    if (tenantUnavailable) return;
    updateCartUI();
    await Promise.all([
        fetchSettings(),
        fetchProducts(),
        fetchBrandBanners(),
        fetchNewsTickers(),
        loadOutlets()
    ]);
    renderBrandFilter();
    renderCategoryFilter();
    renderProducts();
    updateBrandBanner();
    renderTicker(newsTickers);
}

// Event Listener Pencarian
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderProducts();
});

// Format Rupiah (Titik sebagai pemisah ribuan)
function formatRupiah(price) {
    return 'Rp ' + price.toLocaleString('id-ID');
}

function getUniqueBrands(products) {
    return ['Semua', ...new Set(products.map(p => p.brand).filter(Boolean))];
}

function getUniqueCategories(products, activeBrand) {
    const filtered = activeBrand === 'Semua' 
        ? products 
        : products.filter(p => p.brand === activeBrand);
    return ['Semua', ...new Set(filtered.map(p => p.category).filter(Boolean))];
}

// --- Ambil Data dari Supabase ---
async function fetchSettings() {
    try {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        const deliverySetting = data.find(s => s.key === 'delivery_method_enabled');
        if (deliverySetting) {
            deliveryEnabled = (deliverySetting.value === 'true' || deliverySetting.value === true);
        }

        if (!deliveryEnabled && btnDelivery) {
            btnDelivery.style.display = 'none';
        } else if (btnDelivery) {
            btnDelivery.style.display = 'inline-block';
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
}

async function fetchProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_hidden', false)
            .order('brand')
            .order('category');

        if (error) throw error;
        products = data || [];
    } catch (error) {
        console.error('Error fetching data:', error);
        productGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Gagal memuat produk. Silakan coba lagi nanti.</p>';
    }
}

async function fetchBrandBanners() {
    try {
        const { data, error } = await supabase
            .from('brand_banners')
            .select('*')
            .eq('is_active', true);
        if (!error) brandBanners = data || [];
    } catch (error) { console.error('Error fetching brand banners:', error); }
}

async function fetchNewsTickers() {
    try {
        const { data, error } = await supabase
            .from('news_ticker')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');
        if (!error) newsTickers = data || [];
    } catch (error) { console.error('Error fetching news tickers:', error); }
}

// --- Logika Filter Level 1 (Brand) ---
function renderBrandFilter() {
    const brandsList = getUniqueBrands(products);
    brandContainer.innerHTML = brandsList.map(brand => `
        <button class="category-btn ${activeBrand === brand ? 'active' : ''}" data-brand="${brand}">
            ${brand}
        </button>
    `).join('');

    brandContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeBrand = e.target.dataset.brand;
            activeCategory = 'Semua'; // Reset kategori setiap ganti brand
            renderBrandFilter();
            renderCategoryFilter();
            renderProducts();
            updateBrandBanner();
        });
    });
}

// --- Logika Filter Level 2 (Kategori) ---
function renderCategoryFilter() {
    const categoriesList = getUniqueCategories(products, activeBrand);

    categoryContainer.innerHTML = categoriesList.map(cat => `
        <button class="category-btn ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">
            ${cat}
        </button>
    `).join('');

    categoryContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeCategory = e.target.dataset.category;
            renderCategoryFilter();
            renderProducts();
        });
    });
}

// --- Render Grid Produk & Loading Skeleton ---
function renderSkeleton(count) {
    productGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        productGrid.innerHTML += `
            <div class="skeleton-card">
                <div class="skeleton-img skeleton"></div>
                <div class="skeleton-info">
                    <div class="skeleton-text short skeleton" style="margin-bottom: 0.5rem; height: 1.5rem; border-radius: 20px;"></div>
                    <div class="skeleton-text skeleton" style="margin-bottom: 0.5rem"></div>
                    <div class="skeleton-text skeleton" style="width: 40%; margin-bottom: 1.5rem"></div>
                    <div class="skeleton-text desc skeleton" style="margin-bottom: 1.25rem;"></div>
                    <div class="skeleton-btn skeleton"></div>
                </div>
            </div>
        `;
    }
}
const reveals = document.querySelectorAll('.reveal');

function revealOnScroll(){

    reveals.forEach(el=>{

        const top = el.getBoundingClientRect().top;

        if(top < window.innerHeight - 100){
            el.classList.add('active');
        }

    });
}

window.addEventListener('scroll', revealOnScroll);
revealOnScroll();


function renderProducts() {
    // Filter di sisi Client
    let filtered = products;
    if (activeBrand !== 'Semua') filtered = filtered.filter(p => p.brand === activeBrand);
    if (activeCategory !== 'Semua') filtered = filtered.filter(p => p.category === activeCategory);
    if (searchQuery !== '') filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));

    if (filtered.length === 0) {
        productGrid.innerHTML = `
    <div style="text-align:center; grid-column:1/-1; color: var(--text-muted); line-height: 2;">
        <p>Menu tidak ditemukan. Mau request brand lain?</p>
        <a 
            href="https://wa.me/62881080611461?text=Halo%20MinMel%2C%20saya%20mau%20tanya%20menu%20dong!" 
            target="_blank"
            style="
                color: #ffffff;
                font-weight: 600;
                text-shadow: 0 0 8px rgba(255,255,255,0.8), 0 0 20px rgba(27,98,241,0.5);
                text-decoration: none;
                border-bottom: 1px solid rgba(255,255,255,0.3);
                padding-bottom: 1px;
                transition: text-shadow 0.3s ease;
            "
            onmouseover="this.style.textShadow='0 0 12px rgba(255,255,255,1), 0 0 30px rgba(27,98,241,0.8)'"
            onmouseout="this.style.textShadow='0 0 8px rgba(255,255,255,0.8), 0 0 20px rgba(27,98,241,0.5)'"
        >Chat MinMel</a>
    </div>
`;
        return;
    }

    productGrid.innerHTML = filtered.map(p => `
        <article class="product-card" aria-label="${escapeHtml(p.name)}">
            <img src="${p.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${escapeHtml(p.name)}" class="product-img" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">
            <div class="product-info">
                <span class="badge">${escapeHtml(p.category)}</span>
                <h3 class="product-name">${escapeHtml(p.name)}</h3>
                <p class="cart-item-brand">${escapeHtml(p.brand)}</p>
                <div style="flex-grow: 1;"></div>
                <p class="product-price">${formatRupiah(p.price)}</p>
                <button class="btn-gradient add-cart-btn" data-id="${p.id}">Add to Cart</button>
            </div>
        </article>
    `).join('');

    document.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => addToCart(e.currentTarget.dataset.id, e));
    });
}

function updateBrandBanner() {
    const bannerEl = document.getElementById('brandBanner');
    const textEl = document.getElementById('brandBannerText');
    if (!bannerEl || !textEl) return;

    if (activeBrand === 'Semua') {
        bannerEl.classList.remove('show');
        setTimeout(() => {
            if (!bannerEl.classList.contains('show')) bannerEl.style.display = 'none';
        }, 300);
        return;
    }

    const banner = brandBanners.find(b => b.brand === activeBrand);
    if (banner) {
        textEl.textContent = banner.message;
        bannerEl.style.display = 'flex';
        void bannerEl.offsetWidth; // Trigger reflow agar animasi jalan
        bannerEl.classList.add('show');
    } else {
        bannerEl.classList.remove('show');
        setTimeout(() => {
            if (!bannerEl.classList.contains('show')) bannerEl.style.display = 'none';
        }, 300);
    }
}

function renderTicker(tickers) {
    const tickerEl = document.getElementById('newsTicker');
    const tickerContent = document.getElementById('tickerContent');
    
    if (!tickers || tickers.length === 0) {
        tickerEl.style.display = 'none';
        return;
    }

    tickerEl.style.display = 'flex';

    const singleLoop = tickers.map(t => t.message).join(' • ') + ' • ';
    const repeatedCount = Math.max(10, Math.ceil(150 / Math.max(1, singleLoop.length)));
    const repeated = singleLoop.repeat(repeatedCount);

    tickerContent.innerHTML =
        '<span class="ticker-text">' + repeated + '</span>' +
        '<span class="ticker-text">' + repeated + '</span>';

    // Terapkan durasi animasi ke container pembungkusnya
    const duration = repeated.length * 0.15;
    tickerContent.style.animationDuration = duration + 's';
}

// --- Fungsi Keranjang (Cart) ---
function addToCart(productId, event) {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    const existing = cart.find(item => item.id == productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem(cartKey(), JSON.stringify(cart));
    updateCartUI();
    
    // 1. Munculkan Toast Notifikasi
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 1500);

    // 2. Animasi fly to cart (Titik terbang ke ikon)
    if (event) {
        const btn = event.currentTarget;
        const btnRect = btn.getBoundingClientRect();
        const cartRect = cartOpenBtn.getBoundingClientRect();

        const startX = btnRect.left + (btnRect.width / 2);
        const startY = btnRect.top + (btnRect.height / 2);
        const endX = cartRect.left + (cartRect.width / 2);
        const endY = cartRect.top + (cartRect.height / 2);

        const dot = document.createElement('div');
        dot.className = 'fly-dot';
        dot.style.left = `${startX - 6}px`;
        dot.style.top = `${startY - 6}px`;
        document.body.appendChild(dot);

        dot.getBoundingClientRect(); // Trigger browser reflow
        dot.style.transform = `translate(${endX - startX}px, ${endY - startY}px)`;
        dot.style.opacity = '0.5';

        setTimeout(() => {
            dot.remove();
            cartBadge.classList.remove('badge-bounce');
            void cartBadge.offsetWidth; // Trigger browser reflow untuk reset animasi
            cartBadge.classList.add('badge-bounce');
        }, 600);
    }
}

function validateCheckout() {
    if (cart.length > 0) {
        checkoutBtn.disabled = false;
    } else {
        checkoutBtn.disabled = true;
    }
}

function updateOrderDetailsState() {
    const missingFields = [];
    if (!orderMethod) missingFields.push('metode pesanan');
    if (!custName.value.trim()) missingFields.push('nama');
    if (!custOutlet.value.trim()) missingFields.push('outlet');

    const isComplete = missingFields.length === 0;
    const missingFieldText = missingFields.length > 1
        ? `${missingFields.slice(0, -1).join(', ')} dan ${missingFields[missingFields.length - 1]}`
        : missingFields[0];
    promptSubmitBtn.disabled = !isComplete;
    promptSubmitBtn.setAttribute('aria-disabled', String(!isComplete));
    checkoutRequirementHint.classList.toggle('ready', isComplete);
    checkoutRequirementHint.textContent = isComplete
        ? 'Pesanan siap dikirim.'
        : `Lengkapi ${missingFieldText} untuk melanjutkan.`;
}

custName.addEventListener('input', updateOrderDetailsState);
custOutlet.addEventListener('input', updateOrderDetailsState);

btnPickup.addEventListener('click', () => {
    orderMethod = 'Pickup';
    btnPickup.classList.add('active');
    btnDelivery.classList.remove('active');
    btnPickup.setAttribute('aria-pressed', 'true');
    btnDelivery.setAttribute('aria-pressed', 'false');
    updateOrderDetailsState();
});

btnDelivery.addEventListener('click', () => {
    if (!deliveryEnabled) return;
    orderMethod = 'Delivery';
    btnDelivery.classList.add('active');
    btnPickup.classList.remove('active');
    btnDelivery.setAttribute('aria-pressed', 'true');
    btnPickup.setAttribute('aria-pressed', 'false');
    updateOrderDetailsState();
});

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.textContent = totalItems;
    cartOpenBtn.classList.toggle('has-items', totalItems > 0);

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart"><i class="fa-solid fa-basket-shopping fa-3x" style="margin-bottom:1rem; opacity:0.4;"></i><p>Keranjang masih kosong</p><small style="color:var(--text-muted);">Tambah produk dari katalog untuk mulai pesan</small></div>';
        cartFooter.style.display = 'none';
        validateCheckout();
        return;
    }
    cartFooter.style.display = 'block';

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-brand">${item.brand}</div>
                <div class="cart-item-price">${formatRupiah(item.price)}</div>
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="updateQty('${item.id}', -1)"><i class="fa-solid fa-minus" style="font-size:0.6rem"></i></button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', 1)"><i class="fa-solid fa-plus" style="font-size:0.6rem"></i></button>
                </div>
            </div>
            <button class="remove-btn" onclick="updateQty('${item.id}', -999)"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountPercent = appliedVoucher ? appliedVoucher.discount_percent : 0;
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    const total = subtotal - discountAmount;

    cartSubtotalValue.textContent = formatRupiah(subtotal);
    voucherDiscountLabel.textContent = discountPercent + '%';
    cartDiscountValue.textContent = '- ' + formatRupiah(discountAmount);
    cartTotalValue.textContent = formatRupiah(total);
    
    if (appliedVoucher) {
        cartVoucher.value = appliedVoucher.code;
    }

    validateCheckout();
}

// Fungsi Keranjang yang Dipanggil Melalui Inline Onclick
window.updateQty = (id, delta) => {
    const item = cart.find(i => i.id == id);
    if (item) item.qty += delta;
    cart = cart.filter(i => i.qty > 0);
    localStorage.setItem(cartKey(), JSON.stringify(cart));
    updateCartUI();
};

// Buka/Tutup Keranjang
function toggleCart(state) {
    if (state === true) {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    } else if (state === false) {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    } else {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
    }
}

cartOpenBtn.addEventListener('click', () => toggleCart());
document.getElementById('cartCloseBtn').addEventListener('click', () => toggleCart(false));
cartOverlay.addEventListener('click', () => toggleCart(false));

// --- Custom Alert Modal Logic ---
function showCustomAlert(message) {
    customAlertMessage.textContent = message;
    customAlertOverlay.classList.add('show');
}

customAlertCloseBtn.addEventListener('click', () => {
    customAlertOverlay.classList.remove('show');
});

// --- Checkout Prompt Logic ---
promptCancelBtn.addEventListener('click', () => {
    checkoutPromptOverlay.classList.remove('show');
});

checkoutBtn.addEventListener('click', () => {
    updateOrderDetailsState();
    checkoutPromptOverlay.classList.add('show');
});

// --- Voucher Apply Logic ---
applyVoucherBtn.addEventListener('click', async () => {
    const code = cartVoucher.value.trim().toUpperCase();
    
    if (!code) {
        appliedVoucher = null;
        localStorage.removeItem('appliedVoucher');
        updateCartUI();
        showCustomAlert("Voucher dilepas.");
        return;
    }

    applyVoucherBtn.disabled = true;
    applyVoucherBtn.textContent = '...';

    try {
        let { data, error } = await supabase
            .rpc('validate_voucher', { voucher_code: code })
            .maybeSingle();

        // Kompatibilitas sementara sebelum security-hardening.sql dijalankan.
        // Setelah migrasi aktif, akses anon ke tabel vouchers akan ditolak.
        if (error && error.code === 'PGRST202') {
            ({ data, error } = await supabase
                .from('vouchers')
                .select('code, discount_percent, is_active')
                .eq('code', code)
                .single());
        }

        if (error || !data) {
            showCustomAlert("Voucher tidak ditemukan atau tidak valid.");
            appliedVoucher = null;
            localStorage.removeItem('appliedVoucher');
        } else {
            showCustomAlert("Voucher berhasil digunakan!");
            appliedVoucher = {
                code: data.code,
                discount_percent: data.discount_percent
            };
            localStorage.setItem('appliedVoucher', JSON.stringify(appliedVoucher));
        }
    } catch (err) {
        showCustomAlert("Terjadi kesalahan sistem saat mengecek voucher.");
    } finally {
        updateCartUI();
        applyVoucherBtn.disabled = false;
        applyVoucherBtn.textContent = 'Terapkan';
    }
});

// --- Checkout via WhatsApp ---
promptSubmitBtn.addEventListener('click', async () => {
    const phone = "62881080611461";
    
    const nameVal = custName.value.trim();
    const outletVal = custOutlet.value.trim();

    if (!orderMethod) {
        showCustomAlert("Mohon pilih Metode Pesanan (Pickup/Delivery).");
        return;
    }

    if (!nameVal || !outletVal) {
        showCustomAlert("Mohon isi Nama dan Outlet untuk melanjutkan pesanan.");
        return;
    }
    
        // Re-validasi voucher saat checkout
    if (appliedVoucher) {
        let { data: voucherCheck, error: voucherError } = await supabase
            .rpc('validate_voucher', { voucher_code: appliedVoucher.code })
            .maybeSingle();

        if (voucherError && voucherError.code === 'PGRST202') {
            const fallbackResult = await supabase
                .from('vouchers')
                .select('code')
                .eq('code', appliedVoucher.code)
                .eq('is_active', true)
                .maybeSingle();
            voucherCheck = fallbackResult.data;
        }

        if (!voucherCheck) {
            showCustomAlert('Voucher ' + appliedVoucher.code + ' sudah tidak aktif. Pesanan dilanjutkan tanpa diskon.');
            appliedVoucher = null;
            // reset tampilan diskon
            document.getElementById('voucherDiscountLabel').textContent = '0%';
            document.getElementById('cartDiscountValue').textContent = '- Rp 0';
            updateCartUI();
            return; // stop, biarkan user review ulang sebelum pesan
        }
    }

    let message = 'Halo! Saya ingin memesan:\n\n';
    
    cart.forEach((item, index) => {
        const subtotal = Math.round(item.price * item.qty);
        message += (index + 1) + '. ' + item.name + ' (' + item.brand + ') x' + item.qty + ' = Rp ' + subtotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\n';
    });

    const subtotalCalc = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmountCalc = appliedVoucher ? Math.round(subtotalCalc * (appliedVoucher.discount_percent / 100)) : 0;
    const finalTotal = subtotalCalc - discountAmountCalc;

    message += '\nSubtotal: Rp ' + Math.round(subtotalCalc).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\n';
    
    if (appliedVoucher) {
        message += 'Voucher: ' + appliedVoucher.code + '\n';
        message += 'Diskon: ' + appliedVoucher.discount_percent + '%\n';
        message += 'Potongan: - Rp ' + Math.round(discountAmountCalc).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\n';
        message += 'Total Setelah Diskon: Rp ' + Math.round(finalTotal).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\n\n';
    } else {
        message += 'Total: Rp ' + Math.round(finalTotal).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\n\n';
    }

    message += 'Nama: ' + nameVal + '\n';
    message += 'Outlet: ' + outletVal + '\n';
    message += 'Metode: ' + orderMethod + '\n';
    message += 'Notes: ' + (custNotes.value.trim() || '-');

    const waLink = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
    
    // Menggunakan window.location.href di perangkat mobile agar tidak diblokir oleh popup blocker
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        window.location.href = waLink;
    } else {
        window.open(waLink, '_blank');
    }

    custName.value = '';
    custOutlet.value = '';
    custNotes.value = '';
    cartVoucher.value = '';
    appliedVoucher = null;
    localStorage.removeItem('appliedVoucher');
    orderMethod = '';
    btnPickup.classList.remove('active');
    btnDelivery.classList.remove('active');
    btnPickup.setAttribute('aria-pressed', 'false');
    btnDelivery.setAttribute('aria-pressed', 'false');
    updateOrderDetailsState();

    checkoutPromptOverlay.classList.remove('show');

    cart = [];
    localStorage.setItem(cartKey(), JSON.stringify(cart));
    validateCheckout();
    updateCartUI();
});

// --- Jalankan Script ---
init();
