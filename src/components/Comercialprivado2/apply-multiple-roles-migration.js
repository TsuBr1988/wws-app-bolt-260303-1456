/**
 * Script para aplicar migration de múltiplos papéis aos funcionários
 * Execute: node apply-multiple-roles-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env na raiz do projeto
dotenv.config({ path: resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Aplicando migration de múltiplos papéis...\n');

  try {
    // Adicionar novos campos
    console.log('1️⃣ Adicionando campos is_closer e is_sdr...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS is_closer boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_sdr boolean DEFAULT false;
      `
    });

    if (alterError) {
      // Tentar método alternativo se RPC não existir
      console.log('   Tentando método alternativo...');

      // Verificar se as colunas já existem
      const { data: columns } = await supabase
        .from('employees')
        .select('*')
        .limit(1);

      if (columns && columns.length > 0) {
        if (!('is_closer' in columns[0])) {
          console.log('   ⚠️ Não foi possível adicionar colunas via SQL direto.');
          console.log('   Por favor, execute este SQL manualmente no Supabase SQL Editor:');
          console.log('\n' + '='.repeat(60));
          console.log(`
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS is_closer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sdr boolean DEFAULT false;

-- Migrar dados existentes
UPDATE employees
SET is_closer = true
WHERE role = 'Closer';

UPDATE employees
SET is_sdr = true
WHERE role = 'SDR';

-- Garantir que admins não sejam nem closer nem SDR
UPDATE employees
SET is_closer = false, is_sdr = false
WHERE role = 'Admin';
          `);
          console.log('='.repeat(60) + '\n');
        } else {
          console.log('   ✅ Colunas já existem!');
        }
      }
    } else {
      console.log('   ✅ Campos adicionados com sucesso!');
    }

    // Migrar dados do role para is_closer
    console.log('\n2️⃣ Migrando Closers...');
    const { error: closerError } = await supabase
      .from('employees')
      .update({ is_closer: true })
      .eq('role', 'Closer');

    if (closerError) {
      console.error('   ❌ Erro ao migrar Closers:', closerError.message);
    } else {
      console.log('   ✅ Closers migrados!');
    }

    // Migrar dados do role para is_sdr
    console.log('\n3️⃣ Migrando SDRs...');
    const { error: sdrError } = await supabase
      .from('employees')
      .update({ is_sdr: true })
      .eq('role', 'SDR');

    if (sdrError) {
      console.error('   ❌ Erro ao migrar SDRs:', sdrError.message);
    } else {
      console.log('   ✅ SDRs migrados!');
    }

    // Garantir que Admins não sejam nem Closer nem SDR
    console.log('\n4️⃣ Ajustando Admins...');
    const { error: adminError } = await supabase
      .from('employees')
      .update({ is_closer: false, is_sdr: false })
      .eq('role', 'Admin');

    if (adminError) {
      console.error('   ❌ Erro ao ajustar Admins:', adminError.message);
    } else {
      console.log('   ✅ Admins ajustados!');
    }

    // Verificar resultado
    console.log('\n5️⃣ Verificando resultado...');
    const { data: employees, error: selectError } = await supabase
      .from('employees')
      .select('name, role, is_closer, is_sdr');

    if (selectError) {
      console.error('   ❌ Erro ao verificar:', selectError.message);
    } else {
      console.log('   ✅ Funcionários atualizados:');
      employees.forEach(emp => {
        const roles = [];
        if (emp.is_closer) roles.push('Closer');
        if (emp.is_sdr) roles.push('SDR');
        if (emp.role === 'Admin') roles.push('Admin');
        console.log(`      - ${emp.name}: ${roles.join(' + ') || 'Sem papel'}`);
      });
    }

    console.log('\n✅ Migration aplicada com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    process.exit(1);
  }
}

applyMigration();
