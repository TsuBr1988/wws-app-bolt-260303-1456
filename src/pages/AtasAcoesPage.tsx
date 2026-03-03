import { useState, useEffect } from 'react';
import { Plus, ListTodo, FileText, ClipboardList } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ActionForm } from '../components/actions/ActionForm';
import { ActionCard } from '../components/actions/ActionCard';
import { MeetingMinutesForm } from '../components/atas/MeetingMinutesForm';
import { MeetingMinutesCard } from '../components/atas/MeetingMinutesCard';
import { MeetingMinutesViewModal } from '../components/atas/MeetingMinutesViewModal';
import { getDatabase } from '../lib/databaseResolver';
import { useToast } from '../components/ui/use-toast';

const supabase = getDatabase('ATAS');

export interface Action {
  id: string;
  descricao: string;
  responsavel: string;
  data_prazo: string;
  status: 'a_fazer' | 'fazendo' | 'feito';
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface MeetingMinute {
  id: string;
  title: string;
  date: string;
  content: string;
  participants: string;
  created_at: string;
  updated_at: string;
}

export function AtasAcoesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'acoes' | 'atas'>('acoes');
  const [actions, setActions] = useState<Action[]>([]);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMeetingMinutesForm, setShowMeetingMinutesForm] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [editingMeetingMinute, setEditingMeetingMinute] = useState<MeetingMinute | null>(null);
  const [viewingMeetingMinute, setViewingMeetingMinute] = useState<MeetingMinute | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'a_fazer' | 'fazendo' | 'feito'>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [tempMeetingMinuteData, setTempMeetingMinuteData] = useState<{
    title: string;
    date: string;
    content: string;
    participants: string;
  } | null>(null);

  useEffect(() => {
    fetchActions();
    fetchMeetingMinutes();
    fetchUsers();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .order('data_prazo', { ascending: true });

      if (error) throw error;

      // Sort: completed actions last, then by deadline (earliest first)
      const sortedData = (data || []).sort((a, b) => {
        // If one is 'feito' and the other is not, 'feito' goes last
        if (a.status === 'feito' && b.status !== 'feito') return 1;
        if (a.status !== 'feito' && b.status === 'feito') return -1;

        // Otherwise, sort by deadline (earliest first)
        return new Date(a.data_prazo).getTime() - new Date(b.data_prazo).getTime();
      });

      setActions(sortedData);
    } catch (error) {
      console.error('Error fetching actions:', error);
      toast({
        title: 'Erro ao carregar ações',
        description: 'Não foi possível carregar as ações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMeetingMinutes = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_minutes')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setMeetingMinutes(data || []);
    } catch (error) {
      console.error('Error fetching meeting minutes:', error);
      toast({
        title: 'Erro ao carregar ATAs',
        description: 'Não foi possível carregar as ATAs.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAction = async (actionData: Omit<Action, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('actions').insert([actionData]);

      if (error) throw error;

      toast({
        title: 'Ação criada com sucesso!',
      });

      setShowForm(false);
      fetchActions();

      // Se houver dados temporários da ATA, voltar para o formulário de ATA
      if (tempMeetingMinuteData) {
        setShowMeetingMinutesForm(true);
      }
    } catch (error) {
      console.error('Error creating action:', error);
      toast({
        title: 'Erro ao criar ação',
        description: 'Não foi possível criar a ação.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAction = async (
    actionId: string,
    updates: Partial<Omit<Action, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      const { error } = await supabase
        .from('actions')
        .update(updates)
        .eq('id', actionId);

      if (error) throw error;

      toast({
        title: 'Ação atualizada com sucesso!',
      });

      setShowForm(false);
      setEditingAction(null);
      fetchActions();

      // Se houver dados temporários da ATA, voltar para o formulário de ATA
      if (tempMeetingMinuteData) {
        setShowMeetingMinutesForm(true);
      }
    } catch (error) {
      console.error('Error updating action:', error);
      toast({
        title: 'Erro ao atualizar ação',
        description: 'Não foi possível atualizar a ação.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return;

    try {
      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;

      toast({
        title: 'Ação excluída com sucesso!',
      });

      fetchActions();
    } catch (error) {
      console.error('Error deleting action:', error);
      toast({
        title: 'Erro ao excluir ação',
        description: 'Não foi possível excluir a ação.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateMeetingMinute = async (
    data: Omit<MeetingMinute, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { error } = await supabase.from('meeting_minutes').insert([data]);

      if (error) throw error;

      toast({
        title: 'ATA salva com sucesso!',
      });

      setShowMeetingMinutesForm(false);
      fetchMeetingMinutes();
    } catch (error) {
      console.error('Error creating meeting minute:', error);
      toast({
        title: 'Erro ao salvar ATA',
        description: 'Não foi possível salvar a ATA.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMeetingMinute = async (
    meetingMinuteId: string,
    data: Omit<MeetingMinute, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { error } = await supabase
        .from('meeting_minutes')
        .update(data)
        .eq('id', meetingMinuteId);

      if (error) throw error;

      toast({
        title: 'ATA atualizada com sucesso!',
      });

      setShowMeetingMinutesForm(false);
      setEditingMeetingMinute(null);
      fetchMeetingMinutes();
    } catch (error) {
      console.error('Error updating meeting minute:', error);
      toast({
        title: 'Erro ao atualizar ATA',
        description: 'Não foi possível atualizar a ATA.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMeetingMinute = async (meetingMinuteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ATA?')) return;

    try {
      const { error } = await supabase
        .from('meeting_minutes')
        .delete()
        .eq('id', meetingMinuteId);

      if (error) throw error;

      toast({
        title: 'ATA excluída com sucesso!',
      });

      fetchMeetingMinutes();
    } catch (error) {
      console.error('Error deleting meeting minute:', error);
      toast({
        title: 'Erro ao excluir ATA',
        description: 'Não foi possível excluir a ATA.',
        variant: 'destructive',
      });
    }
  };

  let filteredActions = actions;

  if (statusFilter !== 'all') {
    filteredActions = filteredActions.filter(action => action.status === statusFilter);
  }

  if (responsavelFilter !== 'all') {
    filteredActions = filteredActions.filter(action => action.responsavel === responsavelFilter);
  }

  const groupedActions = {
    a_fazer: filteredActions.filter(a => a.status === 'a_fazer'),
    fazendo: filteredActions.filter(a => a.status === 'fazendo'),
    feito: filteredActions.filter(a => a.status === 'feito'),
  };

  const AtasAcoesSidebar = ({ activeTab, setActiveTab }: {
    activeTab: 'acoes' | 'atas';
    setActiveTab: (tab: 'acoes' | 'atas') => void;
  }) => {
    const menuItems = [
      { id: 'acoes', label: 'Ações', icon: ListTodo, color: 'text-blue-500' },
      { id: 'atas', label: 'ATAs', icon: FileText, color: 'text-emerald-500' }
    ];

    return (
      <div className="w-48 bg-zinc-900/95 backdrop-blur-xl text-slate-300 flex flex-col fixed left-0 top-0 h-screen z-20 border-r border-white/5 shadow-2xl transition-all duration-300">
        <div className="h-20 flex items-center px-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center mr-2 shadow-lg shadow-blue-500/20">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Atas e Ações</h1>
            <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Menu</p>

          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as 'acoes' | 'atas')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg shadow-black/5'
                    : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}

                <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? item.color : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex text-slate-900 font-sans min-h-[calc(100vh-80px)]">
      <AtasAcoesSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 ml-48 p-3">
        {activeTab === 'acoes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ações</h2>
                <p className="text-gray-600 mt-1">Gerencie planos de ação e melhorias</p>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ação
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setStatusFilter(statusFilter === 'a_fazer' ? 'all' : 'a_fazer')}
                className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all hover:shadow-md ${
                  statusFilter === 'a_fazer' ? 'ring-2 ring-red-500 shadow-md' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium mb-1">A Fazer</p>
                    <p className="text-3xl font-bold text-red-600">{groupedActions.a_fazer.length}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <ListTodo className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter(statusFilter === 'fazendo' ? 'all' : 'fazendo')}
                className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all hover:shadow-md ${
                  statusFilter === 'fazendo' ? 'ring-2 ring-yellow-500 shadow-md' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium mb-1">Fazendo</p>
                    <p className="text-3xl font-bold text-yellow-600">{groupedActions.fazendo.length}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <ListTodo className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter(statusFilter === 'feito' ? 'all' : 'feito')}
                className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all hover:shadow-md ${
                  statusFilter === 'feito' ? 'ring-2 ring-green-500 shadow-md' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium mb-1">Feito</p>
                    <p className="text-3xl font-bold text-green-600">{groupedActions.feito.length}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <ListTodo className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 min-w-fit">Filtrar por status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">Todos os status</option>
                    <option value="a_fazer">A Fazer</option>
                    <option value="fazendo">Fazendo</option>
                    <option value="feito">Feito</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 min-w-fit">Filtrar por responsável:</span>
                  <select
                    value={responsavelFilter}
                    onChange={(e) => setResponsavelFilter(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">Todos os responsáveis</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredActions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                  <ListTodo className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    Nenhuma ação encontrada
                  </p>
                  <p className="text-gray-400 text-sm">
                    {statusFilter !== 'all'
                      ? 'Tente ajustar os filtros'
                      : "Clique em 'Nova Ação' para começar"}
                  </p>
                </div>
              ) : (
                filteredActions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    onEdit={() => {
                      setEditingAction(action);
                      setShowForm(true);
                    }}
                    onDelete={() => handleDeleteAction(action.id)}
                    onStatusChange={(newStatus) =>
                      handleUpdateAction(action.id, { status: newStatus })
                    }
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'atas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">ATAs</h2>
                <p className="text-gray-600 mt-1">Gerencie atas de reuniões</p>
              </div>
              <Button onClick={() => setShowMeetingMinutesForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Começar ATA
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total de ATAs</p>
                    <p className="text-3xl font-bold text-gray-900">{meetingMinutes.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {meetingMinutes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    Nenhuma ATA registrada
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    Clique em &apos;Começar ATA&apos; para criar sua primeira ata de reunião
                  </p>
                </div>
              ) : (
                meetingMinutes.map((minute) => (
                  <MeetingMinutesCard
                    key={minute.id}
                    meetingMinute={minute}
                    onEdit={() => {
                      setEditingMeetingMinute(minute);
                      setShowMeetingMinutesForm(true);
                    }}
                    onDelete={() => handleDeleteMeetingMinute(minute.id)}
                    onView={() => setViewingMeetingMinute(minute)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <ActionForm
          action={editingAction}
          onClose={() => {
            setShowForm(false);
            setEditingAction(null);
            // Se houver dados temporários da ATA, voltar para o formulário de ATA
            if (tempMeetingMinuteData) {
              setShowMeetingMinutesForm(true);
            }
          }}
          onSubmit={(data) => {
            if (editingAction) {
              handleUpdateAction(editingAction.id, data);
            } else {
              handleCreateAction(data);
            }
          }}
        />
      )}

      {showMeetingMinutesForm && (
        <MeetingMinutesForm
          meetingMinute={editingMeetingMinute}
          tempData={tempMeetingMinuteData}
          onClose={() => {
            setShowMeetingMinutesForm(false);
            setEditingMeetingMinute(null);
            setTempMeetingMinuteData(null);
          }}
          onSave={(data) => {
            setTempMeetingMinuteData(null);
            if (editingMeetingMinute) {
              return handleUpdateMeetingMinute(editingMeetingMinute.id, data);
            } else {
              return handleCreateMeetingMinute(data);
            }
          }}
          onAddAction={(currentData) => {
            setTempMeetingMinuteData(currentData);
            setShowMeetingMinutesForm(false);
            setShowForm(true);
          }}
        />
      )}

      {viewingMeetingMinute && (
        <MeetingMinutesViewModal
          meetingMinute={viewingMeetingMinute}
          onClose={() => setViewingMeetingMinute(null)}
          onAddAction={() => {
            setViewingMeetingMinute(null);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}
