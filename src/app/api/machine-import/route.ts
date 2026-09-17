import { apiResponse, assertLocalRequest, readJsonRequest } from "@/lib/http";
import {
  getMachineImportDefaults,
  importFromMachine,
} from "@/lib/machine-import";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return apiResponse(() => {
    assertLocalRequest(request);
    return getMachineImportDefaults();
  });
}

export async function POST(request: Request) {
  return apiResponse(async () =>
    importFromMachine(await readJsonRequest(request)),
  );
}
