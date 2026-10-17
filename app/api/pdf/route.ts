import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Endpoint seguro para abrir os PDFs da pasta /assets diretamente no navegador ou celular.
 * Ex: /api/pdf?file=Aventuras/N1 - cavaleiro sombrio e tempestuoso.pdf
 */
export async function GET(request: NextRequest) {
  const fileParam = request.nextUrl.searchParams.get("file");
  if (!fileParam) {
    return NextResponse.json(
      { error: "Parâmetro 'file' ausente." },
      { status: 400 }
    );
  }

  // Normaliza e garante que o caminho permanece estritamente dentro de /assets
  const assetsDir = path.resolve(process.cwd(), "assets");
  const cleanRel = fileParam.replace(/^\/?assets\//, "");
  const resolvedPath = path.resolve(assetsDir, cleanRel);

  if (
    !resolvedPath.startsWith(assetsDir) ||
    !resolvedPath.toLowerCase().endsWith(".pdf")
  ) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  if (!fs.existsSync(resolvedPath)) {
    return NextResponse.json(
      { error: "Arquivo PDF não encontrado." },
      { status: 404 }
    );
  }

  const fileBuffer = fs.readFileSync(resolvedPath);
  const filename = path.basename(resolvedPath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(
        filename
      )}`,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
