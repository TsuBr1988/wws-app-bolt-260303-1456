import { useState, useRef } from "react";

type Props = {
  proposalId: string;
  value: string | null | undefined;            // valor atual vindo do banco
  onLocalChange: (next: string) => void;       // atualiza estado local do card/lista
  onCommit: (proposalId: string, value: string) => Promise<void>; // persiste no Supabase
  readOnly?: boolean;
};

export default function ColocacaoField({
  proposalId,
  value,
  onLocalChange,
  onCommit,
  readOnly = false
}: Props) {
  const [busy, setBusy] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const lastStableRef = useRef(value ?? "");

  const handleChange = (v: string) => {
    onLocalChange(v);
  };

  const commit = async () => {
    // Prevenir múltiplos commits simultâneos
    if (isCommitting || busy) {
      console.log('🚫 [ColocacaoField] Commit já em andamento, ignorando...');
      return;
    }
    
    const val = (value ?? "").trim();
    if (val === (lastStableRef.current ?? "")) {
      console.log('🔄 [ColocacaoField] Valor não mudou, commit desnecessário');
      return;
    }
    
    console.log('🔄 [ColocacaoField] Iniciando commit:', {
      proposalId,
      valorAnterior: lastStableRef.current,
      novoValor: val
    });
    
    try {
      setBusy(true);
      setIsCommitting(true);
      await onCommit(proposalId, val);
      lastStableRef.current = val;
      console.log('✅ [ColocacaoField] Commit concluído com sucesso');
    } catch (e) {
      // rollback: volta ao último valor estável
      onLocalChange(lastStableRef.current);
      console.error("Erro ao salvar posicao_atual:", e);
      alert("❌ Erro ao salvar colocação. Tente novamente.");
    } finally {
      setBusy(false);
      setIsCommitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevenir submit de formulário
      (e.currentTarget as HTMLInputElement).blur(); // dispara commit
    }
    if (e.key === "Escape") {
      // Cancelar edição e voltar ao valor estável
      onLocalChange(lastStableRef.current);
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  if (readOnly) {
    return (
      <div className={`text-xs font-medium bg-blue-50 border border-blue-200 rounded-lg p-1 px-2 text-center w-fit ${
        value ? 'text-blue-800' : 'text-red-600'
      }`}>
        {value || 'Não informado'}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Ex: 1º lugar..."
        value={value ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`w-full text-xs p-1 px-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${
          value ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-gray-300 text-gray-500'
        }`}
        disabled={busy || isCommitting}
        title="Digite a colocação e pressione Enter ou clique fora para salvar"
      />
      {(busy || isCommitting) && (
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 bg-white px-2 py-1 rounded shadow-sm">
          Salvando...
        </div>
      )}
    </div>
  );
}