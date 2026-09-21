"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MONTH_NAMES_FR } from "@/lib/constants";

export function MonthSelector({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(deltaMonths: number) {
    let newMonth = month + deltaMonths;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    router.push(`${pathname}?year=${newYear}&month=${newMonth}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-slate-900 w-36 text-center">
        {MONTH_NAMES_FR[month]} {year}
      </span>
      <Button variant="outline" size="icon" onClick={() => go(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
