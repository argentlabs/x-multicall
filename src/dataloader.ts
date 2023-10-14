import DataLoader from "dataloader";
import { type Call, CallData, hash, num } from "starknet";

import { aggregate } from "./aggregate";
import type { MinimalProviderInterface } from "./types";

export interface DataLoaderOptions {
  maxBatchSize?: number;
  batchInterval?: number;
}

export const getDataLoader = (
  provider: MinimalProviderInterface,
  multicallAddress: string,
  options: DataLoaderOptions = {
    batchInterval: 500,
    maxBatchSize: 10,
  }
) => {
  const dl = new DataLoader(
    async (calls: readonly Call[]): Promise<(string[] | Error)[]> => {
      dl.clearAll();
      const result = await aggregate(
        provider,
        multicallAddress,
        calls as Call[]
      );
      return result;
    },
    {
      maxBatchSize: options.maxBatchSize,
      batchScheduleFn(callback) {
        setTimeout(callback, options.batchInterval);
      },
      cacheKeyFn(call) {
        const { contractAddress, entrypoint, calldata = [] } = call;
        const cacheKeyContractAddress = num.toHexString(contractAddress);
        const cacheKeyEntrypoint = hash.getSelector(entrypoint);
        const cacheKeyCalldata = CallData.toCalldata(calldata)
          .map((c) => num.toHexString(c))
          .join("-");
        return `${cacheKeyContractAddress}--${cacheKeyEntrypoint}--${cacheKeyCalldata}`;
      },
    }
  );
  return dl;
};
