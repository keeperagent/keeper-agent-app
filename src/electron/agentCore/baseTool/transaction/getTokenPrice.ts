import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  CUSTOM_CHAIN_ID,
  KYBERSWAP_CHAIN_KEY,
  SOL_MINT_ADDRESS,
} from "@/electron/constant";
import {
  safeStringify,
  capitalizeFirstLetter,
} from "@/electron/agentCore/utils";
import { Pricing } from "@/electron/simulator/category/pricing";
import { PRICE_DATA_SOURCE } from "@/electron/constant";
import { TOOL_KEYS } from "@/electron/constant";

// Map chainKey to chainId for DexScreener
const mapChainKeyToChainId: Record<string, number> = {
  solana: CUSTOM_CHAIN_ID.SOLANA,
  [KYBERSWAP_CHAIN_KEY.ETHEREUM]: 1,
  [KYBERSWAP_CHAIN_KEY.BSC]: 56,
  [KYBERSWAP_CHAIN_KEY.ARBITRUM]: 42161,
  [KYBERSWAP_CHAIN_KEY.POLYGON]: 137,
  [KYBERSWAP_CHAIN_KEY.AVALANCHE]: 43114,
  [KYBERSWAP_CHAIN_KEY.BASE]: 8453,
  [KYBERSWAP_CHAIN_KEY.OPTIMISM]: 10,
  [KYBERSWAP_CHAIN_KEY.ZKSYNC]: 324,
  [KYBERSWAP_CHAIN_KEY.LINEA]: 59144,
  [KYBERSWAP_CHAIN_KEY.SCROLL]: 534352,
  [KYBERSWAP_CHAIN_KEY.MANTLE]: 5000,
  [KYBERSWAP_CHAIN_KEY.BLAST]: 81457,
  [KYBERSWAP_CHAIN_KEY.SONIC]: 146,
  [KYBERSWAP_CHAIN_KEY.UNICHAIN]: 130,
  [KYBERSWAP_CHAIN_KEY.BERACHAIN]: 80094,
  [KYBERSWAP_CHAIN_KEY.RONIN]: 2020,
  [KYBERSWAP_CHAIN_KEY.MONAD]: 143,
  [KYBERSWAP_CHAIN_KEY.PLASMA]: 9745,
  [KYBERSWAP_CHAIN_KEY.HYPEREVM]: 999,
};

// Map chainKey to CoinGecko ID for native tokens
const mapChainKeyToNativeTokenCoingekoId: Record<string, string> = {
  // Solana
  solana: "solana",

  // Ethereum and EVM chains that use ETH
  [KYBERSWAP_CHAIN_KEY.ETHEREUM]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.ARBITRUM]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.BASE]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.OPTIMISM]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.ZKSYNC]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.LINEA]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.SCROLL]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.BLAST]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.UNICHAIN]: "ethereum",

  // BSC/BNB Chain
  [KYBERSWAP_CHAIN_KEY.BSC]: "binancecoin",

  // Polygon
  [KYBERSWAP_CHAIN_KEY.POLYGON]: "polygon-ecosystem-token",

  // Avalanche
  [KYBERSWAP_CHAIN_KEY.AVALANCHE]: "avalanche-2",

  // Mantle
  [KYBERSWAP_CHAIN_KEY.MANTLE]: "mantle",

  // Sonic
  [KYBERSWAP_CHAIN_KEY.SONIC]: "sonic-3",

  // Berachain
  [KYBERSWAP_CHAIN_KEY.BERACHAIN]: "berachain-bera",

  // Ronin
  [KYBERSWAP_CHAIN_KEY.RONIN]: "ronin",

  // Monad
  [KYBERSWAP_CHAIN_KEY.MONAD]: "monad",

  // Plasma
  [KYBERSWAP_CHAIN_KEY.PLASMA]: "plasma",

  // HyperEVM
  [KYBERSWAP_CHAIN_KEY.HYPEREVM]: "hyperliquid",
};

