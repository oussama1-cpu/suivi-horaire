"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importTunisianHolidays } from "@/lib/actions/calendar";

export function ImportHolidaysButton({ year }: { year: number }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleImport() {
    if (
      !confirm(
        `Importer les jours fériés fixes tunisiens pour ${year} (Jour de l'an, Révolution, Indépendance, Martyrs, Travail, République, Femme, Évacuation) pour tous les employés ?`
      )
    ) {
      return;
    }
    setPending(true);
    await importTunisianHolidays(year);
    setPending(false);
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleImport} disabled={pending}>
      <CalendarPlus className="h-4 w-4" />
      {pending ? "Import..." : `Importer jours fériés Tunisie ${year}`}
    </Button>
  );
}
