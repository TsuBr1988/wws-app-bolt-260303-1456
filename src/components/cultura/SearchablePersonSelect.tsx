import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { getDatabase } from '../../lib/databaseResolver';
import { useToast } from '../ui/use-toast';

const supabase = getDatabase('CULTURA');

interface Person {
  id: string;
  nome: string;
}

interface SearchablePersonSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchablePersonSelect({
  value,
  onChange,
  placeholder = 'Selecione ou adicione uma pessoa',
}: SearchablePersonSelectProps) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPersons();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPersons = async () => {
    try {
      const { data, error } = await supabase
        .from('book_readers')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setPersons(data || []);
    } catch (error) {
      console.error('Error loading persons:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de pessoas.',
        variant: 'destructive',
      });
    }
  };

  const handleAddNewPerson = async () => {
    if (!newPersonName.trim()) {
      toast({
        title: 'Nome inválido',
        description: 'Digite um nome válido para adicionar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('book_readers')
        .insert([{ nome: newPersonName.trim() }])
        .select()
        .single();

      if (error) throw error;

      const updatedPersons = [...persons, data].sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
      );
      setPersons(updatedPersons);
      onChange(data.nome);
      setNewPersonName('');
      setIsAddingNew(false);
      setIsOpen(false);

      toast({
        title: 'Pessoa adicionada',
        description: 'Nova pessoa adicionada com sucesso.',
      });
    } catch (error: any) {
      console.error('Error adding person:', error);

      if (error.code === '23505') {
        toast({
          title: 'Pessoa já existe',
          description: 'Esta pessoa já está cadastrada na lista.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível adicionar a pessoa.',
          variant: 'destructive',
        });
      }
    }
  };

  const filteredPersons = persons
    .filter((person) =>
      person.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    );

  const selectedPerson = persons.find((p) => p.nome === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pessoa..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-60">
            {filteredPersons.length > 0 ? (
              <div className="py-1">
                {filteredPersons.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      onChange(person.nome);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-100 transition-colors text-left ${
                      value === person.nome ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {person.nome}
                    </span>
                    {value === person.nome && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                Nenhuma pessoa encontrada
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 bg-gray-50">
            {isAddingNew ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewPerson();
                      } else if (e.key === 'Escape') {
                        setIsAddingNew(false);
                        setNewPersonName('');
                      }
                    }}
                    placeholder="Digite o nome da pessoa"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewPersonName('');
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddNewPerson}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Adicionar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Adicionar nova pessoa
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
