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
const sortFilter = document.getElementById('sortFilter');

// DOM Elements - Vouchers
const menuProducts = document.getElementById('menuProducts');
const menuVouchers = document.getElementById('menuVouchers');
const productsDashboard = document.getElementById('productsDashboard');
const vouchersDashboard = document.getElementById('vouchersDashboard');
const voucherTableBody = document.getElementById('voucherTableBody');

// Modal Elements
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
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
const saveVoucherBtn = document.getElementById('saveVoucherBtn');
const vId = document.getElementById('voucherId');
const vCode = document.getElementById('vCode');
const vDiscount = document.getElementById('vDiscount');
const vStatus = document.getElementById('vStatus');

// DOM Elements - Banners
const menuBanners = document.getElementById('menuBanners');
const bannersDashboard = document.getElementById('bannersDashboard');
const bannerTableBody = document.getElementById('bannerTableBody');
const bannerModal = document.getElementById('bannerModal');
const bannerForm = document.getElementById('bannerForm');
const bannerModalTitle = document.getElementById('bannerModalTitle');
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
const tickerModal = document.getElementById('tickerModal');
const tickerForm = document.getElementById('tickerForm');
const tickerModalTitle = document.getElementById('tickerModalTitle');
const saveTickerBtn = document.getElementById('saveTickerBtn');
const tId = document.getElementById('tickerId');
const tMessage = document.getElementById('tMessage');
const tOrder = document.getElementById('tOrder');
const tStatus = document.getElementById('tStatus');

// DOM Elements - Tenants
const menuTenants = document.getElementById('menuTenants');
const tenantsDashboard = document.getElementById('tenantsDashboard');
const tenantTableBody = document.getElementById('tenantTableBody');
const tenantForm = document.getElementById('tenantForm');
const tenantModalTitle = document.getElementById('tenantModalTitle');
const saveTenantBtn = document.getElementById('saveTenantBtn');
const tTenantId = document.getElementById('tenantId');
const tSlug = document.getElementById('tSlug');
const tSlugPreview = document.getElementById('tSlugPreview');
const tName = document.getElementById('tName');
const tBrand = document.getElementById('tBrand');
const tLogo = document.getElementById('tLogo');
const tAccent = document.getElementById('tAccent');
const tVisible = document.getElementById('tVisible');

// DOM Elements - Settings
const menuSettings = document.getElementById('menuSettings');
const settingsDashboard = document.getElementById('settingsDashboard');
const deliveryToggleBtn = document.getElementById('deliveryToggleBtn');

// State
let products = [];
let vouchers = [];
let banners = [];
let tickers = [];
let tenants = [];
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
    const menus = [menuProducts, menuVouchers, menuBanners, menuTickers, menuTenants, menuSettings];
    menus.forEach(menu => {
        menu.classList.remove('bg-[#1a1a2e]', 'text-white', 'border-[#1B62F1]');
        menu.classList.add('text-slate-400', 'border-transparent');
    });
    activeMenu.classList.remove('text-slate-400', 'border-transparent');
    activeMenu.classList.add('bg-[#1a1a2e]', 'text-white', 'border-[#1B62F1]');

    const dashboards = [productsDashboard, vouchersDashboard, bannersDashboard, tickersDashboard, tenantsDashboard, settingsDashboard];
    dashboards.forEach(dash => {
        if (dash !== activeDashboard) {
            dash.classList.add('hidden', 'opacity-0');
            dash.classList.remove('opacity-100');
            dash.style.display = 'none';
        }
    });

    activeDashboard.style.display = 'block';
    activeDashboard.classList.remove('hidden');
    
    // Trigger reflow before adding opacity for animation
    void activeDashboard.offsetWidth;
    
    activeDashboard.classList.add('transition-opacity', 'duration-500', 'opacity-100');
    activeDashboard.classList.remove('opacity-0');
    
    if(fetchCallback) fetchCallback();
}

