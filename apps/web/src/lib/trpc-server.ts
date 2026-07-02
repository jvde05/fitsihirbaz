// Server component'lerde (generateMetadata gibi) React Query/tRPC client'a ihtiyaç
// duymadan tek bir query çağırmak için minimal bir yardımcı. Sadece SEO meta etiketi
// üretimi gibi hafif, tek seferlik okumalar için kullanılır.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchTrpcQuery<T>(procedure: string, input: unknown): Promise<T | null> {
  try {
    const url = `${API_URL}/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify(input))}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return (data?.result?.data as T) ?? null;
  } catch {
    return null;
  }
}
