import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndicatorCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  accentColor?: string;
}

export function IndicatorCard({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  className,
  accentColor = '#3b82f6',
}: IndicatorCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div
        className="h-1 w-full"
        style={{ backgroundColor: accentColor }}
      />
      <CardHeader
        className="cursor-pointer select-none hover:bg-gray-50 transition-colors px-3 sm:px-6 py-3 sm:py-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <CardTitle className="text-base sm:text-lg md:text-xl truncate">{title}</CardTitle>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{subtitle}</p>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            )}
          </motion.div>
        </div>
      </CardHeader>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: [0.04, 0.62, 0.23, 0.98]
            }}
          >
            <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}