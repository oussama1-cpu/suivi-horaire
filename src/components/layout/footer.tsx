import { Copyright, Heart } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="hidden md:flex items-center justify-between border-t border-slate-200 bg-white px-4 lg:px-6 py-3 text-xs text-slate-500 print:hidden">
      <div className="flex items-center gap-1.5">
        <Copyright className="h-3.5 w-3.5" />
        <span className="font-medium">{year} ELENI - Consulting</span>
        <span className="hidden sm:inline">· Tous droits réservés</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span>Fait avec</span>
        <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
        <span>pour ELENI</span>
      </div>
    </footer>
  );
}
