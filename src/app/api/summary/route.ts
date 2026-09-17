import { apiResponse, assertLocalRequest } from "@/lib/http";
import { summarize } from "@/lib/aggregate";
import { getDisplayBundle, parseQuery } from "@/lib/queries";

export const runtime = "nodejs";
export async function GET(request: Request) {
  return apiResponse(() => {
    assertLocalRequest(request);
    const query = parseQuery(new URL(request.url).searchParams);
    return summarize(getDisplayBundle(query.source), query.filters);
  });
}
