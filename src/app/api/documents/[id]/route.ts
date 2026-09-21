import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/session";
import { getDocumentById, getDocumentContent } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const me = await getSessionProfile();
  if (!me) return new NextResponse("Non authentifié", { status: 401 });

  const doc = await getDocumentById(id);
  if (!doc) return new NextResponse("Document introuvable", { status: 404 });

  if (me.role !== "admin" && doc.profile_id !== me.id) {
    return new NextResponse("Accès refusé", { status: 403 });
  }

  const file = await getDocumentContent(id);
  if (!file) return new NextResponse("Fichier manquant", { status: 404 });

  const encodedName = encodeURIComponent(file.original_name).replace(/%20/g, " ");

  return new NextResponse(new Uint8Array(file.content), {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
    },
  });
}
