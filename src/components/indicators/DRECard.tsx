import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { buscarDREPorContrato, listarContratosDRE, DRELinha } from '@/services/dreService';
import { getDatabase } from '@/lib/databaseResolver';
import { useAuth } from '@/hooks/useAuth';

const supabase = getDatabase('RH');

interface ContratoDRE {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
}

export function DRECard() {
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<ContratoDRE[]>([]);
  const [selectedContrato, setSelectedContrato] = useState<string>('');
  const [competencias, setCompetencias] = useState<string[]>([]);
  const [selectedCompetencia, setSelectedCompetencia] = useState<string>('');
  const [dreData, setDreData] = useState<DRELinha[]>([]);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.is_admin === true;

  useEffect(() => {
    loadContratos();
  }, []);

  useEffect(() => {
    if (selectedContrato) {
      loadCompetencias(selectedContrato);
    }
  }, [selectedContrato]);

  useEffect(() => {
    if (selectedContrato && selectedCompetencia) {
      loadDREData();
    }
  }, [selectedContrato, selectedCompetencia]);

  const loadContratos = async () => {
    try {
      const data = await listarContratosDRE();
      setContratos(data);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os contratos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCompetencias = async (contratoId: string) => {
    try {
      const { data, error } = await supabase
        .from('dre_postos')
        .select('competencia')
        .eq('contrato_id', contratoId)
        .order('competencia', { ascending: false });

      if (error) throw error;

      const uniqueCompetencias = [...new Set(data.map(d => d.competencia))];
      setCompetencias(uniqueCompetencias);

      if (uniqueCompetencias.length > 0 && !selectedCompetencia) {
        setSelectedCompetencia(uniqueCompetencias[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar competências:', error);
    }
  };

  const loadDREData = async () => {
    try {
      setLoading(true);

      const result = await buscarDREPorContrato(selectedContrato, selectedCompetencia);

      if (!result.success) {
        toast({
          title: 'Erro',
          description: result.message || 'Não foi possível carregar os dados do DRE',
          variant: 'destructive'
        });
        setDreData([]);
        return;
      }

      setDreData(result.data);

    } catch (error: any) {
      console.error('Erro ao carregar dados DRE:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do DRE',
        variant: 'destructive'
      });
      setDreData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportarDRE = async () => {
    if (!confirm('Deseja importar o Excel do bucket DRE no Supabase Storage? Esta operação pode levar alguns minutos.')) {
      return;
    }

    try {
      setImporting(true);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_GERAL_URL}/functions/v1/importar-dre`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_GERAL_ANON}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers
      });

      const result = await response.json();

      if (result.success) {
        let message = result.message;

        if (result.stats?.categoriasNaoEncontradas?.length > 0) {
          message += `\n\nCategorias não encontradas (${result.stats.categoriasNaoEncontradas.length}):\n- ${result.stats.categoriasNaoEncontradas.join('\n- ')}`;
        }

        toast({
          title: 'Sucesso',
          description: message
        });

        await loadContratos();
        if (selectedContrato) {
          await loadCompetencias(selectedContrato);
          if (selectedCompetencia) {
            await loadDREData();
          }
        }
      } else {
        toast({
          title: 'Erro na importação',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erro ao importar DRE:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível importar o DRE',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatCompetencia = (competencia: string) => {
    const date = new Date(competencia + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
  };

  const gruposAgrupados: { [grupo: string]: DRELinha[] } = {};
  dreData.forEach(row => {
    if (!gruposAgrupados[row.grupo]) {
      gruposAgrupados[row.grupo] = [];
    }
    gruposAgrupados[row.grupo].push(row);
  });

  const getRowStyle = (natureza: string) => {
    if (natureza === 'subtotal') {
      return 'bg-blue-50 font-bold text-blue-900';
    }
    if (natureza === 'indicador') {
      return 'bg-green-50 font-bold text-green-900';
    }
    return '';
  };

  if (loading && contratos.length === 0) {
    return (
      <IndicatorCard
        title="DRE por Contrato"
        subtitle="Demonstração do Resultado do Exercício"
        accentColor="#10b981"
        defaultExpanded={false}
      >
        <p className="text-center text-gray-500">Carregando...</p>
      </IndicatorCard>
    );
  }

  return (
    <IndicatorCard
      title="DRE por Contrato"
      subtitle="Demonstração do Resultado do Exercício"
      accentColor="#10b981"
      defaultExpanded={false}
    >
      <div className="space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contrato
            </label>
            <select
              value={selectedContrato}
              onChange={(e) => setSelectedContrato(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Selecione um contrato...</option>
              {contratos.map(contrato => (
                <option key={contrato.id} value={contrato.id}>
                  {contrato.codigo} - {contrato.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Competência
            </label>
            <select
              value={selectedCompetencia}
              onChange={(e) => setSelectedCompetencia(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={!selectedContrato}
            >
              <option value="">Selecione uma competência...</option>
              {competencias.map(comp => (
                <option key={comp} value={comp}>
                  {formatCompetencia(comp)}
                </option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <Button
              onClick={handleImportarDRE}
              disabled={importing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${importing ? 'animate-spin' : ''}`} />
              {importing ? 'Importando...' : 'Importar Excel'}
            </Button>
          )}
        </div>

        {selectedContrato && selectedCompetencia && (
          <div className="mt-6">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Carregando dados...</p>
            ) : dreData.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhum dado disponível para este contrato e competência
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Previsto</TableHead>
                      <TableHead className="text-right">Realizado</TableHead>
                      <TableHead className="text-right">Variação R$</TableHead>
                      <TableHead className="text-right">Variação %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(gruposAgrupados).map(grupo => {
                      const rows = gruposAgrupados[grupo];

                      return (
                        <tbody key={grupo}>
                          <TableRow className="bg-gray-100">
                            <TableCell colSpan={6} className="text-sm font-bold text-gray-700">
                              {grupo}
                            </TableCell>
                          </TableRow>
                          {rows.map((row, idx) => {
                            const variacao = row.realizado - row.previsto;
                            const variacaoPercent = row.previsto !== 0
                              ? ((row.realizado - row.previsto) / Math.abs(row.previsto)) * 100
                              : 0;

                            const isSubtotalOrIndicador = row.natureza === 'subtotal' || row.natureza === 'indicador';

                            return (
                              <TableRow key={`${row.grupo}-${idx}`} className={getRowStyle(row.natureza)}>
                                <TableCell className="text-xs font-mono">
                                  {row.codigo || ''}
                                </TableCell>
                                <TableCell className={`text-sm ${isSubtotalOrIndicador ? 'font-bold' : ''}`}>
                                  {row.categoria}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {row.natureza === 'indicador'
                                    ? formatPercent(row.previsto)
                                    : formatCurrency(row.previsto)
                                  }
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {row.natureza === 'indicador'
                                    ? formatPercent(row.realizado)
                                    : formatCurrency(row.realizado)
                                  }
                                </TableCell>
                                <TableCell className={`text-right text-sm ${variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {row.natureza === 'indicador'
                                    ? formatPercent(variacao)
                                    : formatCurrency(variacao)
                                  }
                                </TableCell>
                                <TableCell className={`text-right text-sm font-semibold ${variacaoPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercent(variacaoPercent)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </tbody>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    </IndicatorCard>
  );
}
