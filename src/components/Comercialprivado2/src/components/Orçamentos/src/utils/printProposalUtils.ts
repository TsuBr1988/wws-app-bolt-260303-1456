/**
 * Utilitários para impressão de propostas
 * Sistema de impressão que gera documentos A4 com:
 * - Primeira página: Resumo completo da proposta
 * - Páginas seguintes: Detalhamento de cada posto (um posto por página)
 */

/**
 * Converte milímetros para pixels (assumindo 96 DPI)
 */
function mmToPx(mm: number, doc: Document = document): number {
  const dpi = 96;
  return (mm * dpi) / 25.4;
}

/**
 * Aguarda o carregamento das fontes
 */
async function waitForFonts(doc: Document): Promise<void> {
  if ((doc as any).fonts && (doc as any).fonts.ready) {
    try {
      await (doc as any).fonts.ready;
    } catch (error) {
      console.warn('Erro ao aguardar carregamento de fontes:', error);
    }
  }
}

/**
 * Clona um elemento do DOM removendo atributos desnecessários
 */
function cloneElement(element: Element): Element {
  const clone = element.cloneNode(true) as Element;

  // Remover atributos que podem causar problemas na impressão
  clone.removeAttribute('id');

  // Remover event listeners (já são removidos pelo cloneNode)
  return clone;
}

/**
 * Cria a página de resumo da proposta
 */
function createSummaryPage(modalEl: HTMLElement, doc: Document): HTMLElement {
  const summaryPage = doc.createElement('section');
  summaryPage.className = 'print-page print-summary fit-summary-if-needed';

  // Ordem das seções para a primeira página
  const sections = [
    'summary-header',
    'summary-cards',
    'summary-relacao-postos',
    'summary-materiais',
    'summary-capex',
    'summary-equipamentos',
    'summary-totais'
  ];

  // Adicionar cada seção encontrada
  sections.forEach(sectionKey => {
    const element = modalEl.querySelector(`[data-print="${sectionKey}"]`);
    if (element) {
      const cloned = cloneElement(element);
      summaryPage.appendChild(cloned);
    }
  });

  return summaryPage;
}

/**
 * Cria as páginas de detalhamento por posto
 */
function createPositionPages(modalEl: HTMLElement, doc: Document): HTMLElement[] {
  const positionPages: HTMLElement[] = [];
  const postoElements = modalEl.querySelectorAll('[data-print="posto"]');

  postoElements.forEach((postoEl) => {
    const page = doc.createElement('section');
    page.className = 'print-page print-posto';

    const cloned = cloneElement(postoEl);
    page.appendChild(cloned);

    positionPages.push(page);
  });

  return positionPages;
}

/**
 * Aplica ajuste de escala na página de resumo se necessário
 */
function adjustSummaryScale(summaryPage: HTMLElement, doc: Document): void {
  // Calcular altura útil da página A4 (297mm - 24mm de margens)
  const usableHeight = mmToPx(297 - 24, doc);

  // Forçar layout para calcular altura real
  doc.body.style.visibility = 'hidden';
  doc.body.style.position = 'absolute';

  // Aguardar próximo frame para garantir que o layout foi aplicado
  setTimeout(() => {
    const actualHeight = summaryPage.scrollHeight;

    // Se exceder a altura útil, aplicar escala
    if (actualHeight > usableHeight) {
      // Calcular escala necessária, mas não ir abaixo de 0.90
      const scale = Math.max(0.90, usableHeight / actualHeight);
      summaryPage.style.transform = `scale(${scale})`;
      summaryPage.style.transformOrigin = 'top left';

      console.log(`Página de resumo ajustada: ${actualHeight}px → escala ${scale.toFixed(3)}`);
    }

    doc.body.style.visibility = '';
    doc.body.style.position = '';
  }, 10);
}

/**
 * Cria o documento HTML para impressão
 */
