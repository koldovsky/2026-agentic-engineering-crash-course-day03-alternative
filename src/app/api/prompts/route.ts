import { apiResponse, assertLocalRequest } from "@/lib/http";
import { getDisplayBundle, parseQuery, queryPrompts } from "@/lib/queries";

export const runtime = "nodejs";
export async function GET(request: Request) {
  return apiResponse(() => {
    assertLocalRequest(request);
    const query = parseQuery(new URL(request.url).searchParams);
    return queryPrompts(getDisplayBundle(query.source, true), query);
  });
}
