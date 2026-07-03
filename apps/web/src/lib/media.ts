const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Backend'den gelen yükleme yolları relatif (/uploads/...) olabilir; bu durumda API_URL ile
// tamamlanır. İleride gerçek S3/R2 mutlak URL döndürdüğünde bu fonksiyon aynı kalır.
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}
