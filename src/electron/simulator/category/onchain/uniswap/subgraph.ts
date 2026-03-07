import axios from "axios";

const API_KEY = process.env.MAIN_VITE_THE_GRAPH_API_KEY_1 || "";
const SECOND_API_KEY = process.env.MAIN_VITE_THE_GRAPH_API_KEY_2 || "";
const THIRD_API_KEY = process.env.MAIN_VITE_THE_GRAPH_API_KEY_3 || "";
const FOURTH_API_KEY = process.env.MAIN_VITE_THE_GRAPH_API_KEY_4 || "";

const listApiKey = [
  API_KEY,
  SECOND_API_KEY,
  THIRD_API_KEY,
  FOURTH_API_KEY,
]?.filter((apiKey) => apiKey !== "");

const mapUniV4Endpoint = {
  1: [
    ...listApiKey.map(
      (apiKey) =>
        `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G`,
    ),
  ],
  137: [
    ...listApiKey.map(
      (apiKey) =>
        `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/CwpebM66AH5uqS5sreKij8yEkkPcHvmyEs7EwFtdM5ND`,
    ),
  ],
  42161: [
    ...listApiKey.map(
      (apiKey) =>
        `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/G5TsTKNi8yhPSV7kycaE23oWbqv9zzNqR49FoEQjzq1r`,
    ),
  ],
  56: [
    ...listApiKey.map(
      (apiKey) =>
        `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/2qQpC8inZPZL4tYfRQPFGZhsE8mYzE67n5z3Yf5uuKMu`,
    ),
  ],
  10: [
    ...listApiKey.map(
      (apiKey) =>
        `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/6RBtsmGUYfeLeZsYyxyKSUiaA6WpuC69shMEQ1Cfuj9u`,
    ),
  ],
  43114: [
    ...listApiKey.map(
      (apiKey) =>
        `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/49JxRo9FGxWpSf5Y5GKQPj5NUpX2HhpoZHpGzNEWQZjq`,
    ),
  ],
  130: [
    ...listApiKey.map(
      (apiKey) =>
        `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/aa3YpPCxatg4LaBbLFuv2iBC8Jvs9u3hwt5GTpS4Kit`,
    ),
  ],
  8453: [
    ...listApiKey.map(
      (apiKey) =>
        `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/HNCFA9TyBqpo5qpe6QreQABAA1kV8g46mhkCcicu6v2R`,
    ),
  ],
  81457: [
    ...listApiKey.map(
      (apiKey) =>
        `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/FCHYK3Ab6bBnkfeCKRhFbs1Q8rX4yt6rKJibpDTC74ns`,
    ),
  ],
};

export type UniV4PoolInfo = {
  tickSpacing: string;
  hooks: string;
};

// pools which has hooks can not fetch from PositonManager contract through poolKeys(), to to get @tickSpacing, and @hook we need to use third party service like TheGraph
class SubgraphProvider {
  private endpointIndexMap: Record<number, number> = {};

  constructor(private endpointMap: Record<number, string[]>) {}

  private getNextEndpoint = (chainId: number): string | null => {
    const endpoints = this.endpointMap[chainId];
    if (!endpoints || endpoints.length === 0) {
      return null;
    }
    const currentIndex = this.endpointIndexMap[chainId] || 0;
    const endpoint = endpoints[currentIndex % endpoints.length];

    // Update index for next call
    this.endpointIndexMap[chainId] = (currentIndex + 1) % endpoints.length;
    return endpoint;
  };

  getPool = async (
    chainId: number,
    poolId: string,
  ): Promise<[UniV4PoolInfo | null, Error | null]> => {
    let lastError: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const endpoint = this.getNextEndpoint(chainId);
      if (!endpoint) {
        return [
          null,
          new Error("No endpoint available for chainId " + chainId),
        ];
      }
      const query = `
        {
          pool(id: "${poolId}") {
            tickSpacing
            hooks
          }
        }
      `;
      try {
        const response = await axios.post(
          endpoint,
          { query },
          { timeout: 10000 },
        );
        const pool = response?.data?.data?.pool;
        if (pool) {
          return [pool as UniV4PoolInfo, null];
        }
      } catch (err) {
        lastError = err;
      }
    }
    return [null, lastError];
  };
}

export const subgraphProvider = new SubgraphProvider(mapUniV4Endpoint);
