import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { getDatabase } from '@/lib/databaseResolver';
import { useToast } from '@/components/ui/use-toast';
import { seedCategoriasDRE } from '@/lib/seedCategoriasDRE';

const supabase = getDatabase('RH');

interface CategoriaDRE {
  id: string;
  codigo: string | null;
  nome: string;
  grupo: string;
  natureza: string | null;
  ordem: number | null;
}

export function CategoriasDRECard() {
  const [categorias, setCategorias] = useState<CategoriaDRE[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaDRE | null>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    grupo: '',
    natureza: '',
    ordem: ''
  });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_dre')
        .select('*')
        .order('ordem', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias DRE:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias DRE',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (categoria?: CategoriaDRE) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormData({
        codigo: categoria.codigo || '',
        nome: categoria.nome,
        grupo: categoria.grupo,
        natureza: categoria.natureza || '',
        ordem: categoria.ordem?.toString() || ''
      });
    } else {
      setEditingCategoria(null);
      setFormData({
        codigo: '',
        nome: '',
        grupo: '',
        natureza: '',
        ordem: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategoria(null);
    setFormData({
      codigo: '',
      nome: '',
      grupo: '',
      natureza: '',
      ordem: ''
    });
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.grupo.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome e Grupo são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      const payload = {
        codigo: formData.codigo.trim() || null,
        nome: formData.nome.trim(),
        grupo: formData.grupo.trim(),
        natureza: formData.natureza.trim() || null,
        ordem: formData.ordem ? parseInt(formData.ordem) : null
      };

      if (editingCategoria) {
        const { error } = await supabase
          .from('categorias_dre')
          .update(payload)
          .eq('id', editingCategoria.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Categoria atualizada com sucesso'
        });
      } else {
        const { error } = await supabase
          .from('categorias_dre')
          .insert([payload]);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Categoria criada com sucesso'
        });
      }

      handleCloseModal();
      loadCategorias();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a categoria',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const { error } = await supabase
        .from('categorias_dre')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso'
      });

      loadCategorias();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a categoria',
        variant: 'destructive'
      });
    }
  };

  const handleImportCategorias = async () => {
    if (!confirm('Deseja importar automaticamente todas as 97 categorias DRE? Categorias já existentes serão ignoradas.')) return;

    try {
      setImporting(true);
      const result = await seedCategoriasDRE();

      if (result.success) {
        toast({
          title: 'Importação concluída',
          description: result.message
        });

        if (result.errors.length > 0) {
          console.log('Avisos/Erros durante importação:', result.errors);
        }

        loadCategorias();
      } else {
        toast({
          title: 'Erro na importação',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erro ao importar categorias:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível importar as categorias',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-center text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Categorias DRE</h3>
              <p className="text-sm text-gray-600 mt-1">
                {categorias.length} {categorias.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}
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
              <div className="flex gap-2">
                <Button
                  onClick={handleImportCategorias}
                  size="sm"
                  variant="outline"
                  disabled={importing}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? 'Importando...' : 'Importar 97 Categorias'}
                </Button>
                <Button onClick={() => handleOpenModal()} size="sm" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Natureza</TableHead>
                      <TableHead className="text-center">Ordem</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nenhuma categoria cadastrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      categorias.map((categoria) => (
                        <TableRow key={categoria.id}>
                          <TableCell className="font-mono text-sm">{categoria.codigo || '-'}</TableCell>
                          <TableCell>{categoria.nome}</TableCell>
                          <TableCell>{categoria.grupo}</TableCell>
                          <TableCell>{categoria.natureza || '-'}</TableCell>
                          <TableCell className="text-center">{categoria.ordem || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenModal(categoria)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(categoria.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
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
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria DRE' : 'Nova Categoria DRE'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código (opcional)
              </label>
              <Input
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: 1.1.1, 2.1.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: recebimentos wws, Receita Bruta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo *
              </label>
              <Input
                value={formData.grupo}
                onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                placeholder="Ex: Receita Bruta, CSV - Custo Serviço Vendido"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Natureza
              </label>
              <select
                value={formData.natureza}
                onChange={(e) => setFormData({ ...formData, natureza: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione...</option>
                <option value="receita">Receita</option>
                <option value="custo">Custo</option>
                <option value="despesa">Despesa</option>
                <option value="subtotal">Subtotal</option>
                <option value="indicador">Indicador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordem
              </label>
              <Input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
                placeholder="Ex: 1, 2, 3..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