menuProducts.addEventListener('click', () => switchTab(menuProducts, productsDashboard, fetchProducts));
menuVouchers.addEventListener('click', () => switchTab(menuVouchers, vouchersDashboard, fetchVouchers));
menuBanners.addEventListener('click', () => switchTab(menuBanners, bannersDashboard, fetchBanners));
menuTickers.addEventListener('click', () => switchTab(menuTickers, tickersDashboard, fetchTickers));
menuTenants.addEventListener('click', () => switchTab(menuTenants, tenantsDashboard, fetchTenants));
menuSettings.addEventListener('click', () => switchTab(menuSettings, settingsDashboard, fetchSettings));

tSlug.addEventListener('input', () => {
    tSlugPreview.textContent = tSlug.value.trim() || '...';
});

// --- Settings Logic ---
async function fetchSettings() {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) {
        console.error('Error fetching settings:', error);
        return;
    }
    const deliverySetting = data.find(s => s.key === 'delivery_method_enabled');
    if (deliverySetting) {
        const isEnabled = deliverySetting.value === 'true' || deliverySetting.value === true;
        if (isEnabled) {
            deliveryToggleBtn.classList.add('on');
            deliveryToggleBtn.setAttribute('aria-checked', 'true');
        } else {
            deliveryToggleBtn.classList.remove('on');
            deliveryToggleBtn.setAttribute('aria-checked', 'false');
        }
    }
}

deliveryToggleBtn.addEventListener('click', async () => {
    const isCurrentlyOn = deliveryToggleBtn.classList.contains('on');
    const newState = !isCurrentlyOn;

    // Optimistic UI update
    if (newState) {
        deliveryToggleBtn.classList.add('on');
    } else {
        deliveryToggleBtn.classList.remove('on');
    }
    deliveryToggleBtn.setAttribute('aria-checked', newState.toString());

    const { error } = await supabase.from('settings')
        .update({ value: newState })
        .eq('key', 'delivery_method_enabled');

    if (error) {
        console.error('Error updating delivery setting:', error);
        alert('Gagal menyimpan pengaturan Delivery! Pesan: ' + error.message);
        // Revert UI
        if (isCurrentlyOn) {
            deliveryToggleBtn.classList.add('on');
        } else {
            deliveryToggleBtn.classList.remove('on');
        }
        deliveryToggleBtn.setAttribute('aria-checked', isCurrentlyOn.toString());
    }
});

// --- Dashboard Logic ---
async function fetchProducts() {
    productTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-slate-500">Memuat data...</td></tr>';
    
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('brand')
        .order('category');

    if (error) {
        console.error(error);
        alert('Tidak bisa mengambil data produk. Cek koneksi internet lalu coba lagi.');
        return;
    }
    
    products = data || [];
    renderTable();
    updateCategoryDatalist();
}

