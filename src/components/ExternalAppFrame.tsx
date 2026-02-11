import { useEffect, useRef, useState } from "react";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";

type Props = {
  src: string;
  title: string;
  allowedOrigins?: string[];
};

export default function ExternalAppFrame({ src, title, allowedOrigins = [] }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(720);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  console.log('ExternalAppFrame renderizando:', { src, title, loading, error });

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (!allowedOrigins.length || allowedOrigins.includes(ev.origin)) {
        if (ev.data && typeof ev.data === "object") {
          const payload = (ev.data as any).__extApp;
          if (payload?.type === "resize" && typeof payload?.height === "number") {
            setHeight(Math.max(400, Math.min(payload.height, 5000)));
          }
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [allowedOrigins]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [loading]);

  const handleIframeLoad = () => {
    console.log('Iframe carregou com sucesso:', title);
    setLoading(false);
    setError(false);
  };

  const handleIframeError = () => {
    console.error('Erro ao carregar iframe:', title);
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Não foi possível carregar o dashboard</h3>
        <p className="text-sm text-gray-500 mb-4 text-center max-w-md">
          O dashboard externo não pôde ser carregado nesta página. Isso pode acontecer devido a restrições de segurança do site.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir em nova aba
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ minHeight: 400 }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="w-full h-full border-0 rounded-xl shadow"
        style={{ minHeight: height }}
        allow="fullscreen; clipboard-read; clipboard-write"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}
