import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { enhancePrompt } from "@/lib/gemini";
import { assertSameOrigin, errorResponse, HttpError, json, readJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enhanceSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const userId = await requireUserId();
    enforceRateLimit(`enhance:min:${userId}`, 6, 60 * 1000, "Too many enhance requests. Please wait a minute.");
    enforceRateLimit(`enhance:hour:${userId}`, 60, 60 * 60 * 1000, "Hourly enhance limit reached. Please try again later.");

    const parsed = enhanceSchema.safeParse(await readJson(req, 8 * 1024));
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid prompt");

    const prompt = await enhancePrompt(parsed.data.prompt, req.signal);
    return json({ prompt });
  } catch (err) {
    return errorResponse(err, "API_CHAT_ENHANCE");
  }
}
