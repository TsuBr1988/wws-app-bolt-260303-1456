import React from 'react';
import { FolderOpen, Plus, FileText, File, FileCheck } from 'lucide-react';

const DocumentosTab: React.FC = () => {
  const documentos = [
    { id: 1, codigo: 'PRC-001', titulo: 'Procedimento de Controle de Documentos', tipo: 'procedimento', versao: '2.0', status: 'ativo' },
    { id: 2, codigo: 'INS-002', titulo: 'Instrução de Trabalho - Inspeção de Qualidade', tipo: 'instrucao', versao: '1.5', status: 'ativo' },
    { id: 3, codigo: 'FOR-003', titulo: 'Formulário de Não Conformidade', tipo: 'formulario', versao: '3.0', status: 'ativo' },
    { id: 4, codigo: 'MAN-001', titulo: 'Manual da Qualidade', tipo: 'manual', versao: '4.0', status: 'ativo' },
  ];

  return (
    <div className="px-10 py-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark mb-2">Controle da Informação Documentada</h2>
          <p className="text-gray-600">Gerencie documentos, procedimentos e registros</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-5 h-5" />
          Novo Documento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {documentos.map((doc) => (
          <div key={doc.id} className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg transition-all hover:scale-102">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                {doc.tipo === 'procedimento' ? <FileCheck className="w-6 h-6" /> :
                 doc.tipo === 'manual' ? <FolderOpen className="w-6 h-6" /> :
                 <FileText className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-500">{doc.codigo}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    {doc.status === 'ativo' ? 'Ativo' : 'Obsoleto'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-brand-dark mb-2">{doc.titulo}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Versão {doc.versao}</span>
                  <span className="text-xs text-gray-500 capitalize">{doc.tipo}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentosTab;
