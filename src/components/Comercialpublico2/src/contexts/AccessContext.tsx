import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AccessType = 'comercial' | 'administrativo' | 'interno' | null;

interface AccessContextType {
  accessType: AccessType;
  setAccessType: (type: AccessType) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

interface AccessProviderProps {
  children: ReactNode;
}

export const AccessProvider: React.FC<AccessProviderProps> = ({ children }) => {
  const [accessType, setAccessTypeState] = useState<AccessType>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('app_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userAccessType = user.comercial_publico_access_type as AccessType;
        setAccessTypeState(userAccessType || null);
      } catch (error) {
        console.error('Error loading user access type:', error);
        setAccessTypeState(null);
      }
    }
  }, []);

  const setAccessType = (type: AccessType) => {
    setAccessTypeState(type);
  };

  const logout = () => {
    setAccessTypeState(null);
  };

  const isAuthenticated = accessType !== null;

  return (
    <AccessContext.Provider value={{
      accessType,
      setAccessType,
      logout,
      isAuthenticated
    }}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = (): AccessContextType => {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};
