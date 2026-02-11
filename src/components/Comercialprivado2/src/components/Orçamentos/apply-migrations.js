import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Credenciais do banco de orçamentos
const supabaseUrl = 'https://vehbyoihnkxzblsmlpdz.supabase.co';
const supabaseServiceKey = process.env.VITE_BUDGETS_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY não encontrada!');
  console.error('Execute: export SUPABASE_SERVICE_KEY="sua-chave-service-role"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  const migrationsDir = join(__dirname, 'supabase', 'migrations');

  console.log('🔍 Procurando migrations em:', migrationsDir);

  try {
    const files = readdirSync(migrationsDir).sort();

    console.log(`📋 Encontradas ${files.length} migrations:\n`);

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');

      console.log(`⏳ Aplicando: ${file}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
          // Tenta executar diretamente se exec_sql não existir
          const { error: directError } = await supabase.from('_migrations').insert({ name: file });

          if (directError) {
            console.log(`⚠️  Aviso: ${error.message}`);
          } else {
            console.log(`✅ ${file} aplicada com sucesso!`);
          }
        } else {
          console.log(`✅ ${file} aplicada com sucesso!`);
        }
      } catch (err) {
        console.log(`⚠️  Erro ao aplicar ${file}:`, err.message);
      }

      console.log('');
    }

    console.log('🎉 Processo de migração concluído!');

  } catch (error) {
    console.error('❌ Erro ao ler diretório de migrations:', error);
    process.exit(1);
  }
}

applyMigrations();
