"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 px-4 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#b0abaa]/30 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#a9c9a0]/40 blur-3xl" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="ELENI" width={220} height={71} className="object-contain mb-4" priority />
          <p className="text-sm text-slate-500 mt-1">Connectez-vous à votre espace</p>
        </div>

        <form
          action={formAction}
          className="space-y-4 bg-white/90 backdrop-blur-sm p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="vous@entreprise.com" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link href="/forgot-password" className="text-xs text-[#545454] hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
