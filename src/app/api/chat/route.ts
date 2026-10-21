import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { generateLandingPage } from "@/lib/gemini";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getUsage, recordUsage } from "@/lib/usage";
import { promptSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 120;

const HISTORY_LIMIT = 50;
const CONTEXT_LIMIT = 6;
const MAX_STORED = 100;
const messageSelect = { id: true, role: true, content: true, createdAt: true, shareId: true } as const;

declare global {
  var chatInFlight: Set<string> | undefined;
}

// One generation at a time per user
const inFlight = (global.chatInFlight ??= new Set<string>());

export async function GET() {
  try {
    const userId = await requireUserId();
    const [messages, usage] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT,
        select: messageSelect,
      }),
      getUsage(userId),
    ]);
    return json({ messages: messages.reverse(), usage });
  } catch (err) {
    return errorResponse(err, "API_CHAT_GET");
  }
}

export async function POST(req: NextRequest) {
  let lockedUserId: string | undefined;
  try {
    assertSameOrigin(req);
    const userId = await requireUserId();

    if (inFlight.has(userId)) throw new HttpError(429, "Please wait for the current page to finish generating.");
    inFlight.add(userId);
    lockedUserId = userId;

    enforceRateLimit(`chat:min:${userId}`, 5, 60 * 1000, "You're generating too fast. Please wait a minute.");

    const parsed = promptSchema.safeParse(await readJson(req, 8 * 1024));
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid prompt");
    const { prompt, options } = parsed.data;

    const [usage, history] = await Promise.all([
      getUsage(userId),
      prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: CONTEXT_LIMIT,
        select: { role: true, content: true },
      }),
    ]);
    if (usage.used >= usage.limit) throw new HttpError(429, "Daily generation limit reached. Please come back tomorrow.");

    const html = await generateLandingPage(prompt, options, history.reverse(), req.signal);

    const now = Date.now();
    const [userMessage, message] = await prisma.$transaction([
      prisma.chatMessage.create({ data: { userId, role: "user", content: prompt, createdAt: new Date(now) }, select: messageSelect }),
      prisma.chatMessage.create({ data: { userId, role: "assistant", content: html, createdAt: new Date(now + 1) }, select: messageSelect }),
      ...recordUsage(userId),
    ]);

    // Keep only the newest messages per user
    const stale = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: MAX_STORED,
      select: { id: true },
    });
    if (stale.length) await prisma.chatMessage.deleteMany({ where: { id: { in: stale.map((m) => m.id) } } });

    return json({ userMessage, message, usage: { ...usage, used: usage.used + 1 } }, 201);
  } catch (err) {
    // Session still valid but the user row was deleted
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return errorResponse(new HttpError(401, "Your account no longer exists."), "API_CHAT_POST");
    }
    return errorResponse(err, "API_CHAT_POST");
  } finally {
    if (lockedUserId) inFlight.delete(lockedUserId);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const userId = await requireUserId();
    enforceRateLimit(`chat:clear:${userId}`, 10, 60 * 1000);
    await prisma.chatMessage.deleteMany({ where: { userId } });
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err, "API_CHAT_DELETE");
  }
}