// Map chainKey to native token symbol
const mapChainKeyToNativeTokenSymbol: Record<string, string> = {
  solana: "SOL",
  [KYBERSWAP_CHAIN_KEY.ETHEREUM]: "ETH",
  [KYBERSWAP_CHAIN_KEY.ARBITRUM]: "ETH",
  [KYBERSWAP_CHAIN_KEY.BASE]: "ETH",
  [KYBERSWAP_CHAIN_KEY.OPTIMISM]: "ETH",
  [KYBERSWAP_CHAIN_KEY.ZKSYNC]: "ETH",
  [KYBERSWAP_CHAIN_KEY.LINEA]: "ETH",
  [KYBERSWAP_CHAIN_KEY.SCROLL]: "ETH",
  [KYBERSWAP_CHAIN_KEY.BLAST]: "ETH",
  [KYBERSWAP_CHAIN_KEY.UNICHAIN]: "ETH",
  [KYBERSWAP_CHAIN_KEY.BSC]: "BNB",
  [KYBERSWAP_CHAIN_KEY.POLYGON]: "MATIC",
  [KYBERSWAP_CHAIN_KEY.AVALANCHE]: "AVAX",
  [KYBERSWAP_CHAIN_KEY.MANTLE]: "MNT",
  [KYBERSWAP_CHAIN_KEY.SONIC]: "SONIC",
  [KYBERSWAP_CHAIN_KEY.BERACHAIN]: "BERA",
  [KYBERSWAP_CHAIN_KEY.RONIN]: "RON",
  [KYBERSWAP_CHAIN_KEY.MONAD]: "MON",
  [KYBERSWAP_CHAIN_KEY.PLASMA]: "XPL",
  [KYBERSWAP_CHAIN_KEY.HYPEREVM]: "HYPE",
};

// Helper function to get native token CoinGecko ID for current chainKey
// Returns CoinGecko ID if chainKey is valid, null otherwise
const getNativeTokenCoingeckoIdForChain = (chainKey: string): string | null => {
  const normalizedChainKey = chainKey.toLowerCase().trim();
  return mapChainKeyToNativeTokenCoingekoId[normalizedChainKey] || null;
};

// Helper function to get native token symbol for current chainKey
const getNativeTokenSymbolForChain = (chainKey: string): string | null => {
  const normalizedChainKey = chainKey.toLowerCase().trim();
  return mapChainKeyToNativeTokenSymbol[normalizedChainKey] || null;
};

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_CACHE_TIME_MS = 5000; // 5 seconds cache

