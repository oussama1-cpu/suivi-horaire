import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/session";
import { findProfileById, getQrToken } from "@/lib/queries";
import { generateQrDataUrl } from "@/lib/qrcode";
import { PrintButton } from "@/components/print/print-button";

export default async function EmployeeQrCodePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const profile = await findProfileById(id);
  if (!profile) notFound();

  const token = await getQrToken(id);
  if (!token) notFound();

  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const checkinUrl = `${proto}://${host}/checkin/${token}`;
  const qrDataUrl = await generateQrDataUrl(checkinUrl);

  return (
    <div className="space-y-6 max-w-md">
      <div className="print:hidden">
        <h1 className="text-xl font-semibold text-slate-900">Code QR — {profile.full_name}</h1>
        <p className="text-sm text-slate-500">À imprimer et remettre à l&apos;employé (badge de pointage).</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Code QR de pointage" className="mx-auto" width={280} height={280} />
        <p className="mt-4 font-medium text-slate-900">{profile.full_name}</p>
        <p className="text-xs text-slate-500">{profile.company}</p>
      </div>

      <div className="print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
