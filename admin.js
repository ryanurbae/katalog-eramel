import { supabase } from "./supabase-config.js";

// --- DOM Elements ---
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const productTableBody = document.getElementById('productTableBody');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const brandFilter = document.getElementById('brandFilter');
const categoryFilter = document.getElementById('categoryFilter');

// DOM Elements - Vouchers
const menuProducts = document.getElementById('menuProducts');
const menuVouchers = document.getElementById('menuVouchers');
const productsDashboard = document.getElementById('productsDashboard');
const vouchersDashboard = document.getElementById('vouchersDashboard');
const voucherTableBody = document.getElementById('voucherTableBody');
const openAddVoucherModalBtn = document.getElementById('openAddVoucherModalBtn');

// Modal Elements
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const categoryList = document.getElementById('categoryList');

// Form Inputs
const fId = document.getElementById('productId');
const fBrand = document.getElementById('prodBrand');
const fName = document.getElementById('prodName');
const fCat = document.getElementById('prodCat');
const fPrice = document.getElementById('prodPrice');
const fImage = document.getElementById('prodImage');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const dropzone = document.getElementById('dropzone');
const dropzoneContent = document.getElementById('dropzoneContent');

// Voucher Modal Elements
const voucherModal = document.getElementById('voucherModal');
const voucherForm = document.getElementById('voucherForm');
const voucherModalTitle = document.getElementById('voucherModalTitle');
const closeVoucherModalBtn = document.getElementById('closeVoucherModalBtn');
const cancelVoucherModalBtn = document.getElementById('cancelVoucherModalBtn');
const saveVoucherBtn = document.getElementById('saveVoucherBtn');
const vId = document.getElementById('voucherId');
const vCode = document.getElementById('vCode');
const vDiscount = document.getElementById('vDiscount');
const vStatus = document.getElementById('vStatus');

// DOM Elements - Banners
const menuBanners = document.getElementById('menuBanners');
const bannersDashboard = document.getElementById('bannersDashboard');
const bannerTableBody = document.getElementById('bannerTableBody');
const openAddBannerModalBtn = document.getElementById('openAddBannerModalBtn');
const bannerModal = document.getElementById('bannerModal');
const bannerForm = document.getElementById('bannerForm');
const bannerModalTitle = document.getElementById('bannerModalTitle');
const closeBannerModalBtn = document.getElementById('closeBannerModalBtn');
const cancelBannerModalBtn = document.getElementById('cancelBannerModalBtn');
const saveBannerBtn = document.getElementById('saveBannerBtn');
const bId = document.getElementById('bannerId');
const bBrand = document.getElementById('bBrand');
const bMessage = document.getElementById('bMessage');
const bStatus = document.getElementById('bStatus');
const bannerBrandList = document.getElementById('bannerBrandList');

// DOM Elements - Tickers
const menuTickers = document.getElementById('menuTickers');
const tickersDashboard = document.getElementById('tickersDashboard');
const tickerTableBody = document.getElementById('tickerTableBody');
const openAddTickerModalBtn = document.getElementById('openAddTickerModalBtn');
const tickerModal = document.getElementById('tickerModal');
const tickerForm = document.getElementById('tickerForm');
const tickerModalTitle = document.getElementById('tickerModalTitle');
const closeTickerModalBtn = document.getElementById('closeTickerModalBtn');
const cancelTickerModalBtn = document.getElementById('cancelTickerModalBtn');
const saveTickerBtn = document.getElementById('saveTickerBtn');
const tId = document.getElementById('tickerId');
const tMessage = document.getElementById('tMessage');
const tOrder = document.getElementById('tOrder');
const tStatus = document.getElementById('tStatus');

// State
let products = [];
let vouchers = [];
let banners = [];
let tickers = [];
let existingImageUrl = null;

// --- Helpers ---
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

// --- Initialization ---
async function init() {
    const { data, error } = await supabase.auth.getSession();
    if (data.session) {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginView.style.display = 'flex';
    dashboardView.style.display = 'none';
}

function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'flex';

    fetchProducts();
}

