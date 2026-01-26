import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pxgqvfibmvcpuunltzkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z3F2ZmlibXZjcHV1bmx0emttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDE1NDksImV4cCI6MjA4NDk3NzU0OX0.XMXau4ZCIFAgwy2BeXxQFF-pmOdvx9yHYi5w1o2HnQA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
