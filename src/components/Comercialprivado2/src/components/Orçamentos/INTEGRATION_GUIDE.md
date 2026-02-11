# Guia de Integração: Orçamentos → Propostas

Este guia explica como usar a integração entre o sistema de Orçamentos e o sistema de Propostas.

## O que foi implementado

### 1. Botão "Gerar Proposta" nos Orçamentos

- Aparece nos cards de orçamentos salvos que já possuem cálculo realizado
- Localizado ao lado do botão "Carregar"
- Cor verde para destacar a ação principal

### 2. Campo `budget_id` na tabela `proposals`

- Link entre a proposta e o orçamento que a originou
- Permite rastrear qual orçamento gerou qual proposta
- Opcional (nem toda proposta precisa vir de um orçamento)

### 3. Modal de Nova Proposta Pré-Preenchido

- Abre com dados do orçamento:
  - **Cliente**: Nome do cliente do orçamento
  - **Valor Mensal**: Valor total calculado do orçamento
  - **Meses**: 12 meses por padrão
  - **Budget ID**: ID do orçamento (campo oculto)

## Como Usar

### Opção 1: Uso Standalone (Sistema de Orçamentos isolado)

Se você está usando o sistema de orçamentos de forma independente:

\`\`\`tsx
import OrcamentosApp from './src/components/Orçamentos/src/App';

function MinhaPage() {
  return <OrcamentosApp />;
}
\`\`\`

Neste modo, o botão "Gerar Proposta" não aparecerá.

### Opção 2: Integração Completa (Recomendado)

Para usar a integração completa com o sistema de propostas:

\`\`\`tsx
import { OrcamentosWithProposalIntegration } from './src/components/Orçamentos/OrcamentosProposalIntegration';

function MinhaPage() {
  return <OrcamentosWithProposalIntegration />;
}
\`\`\`

Este componente já possui toda a lógica de integração implementada e pronta para uso.

### Opção 3: Integração Personalizada

Se você precisa de um comportamento customizado:

\`\`\`tsx
import { useState } from 'react';
import OrcamentosApp from './src/components/Orçamentos/src/App';
import { ProposalForm } from './src/components/Proposals/ProposalForm';
import { supabase } from './src/lib/supabase';

function MeuComponente() {
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalData, setProposalData] = useState(null);

  const handleGenerateProposal = (budgetData) => {
    // budgetData contém: { id, clientName, monthlyValue, months }
    setProposalData({
      client: budgetData.clientName,
      monthlyValue: budgetData.monthlyValue,
      months: budgetData.months,
      budgetId: budgetData.id
    });
    setShowProposalModal(true);
  };

  const handleProposalSubmit = async (proposal) => {
    // Sua lógica para salvar a proposta
    await supabase.from('proposals').insert([proposal]);
    setShowProposalModal(false);
  };

  return (
    <>
      <OrcamentosApp onGenerateProposal={handleGenerateProposal} />

      {showProposalModal && (
        <ProposalForm
          initialData={proposalData}
          onSubmit={handleProposalSubmit}
          onCancel={() => setShowProposalModal(false)}
        />
      )}
    </>
  );
}
\`\`\`

## Fluxo de Trabalho

1. **Criar Orçamento**: Na aba "Novo Orçamento"
2. **Adicionar Funções**: Na aba "Orçamento Geral"
3. **Gerar Planilha**: Clicar em "GERAR PLANILHA COMPLETA"
4. **Gerar Proposta**: Voltar para "Novo Orçamento" e clicar em "Gerar Proposta" no card do orçamento
5. **Preencher Dados**: Modal abre pré-preenchido, adicionar Closer, SDR, etc.
6. **Criar Proposta**: Clicar em "Criar Proposta"
7. **Visualizar**: A proposta aparece na aba Propostas com o link para o orçamento

## Validações

- O botão "Gerar Proposta" só aparece se o orçamento tiver um valor calculado
- Se tentar gerar proposta de orçamento sem cálculo, mostra alerta explicativo
- O orçamento não precisa estar ativo para gerar proposta

## Banco de Dados

### Migration Aplicada

\`\`\`sql
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS budget_id text;

CREATE INDEX IF NOT EXISTS idx_proposals_budget_id ON proposals(budget_id);
\`\`\`

### Consultar Propostas por Orçamento

\`\`\`sql
SELECT * FROM proposals WHERE budget_id = 'seu-orcamento-id';
\`\`\`

### Consultar Orçamento de uma Proposta

\`\`\`sql
SELECT b.* FROM budgets b
JOIN proposals p ON p.budget_id = b.id
WHERE p.id = 'sua-proposta-id';
\`\`\`

## Benefícios da Integração

1. **Menos Retrabalho**: Dados do orçamento são automaticamente transferidos
2. **Rastreabilidade**: Sempre sabe qual orçamento gerou qual proposta
3. **Precisão**: Evita erros de digitação ao transferir valores manualmente
4. **Eficiência**: Reduz tempo para criar propostas de orçamentos prontos
5. **Histórico**: Pode analisar quantas propostas vieram de orçamentos vs. criadas manualmente

## Troubleshooting

### Botão não aparece
- Verifique se o orçamento tem cálculo realizado (valor > 0)
- Confirme que o callback `onGenerateProposal` foi passado para o componente

### Proposta não é criada
- Verifique a migration do `budget_id` na tabela `proposals`
- Confira os logs do console para erros do Supabase
- Certifique-se que as RLS policies permitem inserção

### Dados não são pré-preenchidos
- Verifique se `initialData` está sendo passado para `ProposalForm`
- Confirme que os dados do orçamento estão corretos no callback