function renderTable() {
    let filteredProducts = [...products];
    
    if (brandFilter.value !== 'Semua') {
        filteredProducts = filteredProducts.filter(p => p.brand === brandFilter.value);
    }
    
    if (categoryFilter.value !== 'Semua') {
        filteredProducts = filteredProducts.filter(p => p.category === categoryFilter.value);
    }

    const sortValue = sortFilter.value;
    if (sortValue === 'name_asc') {
        filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortValue === 'name_desc') {
        filteredProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortValue === 'price_asc') {
        filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortValue === 'price_desc') {
        filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortValue === 'date_desc') {
        filteredProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortValue === 'date_asc') {
        filteredProducts.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    }

    if (filteredProducts.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-slate-500">Belum ada produk untuk filter ini.</td></tr>';
        return;
    }

    productTableBody.innerHTML = filteredProducts.map(product => {
        const badgeClass = product.is_hidden ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400';
        const badgeText = product.is_hidden ? 'Tersembunyi' : 'Tampil';
        
        return `
        <tr class="hover:bg-slate-800/50">
            <td class="px-6 py-4 whitespace-nowrap"><img src="${product.image_url || 'https://via.placeholder.com/50'}" class="h-12 w-12 object-cover rounded-lg border border-slate-700" alt="${product.name}"></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${product.brand || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${product.name}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="bg-slate-800 border border-slate-700 text-slate-300 py-1 px-2.5 rounded text-xs">${product.category || '-'}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${formatRupiah(product.price)}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium ${badgeClass}">${badgeText}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button type="button" class="prod-toggle ${product.is_hidden ? '' : 'on'}" role="switch" aria-checked="${!product.is_hidden}" onclick="window.toggleProductVisibility('${product.id}', ${product.is_hidden})" title="${product.is_hidden ? 'Tampilkan' : 'Sembunyikan'}"><span class="prod-toggle-knob"></span></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-blue-400 hover:bg-blue-400/10" onclick="window.editProduct('${product.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-red-400 hover:bg-red-400/10" onclick="window.deleteProduct('${product.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

brandFilter.addEventListener('change', () => {
    updateCategoryDatalist();
    renderTable();
});
categoryFilter.addEventListener('change', renderTable);
sortFilter.addEventListener('change', renderTable);

function updateCategoryDatalist() {
    const brands = ['Semua', ...new Set(products.map(p => p.brand).filter(Boolean))];
    const currentBrand = brandFilter.value;
    brandFilter.innerHTML = brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
    if (brands.includes(currentBrand)) brandFilter.value = currentBrand;

    // Kategori hanya berdasarkan brand yang dipilih
    let productsForCategory = products;
    if (brandFilter.value !== 'Semua') {
        productsForCategory = products.filter(p => p.brand === brandFilter.value);
    }
    const categories = ['Semua', ...new Set(productsForCategory.map(p => p.category).filter(Boolean))];
    const currentCategory = categoryFilter.value;
    categoryFilter.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    if (categories.includes(currentCategory)) categoryFilter.value = currentCategory;
    else categoryFilter.value = 'Semua';

    const brandDatalist = document.getElementById('brandList');
    brandDatalist.innerHTML = brands.filter(b => b !== 'Semua').map(brand => `<option value="${brand}"></option>`).join('');
    bannerBrandList.innerHTML = brands.filter(b => b !== 'Semua').map(brand => `<option value="${brand}"></option>`).join('');
    categoryList.innerHTML = categories.filter(c => c !== 'Semua').map(cat => `<option value="${cat}"></option>`).join('');
}

// --- Modal Logic using Preline JS API ---
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
    
    HSOverlay.open(document.querySelector('#productModal'));
}

function closeModal() {
    HSOverlay.close(document.querySelector('#productModal'));
}

openAddModalBtn.addEventListener('click', () => openModal());

// Fungsi Handle File Gambar (Browse & Paste)
function handleFile(file) {
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file terlalu besar! Maksimal 2MB.');
            fImage.value = '';
            return;
        }
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

fImage.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

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

        if (file) {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);
                
            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
                
            finalImageUrl = publicUrlData.publicUrl;
        }

        const payload = { brand, name, category, price, image_url: finalImageUrl };

        if (id) {
            const { error: updateError } = await supabase.from('products').update(payload).eq('id', id);
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase.from('products').insert([payload]);
            if (insertError) throw insertError;
        }

        closeModal();
        fetchProducts(); 

    } catch (error) {
        console.error("Gagal menyimpan produk: ", error);
        alert('Gagal menyimpan produk. Pastikan semua kolom terisi dengan benar.');
    } finally {
        saveProductBtn.disabled = false;
        saveProductBtn.textContent = 'Simpan Data';
    }
});

window.deleteProduct = async (id) => {
    if (confirm('Hapus produk ini? Tindakan ini tidak bisa dibatalkan.')) {
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

window.toggleProductVisibility = async (id, currentStatus) => {
    try {
        const { error } = await supabase.from('products').update({ is_hidden: !currentStatus }).eq('id', id);
        if (error) throw error;
        fetchProducts();
    } catch (error) {
        console.error('Error toggling product visibility:', error);
        alert('Gagal mengubah visibilitas produk.');
    }
};

window.editProduct = (id) => {
    const product = products.find(p => p.id == id);
    if (product) openModal(product);
};

init();

document.addEventListener('paste', (e) => {
    if (productModal.classList.contains('open')) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    e.preventDefault();
                    handleFile(file);
                    break;
                }
            }
        }
    }
});

// --- Voucher Management Logic ---
async function fetchVouchers() {
    voucherTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Memuat data...</td></tr>';
    const { data, error } = await supabase.from('vouchers').select('*').order('code');
    if (error) {
        console.error(error);
        alert('Tidak bisa mengambil data voucher. Cek koneksi lalu coba lagi.');
        return;
    }
    vouchers = data || [];
    renderVoucherTable();
}

function renderVoucherTable() {
    if (vouchers.length === 0) {
        voucherTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Belum ada voucher.</td></tr>';
        return;
    }
    voucherTableBody.innerHTML = vouchers.map(v => {
        const badgeClass = v.is_active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400';
        const badgeText = v.is_active ? 'Aktif' : 'Nonaktif';
        return `
        <tr class="hover:bg-slate-800/50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">${v.code}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${v.discount_percent}%</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium ${badgeClass}">${badgeText}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent ${v.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-slate-400 hover:bg-slate-800'}" onclick="window.toggleVoucher('${v.id}', ${v.is_active})" title="${v.is_active ? 'Nonaktifkan' : 'Aktifkan'}"><i class="fa-solid ${v.is_active ? 'fa-check' : 'fa-power-off'}"></i></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-blue-400 hover:bg-blue-400/10" onclick="window.editVoucher('${v.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-red-400 hover:bg-red-400/10" onclick="window.deleteVoucher('${v.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
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
    HSOverlay.open(document.querySelector('#voucherModal'));
}

function closeVoucherModal() {
    HSOverlay.close(document.querySelector('#voucherModal'));
}

document.getElementById('openAddVoucherModalBtn').addEventListener('click', () => openVoucherModal());

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
            await supabase.from('vouchers').update(payload).eq('id', id);
        } else {
            await supabase.from('vouchers').insert([payload]);
        }
        closeVoucherModal();
        fetchVouchers();
    } catch (error) {
        console.error(error);
        if (error.code === '23505') alert('Kode voucher sudah ada!');
        else         alert('Gagal menyimpan voucher. Pastikan kode belum dipakai.');
    } finally {
        saveVoucherBtn.disabled = false;
        saveVoucherBtn.textContent = 'Simpan Data';
    }
});