export const getTokenPriceTool = () => {
  const pricing = new Pricing(DEFAULT_CACHE_TIME_MS);

  return new DynamicStructuredTool({
    name: TOOL_KEYS.GET_TOKEN_PRICE,
    description:
      "Get token price in USD. Pass empty tokenAddress for native token. Read-only, no confirmation needed.",
    schema: z.object({
      chainKey: z
        .string()
        .describe(
          "Chain key from context (solana, ethereum, bsc, arbitrum, polygon, base, etc.)",
        ),
      tokenAddress: z
        .string()
        .describe("Token contract address or empty for native token"),
      timeoutMs: z.number().positive().describe("Request timeout in ms"),
    }),
    func: async ({
      chainKey,
      tokenAddress,
      timeoutMs = DEFAULT_TIMEOUT_MS,
    }) => {
      try {
        const normalizedChainKey = chainKey.toLowerCase().trim();
        const normalizedTokenAddress = tokenAddress.trim();

        // Validate token address format matches chain type
        if (
          normalizedTokenAddress &&
          normalizedTokenAddress !== SOL_MINT_ADDRESS.toUpperCase()
        ) {
          const isEvmAddress = /^0x[a-fA-F0-9]{40}$/i.test(
            normalizedTokenAddress,
          );
          const isSolanaAddress =
            normalizedTokenAddress.length >= 32 &&
            normalizedTokenAddress.length <= 44 &&
            !normalizedTokenAddress.startsWith("0x");

          if (normalizedChainKey === "solana" && isEvmAddress) {
            return safeStringify({
              success: false,
              error: `Invalid token address for Solana chain: ${tokenAddress}. This appears to be an EVM address (0x format). Please switch to the correct EVM chain in the app first.`,
              price: null,
            });
          }

          if (normalizedChainKey !== "solana" && isSolanaAddress) {
            return safeStringify({
              success: false,
              error: `Invalid token address for EVM chain (${capitalizeFirstLetter(
                chainKey,
              )}): ${tokenAddress}. This appears to be a Solana address (base58 format). Please switch to Solana chain in the app first.`,
              price: null,
            });
          }
        }

        const normalizedTokenAddressUpper =
          normalizedTokenAddress.toUpperCase();

        // Check if this is a native token request (empty tokenAddress)
        if (
          normalizedTokenAddressUpper === "" ||
          normalizedTokenAddressUpper === SOL_MINT_ADDRESS.toUpperCase()
        ) {
          // Get native token CoinGecko ID for current chainKey
          const nativeTokenCoingeckoId =
            getNativeTokenCoingeckoIdForChain(normalizedChainKey);

          if (!nativeTokenCoingeckoId) {
            return safeStringify({
              success: false,
              error: `Unsupported chain: ${chainKey}. Cannot get native token price for this chain.`,
              price: null,
            });
          }

          // Get native token symbol for current chainKey
          const nativeTokenSymbol =
            getNativeTokenSymbolForChain(normalizedChainKey);

          // Use CoinGecko for native tokens
          const [price, err] = await pricing.getTokenPrice({
            name: "get_token_price_tool",
            sleep: 0,
            dataSource: PRICE_DATA_SOURCE.COINGECKO,
            coingeckoId: nativeTokenCoingeckoId,
            timeout: timeoutMs / 1000, // Convert to seconds
          });

          if (err) {
            return safeStringify({
              success: false,
              error: err.message || String(err),
              price: null,
            });
          }

          if (price === null) {
            return safeStringify({
              success: false,
              error: "Native token price not found on CoinGecko.",
              price: null,
            });
          }

          return safeStringify({
            success: true,
            price: price,
            nativeTokenSymbol: nativeTokenSymbol || null,
            chain: capitalizeFirstLetter(chainKey),
            unit: "USD",
            message:
              "Note: We only support getting native token price for the current chain. To get native token price for other chains, please switch to that chain in the app first.",
          });
        }

        // Use DexScreener for non-native tokens - requires chainId
        const chainId = mapChainKeyToChainId[normalizedChainKey];

        if (chainId === undefined) {
          return safeStringify({
            success: false,
            error: `Unsupported chain: ${chainKey}. Supported chains: solana, ethereum, bsc, arbitrum, polygon, optimism, avalanche, base, zksync, linea, scroll, mantle, blast`,
            price: null,
          });
        }

        if (chainId === 0) {
          return safeStringify({
            success: false,
            error: `Chain ${chainKey} is not yet fully supported for price lookup`,
            price: null,
          });
        }

        const [price, err] = await pricing.getTokenPrice({
          name: "get_token_price_tool",
          sleep: 0,
          dataSource: PRICE_DATA_SOURCE.DEXSCREENER,
          tokenAddress,
          chainId,
          timeout: timeoutMs / 1000, // Convert to seconds
        });

        if (err) {
          return safeStringify({
            success: false,
            error: err.message || String(err),
            price: null,
          });
        }

        if (price === null) {
          return safeStringify({
            success: false,
            error:
              "Token price not found. The token may not have sufficient liquidity or may not exist on DexScreener.",
            price: null,
          });
        }

        return safeStringify({
          success: true,
          price: price,
          chain: capitalizeFirstLetter(chainKey),
          tokenAddress,
          unit: "USD",
        });
      } catch (err: any) {
        return safeStringify({
          success: false,
          error: err?.message || String(err),
          price: null,
        });
      }
    },
  });
};
