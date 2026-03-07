import solImg from "@/asset/chain/sol.svg";
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
import { KYBERSWAP_CHAIN_KEY } from "@/electron/constant";

type IChainDetail = {
  chainName: string;
  logo: string;
  dexscreenerKey: string;
  kyberwapKey: string;
  chainId: number;
  isEvm: boolean;
  isSolana: boolean;
};

export const listChainConfig: IChainDetail[] = [
  {
    chainName: "Solana",
    logo: solImg,
    dexscreenerKey: "solana",
    kyberwapKey: "",
    chainId: 0,
    isEvm: false,
    isSolana: true,
  },
  {
    chainName: "Ethereum",
    logo: ethImg,
    dexscreenerKey: "ethereum",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.ETHEREUM,
    chainId: 1,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "BNB",
    logo: bnbImg,
    dexscreenerKey: "bsc",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.BSC,
    chainId: 56,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Base",
    logo: baseImg,
    dexscreenerKey: "base",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.BASE,
    chainId: 8453,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Arbitrum",
    logo: arbitrumImg,
    dexscreenerKey: "arbitrum",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.ARBITRUM,
    chainId: 42161,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Polygon",
    logo: polygonImg,
    dexscreenerKey: "polygon",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.POLYGON,
    chainId: 137,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Optimism",
    logo: optimismImg,
    dexscreenerKey: "optimism",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.OPTIMISM,
    chainId: 10,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Avalanche",
    logo: avaxImg,
    dexscreenerKey: "avalanche",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.AVALANCHE,
    chainId: 43114,
    isEvm: true,
    isSolana: false,
  },

  {
    chainName: "ZkSync",
    logo: zksyncImg,
    dexscreenerKey: "zksync",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.ZKSYNC,
    chainId: 324,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Linea",
    logo: lineaImg,
    dexscreenerKey: "linea",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.LINEA,
    chainId: 59144,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Scroll",
    logo: scrollImg,
    dexscreenerKey: "scroll",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.SCROLL,
    chainId: 534352,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Mantle",
    logo: mantleImg,
    dexscreenerKey: "mantle",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.MANTLE,
    chainId: 5000,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Blast",
    logo: blastImg,
    dexscreenerKey: "blast",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.BLAST,
    chainId: 81457,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Sonic",
    logo: sonicImg,
    dexscreenerKey: "sonic",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.SONIC,
    chainId: 146,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Unichain",
    logo: unichainImg,
    dexscreenerKey: "unichain",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.UNICHAIN,
    chainId: 130,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Berachain",
    logo: berachainImg,
    dexscreenerKey: "berachain",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.BERACHAIN,
    chainId: 80094,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Ronin",
    logo: roninImg,
    dexscreenerKey: "ronin",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.RONIN,
    chainId: 2020,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Monad",
    logo: monadImg,
    dexscreenerKey: "monad",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.MONAD,
    chainId: 143,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "Plasma",
    logo: plasmaImg,
    dexscreenerKey: "plasma",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.PLASMA,
    chainId: 9745,
    isEvm: true,
    isSolana: false,
  },
  {
    chainName: "HyperEVM",
    logo: hyperevmImg,
    dexscreenerKey: "hyperevm",
    kyberwapKey: KYBERSWAP_CHAIN_KEY.HYPEREVM,
    chainId: 999,
    isEvm: true,
    isSolana: false,
  },
];
