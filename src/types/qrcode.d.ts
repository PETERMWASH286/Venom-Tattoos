declare module "qrcode" {
  export type QrOptions = {
    margin?: number;
    width?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    color?: { dark?: string; light?: string };
    type?: "png" | "svg" | "utf8";
  };

  export function toDataURL(text: string, options?: QrOptions): Promise<string>;
  export function toBuffer(text: string, options?: QrOptions): Promise<Buffer>;
}
