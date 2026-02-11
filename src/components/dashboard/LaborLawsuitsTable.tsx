import { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimpleLawsuitsData {
  [key: string]: number;
}

interface LaborLawsuitsTableProps {
  data: SimpleLawsuitsData;
  months: { monthYm: string; monthLabel: string }[];
  onSave: (data: SimpleLawsuitsData) => Promise<void>;
  loading: boolean;
}

export function LaborLawsuitsTable({ data, months, onSave, loading }: LaborLawsuitsTableProps) {
  const [tableData, setTableData] = useState<SimpleLawsuitsData>(data);
  const [monthsPerPage, setMonthsPerPage] = useState(6);
  const [startMonthIndex, setStartMonthIndex] = useState(Math.max(0, months.length - monthsPerPage));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  useEffect(() => {
    const updateMonthsPerPage = () => {
      if (window.innerWidth < 640) {
        setMonthsPerPage(2);
      } else if (window.innerWidth < 1024) {
        setMonthsPerPage(4);
      } else {
        setMonthsPerPage(6);
      }
    };

    updateMonthsPerPage();
    window.addEventListener('resize', updateMonthsPerPage);
    return () => window.removeEventListener('resize', updateMonthsPerPage);
  }, []);

  useEffect(() => {
    setStartMonthIndex(Math.max(0, months.length - monthsPerPage));
  }, [monthsPerPage, months.length]);

  const visibleMonths = months.slice(startMonthIndex, startMonthIndex + monthsPerPage);

  const handlePrevious = () => {
    if (startMonthIndex > 0) {
      setStartMonthIndex(startMonthIndex - 1);
    }
  };

  const handleNext = () => {
    if (startMonthIndex < months.length - monthsPerPage) {
      setStartMonthIndex(startMonthIndex + 1);
    }
  };

  const handleCellChange = (key: string, value: string) => {
    setTableData({
      ...tableData,
      [key]: Number(value) || 0,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tableData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevious}
            disabled={startMonthIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
            {visibleMonths[0]?.monthLabel} - {visibleMonths[visibleMonths.length - 1]?.monthLabel}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNext}
            disabled={startMonthIndex >= months.length - monthsPerPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving || loading}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleMonths.map((month) => (
                <TableHead key={month.monthYm} colSpan={2} className="text-center border-l first:border-l-0 text-xs sm:text-sm">
                  {month.monthLabel}
                </TableHead>
              ))}
            </TableRow>
            <TableRow>
              {visibleMonths.map((month) => (
                <Fragment key={month.monthYm}>
                  <TableHead className="text-center border-l first:border-l-0 w-[100px] sm:w-[120px] text-xs sm:text-sm">
                    Quantidade
                  </TableHead>
                  <TableHead className="text-center w-[120px] sm:w-[150px] text-xs sm:text-sm">
                    Valor R$
                  </TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {visibleMonths.map((month) => (
                <Fragment key={month.monthYm}>
                  <TableCell className="border-l first:border-l-0 p-1 sm:p-2">
                    <Input
                      type="number"
                      value={tableData[`${month.monthYm}_qty`] || 0}
                      onChange={(e) =>
                        handleCellChange(`${month.monthYm}_qty`, e.target.value)
                      }
                      className="w-full text-xs sm:text-sm"
                      min="0"
                    />
                  </TableCell>
                  <TableCell className="p-1 sm:p-2">
                    <Input
                      type="number"
                      value={tableData[`${month.monthYm}_amount`] || 0}
                      onChange={(e) =>
                        handleCellChange(`${month.monthYm}_amount`, e.target.value)
                      }
                      className="w-full text-xs sm:text-sm"
                      min="0"
                      step="0.01"
                    />
                  </TableCell>
                </Fragment>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