// --- Authentication ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginBtn.textContent = 'Memproses...';
    loginBtn.disabled = true;
    loginError.style.display = 'none';

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginError.textContent = error.message;
        loginError.style.display = 'block';
        loginBtn.textContent = 'Masuk';
        loginBtn.disabled = false;
    } else {
        showDashboard();
        loginBtn.textContent = 'Masuk';
        loginBtn.disabled = false;
        loginForm.reset();
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLogin();
});

// --- Menu Navigation ---
function switchTab(activeMenu, activeDashboard, fetchCallback) {
    [menuProducts, menuVouchers, menuBanners, menuTickers].forEach(menu => menu.classList.remove('active'));
    activeMenu.classList.add('active');
    
    [productsDashboard, vouchersDashboard, bannersDashboard, tickersDashboard].forEach(dash => dash.style.display = 'none');
    activeDashboard.style.display = 'block';
    
    if(fetchCallback) fetchCallback();
}

menuProducts.addEventListener('click', () => {
    switchTab(menuProducts, productsDashboard, fetchProducts);
});
menuVouchers.addEventListener('click', () => {
    switchTab(menuVouchers, vouchersDashboard, fetchVouchers);
});
menuBanners.addEventListener('click', () => {
    switchTab(menuBanners, bannersDashboard, fetchBanners);
});
menuTickers.addEventListener('click', () => {
    switchTab(menuTickers, tickersDashboard, fetchTickers);
});

// --- Dashboard Logic ---
async function fetchProducts() {
    productTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Memuat data...</td></tr>';
    
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('brand')
        .order('category');

    if (error) {
        console.error(error);
        alert('Gagal mengambil data produk!');
        return;
    }
    
    products = data || [];
    renderBrandVisibility();
    renderTable();
    updateCategoryDatalist();
}

function renderBrandVisibility() {
    const brandVisibilityContainer = document.getElementById('brandVisibilityContainer');
    
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    
    brandVisibilityContainer.innerHTML = brands.map(brand => {
        const brandProducts = products.filter(p => p.brand === brand);
        const isAllHidden = brandProducts.length > 0 && brandProducts.every(p => p.is_hidden);
        
        const badgeClass = isAllHidden ? 'badge-hidden' : 'badge-visible';
        const badgeText = isAllHidden ? 'Tersembunyi' : 'Tampil';
        
        return `
            <div style="border: 1px solid var(--border); padding: 1rem; border-radius: 8px; display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${brand}</strong>
                    <span class="${badgeClass}">${badgeText}</span>
                </div>
                <button class="btn ${isAllHidden ? 'btn-success' : 'btn-danger'} btn-block" style="margin-top: 0.5rem; font-size: 1rem;" onclick="window.toggleBrandVisibility('${brand}', ${!isAllHidden})">
                    ${isAllHidden ? '<i class="fa-solid fa-eye"></i> Tampilkan' : '<i class="fa-solid fa-eye-slash"></i> Sembunyikan'}
                </button>
            </div>
        `;
    }).join('');
}

