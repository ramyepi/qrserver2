import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Default configuration for development
const DEFAULT_SUPABASE_URL = "https://fxtonkqhvjbgrxagwcdu.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4dG9ua3FodmpiZ3J4YWd3Y2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzI3MzcsImV4cCI6MjA2ODI0ODczN30._bXNwSokGSYlEmPjnER135s9fPC5jI-ZMMjB00LGLvA";

// Create initial client with default configuration
export const supabase = createClient<Database>(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Function to update client configuration
export const updateSupabaseConfig = (url: string, key: string) => {
  Object.assign(supabase, createClient<Database>(url, key, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }));
};