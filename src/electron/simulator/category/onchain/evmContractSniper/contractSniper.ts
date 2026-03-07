import { ethers } from "ethers";
import AsyncLock from "async-lock";
import { logEveryWhere, sleep } from "@/electron/service/util";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import { sendWithTimeout } from "@/electron/simulator/util";
import { ISnipeContractInput, ISnipeContractResult } from "@/electron/type";
import {
  SNIPE_CONTRACT_CONTRACT_ADDRESS,
  SNIPE_CONTRACT_TX_HASH,
  SNIPE_CONTRACT_LOG_INDEX,
  SNIPE_CONTRACT_BLOCK_NUMBER,
  CONTRACT_SNIPER_MODE,
} from "@/electron/constant";

const NODE_TIMEOUT = 10000; // 30s;

// @ContractSniper extract Event and push to @results, other service will read result from @results
class ContractSniper {
  private results: ISnipeContractResult[];
  private evmProvider: EVMProvider;
  private latestBlock: number;
  private currentBlock: number;
  private fromBlock: number;
  private toBlock: number;
  private confirmationBlock: number;
  private contractAddress: string;
  private eventAbi: string;
  private listNodeEndpoint: string[];
  private profileMode: CONTRACT_SNIPER_MODE;
  private blockStep: number;
  private blockTime: number;
  private listVariable: string[];
  private shouldStop: boolean;
  isRunning: boolean;

  private lock: AsyncLock;
  private lockKey: string;

  constructor(input: ISnipeContractInput) {
    this.results = [];
    this.evmProvider = new EVMProvider();
    this.latestBlock = 0;
    this.currentBlock = 0;
    this.contractAddress = input.contractAddress;
    this.eventAbi = input.eventAbi;
    this.listNodeEndpoint = input.listNodeEndpoint;
    this.profileMode = input.profileMode;
    this.fromBlock = input.fromBlock || 0;
    this.toBlock = input.toBlock || 0;
    this.blockStep = input.blockStep || 1;
    this.confirmationBlock = input.confirmationBlock || 1;
    this.blockTime = 0;
    this.listVariable = input.listVariable;
    this.shouldStop = false;
    this.isRunning = false;
    this.lock = new AsyncLock();
    this.lockKey = "ContractSniper";
  }

  // clear 1 old event
  clearOldestEvent = async () => {
    await this.lock.acquire(this.lockKey, () => {
      if (this.profileMode === CONTRACT_SNIPER_MODE.ONE_EVENT_ALL_PROFILE) {
        const removedOldResult = this.results.shift();
        logEveryWhere({
          message: `Contract sniper removedOldResult: ${JSON.stringify(removedOldResult)}`,
        });
      }
    });
  };

  getSampleResult = (size: number): [ISnipeContractResult[], number] => {
    const totalData = this.results?.length;
    if (totalData <= size) {
      return [this.results, totalData];
    }

    return [this.results.slice(totalData - size), totalData];
  };

  getOldestResult = async (): Promise<ISnipeContractResult | null> => {
    return await this.lock.acquire(this.lockKey, () => {
      if (this.results?.length === 0) {
        return null;
      }

      if (this.profileMode === CONTRACT_SNIPER_MODE.ONE_EVENT_ONE_PROFILE) {
        const oldestEvent = this.results.shift();
        return oldestEvent || null;
      }
      return this.results[0];
    });
  };

  start = async () => {
    this.isRunning = true;
    this.shouldStop = false;
    this.cronLastestBlock();

    this.currentBlock = this.fromBlock;
    while (!this.shouldStop) {
      const blockTime = await this.getBlockTime();
      const waitTime = (blockTime / 3) * 1000;
      if (this.latestBlock === null) {
        this.latestBlock = await this.getLastestBlockNumber();
      }
      if (this.currentBlock === 0) {
        this.currentBlock = this.latestBlock;
      }

      const maxBlockNumber = this.latestBlock - this.confirmationBlock;
      if (this.currentBlock >= maxBlockNumber) {
        await sleep(waitTime);
        continue;
      }

      let toBlock = this.currentBlock + this.blockStep;
      if (!this.shouldCatchUpLatestBlock() && toBlock > this.toBlock) {
        toBlock = this.toBlock;
      }

      if (toBlock > maxBlockNumber) {
        toBlock = maxBlockNumber;
        await sleep(waitTime);
      }

      await this.monitorBlock(this.currentBlock, toBlock);
      if (!this.shouldCatchUpLatestBlock() && toBlock === this.toBlock) {
        break;
      }
      this.currentBlock = toBlock + 1;
    }
    this.isRunning = false;
  };

