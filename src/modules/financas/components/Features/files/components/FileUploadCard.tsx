
import React from 'react';
import { FileText, Upload, X } from 'lucide-react';

interface FileUploadCardProps {
  label: string;
  description: string;
  file: File | null;
  onUpload: (f: File) => void;
  onRemove: () => void;
  colorClass: string;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({ label, description, file, onUpload, onRemove, colorClass }) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`relative group rounded-[2rem] transition-all duration-300 overflow-hidden
        ${file
          ? 'bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-transparent hover:shadow-lg'
          : 'bg-white border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        } h-40 flex flex-col justify-center px-6`}
    >
      {file ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10`}>
              <FileText className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{file.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Pronto para processar</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-slate-50 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-500">
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{label}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">{description}</p>
            </div>
          </div>
          <input
            type="file"
            accept=".txt,.csv,.tsv,.xlsx,.xls,.xxlsx"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
        </>
      )}
    </div>
  );
};

export default FileUploadCard;
