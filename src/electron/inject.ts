import { IProxyProvider } from "./proxy";
import { BaseBrowser } from "./simulator/workflowRunner/baseBrowser";
import { Executor } from "./simulator/workflow/executor";
import { Telegram } from "./simulator/category/social/telegram";
import { RandomOnOff } from "./simulator/category/randomOnOff";
import { StopSignal } from "./simulator/stopSignal";
import { ProxyProvider } from "./proxy/proxyProvider";
import { DecodoProxyClient } from "./proxy/decodoProxyClient";
import { BrightDataProxyClient } from "./proxy/brightDataProxyClient";
import { PROXY_SERVICE_TYPE } from "./constant";
import { EVMProvider } from "./simulator/category/onchain/evm";
import { AptosProvider } from "./simulator/category/onchain/aptos";
import { SuiProvider } from "./simulator/category/onchain/sui";
import { SolanaProvider } from "./simulator/category/onchain/solana";
import { UniswapMultichain } from "./simulator/category/onchain/uniswap";
import { PancakeswapMultichain } from "./simulator/category/onchain/pancakeswap";
import { ThreadManager } from "./simulator/workflowRunner/threadManager";
import { EVMContractSnipperManager } from "./simulator/category/onchain/evmContractSniper";
import { SwapOnCetusManager } from "./simulator/category/onchain/cetus";
import { PriceCheckingManager } from "./simulator/category/pricing/priceChecking";
import { MarketcapCheckingManager } from "./simulator/category/pricing/marketcapChecking";
import { KyberswapManager } from "./simulator/category/onchain/kyberswap";
import { SwapOnJupiterManager } from "./simulator/category/onchain/jupiter";
import { Pumpfun } from "./simulator/category/onchain/pumpfun";
import { Bonkfun } from "./simulator/category/onchain/bonkfun";
import { SolanaVanityAddressManager } from "./simulator/category/onchain/vanityAddress/solanaVanityAddress";
import { TelegramSniperManager } from "./simulator/category/social/telegramSniper";

let stopSignal: StopSignal | null = null;
const getStopSignal = (): StopSignal => {
  if (stopSignal) {
    return stopSignal;
  }

  stopSignal = new StopSignal();
  return stopSignal;
};

let decodoProxyProvider: IProxyProvider | null = null;
const getDecodoProxyProvider = (): IProxyProvider => {
  if (decodoProxyProvider) {
    return decodoProxyProvider;
  }
  const decodoClient = new DecodoProxyClient();
  const stopSignal = getStopSignal();
  decodoProxyProvider = new ProxyProvider(
    decodoClient,
    "Decodo",
    PROXY_SERVICE_TYPE.DECODO,
    stopSignal,
  );
  return decodoProxyProvider;
};

let brightDataProxyProvider: IProxyProvider | null = null;
const getBrightDataProxyProvider = (): IProxyProvider => {
  if (brightDataProxyProvider) {
    return brightDataProxyProvider;
  }
  const brightDataClient = new BrightDataProxyClient();
  const stopSignal = getStopSignal();
  brightDataProxyProvider = new ProxyProvider(
    brightDataClient,
    "Bright Data",
    PROXY_SERVICE_TYPE.BRIGHTDATA,
    stopSignal,
  );
  return brightDataProxyProvider;
};

const getProxyProvider = (serviceType: string): IProxyProvider => {
  if (serviceType === PROXY_SERVICE_TYPE.DECODO) {
    return getDecodoProxyProvider();
  }
  if (serviceType === PROXY_SERVICE_TYPE.BRIGHTDATA) {
    return getBrightDataProxyProvider();
  }
  throw new Error(`Unknown proxy service type: ${serviceType}`);
};

let baseBrowser: BaseBrowser | null = null;
const getBaseBrowser = (): BaseBrowser => {
  if (baseBrowser !== null) {
    return baseBrowser;
  }

  const decodoProxyProvider = getDecodoProxyProvider();
  const brightDataProxyProvider = getBrightDataProxyProvider();
  const stopSignal = getStopSignal();
  baseBrowser = new BaseBrowser(
    decodoProxyProvider,
    brightDataProxyProvider,
    stopSignal,
  );

  return baseBrowser;
};

let telegram: Telegram | null = null;
const getTelegram = (): Telegram => {
  if (telegram !== null) {
    return telegram;
  }

  telegram = new Telegram();
  return telegram;
};

let contractSniperManager: EVMContractSnipperManager | null = null;
const getContractSniperManager = () => {
  if (contractSniperManager !== null) {
    return contractSniperManager;
  }

  contractSniperManager = new EVMContractSnipperManager();
  return contractSniperManager;
};

