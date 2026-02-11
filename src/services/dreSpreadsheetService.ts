import ExcelJS from 'exceljs';

interface DREData {
  cliente: string;
  mes: string;
  [key: string]: string | number;
}

export class DRESpreadsheetService {
  private static SPREADSHEET_URL = 'https://vehbyoihnkxzblsmlpdz.supabase.co/storage/v1/object/public/Base%20para%20resultado%20dos%20postos/DRE%20por%20postos.xlsx';
  private static cachedData: DREData[] | null = null;
  private static lastFetch: number | null = null;
  private static CACHE_DURATION = 5 * 60 * 1000;

  static async fetchSpreadsheet(): Promise<DREData[]> {
    const now = Date.now();

    if (this.cachedData && this.lastFetch && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedData;
    }

    try {
      const response = await fetch(this.SPREADSHEET_URL);

      if (!response.ok) {
        throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('Spreadsheet has no worksheets');
      }

      const headerRow = worksheet.getRow(1);
      const headers = headerRow.values
        .slice(1)
        .map((h) => String(h ?? '').trim())
        .filter(Boolean);

      const jsonData: DREData[] = [];

      for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        if (!row || row.cellCount === 0) continue;

        const obj: Record<string, string | number> = {};
        headers.forEach((key, i) => {
          const cell = row.getCell(i + 1);
          const cellValue = cell.value;

          let value: unknown = cellValue;
          if (value && typeof value === 'object' && 'result' in (value as any)) {
            value = (value as any).result;
          }

          if (value instanceof Date) {
            obj[key] = cell.text || value.toISOString();
          } else if (typeof value === 'number') {
            obj[key] = value;
          } else {
            obj[key] = String(value ?? cell.text ?? '').trim();
          }
        });

        // Only push non-empty rows
        if (Object.values(obj).some((v) => String(v).trim() !== '')) {
          jsonData.push(obj as DREData);
        }
      }

      this.cachedData = jsonData;
      this.lastFetch = now;

      return jsonData;
    } catch (error) {
      console.error('Error fetching DRE spreadsheet:', error);
      throw new Error('Não foi possível carregar a planilha DRE. Verifique sua conexão.');
    }
  }

  static async searchData(query: {
    cliente?: string;
    mes?: string;
    campo?: string;
  }): Promise<DREData[]> {
    const data = await this.fetchSpreadsheet();

    return data.filter(row => {
      if (query.cliente && !row.cliente?.toString().toLowerCase().includes(query.cliente.toLowerCase())) {
        return false;
      }
      if (query.mes && !row.mes?.toString().toLowerCase().includes(query.mes.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  static async getColumns(): Promise<string[]> {
    const data = await this.fetchSpreadsheet();
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }

  static async getClients(): Promise<string[]> {
    const data = await this.fetchSpreadsheet();
    const clients = new Set<string>();
    data.forEach(row => {
      if (row.cliente) {
        clients.add(row.cliente.toString());
      }
    });
    return Array.from(clients).sort();
  }

  static async getMonths(): Promise<string[]> {
    const data = await this.fetchSpreadsheet();
    const months = new Set<string>();
    data.forEach(row => {
      if (row.mes) {
        months.add(row.mes.toString());
      }
    });
    return Array.from(months).sort();
  }

  static clearCache(): void {
    this.cachedData = null;
    this.lastFetch = null;
  }

  static formatDataForAI(): string {
    if (!this.cachedData) return '';

    const columns = this.cachedData.length > 0 ? Object.keys(this.cachedData[0]) : [];
    const sampleRows = this.cachedData.slice(0, 5);

    return `
Colunas disponíveis: ${columns.join(', ')}

Exemplos de dados (primeiras 5 linhas):
${sampleRows.map(row => JSON.stringify(row)).join('\n')}

Total de registros: ${this.cachedData.length}
    `.trim();
  }
}
