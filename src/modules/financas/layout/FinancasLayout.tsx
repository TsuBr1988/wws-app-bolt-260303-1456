import { ReactNode } from 'react';

interface FinancasLayoutProps {
  children: ReactNode;
}

export default function FinancasLayout({ children }: FinancasLayoutProps) {
  return (
    <div className="financas-layout">
      {children}
    </div>
  );
}
