import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type ProposalNote = {
  id: string;
  proposal_id: string;
  text: string;
  author_name: string | null;
  created_at: string;
};

// Hook para contar observações de uma proposta
export function useNotesCount(proposalId?: string) {
  const [count, setCount] = useState<number>(0);

  const fetchCount = useCallback(async () => {
    if (!proposalId) {
      setCount(0);
      return;
    }
    
    try {
      const { count: c, error } = await supabase
        .from("proposal_notes")
        .select("*", { count: "exact", head: true })
        .eq("proposal_id", proposalId);
        
      if (!error && typeof c === "number") {
        setCount(c);
      } else if (error) {
        console.error('Erro ao buscar contagem de observações:', error);
        setCount(0);
      }
    } catch (error) {
      console.error('Erro na função fetchCount:', error);
      setCount(0);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchCount();
    
    // Opcional: Realtime updates (descomentado para funcionar)
    if (proposalId) {
      const channel = supabase
        .channel(`notes-count-${proposalId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'proposal_notes',
            filter: `proposal_id=eq.${proposalId}`
          },
          () => {
            fetchCount();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchCount, proposalId]);

  return { count, refreshCount: fetchCount };
}

// Hook para lista de observações
export function useNotesList(proposalId?: string) {
  const [notes, setNotes] = useState<ProposalNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!proposalId) {
      setNotes([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("proposal_notes")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        setNotes(data as ProposalNote[]);
      } else if (error) {
        console.error('Erro ao buscar observações:', error);
        setNotes([]);
      }
    } catch (error) {
      console.error('Erro na função fetchNotes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  const addNote = useCallback(async (text: string, author?: string) => {
    if (!proposalId || !text.trim()) return;
    
    // Update otimista
    const optimistic: ProposalNote = {
      id: crypto.randomUUID(),
      proposal_id: proposalId,
      text: text.trim(),
      author_name: author || null,
      created_at: new Date().toISOString(),
    };
    
    setNotes(prev => [optimistic, ...prev]);
    
    try {
      const { data, error } = await supabase
        .from("proposal_notes")
        .insert({
          proposal_id: proposalId,
          text: optimistic.text,
          author_name: optimistic.author_name
        })
        .select("*")
        .single();
        
      if (error || !data) {
        // Rollback otimista em caso de erro
        setNotes(prev => prev.filter(n => n.id !== optimistic.id));
        throw error || new Error('Erro ao salvar observação');
      } else {
        // Substitui o otimista pelo definitivo
        setNotes(prev => [data as ProposalNote, ...prev.filter(n => n.id !== optimistic.id)]);
      }
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      setNotes(prev => prev.filter(n => n.id !== optimistic.id));
      throw error;
    }
  }, [proposalId]);

  useEffect(() => {
    fetchNotes();
    
    // Opcional: Realtime updates
    if (proposalId) {
      const channel = supabase
        .channel(`notes-${proposalId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'proposal_notes',
            filter: `proposal_id=eq.${proposalId}`
          },
          (payload) => {
            // Adicionar nova observação no topo
            const newNote = payload.new as ProposalNote;
            setNotes(prev => {
              // Evitar duplicatas (caso a inserção otimista já tenha adicionado)
              if (prev.some(n => n.id === newNote.id)) {
                return prev;
              }
              return [newNote, ...prev];
            });
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchNotes, proposalId]);

  return { notes, loading, fetchNotes, addNote };
}