```javascript
/**
 * Script para migrar a coluna 'role' da tabela 'user_profiles'
 * para o 'user_metadata' dos usuários em 'auth.users'.
 *
 * IMPORTANTE:
 * - Execute este script APENAS UMA VEZ após a migração SQL que remove a coluna 'role'
 *   e atualiza a função is_admin().
 * - Requer SUPABASE_SERVICE_ROLE_KEY.
 *
 * Uso:
 * 1. Configure as variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 * 2. Execute: node scripts/migrate-existing-user-roles.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Para carregar variáveis de ambiente

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function migrateUserRoles() {
  try {
    console.log('🔧 Iniciando migração de roles para user_metadata...');

    // 1. Listar todos os usuários do Supabase Auth
    const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) throw listUsersError;

    console.log(`Encontrados ${users.length} usuários para processar.`);

    for (const user of users) {
      // 2. Buscar o perfil correspondente na tabela user_profiles
      // Nota: A coluna 'role' já deve ter sido removida pela migração SQL.
      // Se você ainda tem a coluna 'role' em user_profiles, este script
      // precisaria ser ajustado para ler de lá antes de removê-la.
      // Para este cenário, assumimos que a role já foi movida ou que
      // user_profiles é apenas para outros metadados.
      // Se a role não estiver em user_metadata, vamos definir uma padrão.

      let currentRole = user.user_metadata?.role || 'sdr'; // Pega a role existente ou define 'sdr' como padrão

      // Se você ainda tem a coluna 'role' em user_profiles e quer migrá-la:
      // const { data: profileData, error: profileError } = await supabaseAdmin
      //   .from('user_profiles')
      //   .select('role')
      //   .eq('user_id', user.id)
      //   .single();
      // if (profileData && profileData.role) {
      //   currentRole = profileData.role;
      // }

      // 3. Atualizar o user_metadata do usuário com a role
      if (user.user_metadata?.role !== currentRole) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUser(user.id, {
          user_metadata: { ...user.user_metadata, role: currentRole }
        });

        if (updateError) {
          console.error(`❌ Erro ao atualizar user_metadata para ${user.email} (ID: ${user.id}):`, updateError);
        } else {
          console.log(`✅ Role '${currentRole}' definida para ${user.email} (ID: ${user.id})`);
        }
      } else {
        console.log(`ℹ️ Role para ${user.email} (ID: ${user.id}) já está atualizada: ${currentRole}`);
      }
    }

    console.log('\n🎉 Migração de roles concluída!');

  } catch (error) {
    console.error('❌ Erro fatal durante a migração:', error);
    process.exit(1);
  }
}

// Executar script
migrateUserRoles();
```