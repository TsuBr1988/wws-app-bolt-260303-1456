import { supabase } from './supabase';

interface CategoriaDRE {
  ordem: number;
  codigo: string | null;
  nome: string;
  grupo: string;
  natureza: 'receita' | 'custo' | 'despesa' | 'subtotal' | 'indicador';
}

export const categoriasDRE: CategoriaDRE[] = [
  { ordem: 1, codigo: null, nome: 'Receita Bruta', grupo: 'Receita Bruta', natureza: 'subtotal' },
  { ordem: 2, codigo: '1.1.1', nome: 'recebimentos wws', grupo: 'Receita Bruta', natureza: 'receita' },
  { ordem: 3, codigo: '1.2.1', nome: 'recebimentos worldwide', grupo: 'Receita Bruta', natureza: 'receita' },
  { ordem: 4, codigo: '1.3.1', nome: 'recebimentos estacionamento', grupo: 'Receita Bruta', natureza: 'receita' },
  { ordem: 5, codigo: '1.3.2', nome: 'outras receitas', grupo: 'Receita Bruta', natureza: 'receita' },

  { ordem: 6, codigo: null, nome: 'IRSR - Imposto Retido s/ Receita', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'subtotal' },
  { ordem: 7, codigo: null, nome: 'CSLL Retido sobre a Receita', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },
  { ordem: 8, codigo: null, nome: 'COFINS Retido sobre a Receita', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },
  { ordem: 9, codigo: null, nome: 'ISS Retido sobre a Receita', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },
  { ordem: 10, codigo: null, nome: 'INSS Retido sobre a Receita', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },
  { ordem: 11, codigo: null, nome: 'Outras Retenções sobre a Receita', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },
  { ordem: 12, codigo: null, nome: 'IRPJ Retido sobre a Receita', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },
  { ordem: 13, codigo: null, nome: 'PIS Retido sobre a Receita', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },
  { ordem: 14, codigo: '2.6.1', nome: 'iss sobre serviços', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },
  { ordem: 15, codigo: '2.6.2', nome: 'pis sobre serviços', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },
  { ordem: 16, codigo: '2.6.3', nome: 'cofins sobre serviços', grupo: 'IRSR - Imposto Retido s/ Receita', natureza: 'receita' },

  { ordem: 17, codigo: null, nome: 'Receita não Operacional', grupo: 'Receita não Operacional', natureza: 'subtotal' },
  { ordem: 18, codigo: null, nome: 'Descontos Concedidos', grupo: 'Receita não Operacional', natureza: 'receita' },
  { ordem: 19, codigo: null, nome: 'Outras receitas', grupo: 'Receita não Operacional', natureza: 'receita' },
  { ordem: 20, codigo: null, nome: 'Multas Recebidas', grupo: 'Receita não Operacional', natureza: 'receita' },
  { ordem: 21, codigo: null, nome: 'Juros Recebidos', grupo: 'Receita não Operacional', natureza: 'receita' },

  { ordem: 22, codigo: null, nome: 'Receita Líquida', grupo: 'Receita Líquida', natureza: 'subtotal' },

  { ordem: 23, codigo: null, nome: 'CSV - Custo Serviço Vendido', grupo: 'CSV - Custo Serviço Vendido', natureza: 'subtotal' },
  { ordem: 24, codigo: '2.1.1', nome: 'folha - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 25, codigo: '2.1.2', nome: 'ft - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 26, codigo: '2.1.3', nome: 'empréstimo consignado - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 27, codigo: '2.1.4', nome: 'folha emp consignado - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 28, codigo: '2.1.5', nome: 'pensão folha - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 29, codigo: '2.1.6', nome: 'cesta - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 30, codigo: '2.1.7', nome: 'vale alimentação - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 31, codigo: '2.1.8', nome: 'vale transporte - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 32, codigo: '2.1.9', nome: 'premiações e bonificações - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 33, codigo: '2.1.10', nome: 'fgts - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 34, codigo: '2.1.11', nome: 'inss - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 35, codigo: '2.1.14', nome: '13º salário - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 36, codigo: null, nome: 'Provisão 13º salário - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 37, codigo: '2.1.13', nome: 'ppr - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 38, codigo: '2.1.18', nome: 'rescisão trabalhista - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 39, codigo: '2.1.15', nome: 'férias + 1/3 férias - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 40, codigo: null, nome: 'Provisão férias + 1/3 férias - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 41, codigo: '2.1.16', nome: 'irpf 0561 - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 42, codigo: '2.1.17', nome: 'grrf rescisão - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 43, codigo: '2.3.12', nome: 'aluguel de rádios ht - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 44, codigo: '2.3.13', nome: 'reciclagem vigilantes - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 45, codigo: '2.1.20', nome: 'seguro de vida - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 46, codigo: '2.1.21', nome: 'sindicatos (sem desconto na folha) - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 47, codigo: '2.1.22', nome: 'sindicatos (com desconto na folha) - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 48, codigo: '2.1.23', nome: 'assistência médica - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 49, codigo: '2.1.24', nome: 'assistência odontológica - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 50, codigo: '2.2.1', nome: 'combustível - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 51, codigo: '2.2.2', nome: 'ipva / licenciamento - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 52, codigo: '2.2.3', nome: 'manutenção de veículos - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 53, codigo: '2.2.4', nome: 'multas e taxas de veículos - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 54, codigo: '2.2.5', nome: 'despachante - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 55, codigo: '2.2.6', nome: 'fretes e carretos - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 56, codigo: '2.2.7', nome: 'seguro de veiculos - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 57, codigo: '2.3.1', nome: 'cnv´s - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 58, codigo: '2.3.2', nome: 'epi´s e uniformes - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 59, codigo: '2.3.3', nome: 'equipamentos / instalações - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 60, codigo: '2.3.4', nome: 'manutenção predial - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 61, codigo: '2.3.5', nome: 'manutenção/ revisão preventiva - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 62, codigo: '2.3.6', nome: 'maquinas e equipamentos operacionais - posto', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 63, codigo: '2.3.7', nome: 'materiais - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 64, codigo: '2.3.8', nome: 'material de escritório - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 65, codigo: '2.3.9', nome: 'medicina ocupacional - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 66, codigo: '2.3.10', nome: 'outras despesas - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 67, codigo: '2.3.11', nome: 'multas e glosas - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 68, codigo: '2.3.15', nome: 'locação de impressoras - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 69, codigo: '2.4.1', nome: 'monitoramento de cameras e alarmes - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 70, codigo: '2.3.14', nome: 'seguro garantia contratos - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 71, codigo: '2.4.3', nome: 'sistema de segurança e monitoramento - posto', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 72, codigo: '2.5.1', nome: 'processos trabalhistas - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 73, codigo: '2.7.1', nome: 'insumos - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 74, codigo: '2.7.2', nome: 'comissão vendedor (a)', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 75, codigo: '2.8.1', nome: 'sistemas e softwares - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },
  { ordem: 76, codigo: '2.8.2', nome: 'telefones e internet - postos', grupo: 'CSV - Custo Serviço Vendido', natureza: 'custo' },

  { ordem: 77, codigo: null, nome: 'Receita Bruta - Receitas de Impostos', grupo: 'Receita Bruta - Receitas de Impostos', natureza: 'subtotal' },
  { ordem: 78, codigo: '2.1.12', nome: 'recebimentos retenção', grupo: 'Receita Bruta - Receitas de Impostos', natureza: 'receita' },

  { ordem: 79, codigo: null, nome: 'Lucro Bruto', grupo: 'Lucro Bruto', natureza: 'subtotal' },
  { ordem: 80, codigo: null, nome: 'Margem Bruta %', grupo: 'Lucro Bruto', natureza: 'indicador' },

  { ordem: 81, codigo: null, nome: 'Despesa Comercial - Geral', grupo: 'Despesa Comercial - Geral', natureza: 'subtotal' },
  { ordem: 82, codigo: '3.8.1', nome: 'brindes', grupo: 'Despesa Comercial - Geral', natureza: 'despesa' },
  { ordem: 83, codigo: '3.8.2', nome: 'outras despesas - comercial', grupo: 'Despesa Comercial - Geral', natureza: 'despesa' },
  { ordem: 84, codigo: '3.8.3', nome: 'viagens e estadias - comercial', grupo: 'Despesa Comercial - Geral', natureza: 'despesa' },
  { ordem: 85, codigo: '3.8.4', nome: 'taxas conlicitação + assinatura mensal', grupo: 'Despesa Comercial - Geral', natureza: 'despesa' },
  { ordem: 86, codigo: '3.8.5', nome: 'assessoria comercial', grupo: 'Despesa Comercial - Geral', natureza: 'despesa' },

  { ordem: 87, codigo: null, nome: 'Despesa Comercial - Veículos', grupo: 'Despesa Comercial - Veículos', natureza: 'subtotal' },
  { ordem: 88, codigo: '3.9.1', nome: 'ipva / licenciamento - comercial', grupo: 'Despesa Comercial - Veículos', natureza: 'despesa' },
  { ordem: 89, codigo: '3.9.2', nome: 'manutenção de veículos - comercial', grupo: 'Despesa Comercial - Veículos', natureza: 'despesa' },
  { ordem: 90, codigo: '3.9.3', nome: 'multas e taxas de veículos - comercial', grupo: 'Despesa Comercial - Veículos', natureza: 'despesa' },
  { ordem: 91, codigo: '3.9.4', nome: 'sem parar - comercial', grupo: 'Despesa Comercial - Veículos', natureza: 'despesa' },
  { ordem: 92, codigo: '3.9.5', nome: 'aluguel veículos - comercial', grupo: 'Despesa Comercial - Veículos', natureza: 'despesa' },
  { ordem: 93, codigo: '3.9.6', nome: 'combustivel - comercial', grupo: 'Despesa Comercial - Veículos', natureza: 'despesa' },

  { ordem: 94, codigo: null, nome: 'Despesa Comercial - Contrato', grupo: 'Despesa Comercial - Contrato', natureza: 'subtotal' },
  { ordem: 95, codigo: '3.10.1', nome: 'insumos comercial', grupo: 'Despesa Comercial - Contrato', natureza: 'despesa' },
  { ordem: 96, codigo: '3.10.2', nome: 'comissao vendedor - comercial', grupo: 'Despesa Comercial - Contrato', natureza: 'despesa' },

  { ordem: 97, codigo: null, nome: 'Margem de Contribuição', grupo: 'Margem de Contribuição', natureza: 'indicador' },
];

export async function seedCategoriasDRE(): Promise<{ success: boolean; message: string; inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  try {
    for (const categoria of categoriasDRE) {
      const { error } = await supabase
        .from('categorias_dre')
        .insert({
          codigo: categoria.codigo,
          nome: categoria.nome,
          grupo: categoria.grupo,
          natureza: categoria.natureza,
          ordem: categoria.ordem
        });

      if (error) {
        if (error.code === '23505') {
          errors.push(`Categoria já existe: ${categoria.nome} (${categoria.grupo})`);
        } else {
          errors.push(`Erro ao inserir ${categoria.nome}: ${error.message}`);
        }
      } else {
        inserted++;
      }
    }

    return {
      success: true,
      message: `Processo concluído. ${inserted} categorias inseridas, ${errors.length} erros/duplicados.`,
      inserted,
      errors
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Erro geral: ${error.message}`,
      inserted,
      errors: [error.message]
    };
  }
}
