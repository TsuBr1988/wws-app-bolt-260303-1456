/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_GERAL_URL: string;
	readonly VITE_SUPABASE_GERAL_ANON: string;
	readonly VITE_SUPABASE_FINANCAS_URL: string;
	readonly VITE_SUPABASE_FINANCAS_ANON: string;
	readonly VITE_SUPABASE_COMERCIAL_PRIVADO_URL: string;
	readonly VITE_SUPABASE_COMERCIAL_PRIVADO_ANON: string;
	readonly VITE_SUPABASE_COMERCIAL_PUBLICO_URL: string;
	readonly VITE_SUPABASE_COMERCIAL_PUBLICO_ANON: string;
	readonly VITE_PUBLICO_URL?: string;
	readonly VITE_PRIVADO_URL?: string;
	readonly VITE_OPENAI_API_KEY?: string;
	readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
