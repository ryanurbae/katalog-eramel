import { supabase } from "./supabase-config.js";

// Ambil satu tenant by slug. Mengembalikan null kalau tidak ada / tidak visible.
export async function getTenant(slug) {
    if (!slug) return null;
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
    if (error) {
        console.error('Gagal memuat tenant:', error);
        return null;
    }
    return data || null;
}

// Ambil semua tenant yang visible, urut berdasarkan sort_order.
// Dipakai untuk merender tombol tenant di landing page.
export async function fetchVisibleTenants() {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order');
    if (error) {
        console.error('Gagal memuat tenants:', error);
        return [];
    }
    return data || [];
}
