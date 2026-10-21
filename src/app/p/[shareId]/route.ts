import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { shareIdSchema } from "@/lib/validation";

export const runtime = "nodejs";

// "sandbox" gives the page an opaque origin, so shared HTML can never act as this site
const SHARED_CSP = [
  "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox",
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src https: data:",
  "font-src data:",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

function textResponse(body: string, status: number) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

type Params = { params: Promise<{ shareId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  if (!rateLimit(`share:view:${getClientIp(req.headers)}`, 60, 60 * 1000).ok) {
    return textResponse("Too many requests. Please try again later.", 429);
  }

  const shareId = shareIdSchema.safeParse((await params).shareId);
  if (!shareId.success) return textResponse("This link is invalid.", 404);

  try {
    const page = await prisma.chatMessage.findUnique({
      where: { shareId: shareId.data },
      select: { content: true, role: true },
    });
    if (!page || page.role !== "assistant") return textResponse("This page doesn't exist or is no longer shared.", 404);

    return new Response(page.content, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": SHARED_CSP,
        "Cache-Control": "private, no-cache",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (err) {
    console.error("[SHARE_VIEW]", err);
    return textResponse("Something went wrong. Please try again.", 500);
  }
}
