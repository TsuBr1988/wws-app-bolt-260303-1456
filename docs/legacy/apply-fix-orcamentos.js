#!/usr/bin/env node

/**
 * Script para aplicar a correção da função copy_budget_as_new
 * no banco de orçamentos (https://vehbyoihnkxzblsmlpdz.supabase.co)
 *
 * USO:
 *   node apply-fix-orcamentos.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do banco de orçamentos
const SUPABASE_URL = 'https://vehbyoihnkxzblsmlpdz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ5b2lobmt4emJsc21scGR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkyMTczMCwiZXhwIjoyMDc0NDk3NzMwfQ.uvU-Dnq3sNdhkk854O3kQWv7b7wrxFN7vuYp86zbnEE';

async function executeSql(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${error}`);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

async function executeViaPgRest(sql) {
  // Usar a API REST do Supabase para executar SQL
  const url = `${SUPABASE_URL}/rest/v1/`;

  try {
    // Dividir o SQL em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log(`\n📋 Total de ${commands.length} comandos SQL para executar\n`);

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      console.log(`\n[${i + 1}/${commands.length}] Executando comando...`);
      console.log(`  ${cmd.substring(0, 80)}${cmd.length > 80 ? '...' : ''}\n`);

      // Executar via função do Supabase
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_string: cmd + ';' })
      });

      if (!response.ok) {
        console.error(`  ❌ Erro no comando ${i + 1}`);
        const error = await response.text();
        console.error(`  Detalhes: ${error}\n`);
        // Continuar para próximo comando
      } else {
        console.log(`  ✅ Comando executado com sucesso\n`);
      }
    }

    return true;
  } catch (error) {
    throw error;
  }
}

async function main() {
  console.log('🔧 Aplicando correção da função copy_budget_as_new');
  console.log('📊 Banco: https://vehbyoihnkxzblsmlpdz.supabase.co\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = join(__dirname, 'fix_copy_budget_orcamentos.sql');
    console.log(`📖 Lendo arquivo: ${sqlPath}\n`);

    const sqlContent = readFileSync(sqlPath, 'utf-8');

    // Remover comentários de bloco
    let cleanSql = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remover comentários de linha
    cleanSql = cleanSql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    console.log('📝 Conteúdo SQL carregado e preparado\n');
    console.log('⚠️  ATENÇÃO: Este script irá atualizar a função copy_budget_as_new');
    console.log('           no banco de orçamentos. Continue? (Ctrl+C para cancelar)\n');

    // Aguardar 3 segundos antes de executar
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🚀 Executando SQL no banco de orçamentos...\n');
    console.log('━'.repeat(60));

    // Tentar executar SQL direto
    // Nota: Supabase não tem endpoint direto para SQL, então vamos usar o psql ou instruir o usuário
    console.log('\n⚠️  Este script requer acesso direto ao PostgreSQL');
    console.log('    Para executar a correção, você tem 2 opções:\n');
    console.log('    OPÇÃO 1: Via Dashboard do Supabase');
    console.log('    1. Acesse: https://supabase.com/dashboard/project/vehbyoihnkxzblsmlpdz');
    console.log('    2. Vá para "SQL Editor"');
    console.log('    3. Cole o conteúdo do arquivo: fix_copy_budget_orcamentos.sql');
    console.log('    4. Execute o script\n');
    console.log('    OPÇÃO 2: Via psql (linha de comando)');
    console.log('    Execute no terminal:');
    console.log(`    psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" < fix_copy_budget_orcamentos.sql\n`);

    // Salvar arquivo com instruções
    const instructions = `
# INSTRUÇÕES PARA APLICAR A CORREÇÃO

## Problema Identificado
A função \`copy_budget_as_new\` no banco de orçamentos está tentando copiar
colunas que não existem na tabela \`budget_calculations\` (total_payroll,
total_benefits, total_encargos).

## Solução
Aplicar o arquivo \`fix_copy_budget_orcamentos.sql\` no banco de orçamentos.

## Banco de Dados Alvo
- URL: https://vehbyoihnkxzblsmlpdz.supabase.co
- Este é o banco de ORÇAMENTOS (não o banco principal)

## Como Aplicar

### Opção 1: Via Dashboard do Supabase (RECOMENDADO)
1. Acesse: https://supabase.com/dashboard/project/vehbyoihnkxzblsmlpdz
2. Faça login com suas credenciais
3. Vá para a seção "SQL Editor" no menu lateral
4. Clique em "New Query"
5. Copie todo o conteúdo do arquivo \`fix_copy_budget_orcamentos.sql\`
6. Cole no editor
7. Clique em "RUN" ou pressione Ctrl+Enter
8. Aguarde a mensagem de sucesso: "✅ Função copy_budget_as_new criada/atualizada com sucesso!"

### Opção 2: Via Linha de Comando (psql)
Se você tem acesso via psql:

\`\`\`bash
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" < fix_copy_budget_orcamentos.sql
\`\`\`

Substitua:
- [PROJECT-REF] pelo ref do projeto: vehbyoihnkxzblsmlpdz
- [PASSWORD] pela senha do banco

## O que o Script Faz
1. Cria/atualiza a função auxiliar \`get_next_budget_number\`
2. Remove a versão antiga da função \`copy_budget_as_new\`
3. Cria a versão correta que NÃO tenta copiar \`budget_calculations\`
4. Valida que a função foi criada corretamente

## Após Aplicar
Teste copiando um orçamento no sistema. O erro não deve mais ocorrer.

## Observações Importantes
- ⚠️  Execute este script APENAS no banco de orçamentos
- ⚠️  NÃO execute no banco principal do projeto
- ✅  É seguro executar múltiplas vezes (idempotente)
- ✅  Não afeta dados existentes, apenas atualiza a função
`;

    const fs = await import('fs');
    fs.writeFileSync(join(__dirname, 'INSTRUCOES_FIX_COPY_BUDGET.md'), instructions);

    console.log('━'.repeat(60));
    console.log('\n✅ Arquivo de instruções criado: INSTRUCOES_FIX_COPY_BUDGET.md\n');
    console.log('📄 O arquivo fix_copy_budget_orcamentos.sql está pronto para ser aplicado');
    console.log('📖 Leia INSTRUCOES_FIX_COPY_BUDGET.md para detalhes de como aplicar\n');

  } catch (error) {
    console.error('\n❌ Erro ao preparar correção:', error.message);
    console.error('\nDetalhes do erro:', error);
    process.exit(1);
  }
}

main();
