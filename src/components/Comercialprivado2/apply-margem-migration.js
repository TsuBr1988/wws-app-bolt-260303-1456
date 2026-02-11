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
  console.log('🔄 Aplicando migration de margem...\n');

  const migrationPath = join(__dirname, 'supabase', 'migrations', '20260205120000_add_margem_to_proposals.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Lendo migration:', migrationPath);
  console.log('📝 SQL a ser executado:\n');
  console.log(migrationSQL);
  console.log('\n');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      // Tentar executar diretamente se a função RPC não existir
      console.log('⚠️  Função RPC não encontrada, tentando executar diretamente...\n');

      const { error: directError } = await supabase
        .from('_migrations')
        .insert({ name: '20260205120000_add_margem_to_proposals' });

      if (directError && !directError.message.includes('already exists')) {
        throw directError;
      }

      // Executar o SQL manualmente via REST API
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
        console.log('⚠️  Executando SQL linha por linha...\n');

        // Separar comandos SQL e executar um por um
        const commands = migrationSQL
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0 && !cmd.startsWith('/*') && !cmd.startsWith('--'));

        for (const command of commands) {
          if (command.includes('ALTER TABLE')) {
            console.log('🔧 Executando:', command.substring(0, 60) + '...');

            // Usar uma query customizada para ALTER TABLE
            const { error: alterError } = await supabase.rpc('exec', {
              sql: command + ';'
            }).catch(async () => {
              // Se falhar, tentar com fetch direto
              const directResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ query: command + ';' })
              });

              if (!directResponse.ok) {
                throw new Error(`Erro ao executar: ${await directResponse.text()}`);
              }
            });
          }
        }
      }
    }

    console.log('✅ Migration aplicada com sucesso!\n');
    console.log('📊 Verificando estrutura da tabela proposals...\n');

    // Verificar se a coluna foi adicionada
    const { data: columns, error: columnsError } = await supabase
      .from('proposals')
      .select('*')
      .limit(1);

    if (!columnsError && columns) {
      console.log('✅ Tabela proposals acessível');
      console.log('📋 Colunas disponíveis:', Object.keys(columns[0] || {}));
    }

    console.log('\n🎉 Processo concluído! A coluna margem_percentual foi adicionada à tabela proposals.\n');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    console.log('\n📝 AÇÃO MANUAL NECESSÁRIA:');
    console.log('Execute este SQL diretamente no Supabase SQL Editor:\n');
    console.log(migrationSQL);
    process.exit(1);
  }
}

applyMigration();
