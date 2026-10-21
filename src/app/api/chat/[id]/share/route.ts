import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { idSchema } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function findOwnPage(req: NextRequest, params: Params["params"]) {
  assertSameOrigin(req);
  const userId = await requireUserId();
  enforceRateLimit(`chat:share:${userId}`, 20, 60 * 1000);

  const id = idSchema.safeParse((await params).id);
  if (!id.success) throw new HttpError(400, "Invalid id");

  const page = await prisma.chatMessage.findFirst({
    where: { id: id.data, userId, role: "assistant" },
    select: { id: true, shareId: true },
  });
  if (!page) throw new HttpError(404, "Page not found");
  return page;
}

// 18 random bytes = 24 url-safe chars, not guessable
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const page = await findOwnPage(req, params);
    if (page.shareId) return json({ shareId: page.shareId });

    const updated = await prisma.chatMessage.update({
      where: { id: page.id },
      data: { shareId: randomBytes(18).toString("base64url") },
      select: { shareId: true },
    });
    return json({ shareId: updated.shareId }, 201);
  } catch (err) {
    return errorResponse(err, "API_CHAT_SHARE");
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const page = await findOwnPage(req, params);
    await prisma.chatMessage.update({ where: { id: page.id }, data: { shareId: null } });
    return json({ shareId: null });
  } catch (err) {
    return errorResponse(err, "API_CHAT_UNSHARE");
  }
}
