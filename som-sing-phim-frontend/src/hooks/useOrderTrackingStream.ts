import { useState, useEffect, useRef, useCallback } from 'react';
import type { CustomerTrackingOrder, TrackingApiResponse } from '../types/tracking';

interface UseOrderTrackingStreamOptions {
  apiBaseUrl?: string;
  pollingIntervalMs?: number;
  enableStream?: boolean;
}

interface UseOrderTrackingStreamReturn {
  order: CustomerTrackingOrder | null;
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refetch: () => Promise<void>;
}

const DEFAULT_API_BASE = 'http://localhost:8080/api/v1';
const DEFAULT_POLL_INTERVAL_MS = 12000;

export function useOrderTrackingStream(
  trackingCode: string | null | undefined,
  options: UseOrderTrackingStreamOptions = {}
): UseOrderTrackingStreamReturn {
  const {
    apiBaseUrl = DEFAULT_API_BASE,
    pollingIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    enableStream = true,
  } = options;

  const [order, setOrder] = useState<CustomerTrackingOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentCodeRef = useRef<string>('');

  const cleanCode = (trackingCode || '').trim();
  currentCodeRef.current = cleanCode;

  // Fetch single order details by tracking code from backend
  const fetchOrder = useCallback(
    async (showLoading = true): Promise<void> => {
      if (!cleanCode) {
        setOrder(null);
        setLoading(false);
        setError(null);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await fetch(`${apiBaseUrl}/orders/track/${encodeURIComponent(cleanCode)}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`ບໍ່ພົບອໍເດີລະຫັດ '${cleanCode}' (Order not found)`);
          }
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const json: TrackingApiResponse = await res.json();
        if (json.status === 'success' && json.data) {
          setOrder(json.data);
        } else {
          throw new Error(json.message || 'Failed to parse order payload');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Connection error';
        setError(message);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    },
    [cleanCode, apiBaseUrl]
  );

  // SSE Stream Listener
  useEffect(() => {
    if (!cleanCode) {
      setOrder(null);
      setIsLive(false);
      return;
    }

    // 1. Initial Fetch
    fetchOrder(true);

    if (!enableStream) {
      return;
    }

    let reconnectAttempts = 0;

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const es = new EventSource(`${apiBaseUrl}/orders/stream?tracking=${encodeURIComponent(cleanCode)}`);
        eventSourceRef.current = es;

        es.addEventListener('connection', () => {
          setIsLive(true);
          reconnectAttempts = 0;
        });

        es.addEventListener('order_status_update', (event: MessageEvent) => {
          try {
            const updatedOrder: CustomerTrackingOrder = JSON.parse(event.data);
            const target = currentCodeRef.current.toLowerCase();
            if (
              updatedOrder &&
              (updatedOrder.tracking_code?.toLowerCase() === target ||
                updatedOrder.order_no?.toLowerCase() === target ||
                updatedOrder.order_id?.toLowerCase() === target)
            ) {
              setOrder(updatedOrder);
            }
          } catch {
            // Ignore parse errors on malformed payloads
          }
        });

        es.onerror = () => {
          setIsLive(false);
          es.close();
          eventSourceRef.current = null;

          // Reconnect with exponential backoff up to 30s
          const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
          reconnectAttempts++;
          reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
        };
      } catch {
        setIsLive(false);
      }
    };

    connectSSE();

    // 2. Fallback Polling Timer (ensures data freshness even if SSE dropped)
    pollTimerRef.current = setInterval(() => {
      fetchOrder(false);
    }, pollingIntervalMs);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsLive(false);
    };
  }, [cleanCode, apiBaseUrl, enableStream, pollingIntervalMs, fetchOrder]);

  return {
    order,
    loading,
    error,
    isLive,
    refetch: () => fetchOrder(true),
  };
}
