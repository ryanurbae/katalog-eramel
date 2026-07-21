import { supabase } from "./supabase-config.js";
import { fetchVisibleTenants } from "./tenants.js";

let newsTickers = [];

async function renderTenants() {
    const grid = document.getElementById('tenantGrid');
    if (!grid) return;

    const tenants = await fetchVisibleTenants();
    if (!tenants.length) {
        grid.innerHTML = '<p class="tenant-empty">Belum ada brand yang tersedia saat ini.</p>';
        return;
    }

    grid.innerHTML = tenants.map(t => {
        const accent = t.accent || '#1B62F1';
        const logo = t.logo_url
            ? `<img class="tenant-card-logo" src="${t.logo_url}" alt="${t.name}" onerror="this.remove()">`
            : '';
        return `
            <a class="tenant-card" href="katalog.html?tenant=${encodeURIComponent(t.slug)}" style="--tc:${accent}">
                ${logo}
                <span class="tenant-card-name">${t.name}</span>
            </a>
        `;
    }).join('');
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

function renderTicker(tickers) {
    const tickerEl = document.getElementById('newsTicker');
    const tickerContent = document.getElementById('tickerContent');

    if (!tickerEl || !tickerContent) return;

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

async function init() {
    await Promise.all([fetchNewsTickers(), renderTenants()]);
    renderTicker(newsTickers);
}

init();

// Smooth scroll untuk tombol Cara Pesan
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            const offset = 80;
            if (window.lenis) {
                window.lenis.scrollTo(targetElement, { offset: -offset });
            } else {
                const top = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: top, behavior: "smooth" });
            }
        }
    });
});
