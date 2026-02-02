import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(!!path);

  const fetchData = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(undefined);
    const result = await api<T>(path);
    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }
    setLoading(false);
  }, [path]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}
