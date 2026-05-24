import { getEffectivePath } from "@/lib/constants";
import {
  datahubFetch,
  handleRouteError,
  jsonError,
  parseDatahubError,
} from "@/lib/datahub";
import { requireToken } from "@/lib/session";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = await requireToken();
    const params = request.nextUrl.searchParams;

    const pathFilter = params.get("path")?.trim() ?? "";
    const yearFilter = params.get("year")?.trim() ?? "";
    const effectivePath = getEffectivePath(pathFilter, yearFilter);

    const url = new URL("/api/files", "http://local");
    if (effectivePath) url.searchParams.set("path", effectivePath);
    const aktivId = params.get("aktiv_id")?.trim();
    if (aktivId) url.searchParams.set("aktiv_id", aktivId);
    const reprotyp = params.get("reprotyp")?.trim();
    if (reprotyp) url.searchParams.set("reprotyp", reprotyp);
    const freigabe = params.get("freigabe")?.trim();
    if (freigabe) url.searchParams.set("freigabe", freigabe);
    const since = params.get("since")?.trim();
    if (since) url.searchParams.set("since", since);
    const page = params.get("page")?.trim();
    if (page) url.searchParams.set("page", page);

    const res = await datahubFetch(token, `${url.pathname}${url.search}`);
    if (!res.ok) {
      return jsonError(await parseDatahubError(res), res.status);
    }

    const json = await res.json();
    return Response.json(json);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await requireToken();
    const formData = await request.formData();
    const res = await datahubFetch(token, "/api/files", {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return jsonError(await parseDatahubError(res), res.status);
    }

    const json = await res.json();
    return Response.json(json, { status: res.status });
  } catch (err) {
    return handleRouteError(err);
  }
}
