import prisma from "./prisma";

export const DAILY_LIMIT = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Usage = { used: number; limit: number };

// Stored in the DB so clearing history or restarting the server can't reset it
export async function getUsage(userId: string): Promise<Usage> {
  const used = await prisma.generationUsage.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
  });
  return { used, limit: DAILY_LIMIT };
}

export function recordUsage(userId: string) {
  return [
    prisma.generationUsage.create({ data: { userId } }),
    prisma.generationUsage.deleteMany({ where: { userId, createdAt: { lt: new Date(Date.now() - DAY_MS) } } }),
  ] as const;
}
