import { DRESpreadsheetService } from './dreSpreadsheetService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class AIChatService {
  private static apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  private static apiEndpoint = 'https://api.openai.com/v1/chat/completions';

  static async processQuestion(
    question: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    if (!this.apiKey || this.apiKey === 'your-openai-api-key') {
      return 'Por favor, configure a chave da API OpenAI no arquivo .env (VITE_OPENAI_API_KEY) para usar o chat de consulta DRE.';
    }

    try {
      await DRESpreadsheetService.fetchSpreadsheet();
      const spreadsheetInfo = DRESpreadsheetService.formatDataForAI();
      const clients = await DRESpreadsheetService.getClients();
      const months = await DRESpreadsheetService.getMonths();

      const systemPrompt = `Você é um assistente especializado em análise de dados financeiros DRE (Demonstração de Resultados por Estabelecimento).

Você tem acesso a uma planilha DRE com as seguintes informações:

${spreadsheetInfo}

Clientes disponíveis: ${clients.join(', ')}
Meses disponíveis: ${months.join(', ')}

Quando o usuário fizer uma pergunta:
1. Analise cuidadosamente a pergunta para identificar o cliente, mês e campo solicitado
2. Busque na planilha os dados correspondentes
3. Responda de forma clara e objetiva, formatando valores monetários em reais (R$)
4. Se não encontrar a informação, explique educadamente que o dado não está disponível
5. Se a pergunta for ambígua, peça esclarecimentos

Exemplos de perguntas que você pode responder:
- "Qual o valor do CSV de outubro do cliente Mario Gatti?"
- "Mostre a receita total de setembro da empresa X"
- "Compare os custos de agosto e setembro do cliente Y"

Sempre seja profissional, preciso e útil.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: question }
      ];

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);

        if (response.status === 401) {
          return 'Erro de autenticação: verifique se a chave da API OpenAI está correta.';
        }
        if (response.status === 429) {
          return 'Limite de requisições atingido. Aguarde alguns instantes e tente novamente.';
        }

        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;

      if (!answer) {
        throw new Error('Resposta inválida da API');
      }

      return answer.trim();
    } catch (error) {
      console.error('Error processing question:', error);

      if (error instanceof Error) {
        return `Erro ao processar pergunta: ${error.message}`;
      }

      return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
    }
  }

  static async searchInSpreadsheet(query: {
    cliente?: string;
    mes?: string;
    campo?: string;
  }): Promise<any[]> {
    try {
      return await DRESpreadsheetService.searchData(query);
    } catch (error) {
      console.error('Error searching spreadsheet:', error);
      return [];
    }
  }

  static getSampleQuestions(): string[] {
    return [
      'Qual o valor do CSV de outubro do cliente Mario Gatti?',
      'Mostre a receita total de setembro',
      'Quais são os clientes com maior faturamento em agosto?',
      'Compare os custos de julho e agosto',
      'Qual a margem de contribuição do cliente X em setembro?'
    ];
  }
}
