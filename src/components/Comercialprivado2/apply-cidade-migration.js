#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://zqqwcjujsiqotlyogyoj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcXdjanVqc2lxb3RseW9neW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI0MzY5NiwiZXhwIjoyMDY3ODE5Njk2fQ.-WGECGNqci0PUtrbaB0H0NGBd8xXglbbza-xADX_RnE';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function applyMigration() {
  console.log('🔄 Aplicando migration de cidade...\n');

  const migrationSQL = `
-- Adicionar coluna cidade
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS cidade text;
`.trim();

  console.log('📝 SQL a ser executado:\n');
  console.log(migrationSQL);
  console.log('\n');

  try {
    console.log('⚠️  Executando SQL...\n');

    // Tentar executar diretamente
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      console.log('⚠️  Função RPC não encontrada, tentando método alternativo...\n');

      // Executar via fetch direto
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql_query: migrationSQL })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${await response.text()}`);
      }
    }

    console.log('✅ Migration aplicada com sucesso!\n');
    console.log('📊 Verificando estrutura da tabela proposals...\n');

    // Verificar se a coluna foi adicionada
    const { data: columns, error: columnsError } = await supabase
      .from('proposals')
      .select('*')
      .limit(1);

    if (!columnsError && columns && columns.length > 0) {
      console.log('✅ Tabela proposals acessível');
      console.log('📋 Colunas disponíveis:', Object.keys(columns[0]));

      if ('cidade' in columns[0]) {
        console.log('✅ Coluna "cidade" foi adicionada com sucesso!');
      }
    }

    console.log('\n🎉 Processo concluído! A coluna cidade foi adicionada à tabela proposals.\n');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    console.log('\n📝 AÇÃO MANUAL NECESSÁRIA:');
    console.log('Execute este SQL diretamente no Supabase SQL Editor:\n');
    console.log('https://supabase.com/dashboard/project/zqqwcjujsiqotlyogyoj/sql\n');
    console.log(migrationSQL);
    console.log('\n');
    process.exit(1);
  }
}

applyMigration();
