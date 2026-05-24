import {
  datahubFetch,
  handleRouteError,
  jsonError,
  parseDatahubError,
} from "@/lib/datahub";
import { requireToken } from "@/lib/session";
import type { FileMetadataUpdate } from "@/lib/types";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = await requireToken();
    const { id } = await context.params;
    const body = (await request.json()) as FileMetadataUpdate;

    const res = await datahubFetch(token, `/api/files/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return jsonError(await parseDatahubError(res), res.status);
    }

    const text = await res.text();
    if (!text) return Response.json({ ok: true });
    return Response.json(JSON.parse(text));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const token = await requireToken();
    const { id } = await context.params;
    const res = await datahubFetch(
      token,
      `/api/files/${encodeURIComponent(id)}`,
      { method: "DELETE", headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      return jsonError(await parseDatahubError(res), res.status);
    }

    return new Response(null, { status: res.status === 200 ? 204 : res.status });
  } catch (err) {
    return handleRouteError(err);
  }
}
