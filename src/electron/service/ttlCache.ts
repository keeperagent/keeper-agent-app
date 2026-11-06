type ICacheEntry<T> = { data: T; fetchedAt: number; ttlMs: number };

const cacheByKey = new Map<string, ICacheEntry<any>>();
const pendingByKey = new Map<string, Promise<[any, Error | null]>>();

const pruneExpiredEntries = () => {
  const now = Date.now();
  cacheByKey.forEach((entry, key) => {
    if (now - entry.fetchedAt >= entry.ttlMs) {
      cacheByKey.delete(key);
    }
  });
};

// Cached fetch by key, with TTL + in-flight de-dupe. `key` must be globally
// unique — prefix with a feature name (e.g. "relationshipGraph:core").
export const getOrFetch = async <T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<[T | null, Error | null]>,
): Promise<[T | null, Error | null]> => {
  const cached = cacheByKey.get(key);
  if (cached && Date.now() - cached.fetchedAt < ttlMs) {
    return [cached.data, null];
  }

  const pending = pendingByKey.get(key);
  if (pending) {
    return pending;
  }

  pruneExpiredEntries();

  const promise = fetcher()
    .then(([data, err]): [T | null, Error | null] => {
      if (!err && data) {
        cacheByKey.set(key, { data, fetchedAt: Date.now(), ttlMs });
      }
      return [data, err];
    })
    .finally(() => {
      pendingByKey.delete(key);
    });
  pendingByKey.set(key, promise);

  return promise;
};
