import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionProfile } from "@/lib/session";
import { getQrToken, getPinCode } from "@/lib/queries";
import { generateQrDataUrl } from "@/lib/qrcode";
import { PrintButton } from "@/components/print/print-button";

export default async function QrCodePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const [token, pinCode] = await Promise.all([getQrToken(profile.id), getPinCode(profile.id)]);
  if (!token) redirect("/dashboard");

  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const checkinUrl = `${proto}://${host}/checkin/${token}`;
  const qrDataUrl = await generateQrDataUrl(checkinUrl);

  return (
    <div className="space-y-6 max-w-md">
      <div className="print:hidden">
        <h1 className="text-xl font-semibold text-slate-900">Mon code QR</h1>
        <p className="text-sm text-slate-500">
          Scannez ce code avec votre téléphone pour pointer votre arrivée et votre départ, sans avoir à vous
          connecter.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Code QR de pointage" className="mx-auto" width={280} height={280} />
        <p className="mt-4 font-medium text-slate-900">{profile.full_name}</p>
        <p className="text-xs text-slate-500">{profile.company}</p>
      </div>

      {pinCode && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center print:hidden">
          <p className="text-xs text-slate-500 mb-1">Code PIN de pointage bureau</p>
          <p className="font-mono text-2xl tracking-widest text-slate-900">{pinCode}</p>
        </div>
      )}

      <div className="print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
