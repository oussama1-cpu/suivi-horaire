import { listAllAccounts } from "@/lib/queries";
import { AccountsTable } from "@/components/admin/accounts-table";

export default async function AdminAccountsPage() {
  const accounts = await listAllAccounts();

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Gestion des comptes</h1>
        <p className="text-sm text-slate-500">
          Modifier l&apos;email, réinitialiser le mot de passe ou changer le rôle de n&apos;importe quel compte.
        </p>
      </div>
      <AccountsTable accounts={accounts} />
    </div>
  );
}
