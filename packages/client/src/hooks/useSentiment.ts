import { useState, useEffect, useCallback } from 'react';
import {
  sentimentApi,
  type SentimentDashboardData,
  type SentimentArticle,
  type SentimentTimeSeries,
  type SentimentFilters,
  type PaginatedResponse,
  type PaginationParams,
} from './useApi';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches aggregated sentiment dashboard data.
 * Auto-fetches on mount; call `refetch` to reload.
 */
export function useSentimentDashboard(country = 'ID') {
  const [state, setState] = useState<AsyncState<SentimentDashboardData>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await sentimentApi.getDashboard(country);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [country]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Fetches sentiment articles with optional filters and pagination.
 * Auto-fetches when filters change; call `refetch` to reload.
 */
export function useSentimentArticles(filters?: SentimentFilters, params?: PaginationParams) {
  const [state, setState] = useState<AsyncState<PaginatedResponse<SentimentArticle>>>({
    data: null,
    loading: true,
    error: null,
  });

  const filterKey = JSON.stringify(filters);
  const paramKey = JSON.stringify(params);

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await sentimentApi.getArticles(filters, params);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [filterKey, paramKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Fetches sentiment timeline for a specific entity.
 * Auto-fetches when entity changes; call `refetch` to reload.
 */
export function useSentimentTimeline(entity: string, interval = 'day') {
  const [state, setState] = useState<AsyncState<SentimentTimeSeries>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!entity) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await sentimentApi.getTimeline(entity, interval);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [entity, interval]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Loads the Indonesia sentiment demo dataset.
 * Returns a trigger function and loading/error state.
 */
export function useLoadSentimentDemo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sentimentApi.loadDemo();
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { load, loading, error };
}
