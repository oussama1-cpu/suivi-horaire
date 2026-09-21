"use client";

import * as React from "react";
import { YearCalendar } from "@/components/calendar/year-calendar";
import { DayMarker } from "@/components/calendar/mini-month";
import { DayDetailDialog, EmployeeDayStatus } from "@/components/admin/day-detail-dialog";
import { DayType } from "@/lib/types";

export function AdminYearCalendar({
  year,
  dayTypeByDate,
  markersByDate,
  employeeLegend,
  statusesByDate,
}: {
  year: number;
  dayTypeByDate: Record<string, DayType>;
  markersByDate?: Record<string, DayMarker>;
  employeeLegend?: { label: string; className: string }[];
  statusesByDate: Record<string, EmployeeDayStatus[]>;
}) {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  return (
    <>
      <YearCalendar
        year={year}
        dayTypeByDate={dayTypeByDate}
        markersByDate={markersByDate}
        onDayClick={(date) => setSelectedDate(date)}
        legendTypes={["ferie_paye", "ferie_non_paye", "repos"]}
        extraLegend={employeeLegend}
      />
      <DayDetailDialog
        date={selectedDate}
        statuses={selectedDate ? statusesByDate[selectedDate] ?? [] : []}
        currentCompanyType={selectedDate ? dayTypeByDate[selectedDate] ?? null : null}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
