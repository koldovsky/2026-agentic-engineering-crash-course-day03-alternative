import { apiResponse, assertLocalRequest } from "@/lib/http";
import { getBundle, parseQuery, queryMachines } from "@/lib/queries";

export const runtime = "nodejs";
export async function GET(request: Request) {
  return apiResponse(() => {
    assertLocalRequest(request);
    return queryMachines(getBundle(parseQuery(new URL(request.url).searchParams).source));
  });
}