window.deleteVoucher = async (id) => {
    if (confirm('Hapus voucher ini?')) {
        await supabase.from('vouchers').delete().eq('id', id);
        fetchVouchers();
    }
};

window.toggleVoucher = async (id, currentStatus) => {
    await supabase.from('vouchers').update({ is_active: !currentStatus }).eq('id', id);
    fetchVouchers();
};

window.editVoucher = (id) => {
    const v = vouchers.find(x => x.id == id);
    if (v) openVoucherModal(v);
};

// --- Banner Management Logic ---
async function fetchBanners() {
    bannerTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Memuat data...</td></tr>';
    const { data, error } = await supabase.from('brand_banners').select('*').order('brand');
    if (error) {
        console.error(error);
        alert('Tidak bisa mengambil data banner. Cek koneksi lalu coba lagi.');
        return;
    }
    banners = data || [];
    renderBannerTable();
}

function renderBannerTable() {
    if (banners.length === 0) {
        bannerTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Belum ada banner.</td></tr>';
        return;
    }
    bannerTableBody.innerHTML = banners.map(b => {
        const badgeClass = b.is_active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400';
        const badgeText = b.is_active ? 'Aktif' : 'Nonaktif';
        return `
        <tr class="hover:bg-slate-800/50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">${b.brand}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${b.message}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium ${badgeClass}">${badgeText}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent ${b.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-slate-400 hover:bg-slate-800'}" onclick="window.toggleBanner('${b.id}', ${b.is_active})" title="${b.is_active ? 'Nonaktifkan' : 'Aktifkan'}"><i class="fa-solid ${b.is_active ? 'fa-check' : 'fa-power-off'}"></i></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-blue-400 hover:bg-blue-400/10" onclick="window.editBanner('${b.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-red-400 hover:bg-red-400/10" onclick="window.deleteBanner('${b.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
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
    HSOverlay.open(document.querySelector('#bannerModal'));
}

function closeBannerModal() {
    HSOverlay.close(document.querySelector('#bannerModal'));
}

document.getElementById('openAddBannerModalBtn').addEventListener('click', () => openBannerModal());

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
            await supabase.from('brand_banners').update(payload).eq('id', id);
        } else {
            await supabase.from('brand_banners').insert([payload]);
        }
        closeBannerModal();
        fetchBanners();
    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan banner.');
    } finally {
        saveBannerBtn.disabled = false;
        saveBannerBtn.textContent = 'Simpan Data';
    }
});

window.deleteBanner = async (id) => {
    if (confirm('Hapus banner ini?')) {
        await supabase.from('brand_banners').delete().eq('id', id);
        fetchBanners();
    }
};

window.toggleBanner = async (id, currentStatus) => {
    await supabase.from('brand_banners').update({ is_active: !currentStatus }).eq('id', id);
    fetchBanners();
};

window.editBanner = (id) => {
    const b = banners.find(x => x.id == id);
    if (b) openBannerModal(b);
};

// --- Ticker Management Logic ---
async function fetchTickers() {
    tickerTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Memuat data...</td></tr>';
    const { data, error } = await supabase.from('news_ticker').select('*').order('sort_order');
    if (error) {
        console.error(error);
        alert('Tidak bisa mengambil data ticker. Cek koneksi lalu coba lagi.');
        return;
    }
    tickers = data || [];
    renderTickerTable();
}

function renderTickerTable() {
    if (tickers.length === 0) {
        tickerTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Belum ada pesan ticker.</td></tr>';
        return;
    }
    tickerTableBody.innerHTML = tickers.map(t => {
        const badgeClass = t.is_active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400';
        const badgeText = t.is_active ? 'Aktif' : 'Nonaktif';
        return `
        <tr class="hover:bg-slate-800/50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">${t.sort_order}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${t.message}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium ${badgeClass}">${badgeText}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent ${t.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-slate-400 hover:bg-slate-800'}" onclick="window.toggleTicker('${t.id}', ${t.is_active})" title="${t.is_active ? 'Nonaktifkan' : 'Aktifkan'}"><i class="fa-solid ${t.is_active ? 'fa-check' : 'fa-power-off'}"></i></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-blue-400 hover:bg-blue-400/10" onclick="window.editTicker('${t.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-red-400 hover:bg-red-400/10" onclick="window.deleteTicker('${t.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
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
    HSOverlay.open(document.querySelector('#tickerModal'));
}

function closeTickerModal() {
    HSOverlay.close(document.querySelector('#tickerModal'));
}

document.getElementById('openAddTickerModalBtn').addEventListener('click', () => openTickerModal());

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
            await supabase.from('news_ticker').update(payload).eq('id', id);
        } else {
            await supabase.from('news_ticker').insert([payload]);
        }
        closeTickerModal();
        fetchTickers();
    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan ticker.');
    } finally {
        saveTickerBtn.disabled = false;
        saveTickerBtn.textContent = 'Simpan Data';
    }
});

