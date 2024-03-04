import { RpcProvider } from "starknet";

import type { DataLoaderOptions, MinimalProviderInterface, MinimalProviderInterface5 } from "./types";
import { ContractBatchProvider } from "./contractBatch/ContractBatchProvider";
import { RpcBatchProvider } from "./rpc/RpcBatchProvider";

export { RpcBatchProvider } from "./rpc/RpcBatchProvider";
export { ContractBatchProvider } from "./contractBatch/ContractBatchProvider";

export type { DataLoaderOptions, MinimalProviderInterface };

export function getBatchProvider(
  provider: MinimalProviderInterface | MinimalProviderInterface5,
  dataloaderOptions?: DataLoaderOptions,
  multicallAddressIfSequencer?: string
): MinimalProviderInterface {
  if ("channel" in provider) {
    const rpcProvider: RpcProvider = provider as unknown as RpcProvider;
    return new RpcBatchProvider({
      nodeUrl: rpcProvider.channel.nodeUrl,
      headers: rpcProvider.channel.headers,
      ...dataloaderOptions,
    });
  }

  if ("baseUrl" in provider) {
    const contractBatchProvider: ContractBatchProvider = provider as unknown as ContractBatchProvider;
    return new ContractBatchProvider(contractBatchProvider, multicallAddressIfSequencer, dataloaderOptions);
  }

  console.warn("[MC] Warning: Provider is not RpcProvider or ContractBatchProvider, fallback to original provider");

  console.warn("[MC] Warning: Provider is not RpcProvider, fallback to original provider");
  return provider as MinimalProviderInterface;
}
