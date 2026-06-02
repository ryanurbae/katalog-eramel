import { supabase } from "./supabase-config.js";

// State
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let activeBrand = 'Semua';
let activeCategory = 'Semua';
let searchQuery = '';

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
const cartTotalValue = document.getElementById('cartTotalValue');
const custName = document.getElementById('custName');
const custOutlet = document.getElementById('custOutlet');
const custNotes = document.getElementById('custNotes');
const checkoutBtn = document.getElementById('checkoutBtn');
const customAlertOverlay = document.getElementById('customAlertOverlay');
const customAlertMessage = document.getElementById('customAlertMessage');
const customAlertCloseBtn = document.getElementById('customAlertCloseBtn');

const checkoutPromptOverlay = document.getElementById('checkoutPromptOverlay');
const promptName = document.getElementById('promptName');
const promptOutlet = document.getElementById('promptOutlet');
const promptCancelBtn = document.getElementById('promptCancelBtn');
const promptSubmitBtn = document.getElementById('promptSubmitBtn');

// --- Inisialisasi Aplikasi ---
async function init() {
    renderSkeleton(6);
    updateCartUI();
    await fetchProducts();
    renderBrandFilter();
    renderCategoryFilter();
    renderProducts();
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

function renderProducts() {
    // Filter di sisi Client
    let filtered = products;
    if (activeBrand !== 'Semua') filtered = filtered.filter(p => p.brand === activeBrand);
    if (activeCategory !== 'Semua') filtered = filtered.filter(p => p.category === activeCategory);
    if (searchQuery !== '') filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));

    if (filtered.length === 0) {
        productGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1; color: var(--text-muted);">Tidak ada produk yang sesuai dengan filter.</p>';
        return;
    }

    productGrid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <img src="${p.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${p.name}" class="product-img">
            <div class="product-info">
                <span class="badge">${p.category}</span>
                <h3 class="product-name">${p.name}</h3>
                <p class="cart-item-brand">${p.brand}</p>
                <div style="flex-grow: 1;"></div>
                <p class="product-price">${formatRupiah(p.price)}</p>
                <button class="btn-gradient add-cart-btn" data-id="${p.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => addToCart(e.target.dataset.id));
    });
}

// --- Fungsi Keranjang (Cart) ---
function addToCart(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    const existing = cart.find(item => item.id == productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    toggleCart(true);
}

function validateCheckout() {
    if (cart.length > 0) {
        checkoutBtn.disabled = false;
    } else {
        checkoutBtn.disabled = true;
    }
}

custName.addEventListener('input', validateCheckout);
custOutlet.addEventListener('input', validateCheckout);

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.textContent = totalItems;
    cartOpenBtn.classList.toggle('has-items', totalItems > 0);

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart"><i class="fa-solid fa-basket-shopping fa-3x" style="margin-bottom:1rem; opacity:0.5;"></i><p>Keranjang Anda kosong</p></div>';
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

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    cartTotalValue.textContent = formatRupiah(total);
    validateCheckout();
}

// Fungsi Keranjang yang Dipanggil Melalui Inline Onclick
window.updateQty = (id, delta) => {
    const item = cart.find(i => i.id == id);
    if (item) item.qty += delta;
    cart = cart.filter(i => i.qty > 0);
    localStorage.setItem('cart', JSON.stringify(cart));
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

promptSubmitBtn.addEventListener('click', () => {
    const nVal = promptName.value.trim();
    const oVal = promptOutlet.value.trim();
    
    if (!nVal || !oVal) {
        showCustomAlert("Mohon isi Nama dan Outlet untuk melanjutkan pesanan.");
        return;
    }
    
    custName.value = nVal;
    custOutlet.value = oVal;
    checkoutPromptOverlay.classList.remove('show');
    
    checkoutBtn.click(); // Trigger checkout again
});

// --- Checkout via WhatsApp ---
checkoutBtn.addEventListener('click', () => {
    const phone = "62881080611461";
    
    const nameVal = custName.value.trim();
    const outletVal = custOutlet.value.trim();

    if (!nameVal || !outletVal) {
        promptName.value = nameVal;
        promptOutlet.value = outletVal;
        checkoutPromptOverlay.classList.add('show');
        return;
    }

    let message = 'Halo! Saya ingin memesan:\n\n';
    
    cart.forEach((item, index) => {
        const subtotal = Math.round(item.price * item.qty);
        message += (index + 1) + '. ' + item.name + ' (' + item.brand + ') x' + item.qty + ' = Rp ' + subtotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\n';
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    message += '\nTotal: Rp ' + Math.round(total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\n\n';
    message += 'Nama: ' + nameVal + '\n';
    message += 'Outlet: ' + outletVal + '\n';
    message += 'Notes: ' + (custNotes.value.trim() || '-');

    const waLink = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
    window.open(waLink, '_blank');

    custName.value = '';
    custOutlet.value = '';
    custNotes.value = '';
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    validateCheckout();
    updateCartUI();
});
// --- Jalankan Script ---
init();
