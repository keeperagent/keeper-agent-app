import _ from "lodash";
import CetusClmmSDK, {
  initCetusSDK,
  Pool,
} from "@cetusprotocol/cetus-sui-clmm-sdk";

type ListNodeEndpoint = {
  listEndpoint: string[];
  currentIndex: number;
};

export class CetusProvider {
  private mapPool: { [key: string]: Pool } = {};
  private mapListNodeEndpoint: { [key: string]: ListNodeEndpoint } = {};

  // generate uniq key from @listNodeEndpoint
  getListProviderKey = (listNodeEndpoint: string[]): string => {
    return _.sortBy(listNodeEndpoint).join("-");
  };

  getNextClient = (
    listNodeEndpoint: string[],
  ): [CetusClmmSDK | null, string | null, Error | null] => {
    if (listNodeEndpoint?.length === 0) {
      return [null, null, Error("node endpoint is empty")];
    }

    const key = this.getListProviderKey(listNodeEndpoint);
    if (!this.mapListNodeEndpoint[key]) {
      this.mapListNodeEndpoint[key] = {
        listEndpoint: listNodeEndpoint,
        currentIndex: 0,
      };
    }

    const { listEndpoint, currentIndex } = this.mapListNodeEndpoint[key];
    const nextKeyIndex = (currentIndex + 1) % listEndpoint.length;
    const endpoint = listEndpoint[nextKeyIndex];
    if (!endpoint) {
      return [null, endpoint, Error("missing Node endpoint")];
    }

    this.mapListNodeEndpoint[key].currentIndex = nextKeyIndex;
    const client = this.getClient(endpoint);
    return [client, endpoint, null];
  };

  private getClient = (nodeEndpoint: string): CetusClmmSDK => {
    const cetusSdk = initCetusSDK({
      network: "mainnet",
      fullNodeUrl: nodeEndpoint,
    });
    return cetusSdk;
  };

  getPool = async (
    inputTokenAddress: string,
    outputTokenAddress: string,
    poolAddress: string,
    listNodeEndpoint: string[],
  ): Promise<[Pool | null, Error | null]> => {
    try {
      const cachedPool = this.mapPool[poolAddress];
      if (cachedPool) {
        return [cachedPool, null];
      }

      const [client, , errProvider] = this.getNextClient(listNodeEndpoint);
      if (!client) {
        return [null, Error("can not get provider " + errProvider?.message)];
      }

      const pool = await client.Pool.getPool(poolAddress);
      if (
        (inputTokenAddress?.toLowerCase() !== pool?.coinTypeA?.toLowerCase() &&
          inputTokenAddress?.toLowerCase() !==
            pool?.coinTypeB?.toLowerCase()) ||
        (outputTokenAddress?.toLowerCase() !== pool?.coinTypeA?.toLowerCase() &&
          outputTokenAddress?.toLowerCase() !== pool?.coinTypeB?.toLowerCase())
      ) {
        return [null, Error("pool address and token address does not match")];
      }

      this.mapPool[poolAddress] = pool;
      return [pool, null];
    } catch (err: any) {
      return [null, err];
    }
  };
}
