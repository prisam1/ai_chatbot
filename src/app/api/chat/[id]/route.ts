import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { idSchema } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// Deletes one page version together with the prompt that produced it
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    assertSameOrigin(req);
    const userId = await requireUserId();
    enforceRateLimit(`chat:delete:${userId}`, 30, 60 * 1000);

    const id = idSchema.safeParse((await params).id);
    if (!id.success) throw new HttpError(400, "Invalid id");

    // Scoped by userId, so nobody can delete another user's page
    const page = await prisma.chatMessage.findFirst({
      where: { id: id.data, userId, role: "assistant" },
      select: { id: true, createdAt: true },
    });
    if (!page) throw new HttpError(404, "Page not found");

    const prompt = await prisma.chatMessage.findFirst({
      where: { userId, role: "user", createdAt: { lt: page.createdAt } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    const ids = prompt ? [page.id, prompt.id] : [page.id];
    await prisma.chatMessage.deleteMany({ where: { id: { in: ids }, userId } });
    return json({ deleted: ids });
  } catch (err) {
    return errorResponse(err, "API_CHAT_DELETE_ONE");
  }
}
