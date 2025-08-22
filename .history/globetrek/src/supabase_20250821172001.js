import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itoosdrmynwaemptstel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b29zZHJteW53YWVtcHRzdGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3Nzc0MjksImV4cCI6MjA3MTM1MzQyOX0.rgHZYedQNQ5bd5zK7PjgxZyxHW5Y59haZ8YRct00w_o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);