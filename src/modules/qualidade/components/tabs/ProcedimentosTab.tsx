import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  FileCheck,
  FileText,
  GitBranch,
  Pencil,
  Plus,
  Settings,
  Shield,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

interface StoredState {
  departments: ProcedureDepartment[];
  procedures: ProcedureItem[];
}

const STORAGE_KEY = 'qualidade_procedimentos_state_v1';

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

const DEFAULT_DEPARTMENTS: ProcedureDepartment[] = [
  {
    id: 'departamento-qualidade',
    name: 'Qualidade',
    icon: 'file-text',
    description: 'Documentação e controles da área da Qualidade',
  },
];

const iconByKey: Record<DepartmentIcon, React.ComponentType<{ className?: string }>> = {
  'book-open': BookOpen,
  settings: Settings,
  'clipboard-list': ClipboardList,
  shield: Shield,
  wrench: Wrench,
  'git-branch': GitBranch,
  'file-text': FileText,
};

const loadStoredState = (): StoredState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { departments: DEFAULT_DEPARTMENTS, procedures: [] };
    const parsed = JSON.parse(raw) as StoredState;
    return {
      departments: Array.isArray(parsed.departments) && parsed.departments.length > 0 ? parsed.departments : DEFAULT_DEPARTMENTS,
      procedures: Array.isArray(parsed.procedures) ? parsed.procedures : [],
    };
  } catch {
    return { departments: DEFAULT_DEPARTMENTS, procedures: [] };
  }
};

