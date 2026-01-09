import { AlignmentType, ImageRun, Paragraph, TextRun } from "docx";

export type DocxImageType = "png" | "jpg" | "gif" | "bmp";

function normalizeTypeFromMimeOrExt(input: string | null | undefined): DocxImageType {
  const s = (input ?? "").toLowerCase();

  // MIME types
  if (s.includes("image/png")) return "png";
  if (s.includes("image/jpeg") || s.includes("image/jpg")) return "jpg";
  if (s.includes("image/gif")) return "gif";
  if (s.includes("image/bmp")) return "bmp";

  // Extensions
  if (s.endsWith(".png")) return "png";
  if (s.endsWith(".jpg") || s.endsWith(".jpeg")) return "jpg";
  if (s.endsWith(".gif")) return "gif";
  if (s.endsWith(".bmp")) return "bmp";

  return "png";
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function loadImageForDocx(
  src: string
): Promise<{ data: ArrayBuffer; type: DocxImageType } | null> {
  try {
    if (!src) return null;

    if (src.startsWith("data:")) {
      const match = src.match(/^data:(image\/[^;]+);base64,(.*)$/i);
      if (!match) return null;

      const mime = match[1];
      const base64 = match[2];
      const type = normalizeTypeFromMimeOrExt(mime);

      // WEBP (and other unsupported formats) won't render in Word via docx.
      if (mime.toLowerCase().includes("image/webp")) {
        console.warn("[docxImages] WEBP no soportado para Word (.docx). Usa PNG/JPG.");
        return null;
      }

      return { data: base64ToArrayBuffer(base64), type };
    }

    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    const type = normalizeTypeFromMimeOrExt(contentType || src);
    const data = await response.arrayBuffer();

    return { data, type };
  } catch (error) {
    console.warn("[docxImages] No se pudo cargar la imagen:", error);
    return null;
  }
}

export async function createDocxImageParagraphs(
  images: Array<{ src: string; caption?: string }>,
  options?: {
    width?: number;
    height?: number;
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    includeCaptions?: boolean;
  }
): Promise<Paragraph[]> {
  const width = options?.width ?? 500;
  const height = options?.height ?? 300;
  const alignment = options?.alignment ?? AlignmentType.CENTER;
  const includeCaptions = options?.includeCaptions ?? false;

  const paragraphs: Paragraph[] = [];

  for (const img of images) {
    const loaded = await loadImageForDocx(img.src);
    if (!loaded) continue;

    paragraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: loaded.data,
            transformation: { width, height },
            type: loaded.type,
          }),
        ],
        alignment,
        spacing: { before: 120, after: 120 },
      })
    );

    if (includeCaptions && img.caption) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: img.caption,
              italics: true,
              size: 18,
              color: "6b7280",
            }),
          ],
          alignment,
          spacing: { after: 200 },
        })
      );
    }
  }

  return paragraphs;
}
