import { useEffect } from 'react';
import App from '@/components/Comercialpublico2/src/App';
import { AccessProvider } from '@/components/Comercialpublico2/src/contexts/AccessContext';
import { DepartmentProvider } from '@/components/Comercialpublico2/src/contexts/DepartmentContext';
import { YearProvider } from '@/components/Comercialpublico2/src/contexts/YearContext';
import { SystemVersionProvider } from '@/components/Comercialpublico2/src/contexts/SystemVersionContext';

function ComercialPublico2EmbedContent() {
  useEffect(() => {
    localStorage.setItem('accessType', 'comercial');
  }, []);

  return <App />;
}

export default function ComercialPublico2Embed() {
  return (
    <div className="w-full min-h-screen bg-white">
      <SystemVersionProvider>
        <YearProvider>
          <DepartmentProvider>
            <AccessProvider>
              <ComercialPublico2EmbedContent />
            </AccessProvider>
          </DepartmentProvider>
        </YearProvider>
      </SystemVersionProvider>
    </div>
  );
}
