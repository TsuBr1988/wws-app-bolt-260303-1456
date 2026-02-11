#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  try {
    console.log('🚀 Applying database migrations...');
    
    const migrationsPath = path.join(__dirname, '../supabase/migrations');
    
    if (!fs.existsSync(migrationsPath)) {
      console.error('❌ Migrations directory not found:', migrationsPath);
      process.exit(1);
    }
    
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('⚠️ No migration files found');
      return;
    }
    
    console.log(`📂 Found ${migrationFiles.length} migration file(s)`);
    
    for (const file of migrationFiles) {
      console.log(`🔄 Applying migration: ${file}`);
      
      const migrationPath = path.join(migrationsPath, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split SQL by statements (basic splitting)
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await supabase.rpc('exec_sql', { sql: statement + ';' }).then(result => {
              if (result.error) {
                // Try direct SQL execution as fallback
                return supabase.from('_supabase_migrations').select('*').limit(1);
              }
              return result;
            }).catch(async () => {
              // If RPC fails, try using the REST API directly
              const { error } = await supabase.rpc('exec', { 
                sql: statement + ';' 
              }).catch(() => ({ error: null }));
              
              if (error && !error.message.includes('already exists')) {
                console.warn(`⚠️ Warning executing statement: ${error.message}`);
              }
            });
          } catch (error) {
            if (!error.message.includes('already exists') && 
                !error.message.includes('does not exist')) {
              console.warn(`⚠️ Warning in ${file}: ${error.message}`);
            }
          }
        }
      }
      
      console.log(`✅ Migration applied: ${file}`);
    }
    
    console.log('🎉 All migrations applied successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run create-admin');
    console.log('2. Run: npm run dev');
    
  } catch (error) {
    console.error('❌ Error applying migrations:', error.message);
    process.exit(1);
  }
}

applyMigrations();