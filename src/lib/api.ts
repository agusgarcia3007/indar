export async function api<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; total?: number }> {
  try {
    const res = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const json = await res.json();

    if (!res.ok) {
      return { error: json.error || `Request failed (${res.status})` };
    }

    return json;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
}
