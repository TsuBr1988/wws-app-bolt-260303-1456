import App from '@/components/Comercialprivado2/src/App';
import { YearProvider } from '@/components/Comercialprivado2/src/contexts/YearContext';
import { SystemVersionProvider } from '@/components/Comercialprivado2/src/contexts/SystemVersionContext';

export default function ComercialPrivado2Embed() {
  return (
    <div className="w-full min-h-screen bg-white">
      <SystemVersionProvider>
        <YearProvider>
          <App />
        </YearProvider>
      </SystemVersionProvider>
    </div>
  );
}
