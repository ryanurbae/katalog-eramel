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
    const menus = [menuProducts, menuVouchers, menuBanners, menuTickers];
    menus.forEach(menu => {
        menu.classList.remove('bg-slate-800', 'text-white', 'border-blue-600');
        menu.classList.add('text-slate-400', 'border-transparent');
    });
    activeMenu.classList.remove('text-slate-400', 'border-transparent');
    activeMenu.classList.add('bg-slate-800', 'text-white', 'border-blue-600');
    
    const dashboards = [productsDashboard, vouchersDashboard, bannersDashboard, tickersDashboard];
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
        
        const badgeClass = isAllHidden ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
        const badgeText = isAllHidden ? 'Tersembunyi' : 'Tampil';
        
        return `
            <div class="border border-slate-700 bg-slate-800/50 p-4 rounded-xl flex flex-col gap-3 min-w-[200px]">
                <div class="flex justify-between items-center">
                    <strong class="text-slate-200">${brand}</strong>
                    <span class="inline-flex items-center gap-x-1.5 py-1 px-2.5 rounded-full text-xs font-medium border ${badgeClass}">${badgeText}</span>
                </div>
                <button class="w-full py-2 px-3 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent ${isAllHidden ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'}" onclick="window.toggleBrandVisibility('${brand}', ${!isAllHidden})">
                    ${isAllHidden ? '<i class="fa-solid fa-eye"></i> Tampilkan' : '<i class="fa-solid fa-eye-slash"></i> Sembunyikan'}
                </button>
            </div>
        `;
    }).join('');
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
                <button class="inline-flex justify-center items-center size-8 text-sm font-semibold rounded-lg border border-transparent ${product.is_hidden ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-slate-400 hover:bg-slate-800'}" onclick="window.toggleProductVisibility('${product.id}', ${product.is_hidden})" title="${product.is_hidden ? 'Tampilkan' : 'Sembunyikan'}"><i class="fa-solid ${product.is_hidden ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
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
        alert('Terjadi kesalahan saat menyimpan produk.');
    } finally {
        saveProductBtn.disabled = false;
        saveProductBtn.textContent = 'Simpan Data';
    }
});

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
        const { error } = await supabase.from('products').update({ is_hidden: hide }).eq('brand', brand);
        if (error) throw error;
        fetchProducts();
    } catch (error) {
        console.error('Error toggling brand visibility:', error);
        alert('Gagal mengubah visibilitas brand.');
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
        alert('Gagal mengambil data voucher!');
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
        else alert('Gagal menyimpan voucher.');
    } finally {
        saveVoucherBtn.disabled = false;
        saveVoucherBtn.textContent = 'Simpan Data';
    }
});

window.deleteVoucher = async (id) => {
    if (confirm('Yakin ingin menghapus voucher ini?')) {
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
        alert('Gagal mengambil data banner!');
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
    if (confirm('Yakin ingin menghapus banner ini?')) {
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
        alert('Gagal mengambil data ticker!');
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
    if (confirm('Yakin ingin menghapus pesan ticker ini?')) {
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
