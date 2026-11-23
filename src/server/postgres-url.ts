export function normalizePostgresConnectionString(value: string): string {
  const url = new URL(value);
  const sslMode = url.searchParams.get("sslmode");
  if (!url.searchParams.has("uselibpqcompat") && (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca")) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}
