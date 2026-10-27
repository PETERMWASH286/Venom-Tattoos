import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function PassQr({ value, className }: { value: string; className?: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;
    let live = true;
    void import("qrcode")
      .then((mod) =>
        mod.toDataURL(value, {
          margin: 2,
          width: 640,
          errorCorrectionLevel: "M",
          color: { dark: "#14160a", light: "#ffffff" },
        }),
      )
      .then((url) => {
        if (live) setSrc(url);
      })
      .catch(() => {
        if (live) setSrc("");
      });
    return () => {
      live = false;
    };
  }, [value]);

  if (!src) return <div className={cn("pass-qr skeleton", className)} aria-hidden="true" />;

  return (
    <img
      src={src}
      alt="Scannable QR code for this booking"
      width={640}
      height={640}
      className={cn("pass-qr", className)}
    />
  );
}
