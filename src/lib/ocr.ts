import "server-only";

/**
 * Extraction de texte à partir d'une image scannée (feuille de présence, document papier
 * pris en photo). Deux moteurs sont supportés :
 *  - OCR cloud (Google Cloud Vision) si les identifiants sont fournis via la variable
 *    d'environnement GOOGLE_VISION_API_KEY : plus précis, notamment sur l'écriture manuscrite.
 *  - Tesseract.js (local, gratuit, aucune clé requise) utilisé automatiquement en repli si
 *    aucune clé cloud n'est configurée, ou si l'appel cloud échoue.
 */

async function extractTextWithGoogleVision(buffer: Buffer): Promise<string | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return null;

  const base64 = buffer.toString("base64");
  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: { languageHints: ["fr", "en"] },
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.responses?.[0]?.fullTextAnnotation?.text;
  return typeof text === "string" && text.trim() ? text : null;
}

async function extractTextWithTesseract(buffer: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra+eng");
  try {
    const { data } = await worker.recognize(buffer);
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

export interface OcrExtractionResult {
  text: string;
  engine: "google_vision" | "tesseract";
}

/** Extrait le texte brut d'une image. Essaie le fournisseur cloud (si configuré),
 * puis retombe sur Tesseract.js en local si indisponible ou en erreur. */
export async function extractTextFromImage(buffer: Buffer): Promise<OcrExtractionResult> {
  try {
    const cloudText = await extractTextWithGoogleVision(buffer);
    if (cloudText) return { text: cloudText, engine: "google_vision" };
  } catch {
    // Ignoré : repli sur l'OCR local ci-dessous.
  }

  const text = await extractTextWithTesseract(buffer);
  return { text, engine: "tesseract" };
}
