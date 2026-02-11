import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Lock } from 'lucide-react';

interface ProtectedIndicatorProps {
  page: string;
  indicator: string;
  children: ReactNode;
  renderReadOnly?: (children: ReactNode) => ReactNode;
}

export function ProtectedIndicator({
  page,
  indicator,
  children,
  renderReadOnly
}: ProtectedIndicatorProps) {
  const { hasIndicatorAccess, canEditIndicator } = useAuth();

  if (!hasIndicatorAccess(page, indicator)) {
    return null;
  }

  const canEdit = canEditIndicator(page, indicator);

  if (!canEdit && renderReadOnly) {
    return <>{renderReadOnly(children)}</>;
  }

  if (!canEdit) {
    return (
      <div className="relative">
        {children}
        <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex items-center justify-center backdrop-blur-[1px] cursor-not-allowed rounded-lg">
          <div className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <Lock className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700 font-medium">Apenas visualização</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
