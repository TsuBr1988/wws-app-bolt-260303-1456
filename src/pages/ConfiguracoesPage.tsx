import { ClientsCard } from '@/components/config/ClientsCard';
import { DepartmentsCard } from '@/components/config/DepartmentsCard';
import { UsersManagementCard } from '@/components/config/UsersManagementCard';
import { CategoriasDRECard } from '@/components/config/CategoriasDRECard';
import { useAuth } from '@/hooks/useAuth';

export function ConfiguracoesPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
          <p className="text-gray-600">Gerencie as configurações do sistema</p>
        </div>
      </div>

      <div className="grid gap-6">
        {user?.is_admin && <UsersManagementCard />}
        <ClientsCard />
        <DepartmentsCard />
        <CategoriasDRECard />
      </div>
    </div>
  );
}
