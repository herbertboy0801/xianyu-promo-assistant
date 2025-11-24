import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking 'global_settings' table...");

    try {
        // 1. Check existence by select
        const { data, error } = await supabase.from('global_settings').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("Error accessing table:", error.message);
            if (error.code === '42P01') {
                console.log("\n>>> DIAGNOSIS: Table 'global_settings' DOES NOT EXIST.");
            }
            return;
        }
        console.log("Table exists.");

        // 2. Check 'default' row
        console.log("Checking 'default' settings row...");
        const { data: defaultRow, error: fetchError } = await supabase
            .from('global_settings')
            .select('id, master_template')
            .eq('id', 'default')
            .maybeSingle();

        if (fetchError) {
            console.error("Error fetching default row:", fetchError.message);
        } else if (!defaultRow) {
            console.log("Row 'default' DOES NOT EXIST.");
        } else {
            console.log("Row 'default' exists.");
            console.log("Template length:", defaultRow.master_template ? defaultRow.master_template.length : 0);
        }

    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

check();
