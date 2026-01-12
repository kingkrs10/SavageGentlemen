import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Hook for optimistic updates with rollback capability
export const useOptimisticUpdate = <T>(
  queryKey: string | string[],
  optimisticUpdateFn: (oldData: T, newData: Partial<T>) => T
) => {
  const [isOptimistic, setIsOptimistic] = useState(false);
  const queryClient = useQueryClient();

  const updateOptimistically = useCallback(
    (newData: Partial<T>) => {
      setIsOptimistic(true);

      const normalizedQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

      // Store the previous data for rollback
      const previousData = queryClient.getQueryData<T>(normalizedQueryKey);

      // Apply optimistic update
      queryClient.setQueryData<T>(normalizedQueryKey, (oldData) => {
        if (!oldData) return oldData;
        return optimisticUpdateFn(oldData, newData);
      });

      return {
        rollback: () => {
          queryClient.setQueryData(normalizedQueryKey, previousData);
          setIsOptimistic(false);
        },
        commit: () => {
          setIsOptimistic(false);
        }
      };
    },
    [queryClient, queryKey, optimisticUpdateFn]
  );

  return {
    updateOptimistically,
    isOptimistic
  };
};

// Hook for offline queue management
export const useOfflineQueue = () => {
  const [offlineQueue, setOfflineQueue] = useState<Array<{
    id: string;
    operation: () => Promise<void>;
    retry: number;
  }>>([]);

  const addToQueue = useCallback((operation: () => Promise<void>) => {
    const id = Date.now().toString();
    setOfflineQueue(prev => [...prev, { id, operation, retry: 0 }]);
    return id;
  }, []);

  const processQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;

    const item = offlineQueue[0];
    try {
      await item.operation();
      setOfflineQueue(prev => prev.slice(1));
    } catch (error) {
      if (item.retry < 3) {
        setOfflineQueue(prev => [
          ...prev.slice(1),
          { ...item, retry: item.retry + 1 }
        ]);
      } else {
        console.error('Failed to process offline operation after 3 retries:', error);
        setOfflineQueue(prev => prev.slice(1));
      }
    }
  }, [offlineQueue]);

  const clearQueue = useCallback(() => {
    setOfflineQueue([]);
  }, []);

  return {
    offlineQueue,
    addToQueue,
    processQueue,
    clearQueue,
    queueSize: offlineQueue.length
  };
};