window.deleteTicker = async (id) => {
    if (confirm('Hapus pesan ticker ini?')) {
        await supabase.from('news_ticker').delete().eq('id', id);
        fetchTickers();
    }
};

window.toggleTicker = async (id, currentStatus) => {
    await supabase.from('news_ticker').update({ is_active: !currentStatus }).eq('id', id);
    fetchTickers();
};

window.editTicker = (id) => {
    const t = tickers.find(x => x.id == id);
    if (t) openTickerModal(t);
};

// --- Tenant Management Logic ---
// Pemetaan brand tenant -> brand produk di DB (sama seperti di app.js)
// agar cascade hide/unhide mengenai produk yang brand-nya beda penulisan.
const TENANT_BRAND_ALIAS = {
    'tomoro': 'Tomoro Coffee',
    'fore': 'Fore Coffee',
};

async function fetchTenants() {
    tenantTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Memuat data...</td></tr>';
    const { data, error } = await supabase.from('tenants').select('*').order('sort_order');
    if (error) {
        console.error(error);
        alert('Tidak bisa mengambil data tenant. Cek koneksi lalu coba lagi.');
        return;
    }
    tenants = data || [];
    renderTenantTable();
}

function renderTenantTable() {
    if (tenants.length === 0) {
        tenantTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-slate-500">Belum ada tenant.</td></tr>';
        return;
    }
    tenantTableBody.innerHTML = tenants.map(t => {
        const badgeClass = t.is_visible ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400';
        const badgeText = t.is_visible ? 'Tampil' : 'Sembunyi';
        return `
        <tr class="hover:bg-slate-800/50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${t.brand || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="inline-block size-5 rounded" style="background:${t.accent || '#1B62F1'}"></span></td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium ${badgeClass}">${badgeText}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent ${t.is_visible ? 'text-slate-400 hover:bg-slate-800' : 'text-emerald-400 hover:bg-emerald-400/10'}" onclick="window.toggleTenant('${t.slug}', ${t.is_visible})" title="${t.is_visible ? 'Sembunyikan' : 'Tampilkan'}"><i class="fa-solid ${t.is_visible ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-blue-400 hover:bg-blue-400/10" onclick="window.editTenant('${t.slug}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent text-red-400 hover:bg-red-400/10" onclick="window.deleteTenant('${t.slug}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
        `;
    }).join('');
}

