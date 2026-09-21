"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

interface EmployeeFilterProps {
  employees: { id: string; full_name: string }[];
  value: string;
}

export function EmployeeFilter({ employees, value }: EmployeeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("employee", next);
    else params.delete("employee");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-56">
      <option value="">Tous les employés</option>
      {employees.map((e) => (
        <option key={e.id} value={e.id}>
          {e.full_name}
        </option>
      ))}
    </Select>
  );
}
