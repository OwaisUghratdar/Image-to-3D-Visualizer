import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase URL and key are required. Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
