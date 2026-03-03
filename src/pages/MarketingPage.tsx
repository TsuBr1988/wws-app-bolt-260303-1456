import { Marketing, type MarketingTabType } from '@/components/Comercialprivado2/src/components/Marketing/Marketing';
import { YearProvider } from '@/components/Comercialprivado2/src/contexts/YearContext';
import { SystemVersionProvider } from '@/components/Comercialprivado2/src/contexts/SystemVersionContext';

interface MarketingPageProps {
  initialTab: MarketingTabType;
}

export function MarketingPage({ initialTab }: MarketingPageProps) {
  return (
    <div className="w-full min-h-screen bg-white">
      <SystemVersionProvider>
        <YearProvider>
          <Marketing initialTab={initialTab} />
        </YearProvider>
      </SystemVersionProvider>
    </div>
  );
}
