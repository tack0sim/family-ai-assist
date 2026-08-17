import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  redisClient = createClient({ url });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  await redisClient.connect();
  return redisClient;
}

export async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Generate a cache key for events within a week.
 * Format: events:{family_id}:week:{year}-W{week_number}
 */
export function generateEventsCacheKey(familyId: string, date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `events:${familyId}:week:${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Get ISO week number for a given date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/**
 * Invalidate event cache for all weeks affected by a date range
 */
export async function invalidateEventsCacheForDateRange(
  familyId: string,
  startDate: Date,
  endDate: Date
) {
  const client = await getRedisClient();
  const keysToDelete: string[] = [];

  // Get all weeks between startDate and endDate
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = generateEventsCacheKey(familyId, current);
    keysToDelete.push(key);
    current.setDate(current.getDate() + 7);
  }

  if (keysToDelete.length > 0) {
    await client.del(keysToDelete);
  }
}

/**
 * Invalidate cache for a specific family
 */
export async function invalidateEventsCacheForFamily(familyId: string) {
  const client = await getRedisClient();
  // Delete all keys matching the family pattern
  const keys = await client.keys(`events:${familyId}:week:*`);
  if (keys.length > 0) {
    await client.del(keys);
  }
}
