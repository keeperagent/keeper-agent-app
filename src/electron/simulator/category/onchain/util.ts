import _ from "lodash";
import { ethers } from "ethers";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export const convertArgsToAbiTypesEVM = (
  methodName: string,
  args: string[],
  abi: any[],
): [any[] | null, Error | null] => {
  // Find the method ABI
  const methodAbi = abi?.find(
    (item) => item?.type === "function" && item?.name === methodName,
  );
  if (!methodAbi) {
    return [null, Error(`Method ${methodName} not found in ABI`)];
  }

  // Convert arguments to appropriate types
  const listResult: any[] = [];
  for (let i = 0; i < methodAbi?.inputs?.length; i++) {
    const input = methodAbi?.inputs?.[i];
    const arg = args?.[i];
    const [result, err] = convertSingleArgToAbiType(input?.type, arg);
    if (err) {
      return [null, err];
    }

    listResult.push(result);
  }

  return [listResult, null];
};

const convertSingleArgToAbiType = (
  type: string,
  arg: string,
): [any | null, Error | null] => {
  if (type === "address" && typeof arg === "string") {
    if (!ethers.utils.isAddress(arg)) {
      return [null, Error(`Invalid address: ${arg}`)];
    }
    return [arg, null];
  } else if (
    ["uint8", "uint16", "uint32", "uint64", "uint128", "uint256"]?.includes(
      type,
    ) &&
    typeof arg === "string"
  ) {
    return [ethers.utils.parseUnits(arg, 0), null]; // Assumes input is in string format representing an integer
  } else if (type?.endsWith("[]")) {
    const elementType = type.slice(0, -2);
    const arrayArg = JSON.parse(arg);
    if (!_.isArray(arrayArg)) {
      return [null, Error(`Input must be [${arg}], not ${arg}`)];
    }

    const listResult = [];
    for (let i = 0; i < arrayArg?.length; i++) {
      const element = arrayArg?.[i];
      const [result, err] = convertSingleArgToAbiType(
        elementType,
        element?.toString(),
      );
      if (err) {
        return [null, err];
      }

      listResult.push(result);
    }

    return [listResult, null];
  } else if (type === "bool") {
    return [arg === "true", null];
  } else if (type === "string") {
    return [arg, null];
  }

  return [null, Error(`Unsupported type ${type} with parameter ${arg}`)];
};

export const sendSolanaTransactionWithRetry = async (
  provider: Connection,
  transactionBinary: Uint8Array,
  signature: string,
  blockhash: string,
  lastValidBlockHeight: number,
): Promise<Error | null> => {
  let confirmed = false;
  let confirmationErr: Error | null = null;

  const confirmationPromise = provider
    .confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    )
    .then((result) => {
      confirmed = true;
      if (result.value.err) {
        confirmationErr = Error(result.value.err.toString());
      }
    })
    .catch((err: any) => {
      confirmationErr = err;
    });

  let blockHeight = await provider.getBlockHeight("confirmed");
  while (!confirmed && blockHeight <= lastValidBlockHeight) {
    provider
      .sendRawTransaction(transactionBinary, {
        maxRetries: 0,
        skipPreflight: true,
      })
      .catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 500));
    blockHeight = await provider.getBlockHeight("confirmed");
  }

  if (!confirmed) {
    await Promise.race([
      confirmationPromise,
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
  }

  if (!confirmed) {
    return Error("Transaction expired — blockhash no longer valid");
  }

  return confirmationErr;
};

export const getKeypairFromPrivateKey = (
  privateKey: string,
): [Keypair | null, Error | null] => {
  try {
    const normalizedKey = (privateKey || "").trim();

    // Attempt JSON array: "[1,2,3]" or comma separated "1,2,3"
    if (
      (normalizedKey.startsWith("[") && normalizedKey.endsWith("]")) ||
      normalizedKey.includes(",")
    ) {
      const keyArray = JSON.parse(
        normalizedKey.startsWith("[") ? normalizedKey : `[${normalizedKey}]`,
      );
      if (Array.isArray(keyArray) && keyArray.length > 0) {
        return [Keypair.fromSecretKey(Uint8Array.from(keyArray)), null];
      }
    }

    // Attempt hex string
    const isHex = /^[0-9a-fA-F]+$/.test(normalizedKey);
    if (isHex && normalizedKey.length >= 64) {
      const bytes = Uint8Array.from(Buffer.from(normalizedKey, "hex"));
      return [Keypair.fromSecretKey(bytes), null];
    }

    // Attempt base58 (default Solana export)
    try {
      const bytes = bs58.decode(normalizedKey);
      if (bytes?.length) {
        return [Keypair.fromSecretKey(bytes), null];
      }
    } catch {}

    // Attempt base64
    try {
      const bytes = Uint8Array.from(Buffer.from(normalizedKey, "base64"));
      if (bytes?.length) {
        return [Keypair.fromSecretKey(bytes), null];
      }
    } catch {}

    return [null, Error("Invalid Solana private key format")];
  } catch (err: any) {
    return [null, Error(err?.message || "Invalid Solana private key format")];
  }
};
