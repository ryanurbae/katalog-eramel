import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Placeholder credentials untuk koneksi ke project Supabase Anda
const SUPABASE_URL = 'https://fkeyhtqhswdnsfkbbymy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrZXlodHFoc3dkbnNma2JieW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDA5NTgsImV4cCI6MjA5NTUxNjk1OH0.sJs_Qha-KFaWALhrpfaGdT9UhUrCCe0gvOICTcYlM4A';

// Inisialisasi client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export instance client agar bisa digunakan di file lain
export { supabase };
