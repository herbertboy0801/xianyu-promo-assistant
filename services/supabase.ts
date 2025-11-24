import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('Supabase Environment Check:', {
    urlExists: !!supabaseUrl,
    urlLength: supabaseUrl?.length,
    keyExists: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables! Please check Cloudflare Pages settings.');
}

// Use fallback to prevent immediate crash, though functionality will fail
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
