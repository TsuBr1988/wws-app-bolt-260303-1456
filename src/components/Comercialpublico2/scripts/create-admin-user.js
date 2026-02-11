/**
 * Script para criar usuário administrativo
 * 
 * IMPORTANTE: Execute este script apenas uma vez após aplicar as migrações
 * 
 * Uso:
 * 1. Configure as variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 * 2. Execute: node scripts/create-admin-user.js
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (usar service role key)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPassword = process.env.SUPA_ADMIN_PASS || 'Piguinha22@@';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPA_ADMIN_PASS');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAdminUser() {
  try {
    console.log('🔧 Criando usuário administrativo...');
    
    // Criar usuário admin
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'auditoria@grupowws.com.br',
      password: adminPassword,
      email_confirm: true,
      user_metadata: { 
        name: 'Auditoria Grupo WWS',
        role: 'admin' 
      }
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('⚠️  Usuário já existe, atualizando perfil...');
        
        // Buscar usuário existente
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const adminUser = existingUser.users.find(u => u.email === 'auditoria@grupowws.com.br');
        
        if (adminUser) {
          // Atualizar perfil para admin
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ role: 'admin', name: 'Auditoria Grupo WWS' })
            .eq('user_id', adminUser.id);
            
          if (updateError) {
            console.error('❌ Erro ao atualizar perfil:', updateError);
          } else {
            console.log('✅ Perfil atualizado para admin com sucesso!');
          }
        }
      } else {
        throw createError;
      }
    } else {
      console.log('✅ Usuário administrativo criado com sucesso!');
      console.log(`📧 Email: auditoria@grupowws.com.br`);
      console.log(`🔑 Senha: ${adminPassword}`);
      console.log(`👤 ID: ${user.user.id}`);
    }

    // Verificar se o perfil foi criado automaticamente
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'auditoria@grupowws.com.br')
      .single();

    if (profileError) {
      console.error('❌ Erro ao verificar perfil:', profileError);
    } else {
      console.log('✅ Perfil verificado:', {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      });
    }

    console.log('\n🎉 Setup completo! Agora você pode fazer login no sistema.');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

// Executar script
createAdminUser();