import xlsx from "xlsx";
import { ethers } from "ethers";
import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToSeed,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { Account } from "@aptos-labs/ts-sdk";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Keypair } from "@solana/web3.js";
import { HDKey } from "micro-key-producer/slip10.js";
import { CHAIN_TYPE } from "@/electron/constant";
import { walletDB } from "@/electron/database/wallet";
import { IWallet } from "@/electron/type";
import { exportDataToExcel, logEveryWhere } from "./util";
import { encryptionService } from "./encrypt";

export const WALLET_SHEET_HEADER = {
  ADDRESS: "Address",
  PHRASE: "Phrase",
  PRIVATE_KEY: "Private_Key",
  IS_ENCRYPTED: "Is_Encrypted",
};

const convertWalletDataToExcelData = (
  listWalletData: IWallet[],
  encryptKey?: string,
) => {
  const excelData = [];
  if (listWalletData.length === 0) {
    return [];
  }

  const sheetHeader = [
    WALLET_SHEET_HEADER.ADDRESS,
    WALLET_SHEET_HEADER.PHRASE,
    WALLET_SHEET_HEADER.PRIVATE_KEY,
    WALLET_SHEET_HEADER.IS_ENCRYPTED,
  ];

  // Push column name
  excelData.push(sheetHeader);

  // Iterate through each object in data
  for (const wallet of listWalletData) {
    const row: any[] = [];

    const walletData: any =
      encryptKey && wallet?.isEncrypted
        ? decryptWallet({ ...wallet }, encryptKey)
        : wallet;

    let isEncrypted = "0";
    if (wallet?.isEncrypted && !encryptKey) {
      isEncrypted = "1";
    }
    row.push(walletData?.address);
    row.push(walletData?.phrase);
    row.push(walletData?.privateKey);
    row.push(isEncrypted);

    excelData.push(row);
  }

  return excelData;
};

const importWalletFromFile = async (
  listFilePath: string[],
  walletGroupId: number,
  encryptKey?: string,
): Promise<boolean> => {
  const listWallet: IWallet[] = [];

  listFilePath.forEach((filePath: string) => {
    const workbook = xlsx.readFile(filePath);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const listData = xlsx.utils.sheet_to_json(sheet);
    listData.forEach((data: any) => {
      const phrase = data[WALLET_SHEET_HEADER.PHRASE];
      const address = data[WALLET_SHEET_HEADER.ADDRESS];
      const privateKey = data[WALLET_SHEET_HEADER.PRIVATE_KEY];
      const isEncrypted = data[WALLET_SHEET_HEADER.IS_ENCRYPTED];

      if (phrase || address || privateKey) {
        let wallet: IWallet = {
          phrase,
          address,
          privateKey,
          groupId: walletGroupId,
          index: 0,
          isEncrypted: Number(isEncrypted) === 1,
        };
        if (encryptKey) {
          wallet = encryptWallet(wallet, encryptKey);
        }
        listWallet.push(wallet);
      }
    });
  });

  const err = await walletDB.createBulkWallet(listWallet);
  return !err;
};

const exportWallet = async ({
  groupId,
  folderPath,
  fileName,
  encryptKey,
  listWalletId,
}: {
  groupId: number;
  folderPath: string;
  fileName: string;
  encryptKey?: string;
  listWalletId: number[];
}): Promise<Error | null> => {
  try {
    if (!groupId) {
      return Error("@groupId is empty");
    }
    if (!folderPath) {
      return Error("@folderPath is empty");
    }

    let currentPage = 1;
    const pageSize = 1000;
    let listWallet: IWallet[] = [];

    while (true) {
      const [res] = await walletDB.getListWallet({
        page: currentPage,
        pageSize,
        groupId,
      });

      let listData = res?.data || [];
      if (listData.length === 0) {
        break;
      }

      if (listWalletId?.length > 0) {
        listData = listData?.filter((wallet) =>
          listWalletId?.includes(wallet.id!),
        );
      }
      listWallet = [...listWallet, ...listData];
      if (
        listWalletId?.length > 0 &&
        listWallet?.length === listWalletId?.length
      ) {
        break;
      }

      currentPage += 1;
    }

    const excelWalletData = convertWalletDataToExcelData(
      listWallet,
      encryptKey,
    );

    await exportDataToExcel(excelWalletData, `${folderPath}/${fileName}.xlsx`);
    return null;
  } catch (err: any) {
    logEveryWhere({ message: `exportWallet() error: ${err?.message}` });
    return err;
  }
};

