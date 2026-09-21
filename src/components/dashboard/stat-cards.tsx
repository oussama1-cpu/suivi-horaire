import { Card, CardContent, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { formatHours } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function HoursCard({
  title,
  hours,
  target,
}: {
  title: string;
  hours: number;
  target?: number;
}) {
  const diff = target !== undefined ? hours - target : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <CardValue>{formatHours(hours)}</CardValue>
        {target !== undefined && diff !== null && (
          <p
            className={cn(
              "text-xs mt-1 font-medium",
              diff >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {diff >= 0 ? "+" : ""}
            {formatHours(diff)} vs objectif {formatHours(target)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND", maximumFractionDigits: 3 }).format(amount);
}

export function MoneyCard({ title, amount, hint }: { title: string; amount: number; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <CardValue>{formatMoney(amount)}</CardValue>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function fmtDays(n: number): string {
  return `${Number.isInteger(n) ? n : n.toFixed(1)}j`;
}

export function LeaveCard({
  title,
  total,
  used,
  hint,
}: {
  title: string;
  total: number;
  used: number;
  hint?: string;
}) {
  const remaining = Math.round((total - used) * 100) / 100;
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex items-baseline justify-between">
          <CardValue className={cn(remaining < 0 && "text-red-600")}>{fmtDays(remaining)}</CardValue>
          <span className="text-xs text-slate-500">
            {fmtDays(used)} utilisés / {fmtDays(total)}
          </span>
        </div>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
        <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#b0abaa] to-[#736d6c] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
