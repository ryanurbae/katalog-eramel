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

// State
let products = [];
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

// --- Dashboard Logic ---
async function fetchProducts() {
    productTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>';
    
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
    renderTable();
    updateCategoryDatalist();
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
        productTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">Belum ada produk untuk filter ini.</td></tr>';
        return;
    }

    productTableBody.innerHTML = filteredProducts.map(product => `
        <tr>
            <td><img src="${product.image_url || 'https://via.placeholder.com/50'}" class="prod-thumb" alt="${product.name}"></td>
            <td>${product.brand || '-'}</td>
            <td><strong>${product.name}</strong></td>
            <td><span style="background:#e2e8f0; padding:4px 8px; border-radius:4px; font-size:0.85rem;">${product.category || '-'}</span></td>
            <td>${formatRupiah(product.price)}</td>
            <td class="action-btns">
                <button class="btn-icon btn-edit" onclick="window.editProduct('${product.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon btn-danger" onclick="window.deleteProduct('${product.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
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