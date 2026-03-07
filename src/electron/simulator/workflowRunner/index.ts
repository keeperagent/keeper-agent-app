import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import { AptosProvider } from "@/electron/simulator/category/onchain/aptos";
import { SuiProvider } from "@/electron/simulator/category/onchain/sui";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { UniswapMultichain } from "@/electron/simulator/category/onchain/uniswap";
import { PancakeswapMultichain } from "@/electron/simulator/category/onchain/pancakeswap";
import { RandomOnOff } from "@/electron/simulator/category/randomOnOff";
import { EVMContractSnipperManager } from "@/electron/simulator/category/onchain/evmContractSniper";
import { SwapOnCetusManager } from "@/electron/simulator/category/onchain/cetus";
import { KyberswapManager } from "@/electron/simulator/category/onchain/kyberswap";
import { SwapOnJupiterManager } from "@/electron/simulator/category/onchain/jupiter";
import { Pumpfun } from "@/electron/simulator/category/onchain/pumpfun";
import { Bonkfun } from "@/electron/simulator/category/onchain/bonkfun";
import { TelegramSniperManager } from "@/electron/simulator/category/social/telegramSniper";
import { IFlowProfile } from "@/electron/type";
import { ThreadManager } from "./threadManager";

export type WorkflowRunnerArgs = {
  threadManager: ThreadManager;
  evmProvider: EVMProvider;
  aptosProvider: AptosProvider;
  suiProvider: SuiProvider;
  solanaProvider: SolanaProvider;
  uniswapMultichain: UniswapMultichain;
  pancakeswapMultichain: PancakeswapMultichain;
  kyberswapManager: KyberswapManager;
  jupiterManager: SwapOnJupiterManager;
  cetusManager: SwapOnCetusManager;
  randomOnOff: RandomOnOff;
  evmContractSnipperManager: EVMContractSnipperManager;
  telegramSniperManager: TelegramSniperManager;
  pumpfun: Pumpfun;
  bonkfun: Bonkfun;
};

export type NodeHandler = (
  flowProfile: IFlowProfile,
) => Promise<[IFlowProfile | null, Error | null, ...any]>;
