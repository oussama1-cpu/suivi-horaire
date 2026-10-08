"use client";

import { useActionState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { resetPasswordAction } from "@/lib/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 px-4 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#b0abaa]/30 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#a9c9a0]/40 blur-3xl" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="ELENI" width={220} height={76} className="object-contain mb-4" priority />
          <p className="text-sm text-slate-500 mt-1">Nouveau mot de passe</p>
        </div>

        {state?.success ? (
          <div className="space-y-4 bg-white/90 backdrop-blur-sm p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60">
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{state.message}</p>
            <Link href="/login" className={buttonVariants({ size: "lg" }) + " w-full"}>
              Aller à la connexion
            </Link>
          </div>
        ) : (
          <form
            action={formAction}
            className="space-y-4 bg-white/90 backdrop-blur-sm p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60"
          >
            <input type="hidden" name="token" value={token} />
            <div className="space-y-1.5">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input id="password" name="password" type="password" required minLength={8} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input id="confirm" name="confirm" type="password" required minLength={8} placeholder="••••••••" />
            </div>

            {state?.message && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.message}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Enregistrement..." : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
