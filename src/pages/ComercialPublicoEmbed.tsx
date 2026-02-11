import ExternalAppFrame from "@/components/ExternalAppFrame";

export default function ComercialPublicoEmbed() {
  return (
    <div className="w-full min-h-screen">
      <ExternalAppFrame
        src={import.meta.env.VITE_PUBLICO_URL || "https://comercialpublicowws.netlify.app/"}
        title="Dash Público"
        allowedOrigins={["https://comercialpublicowws.netlify.app"]}
      />
    </div>
  );
}
