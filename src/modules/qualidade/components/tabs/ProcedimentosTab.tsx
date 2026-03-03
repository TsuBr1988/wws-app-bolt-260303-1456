import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, ClipboardList, FileCheck, FileText, Shield, Wrench, Pencil, Plus, ArrowLeft, Database, Table, ChartBar as BarChart, Scale, Signature as FileSignature, Gavel, ChevronRight, Loader as Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import * as qualidadeService from '@/services/qualidadeService';
import type { ProcedimentoDepartamento, ProcedimentoPasta } from '@/services/qualidadeService';

type DepartmentIcon = 'book-open' | 'settings' | 'clipboard-list' | 'shield' | 'wrench' | 'git-branch' | 'file-text';

interface ProcedureDepartment {
  id: string;
  name: string;
  icon: DepartmentIcon;
  description: string;
}

interface ProcedureItem {
  id: string;
  departmentId: string;
  pastaId: string;
  elaboradoPor: string;
  tipo: string;
  nomeProcedimento?: string;
  objetivos?: string;
  documentosRelacionados?: string;
  definicoes?: string;
  responsabilidades?: string;
  escopo?: string;
  fluxoOperacionalizacao?: string;
  sistematica?: string;
  gestaoIndicadores?: ProcedureIndicatorRow[];
  createdAt: string;
}

interface ProcedureIndicatorRow {
  id: string;
  nomeIndicador: string;
  oQueMede: string;
  metrica: string;
  periodicidade: string;
}

const ELABORADO_POR_OPTIONS = [
  'Gustavo Suzigan',
  'Alexandre Quelhas',
  'Fátima de Araújo',
  'Mary Hellen Cayres',
  'Sergio Franzati',
  'Tales Favaro',
  'Andressa Cordeiro',
];

const TIPO_OPTIONS = [
  'Procedimentos de Gestão',
  'Instrução de trabalho',
  'Manuais Operacionais',
  'Fluxograma de Processo',
  'Formulários Operacionais',
];

const DETAILED_TIPOS = new Set([
  'Procedimentos de Gestão',
  'Instrução de trabalho',
  'Manuais Operacionais',
]);

const iconByKey: Record<DepartmentIcon, React.ComponentType<{ className?: string }>> = {
  'book-open': BookOpen,
  'settings': Shield,
  'clipboard-list': ClipboardList,
  'shield': Shield,
  'wrench': Wrench,
  'git-branch': FileText,
  'file-text': FileText,
};

const iconBySlug: Record<string, React.ComponentType<{ className?: string }>> = {
  'FileText': FileText,
  'Wrench': Wrench,
  'Shield': Shield,
  'BookOpen': BookOpen,
  'ClipboardList': ClipboardList,
  'Database': Database,
  'Table': Table,
  'BarChart': BarChart,
  'Scale': Scale,
  'FileSignature': FileSignature,
  'Gavel': Gavel,
};

