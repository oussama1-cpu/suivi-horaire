import Image from "next/image";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { findProfileByQrToken, getEntryByDate } from "@/lib/queries";
import { scanQrCode } from "@/lib/actions/checkin";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Code QR invalide.",
  inactive: "Ce compte employé est désactivé.",
  already: "Vous avez déjà pointé votre arrivée et votre départ aujourd'hui.",
};

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ success?: string; time?: string; error?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;

  const profile = await findProfileByQrToken(token);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm text-center">
          <Image src="/logo.png" alt="ELENI" width={170} height={55} className="object-contain mx-auto mb-6" />
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-slate-900 font-medium">Code QR invalide.</p>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const entry = await getEntryByDate(profile.id, today);
  const alreadyDone = !!entry?.start_time && !!entry?.end_time;
  const nextAction = !entry || !entry.start_time ? "in" : !entry.end_time ? "out" : null;

  const errorMessage = sp.error ? ERROR_MESSAGES[sp.error] ?? sp.error : null;

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 px-4 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#b0abaa]/30 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#a9c9a0]/40 blur-3xl" />

      <div className="w-full max-w-sm text-center relative z-10">
        <Image src="/logo.png" alt="ELENI" width={170} height={55} className="object-contain mx-auto mb-5" />
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 space-y-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#b0abaa] to-[#736d6c] flex items-center justify-center mx-auto shadow-md shadow-[#545454]/20">
          <Clock className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{profile.full_name}</p>
          <p className="text-sm text-slate-500">{profile.company}</p>
        </div>

        {sp.success && (
          <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 flex items-center gap-2 justify-center">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">
              {sp.success === "in" ? "Arrivée pointée" : "Départ pointé"} à {sp.time?.slice(0, 5)}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 flex items-center gap-2 justify-center">
            <XCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {entry?.start_time && (
          <p className="text-xs text-slate-500">
            Aujourd&apos;hui : arrivée {entry.start_time.slice(0, 5)}
            {entry.end_time ? ` — départ ${entry.end_time.slice(0, 5)}` : ""}
          </p>
        )}

        {nextAction && !alreadyDone && (
          <form action={scanQrCode.bind(null, token)}>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#b0abaa] to-[#736d6c] px-4 py-3 text-sm font-medium text-white shadow-md shadow-[#545454]/20 transition-all active:scale-[0.97] hover:from-[#736d6c] hover:to-[#545454]"
            >
              {nextAction === "in" ? "Pointer l'arrivée" : "Pointer le départ"}
            </button>
          </form>
        )}

        {alreadyDone && !sp.success && (
          <p className="text-sm text-slate-500">Pointage complet pour aujourd&apos;hui.</p>
        )}
        </div>
      </div>
    </div>
  );
}
