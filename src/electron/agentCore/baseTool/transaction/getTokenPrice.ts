import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  CUSTOM_CHAIN_ID,
  SOL_MINT_ADDRESS,
  EVM_CHAIN_ID,
  MAP_CHAIN_KEY_TO_NATIVE_COINGECKO_ID,
  MAP_CHAIN_KEY_TO_NATIVE_SYMBOL,
} from "@/electron/constant";
import {
  safeStringify,
  capitalizeFirstLetter,
} from "@/electron/agentCore/utils";
import { Pricing } from "@/electron/simulator/category/pricing";
import { PRICE_DATA_SOURCE } from "@/electron/constant";
import { TOOL_KEYS } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext } from "@/electron/agentCore/toolContext";

// Helper function to get native token CoinGecko ID for current chainKey
// Returns CoinGecko ID if chainKey is valid, null otherwise
const getNativeTokenCoingeckoIdForChain = (chainKey: string): string | null => {
  const normalizedChainKey = chainKey.toLowerCase().trim();
  return MAP_CHAIN_KEY_TO_NATIVE_COINGECKO_ID[normalizedChainKey] || null;
};

// Helper function to get native token symbol for current chainKey
const getNativeTokenSymbolForChain = (chainKey: string): string | null => {
  const normalizedChainKey = chainKey.toLowerCase().trim();
  return MAP_CHAIN_KEY_TO_NATIVE_SYMBOL[normalizedChainKey] || null;
};

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_CACHE_TIME_MS = 5000; // 5 seconds cache

export const getTokenPriceTool = (toolContext?: ToolContext) => {
  const pricing = new Pricing(DEFAULT_CACHE_TIME_MS);

  return new DynamicStructuredTool({
    name: TOOL_KEYS.GET_TOKEN_PRICE,
    description:
      "Get token price in USD. Pass empty tokenAddress for native token. Read-only, no confirmation needed.",
    schema: z.object({
      chainKey: z
        .string()
        .describe(
          "Chain key — use the chainKey from the task context. Only override if the user explicitly specifies a different chain.",
        ),
      tokenAddress: z
        .string()
        .describe("Token contract address or empty for native token"),
    }),
    func: async ({ chainKey, tokenAddress }) => {
      const effectiveChainKey = (toolContext?.chainKey || chainKey || "solana")
        .toLowerCase()
        .trim();
      try {
        const normalizedChainKey = effectiveChainKey;
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
                effectiveChainKey,
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
              error: `Unsupported chain: ${effectiveChainKey}. Cannot get native token price for this chain.`,
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
            timeout: DEFAULT_TIMEOUT_MS / 1000, // Convert to seconds
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

          const nativeResult = safeStringify({
            success: true,
            price: price,
            nativeTokenSymbol: nativeTokenSymbol || null,
            chain: capitalizeFirstLetter(effectiveChainKey),
            unit: "USD",
            message:
              "Note: We only support getting native token price for the current chain. To get native token price for other chains, please switch to that chain in the app first.",
          });
          logEveryWhere({
            message: `[get_token_price] result: ${nativeResult}`,
          });
          return nativeResult;
        }

        // Use DexScreener for non-native tokens - requires chainId
        const chainId =
          normalizedChainKey === "solana"
            ? CUSTOM_CHAIN_ID.SOLANA
            : EVM_CHAIN_ID[normalizedChainKey];

        if (chainId === undefined) {
          return safeStringify({
            success: false,
            error: `Unsupported chain: ${effectiveChainKey}. Supported chains: solana, ethereum, bsc, arbitrum, polygon, optimism, avalanche, base, zksync, linea, scroll, mantle, blast`,
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
          timeout: DEFAULT_TIMEOUT_MS / 1000,
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

        const tokenResult = safeStringify({
          success: true,
          price: price,
          chain: capitalizeFirstLetter(effectiveChainKey),
          tokenAddress,
          unit: "USD",
        });
        logEveryWhere({ message: `[get_token_price] result: ${tokenResult}` });
        return tokenResult;
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
