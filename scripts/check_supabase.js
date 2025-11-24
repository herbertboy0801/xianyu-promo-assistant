import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load .env.local manually since we are running this script directly with node
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

async function check() {
    console.log("Checking Supabase connection...");
    console.log("URL:", supabaseUrl);

    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("Error connecting to 'users' table:", error.message);
            console.error("Details:", error);
            if (error.code === '42P01') {
                console.log("\n>>> DIAGNOSIS: Table 'users' does not exist. You need to run the SQL script.");
            }
        } else {
            console.log("Success! 'users' table exists.");

            // Test Insert
            console.log("Testing INSERT permission...");
            const testUser = {
                nickname: 'test_script_user_' + Date.now(),
                roles: ['promoter'],
                join_date: Date.now()
            };

            const { data: insertData, error: insertError } = await supabase.from('users').insert(testUser).select();

            if (insertError) {
                console.error("INSERT failed:", insertError.message);
                console.error("Details:", insertError);
                if (insertError.code === '42501') {
                    console.log("\n>>> DIAGNOSIS: RLS (Row Level Security) is blocking writes. You need to add a policy.");
                }
            } else {
                console.log("INSERT successful!", insertData);
                // Cleanup
                await supabase.from('users').delete().eq('nickname', testUser.nickname);
            }
        }
    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

check();
