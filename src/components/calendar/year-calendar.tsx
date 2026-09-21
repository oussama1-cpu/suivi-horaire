"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MiniMonth, DayMarker } from "@/components/calendar/mini-month";
import { DAY_TYPE_COLORS, DAY_TYPE_LABELS } from "@/lib/constants";
import { DayType } from "@/lib/types";

interface YearCalendarProps {
  year: number;
  dayTypeByDate: Record<string, DayType>;
  markersByDate?: Record<string, DayMarker>;
  onDayClick?: (date: string) => void;
  legendTypes?: DayType[];
  /** Légende additionnelle (ex : une couleur par employé). */
  extraLegend?: { label: string; className: string }[];
}

const DEFAULT_LEGEND: DayType[] = ["conge", "maladie", "ferie_paye", "ferie_non_paye", "repos"];

export function YearCalendar({
  year,
  dayTypeByDate,
  markersByDate,
  onDayClick,
  legendTypes = DEFAULT_LEGEND,
  extraLegend,
}: YearCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();

  function go(delta: number) {
    router.push(`${pathname}?year=${year + delta}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => go(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-900 w-20 text-center">{year}</span>
          <Button variant="outline" size="icon" onClick={() => go(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {legendTypes.map((t) => (
            <Badge key={t} className={DAY_TYPE_COLORS[t]}>
              {DAY_TYPE_LABELS[t]}
            </Badge>
          ))}
        </div>
      </div>

      {extraLegend && extraLegend.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extraLegend.map((l) => (
            <Badge key={l.label} className={l.className}>
              {l.label}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }, (_, month) => (
          <MiniMonth
            key={month}
            year={year}
            month={month}
            dayTypeByDate={dayTypeByDate}
            markersByDate={markersByDate}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
}
