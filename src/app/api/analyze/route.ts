import type { NextRequest } from 'next/server';
import { makeAnalyzeDrawing } from '@/composition/container';
import { UnsupportedDrawingTypeError } from '@/infrastructure/ingest/drawing-ingest';

// LLM calls can take longer than the default; use the Node runtime + a generous cap.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return Response.json({ error: 'No file uploaded. Send a "file" field.' }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    const cadFile = form.get('cad');
    const cad =
      cadFile instanceof File
        ? { bytes: new Uint8Array(await cadFile.arrayBuffer()), fileName: cadFile.name }
        : undefined;

    const report = await makeAnalyzeDrawing().execute({
      bytes,
      mediaType: file.type,
      fileName: file.name,
      cad,
    });

    return Response.json(report);
  } catch (err) {
    if (err instanceof UnsupportedDrawingTypeError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error('[analyze] failed:', err);
    const message = err instanceof Error ? err.message : 'Analysis failed.';
    return Response.json({ error: message }, { status: 500 });
  }
}