const saveStoredState = (state: StoredState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const ProcedimentosTab: React.FC = () => {
  const { user, canEditIndicator } = useAuth();
  const initialState = useMemo(() => loadStoredState(), []);

  const [departments, setDepartments] = useState<ProcedureDepartment[]>(initialState.departments);
  const [procedures, setProcedures] = useState<ProcedureItem[]>(initialState.procedures);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentIcon, setDepartmentIcon] = useState<DepartmentIcon>('file-text');
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

  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId) ?? null;
  const showDetailedFields = DETAILED_TIPOS.has(tipo);

  const selectedDepartmentProcedures = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return procedures
      .filter((p) => p.departmentId === selectedDepartmentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [selectedDepartmentId, procedures]);

  const persistState = (nextDepartments: ProcedureDepartment[], nextProcedures: ProcedureItem[]) => {
    saveStoredState({ departments: nextDepartments, procedures: nextProcedures });
  };

  const resetDepartmentForm = () => {
    setDepartmentName('');
    setDepartmentIcon('file-text');
    setDepartmentDescription('');
    setEditingDepartmentId(null);
    setShowDepartmentForm(false);
  };

  const openCreateDepartmentForm = () => {
    setEditingDepartmentId(null);
    setDepartmentName('');
    setDepartmentIcon('file-text');
    setDepartmentDescription('');
    setShowDepartmentForm(true);
  };

  const openEditDepartmentForm = (department: ProcedureDepartment) => {
    setEditingDepartmentId(department.id);
    setDepartmentName(department.name);
    setDepartmentIcon(department.icon);
    setDepartmentDescription(department.description);
    setShowDepartmentForm(true);
  };

  const handleSaveDepartment = () => {
    if (!canEditDepartment) return;
    if (!departmentName.trim() || !departmentDescription.trim()) return;

    let nextDepartments: ProcedureDepartment[];
    if (editingDepartmentId) {
      nextDepartments = departments.map((d) =>
        d.id === editingDepartmentId
          ? {
              ...d,
              name: departmentName.trim(),
              icon: departmentIcon,
              description: departmentDescription.trim(),
            }
          : d
      );
    } else {
      if (!canCreateDepartment) return;
      const created: ProcedureDepartment = {
        id: crypto.randomUUID(),
        name: departmentName.trim(),
        icon: departmentIcon,
        description: departmentDescription.trim(),
      };
      nextDepartments = [...departments, created];
    }

    setDepartments(nextDepartments);
    persistState(nextDepartments, procedures);
    resetDepartmentForm();
  };

  const handleAddProcedure = () => {
    if (!selectedDepartmentId) return;

    const created: ProcedureItem = {
      id: crypto.randomUUID(),
      departmentId: selectedDepartmentId,
      elaboradoPor,
      tipo,
      nomeProcedimento: showDetailedFields ? nomeProcedimento.trim() : undefined,
      objetivos: showDetailedFields ? objetivos.trim() : undefined,
      documentosRelacionados: showDetailedFields ? documentosRelacionados.trim() : undefined,
      definicoes: showDetailedFields ? definicoes.trim() : undefined,
      responsabilidades: showDetailedFields ? responsabilidades.trim() : undefined,
      escopo: showDetailedFields ? escopo.trim() : undefined,
      fluxoOperacionalizacao: showDetailedFields ? fluxoOperacionalizacao.trim() : undefined,
      sistematica: showDetailedFields ? sistematica.trim() : undefined,
      gestaoIndicadores: showDetailedFields ? gestaoIndicadores : undefined,
      createdAt: new Date().toISOString(),
    };

    const nextProcedures = [...procedures, created];
    setProcedures(nextProcedures);
    persistState(departments, nextProcedures);
    resetProcedureForm();
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

  const openViewProcedureForm = (procedure: ProcedureItem) => {
    setProcedureFormMode('view');
    setEditingProcedureId(procedure.id);
    setElaboradoPor(procedure.elaboradoPor);
    setTipo(procedure.tipo);
    setNomeProcedimento(procedure.nomeProcedimento ?? '');
    setObjetivos(procedure.objetivos ?? '');
    setDocumentosRelacionados(procedure.documentosRelacionados ?? '');
    setDefinicoes(procedure.definicoes ?? '');
    setResponsabilidades(procedure.responsabilidades ?? '');
    setEscopo(procedure.escopo ?? '');
    setFluxoOperacionalizacao(procedure.fluxoOperacionalizacao ?? '');
    setSistematica(procedure.sistematica ?? '');
    setGestaoIndicadores(Array.isArray(procedure.gestaoIndicadores) ? procedure.gestaoIndicadores : []);
    setShowProcedureForm(true);
  };

  const switchToEditProcedureForm = () => {
    if (!canEditProcedure) return;
    if (!editingProcedureId) return;
    setProcedureFormMode('edit');
  };

  const handleSaveProcedure = () => {
    if (!selectedDepartmentId) return;

    if (procedureFormMode === 'create') {
      if (!canCreateProcedure) return;
      handleAddProcedure();
      return;
    }

    if (procedureFormMode !== 'edit') return;
    if (!canEditProcedure) return;
    if (!editingProcedureId) return;

    const existing = procedures.find((p) => p.id === editingProcedureId);
    if (!existing) return;

    const updated: ProcedureItem = {
      ...existing,
      elaboradoPor,
      tipo,
      nomeProcedimento: showDetailedFields ? nomeProcedimento.trim() : undefined,
      objetivos: showDetailedFields ? objetivos.trim() : undefined,
      documentosRelacionados: showDetailedFields ? documentosRelacionados.trim() : undefined,
      definicoes: showDetailedFields ? definicoes.trim() : undefined,
      responsabilidades: showDetailedFields ? responsabilidades.trim() : undefined,
      escopo: showDetailedFields ? escopo.trim() : undefined,
      fluxoOperacionalizacao: showDetailedFields ? fluxoOperacionalizacao.trim() : undefined,
      sistematica: showDetailedFields ? sistematica.trim() : undefined,
      gestaoIndicadores: showDetailedFields ? gestaoIndicadores : undefined,
    };

    const nextProcedures = procedures.map((p) => (p.id === updated.id ? updated : p));
    setProcedures(nextProcedures);
    persistState(departments, nextProcedures);
    resetProcedureForm();
  };

  const handleAddIndicadorRow = () => {
    if (procedureFormMode === 'view') return;
    setGestaoIndicadores((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
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

  return (
    <div className="px-10 py-6 animate-fade-in pb-20">
      {!selectedDepartment ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-brand-dark mb-2">Procedimentos, Instruções e Formulários</h2>
              <p className="text-gray-600">Cards de departamento (categorias) e seus procedimentos</p>
            </div>
            {canCreateDepartment && (
              <button
                onClick={openCreateDepartmentForm}
                className="flex items-center gap-2 px-6 py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-graphite transition-all shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-graphite/40"
              >
                <Plus className="w-5 h-5" />
                Adicionar departamento
              </button>
            )}
          </div>

          {showDepartmentForm && (
            <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Nome do departamento"
                  className="px-4 py-3 border border-gray-300 rounded-lg"
                />
                <select
                  value={departmentIcon}
                  onChange={(e) => setDepartmentIcon(e.target.value as DepartmentIcon)}
                  className="px-4 py-3 border border-gray-300 rounded-lg"
                >
                  {Object.keys(iconByKey).map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                <input
                  value={departmentDescription}
                  onChange={(e) => setDepartmentDescription(e.target.value)}
                  placeholder="Descrição"
                  className="px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={resetDepartmentForm} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Cancelar</button>
                <button
                  onClick={handleSaveDepartment}
                  className="px-4 py-2 rounded-lg bg-brand-dark text-white font-semibold hover:bg-brand-graphite transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-graphite/40"
                >
                  {editingDepartmentId ? 'Salvar alterações' : 'Criar departamento'}
                </button>
              </div>
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
                const Icon = iconByKey[department.icon] ?? FileText;
                return (
                  <div key={department.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all">
                    <button
                      className="w-full text-left"
                      onClick={() => setSelectedDepartmentId(department.id)}
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
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => setSelectedDepartmentId(null)}
                className="text-sm text-brand-primary font-semibold mb-2"
              >
                ← Voltar para departamentos
              </button>
              <h2 className="text-3xl font-bold text-brand-dark mb-2">{selectedDepartment.name}</h2>
              <p className="text-gray-600">{selectedDepartment.description}</p>
            </div>
            {canCreateProcedure && (
              <button
                onClick={openCreateProcedureForm}
                className="flex items-center gap-2 px-6 py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-graphite transition-all shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-graphite/40"
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
                  <p className="text-sm text-gray-600 mt-1">
                    {procedureFormMode === 'create'
                      ? 'Preencha os campos para registrar o procedimento'
                      : procedureFormMode === 'edit'
                        ? 'Atualize os campos e salve as alterações'
                        : 'Visualização do procedimento cadastrado'}
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {procedureFormMode === 'view' && !canEditProcedure && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-sm text-gray-700">Você pode visualizar este procedimento, mas não tem permissão para editar.</p>
                    </div>
                  )}

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
                          <option key={opt} value={opt}>{opt}</option>
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
                          <option key={opt} value={opt}>{opt}</option>
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
                                  <td colSpan={5} className="px-3 py-4 text-gray-500 text-center">Nenhuma linha adicionada</td>
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
                                        <button onClick={() => handleRemoveIndicadorRow(row.id)} className="px-2 py-1 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Remover</button>
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
                  <button onClick={resetProcedureForm} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">
                    {procedureFormMode === 'view' ? 'Fechar' : 'Cancelar'}
                  </button>

                  {procedureFormMode === 'view' ? (
                    canEditProcedure ? (
                      <button
                        onClick={switchToEditProcedureForm}
                        className="px-4 py-2 rounded-lg bg-brand-dark text-white font-semibold hover:bg-brand-graphite transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-graphite/40"
                      >
                        Editar
                      </button>
                    ) : null
                  ) : (
                    <button
                      onClick={handleSaveProcedure}
                      className="px-4 py-2 rounded-lg bg-brand-dark text-white font-semibold hover:bg-brand-graphite transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-graphite/40"
                    >
                      {procedureFormMode === 'edit' ? 'Salvar alterações' : 'Adicionar procedimento'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedDepartmentProcedures.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 text-center">
              <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum procedimento cadastrado neste departamento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDepartmentProcedures.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openViewProcedureForm(item)}
                  className="w-full text-left bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-sm text-gray-700"><b>Elaborado por:</b> {item.elaboradoPor}</p>
                  <p className="text-sm text-gray-700 mt-1"><b>Tipo:</b> {item.tipo}</p>
                  {item.nomeProcedimento && (
                    <p className="text-sm text-gray-700 mt-1"><b>Nome do procedimento:</b> {item.nomeProcedimento}</p>
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
