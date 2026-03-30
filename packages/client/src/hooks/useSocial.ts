import { useState, useEffect, useCallback } from 'react';
import {
  socialApi,
  type SocialDashboardData,
  type SocialAnnouncement,
  type AudienceSegmentation,
  type AudiencePersona,
  type SocialInfluencer,
  type CrossPlatformAnalysis,
  type PaginatedResponse,
  type PaginationParams,
} from './useApi';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches aggregated social media dashboard data.
 * Auto-fetches on mount; call `refetch` to reload.
 */
export function useSocialDashboard() {
  const [state, setState] = useState<AsyncState<SocialDashboardData>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await socialApi.getDashboard();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Fetches social announcements with pagination.
 * Auto-fetches when params change; call `refetch` to reload.
 */
export function useSocialAnnouncements(params?: PaginationParams) {
  const [state, setState] = useState<AsyncState<PaginatedResponse<SocialAnnouncement>>>({
    data: null,
    loading: true,
    error: null,
  });

  const paramKey = JSON.stringify(params);

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await socialApi.getAnnouncements(params);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [paramKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Fetches a single announcement with engagement data.
 * Auto-fetches when id changes; call `refetch` to reload.
 */
export function useAnnouncementDetail(id: string) {
  const [state, setState] = useState<AsyncState<SocialAnnouncement>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await socialApi.getAnnouncement(id);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Fetches audience segmentation data for an entity.
 * Auto-fetches when entityId changes; call `refetch` to reload.
 */
export function useAudienceSegmentation(entityId: string) {
  const [state, setState] = useState<AsyncState<AudienceSegmentation>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!entityId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await socialApi.getAudienceSegmentation(entityId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [entityId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Fetches all audience personas.
 * Auto-fetches on mount; call `refetch` to reload.
 */
export function useAudiencePersonas() {
  const [state, setState] = useState<AsyncState<AudiencePersona[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await socialApi.getPersonas();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Fetches influencer data, optionally filtered by entity.
 * Auto-fetches when entityId changes; call `refetch` to reload.
 */
export function useInfluencers(entityId?: string) {
  const [state, setState] = useState<AsyncState<SocialInfluencer[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await socialApi.getInfluencers(entityId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [entityId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Fetches cross-platform analysis for an event.
 * Auto-fetches when eventId changes; call `refetch` to reload.
 */
export function useCrossPlatformAnalysis(eventId: string) {
  const [state, setState] = useState<AsyncState<CrossPlatformAnalysis>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!eventId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await socialApi.getCrossPlatformAnalysis(eventId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [eventId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Loads social media demo data.
 * Returns a trigger function and loading/error state.
 */
export function useLoadSocialDemo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await socialApi.loadDemo();
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
