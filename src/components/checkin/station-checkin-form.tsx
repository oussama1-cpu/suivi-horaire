"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyPinAndPunch } from "@/lib/actions/checkin";

interface Result {
  success?: boolean;
  error?: string;
  action?: "in" | "out";
  name?: string;
  time?: string | null;
}

export function StationCheckinForm() {
  const [pin, setPin] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4 || pending) return;
    setPending(true);
    setResult(null);
    const res = await verifyPinAndPunch(pin);
    setPending(false);
    setResult(res);
    setPin("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="Code PIN"
          autoFocus
          className="w-full text-center text-2xl tracking-[0.5em] rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#736d6c]"
        />
        <button
          type="submit"
          disabled={pending || pin.length < 4}
          className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#b0abaa] to-[#736d6c] px-4 py-3 text-sm font-medium text-white shadow-md shadow-[#545454]/20 transition-all active:scale-[0.97] hover:from-[#736d6c] hover:to-[#545454] disabled:opacity-50 disabled:pointer-events-none"
        >
          {pending ? "Vérification..." : "Valider"}
        </button>
      </form>

      {result?.success && (
        <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 flex items-center gap-2 justify-center">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {result.name} — {result.action === "in" ? "Arrivée pointée" : "Départ pointé"}
            {result.time ? ` à ${result.time.slice(0, 5)}` : ""}
          </p>
        </div>
      )}

      {result?.error && (
        <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 flex items-center gap-2 justify-center">
          <XCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{result.error}</p>
        </div>
      )}
    </div>
  );
}