function renderTable() {
    let filteredProducts = products;
    
    if (brandFilter.value !== 'Semua') {
        filteredProducts = products.filter(p => p.brand === brandFilter.value);
    }
    
    if (categoryFilter.value !== 'Semua') {
        filteredProducts = filteredProducts.filter(p => p.category === categoryFilter.value);
    }

    if (filteredProducts.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888;">Belum ada produk untuk filter ini.</td></tr>';
        return;
    }

    productTableBody.innerHTML = filteredProducts.map(product => {
        const badgeClass = product.is_hidden ? 'badge-hidden' : 'badge-visible';
        const badgeText = product.is_hidden ? 'Tersembunyi' : 'Tampil';
        
        return `
        <tr>
            <td><img src="${product.image_url || 'https://via.placeholder.com/50'}" class="prod-thumb" alt="${product.name}"></td>
            <td>${product.brand || '-'}</td>
            <td><strong>${product.name}</strong></td>
            <td><span style="background:#e2e8f0; padding:4px 8px; border-radius:4px; font-size:0.85rem;">${product.category || '-'}</span></td>
            <td>${formatRupiah(product.price)}</td>
            <td><span class="${badgeClass}">${badgeText}</span></td>
            <td class="action-btns">
                <button class="btn-icon ${product.is_hidden ? 'btn-success' : 'btn-secondary'}" onclick="window.toggleProductVisibility('${product.id}', ${product.is_hidden})" title="${product.is_hidden ? 'Tampilkan' : 'Sembunyikan'}"><i class="fa-solid ${product.is_hidden ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
                <button class="btn-icon btn-edit" onclick="window.editProduct('${product.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon btn-danger" onclick="window.deleteProduct('${product.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

brandFilter.addEventListener('change', renderTable);
categoryFilter.addEventListener('change', renderTable);

function updateCategoryDatalist() {
    const brands = ['Semua', ...new Set(products.map(p => p.brand).filter(Boolean))];
    const currentBrand = brandFilter.value;
    brandFilter.innerHTML = brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
    if (brands.includes(currentBrand)) brandFilter.value = currentBrand;

    const categories = ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];
    const currentCategory = categoryFilter.value;
    categoryFilter.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    if (categories.includes(currentCategory)) categoryFilter.value = currentCategory;

    // Update datalist for modal
    const brandDatalist = document.getElementById('brandList');
    brandDatalist.innerHTML = brands.filter(b => b !== 'Semua').map(brand => `<option value="${brand}"></option>`).join('');
    bannerBrandList.innerHTML = brands.filter(b => b !== 'Semua').map(brand => `<option value="${brand}"></option>`).join('');
    categoryList.innerHTML = categories.filter(c => c !== 'Semua').map(cat => `<option value="${cat}"></option>`).join('');
}


// --- Modal Logic ---
function openModal(editData = null) {
    productForm.reset();
    existingImageUrl = null;
    imagePreview.style.display = 'none';
    imagePreviewContainer.style.display = 'none';
    dropzoneContent.style.display = 'flex';
    
    if (editData) {
        modalTitle.textContent = 'Edit Produk';
        fId.value = editData.id;
        fBrand.value = editData.brand || '';
        fName.value = editData.name;
        fCat.value = editData.category || '';
        fPrice.value = editData.price;
        
        if (editData.image_url) {
            existingImageUrl = editData.image_url;
            imagePreview.src = existingImageUrl;
            imagePreview.style.display = 'block';
            imagePreviewContainer.style.display = 'flex';
            dropzoneContent.style.display = 'none';
        }
    } else {
        modalTitle.textContent = 'Tambah Produk Baru';
        fId.value = '';
    }
    
    productModal.style.display = 'flex';
}

function closeModal() {
    productModal.style.display = 'none';
}

// Fungsi Handle File Gambar (Browse & Paste)
function handleFile(file) {
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file terlalu besar! Maksimal 2MB.');
            fImage.value = '';
            return;
        }

        // Memasukkan file ke input secara programatis agar terbaca saat disubmit
        const dt = new DataTransfer();
        dt.items.add(file);
        fImage.files = dt.files;

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            imagePreviewContainer.style.display = 'flex';
            dropzoneContent.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Preview Gambar Saat Dipilih Manual
fImage.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

// Simpan Data (Tambah / Edit)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveProductBtn.disabled = true;
    saveProductBtn.textContent = 'Menyimpan...';

    try {
        const id = fId.value;
        const brand = fBrand.value;
        const name = fName.value;
        const category = fCat.value;
        const price = parseFloat(fPrice.value);
        
        let finalImageUrl = existingImageUrl;
        const file = fImage.files[0];

        // Upload ke Storage jika ada foto baru
        if (file) {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);
                
            if (uploadError) throw uploadError;

            // Ambil public URL
            const { data: publicUrlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
                
            finalImageUrl = publicUrlData.publicUrl;
        }

        const payload = { brand, name, category, price, image_url: finalImageUrl };

        if (id) {
            // Edit
            const { error: updateError } = await supabase.from('products').update(payload).eq('id', id);
            if (updateError) throw updateError;
        } else {
            // Tambah
            const { error: insertError } = await supabase.from('products').insert([payload]);
            if (insertError) throw insertError;
        }

        closeModal();
        fetchProducts(); 

    } catch (error) {
        console.error("Gagal menyimpan produk: ", error);
        alert('Terjadi kesalahan saat menyimpan produk.');
    } finally {
        saveProductBtn.disabled = false;
        saveProductBtn.textContent = 'Simpan Data';
    }
});

// Hapus Produk
window.deleteProduct = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) {
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (error) {
            console.error('Gagal menghapus produk: ', error);
            alert('Terjadi kesalahan saat menghapus produk.');
        }
    }
};

window.toggleBrandVisibility = async (brand, hide) => {
    try {
        const { error } = await supabase
            .from('products')
            .update({ is_hidden: hide })
            .eq('brand', brand);
            
        if (error) throw error;
        
        alert(`Brand ${brand} berhasil ${hide ? 'disembunyikan' : 'ditampilkan'}`);
        fetchProducts(); // Refresh the list
    } catch (error) {
        console.error('Error toggling brand visibility:', error);
        alert('Gagal mengubah visibilitas brand.');
    }
};

window.toggleProductVisibility = async (id, currentStatus) => {
    try {
        const { error } = await supabase
            .from('products')
            .update({ is_hidden: !currentStatus })
            .eq('id', id);
            
        if (error) throw error;
        
        fetchProducts(); // Refresh the list
    } catch (error) {
        console.error('Error toggling product visibility:', error);
        alert('Gagal mengubah visibilitas produk.');
    }
};

window.editProduct = (id) => {
    const product = products.find(p => p.id == id);
    if (product) openModal(product);
};

// Event Listeners Modal
openAddModalBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);
productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeModal();
});

// Eksekusi saat start
init();

// Handle Paste Gambar dari Clipboard (Ctrl+V)
document.addEventListener('paste', (e) => {
    // Hanya proses paste jika modal sedang terbuka
    if (productModal.style.display === 'flex') {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    e.preventDefault(); // Mencegah paste default jika terdeteksi gambar
                    handleFile(file);
                    break; // Hanya ambil satu gambar
                }
            }
        }
    }
});

// --- Voucher Management Logic ---
async function fetchVouchers() {
    voucherTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>';
    const { data, error } = await supabase.from('vouchers').select('*').order('code');
    if (error) {
        console.error(error);
        alert('Gagal mengambil data voucher!');
        return;
    }
    vouchers = data || [];
    renderVoucherTable();
}

function renderVoucherTable() {
    if (vouchers.length === 0) {
        voucherTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">Belum ada voucher.</td></tr>';
        return;
    }
    voucherTableBody.innerHTML = vouchers.map(v => {
        const badgeClass = v.is_active ? 'badge-visible' : 'badge-hidden';
        const badgeText = v.is_active ? 'Aktif' : 'Nonaktif';
        return `
        <tr>
            <td><strong>${v.code}</strong></td>
            <td>${v.discount_percent}%</td>
            <td><span class="${badgeClass}">${badgeText}</span></td>
            <td class="action-btns">
                <button class="btn-icon ${v.is_active ? 'btn-success' : 'btn-secondary'}" onclick="window.toggleVoucher('${v.id}', ${v.is_active})" title="${v.is_active ? 'Nonaktifkan' : 'Aktifkan'}"><i class="fa-solid ${v.is_active ? 'fa-check' : 'fa-power-off'}"></i></button>
                <button class="btn-icon btn-edit" onclick="window.editVoucher('${v.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon btn-danger" onclick="window.deleteVoucher('${v.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

function openVoucherModal(editData = null) {
    voucherForm.reset();
    if (editData) {
        voucherModalTitle.textContent = 'Edit Voucher';
        vId.value = editData.id;
        vCode.value = editData.code;
        vDiscount.value = editData.discount_percent;
        vStatus.value = editData.is_active.toString();
    } else {
        voucherModalTitle.textContent = 'Tambah Voucher';
        vId.value = '';
        vStatus.value = 'true';
    }
    voucherModal.style.display = 'flex';
}

function closeVoucherModal() {
    voucherModal.style.display = 'none';
}

voucherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveVoucherBtn.disabled = true;
    saveVoucherBtn.textContent = 'Menyimpan...';
    const id = vId.value;
    const code = vCode.value.trim().toUpperCase();
    const discount_percent = parseInt(vDiscount.value);
    const is_active = vStatus.value === 'true';
    const payload = { code, discount_percent, is_active };
    try {
        if (id) {
            const { error } = await supabase.from('vouchers').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('vouchers').insert([payload]);
            if (error) throw error;
        }
        closeVoucherModal();
        fetchVouchers();
    } catch (error) {
        console.error(error);
        if (error.code === '23505') alert('Kode voucher sudah ada!');
        else alert('Gagal menyimpan voucher: ' + (error.message || 'Error tidak diketahui dari database.'));
    } finally {
        saveVoucherBtn.disabled = false;
        saveVoucherBtn.textContent = 'Simpan Data';
    }
});

window.deleteVoucher = async (id) => {
    if (confirm('Yakin ingin menghapus voucher ini?')) {
        const { error } = await supabase.from('vouchers').delete().eq('id', id);
        if (error) alert('Gagal menghapus voucher.');
        else fetchVouchers();
    }
};

window.toggleVoucher = async (id, currentStatus) => {
    const { error } = await supabase.from('vouchers').update({ is_active: !currentStatus }).eq('id', id);
    if (error) alert('Gagal mengubah status voucher.');
    else fetchVouchers();
};

window.editVoucher = (id) => {
    const v = vouchers.find(x => x.id == id);
    if (v) openVoucherModal(v);
};

openAddVoucherModalBtn.addEventListener('click', () => openVoucherModal());
closeVoucherModalBtn.addEventListener('click', closeVoucherModal);
cancelVoucherModalBtn.addEventListener('click', closeVoucherModal);

// --- Banner Management Logic ---
async function fetchBanners() {
    bannerTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>';
    const { data, error } = await supabase.from('brand_banners').select('*').order('brand');
    if (error) {
        console.error(error);
        alert('Gagal mengambil data banner!');
        return;
    }
    banners = data || [];
    renderBannerTable();
}

function renderBannerTable() {
    if (banners.length === 0) {
        bannerTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">Belum ada banner.</td></tr>';
        return;
    }
    bannerTableBody.innerHTML = banners.map(b => {
        const badgeClass = b.is_active ? 'badge-visible' : 'badge-hidden';
        const badgeText = b.is_active ? 'Aktif' : 'Nonaktif';
        return `
        <tr>
            <td><strong>${b.brand}</strong></td>
            <td>${b.message}</td>
            <td><span class="${badgeClass}">${badgeText}</span></td>
            <td class="action-btns">
                <button class="btn-icon ${b.is_active ? 'btn-success' : 'btn-secondary'}" onclick="window.toggleBanner('${b.id}', ${b.is_active})" title="${b.is_active ? 'Nonaktifkan' : 'Aktifkan'}"><i class="fa-solid ${b.is_active ? 'fa-check' : 'fa-power-off'}"></i></button>
                <button class="btn-icon btn-edit" onclick="window.editBanner('${b.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon btn-danger" onclick="window.deleteBanner('${b.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

function openBannerModal(editData = null) {
    bannerForm.reset();
    if (editData) {
        bannerModalTitle.textContent = 'Edit Banner';
        bId.value = editData.id;
        bBrand.value = editData.brand;
        bMessage.value = editData.message;
        bStatus.value = editData.is_active.toString();
    } else {
        bannerModalTitle.textContent = 'Tambah Banner';
        bId.value = '';
        bStatus.value = 'true';
    }
    bannerModal.style.display = 'flex';
}

function closeBannerModal() {
    bannerModal.style.display = 'none';
}

bannerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveBannerBtn.disabled = true;
    saveBannerBtn.textContent = 'Menyimpan...';
    const id = bId.value;
    const brand = bBrand.value.trim();
    const message = bMessage.value.trim();
    const is_active = bStatus.value === 'true';
    const payload = { brand, message, is_active };
    try {
        if (id) {
            const { error } = await supabase.from('brand_banners').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('brand_banners').insert([payload]);
            if (error) throw error;
        }
        closeBannerModal();
        fetchBanners();
    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan banner: ' + (error.message || 'Error tidak diketahui.'));
    } finally {
        saveBannerBtn.disabled = false;
        saveBannerBtn.textContent = 'Simpan Data';
    }
});

window.deleteBanner = async (id) => {
    if (confirm('Yakin ingin menghapus banner ini?')) {
        const { error } = await supabase.from('brand_banners').delete().eq('id', id);
        if (error) alert('Gagal menghapus banner.');
        else fetchBanners();
    }
};

window.toggleBanner = async (id, currentStatus) => {
    const { error } = await supabase.from('brand_banners').update({ is_active: !currentStatus }).eq('id', id);
    if (error) alert('Gagal mengubah status banner.');
    else fetchBanners();
};

window.editBanner = (id) => {
    const b = banners.find(x => x.id == id);
    if (b) openBannerModal(b);
};

openAddBannerModalBtn.addEventListener('click', () => openBannerModal());
closeBannerModalBtn.addEventListener('click', closeBannerModal);
cancelBannerModalBtn.addEventListener('click', closeBannerModal);

// --- Ticker Management Logic ---
async function fetchTickers() {
    tickerTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>';
    const { data, error } = await supabase.from('news_ticker').select('*').order('sort_order');
    if (error) {
        console.error(error);
        alert('Gagal mengambil data ticker!');
        return;
    }
    tickers = data || [];
    renderTickerTable();
}

function renderTickerTable() {
    if (tickers.length === 0) {
        tickerTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">Belum ada pesan ticker.</td></tr>';
        return;
    }
    tickerTableBody.innerHTML = tickers.map(t => {
        const badgeClass = t.is_active ? 'badge-visible' : 'badge-hidden';
        const badgeText = t.is_active ? 'Aktif' : 'Nonaktif';
        return `
        <tr>
            <td><strong>${t.sort_order}</strong></td>
            <td>${t.message}</td>
            <td><span class="${badgeClass}">${badgeText}</span></td>
            <td class="action-btns">
                <button class="btn-icon ${t.is_active ? 'btn-success' : 'btn-secondary'}" onclick="window.toggleTicker('${t.id}', ${t.is_active})" title="${t.is_active ? 'Nonaktifkan' : 'Aktifkan'}"><i class="fa-solid ${t.is_active ? 'fa-check' : 'fa-power-off'}"></i></button>
                <button class="btn-icon btn-edit" onclick="window.editTicker('${t.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon btn-danger" onclick="window.deleteTicker('${t.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

function openTickerModal(editData = null) {
    tickerForm.reset();
    if (editData) {
        tickerModalTitle.textContent = 'Edit Pesan Ticker';
        tId.value = editData.id;
        tMessage.value = editData.message;
        tOrder.value = editData.sort_order;
        tStatus.value = editData.is_active.toString();
    } else {
        tickerModalTitle.textContent = 'Tambah Pesan Ticker';
        tId.value = '';
        tOrder.value = tickers.length > 0 ? Math.max(...tickers.map(t => t.sort_order)) + 1 : 1;
        tStatus.value = 'true';
    }
    tickerModal.style.display = 'flex';
}

function closeTickerModal() {
    tickerModal.style.display = 'none';
}

tickerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveTickerBtn.disabled = true;
    saveTickerBtn.textContent = 'Menyimpan...';
    const id = tId.value;
    const message = tMessage.value.trim();
    const sort_order = parseInt(tOrder.value);
    const is_active = tStatus.value === 'true';
    const payload = { message, sort_order, is_active };
    try {
        if (id) {
            const { error } = await supabase.from('news_ticker').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('news_ticker').insert([payload]);
            if (error) throw error;
        }
        closeTickerModal();
        fetchTickers();
    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan ticker: ' + (error.message || 'Error tidak diketahui.'));
    } finally {
        saveTickerBtn.disabled = false;
        saveTickerBtn.textContent = 'Simpan Data';
    }
});

window.deleteTicker = async (id) => {
    if (confirm('Yakin ingin menghapus pesan ticker ini?')) {
        const { error } = await supabase.from('news_ticker').delete().eq('id', id);
        if (error) alert('Gagal menghapus ticker.');
        else fetchTickers();
    }
};

window.toggleTicker = async (id, currentStatus) => {
    const { error } = await supabase.from('news_ticker').update({ is_active: !currentStatus }).eq('id', id);
    if (error) alert('Gagal mengubah status ticker.');
    else fetchTickers();
};

window.editTicker = (id) => {
    const t = tickers.find(x => x.id == id);
    if (t) openTickerModal(t);
};

openAddTickerModalBtn.addEventListener('click', () => openTickerModal());
closeTickerModalBtn.addEventListener('click', closeTickerModal);
cancelTickerModalBtn.addEventListener('click', closeTickerModal);
