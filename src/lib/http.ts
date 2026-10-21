import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(public status: number, message: string, public headers: Record<string, string> = {}) {
    super(message);
  }
}

const NO_STORE = { "Cache-Control": "no-store" };

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function errorResponse(err: unknown, tag: string) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status, headers: { ...NO_STORE, ...err.headers } });
  }
  console.error(`[${tag}]`, err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500, headers: NO_STORE });
}

type HeaderSource = Headers | Record<string, unknown> | undefined;

function readHeader(headers: HeaderSource, name: string) {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  const value = headers[name];
  return typeof value === "string" ? value : Array.isArray(value) ? String(value[0]) : null;
}

export function getClientIp(headers: HeaderSource) {
  const forwarded = readHeader(headers, "x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || readHeader(headers, "x-real-ip") || "unknown";
}

// Blocks cross-site requests that ride on the session cookie
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "Forbidden");
  }
  if (!host || originHost !== host) throw new HttpError(403, "Forbidden");
}

// Reads a JSON body without buffering more than maxBytes
export async function readJson(req: Request, maxBytes: number): Promise<unknown> {
  if (!req.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new HttpError(415, "Content-Type must be application/json");
  }
  if (Number(req.headers.get("content-length") ?? 0) > maxBytes) {
    throw new HttpError(413, "Request is too large");
  }
  if (!req.body) throw new HttpError(400, "Request body is required");

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new HttpError(413, "Request is too large");
    }
    chunks.push(value);
  }

  const text = new TextDecoder().decode(Buffer.concat(chunks));
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}
