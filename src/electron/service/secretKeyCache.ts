// each cache item has max timeout 30 minutes
type CacheItem = {
  value: string;
  createdTimestamp: number;
};

const maxTimeoutMinutes = 30;

// Use this class to improve UX for CampaignProfile view and Workflow, because we dont want user reenter secret key every time they open the page. Do not cache secret key in browser, only use inmem cache
class SecretKeyCache {
  private cache: Map<string, CacheItem>;

  constructor() {
    this.cache = new Map();
  }

  getCacheKey = (campaignId: number) => {
    return `${campaignId}`;
  };

  set = (key: string, value: string) => {
    this.cache.set(key, { value, createdTimestamp: Date.now() });
  };

  get = (key: string) => {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() - item.createdTimestamp > maxTimeoutMinutes * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  };

  delete = (key: string) => {
    this.cache.delete(key);
  };

  clear = () => {
    this.cache.clear();
  };
}

export const secretKeyCache = new SecretKeyCache();
