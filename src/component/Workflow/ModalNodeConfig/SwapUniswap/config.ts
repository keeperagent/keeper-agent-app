import {
  UNIVERSAL_ROUTER_ADDRESS,
  UniversalRouterVersion,
} from "@uniswap/universal-router-sdk";
import { getUniversalRouterAddress } from "@pancakeswap/universal-router-sdk";
import ethImg from "@/asset/chain/eth.png";
import arbitrumImg from "@/asset/chain/arbitrum.png";
import optimismImg from "@/asset/chain/optimism.png";
import baseImg from "@/asset/chain/base.png";
import zksyncImg from "@/asset/chain/zksync.png";
import polygonImg from "@/asset/chain/polygon.webp";
import bnbImg from "@/asset/chain/bnb.png";
import avaxImg from "@/asset/chain/avax.png";
import blastImg from "@/asset/chain/blast.webp";
import zoraImg from "@/asset/chain/zora.png";
import celoImg from "@/asset/chain/celo.png";
import lineaImg from "@/asset/chain/linea.png";

export const UNISWAP_LIST_CHAIN = [
  1, 42161, 10, 8453, 137, 56, 43114, 81457, 7777777, 42220,
];

export const PANCAKESWAP_LIST_CHAIN = [56, 1, 324, 42161, 59144, 8453, 204];

export const CHAIN_CONFIG = [
  { logo: ethImg, chainId: 1, chainName: "Ethereum" },
  { logo: arbitrumImg, chainId: 42161, chainName: "Arbitrum" },
  { logo: optimismImg, chainId: 10, chainName: "Optimism" },
  { logo: baseImg, chainId: 8453, chainName: "Base" },
  { logo: zksyncImg, chainId: 324, chainName: "ZkSync" },
  { logo: polygonImg, chainId: 137, chainName: "Polygon" },
  { logo: bnbImg, chainId: 56, chainName: "BNB" },
  { logo: avaxImg, chainId: 43114, chainName: "Avalanche C-Chain" },
  { logo: blastImg, chainId: 81457, chainName: "Blast" },
  { logo: zoraImg, chainId: 7777777, chainName: "Zora" },
  { logo: celoImg, chainId: 42220, chainName: "Celo" },
  { logo: lineaImg, chainId: 59144, chainName: "Linea" },
  { logo: bnbImg, chainId: 204, chainName: "opBNB" },
];

export const mapExplorer = new Map<number, string>();
mapExplorer.set(1, "https://etherscan.io");
mapExplorer.set(42161, "https://arbiscan.io");
mapExplorer.set(10, "https://optimistic.etherscan.io");
mapExplorer.set(8453, "https://basescan.org");
mapExplorer.set(137, "https://polygonscan.com");
mapExplorer.set(56, "https://bscscan.com");
mapExplorer.set(43114, "https://snowtrace.io");
mapExplorer.set(81457, "https://blastscan.io");
mapExplorer.set(7777777, "https://explorer.zora.energy");
mapExplorer.set(42220, "https://celoscan.io");
mapExplorer.set(1101, "https://zkevm.polygonscan.com");
mapExplorer.set(324, "https://era.zksync.network");
mapExplorer.set(59144, "https://lineascan.build");
mapExplorer.set(204, "https://opbnb.bscscan.com");

export const mapUniswapContractUrl = new Map<number, string>();
export const mapUniswapContract = new Map<number, string>();
for (const chainId of UNISWAP_LIST_CHAIN) {
  mapUniswapContractUrl.set(
    chainId,
    `${mapExplorer.get(chainId)}/address/${UNIVERSAL_ROUTER_ADDRESS(
      UniversalRouterVersion.V2_0,
      chainId,
    )}`,
  );
  mapUniswapContract.set(
    chainId,
    UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, chainId),
  );
}

export const mapPancakeswapContractUrl = new Map<number, string>();
export const mapPancakeswapContract = new Map<number, string>();
for (const chainId of PANCAKESWAP_LIST_CHAIN) {
  mapPancakeswapContractUrl.set(
    chainId,
    `${mapExplorer.get(chainId)}/address/${getUniversalRouterAddress(chainId)}`,
  );
  mapPancakeswapContract.set(chainId, getUniversalRouterAddress(chainId));
}