  stop = () => {
    logEveryWhere({ message: "Contract sniper stopped" });
    this.isRunning = false;
    this.shouldStop = true;
    this.results = [];
  };

  private getBlockTime = async (): Promise<number> => {
    while (!this.shouldStop) {
      try {
        if (this.blockTime !== 0) {
          return this.blockTime;
        }

        const [provider] = this.evmProvider.getNextProvider(
          this.listNodeEndpoint,
        );
        if (!provider) {
          continue;
        }

        const latestBlockNumber = await provider.getBlockNumber();
        const latestBlock = await provider.getBlock(latestBlockNumber);

        const batchSize = 100;
        const previousBlock = await provider.getBlock(
          latestBlockNumber - batchSize,
        );
        const timeDifference = latestBlock.timestamp - previousBlock.timestamp;
        const estimatedBlockTime = timeDifference / batchSize;
        this.blockTime = estimatedBlockTime;
        break;
      } catch (err: any) {
        logEveryWhere({ message: `getBlockTime() error: ${err?.message}` });
        await sleep(100);
      }
    }

    return this.blockTime;
  };

  private shouldCatchUpLatestBlock(): boolean {
    return this.toBlock === 0;
  }

  private getLastestBlockNumber = async (): Promise<number> => {
    let blockNumber = 0;

    while (!this.shouldStop) {
      try {
        const [provider] = this.evmProvider.getNextProvider(
          this.listNodeEndpoint,
        );
        if (!provider) {
          continue;
        }
        const blockNumberPromise = provider.getBlockNumber();
        blockNumber = await sendWithTimeout(blockNumberPromise, NODE_TIMEOUT);
        break;
      } catch (err: any) {
        logEveryWhere({ message: `getLatestBlockNumber() error: ${err?.message}` });
        await sleep(100);
      }
    }

    return blockNumber;
  };

  private cronLastestBlock = async () => {
    while (!this.shouldStop) {
      this.latestBlock = await this.getLastestBlockNumber();
      if (!this.latestBlock) {
        continue;
      }

      const blockTime = await this.getBlockTime();
      await sleep((blockTime / 3) * 1000);
    }
  };

  private monitorBlock = async (
    fromBlock: number,
    toBlock: number,
  ): Promise<Error | null> => {
    try {
      const [provider, , errProvider] = this.evmProvider.getNextProvider(
        this.listNodeEndpoint,
      );
      if (!provider) {
        return Error("can not get provider " + errProvider?.message);
      }

      const topicHash = this.getTopicHash(this.eventAbi);
      let filter: ethers.providers.Filter = {
        fromBlock: fromBlock,
        toBlock: toBlock,
        topics: [topicHash],
      };
      if (this.contractAddress !== "") {
        filter = {
          ...filter,
          address: this.contractAddress,
        };
      }

      const listLogs = await provider.getLogs(filter);
      const iface = new ethers.utils.Interface([this.eventAbi]);
      const events = listLogs?.map((log) => ({
        detail: iface.parseLog(log),
        txHash: log.transactionHash,
        contractAddress: log.address?.toLowerCase(),
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
      }));
      logEveryWhere({
        message: `Monitor fromBlock ${fromBlock}, toBlock ${toBlock}, contract: ${this.contractAddress}, total event: ${events?.length}`,
      });

      events.forEach((event) => {
        const result: any = {};
        this.listVariable?.forEach((variable, index) => {
          result[variable] = event?.detail?.args?.[index]?.toString();
        });
        result[SNIPE_CONTRACT_BLOCK_NUMBER] = event.blockNumber;
        result[SNIPE_CONTRACT_TX_HASH] = event.txHash;
        result[SNIPE_CONTRACT_LOG_INDEX] = event.logIndex;
        result[SNIPE_CONTRACT_CONTRACT_ADDRESS] = event?.contractAddress;

        this.results.push(result);
      });

      return null;
    } catch (err: any) {
      logEveryWhere({ message: `monitorBlocks() error: ${err?.message}` });
      return err;
    }
  };

  private getTopicHash = (eventAbi: string): string => {
    let [eventName, paramsString] = eventAbi.split(/\(|\)/);
    eventName = eventName?.replace("event", "")?.trim();

    // Split parameters and process each one to get datatype of each parameter
    const params = paramsString.split(",").map((param) => {
      const parts = param.trim().split(/\s+/);

      // for example: "address from" => "address"
      return parts[0];
    });

    // Construct the signature
    const eventSignature = `${eventName}(${params.join(",")})`;
    const topicHash = ethers.utils.id(eventSignature);
    return topicHash;
  };
}

export { ContractSniper };
