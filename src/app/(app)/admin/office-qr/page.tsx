import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import { generateQrDataUrl } from "@/lib/qrcode";
import { PrintButton } from "@/components/print/print-button";

export default async function OfficeQrPage() {
  await requireAdmin();

  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const stationUrl = `${proto}://${host}/checkin/station`;
  const qrDataUrl = await generateQrDataUrl(stationUrl);

  return (
    <div className="space-y-6 max-w-md">
      <div className="print:hidden">
        <h1 className="text-xl font-semibold text-slate-900">QR de pointage bureau</h1>
        <p className="text-sm text-slate-500">
          À imprimer et afficher à l&apos;entrée. Chaque employé scanne ce code puis saisit son code PIN
          personnel pour pointer son arrivée/départ.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR pointage bureau" className="mx-auto" width={280} height={280} />
        <p className="mt-4 font-medium text-slate-900">Pointage bureau</p>
      </div>

      <div className="print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
