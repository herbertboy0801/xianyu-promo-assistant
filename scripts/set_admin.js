import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load .env.local manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const nickname = process.argv[2];

if (!nickname) {
    console.log("Usage: node scripts/set_admin.js <nickname>");
    process.exit(1);
}

async function setAdmin() {
    console.log(`Promoting user '${nickname}' to admin...`);

    try {
        // 1. Get current user data
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('roles')
            .eq('nickname', nickname)
            .maybeSingle();

        if (fetchError) {
            console.error("Error fetching user:", fetchError.message);
            return;
        }

        if (!user) {
            console.error(`User '${nickname}' not found.`);
            return;
        }

        // 2. Update roles
        const currentRoles = user.roles || [];
        if (!currentRoles.includes('admin')) {
            const newRoles = [...currentRoles, 'admin'];

            const { error: updateError } = await supabase
                .from('users')
                .update({ roles: newRoles })
                .eq('nickname', nickname);

            if (updateError) {
                console.error("Error updating roles:", updateError.message);
            } else {
                console.log(`Success! User '${nickname}' is now an admin.`);
                console.log("New roles:", newRoles);
            }
        } else {
            console.log(`User '${nickname}' is already an admin.`);
        }

    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

setAdmin();