function createPrintDocument(root: HTMLElement): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Proposta – Impressão</title>
  <link rel="stylesheet" href="/print.css"/>
  <style>
    /* Estilos inline adicionais para garantir funcionamento */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* Copiar classes do Tailwind necessárias */
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }

    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-base { font-size: 1rem; }
    .text-lg { font-size: 1.125rem; }
    .text-xl { font-size: 1.25rem; }
    .text-2xl { font-size: 1.5rem; }
    .text-3xl { font-size: 1.875rem; }

    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }

    .uppercase { text-transform: uppercase; }

    .rounded { border-radius: 0.25rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-full { border-radius: 9999px; }

    .border { border-width: 1px; }
    .border-2 { border-width: 2px; }

    .p-2 { padding: 0.5rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }

    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .ml-6 { margin-left: 1.5rem; }

    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    .overflow-x-auto { overflow-x: auto; }

    /* Cores */
    .bg-white { background-color: #ffffff; }
    .bg-slate-100 { background-color: #f1f5f9; }
    .bg-slate-700 { background-color: #334155; }
    .bg-slate-800 { background-color: #1e293b; }
    .bg-blue-50 { background-color: #eff6ff; }
    .bg-blue-100 { background-color: #dbeafe; }
    .bg-blue-600 { background-color: #2563eb; }
    .bg-blue-700 { background-color: #1d4ed8; }
    .bg-purple-50 { background-color: #faf5ff; }
    .bg-purple-200 { background-color: #e9d5ff; }
    .bg-purple-600 { background-color: #9333ea; }
    .bg-purple-700 { background-color: #7e22ce; }
    .bg-orange-50 { background-color: #fff7ed; }
    .bg-orange-200 { background-color: #fed7aa; }
    .bg-orange-600 { background-color: #ea580c; }
    .bg-orange-700 { background-color: #c2410c; }
    .bg-green-50 { background-color: #f0fdf4; }
    .bg-green-200 { background-color: #bbf7d0; }
    .bg-green-600 { background-color: #16a34a; }
    .bg-green-700 { background-color: #15803d; }
    .bg-teal-600 { background-color: #0d9488; }
    .bg-amber-100 { background-color: #fef3c7; }

    .text-white { color: #ffffff; }
    .text-slate-600 { color: #475569; }
    .text-slate-700 { color: #334155; }
    .text-slate-800 { color: #1e293b; }
    .text-slate-900 { color: #0f172a; }
    .text-blue-600 { color: #2563eb; }
    .text-blue-700 { color: #1d4ed8; }
    .text-blue-800 { color: #1e40af; }
    .text-blue-900 { color: #1e3a8a; }
    .text-purple-700 { color: #7e22ce; }
    .text-purple-900 { color: #581c87; }
    .text-orange-700 { color: #c2410c; }
    .text-orange-900 { color: #7c2d12; }
    .text-green-700 { color: #15803d; }
    .text-green-900 { color: #14532d; }
    .text-amber-600 { color: #d97706; }
    .text-amber-800 { color: #92400e; }

    .border-slate-200 { border-color: #e2e8f0; }
    .border-slate-300 { border-color: #cbd5e1; }
    .border-purple-200 { border-color: #e9d5ff; }
    .border-orange-200 { border-color: #fed7aa; }
    .border-blue-200 { border-color: #bfdbfe; }
    .border-green-200 { border-color: #bbf7d0; }

    .bg-gradient-to-r {
      background-image: linear-gradient(to right, var(--tw-gradient-stops));
    }
    .bg-gradient-to-br {
      background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
    }
    .from-blue-50 { --tw-gradient-from: #eff6ff; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
    .from-blue-600 { --tw-gradient-from: #2563eb; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
    .from-indigo-50 { --tw-gradient-from: #eef2ff; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
    .from-indigo-600 { --tw-gradient-from: #4f46e5; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
    .from-slate-700 { --tw-gradient-from: #334155; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
    .from-slate-800 { --tw-gradient-from: #1e293b; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
    .to-blue-700 { --tw-gradient-to: #1d4ed8; }
    .to-indigo-50 { --tw-gradient-to: #eef2ff; }
    .to-indigo-600 { --tw-gradient-to: #4f46e5; }
    .to-slate-800 { --tw-gradient-to: #1e293b; }

    .flex-1 { flex: 1 1 0%; }
    .flex-shrink-0 { flex-shrink: 0; }

    .h-24 { height: 6rem; }
    .w-auto { width: auto; }
    .w-full { width: 100%; }

    .object-contain { object-fit: contain; }

    .leading-tight { line-height: 1.25; }
    .break-words { word-wrap: break-word; }
  </style>
</head>
<body>
  <div class="print-root">${root.innerHTML}</div>
</body>
</html>`;
}

/**
 * Função principal para impressão de proposta
 * Monta o conteúdo em iframe invisível e aciona a impressão
 */
export function printProposalFromModal(modalEl: HTMLElement | null): void {
  if (!modalEl) {
    console.error('Elemento do modal não encontrado');
    return;
  }

  // Criar iframe invisível
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    console.error('Não foi possível acessar o documento do iframe');
    document.body.removeChild(iframe);
    return;
  }

  // Criar container raiz para impressão
  const printRoot = document.createElement('div');
  printRoot.className = 'print-root';

  // Criar página de resumo
  const summaryPage = createSummaryPage(modalEl, doc);
  printRoot.appendChild(summaryPage);

  // Criar páginas de postos
  const positionPages = createPositionPages(modalEl, doc);
  positionPages.forEach(page => {
    printRoot.appendChild(page);
  });

  // Escrever documento HTML completo
  doc.open();
  doc.write(createPrintDocument(printRoot));
  doc.close();

  // Aguardar carregamento e imprimir
  const doPrint = async () => {
    try {
      // Aguardar fontes
      await waitForFonts(doc);

      // Aguardar imagens
      const images = doc.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continuar mesmo se houver erro
          // Timeout de segurança
          setTimeout(resolve, 2000);
        });
      });
      await Promise.all(imagePromises);

      // Pequeno delay para garantir que o layout foi aplicado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Aplicar ajuste de escala na página de resumo se necessário
      const summaryInDoc = doc.querySelector('.print-summary') as HTMLElement;
      if (summaryInDoc) {
        adjustSummaryScale(summaryInDoc, doc);
      }

      // Aguardar mais um pouco após ajuste de escala
      await new Promise(resolve => setTimeout(resolve, 100));

      // Focar e imprimir
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }

      // Remover iframe após impressão
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);

    } catch (error) {
      console.error('Erro ao preparar impressão:', error);
      // Remover iframe em caso de erro
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }
  };

  doPrint();
}
