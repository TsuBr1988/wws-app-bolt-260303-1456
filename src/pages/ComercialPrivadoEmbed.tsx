import ExternalAppFrame from "@/components/ExternalAppFrame";

export default function ComercialPrivadoEmbed() {
  return (
    <div className="w-full min-h-screen">
      <ExternalAppFrame
        src={import.meta.env.VITE_PRIVADO_URL || "https://dashprivadogrupowws.netlify.app/"}
        title="Dash Privado"
        allowedOrigins={["https://dashprivadogrupowws.netlify.app"]}
      />
    </div>
  );
}
