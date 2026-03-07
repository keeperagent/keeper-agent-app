import { ethers } from "ethers";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { Connection } from "@solana/web3.js";
import { SuiClient } from "@mysten/sui/client";
import { sendWithTimeout } from "@/electron/simulator/util";
import { CHAIN_TYPE } from "@/electron/constant";
import { logEveryWhere } from "./util";

// Check the status of the node provider
const checkNodeEndpointStatus = async (
  nodeEndpoint: string,
  chainType: string
): Promise<boolean> => {
  if (chainType === CHAIN_TYPE.EVM) {
    return await checkEVMNodeEndpointStatus(nodeEndpoint);
  } else if (chainType === CHAIN_TYPE.SOLANA) {
    return await checkSolanaNodeEndpointStatus(nodeEndpoint);
  } else if (chainType === CHAIN_TYPE.APTOS) {
    return await checkAptosNodeEndpointStatus(nodeEndpoint);
  } else if (chainType === CHAIN_TYPE.SUI) {
    return await checkSuiNodeEndpointStatus(nodeEndpoint);
  }

  return false;
};

const checkEVMNodeEndpointStatus = async (
  nodeEndpoint: string
): Promise<boolean> => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(nodeEndpoint);
    const resultPromise = provider.getNetwork();
    await sendWithTimeout(resultPromise, 5000);
    return true;
  } catch (error: any) {
    logEveryWhere({ message: `checkNodeEndpointStatus() error: ${error?.message}` });
    return false;
  }
};

const checkAptosNodeEndpointStatus = async (
  nodeEndpoint: string
): Promise<boolean> => {
  try {
    const config = new AptosConfig({
      fullnode: nodeEndpoint,
      network: Network.MAINNET,
    });

    const provider = new Aptos(config);
    const resultPromise = provider.getLedgerInfo();
    await sendWithTimeout(resultPromise, 5000);
    return true;
  } catch (error: any) {
    logEveryWhere({ message: `checkAptosNodeEndpointStatus() error: ${error?.message}` });
    return false;
  }
};

const checkSuiNodeEndpointStatus = async (
  nodeEndpoint: string
): Promise<boolean> => {
  try {
    const provider = new SuiClient({
      url: nodeEndpoint,
    });
    const resultPromise = provider.getTotalTransactionBlocks();
    await sendWithTimeout(resultPromise, 5000);
    return true;
  } catch (error: any) {
    logEveryWhere({ message: `checkSuiNodeEndpointStatus() error: ${error?.message}` });
    return false;
  }
};

const checkSolanaNodeEndpointStatus = async (
  nodeEndpoint: string
): Promise<boolean> => {
  try {
    const provider = new Connection(nodeEndpoint);
    const resultPromise = provider.getSlot();
    await sendWithTimeout(resultPromise, 5000);
    return true;
  } catch (error: any) {
    logEveryWhere({ message: `checkSolanaNodeEndpointStatus() error: ${error?.message}` });
    return false;
  }
};

export { checkNodeEndpointStatus };
