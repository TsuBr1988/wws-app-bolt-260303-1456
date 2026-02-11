import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  fileUrl: string;
  title?: string;
  height?: string;
  buttonLabel?: string;
};

export default function PlanilhaResultadosModal({
  fileUrl,
  title = "Resultados por Postos — Planilha",
  height = "80vh",
  buttonLabel = "Planilha",
}: Props) {
  const [open, setOpen] = useState(false);

  const embedSrc = useMemo(() => {
    const officeBase = "https://view.officeapps.live.com/op/embed.aspx";
    const params = new URLSearchParams({
      src: fileUrl,
      wdHideGridlines: "True",
      t: String(Date.now()),
    });
    return `${officeBase}?${params.toString()}`;
  }, [fileUrl]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-base">{title}</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            <div className="w-full rounded-2xl overflow-hidden border">
              <iframe
                title={title}
                src={embedSrc}
                className="w-full"
                style={{ height, border: "none" }}
                allowFullScreen
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
