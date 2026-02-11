import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SystemVersion = 'commercial' | 'administrative';

interface SystemVersionContextType {
  version: SystemVersion;
  setVersion: (version: SystemVersion) => void;
  isAdministrative: boolean;
  isCommercial: boolean;
  canEdit: (section: string) => boolean;
  canView: (section: string) => boolean;
}

const SystemVersionContext = createContext<SystemVersionContextType | undefined>(undefined);

interface SystemVersionProviderProps {
  children: ReactNode;
}

export const SystemVersionProvider: React.FC<SystemVersionProviderProps> = ({ children }) => {
  const [version, setVersion] = useState<SystemVersion>('commercial');

  const isAdministrative = version === 'administrative';
  const isCommercial = version === 'commercial';

  const canEdit = (section: string): boolean => {
    if (isAdministrative) {
      return true; // Admin pode editar tudo
    }
    
    if (isCommercial) {
      return section === 'proposals' || section === 'budgets'; // Comercial pode editar propostas e orçamentos
    }
    
    return false;
  };

  const canView = (section: string): boolean => {
    // Todos podem visualizar todas as seções
    // Apenas a edição é restrita
    return true;
  };
  return (
    <SystemVersionContext.Provider value={{
      version,
      setVersion,
      isAdministrative,
      isCommercial,
      canEdit,
      canView
    }}>
      {children}
    </SystemVersionContext.Provider>
  );
};

export const useSystemVersion = (): SystemVersionContextType => {
  const context = useContext(SystemVersionContext);
  if (context === undefined) {
    throw new Error('useSystemVersion must be used within a SystemVersionProvider');
  }
  return context;
};