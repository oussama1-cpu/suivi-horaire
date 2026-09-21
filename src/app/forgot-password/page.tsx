"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 px-4 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#b0abaa]/30 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#a9c9a0]/40 blur-3xl" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="ELENI" width={220} height={71} className="object-contain mb-4" priority />
          <p className="text-sm text-slate-500 mt-1">Mot de passe oublié</p>
        </div>

        <form
          action={formAction}
          className="space-y-4 bg-white/90 backdrop-blur-sm p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60"
        >
          <p className="text-sm text-slate-600">
            Entrez votre email professionnel : si un compte existe, un lien de réinitialisation valable 1 heure vous
            sera envoyé.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="vous@entreprise.com" />
          </div>

          {state?.message && (
            <p
              className={
                state.error
                  ? "text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
                  : "text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2"
              }
            >
              {state.message}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Envoi..." : "Envoyer le lien"}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
          </Link>
        </form>
      </div>
    </div>
  );
}
