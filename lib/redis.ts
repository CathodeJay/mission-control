/**
 * Minimal Upstash Redis REST client using native fetch.
 * No SDK dependency — avoids Edge runtime incompatibility.
 */

const url = process.env.UPSTASH_REDIS_REST_URL!;
const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export const redis = {
  async get<T>(key: string): Promise<T | null> {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstash GET failed: ${res.status}`);
    const json = await res.json();
    if (json.result === null || json.result === undefined) return null;
    // Upstash returns strings; parse JSON if applicable
    if (typeof json.result === "string") {
      try {
        return JSON.parse(json.result) as T;
      } catch {
        return json.result as unknown as T;
      }
    }
    return json.result as T;
  },

  async set(key: string, value: unknown): Promise<void> {
    const body = JSON.stringify(value);
    const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: headers(),
      body,
    });
    if (!res.ok) throw new Error(`Upstash SET failed: ${res.status}`);
  },
};
