import React from 'react';
import ChamadosTab from './components/ChamadosTab';

const TIApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6">
        <ChamadosTab />
      </div>
    </div>
  );
};

export default TIApp;
