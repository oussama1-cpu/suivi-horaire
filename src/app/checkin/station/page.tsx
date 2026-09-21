import Image from "next/image";
import { Clock } from "lucide-react";
import { StationCheckinForm } from "@/components/checkin/station-checkin-form";

export default function StationCheckinPage() {
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
            <p className="text-lg font-semibold text-slate-900">Pointage bureau</p>
            <p className="text-sm text-slate-500">Entrez votre code PIN personnel</p>
          </div>

          <StationCheckinForm />
        </div>
      </div>
    </div>
  );
}
