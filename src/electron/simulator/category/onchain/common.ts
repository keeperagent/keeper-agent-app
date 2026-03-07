import { IStructuredLogPayload, ISwapEVMInput } from "@/electron/type";

export interface ISwapOnEVM {
  swapLikeBuyBot(
    input: ISwapEVMInput,
    privateKey: string,
    numberOfTransaction: number,
    timeout: number,
    logInfo: IStructuredLogPayload
  ): Promise<Error | null>;
  swapNormal(
    input: ISwapEVMInput,
    privateKey: string,
    timeout: number,
    logInfo: IStructuredLogPayload
  ): Promise<[string | null, Error | null]>;
}
