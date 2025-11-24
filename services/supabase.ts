import { createClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('Supabase Environment Check:', {
    urlExists: !!supabaseUrl,
    urlLength: supabaseUrl?.length,
    urlStart: supabaseUrl?.substring(0, 15), // Log start to check for "http" or quotes
    keyExists: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length,
    keyStart: supabaseAnonKey?.substring(0, 15) // Log start to check for "eyJ"
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables! Please check Cloudflare Pages settings.');
}

// Use fallback to prevent immediate crash, though functionality will fail
// Ensure URL is at least valid-ish to prevent "Invalid URL" error from throwing immediately if possible, 
// though createClient validates it strictly.
const validUrl = supabaseUrl && (supabaseUrl.startsWith('http') || supabaseUrl.startsWith('https'))
    ? supabaseUrl
    : 'https://placeholder.supabase.co';

export const supabase = createClient(
    validUrl,
    supabaseAnonKey || 'placeholder'
);