function openTenantModal(editData = null) {
    tenantForm.reset();
    if (editData) {
        tenantModalTitle.textContent = 'Edit Tenant';
        tTenantId.value = editData.slug;
        tSlug.value = editData.slug;
        tSlug.readOnly = true;
        tName.value = editData.name;
        tBrand.value = editData.brand;
        tLogo.value = editData.logo_url || '';
        tAccent.value = editData.accent || '#1B62F1';
        tVisible.value = editData.is_visible.toString();
    } else {
        tenantModalTitle.textContent = 'Tambah Tenant';
        tTenantId.value = '';
        tSlug.readOnly = false;
        tSlug.value = '';
        tAccent.value = '#1B62F1';
        tVisible.value = 'true';
    }
    tSlugPreview.textContent = tSlug.value.trim() || '...';
    HSOverlay.open(document.querySelector('#tenantModal'));
}

function closeTenantModal() {
    HSOverlay.close(document.querySelector('#tenantModal'));
}

document.getElementById('openAddTenantModalBtn').addEventListener('click', () => openTenantModal());

tenantForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveTenantBtn.disabled = true;
    saveTenantBtn.textContent = 'Menyimpan...';
    const slug = tSlug.value.trim();
    const payload = {
        slug,
        name: tName.value.trim(),
        brand: tBrand.value.trim(),
        logo_url: tLogo.value.trim() || null,
        accent: tAccent.value,
        is_visible: tVisible.value === 'true'
    };
    try {
        if (tTenantId.value) {
            const { error } = await supabase.from('tenants').update(payload).eq('slug', slug);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('tenants').insert([payload]);
            if (error) throw error;
        }
        closeTenantModal();
        fetchTenants();
    } catch (error) {
        console.error(error);
        if (error.code === '23505') alert('Slug sudah ada!');
        else alert('Gagal menyimpan tenant.');
    } finally {
        saveTenantBtn.disabled = false;
        saveTenantBtn.textContent = 'Simpan Data';
    }
});

window.deleteTenant = async (slug) => {
    if (confirm('Hapus tenant ini? Semua produk terkait juga akan disembunyikan.')) {
        const { error } = await supabase.from('tenants').delete().eq('slug', slug);
        if (error) {
            console.error(error);
            alert('Gagal menghapus tenant.');
            return;
        }
        fetchTenants();
    }
};

window.toggleTenant = async (slug, currentStatus) => {
    try {
        const newVisible = !currentStatus;
        const { error } = await supabase.from('tenants').update({ is_visible: newVisible }).eq('slug', slug);
        if (error) throw error;

        // Cascade: semua produk brand ini ikut hidden/unhidden
        const t = tenants.find(x => x.slug === slug);
        if (t) {
            const brands = [t.brand];
            if (TENANT_BRAND_ALIAS[t.slug]) brands.push(TENANT_BRAND_ALIAS[t.slug]);
            const { error: perr } = await supabase
                .from('products')
                .update({ is_hidden: !newVisible })
                .in('brand', brands);
            if (perr) throw perr;
        }

        fetchTenants();
    } catch (error) {
        console.error('Error toggling tenant visibility:', error);
        alert('Gagal mengubah visibilitas tenant.');
    }
};

window.editTenant = (slug) => {
    const t = tenants.find(x => x.slug === slug);
    if (t) openTenantModal(t);
};
