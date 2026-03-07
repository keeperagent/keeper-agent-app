import ethImg from "@/asset/chain/eth.png";
import arbitrumImg from "@/asset/chain/arbitrum.png";
import optimismImg from "@/asset/chain/optimism.png";
import baseImg from "@/asset/chain/base.png";
import zksyncImg from "@/asset/chain/zksync.png";
import polygonImg from "@/asset/chain/polygon.webp";
import bnbImg from "@/asset/chain/bnb.png";
import avaxImg from "@/asset/chain/avax.png";
import blastImg from "@/asset/chain/blast.webp";
import mantleImg from "@/asset/chain/mantle.png";
import berachainImg from "@/asset/chain/berachain.png";
import lineaImg from "@/asset/chain/linea.png";
import sonicImg from "@/asset/chain/sonic.png";
import scrollImg from "@/asset/chain/scroll.png";
import roninImg from "@/asset/chain/ronin.png";
import unichainImg from "@/asset/chain/unichain.png";
import hyperevmImg from "@/asset/chain/hyperevm.svg";
import monadImg from "@/asset/chain/monad.svg";
import plasmaImg from "@/asset/chain/plasma.svg";
import {
  MAP_KYBER_ROUTER_ADDRESS_BY_CHAIN,
  KYBERSWAP_CHAIN_KEY,
} from "@/electron/constant";

export const CHAIN_CONFIG = [
  {
    logo: ethImg,
    chainId: 1,
    chainKey: KYBERSWAP_CHAIN_KEY.ETHEREUM,
    chainName: "Ethereum",
  },
  {
    logo: bnbImg,
    chainId: 56,
    chainKey: KYBERSWAP_CHAIN_KEY.BSC,
    chainName: "BNB",
  },
  {
    logo: arbitrumImg,
    chainId: 42161,
    chainKey: KYBERSWAP_CHAIN_KEY.ARBITRUM,
    chainName: "Arbitrum",
  },
  {
    logo: polygonImg,
    chainId: 137,
    chainKey: KYBERSWAP_CHAIN_KEY.POLYGON,
    chainName: "Polygon",
  },
  {
    logo: optimismImg,
    chainId: 10,
    chainKey: KYBERSWAP_CHAIN_KEY.OPTIMISM,
    chainName: "Optimism",
  },
  {
    logo: avaxImg,
    chainId: 43114,
    chainKey: KYBERSWAP_CHAIN_KEY.AVALANCHE,
    chainName: "Avalanche C-Chain",
  },
  {
    logo: baseImg,
    chainId: 8453,
    chainKey: KYBERSWAP_CHAIN_KEY.BASE,
    chainName: "Base",
  },
  {
    logo: zksyncImg,
    chainId: 324,
    chainKey: KYBERSWAP_CHAIN_KEY.ZKSYNC,
    chainName: "ZkSync",
  },
  {
    logo: lineaImg,
    chainId: 59144,
    chainKey: KYBERSWAP_CHAIN_KEY.LINEA,
    chainName: "Linea",
  },
  {
    logo: scrollImg,
    chainId: 534352,
    chainKey: KYBERSWAP_CHAIN_KEY.SCROLL,
    chainName: "Scroll",
  },
  {
    logo: mantleImg,
    chainId: 5000,
    chainKey: KYBERSWAP_CHAIN_KEY.MANTLE,
    chainName: "Mantle",
  },
  {
    logo: blastImg,
    chainId: 81457,
    chainKey: KYBERSWAP_CHAIN_KEY.BLAST,
    chainName: "Blast",
  },
  {
    logo: sonicImg,
    chainId: 146,
    chainKey: KYBERSWAP_CHAIN_KEY.SONIC,
    chainName: "Sonic",
  },
  {
    logo: unichainImg,
    chainId: 130,
    chainKey: KYBERSWAP_CHAIN_KEY.UNICHAIN,
    chainName: "Unichain",
  },
  {
    logo: berachainImg,
    chainId: 80094,
    chainKey: KYBERSWAP_CHAIN_KEY.BERACHAIN,
    chainName: "Berachain",
  },
  {
    logo: roninImg,
    chainId: 2020,
    chainKey: KYBERSWAP_CHAIN_KEY.RONIN,
    chainName: "Ronin",
  },
  {
    logo: monadImg,
    chainId: 143,
    chainKey: KYBERSWAP_CHAIN_KEY.MONAD,
    chainName: "Monad",
  },
  {
    logo: plasmaImg,
    chainId: 9745,
    chainKey: KYBERSWAP_CHAIN_KEY.PLASMA,
    chainName: "Plasma",
  },
  {
    logo: hyperevmImg,
    chainId: 999,
    chainKey: KYBERSWAP_CHAIN_KEY.HYPEREVM,
    chainName: "HyperEVM",
  },
];

export const mapExplorer = new Map<string, string>();
mapExplorer.set(KYBERSWAP_CHAIN_KEY.ETHEREUM, "https://etherscan.io");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.BSC, "https://bscscan.com");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.ARBITRUM, "https://arbiscan.io");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.POLYGON, "https://polygonscan.com");
mapExplorer.set(
  KYBERSWAP_CHAIN_KEY.OPTIMISM,
  "https://optimistic.etherscan.io"
);
mapExplorer.set(KYBERSWAP_CHAIN_KEY.AVALANCHE, "https://snowtrace.io");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.BASE, "https://basescan.org");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.ZKSYNC, "https://era.zksync.network");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.LINEA, "https://lineascan.build");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.BLAST, "https://blastscan.io");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.SONIC, "https://sonicscan.org");
mapExplorer.set(
  KYBERSWAP_CHAIN_KEY.UNICHAIN,
  "https://unichain.blockscout.com"
);
mapExplorer.set(KYBERSWAP_CHAIN_KEY.BERACHAIN, "https://berascan.com");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.RONIN, "https://app.roninchain.com");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.MONAD, "https://monadscan.com");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.PLASMA, "https://plasmascan.to");
mapExplorer.set(KYBERSWAP_CHAIN_KEY.HYPEREVM, "https://hyperevmscan.io");

export const mapKyberswapContractUrl = new Map<string, string>();
export const mapKyberswapContract = new Map<string, string>();
for (const chain of CHAIN_CONFIG) {
  mapKyberswapContractUrl.set(
    chain.chainKey,
    `${mapExplorer.get(chain.chainKey)}/address/${
      MAP_KYBER_ROUTER_ADDRESS_BY_CHAIN[chain.chainKey]
    }`
  );
  mapKyberswapContract.set(
    chain.chainKey,
    MAP_KYBER_ROUTER_ADDRESS_BY_CHAIN[chain.chainKey]
  );
}