const createRandomWallet = async ({
  batchSize,
  groupId,
  encryptKey,
  chainType,
}: {
  batchSize: number;
  groupId: number;
  encryptKey?: string;
  chainType?: string;
}): Promise<boolean> => {
  const listWallet: IWallet[] = [];

  while (true) {
    let wallet: IWallet = {};
    if (chainType === CHAIN_TYPE.EVM) {
      wallet = createEVMWallet();
    } else if (chainType === CHAIN_TYPE.APTOS) {
      wallet = createAptosWallet();
    } else if (chainType === CHAIN_TYPE.SUI) {
      wallet = createSuiWallet();
    } else if (chainType === CHAIN_TYPE.SOLANA) {
      wallet = await createSolanaWallet();
    }

    wallet = {
      groupId,
      index: 0, // index of derivative path in HD wallet
      ...wallet,
    };

    if (encryptKey) {
      wallet = encryptWallet(wallet, encryptKey);
    }
    listWallet.push(wallet);

    if (listWallet.length === batchSize) {
      break;
    }
  }

  const err = await walletDB.createBulkWallet(listWallet);
  return !err;
};

const createWalletFromPhrase = async ({
  phrase,
  batchSize,
  groupId,
  startIndex,
  encryptKey,
  chainType,
}: {
  phrase: string;
  batchSize: number;
  groupId: number;
  startIndex: number;
  encryptKey?: string;
  chainType?: string;
}): Promise<
  [{ totalWallet: number; duration: number } | null, Error | null]
> => {
  try {
    if (!validateMnemonic(phrase, wordlist)) {
      return [null, Error("Invalid phrase")];
    }

    const startTime = new Date().getTime();
    const listWallet: IWallet[] = [];

    for (let i = 0; i < batchSize; i++) {
      const index = i + startIndex;
      let wallet: IWallet = {};

      if (chainType === CHAIN_TYPE.EVM) {
        wallet = createEVMWalletFromPhrase(phrase, index);
      } else if (chainType === CHAIN_TYPE.APTOS) {
        wallet = createAptosWalletFromPhrase(phrase, index);
      } else if (chainType === CHAIN_TYPE.SUI) {
        wallet = createSuiWalletFromPhrase(phrase, index);
      } else if (chainType === CHAIN_TYPE.SOLANA) {
        wallet = await createSolanaWalletFromPhrase(phrase, index);
      }

      wallet = {
        groupId,
        index,
        ...wallet,
      };
      if (encryptKey) {
        wallet = encryptWallet(wallet, encryptKey);
      }
      listWallet.push(wallet);
    }

    const endTime = new Date().getTime();
    await walletDB.createBulkWallet(listWallet);

    return [
      {
        totalWallet: listWallet.length,
        duration: Math.round((endTime - startTime) / 1000),
      },
      null,
    ];
  } catch (err: any) {
    logEveryWhere({
      message: `createWalletFromPhrase() error: ${err?.message}`,
    });
    return [null, err];
  }
};

const decryptWallet = (wallet: IWallet, encryptKey?: string): IWallet => {
  if (!encryptKey || !wallet?.isEncrypted) {
    return wallet;
  }

  return {
    ...wallet,
    address: wallet?.address
      ? encryptionService.decryptData(wallet?.address, encryptKey)
      : wallet?.address,
    phrase: wallet?.phrase
      ? encryptionService.decryptData(wallet?.phrase, encryptKey)
      : wallet?.phrase,
    privateKey: wallet?.privateKey
      ? encryptionService.decryptData(wallet?.privateKey, encryptKey)
      : wallet?.privateKey,
    isEncrypted: false,
  };
};

