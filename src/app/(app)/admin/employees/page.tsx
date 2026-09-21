import { listEmployees, getAllEntriesInRange } from "@/lib/queries";
import { EmployeesTable } from "@/components/admin/employees-table";
import { getMonthRange } from "@/lib/date";
import { sumHours } from "@/lib/hours";

export default async function AdminEmployeesPage() {
  const now = new Date();
  const { start, end } = getMonthRange(now.getFullYear(), now.getMonth());

  const [profiles, monthEntries] = await Promise.all([
    listEmployees(),
    getAllEntriesInRange(start, end),
  ]);
  const employees = profiles.map((p) => ({
    ...p,
    monthHours: sumHours(monthEntries.filter((e) => e.profile_id === p.id)),
  }));

  return (
    <div className="max-w-6xl">
      <EmployeesTable employees={employees} />
    </div>
  );
}
