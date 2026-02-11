import { useState, FormEvent } from 'react';
import { X, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import SearchablePersonSelect from './SearchablePersonSelect';

interface AddBookLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBookLoanModal({
  isOpen,
  onClose,
  onSuccess,
}: AddBookLoanModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pessoa: '',
    livro: '',
    autor: '',
    data_emprestimo: new Date().toISOString().split('T')[0],
    numero_paginas: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !formData.pessoa ||
      !formData.livro ||
      !formData.autor ||
      !formData.data_emprestimo ||
      !formData.numero_paginas
    ) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase.from('book_loans').insert([
        {
          pessoa: formData.pessoa,
          livro: formData.livro,
          autor: formData.autor,
          data_emprestimo: formData.data_emprestimo,
          numero_paginas: parseInt(formData.numero_paginas),
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Empréstimo cadastrado',
        description: 'O empréstimo foi cadastrado com sucesso.',
      });

      setFormData({
        pessoa: '',
        livro: '',
        autor: '',
        data_emprestimo: new Date().toISOString().split('T')[0],
        numero_paginas: '',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating book loan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar o empréstimo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Novo Empréstimo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Pessoa
            </label>
            <SearchablePersonSelect
              value={formData.pessoa}
              onChange={(value) =>
                setFormData({ ...formData, pessoa: value })
              }
              placeholder="Selecione ou adicione uma pessoa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Livro
            </label>
            <Input
              type="text"
              value={formData.livro}
              onChange={(e) =>
                setFormData({ ...formData, livro: e.target.value })
              }
              placeholder="Digite o nome do livro"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Autor
            </label>
            <Input
              type="text"
              value={formData.autor}
              onChange={(e) =>
                setFormData({ ...formData, autor: e.target.value })
              }
              placeholder="Digite o nome do autor"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Empréstimo
            </label>
            <Input
              type="date"
              value={formData.data_emprestimo}
              onChange={(e) =>
                setFormData({ ...formData, data_emprestimo: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Páginas
            </label>
            <Input
              type="number"
              value={formData.numero_paginas}
              onChange={(e) =>
                setFormData({ ...formData, numero_paginas: e.target.value })
              }
              placeholder="Digite o número de páginas"
              min="1"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