const encryptWallet = (wallet: IWallet, encryptKey?: string): IWallet => {
  if (!encryptKey) {
    return { ...wallet, isEncrypted: false };
  }

  return {
    ...wallet,
    address: wallet?.address
      ? encryptionService.encryptData(wallet?.address, encryptKey)
      : wallet?.address,
    phrase: wallet?.phrase
      ? encryptionService.encryptData(wallet?.phrase, encryptKey)
      : wallet?.phrase,
    privateKey: wallet?.privateKey
      ? encryptionService.encryptData(wallet?.privateKey, encryptKey)
      : wallet?.privateKey,
    isEncrypted: true,
  };
};

const createEVMWallet = (): IWallet => {
  const account = ethers.Wallet.createRandom();
  return {
    phrase: account?.mnemonic?.phrase!,
    address: account?.address?.toLowerCase(),
    privateKey: account?.privateKey.toString(),
  };
};

const createEVMWalletFromPhrase = (phrase: string, index: number): IWallet => {
  const path = `m/44'/60'/0'/0/${index}`;
  const account = ethers.Wallet.fromMnemonic(phrase, path);
  return {
    phrase: account?.mnemonic?.phrase!,
    address: account?.address?.toLowerCase(),
    privateKey: account?.privateKey.toString(),
  };
};

const createAptosWalletFromPhrase = (
  phrase: string,
  index: number,
): IWallet => {
  const path = `m/44'/637'/0'/0'/${index}'`;

  const newAccount = Account.fromDerivationPath({
    path,
    mnemonic: phrase,
  });

  return {
    phrase,
    address: newAccount.accountAddress.toString(),
    privateKey: newAccount.privateKey.toString(),
  };
};

const createAptosWallet = (): IWallet => {
  const phrase = generateMnemonic(wordlist);
  const path = `m/44'/637'/0'/0'/0'`;

  const newAccount = Account.fromDerivationPath({
    path,
    mnemonic: phrase,
  });

  return {
    phrase,
    address: newAccount.accountAddress.toString(),
    privateKey: newAccount.privateKey.toString(),
  };
};

const createSuiWallet = (): IWallet => {
  const phrase = generateMnemonic(wordlist);
  const path = `m/44'/784'/0'/0'/0'`;

  const newAccount = Ed25519Keypair.deriveKeypair(phrase, path);
  return {
    phrase,
    address: newAccount.toSuiAddress(),
    privateKey: newAccount.getSecretKey(),
  };
};

const createSuiWalletFromPhrase = (phrase: string, index: number): IWallet => {
  const path = `m/44'/784'/0'/0'/${index}'`;

  const newAccount = Ed25519Keypair.deriveKeypair(phrase, path);
  return {
    phrase,
    address: newAccount.toSuiAddress(),
    privateKey: newAccount.getSecretKey(),
  };
};

const createSolanaWallet = async (): Promise<IWallet> => {
  const phrase = generateMnemonic(wordlist);
  const wallet = await createSolanaWalletFromPhrase(phrase, 0);
  return wallet;
};

const createSolanaWalletFromPhrase = async (
  phrase: string,
  index: number,
): Promise<IWallet> => {
  const seed = await mnemonicToSeed(phrase, "");
  const path = `m/44'/501'/${index}'/0'`;
  const hdkey = HDKey.fromMasterSeed(seed);
  const keypair = Keypair.fromSeed(hdkey.derive(path).privateKey);
  return {
    phrase,
    address: keypair.publicKey.toBase58(),
    privateKey: Buffer.from(keypair.secretKey).toString("hex"),
  };
};

export {
  importWalletFromFile,
  exportWallet,
  createRandomWallet,
  createWalletFromPhrase,
  decryptWallet,
  encryptWallet,
};
