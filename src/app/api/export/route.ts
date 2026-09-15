import { apiResponse, readJsonRequest } from "@/lib/http";
import { getBundle } from "@/lib/queries";
import { exportData, ExportRequestSchema } from "@/lib/transfer";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return apiResponse(async () => {
    const { source, includePrompts } = ExportRequestSchema.parse(await readJsonRequest(request));
    const text = exportData(getBundle(source, includePrompts), includePrompts);
    return new Response(text, { headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="token-atlas-${source}-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  });
}
