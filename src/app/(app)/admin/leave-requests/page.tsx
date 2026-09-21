import { listEmployees, listAllLeaveRequests } from "@/lib/queries";
import { LeaveRequestList } from "@/components/leaves/leave-request-list";
import { Card, CardContent, CardHeader, CardTitle, CardValue } from "@/components/ui/card";

export default async function AdminLeaveRequestsPage() {
  const [employees, requests] = await Promise.all([listEmployees(), listAllLeaveRequests()]);
  const employeeNames = Object.fromEntries(employees.map((e) => [e.id, e.full_name]));

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Demandes de congé & maladie</h1>
        <p className="text-sm text-slate-500">
          Acceptez ou refusez les demandes. Une demande acceptée est automatiquement inscrite dans le planning de
          l&apos;employé et dans le calendrier de l&apos;équipe.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>En attente</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <CardValue>{pending.length}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Acceptées</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <CardValue>{requests.filter((r) => r.status === "approved").length}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Refusées</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <CardValue>{requests.filter((r) => r.status === "rejected").length}</CardValue>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 mb-3">À traiter</h2>
        <LeaveRequestList
          requests={pending}
          mode="admin"
          employeeNames={employeeNames}
          emptyMessage="Aucune demande en attente."
        />
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 mb-3">Historique</h2>
        <LeaveRequestList
          requests={decided}
          mode="admin"
          employeeNames={employeeNames}
          emptyMessage="Aucune demande traitée."
        />
      </div>
    </div>
  );
}
