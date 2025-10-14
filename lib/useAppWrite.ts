import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

interface UseAppwriteOptions<T, P = any> {
  // Accept any function shape to accommodate APIs that require params or none
  fn: (...args: any[]) => Promise<T>;
  params?: P;
  skip?: boolean;
}

interface UseAppwriteReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (...args: any[]) => Promise<void>;

}
// Custom React hook for managing Appwrite API calls with state handling
export const useAppwrite = <T, P = any>({
  fn, // the asynchronous function to fetch data
  params = {} as P, // Default fetch parameters (empty) 
  skip = false,
}: UseAppwriteOptions<T, P>): UseAppwriteReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (fetchParams?: any) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fn(fetchParams);
        setData(result);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fn]
  ); 

  useEffect(() => {
    if (!skip) {
      // initial fetch with provided params
      fetchData(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = async (newParams?: any) => await fetchData(newParams);

  return { data, loading, error, refetch };
};