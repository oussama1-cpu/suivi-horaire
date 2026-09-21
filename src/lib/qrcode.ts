import "server-only";
import QRCode from "qrcode";

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { width: 320, margin: 2 });
}
