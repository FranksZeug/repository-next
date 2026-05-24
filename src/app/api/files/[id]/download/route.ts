import { datahubFetch, handleRouteError, jsonError } from "@/lib/datahub";
import { requireToken } from "@/lib/session";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const token = await requireToken();
    const { id } = await context.params;
    const res = await datahubFetch(
      token,
      `/api/files/${encodeURIComponent(id)}/download`,
      { headers: { Accept: "*/*" } }
    );

    if (!res.ok) {
      const text = await res.text();
      let message = text;
      try {
        message = (JSON.parse(text) as { message?: string }).message || text;
      } catch {
        /* raw */
      }
      return jsonError(message || `Download fehlgeschlagen (${res.status}).`, res.status);
    }

    const headers = new Headers();
    const contentType = res.headers.get("content-type");
    const disposition = res.headers.get("content-disposition");
    if (contentType) headers.set("Content-Type", contentType);
    if (disposition) headers.set("Content-Disposition", disposition);

    return new Response(res.body, { status: 200, headers });
  } catch (err) {
    return handleRouteError(err);
  }
}