let telegramSniperManager: TelegramSniperManager | null = null;
const getTelegramSniperManager = (): TelegramSniperManager => {
  if (telegramSniperManager !== null) {
    return telegramSniperManager;
  }

  telegramSniperManager = new TelegramSniperManager();
  return telegramSniperManager;
};

const getNewThreadManager = (): ThreadManager => {
  const decodoProxyProvider = getDecodoProxyProvider();
  const brightDataProxyProvider = getBrightDataProxyProvider();
  const stopSignal = getStopSignal();
  const baseBrowser = getBaseBrowser();
  const threadManager = new ThreadManager({
    baseBrowser,
    decodoProxyProvider,
    brightDataProxyProvider,
    stopSignal,
    evmContractSnipperManager: getContractSniperManager(),
    solanaVanityAddressManager: getSolanaVanityAddressManager(),
    telegramSniperManager: getTelegramSniperManager(),
  });
  return threadManager;
};

let evmProvider: EVMProvider | null = null;
const getEVMProvider = (): EVMProvider => {
  if (evmProvider !== null) {
    return evmProvider;
  }
  evmProvider = new EVMProvider();
  return evmProvider;
};

let aptosProvider: AptosProvider | null = null;
const getAptosProvider = (): AptosProvider => {
  if (aptosProvider !== null) {
    return aptosProvider;
  }
  aptosProvider = new AptosProvider();
  return aptosProvider;
};

let suiProvider: SuiProvider | null = null;
const getSuiProvider = (): SuiProvider => {
  if (suiProvider !== null) {
    return suiProvider;
  }

  suiProvider = new SuiProvider();
  return suiProvider;
};

let solanaProvider: SolanaProvider | null = null;
const getSolanaProvider = (): SolanaProvider => {
  if (solanaProvider !== null) {
    return solanaProvider;
  }
  solanaProvider = new SolanaProvider();
  return solanaProvider;
};

const getNewExecutor = (): Executor => {
  const evmProvider = getEVMProvider();
  const aptosProvider = getAptosProvider();
  const suiProvider = getSuiProvider();
  const solanaProvider = getSolanaProvider();
  const uniswapMultichain = new UniswapMultichain();
  const pancakeswapMultichain = new PancakeswapMultichain();
  const kyberswapManager = new KyberswapManager();

  const jupiterManager = new SwapOnJupiterManager();
  const cetusManager = new SwapOnCetusManager();
  const threadManager = getNewThreadManager();
  const pumpfun = new Pumpfun();
  const bonkfun = new Bonkfun();

  const executor = new Executor({
    threadManager,
    evmProvider,
    aptosProvider,
    suiProvider,
    solanaProvider,
    uniswapMultichain,
    pancakeswapMultichain,
    kyberswapManager,

    jupiterManager,
    cetusManager,
    randomOnOff: new RandomOnOff(),
    evmContractSnipperManager: getContractSniperManager(),
    telegramSniperManager: getTelegramSniperManager(),
    pumpfun,
    bonkfun,
  });
  return executor;
};

let priceCheckingManager: PriceCheckingManager | null = null;
const getPriceCheckingManager = (): PriceCheckingManager => {
  if (priceCheckingManager !== null) {
    return priceCheckingManager;
  }

  priceCheckingManager = new PriceCheckingManager();
  return priceCheckingManager;
};

let marketcapCheckingManager: MarketcapCheckingManager | null = null;
const getMarketcapCheckingManager = (): MarketcapCheckingManager => {
  if (marketcapCheckingManager !== null) {
    return marketcapCheckingManager;
  }

  marketcapCheckingManager = new MarketcapCheckingManager();
  return marketcapCheckingManager;
};

let solanaVanityAddressManager: SolanaVanityAddressManager | null = null;
const getSolanaVanityAddressManager = (): SolanaVanityAddressManager => {
  if (solanaVanityAddressManager !== null) {
    return solanaVanityAddressManager;
  }

  solanaVanityAddressManager = new SolanaVanityAddressManager();
  return solanaVanityAddressManager;
};

export {
  getNewExecutor,
  getDecodoProxyProvider,
  getProxyProvider,
  getBaseBrowser,
  getTelegram,
  getNewThreadManager,
  getContractSniperManager,
  getSuiProvider,
  getPriceCheckingManager,
  getMarketcapCheckingManager,
  getSolanaProvider,
  getSolanaVanityAddressManager,
};
