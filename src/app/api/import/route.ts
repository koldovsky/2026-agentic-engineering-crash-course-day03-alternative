import { apiResponse, readJsonRequest } from "@/lib/http";
import { withLedger } from "@/lib/storage";
import { importData } from "@/lib/transfer";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return apiResponse(async () => {
    const input = await readJsonRequest(request);
    return withLedger((ledger) => importData(input, ledger));
  });
}
