
// Re-export everything from the Supabase utility files
export * from './supabase/client';
export * from './supabase/types';
export * from './supabase/users';
export * from './supabase/wheelData';
export * from './supabase/feedback';
export * from './supabase/subscriptions';
export * from './supabase/databaseCheck';  // Make sure this is included

// This was missing from the exports - explicitly include it to fix the import error
export { initializeDefaultUsers } from './supabase/users';  // Export initializeDefaultUsers explicitly
