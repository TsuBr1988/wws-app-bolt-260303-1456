import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardService } from '@/services/dashboardService';
import { Client } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';

export function ClientsCard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCompany, setEditCompany] = useState<'WWS' | 'Worldwide' | null>(null);
  const [editTipo, setEditTipo] = useState<'Público' | 'Privado' | null>(null);
  const [editCidade, setEditCidade] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState<'WWS' | 'Worldwide' | null>(null);
  const [newClientTipo, setNewClientTipo] = useState<'Público' | 'Privado' | null>(null);
  const [newClientCidade, setNewClientCidade] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await DashboardService.getClients();
      setClients(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Não foi possível carregar a lista de clientes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleAdd = async () => {
    if (!newClientName.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do cliente não pode estar vazio.',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      console.log('Creating client:', {
        name: newClientName.trim(),
        company: newClientCompany,
        tipo: newClientTipo,
        cidade: newClientCidade.trim() || null,
      });

      await DashboardService.createClient(
        newClientName.trim(),
        newClientCompany,
        newClientTipo,
        newClientCidade.trim() || null
      );
      setNewClientName('');
      setNewClientCompany(null);
      setNewClientTipo(null);
      setNewClientCidade('');
      await loadClients();
      toast({
        title: 'Sucesso',
        description: 'Cliente adicionado com sucesso.',
      });
    } catch (error) {
      console.error('Error creating client:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao adicionar',
        description: `Não foi possível adicionar o cliente. ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setEditValue(client.name);
    setEditCompany(client.company);
    setEditTipo(client.tipo);
    setEditCidade(client.cidade || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do cliente não pode estar vazio.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await DashboardService.updateClient(
        id,
        editValue.trim(),
        editCompany,
        editTipo,
        editCidade.trim() || null
      );
      setEditingId(null);
      await loadClients();
      toast({
        title: 'Sucesso',
        description: 'Cliente atualizado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o cliente.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditCompany(null);
    setEditTipo(null);
    setEditCidade('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await DashboardService.deleteClient(id);
      await loadClients();
      toast({
        title: 'Sucesso',
        description: 'Cliente excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o cliente. Verifique se não há dados relacionados a este cliente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-6 bg-gray-50 border-gray-200">
      <div className="space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Clientes</h3>
            <p className="text-sm text-gray-600 mt-1">
              {clients.length} {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <Input
                  type="text"
                  placeholder="Nome do cliente"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                  className="col-span-1"
                />
                <select
                  value={newClientCompany || ''}
                  onChange={(e) => setNewClientCompany(e.target.value as 'WWS' | 'Worldwide' || null)}
                  className="col-span-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione empresa</option>
                  <option value="WWS">WWS</option>
                  <option value="Worldwide">Worldwide</option>
                </select>
                <select
                  value={newClientTipo || ''}
                  onChange={(e) => setNewClientTipo(e.target.value as 'Público' | 'Privado' || null)}
                  className="col-span-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione tipo</option>
                  <option value="Público">Público</option>
                  <option value="Privado">Privado</option>
                </select>
                <Input
                  type="text"
                  placeholder="Cidade"
                  value={newClientCidade}
                  onChange={(e) => setNewClientCidade(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                  className="col-span-1"
                />
              </div>
              <Button onClick={handleAdd} disabled={isAdding || !newClientName.trim()} className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Cliente
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Cliente</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        Nenhum cliente cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          {editingId === client.id ? (
                            <Input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(client.id)}
                              className="w-full"
                              autoFocus
                            />
                          ) : (
                            client.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === client.id ? (
                            <select
                              value={editCompany || ''}
                              onChange={(e) => setEditCompany(e.target.value as 'WWS' | 'Worldwide' || null)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="">-</option>
                              <option value="WWS">WWS</option>
                              <option value="Worldwide">Worldwide</option>
                            </select>
                          ) : (
                            client.company || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === client.id ? (
                            <select
                              value={editTipo || ''}
                              onChange={(e) => setEditTipo(e.target.value as 'Público' | 'Privado' || null)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="">-</option>
                              <option value="Público">Público</option>
                              <option value="Privado">Privado</option>
                            </select>
                          ) : (
                            client.tipo || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === client.id ? (
                            <Input
                              type="text"
                              value={editCidade}
                              onChange={(e) => setEditCidade(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(client.id)}
                              className="w-full"
                            />
                          ) : (
                            client.cidade || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === client.id ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(client.id)}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4 text-gray-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(client)}
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(client.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
