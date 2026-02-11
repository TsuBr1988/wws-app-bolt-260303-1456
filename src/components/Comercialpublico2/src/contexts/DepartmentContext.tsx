import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Department = 'Comercial Público' | 'Petrobras';

interface DepartmentContextType {
  selectedDepartment: Department;
  setSelectedDepartment: (department: Department) => void;
  availableDepartments: Department[];
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

interface DepartmentProviderProps {
  children: ReactNode;
}

export const DepartmentProvider: React.FC<DepartmentProviderProps> = ({ children }) => {
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('Comercial Público');
  
  const availableDepartments: Department[] = ['Comercial Público', 'Petrobras'];

  return (
    <DepartmentContext.Provider value={{
      selectedDepartment,
      setSelectedDepartment,
      availableDepartments
    }}>
      {children}
    </DepartmentContext.Provider>
  );
};

export const useDepartment = (): DepartmentContextType => {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error('useDepartment must be used within a DepartmentProvider');
  }
  return context;
};