export function buildAuthErrorUrl(searchParams: URLSearchParams): string {
  const params = new URLSearchParams({ error: searchParams.get("error")! });
  const description = searchParams.get("error_description");
  if (description) params.set("error_description", description);
  return `/auth-error?${params}`;
}