const ProcedimentosTab: React.FC = () => {
  const { user, canEditIndicator } = useAuth();
  const { toast } = useToast();

  const [currentView, setCurrentView] = useState<'departments' | 'folders' | 'procedures'>('departments');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<ProcedimentoDepartamento[]>([]);
  const [folders, setFolders] = useState<ProcedimentoPasta[]>([]);
  const [procedures, setProcedures] = useState<qualidadeService.Procedimento[]>([]);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');

  const [showProcedureForm, setShowProcedureForm] = useState(false);
  const [procedureFormMode, setProcedureFormMode] = useState<'create' | 'view' | 'edit'>('create');
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
  const [elaboradoPor, setElaboradoPor] = useState(ELABORADO_POR_OPTIONS[0]);
  const [tipo, setTipo] = useState(TIPO_OPTIONS[0]);
  const [nomeProcedimento, setNomeProcedimento] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [documentosRelacionados, setDocumentosRelacionados] = useState('');
  const [definicoes, setDefinicoes] = useState('');
  const [responsabilidades, setResponsabilidades] = useState('');
  const [escopo, setEscopo] = useState('');
  const [fluxoOperacionalizacao, setFluxoOperacionalizacao] = useState('');
  const [sistematica, setSistematica] = useState('');
  const [gestaoIndicadores, setGestaoIndicadores] = useState<ProcedureIndicatorRow[]>([]);

  const isAdmin = user?.is_admin === true;
  const isQualityManager = !isAdmin && canEditIndicator('qualidade', 'Procedimentos');
  const canCreateDepartment = isAdmin || isQualityManager;
  const canEditDepartment = isAdmin || isQualityManager;
  const canCreateProcedure = isAdmin || isQualityManager;
  const canEditProcedure = isAdmin || isQualityManager;

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId]
  );

  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) ?? null,
    [folders, selectedFolderId]
  );

  const showDetailedFields = DETAILED_TIPOS.has(tipo);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    const result = await qualidadeService.getDepartamentos();
    if (result.success && result.data) {
      setDepartments(result.data);
    } else {
      setError(result.error || 'Erro ao carregar departamentos');
    }
    setLoading(false);
  };

  const handleSelectDepartment = async (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setCurrentView('folders');
    setLoading(true);
    setError(null);

    const result = await qualidadeService.getPastasWithCount(departmentId);
    if (result.success && result.data) {
      setFolders(result.data);
    } else {
      setError(result.error || 'Erro ao carregar pastas');
    }
    setLoading(false);
  };

  const handleSelectFolder = async (folderId: string) => {
    setSelectedFolderId(folderId);
    setCurrentView('procedures');
    setLoading(true);
    setError(null);

    const result = await qualidadeService.getProcedimentosByPasta(folderId);
    if (result.success && result.data) {
      setProcedures(result.data);
    } else {
      setError(result.error || 'Erro ao carregar procedimentos');
    }
    setLoading(false);
  };

  const handleGoBack = () => {
    if (currentView === 'procedures') {
      setCurrentView('folders');
      setSelectedFolderId(null);
      setProcedures([]);
    } else if (currentView === 'folders') {
      setCurrentView('departments');
      setSelectedDepartmentId(null);
      setFolders([]);
    }
  };

  const resetDepartmentForm = () => {
    setDepartmentName('');
    setDepartmentDescription('');
    setEditingDepartmentId(null);
    setShowDepartmentForm(false);
  };

  const openCreateDepartmentForm = () => {
    setEditingDepartmentId(null);
    setDepartmentName('');
    setDepartmentDescription('');
    setShowDepartmentForm(true);
  };

  const openEditDepartmentForm = (department: ProcedimentoDepartamento) => {
    setEditingDepartmentId(department.id);
    setDepartmentName(department.name);
    setDepartmentDescription(department.description || '');
    setShowDepartmentForm(true);
  };

  const handleSaveDepartment = async () => {
    if (!canEditDepartment) return;
    if (!departmentName.trim() || !departmentDescription.trim()) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    if (editingDepartmentId) {
      const result = await qualidadeService.updateDepartamento(editingDepartmentId, {
        name: departmentName.trim(),
        description: departmentDescription.trim(),
      });

      if (result.success) {
        toast({ title: 'Sucesso', description: 'Departamento atualizado com sucesso' });
        await loadDepartments();
        resetDepartmentForm();
      } else {
        toast({ title: 'Erro', description: result.error || 'Erro ao atualizar departamento', variant: 'destructive' });
      }
    } else {
      if (!canCreateDepartment) return;
      const result = await qualidadeService.createDepartamento({
        name: departmentName.trim(),
        description: departmentDescription.trim(),
      });

      if (result.success) {
        toast({ title: 'Sucesso', description: 'Departamento criado com sucesso! As 11 pastas padrão foram criadas automaticamente.' });
        await loadDepartments();
        resetDepartmentForm();
      } else {
        toast({ title: 'Erro', description: result.error || 'Erro ao criar departamento', variant: 'destructive' });
      }
    }
    setSaving(false);
  };

  const resetProcedureForm = () => {
    setShowProcedureForm(false);
    setProcedureFormMode('create');
    setEditingProcedureId(null);
    setElaboradoPor(ELABORADO_POR_OPTIONS[0]);
    setTipo(TIPO_OPTIONS[0]);
    setNomeProcedimento('');
    setObjetivos('');
    setDocumentosRelacionados('');
    setDefinicoes('');
    setResponsabilidades('');
    setEscopo('');
    setFluxoOperacionalizacao('');
    setSistematica('');
    setGestaoIndicadores([]);
  };

  const openCreateProcedureForm = () => {
    if (!canCreateProcedure) return;
    if (!selectedFolderId) return;

    setProcedureFormMode('create');
    setEditingProcedureId(null);
    setElaboradoPor(ELABORADO_POR_OPTIONS[0]);
    setTipo(TIPO_OPTIONS[0]);
    setNomeProcedimento('');
    setObjetivos('');
    setDocumentosRelacionados('');
    setDefinicoes('');
    setResponsabilidades('');
    setEscopo('');
    setFluxoOperacionalizacao('');
    setSistematica('');
    setGestaoIndicadores([]);
    setShowProcedureForm(true);
  };

  const openViewProcedureForm = async (procedureId: string) => {
    const result = await qualidadeService.getProcedimentoById(procedureId);
    if (result.success && result.data) {
      const procedure = result.data;
      setProcedureFormMode('view');
      setEditingProcedureId(procedure.id);
      setElaboradoPor(procedure.elaborado_por);
      setTipo(procedure.tipo);
      setNomeProcedimento(procedure.nome_procedimento ?? '');
      setObjetivos(procedure.objetivos ?? '');
      setDocumentosRelacionados(procedure.documentos_relacionados ?? '');
      setDefinicoes(procedure.definicoes ?? '');
      setResponsabilidades(procedure.responsabilidades ?? '');
      setEscopo(procedure.escopo ?? '');
      setFluxoOperacionalizacao(procedure.fluxo_operacionalizacao ?? '');
      setSistematica(procedure.sistematica ?? '');
      setGestaoIndicadores(
        (procedure.indicadores || []).map((ind) => ({
          id: ind.id,
          nomeIndicador: ind.nome_indicador,
          oQueMede: ind.o_que_mede ?? '',
          metrica: ind.metrica ?? '',
          periodicidade: ind.periodicidade ?? '',
        }))
      );
      setShowProcedureForm(true);
    } else {
      toast({ title: 'Erro', description: result.error || 'Erro ao carregar procedimento', variant: 'destructive' });
    }
  };

  const switchToEditProcedureForm = () => {
    if (!canEditProcedure) return;
    if (!editingProcedureId) return;
    setProcedureFormMode('edit');
  };

  const handleSaveProcedure = async () => {
    if (!selectedFolderId) return;

    setSaving(true);

    if (procedureFormMode === 'create') {
      if (!canCreateProcedure) return;

      const result = await qualidadeService.createProcedimento({
        departamento_id: selectedDepartmentId || undefined,
        pasta_id: selectedFolderId,
        elaborado_por: elaboradoPor,
        tipo,
        nome_procedimento: showDetailedFields ? nomeProcedimento.trim() : undefined,
        objetivos: showDetailedFields ? objetivos.trim() : undefined,
        documentos_relacionados: showDetailedFields ? documentosRelacionados.trim() : undefined,
        definicoes: showDetailedFields ? definicoes.trim() : undefined,
        responsabilidades: showDetailedFields ? responsabilidades.trim() : undefined,
        escopo: showDetailedFields ? escopo.trim() : undefined,
        fluxo_operacionalizacao: showDetailedFields ? fluxoOperacionalizacao.trim() : undefined,
        sistematica: showDetailedFields ? sistematica.trim() : undefined,
      });

      if (result.success && result.data) {
        if (showDetailedFields && gestaoIndicadores.length > 0) {
          await qualidadeService.syncIndicadores(
            result.data.id,
            gestaoIndicadores.map((ind, idx) => ({
              nome_indicador: ind.nomeIndicador,
              o_que_mede: ind.oQueMede,
              metrica: ind.metrica,
              periodicidade: ind.periodicidade,
              ordem: idx + 1,
            }))
          );
        }

        toast({ title: 'Sucesso', description: 'Procedimento criado com sucesso' });
        await handleSelectFolder(selectedFolderId);
        resetProcedureForm();
      } else {
        toast({ title: 'Erro', description: result.error || 'Erro ao criar procedimento', variant: 'destructive' });
      }
    } else if (procedureFormMode === 'edit' && editingProcedureId) {
      if (!canEditProcedure) return;

      const result = await qualidadeService.updateProcedimento(editingProcedureId, {
        elaborado_por: elaboradoPor,
        tipo,
        nome_procedimento: showDetailedFields ? nomeProcedimento.trim() : undefined,
        objetivos: showDetailedFields ? objetivos.trim() : undefined,
        documentos_relacionados: showDetailedFields ? documentosRelacionados.trim() : undefined,
        definicoes: showDetailedFields ? definicoes.trim() : undefined,
        responsabilidades: showDetailedFields ? responsabilidades.trim() : undefined,
        escopo: showDetailedFields ? escopo.trim() : undefined,
        fluxo_operacionalizacao: showDetailedFields ? fluxoOperacionalizacao.trim() : undefined,
        sistematica: showDetailedFields ? sistematica.trim() : undefined,
      });

      if (result.success) {
        if (showDetailedFields) {
          await qualidadeService.syncIndicadores(
            editingProcedureId,
            gestaoIndicadores.map((ind, idx) => ({
              id: ind.id.startsWith('temp-') ? undefined : ind.id,
              nome_indicador: ind.nomeIndicador,
              o_que_mede: ind.oQueMede,
              metrica: ind.metrica,
              periodicidade: ind.periodicidade,
              ordem: idx + 1,
            }))
          );
        }

        toast({ title: 'Sucesso', description: 'Procedimento atualizado com sucesso' });
        await handleSelectFolder(selectedFolderId);
        resetProcedureForm();
      } else {
        toast({ title: 'Erro', description: result.error || 'Erro ao atualizar procedimento', variant: 'destructive' });
      }
    }

    setSaving(false);
  };

  const handleAddIndicadorRow = () => {
    if (procedureFormMode === 'view') return;
    setGestaoIndicadores((current) => [
      ...current,
      {
        id: `temp-${Date.now()}`,
        nomeIndicador: '',
        oQueMede: '',
        metrica: '',
        periodicidade: '',
      },
    ]);
  };

  const handleRemoveIndicadorRow = (rowId: string) => {
    if (procedureFormMode === 'view') return;
    setGestaoIndicadores((current) => current.filter((row) => row.id !== rowId));
  };

  const handleUpdateIndicadorRow = (rowId: string, field: keyof Omit<ProcedureIndicatorRow, 'id'>, value: string) => {
    if (procedureFormMode === 'view') return;
    setGestaoIndicadores((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  if (loading && currentView === 'departments') {
    return (
      <div className="px-10 py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="px-10 py-6 animate-fade-in pb-20">
      {currentView === 'departments' ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-brand-dark mb-2">Procedimentos, Instruções e Formulários</h2>
              <p className="text-gray-600">Selecione um departamento para visualizar suas pastas e procedimentos</p>
            </div>
            {canCreateDepartment && (
              <button
                onClick={openCreateDepartmentForm}
                className="flex items-center gap-2 px-6 py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-graphite transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Adicionar Departamento
              </button>
            )}
          </div>

          {showDepartmentForm && (
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Nome do departamento"
                  className="px-4 py-3 border border-gray-300 rounded-lg"
                />
                <input
                  value={departmentDescription}
                  onChange={(e) => setDepartmentDescription(e.target.value)}
                  placeholder="Descrição"
                  className="px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={resetDepartmentForm} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" disabled={saving}>
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDepartment}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-brand-dark text-white font-semibold hover:bg-brand-graphite transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingDepartmentId ? 'Salvar alterações' : 'Criar departamento'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
              {error}
            </div>
          )}

          {departments.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 text-center">
              <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum departamento cadastrado ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department) => {
                const Icon = iconByKey[(department.icon as DepartmentIcon) || 'file-text'] ?? FileText;
                return (
                  <div key={department.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all">
                    <button
                      className="w-full text-left"
                      onClick={() => handleSelectDepartment(department.id)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-brand-dark">{department.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{department.description}</p>
                    </button>

                    {canEditDepartment && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => openEditDepartmentForm(department)}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-brand-primary"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : currentView === 'folders' ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={handleGoBack}
                className="inline-flex items-center gap-2 text-sm text-brand-primary font-semibold mb-2 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para departamentos
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>Departamentos</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-brand-dark font-semibold">{selectedDepartment?.name}</span>
              </div>
              <h2 className="text-3xl font-bold text-brand-dark mb-2">{selectedDepartment?.name}</h2>
              <p className="text-gray-600">Selecione uma pasta para visualizar seus procedimentos</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              {error}
            </div>
          ) : folders.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 text-center">
              <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma pasta encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {folders.map((folder) => {
                const Icon = iconBySlug[folder.icone || 'FileText'] || FileText;
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleSelectFolder(folder.id)}
                    className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-brand-dark">{folder.name}</h3>
                        <p className="text-sm text-gray-500">{folder.procedimentos_count || 0} procedimento(s)</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={handleGoBack}
                className="inline-flex items-center gap-2 text-sm text-brand-primary font-semibold mb-2 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para pastas
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>Departamentos</span>
                <ChevronRight className="w-4 h-4" />
                <span>{selectedDepartment?.name}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-brand-dark font-semibold">{selectedFolder?.name}</span>
              </div>
              <h2 className="text-3xl font-bold text-brand-dark mb-2">{selectedFolder?.name}</h2>
              <p className="text-gray-600">Procedimentos cadastrados nesta pasta</p>
            </div>
            {canCreateProcedure && (
              <button
                onClick={openCreateProcedureForm}
                className="flex items-center gap-2 px-6 py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-graphite transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Novo Procedimento
              </button>
            )}
          </div>

          {showProcedureForm && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-brand-dark">
                    {procedureFormMode === 'create' ? 'Novo Procedimento' : procedureFormMode === 'edit' ? 'Editar Procedimento' : 'Detalhes do Procedimento'}
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-2">Elaborado por</label>
                      <select
                        value={elaboradoPor}
                        onChange={(e) => setElaboradoPor(e.target.value)}
                        disabled={procedureFormMode === 'view'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      >
                        {ELABORADO_POR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 font-semibold mb-2">Tipo</label>
                      <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        disabled={procedureFormMode === 'view'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      >
                        {TIPO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {showDetailedFields && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-700 font-semibold mb-2">Nome do procedimento</label>
                          <input value={nomeProcedimento} onChange={(e) => setNomeProcedimento(e.target.value)} disabled={procedureFormMode === 'view'} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 font-semibold mb-2">Objetivos</label>
                          <textarea value={objetivos} onChange={(e) => setObjetivos(e.target.value)} readOnly={procedureFormMode === 'view'} className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-24" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 font-semibold mb-2">Documentos Relacionados</label>
                          <textarea value={documentosRelacionados} onChange={(e) => setDocumentosRelacionados(e.target.value)} readOnly={procedureFormMode === 'view'} className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-24" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 font-semibold mb-2">Definições</label>
                          <textarea value={definicoes} onChange={(e) => setDefinicoes(e.target.value)} readOnly={procedureFormMode === 'view'} className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-24" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 font-semibold mb-2">Responsabilidades</label>
                          <textarea value={responsabilidades} onChange={(e) => setResponsabilidades(e.target.value)} readOnly={procedureFormMode === 'view'} className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-24" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 font-semibold mb-2">Escopo</label>
                          <textarea value={escopo} onChange={(e) => setEscopo(e.target.value)} readOnly={procedureFormMode === 'view'} className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-24" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 font-semibold mb-2">Fluxo de Operacionalização</label>
                          <textarea value={fluxoOperacionalizacao} onChange={(e) => setFluxoOperacionalizacao(e.target.value)} readOnly={procedureFormMode === 'view'} className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-24" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-700 font-semibold mb-2">Sistemática</label>
                          <textarea value={sistematica} onChange={(e) => setSistematica(e.target.value)} readOnly={procedureFormMode === 'view'} className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-24" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-brand-dark">Gestão de Indicadores de Desempenho</h4>
                          {procedureFormMode !== 'view' && (
                            <button
                              onClick={handleAddIndicadorRow}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-dark text-white text-sm font-semibold hover:bg-brand-graphite transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              Adicionar linha
                            </button>
                          )}
                        </div>

                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left px-3 py-2 font-semibold text-gray-700">Nome do indicador</th>
                                <th className="text-left px-3 py-2 font-semibold text-gray-700">O que mede</th>
                                <th className="text-left px-3 py-2 font-semibold text-gray-700">Métrica</th>
                                <th className="text-left px-3 py-2 font-semibold text-gray-700">Periodicidade</th>
                                <th className="text-right px-3 py-2 font-semibold text-gray-700">Ação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gestaoIndicadores.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-3 py-4 text-gray-500 text-center">
                                    Nenhuma linha adicionada
                                  </td>
                                </tr>
                              ) : (
                                gestaoIndicadores.map((row) => (
                                  <tr key={row.id} className="border-t border-gray-100">
                                    <td className="px-3 py-2">
                                      <input value={row.nomeIndicador} onChange={(e) => handleUpdateIndicadorRow(row.id, 'nomeIndicador', e.target.value)} disabled={procedureFormMode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input value={row.oQueMede} onChange={(e) => handleUpdateIndicadorRow(row.id, 'oQueMede', e.target.value)} disabled={procedureFormMode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input value={row.metrica} onChange={(e) => handleUpdateIndicadorRow(row.id, 'metrica', e.target.value)} disabled={procedureFormMode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input value={row.periodicidade} onChange={(e) => handleUpdateIndicadorRow(row.id, 'periodicidade', e.target.value)} disabled={procedureFormMode === 'view'} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {procedureFormMode !== 'view' && (
                                        <button onClick={() => handleRemoveIndicadorRow(row.id)} className="px-2 py-1 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                                          Remover
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-6 pt-0 flex justify-end gap-3">
                  <button onClick={resetProcedureForm} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700" disabled={saving}>
                    {procedureFormMode === 'view' ? 'Fechar' : 'Cancelar'}
                  </button>

                  {procedureFormMode === 'view' ? (
                    canEditProcedure ? (
                      <button
                        onClick={switchToEditProcedureForm}
                        className="px-4 py-2 rounded-lg bg-brand-dark text-white font-semibold hover:bg-brand-graphite transition-all shadow-sm hover:shadow-md"
                      >
                        Editar
                      </button>
                    ) : null
                  ) : (
                    <button
                      onClick={handleSaveProcedure}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-brand-dark text-white font-semibold hover:bg-brand-graphite transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {procedureFormMode === 'edit' ? 'Salvar alterações' : 'Adicionar procedimento'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              {error}
            </div>
          ) : procedures.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 text-center">
              <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum procedimento cadastrado nesta pasta</p>
            </div>
          ) : (
            <div className="space-y-3">
              {procedures.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openViewProcedureForm(item.id)}
                  className="w-full text-left bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-sm text-gray-700">
                    <b>Elaborado por:</b> {item.elaborado_por}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <b>Tipo:</b> {item.tipo}
                  </p>
                  {item.nome_procedimento && (
                    <p className="text-sm text-gray-700 mt-1">
                      <b>Nome do procedimento:</b> {item.nome_procedimento}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProcedimentosTab;
