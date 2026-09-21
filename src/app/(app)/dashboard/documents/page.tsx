import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { listDocumentsByProfile } from "@/lib/queries";
import { EmployeeUploadForm } from "@/components/documents/employee-upload-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_LABELS: Record<string, string> = {
  employe: "Document employé",
  paie: "Fiche de paie",
  maladie: "Certificat de maladie",
  cv: "CV",
};

export default async function DocumentsPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const documents = await listDocumentsByProfile(profile.id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Mes documents</h1>
        <p className="text-sm text-slate-500">Envoyer et consulter mes documents</p>
      </div>

      <EmployeeUploadForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-slate-900 font-semibold">Documents envoyés</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 && (
            <p className="text-sm text-slate-500 p-4">Aucun document pour le moment.</p>
          )}
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={`/api/documents/${doc.id}`}
              className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{doc.original_name}</p>
                <p className="text-xs text-slate-500">
                  {CATEGORY_LABELS[doc.category]} —{" "}
                  {new Date(doc.uploaded_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                  {doc.note ? ` — ${doc.note}` : ""}
                </p>
              </div>
              <span className="text-sm text-[#545454] font-medium">Télécharger</span>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
